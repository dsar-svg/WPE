-- ============================================================
-- MAX SELECTIONS: Add max_selections column to menu_items
-- ============================================================

ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS max_selections INT DEFAULT 0;
