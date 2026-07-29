-- ============================================================
-- Order code column + anon SELECT policy for POS lookup
-- ============================================================

-- 1. Add order code column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS code TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS orders_code_idx ON public.orders (code) WHERE code != '';

-- 2. Allow anon to SELECT orders by code (POS PIN login is not Supabase Auth)
DROP POLICY IF EXISTS "Anon can lookup order by code" ON public.orders;
CREATE POLICY "Anon can lookup order by code"
  ON public.orders FOR SELECT
  TO anon
  USING (true);

-- 3. Allow anon to UPDATE orders (POS needs to update status/invoice when paying)
DROP POLICY IF EXISTS "Anon can update orders" ON public.orders;
CREATE POLICY "Anon can update orders"
  ON public.orders FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
