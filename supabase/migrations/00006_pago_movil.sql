-- ============================================================
-- Rename Transferencia to Pago Movil in payment_method check
-- ============================================================

-- 1. Update existing rows first
UPDATE public.orders SET payment_method = 'Pago Movil' WHERE payment_method = 'Transferencia';

-- 2. Drop ALL payment_method constraints (may have multiple if previous runs left stale ones)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'orders'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%payment_method%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT ' || r.conname;
  END LOOP;
END $$;

-- 3. Re-add with Pago Movil
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('Efectivo', 'Tarjeta', 'Pago Movil', 'QR', 'Otro'));
