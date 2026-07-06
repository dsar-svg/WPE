-- ============================================================
-- WEB ORDER STATUS: pending orders + order code + anon access
-- Run AFTER 00003_pos_rls_fix.sql
-- ============================================================

-- 1. Add short code column to orders (for WhatsApp / POS lookup)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS code TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_code ON public.orders(code);

-- 2. Allow 'pendiente' in status check
-- Normalize any existing rows with invalid or null status
UPDATE public.orders SET status = 'exitoso' WHERE status IS NULL OR status NOT IN ('pendiente', 'exitoso', 'cancelado');
-- Drop the old check constraint (name is auto-generated, find it dynamically)
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT con.conname INTO con_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'orders'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%status%';
  IF con_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT ' || con_name;
  END IF;
END $$;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pendiente', 'exitoso', 'cancelado'));

-- 3. Allow anon SELECT on orders (POS looks up pending orders by code)
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
CREATE POLICY "Anyone can read orders"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. Allow anon UPDATE on orders (POS updates pending order to 'exitoso')
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
CREATE POLICY "Anyone can update orders"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
