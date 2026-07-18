-- ============================================================
-- Add payment_ref column to orders table
-- ============================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_ref TEXT DEFAULT '';
