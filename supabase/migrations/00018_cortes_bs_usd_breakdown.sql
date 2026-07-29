-- Add BS/USD breakdown columns for Tarjeta and PagoMovil in cortes

ALTER TABLE public.cortes ADD COLUMN IF NOT EXISTS total_tarjeta_usd NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.cortes ADD COLUMN IF NOT EXISTS total_tarjeta_bs NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.cortes ADD COLUMN IF NOT EXISTS total_pagomovil_usd NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.cortes ADD COLUMN IF NOT EXISTS total_pagomovil_bs NUMERIC(10,2) NOT NULL DEFAULT 0;
