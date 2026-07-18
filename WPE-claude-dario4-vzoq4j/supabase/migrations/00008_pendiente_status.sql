-- Add 'pendiente' status for app orders (pending POS processing)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pendiente', 'exitoso', 'cancelado'));

-- Change default to 'pendiente' (app orders start pending, POS sets to 'exitoso')
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pendiente';

-- Update existing app orders (no invoice = not POS-processed) to 'pendiente'
UPDATE public.orders SET status = 'pendiente'
WHERE status = 'exitoso' AND (invoice_number IS NULL OR invoice_number = '');
