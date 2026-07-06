ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_screenshot JSONB DEFAULT '{}';
