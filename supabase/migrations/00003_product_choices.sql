-- ============================================================
-- PRODUCT CHOICES: Add choices JSONB column to menu_items
-- ============================================================

ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS choices JSONB DEFAULT '[]'::jsonb;
