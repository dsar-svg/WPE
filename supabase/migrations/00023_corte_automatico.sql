-- ============================================================
-- Corte de caja automático: la cajera ya no escribe lo contado.
-- pos_corte calcula los totales con las ventas registradas; con
-- p_preview = true solo los devuelve (para mostrarlos antes de cortar).
-- Las columnas counted_* quedan para cortes viejos y quedan en NULL.
-- ============================================================

DROP FUNCTION IF EXISTS public.pos_corte(uuid, jsonb, numeric);

CREATE OR REPLACE FUNCTION public.pos_corte(p_token uuid, p_exchange_rate numeric, p_preview boolean DEFAULT false)
RETURNS public.cortes
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.admins := public.pos_session_cashier(p_token);
  v_rate numeric := coalesce(nullif(p_exchange_rate, 0), (SELECT exchange_rate FROM public.config LIMIT 1), 1);
  v_last timestamptz;
  v_ids uuid[];
  c public.cortes;
BEGIN
  -- Un corte a la vez por cajera
  PERFORM pg_advisory_xact_lock(hashtext('corte:' || a.id::text));

  SELECT max(closed_at) INTO v_last FROM public.cortes WHERE cashier_id = a.id AND location_id = a.location_id;
  -- Pedidos anteriores a paid_at (migración 00022) se ubican por created_at
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
  SELECT g.n, round(t.e_usd + t.e_bs_usd, 2), round(t.e_usd, 2), round(t.e_bs, 2), round(t.t_usd, 2), round(t.t_bs, 2),
         round(t.pm_usd, 2), round(t.pm_bs, 2), round(g.total, 2), least(g.desde, coalesce(v_last, g.desde))
  INTO c.order_count, c.total_efectivo, c.total_efectivo_usd, c.total_efectivo_bs, c.total_tarjeta_usd, c.total_tarjeta_bs,
       c.total_pagomovil_usd, c.total_pagomovil_bs, c.grand_total, c.from_date
  FROM t, g;

  c.id := gen_random_uuid();
  c.location_id := a.location_id;
  c.cashier_id := a.id;
  c.cashier_name := coalesce(a.employee_id, a.name, '');
  c.date := to_char(now() AT TIME ZONE 'America/Caracas', 'YYYY-MM-DD');
  c.closed_at := now();
  c.to_date := now();
  c.created_at := now();
  c.total_tarjeta := c.total_tarjeta_usd;
  c.total_pagomovil := c.total_pagomovil_usd;
  c.exchange_rate := v_rate;

  IF p_preview THEN RETURN c; END IF;

  INSERT INTO public.cortes(id, location_id, cashier_id, cashier_name, date, closed_at, order_count,
    total_efectivo, total_efectivo_usd, total_efectivo_bs, total_tarjeta, total_tarjeta_usd, total_tarjeta_bs,
    total_pagomovil, total_pagomovil_usd, total_pagomovil_bs, grand_total, from_date, to_date, created_at, exchange_rate)
  VALUES (c.id, c.location_id, c.cashier_id, c.cashier_name, c.date, c.closed_at, c.order_count,
    c.total_efectivo, c.total_efectivo_usd, c.total_efectivo_bs, c.total_tarjeta, c.total_tarjeta_usd, c.total_tarjeta_bs,
    c.total_pagomovil, c.total_pagomovil_usd, c.total_pagomovil_bs, c.grand_total, c.from_date, c.to_date, c.created_at, c.exchange_rate);

  UPDATE public.orders SET corte_id = c.id WHERE id = ANY(v_ids);
  RETURN c;
END $$;

GRANT EXECUTE ON FUNCTION public.pos_corte(uuid, numeric, boolean) TO anon, authenticated;
