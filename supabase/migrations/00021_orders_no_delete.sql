-- Facturas no se eliminan: se anulan (status = 'cancelado') para conservar la numeración.
DROP POLICY IF EXISTS "Authenticated can delete orders" ON public.orders;
