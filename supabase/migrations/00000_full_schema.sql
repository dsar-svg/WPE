-- ============================================================
-- FULL SCHEMA: Panda Express — Supabase Migration
-- Run this in Supabase SQL Editor (in order)
-- ============================================================

-- 1. TABLAS
-- -------------------------------------------

-- Config (singleton)
CREATE TABLE IF NOT EXISTS public.config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'Wallace Panda Express',
  logo TEXT NOT NULL DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#d92323',
  secondary_color TEXT NOT NULL DEFAULT '#ffc400',
  about_us TEXT,
  social_media JSONB DEFAULT '{}',
  featured_product_ids TEXT[] DEFAULT '{}',
  tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0.16,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 2.00,
  exchange_rate NUMERIC(10,4) NOT NULL DEFAULT 1.00,
  distance_pricing JSONB NOT NULL DEFAULT '{"ranges":[{"maxDistance":5,"fee":3},{"maxDistance":10,"fee":5},{"maxDistance":15,"fee":7},{"maxDistance":20,"fee":9}],"maxDeliveryDistance":20}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Menu items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL REFERENCES public.categories(name) ON DELETE RESTRICT,
  image TEXT NOT NULL DEFAULT '',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Locations
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL DEFAULT '',
  schedule TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  open_time TEXT NOT NULL DEFAULT '09:00',
  close_time TEXT NOT NULL DEFAULT '21:00',
  is_open BOOLEAN NOT NULL DEFAULT true,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  admin_email TEXT,
  discontinued_product_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'Delivery' CHECK (delivery_type IN ('Delivery', 'Pick-up')),
  delivery_address TEXT,
  delivery_coordinates JSONB,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  payment_screenshot JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admins
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ÍNDICES
-- -------------------------------------------
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON public.menu_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_location ON public.orders(location_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);

-- 3. ROW LEVEL SECURITY
-- -------------------------------------------

-- Config
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read config" ON public.config FOR SELECT USING (true);
CREATE POLICY "Authenticated can upsert config" ON public.config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update config" ON public.config FOR UPDATE TO authenticated USING (true);

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update categories" ON public.categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete categories" ON public.categories FOR DELETE TO authenticated USING (true);

-- Menu items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert menu_items" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update menu_items" ON public.menu_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete menu_items" ON public.menu_items FOR DELETE TO authenticated USING (true);

-- Locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert locations" ON public.locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update locations" ON public.locations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete locations" ON public.locations FOR DELETE TO authenticated USING (true);

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can read orders" ON public.orders FOR SELECT TO authenticated USING (true);

-- Admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read admins" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert admins" ON public.admins FOR INSERT TO authenticated WITH CHECK (true);

-- 4. REALTIME (para órdenes)
-- -------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
