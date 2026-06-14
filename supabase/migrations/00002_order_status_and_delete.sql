-- Add status column to orders table (default 'exitoso' for all orders)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'exitoso'
  CHECK (status IN ('exitoso', 'cancelado'));

-- Allow authenticated users to update order status
CREATE POLICY "Authenticated can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to delete orders
CREATE POLICY "Authenticated can delete orders" ON public.orders
  FOR DELETE TO authenticated USING (true);
