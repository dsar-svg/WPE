-- ============================================================
-- PAGO MÓVIL: config + admin role column (if missing)
-- ============================================================

-- 1. Add pago_movil JSONB column to config
ALTER TABLE public.config ADD COLUMN IF NOT EXISTS pago_movil JSONB DEFAULT '{}';

-- 2. Ensure admins table has role and location_id (might be missing
--    if migrations were applied out of order)
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS role TEXT DEFAULT '';
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
