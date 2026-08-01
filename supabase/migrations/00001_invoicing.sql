-- ============================================================
-- INVOICING + CUSTOMERS: Panda Express
-- Run this AFTER 00000_full_schema.sql
-- ============================================================

-- 1. ADD BUSINESS INFO TO config
ALTER TABLE public.config ADD COLUMN IF NOT EXISTS rif TEXT DEFAULT '';
ALTER TABLE public.config ADD COLUMN IF NOT EXISTS business_address TEXT DEFAULT '';
ALTER TABLE public.config ADD COLUMN IF NOT EXISTS business_phone TEXT DEFAULT '';

-- 2. ADD MISSING ORDER COLUMNS (POS already sends these)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS change_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cashier_id TEXT DEFAULT '';

-- 3. ADD INVOICE & CEDULA TO orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cedula TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_number TEXT DEFAULT '';

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  cedula TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);

-- 5. INVOICE COUNTER (sequential per location)
CREATE TABLE IF NOT EXISTS public.invoice_counters (
  location_id UUID PRIMARY KEY REFERENCES public.locations(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL DEFAULT 'FAC-',
  last_number INT NOT NULL DEFAULT 0
);

ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read invoice_counters" ON public.invoice_counters FOR SELECT USING (true);
CREATE POLICY "Authenticated can upsert invoice_counters" ON public.invoice_counters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update invoice_counters" ON public.invoice_counters FOR UPDATE TO authenticated USING (true);
