-- Script para re-insertar todos los productos sin imágenes
-- Ejecuta esto en Supabase SQL Editor

-- Combos
INSERT INTO public.menu_items (name, description, price, category, image, sort_order) VALUES
  ('Combo #1', 'Pollo frito Panda (3 piezas) + Papas fritas o Chopsuey especial', 7.99, 'Combos', '', 0),
  ('Combo #2', 'Pollo frito Panda (6 piezas) + Papas fritas o Chopsuey especial', 12.99, 'Combos', '', 1),
  ('Combo #3', 'Pollo frito Panda (12 piezas) + Papas fritas o Chopsuey especial', 22.99, 'Combos', '', 2),
  ('Combo #4', 'Pollo frito Panda (6 piezas) + Chopsuey especial + 2 Lumpia vegetales + 4 Pollo agridulce + Papas fritas', 19.99, 'Combos', '', 3),
  ('Combo #5', 'Arroz frito especial (camarón, pollo y jamón) + 6 Pollo agridulce + Papas fritas', 7.99, 'Combos', '', 4),
  ('Combo #6', 'Arroz frito especial (camarón, pollo y jamón) + Chopsuey especial + 6 Costilla sal y pimienta', 8.99, 'Combos', '', 5),
  ('Combo #7', 'Arroz frito especial (camarón, pollo y jamón) + Chopsuey especial + 1 Lumpia vegetales', 7.99, 'Combos', '', 6),
  ('Combo #8', 'Arroz frito especial (camarón, pollo y jamón) + Chopsuey especial + 1 Costilla asada', 9.99, 'Combos', '', 7),
  ('Combo #9', 'Arroz frito especial (camarón, pollo y jamón) + Papas fritas + 1 Costilla asada', 9.99, 'Combos', '', 8),
  ('Combo #10', 'Arroz frito especial (camarón, pollo y jamón) + 1 Lumpia vegetales + 6 Costilla sal y pimienta', 8.99, 'Combos', '', 9),
  ('Combo #11', 'Arroz frito especial (camarón, pollo y jamón) + Papas fritas + 6 Costilla sal y pimienta', 8.99, 'Combos', '', 10),
  ('Combo #12', 'Arroz frito especial (camarón, pollo y jamón) + Pollo agridulce (3 piezas) + 3 Costilla sal y pimienta', 9.99, 'Combos', '', 11),
  ('Combo #13', 'Arroz frito especial (camarón, pollo y jamón) + Pollo agridulce (6 piezas) + Chopsuey especial', 7.99, 'Combos', '', 12),
  ('Combo #14', 'Arroz frito especial (camarón, pollo y jamón) + Pollo agridulce (6 piezas) + 1 Lumpia vegetales', 8.99, 'Combos', '', 13),
  ('Combo #15', 'Arroz frito especial (camarón, pollo y jamón) + 1 Costilla asada + 1 Lumpia vegetales', 9.99, 'Combos', '', 14),
  ('Combo #16', 'Arroz frito especial (camarón, pollo y jamón) + Papas fritas + Chopsuey especial', 7.99, 'Combos', '', 15),
  ('Combo #17', 'Arroz frito especial (camarón, pollo y jamón) + Pollo agridulce (3 piezas) + 1 Costilla asada', 9.99, 'Combos', '', 16),
  ('Combo #18', 'Arroz frito especial (camarón, pollo y jamón) + Papas fritas + 1 Lumpia vegetales', 7.99, 'Combos', '', 17),
  ('Combo #19', 'Media ración arroz frito especial (camarón, pollo y jamón) + Chopsuey especial', 4.99, 'Combos', '', 18),
  ('Combo #20', 'Media ración arroz frito especial (camarón, pollo y jamón) + 3 porciones pollo agridulce', 4.99, 'Combos', '', 19),
  ('Combo #21', 'Media ración arroz frito especial (camarón, pollo y jamón) + 1 pollo frito', 4.99, 'Combos', '', 20),
  ('Combo #22', 'Arroz frito especial (camarón, pollo y jamón) + 2 pollo frito + Papas fritas o Chopsuey especial', 7.99, 'Combos', '', 21),
  ('Combo #23', 'Arroz frito + Pollo con piña + Papa o Chopsuey', 7.99, 'Combos', '', 22),
  ('Combo #24', 'Arroz frito + Pollo ajonjolí + Papa o Chopsuey', 7.99, 'Combos', '', 23);

-- Especiales
INSERT INTO public.menu_items (name, description, price, category, image, sort_order) VALUES
  ('Arroz frito especial', 'Arroz frito especial con camarón, pollo y jamón', 7.99, 'Especiales', '', 0),
  ('Media ración arroz frito especial', 'Media ración de arroz frito especial con camarón, pollo y jamón', 4.99, 'Especiales', '', 1),
  ('Chopsuey especial', 'Chopsuey especial con camarón, pollo y jamón', 7.99, 'Especiales', '', 2),
  ('Media ración Chopsuey especial', 'Media ración de Chopsuey especial con camarón, pollo y jamón', 4.99, 'Especiales', '', 3);

-- Raciones
INSERT INTO public.menu_items (name, description, price, category, image, sort_order) VALUES
  ('Pollo con vegetales', 'Pollo con vegetales (120 gr)', 6.99, 'Raciones', '', 0),
  ('Pollo agridulce', 'Pollo agridulce (15 und)', 7.99, 'Raciones', '', 1),
  ('Pollo miel y ajonjolí', 'Pollo miel y ajonjolí (15 und)', 8.99, 'Raciones', '', 2),
  ('Costillas sal y pimienta', 'Costillas sal y pimienta (320 gr)', 8.99, 'Raciones', '', 3),
  ('Costillas asadas', 'Costillas asadas (4 und)', 9.99, 'Raciones', '', 4),
  ('Camarón sal y pimienta', 'Camarón sal y pimienta (30/40 und aprox)', 8.99, 'Raciones', '', 5),
  ('Tallarines', 'Tallarines (camarón, pollo y jamón)', 9.99, 'Raciones', '', 6),
  ('Media ración de tallarines', 'Media ración de tallarines (camarón, pollo y jamón)', 5.99, 'Raciones', '', 7);

-- Entradas
INSERT INTO public.menu_items (name, description, price, category, image, sort_order) VALUES
  ('Papas fritas', 'Ración de papas fritas (280 gr)', 3.99, 'Entradas', '', 0),
  ('Lumpia de vegetales', 'Ración de lumpia de vegetales (2 und)', 3.99, 'Entradas', '', 1);

-- Bebidas
INSERT INTO public.menu_items (name, description, price, category, image, sort_order) VALUES
  ('Agua Minalba 355 ml', 'Agua Minalba 355 ml', 1.00, 'Bebidas', '', 0),
  ('Agua Minalba 600 ml', 'Agua Minalba 600 ml', 1.50, 'Bebidas', '', 1),
  ('Botella de Malta 250 ml', 'Botella de Malta 250 ml', 1.00, 'Bebidas', '', 2),
  ('Lata de Malta 355 ml', 'Lata de Malta 355 ml', 1.25, 'Bebidas', '', 3),
  ('Gatorade 500 ml', 'Gatorade 500 ml', 2.50, 'Bebidas', '', 4),
  ('Lipton 500 ml', 'Lipton 500 ml', 2.50, 'Bebidas', '', 5),
  ('Lata de refresco 355 ml', 'Lata de refresco 355 ml', 1.50, 'Bebidas', '', 6),
  ('Refresco 1 L', 'Refresco 1 litro', 1.80, 'Bebidas', '', 7),
  ('Refresco 1.5 L', 'Refresco 1.5 litros', 2.00, 'Bebidas', '', 8),
  ('Refresco 2 L', 'Refresco 2 litros', 2.50, 'Bebidas', '', 9),
  ('Yukery 250 ml', 'Yukery 250 ml', 1.50, 'Bebidas', '', 10);

-- Sede (si también la eliminaste)
INSERT INTO public.locations (name, whatsapp, schedule, address, image, open_time, close_time, is_open, latitude, longitude, admin_email, discontinued_product_ids)
VALUES (
  'Sede Central',
  '50312345678',
  'Lunes a Domingo',
  'Centro, San Miguel, El Salvador',
  '',
  '09:00',
  '21:00',
  true,
  13.4833,
  -88.1833,
  'admin@wallacepandaexpress.com',
  '{}'
);