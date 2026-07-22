-- Admin upgrades: stock quantity, PIN hashing, audit log

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS stock_quantity INT NOT NULL DEFAULT 0;

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert audit_log" ON public.audit_log FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can read audit_log" ON public.audit_log FOR SELECT TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
