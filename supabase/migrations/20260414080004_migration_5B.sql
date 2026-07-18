-- Migration 5B: Drop Old Money Columns
BEGIN;

ALTER TABLE public.expenses DROP COLUMN IF EXISTS amount;
ALTER TABLE public.revenue DROP COLUMN IF EXISTS amount;
ALTER TABLE public.stock_items DROP COLUMN IF EXISTS unit_price;
ALTER TABLE public.stock_transactions DROP COLUMN IF EXISTS unit_price;
ALTER TABLE public.stock_transactions DROP COLUMN IF EXISTS total_cost;
ALTER TABLE public.feed_ingredients DROP COLUMN IF EXISTS unit_price;
ALTER TABLE public.feed_ingredients DROP COLUMN IF EXISTS total_cost;

COMMIT;
