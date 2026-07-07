-- ============================================================
-- Rename Transferencia to Pago Movil in payment_method check
-- ============================================================

-- Drop old constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Re-add with Pago Movil
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('Efectivo', 'Tarjeta', 'Pago Movil', 'QR', 'Otro'));

-- Update existing rows
UPDATE public.orders SET payment_method = 'Pago Movil' WHERE payment_method = 'Transferencia';
