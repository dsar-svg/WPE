-- Fix CHECK constraint on payment_method to include all valid values
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('Efectivo', 'Tarjeta', 'Transferencia', 'QR', 'PagoMóvil', 'Otro'));
