-- ============================================================
-- SPLIT PAYMENTS: order_payments table for mixed payment methods
-- ============================================================

-- 1. New table for individual payment splits per order
CREATE TABLE IF NOT EXISTS public.order_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Efectivo', 'Tarjeta', 'Transferencia', 'QR', 'PagoMóvil', 'Otro')),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT CHECK (currency IN ('USD', 'BS')),
  payment_ref TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_payments_order ON public.order_payments(order_id);

ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

-- RLS: same as orders (anon + authenticated can read/write, POS cashiers need anon)
CREATE POLICY "Anyone can read order_payments" ON public.order_payments
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert order_payments" ON public.order_payments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update order_payments" ON public.order_payments
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete order_payments" ON public.order_payments
  FOR DELETE TO anon, authenticated USING (true);

-- 2. Add 'Mixto' to orders.payment_method CHECK constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('Efectivo', 'Tarjeta', 'Transferencia', 'QR', 'PagoMóvil', 'Otro', 'Mixto'));
