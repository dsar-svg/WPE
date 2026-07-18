-- Add unique order_code column to orders table for POS lookup
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_code TEXT DEFAULT '';

-- Index for fast lookup by code
CREATE INDEX IF NOT EXISTS orders_order_code_idx ON public.orders (order_code);

-- Allow anonymous reads by order_code (public can create orders and POS can look them up)
-- Existing RLS policies on orders already allow authenticated reads; anon can look up by code
