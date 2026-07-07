-- ============================================================
-- Rename Transferencia to Pago Movil in payment_method check
-- ============================================================

-- 1. Update existing rows first
UPDATE public.orders SET payment_method = 'Pago Movil' WHERE payment_method = 'Transferencia';

-- 2. Drop ALL check constraints on the payment_method column
DO $$
DECLARE
  col_oid oid;
  r RECORD;
BEGIN
  -- Get the OID of the payment_method column in orders
  SELECT att.attnum INTO col_oid
  FROM pg_attribute att
  JOIN pg_class rel ON rel.oid = att.attrelid
  WHERE rel.relname = 'orders'
    AND att.attname = 'payment_method';

  -- Drop all check constraints that reference payment_method
  FOR r IN (
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'public.orders'::regclass
      AND con.contype = 'c'
      AND col_oid = ANY (con.conkey)
  ) LOOP
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT ' || r.conname;
  END LOOP;
END $$;

-- 3. Re-add with Pago Movil
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('Efectivo', 'Tarjeta', 'Pago Movil', 'QR', 'Otro'));
