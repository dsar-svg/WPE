-- ============================================================
-- POS System: cashiers, payment methods, receipt data
-- ============================================================

-- 1. Add pin and employee_id to admins for POS cashiers
ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS pin TEXT,
  ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- 2. Add POS columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'Efectivo'
    CHECK (payment_method IN ('Efectivo', 'Tarjeta', 'Transferencia', 'QR', 'Otro')),
  ADD COLUMN IF NOT EXISTS change_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES public.admins(id) ON DELETE SET NULL;

-- 3. Allow anon INSERT for orders (cashiers without Supabase Auth)
DROP POLICY IF EXISTS "Anyone can insert orders (POS)" ON public.orders;
CREATE POLICY "Anyone can insert orders (POS)"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. Allow anon SELECT for admins (PIN login)
DROP POLICY IF EXISTS "Anyone can read admins (POS)" ON public.admins;
CREATE POLICY "Anyone can read admins (POS)"
  ON public.admins FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Add product code for POS quick-search
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS code TEXT;

CREATE INDEX IF NOT EXISTS idx_menu_items_code ON public.menu_items(code);

-- 6. Example: crear cajera de prueba (ejecutar solo si no existe)
-- INSERT INTO public.admins (email, name, role, pin, location_id)
-- VALUES ('cajera1@wallacepanda.com', 'María García', 'cashier', '1234', (SELECT id FROM public.locations LIMIT 1))
-- ON CONFLICT (email) DO NOTHING;
