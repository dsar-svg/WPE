-- ============================================================
-- CORTES DE CAJA: Daily closure records for POS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cortes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  cashier_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  cashier_name TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  closed_at TIMESTAMPTZ DEFAULT now(),
  order_count INT NOT NULL DEFAULT 0,
  total_efectivo NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_tarjeta NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_pagomovil NUMERIC(10,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  from_date TIMESTAMPTZ,
  to_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cortes_location ON public.cortes(location_id);
CREATE INDEX IF NOT EXISTS idx_cortes_date ON public.cortes(date);

ALTER TABLE public.cortes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cortes" ON public.cortes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert cortes" ON public.cortes FOR INSERT TO anon, authenticated WITH CHECK (true);
