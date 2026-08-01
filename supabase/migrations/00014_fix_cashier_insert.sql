-- Fix cashier insert: allow anon INSERT + ensure all columns exist

-- 1. Ensure all columns exist
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS role TEXT DEFAULT '';
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS pin TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- 2. Fix RLS: allow anon INSERT for admins (POS cashiers without Supabase Auth)
DROP POLICY IF EXISTS "Authenticated can insert admins" ON public.admins;
CREATE POLICY "Anyone can insert admins"
  ON public.admins FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. Fix RLS: allow anon UPDATE for admins (PIN hashing on first login)
DROP POLICY IF EXISTS "Authenticated can update admins" ON public.admins;
CREATE POLICY "Anyone can update admins"
  ON public.admins FOR UPDATE
  TO anon, authenticated
  USING (true);
