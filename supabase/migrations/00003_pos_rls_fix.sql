-- ============================================================
-- POS RLS FIX: Allow anonymous INSERT/UPDATE for POS operations
-- POS uses PIN-based login (no Supabase Auth session)
-- ============================================================

-- CUSTOMERS: allow anon insert/update (POS needs to save customers)
DROP POLICY IF EXISTS "Authenticated can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated can update customers" ON public.customers;

CREATE POLICY "Anyone can insert customers" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update customers" ON public.customers FOR UPDATE TO anon, authenticated USING (true);

-- INVOICE COUNTERS: allow anon upsert (POS needs to generate invoice numbers)
DROP POLICY IF EXISTS "Authenticated can upsert invoice_counters" ON public.invoice_counters;
DROP POLICY IF EXISTS "Authenticated can update invoice_counters" ON public.invoice_counters;

CREATE POLICY "Anyone can upsert invoice_counters" ON public.invoice_counters FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update invoice_counters" ON public.invoice_counters FOR UPDATE TO anon, authenticated USING (true);
