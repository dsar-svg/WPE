-- ============================================================
-- Blindaje del acceso anónimo + corte de caja con arqueo
-- El POS corre con la clave anon (pública). Desde aquí ya no escribe
-- tablas directo: inicia sesión con PIN y cobra/corta vía RPCs con token.
-- El panel admin escribe solo si el usuario es staff (is_staff()).
-- ============================================================

-- 1. COLUMNAS NUEVAS
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric,
  ADD COLUMN IF NOT EXISTS change_currency text CHECK (change_currency IN ('USD', 'BS')),
  ADD COLUMN IF NOT EXISTS corte_id uuid REFERENCES public.cortes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_sin_corte ON public.orders(cashier_id, location_id)
  WHERE corte_id IS NULL AND status = 'exitoso';
CREATE INDEX IF NOT EXISTS idx_orders_corte ON public.orders(corte_id);

ALTER TABLE public.cortes
  ADD COLUMN IF NOT EXISTS exchange_rate numeric,
  ADD COLUMN IF NOT EXISTS counted_efectivo_usd numeric,
  ADD COLUMN IF NOT EXISTS counted_efectivo_bs numeric,
  ADD COLUMN IF NOT EXISTS counted_tarjeta_bs numeric,
  ADD COLUMN IF NOT EXISTS counted_pagomovil_bs numeric;

-- PINs: hash para los que solo tenían texto plano, y un PIN por persona
UPDATE public.admins SET pin_hash = encode(extensions.digest(pin, 'sha256'), 'hex')
  WHERE pin_hash IS NULL AND coalesce(pin, '') <> '';
CREATE UNIQUE INDEX IF NOT EXISTS admins_pin_hash_unique ON public.admins(pin_hash) WHERE pin_hash IS NOT NULL;

-- 2. SESIONES DE CAJA (sin policies: solo accesibles desde las funciones)
CREATE TABLE IF NOT EXISTS public.pos_sessions (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '16 hours'
);
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.pos_login_attempts (
  id bigserial PRIMARY KEY,
  ip text NOT NULL DEFAULT '',
  ok boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pos_login_attempts ON public.pos_login_attempts(ip, created_at);
ALTER TABLE public.pos_login_attempts ENABLE ROW LEVEL SECURITY;

-- 3. HELPERS
CREATE OR REPLACE FUNCTION public.is_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins a
    JOIN auth.users u ON lower(u.email) = lower(a.email)
    WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
      AND a.role IN ('super_admin', 'location_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.pos_session_cashier(p_token uuid) RETURNS public.admins
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.admins;
BEGIN
  SELECT ad.* INTO a FROM public.pos_sessions s JOIN public.admins ad ON ad.id = s.cashier_id
  WHERE s.token = p_token AND s.expires_at > now();
  IF a.id IS NULL THEN RAISE EXCEPTION 'Sesión de caja vencida. Ingresa tu PIN de nuevo.'; END IF;
  IF a.location_id IS NULL THEN RAISE EXCEPTION 'Esta cajera no tiene sede asignada.'; END IF;
  RETURN a;
END $$;

CREATE OR REPLACE FUNCTION public.pos_cashier_json(a public.admins, p_token uuid) RETURNS json
LANGUAGE sql IMMUTABLE AS $$
  SELECT json_build_object('token', p_token, 'id', a.id, 'name', coalesce(a.name, a.email), 'email', a.email,
                           'employee_id', a.employee_id, 'location_id', a.location_id);
$$;

-- 4. LOGIN / SESIÓN
CREATE OR REPLACE FUNCTION public.pos_login(p_pin text) RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_headers json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_ip text := split_part(coalesce(v_headers->>'cf-connecting-ip', v_headers->>'x-forwarded-for', ''), ',', 1);
  a public.admins;
  v_token uuid;
BEGIN
  IF (SELECT count(*) FROM public.pos_login_attempts
      WHERE NOT ok AND ip = v_ip AND created_at > now() - interval '10 minutes') >= 10 THEN
    RAISE EXCEPTION 'Demasiados intentos fallidos. Espera 10 minutos.';
  END IF;
  IF coalesce(p_pin, '') !~ '^\d{4}$' THEN RAISE EXCEPTION 'PIN inválido'; END IF;

  SELECT * INTO a FROM public.admins WHERE pin_hash = encode(digest(p_pin, 'sha256'), 'hex');
  INSERT INTO public.pos_login_attempts(ip, ok) VALUES (v_ip, a.id IS NOT NULL);
  DELETE FROM public.pos_login_attempts WHERE created_at < now() - interval '1 day';
  IF a.id IS NULL THEN RETURN NULL; END IF;

  DELETE FROM public.pos_sessions WHERE expires_at < now();
  INSERT INTO public.pos_sessions(cashier_id) VALUES (a.id) RETURNING token INTO v_token;
  RETURN public.pos_cashier_json(a, v_token);
END $$;

CREATE OR REPLACE FUNCTION public.pos_whoami(p_token uuid) RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.admins;
BEGIN
  SELECT ad.* INTO a FROM public.pos_sessions s JOIN public.admins ad ON ad.id = s.cashier_id
  WHERE s.token = p_token AND s.expires_at > now();
  IF a.id IS NULL THEN RETURN NULL; END IF;
  RETURN public.pos_cashier_json(a, p_token);
END $$;

CREATE OR REPLACE FUNCTION public.pos_logout(p_token uuid) RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.pos_sessions WHERE token = p_token;
$$;

-- 5. COBRAR: número de factura atómico (si algo falla, no se consume número)
CREATE OR REPLACE FUNCTION public.pos_cobrar(
  p_token uuid, p_order_id uuid, p_order jsonb, p_payments jsonb,
  p_exchange_rate numeric, p_change_amount numeric, p_change_currency text
) RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.admins := public.pos_session_cashier(p_token);
  v_total numeric := (p_order->>'total')::numeric;
  v_subtotal numeric := coalesce((p_order->>'subtotal')::numeric, 0);
  v_fee numeric := coalesce((p_order->>'delivery_fee')::numeric, 0);
  v_change numeric := coalesce(p_change_amount, 0);
  v_paid numeric;
  v_n int;
  v_invoice text;
  v_id uuid;
BEGIN
  IF p_exchange_rate IS NULL OR p_exchange_rate <= 0 THEN RAISE EXCEPTION 'Tasa de cambio inválida'; END IF;
  IF v_total IS NULL OR v_total < 0 OR v_total > v_subtotal + v_fee + 0.01 THEN RAISE EXCEPTION 'Total inválido'; END IF;
  IF jsonb_typeof(p_payments) <> 'array' OR jsonb_array_length(p_payments) = 0 THEN RAISE EXCEPTION 'Falta el pago'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_payments) p
             WHERE coalesce((p->>'amount')::numeric, 0) <= 0
                OR coalesce(p->>'method', '') NOT IN ('Efectivo', 'Tarjeta', 'PagoMóvil')
                OR coalesce(p->>'currency', 'USD') NOT IN ('USD', 'BS')) THEN
    RAISE EXCEPTION 'Pago inválido';
  END IF;
  IF v_change < 0 OR v_change >= 100 THEN RAISE EXCEPTION 'Vuelto inválido (máximo $100)'; END IF;
  IF v_change > 0 AND coalesce(p_change_currency, '') NOT IN ('USD', 'BS') THEN RAISE EXCEPTION 'Indica la moneda del vuelto'; END IF;

  SELECT sum(CASE WHEN p->>'currency' = 'BS' THEN (p->>'amount')::numeric / p_exchange_rate ELSE (p->>'amount')::numeric END)
    INTO v_paid FROM jsonb_array_elements(p_payments) p;
  -- El efectivo se cobra redondeado hacia arriba al dólar, por eso se admite hasta +$1
  IF v_paid < v_total - 0.02 OR v_paid > v_total + 1.02 THEN RAISE EXCEPTION 'Los pagos no suman el total'; END IF;

  INSERT INTO public.invoice_counters(location_id, prefix, last_number) VALUES (a.location_id, 'FAC-', 1)
  ON CONFLICT (location_id) DO UPDATE SET last_number = public.invoice_counters.last_number + 1
  RETURNING last_number INTO v_n;
  v_invoice := 'FAC-' || to_char(now() AT TIME ZONE 'America/Caracas', 'YYYYMMDD') || '-'
            || lpad(v_n::text, greatest(4, length(v_n::text)), '0');

  IF p_order_id IS NOT NULL THEN
    UPDATE public.orders SET
      status = 'exitoso', payment_method = p_order->>'payment_method', payment_ref = nullif(p_order->>'payment_ref', ''),
      payment_currency = nullif(p_order->>'payment_currency', ''), change_amount = v_change, change_currency = nullif(p_change_currency, ''),
      cashier_id = a.id, invoice_number = v_invoice, items = p_order->'items', subtotal = v_subtotal, total = v_total,
      paid_at = now(), exchange_rate = p_exchange_rate
    WHERE id = p_order_id AND location_id = a.location_id AND status = 'pendiente'
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Ese pedido ya no está pendiente (otra caja lo cobró o fue cancelado).'; END IF;
  ELSE
    INSERT INTO public.orders(location_id, customer_name, customer_phone, cedula, delivery_type, items, subtotal, delivery_fee,
      total, notes, status, payment_method, payment_ref, payment_currency, change_amount, change_currency, cashier_id,
      invoice_number, paid_at, exchange_rate)
    VALUES (a.location_id, coalesce(nullif(p_order->>'customer_name', ''), 'Mostrador'), coalesce(nullif(p_order->>'customer_phone', ''), 'N/A'),
      coalesce(p_order->>'cedula', ''), coalesce(p_order->>'delivery_type', 'Pick-up'), p_order->'items', v_subtotal, v_fee,
      v_total, '', 'exitoso', p_order->>'payment_method', nullif(p_order->>'payment_ref', ''), nullif(p_order->>'payment_currency', ''),
      v_change, nullif(p_change_currency, ''), a.id, v_invoice, now(), p_exchange_rate)
    RETURNING id INTO v_id;
  END IF;

  DELETE FROM public.order_payments WHERE order_id = v_id;
  INSERT INTO public.order_payments(order_id, payment_method, amount, currency, payment_ref)
  SELECT v_id, p->>'method', (p->>'amount')::numeric, nullif(p->>'currency', ''), coalesce(p->>'ref', '')
  FROM jsonb_array_elements(p_payments) p;

  IF length(coalesce(p_order->>'cedula', '')) >= 6 THEN
    INSERT INTO public.customers(cedula, name, phone)
    VALUES (p_order->>'cedula', coalesce(nullif(p_order->>'customer_name', ''), 'Mostrador'), coalesce(nullif(p_order->>'customer_phone', ''), 'N/A'))
    ON CONFLICT (cedula) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, updated_at = now();
  END IF;

  RETURN json_build_object('id', v_id, 'invoice_number', v_invoice);
END $$;

-- 6. CORTE DE CAJA: lo calcula el servidor con los pedidos aún no cortados de la cajera
CREATE OR REPLACE FUNCTION public.pos_corte(p_token uuid, p_counted jsonb, p_exchange_rate numeric) RETURNS public.cortes
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.admins := public.pos_session_cashier(p_token);
  v_rate numeric := coalesce(nullif(p_exchange_rate, 0), (SELECT exchange_rate FROM public.config LIMIT 1), 1);
  v_last timestamptz;
  v_ids uuid[];
  c public.cortes;
BEGIN
  IF p_counted IS NULL OR (p_counted->>'efectivo_usd') IS NULL OR (p_counted->>'efectivo_bs') IS NULL
     OR (p_counted->>'tarjeta_bs') IS NULL OR (p_counted->>'pagomovil_bs') IS NULL THEN
    RAISE EXCEPTION 'Ingresa lo contado en caja (usa 0 si no hay).';
  END IF;
  IF least((p_counted->>'efectivo_usd')::numeric, (p_counted->>'efectivo_bs')::numeric,
           (p_counted->>'tarjeta_bs')::numeric, (p_counted->>'pagomovil_bs')::numeric) < 0 THEN
    RAISE EXCEPTION 'Los montos contados no pueden ser negativos.';
  END IF;
  -- Un corte a la vez por cajera
  PERFORM pg_advisory_xact_lock(hashtext('corte:' || a.id::text));

  SELECT max(closed_at) INTO v_last FROM public.cortes WHERE cashier_id = a.id AND location_id = a.location_id;
  -- paid_at existe desde esta migración; los pedidos anteriores se ubican por created_at como antes
  SELECT array_agg(id) INTO v_ids FROM (
    SELECT o.id FROM public.orders o
    WHERE o.status = 'exitoso' AND o.cashier_id = a.id AND o.location_id = a.location_id AND o.corte_id IS NULL
      AND (o.paid_at IS NOT NULL
           OR o.created_at > coalesce(v_last, date_trunc('day', now() AT TIME ZONE 'America/Caracas') AT TIME ZONE 'America/Caracas'))
    FOR UPDATE
  ) s;
  IF v_ids IS NULL THEN RAISE EXCEPTION 'No hay pedidos pendientes de corte.'; END IF;

  WITH o AS (
    SELECT o.*, coalesce(o.exchange_rate, v_rate) AS r,
      coalesce((SELECT coalesce(p.currency, 'USD') FROM public.order_payments p
                WHERE p.order_id = o.id AND p.payment_method = 'Efectivo' LIMIT 1), o.payment_currency, 'USD') AS recibido
    FROM public.orders o WHERE o.id = ANY(v_ids)
  ),
  lineas AS (
    SELECT p.payment_method AS m, coalesce(p.currency, 'USD') AS cur, p.amount AS amt, o.r
    FROM o JOIN public.order_payments p ON p.order_id = o.id
    UNION ALL
    -- pedidos viejos sin order_payments: total en USD
    SELECT o.payment_method, CASE WHEN o.payment_method = 'Efectivo' AND o.payment_currency = 'BS' THEN 'BS' ELSE 'USD' END,
           CASE WHEN o.payment_method = 'Efectivo' AND o.payment_currency = 'BS' THEN o.total * o.r ELSE o.total END, o.r
    FROM o WHERE NOT EXISTS (SELECT 1 FROM public.order_payments p WHERE p.order_id = o.id)
    UNION ALL
    -- vuelto dado en otra moneda: el sobrante queda en la moneda recibida y sale de la moneda del vuelto
    SELECT 'Efectivo', o.recibido, CASE WHEN o.recibido = 'USD' THEN o.change_amount ELSE o.change_amount * o.r END, o.r
    FROM o WHERE o.change_amount > 0 AND o.change_currency IS NOT NULL AND o.change_currency <> o.recibido
    UNION ALL
    SELECT 'Efectivo', o.change_currency, -(CASE WHEN o.change_currency = 'USD' THEN o.change_amount ELSE o.change_amount * o.r END), o.r
    FROM o WHERE o.change_amount > 0 AND o.change_currency IS NOT NULL AND o.change_currency <> o.recibido
  ),
  t AS (
    SELECT
      coalesce(sum(amt) FILTER (WHERE m = 'Efectivo' AND cur = 'USD'), 0) AS e_usd,
      coalesce(sum(amt) FILTER (WHERE m = 'Efectivo' AND cur = 'BS'), 0) AS e_bs,
      coalesce(sum(amt / r) FILTER (WHERE m = 'Efectivo' AND cur = 'BS'), 0) AS e_bs_usd,
      coalesce(sum(CASE WHEN cur = 'BS' THEN amt ELSE amt * r END) FILTER (WHERE m = 'Tarjeta'), 0) AS t_bs,
      coalesce(sum(CASE WHEN cur = 'BS' THEN amt / r ELSE amt END) FILTER (WHERE m = 'Tarjeta'), 0) AS t_usd,
      coalesce(sum(CASE WHEN cur = 'BS' THEN amt ELSE amt * r END) FILTER (WHERE m = 'PagoMóvil'), 0) AS pm_bs,
      coalesce(sum(CASE WHEN cur = 'BS' THEN amt / r ELSE amt END) FILTER (WHERE m = 'PagoMóvil'), 0) AS pm_usd
    FROM lineas
  ),
  g AS (SELECT count(*) AS n, sum(total) AS total, min(coalesce(paid_at, created_at)) AS desde FROM o)
  INSERT INTO public.cortes(location_id, cashier_id, cashier_name, date, closed_at, order_count,
    total_efectivo, total_efectivo_usd, total_efectivo_bs, total_tarjeta, total_tarjeta_usd, total_tarjeta_bs,
    total_pagomovil, total_pagomovil_usd, total_pagomovil_bs, grand_total, from_date, to_date, exchange_rate,
    counted_efectivo_usd, counted_efectivo_bs, counted_tarjeta_bs, counted_pagomovil_bs)
  SELECT a.location_id, a.id, coalesce(a.employee_id, a.name, ''), to_char(now() AT TIME ZONE 'America/Caracas', 'YYYY-MM-DD'), now(), g.n,
    round(t.e_usd + t.e_bs_usd, 2), round(t.e_usd, 2), round(t.e_bs, 2), round(t.t_usd, 2), round(t.t_usd, 2), round(t.t_bs, 2),
    round(t.pm_usd, 2), round(t.pm_usd, 2), round(t.pm_bs, 2), round(g.total, 2), least(g.desde, coalesce(v_last, g.desde)), now(), v_rate,
    (p_counted->>'efectivo_usd')::numeric, (p_counted->>'efectivo_bs')::numeric,
    (p_counted->>'tarjeta_bs')::numeric, (p_counted->>'pagomovil_bs')::numeric
  FROM t, g
  RETURNING * INTO c;

  UPDATE public.orders SET corte_id = c.id WHERE id = ANY(v_ids);
  RETURN c;
END $$;

-- 7. TASA DE CAMBIO: solo cajera con sesión o staff
DROP FUNCTION IF EXISTS public.update_exchange_rate(numeric);
CREATE OR REPLACE FUNCTION public.pos_update_rate(p_token uuid, p_rate numeric) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.pos_session_cashier(p_token);
  IF p_rate IS NULL OR p_rate <= 0 THEN RAISE EXCEPTION 'Tasa inválida'; END IF;
  UPDATE public.config SET exchange_rate = p_rate;
END $$;

-- 8. CLIENTE POR CÉDULA (antes la tabla customers era legible completa por anon)
CREATE OR REPLACE FUNCTION public.find_customer(p_cedula text) RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object('cedula', cedula, 'name', name, 'phone', phone, 'address', coalesce(address, ''))
  FROM public.customers WHERE cedula = p_cedula AND length(p_cedula) >= 6;
$$;

-- 9. PERMISOS DE FUNCIONES
REVOKE ALL ON FUNCTION public.pos_session_cashier(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pos_cashier_json(public.admins, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pos_login(text), public.pos_whoami(uuid), public.pos_logout(uuid),
  public.pos_cobrar(uuid, uuid, jsonb, jsonb, numeric, numeric, text), public.pos_corte(uuid, jsonb, numeric),
  public.pos_update_rate(uuid, numeric), public.find_customer(text), public.is_staff() TO anon, authenticated;

-- 10. POLICIES
-- admins: solo staff (antes anon podía leer PINs, crear y modificar admins)
DROP POLICY IF EXISTS "Anyone can insert admins" ON public.admins;
DROP POLICY IF EXISTS "Anyone can read admins" ON public.admins;
DROP POLICY IF EXISTS "Anyone can read admins (POS)" ON public.admins;
DROP POLICY IF EXISTS "Anyone can update admins" ON public.admins;
CREATE POLICY "Staff can read admins" ON public.admins FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can insert admins" ON public.admins FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update admins" ON public.admins FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "Staff can delete admins" ON public.admins FOR DELETE TO authenticated USING (public.is_staff());

-- orders: anon solo crea pedidos web pendientes; cobrar va por pos_cobrar
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders (POS)" ON public.orders;
DROP POLICY IF EXISTS "Anon can update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can update orders" ON public.orders;
CREATE POLICY "Web can create pending orders" ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pendiente' AND coalesce(invoice_number, '') = '' AND cashier_id IS NULL
              AND paid_at IS NULL AND corte_id IS NULL);
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- order_payments: solo lectura (se escriben en pos_cobrar)
DROP POLICY IF EXISTS "Anyone can delete order_payments" ON public.order_payments;
DROP POLICY IF EXISTS "Anyone can insert order_payments" ON public.order_payments;
DROP POLICY IF EXISTS "Anyone can update order_payments" ON public.order_payments;

-- cortes: solo lectura (se crean en pos_corte)
DROP POLICY IF EXISTS "Anyone can insert cortes" ON public.cortes;

-- invoice_counters: solo lectura (se incrementa en pos_cobrar)
DROP POLICY IF EXISTS "Anyone can upsert invoice_counters" ON public.invoice_counters;
DROP POLICY IF EXISTS "Anyone can update invoice_counters" ON public.invoice_counters;

-- customers: solo staff; la web y el POS buscan con find_customer
DROP POLICY IF EXISTS "Anyone can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Anyone can read customers" ON public.customers;
DROP POLICY IF EXISTS "Anyone can update customers" ON public.customers;
CREATE POLICY "Staff can read customers" ON public.customers FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can update customers" ON public.customers FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Catálogo y configuración: cualquier cuenta autenticada podía editarlos; ahora solo staff
DROP POLICY IF EXISTS "Authenticated can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can update categories" ON public.categories;
CREATE POLICY "Staff can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "Authenticated can delete menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated can insert menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated can update menu_items" ON public.menu_items;
CREATE POLICY "Staff can insert menu_items" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update menu_items" ON public.menu_items FOR UPDATE TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can delete menu_items" ON public.menu_items FOR DELETE TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "Authenticated can delete locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated can update locations" ON public.locations;
CREATE POLICY "Staff can insert locations" ON public.locations FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update locations" ON public.locations FOR UPDATE TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can delete locations" ON public.locations FOR DELETE TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "Authenticated can upsert config" ON public.config;
DROP POLICY IF EXISTS "Authenticated can update config" ON public.config;
CREATE POLICY "Staff can insert config" ON public.config FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update config" ON public.config FOR UPDATE TO authenticated USING (public.is_staff());
