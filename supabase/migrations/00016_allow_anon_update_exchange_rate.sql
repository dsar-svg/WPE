CREATE OR REPLACE FUNCTION update_exchange_rate(rate NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.config SET exchange_rate = rate WHERE id = 1;
END;
$$;

GRANT EXECUTE ON FUNCTION update_exchange_rate TO anon;
