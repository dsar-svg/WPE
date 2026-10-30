-- La tasa que ponen las cajas no llegaba a config (la usa la web pública):
-- Supabase rechaza UPDATE sin WHERE en peticiones de la API (pg-safeupdate).
CREATE OR REPLACE FUNCTION public.pos_update_rate(p_token uuid, p_rate numeric) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.pos_session_cashier(p_token);
  IF p_rate IS NULL OR p_rate <= 0 THEN RAISE EXCEPTION 'Tasa inválida'; END IF;
  UPDATE public.config SET exchange_rate = p_rate WHERE id = 1;
END $$;
