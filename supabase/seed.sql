-- ============================================================
-- SEED DATA: Wallace Panda Express — desde menú oficial DOCX
-- Run AFTER the schema migration
-- ============================================================

-- 1. Config
INSERT INTO public.config (id, name, logo, primary_color, secondary_color, about_us, social_media, featured_product_ids, tax_rate, delivery_fee, exchange_rate, distance_pricing)
VALUES (
  1,
  'Wallace Panda Express',
  'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Panda_Express_logo.svg/1024px-Panda_Express_logo.svg.png',
  '#d92323',
  '#ffc400',
  E'Bienvenido a Wallace Panda Express, donde la tradición y el sabor se encuentran. Disfruta de nuestra auténtica cocina con ingredientes frescos y recetas familiares que han deleitado a generaciones. ¡Haz tu pedido hoy y descubre el verdadero sabor de la tradición!',
  '{"instagram": "https://instagram.com/wallacepandaexpress", "facebook": "https://facebook.com/wallacepandaexpress"}',
  '{}',
  0.16,
  2.00,
  1.00,
  '{"ranges":[{"maxDistance":5,"fee":3},{"maxDistance":10,"fee":5},{"maxDistance":15,"fee":7},{"maxDistance":20,"fee":9}],"maxDeliveryDistance":20}'
);

-- 1b. Super admin — cambia el email aquí por el tuyo
INSERT INTO public.admins (email, user_id) VALUES ('dariomedina2619@gmail.com', NULL)
ON CONFLICT (email) DO NOTHING;

-- 2. Categories
INSERT INTO public.categories (id, name, sort_order) VALUES
  (gen_random_uuid(), 'Combos', 0),
  (gen_random_uuid(), 'Especiales', 1),
  (gen_random_uuid(), 'Raciones', 2),
  (gen_random_uuid(), 'Entradas', 3),
  (gen_random_uuid(), 'Bebidas', 4);

-- 3. Menu items
DO $$
DECLARE
  cat_combos TEXT;
  cat_especiales TEXT;
  cat_raciones TEXT;
  cat_entradas TEXT;
  cat_bebidas TEXT;
BEGIN
  SELECT name INTO cat_combos FROM public.categories WHERE name = 'Combos';
  SELECT name INTO cat_especiales FROM public.categories WHERE name = 'Especiales';
  SELECT name INTO cat_raciones FROM public.categories WHERE name = 'Raciones';
  SELECT name INTO cat_entradas FROM public.categories WHERE name = 'Entradas';
  SELECT name INTO cat_bebidas FROM public.categories WHERE name = 'Bebidas';

  -- ==============================
  -- COMBOS (24 items)
  -- ==============================
  INSERT INTO public.menu_items (name, description, price, category, image, sort_order) VALUES
    ('Combo #1', 'Pollo frito Panda (3 piezas) + Papas fritas o Chopsuey especial', 7.99, cat_combos, 'https://images.unsplash.com/photo-1562967914-608f82629710', 0),
    ('Combo #2', 'Pollo frito Panda (6 piezas) + Papas fritas o Chopsuey especial', 12.99, cat_combos, 'https://images.unsplash.com/photo-1562967914-608f82629710', 1),
    ('Combo #3', 'Pollo frito Panda (12 piezas) + Papas fritas o Chopsuey especial', 22.99, cat_combos, 'https://images.unsplash.com/photo-1562967914-608f82629710', 2),
    ('Combo #4', 'Pollo frito Panda (6 piezas) + Chopsuey especial + 2 Lumpia vegetales + 4 Pollo agridulce + Papas fritas', 19.99, cat_combos, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1', 3),
    ('Combo #5', 'Arroz frito especial (camarón, pollo y jamón) + 6 Pollo agridulce + Papas fritas', 7.99, cat_combos, 'https://images.unsplash.com/photo-1512058564366-18510be2db19', 4),
    ('Combo #6', 'Arroz frito especial (camarón, pollo y jamón) + Chopsuey especial + 6 Costilla sal y pimienta', 8.99, cat_combos, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1', 5),
    ('Combo #7', 'Arroz frito especial (camarón, pollo y jamón) + Chopsuey especial + 1 Lumpia vegetales', 7.99, cat_combos, 'https://images.unsplash.com/photo-1512058564366-18510be2db19', 6),
    ('Combo #8', 'Arroz frito especial (camarón, pollo y jamón) + Chopsuey especial + 1 Costilla asada', 9.99, cat_combos, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1', 7),
    ('Combo #9', 'Arroz frito especial (camarón, pollo y jamón) + Papas fritas + 1 Costilla asada', 9.99, cat_combos, 'https://images.unsplash.com/photo-1558030006-450675393462', 8),
    ('Combo #10', 'Arroz frito especial (camarón, pollo y jamón) + 1 Lumpia vegetales + 6 Costilla sal y pimienta', 8.99, cat_combos, 'https://images.unsplash.com/photo-1544025162-d76694265947', 9),
    ('Combo #11', 'Arroz frito especial (camarón, pollo y jamón) + Papas fritas + 6 Costilla sal y pimienta', 8.99, cat_combos, 'https://images.unsplash.com/photo-1544025162-d76694265947', 10),
    ('Combo #12', 'Arroz frito especial (camarón, pollo y jamón) + Pollo agridulce (3 piezas) + 3 Costilla sal y pimienta', 9.99, cat_combos, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1', 11),
    ('Combo #13', 'Arroz frito especial (camarón, pollo y jamón) + Pollo agridulce (6 piezas) + Chopsuey especial', 7.99, cat_combos, 'https://images.unsplash.com/photo-1512058564366-18510be2db19', 12),
    ('Combo #14', 'Arroz frito especial (camarón, pollo y jamón) + Pollo agridulce (6 piezas) + 1 Lumpia vegetales', 8.99, cat_combos, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1', 13),
    ('Combo #15', 'Arroz frito especial (camarón, pollo y jamón) + 1 Costilla asada + 1 Lumpia vegetales', 9.99, cat_combos, 'https://images.unsplash.com/photo-1558030006-450675393462', 14),
    ('Combo #16', 'Arroz frito especial (camarón, pollo y jamón) + Papas fritas + Chopsuey especial', 7.99, cat_combos, 'https://images.unsplash.com/photo-1512058564366-18510be2db19', 15),
    ('Combo #17', 'Arroz frito especial (camarón, pollo y jamón) + Pollo agridulce (3 piezas) + 1 Costilla asada', 9.99, cat_combos, 'https://images.unsplash.com/photo-1558030006-450675393462', 16),
    ('Combo #18', 'Arroz frito especial (camarón, pollo y jamón) + Papas fritas + 1 Lumpia vegetales', 7.99, cat_combos, 'https://images.unsplash.com/photo-1512058564366-18510be2db19', 17),
    ('Combo #19', 'Media ración arroz frito especial (camarón, pollo y jamón) + Chopsuey especial', 4.99, cat_combos, 'https://images.unsplash.com/photo-1512058564366-18510be2db19', 18),
    ('Combo #20', 'Media ración arroz frito especial (camarón, pollo y jamón) + 3 porciones pollo agridulce', 4.99, cat_combos, 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b', 19),
    ('Combo #21', 'Media ración arroz frito especial (camarón, pollo y jamón) + 1 pollo frito', 4.99, cat_combos, 'https://images.unsplash.com/photo-1562967914-608f82629710', 20),
    ('Combo #22', 'Arroz frito especial (camarón, pollo y jamón) + 2 pollo frito + Papas fritas o Chopsuey especial', 7.99, cat_combos, 'https://images.unsplash.com/photo-1562967914-608f82629710', 21),
    ('Combo #23', 'Arroz frito + Pollo con piña + Papa o Chopsuey', 7.99, cat_combos, 'https://images.unsplash.com/photo-1553621042-f6e147245754', 22),
    ('Combo #24', 'Arroz frito + Pollo ajonjolí + Papa o Chopsuey', 7.99, cat_combos, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b', 23);

  -- ==============================
  -- ESPECIALES (4 items)
  -- ==============================
  INSERT INTO public.menu_items (name, description, price, category, image, sort_order) VALUES
    ('Arroz frito especial', 'Arroz frito especial con camarón, pollo y jamón', 7.99, cat_especiales, 'https://images.unsplash.com/photo-1512058564366-18510be2db19', 0),
    ('Media ración arroz frito especial', 'Media ración de arroz frito especial con camarón, pollo y jamón', 4.99, cat_especiales, 'https://images.unsplash.com/photo-1512058564366-18510be2db19', 1),
    ('Chopsuey especial', 'Chopsuey especial con camarón, pollo y jamón', 7.99, cat_especiales, 'https://images.unsplash.com/photo-1574484284002-952d92456975', 2),
    ('Media ración Chopsuey especial', 'Media ración de Chopsuey especial con camarón, pollo y jamón', 4.99, cat_especiales, 'https://images.unsplash.com/photo-1574484284002-952d92456975', 3);

  -- ==============================
  -- RACIONES (8 items)
  -- ==============================
  INSERT INTO public.menu_items (name, description, price, category, image, sort_order) VALUES
    ('Pollo con vegetales', 'Pollo con vegetales (120 gr)', 6.99, cat_raciones, 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b', 0),
    ('Pollo agridulce', 'Pollo agridulce (15 und)', 7.99, cat_raciones, 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b', 1),
    ('Pollo miel y ajonjolí', 'Pollo miel y ajonjolí (15 und)', 8.99, cat_raciones, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b', 2),
    ('Costillas sal y pimienta', 'Costillas sal y pimienta (320 gr)', 8.99, cat_raciones, 'https://images.unsplash.com/photo-1544025162-d76694265947', 3),
    ('Costillas asadas', 'Costillas asadas (4 und)', 9.99, cat_raciones, 'https://images.unsplash.com/photo-1544025162-d76694265947', 4),
    ('Camarón sal y pimienta', 'Camarón sal y pimienta (30/40 und aprox)', 8.99, cat_raciones, 'https://images.unsplash.com/photo-1559314809-0d155014e29e', 5),
    ('Tallarines', 'Tallarines (camarón, pollo y jamón)', 9.99, cat_raciones, 'https://images.unsplash.com/photo-1585032226651-759b368d7246', 6),
    ('Media ración de tallarines', 'Media ración de tallarines (camarón, pollo y jamón)', 5.99, cat_raciones, 'https://images.unsplash.com/photo-1585032226651-759b368d7246', 7);

  -- ==============================
  -- ENTRADAS (2 items)
  -- ==============================
  INSERT INTO public.menu_items (name, description, price, category, image, sort_order) VALUES
    ('Papas fritas', 'Ración de papas fritas (280 gr)', 3.99, cat_entradas, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877', 0),
    ('Lumpia de vegetales', 'Ración de lumpia de vegetales (2 und)', 3.99, cat_entradas, 'https://images.unsplash.com/photo-1539735257881-5b7e1c8ab8e9', 1);

  -- ==============================
  -- BEBIDAS (11 items)
  -- ==============================
  INSERT INTO public.menu_items (name, description, price, category, image, sort_order) VALUES
    ('Agua Minalba 355 ml', 'Agua Minalba 355 ml', 1.00, cat_bebidas, 'https://images.unsplash.com/photo-1560023907-5f3397ea3200', 0),
    ('Agua Minalba 600 ml', 'Agua Minalba 600 ml', 1.50, cat_bebidas, 'https://images.unsplash.com/photo-1560023907-5f3397ea3200', 1),
    ('Botella de Malta 250 ml', 'Botella de Malta 250 ml', 1.00, cat_bebidas, 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a', 2),
    ('Lata de Malta 355 ml', 'Lata de Malta 355 ml', 1.25, cat_bebidas, 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a', 3),
    ('Gatorade 500 ml', 'Gatorade 500 ml', 2.50, cat_bebidas, 'https://images.unsplash.com/photo-1629203851122-3726ec8e8c95', 4),
    ('Lipton 500 ml', 'Lipton 500 ml', 2.50, cat_bebidas, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc', 5),
    ('Lata de refresco 355 ml', 'Lata de refresco 355 ml', 1.50, cat_bebidas, 'https://images.unsplash.com/photo-1629203851122-3726ec8e8c95', 6),
    ('Refresco 1 L', 'Refresco 1 litro', 1.80, cat_bebidas, 'https://images.unsplash.com/photo-1629203851122-3726ec8e8c95', 7),
    ('Refresco 1.5 L', 'Refresco 1.5 litros', 2.00, cat_bebidas, 'https://images.unsplash.com/photo-1629203851122-3726ec8e8c95', 8),
    ('Refresco 2 L', 'Refresco 2 litros', 2.50, cat_bebidas, 'https://images.unsplash.com/photo-1629203851122-3726ec8e8c95', 9),
    ('Yukery 250 ml', 'Yukery 250 ml', 1.50, cat_bebidas, 'https://images.unsplash.com/photo-1544145945-f90425340c7e', 10);
END $$;

-- 4. Location
INSERT INTO public.locations (name, whatsapp, schedule, address, image, open_time, close_time, is_open, latitude, longitude, admin_email, discontinued_product_ids)
VALUES (
  'Sede Central',
  '50312345678',
  'Lunes a Domingo',
  'Centro, San Miguel, El Salvador',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
  '09:00',
  '21:00',
  true,
  13.4833,
  -88.1833,
  'admin@wallacepandaexpress.com',
  '{}'
);
