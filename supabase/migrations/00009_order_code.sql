-- Ensure the code column exists on orders table for POS lookup
-- (column may already exist as 'code' from initial schema)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS code TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS orders_code_idx ON public.orders (code);
