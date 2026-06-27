-- ============================================================
-- Insertar categorías y platos faltantes desde "wallace menu.xlsx"
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

-- 1. Renombrar "Entradas" → "Entrada" para unificar con el Excel
UPDATE public.categories SET name = 'Entrada' WHERE name = 'Entradas';
UPDATE public.menu_items SET category = 'Entrada' WHERE category = 'Entradas';

-- 2. Crear categorías nuevas (las que no existen ya)
INSERT INTO public.categories (name, sort_order) VALUES
  ('Chopsuey', 5),
  ('Arroz', 6),
  ('Tallarines', 7),
  ('Fideo', 8),
  ('Sopa', 9),
  ('Fuyong', 10),
  ('Ensalada', 11)
ON CONFLICT (name) DO NOTHING;

-- 3. Insertar platos faltantes (solo si el nombre no existe ya)
DO $$
DECLARE
  cat TEXT;
  next_order INT;
BEGIN
  -- ========== CHOPSUEY ==========
  cat := 'Chopsuey';
  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO next_order FROM public.menu_items WHERE category = cat;
  INSERT INTO public.menu_items (name, description, price, category, sort_order)
  SELECT v.name, v.desc, v.price, cat, next_order + v.ord
  FROM (VALUES
    (0, 'Chopsuey (Pollo, Jamón) 950g-1kg', 'Chopsuey de pollo y jamón', 7.99),
    (1, 'Chopsuey (Camarones, Jamón) 950g-1kg', 'Chopsuey de camarones y jamón', 8.99),
    (2, 'Chopsuey (Carne, Jamón) 950g-1kg', 'Chopsuey de carne y jamón', 8.99),
    (3, 'Chopsuey Especial (Pollo, Jamón y Camarón) 950g-1kg', 'Chopsuey especial con pollo, jamón y camarón', 9.99),
    (4, 'Chopsuey Especial (Carne, Camarones, Jamón) 950g-1kg', 'Chopsuey especial con carne, camarones y jamón', 9.99)
  ) AS v(ord, name, desc, price)
  WHERE NOT EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.name = v.name AND mi.category = cat);

  -- ========== ENTRADA (nuevos items que no están en seed) ==========
  cat := 'Entrada';
  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO next_order FROM public.menu_items WHERE category = cat;
  INSERT INTO public.menu_items (name, description, price, category, sort_order)
  SELECT v.name, v.desc, v.price, cat, next_order + v.ord
  FROM (VALUES
    (0, 'Ración Lumpia Jamón y Queso 2und', 'Ración de lumpia de jamón y queso 2 unidades', 4.99),
    (1, 'Costilla Asada 2und', 'Costilla asada 2 unidades', 5.99),
    (2, 'Costilla Asada 1und', 'Costilla asada 1 unidad', 2.99),
    (3, 'Wanton Frito 6und', 'Wanton frito 6 unidades', 4.99),
    (4, 'Wanton Vapor 6und', 'Wanton vapor 6 unidades', 4.99)
  ) AS v(ord, name, desc, price)
  WHERE NOT EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.name = v.name);

  -- ========== ARROZ ==========
  cat := 'Arroz';
  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO next_order FROM public.menu_items WHERE category = cat;
  INSERT INTO public.menu_items (name, description, price, category, sort_order)
  SELECT v.name, v.desc, v.price, cat, next_order + v.ord
  FROM (VALUES
    (0, 'Arroz Frito (Pollo con Jamón) 950g-1kg', 'Arroz frito con pollo y jamón', 7.99),
    (1, 'Arroz Frito Especial (Pollo, Jamón, Camarones) 950g-1kg', 'Arroz frito especial con pollo, jamón y camarones', 8.99),
    (2, 'Arroz Frito Especial (Jamón, Camarones) 950g-1kg', 'Arroz frito especial con jamón y camarones', 8.99),
    (3, 'Arroz Cantones (Cerdo, Jamón) 950g-1kg', 'Arroz cantones con cerdo y jamón', 7.99),
    (4, 'Arroz Cantones (Camarones, Jamón) 950g-1kg', 'Arroz cantones con camarones y jamón', 7.99),
    (5, 'Arroz Cantones (Cerdo, Camarones con Jamón) 950g-1kg', 'Arroz cantones con cerdo, camarones y jamón', 8.99)
  ) AS v(ord, name, desc, price)
  WHERE NOT EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.name = v.name);

  -- ========== TALLARINES ==========
  cat := 'Tallarines';
  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO next_order FROM public.menu_items WHERE category = cat;
  INSERT INTO public.menu_items (name, description, price, category, sort_order)
  SELECT v.name, v.desc, v.price, cat, next_order + v.ord
  FROM (VALUES
    (0, 'Chow Mein (Pollo, Camarones, Jamón) 950g-1kg', 'Chow mein con pollo, camarones y jamón', 9.99),
    (1, 'Chow Mein (Cerdo, Camarones, Jamón) 950g-1kg', 'Chow mein con cerdo, camarones y jamón', 9.99),
    (2, 'Chow Mein (Carne, Camarones, Jamón) 950g-1kg', 'Chow mein con carne, camarones y jamón', 9.99),
    (3, 'Chow Mein (Pollo, Cerdo, Jamón) 950g-1kg', 'Chow mein con pollo, cerdo y jamón', 8.99),
    (4, 'Chow Mein (Pollo, Carne, Jamón) 950g-1kg', 'Chow mein con pollo, carne y jamón', 8.99),
    (5, 'Chow Mein (Tres Carnes) 950g-1kg', 'Chow mein con tres carnes', 9.99),
    (6, 'Lou Mein (Pollo, Camarones, Jamón) 950g-1kg', 'Lou mein con pollo, camarones y jamón', 9.99),
    (7, 'Lou Mein (Cerdo, Camarones, Jamón) 950g-1kg', 'Lou mein con cerdo, camarones y jamón', 9.99),
    (8, 'Lou Mein (Carne, Camarones, Jamón) 950g-1kg', 'Lou mein con carne, camarones y jamón', 9.99),
    (9, 'Lou Mein (Pollo, Cerdo, Jamón) 950g-1kg', 'Lou mein con pollo, cerdo y jamón', 8.99),
    (10, 'Lou Mein (Pollo, Carne, Jamón) 950g-1kg', 'Lou mein con pollo, carne y jamón', 8.99),
    (11, 'Lou Mein (Tres Carnes) 950g-1kg', 'Lou mein con tres carnes', 9.99)
  ) AS v(ord, name, desc, price)
  WHERE NOT EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.name = v.name);

  -- ========== FIDEO ==========
  cat := 'Fideo';
  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO next_order FROM public.menu_items WHERE category = cat;
  INSERT INTO public.menu_items (name, description, price, category, sort_order)
  SELECT v.name, v.desc, v.price, cat, next_order + v.ord
  FROM (VALUES
    (0, 'Fideo Singapur (Cerdo, Camarones con Curri) 950g-1kg', 'Fideo Singapur con cerdo, camarones y curri', 9.99),
    (1, 'Fideo Panda (Cerdo, Camarones, Chucrut) 950g-1kg', 'Fideo Panda con cerdo, camarones y chucrut', 9.99),
    (2, 'Fideo Cantones (Cerdo, Camarones) 950g-1kg', 'Fideo cantones con cerdo y camarones', 8.99)
  ) AS v(ord, name, desc, price)
  WHERE NOT EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.name = v.name);

  -- ========== SOPA ==========
  cat := 'Sopa';
  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO next_order FROM public.menu_items WHERE category = cat;
  INSERT INTO public.menu_items (name, description, price, category, sort_order)
  SELECT v.name, v.desc, v.price, cat, next_order + v.ord
  FROM (VALUES
    (0, 'Sopa Wanton 8und', 'Sopa wanton 8 unidades', 7.99),
    (1, 'Sopa Wanton Mein (4und + Mein)', 'Sopa wanton mein con 4 unidades y mein', 8.99),
    (2, 'Sopa Panda Mein (Pollo, Huevo, Bola Camarones)', 'Sopa Panda mein con pollo, huevo y bola de camarones', 9.99),
    (3, 'Sopa Panda Fideo (Pollo, Huevo, Bola Camarones)', 'Sopa Panda fideo con pollo, huevo y bola de camarones', 9.99)
  ) AS v(ord, name, desc, price)
  WHERE NOT EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.name = v.name);

  -- ========== RACIONES (nuevos items) ==========
  cat := 'Raciones';
  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO next_order FROM public.menu_items WHERE category = cat;
  INSERT INTO public.menu_items (name, description, price, category, sort_order)
  SELECT v.name, v.desc, v.price, cat, next_order + v.ord
  FROM (VALUES
    (0, 'Costilla Asada 4und', 'Costilla asada 4 unidades', 9.99),
    (1, 'Costilla Agridulce 300-350g', 'Costilla agridulce', 9.99),
    (2, 'Camarones Sal y Pimienta 300-350g', 'Camarones sal y pimienta', 8.99),
    (3, 'Camarones Ajo 300-350g', 'Camarones al ajillo', 8.99),
    (4, 'Pollo a la Plancha 300-350g', 'Pollo a la plancha', 8.99),
    (5, 'Pollo Muslo BBQ 300-350g', 'Pollo muslo BBQ', 9.99),
    (6, 'Carne con Vegetales 300-350g', 'Carne con vegetales', 8.99),
    (7, 'Carne con Jengibre y Cebollín 300-350g', 'Carne con jengibre y cebollín', 9.99),
    (8, 'Wanton Frito 12und', 'Wanton frito 12 unidades', 7.99),
    (9, 'Wanton Vapor 12und', 'Wanton vapor 12 unidades', 7.99)
  ) AS v(ord, name, desc, price)
  WHERE NOT EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.name = v.name);

  -- ========== FUYONG ==========
  cat := 'Fuyong';
  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO next_order FROM public.menu_items WHERE category = cat;
  INSERT INTO public.menu_items (name, description, price, category, sort_order)
  SELECT v.name, v.desc, v.price, cat, next_order + v.ord
  FROM (VALUES
    (0, 'Tortilla con Tres Carnes', 'Tortilla fuyong con tres carnes', 9.99),
    (1, 'Tortilla con Pollo y Camarones', 'Tortilla fuyong con pollo y camarones', 10.99),
    (2, 'Tortilla con Camarones', 'Tortilla fuyong con camarones', 12.99)
  ) AS v(ord, name, desc, price)
  WHERE NOT EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.name = v.name);

  -- ========== ENSALADA ==========
  cat := 'Ensalada';
  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO next_order FROM public.menu_items WHERE category = cat;
  INSERT INTO public.menu_items (name, description, price, category, sort_order)
  SELECT v.name, v.desc, v.price, cat, next_order + v.ord
  FROM (VALUES
    (0, 'Ensalada Panda 100g', 'Ensalada Panda 100 gramos', 1.39),
    (1, 'Ensalada Panda 300g', 'Ensalada Panda 300 gramos', 4.39)
  ) AS v(ord, name, desc, price)
  WHERE NOT EXISTS (SELECT 1 FROM public.menu_items mi WHERE mi.name = v.name);
END $$;
