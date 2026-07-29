-- ============================================================
-- FIX: Corregir corte del 28/07/2026 y orden 2df2bdf2
-- Ejecutar en Supabase SQL Editor DESPUES de aplicar 00018
-- ============================================================

-- 1. CORREGIR ORDEN 2df2bdf2 (yovaisi acosta)
-- El monto en order_payments era 742.81 USD en vez de 1.00 USD
UPDATE order_payments
SET amount = 1.00
WHERE order_id = '2df2bdf2-cc89-4644-8aa5-afebf720916b'
  AND payment_method = 'Efectivo'
  AND amount = 742.81;

-- 2. CORREGIR CORTE 28/07/2026
-- Tasas reales usadas en el corte (con rate 742.81 BS/USD):
--   Efectivo USD: 5 + 9 + 5 + 1 + 1 + 5 = 26.00
--   Efectivo BS: 4900 + 1 + 1200 = 6101.00 BS = $8.21 USD
--   Tarjeta USD: suma de todas las tarjetas en USD
--   Tarjeta BS: 14000 + 1027.62 + 4300 + 2457.73 + 2000 + 10670.10 = 34455.45 BS = $46.39 USD
--   Pagomovil USD: suma de todas las pagomovil en USD
--   Pagomovil BS: 6397.56 BS = $8.61 USD

UPDATE cortes
SET
  order_count = 86,
  total_efectivo_usd = 26.00,
  total_efectivo_bs = 6101.00,
  total_efectivo = 26.00 + (6101.00 / 742.81),
  total_tarjeta_usd = 432.95 - 46.39,
  total_tarjeta_bs = 34455.45,
  total_tarjeta = 432.95,
  total_pagomovil_usd = 127.81 - 8.61,
  total_pagomovil_bs = 6397.56,
  total_pagomovil = 127.81,
  grand_total = 698.40
WHERE id = '4ccbdb2f-ae51-404d-8204-87b86edab7e8';
