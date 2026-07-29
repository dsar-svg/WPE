-- ============================================================
-- CHOICES: Opciones para combos específicos
-- ============================================================

-- Combos #1, #2, #3, #22 → Chopsuey Especial / Papas Fritas
UPDATE public.menu_items
SET choices = '[{"name":"Chopsuey Especial","priceAdjust":0},{"name":"Papas Fritas","priceAdjust":0}]'::jsonb,
    max_selections = 1
WHERE name IN ('Combo #1', 'Combo #2', 'Combo #3', 'Combo #22');

-- Combos #23, #24 → Chopsuey / Papas Fritas
UPDATE public.menu_items
SET choices = '[{"name":"Chopsuey","priceAdjust":0},{"name":"Papas Fritas","priceAdjust":0}]'::jsonb,
    max_selections = 1
WHERE name IN ('Combo #23', 'Combo #24');
