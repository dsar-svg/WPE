-- Legal content table (editable from admin panel)
CREATE TABLE IF NOT EXISTS public.legal_content (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  terms_html TEXT NOT NULL DEFAULT '',
  privacy_html TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with empty content (admin will edit via panel)
INSERT INTO public.legal_content (id, terms_html, privacy_html) VALUES (1, '', '')
ON CONFLICT (id) DO NOTHING;

-- RLS: only authenticated can read/write
ALTER TABLE public.legal_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read legal content" ON public.legal_content FOR SELECT USING (true);
CREATE POLICY "Authenticated can update legal content" ON public.legal_content FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
