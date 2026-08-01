ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_currency TEXT CHECK(payment_currency IN ('USD','BS'));

ALTER TABLE public.cortes ADD COLUMN IF NOT EXISTS total_efectivo_usd NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.cortes ADD COLUMN IF NOT EXISTS total_efectivo_bs NUMERIC(10,2) NOT NULL DEFAULT 0;
