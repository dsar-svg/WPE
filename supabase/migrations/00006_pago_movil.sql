-- ============================================================
-- Rename Transferencia to Pago Movil in payment_method check
-- ============================================================

-- 1. Update existing rows (before adding new constraint)
UPDATE public.orders SET payment_method = 'Pago Movil' WHERE payment_method = 'Transferencia';

-- 2. Drop the old constraint (PostgreSQL auto-named it orders_payment_method_check)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- 3. Re-add with Pago Movil
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('Efectivo', 'Tarjeta', 'Pago Movil', 'QR', 'Otro'));
