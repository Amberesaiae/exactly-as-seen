-- Migration 5A: Money Columns Phase A (Add and Populate Pesewas Columns)

BEGIN;

-- 1. expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS amount_pesewas INTEGER;
UPDATE public.expenses SET amount_pesewas = ROUND(amount * 100)::INTEGER WHERE amount_pesewas IS NULL;

-- 2. revenue
ALTER TABLE public.revenue ADD COLUMN IF NOT EXISTS amount_pesewas INTEGER;
UPDATE public.revenue SET amount_pesewas = ROUND(amount * 100)::INTEGER WHERE amount_pesewas IS NULL;

-- 3. stock_items
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS unit_price_pesewas INTEGER;
UPDATE public.stock_items SET unit_price_pesewas = ROUND(unit_price * 100)::INTEGER WHERE unit_price_pesewas IS NULL;

-- 4. stock_transactions
ALTER TABLE public.stock_transactions 
  ADD COLUMN IF NOT EXISTS unit_price_pesewas INTEGER,
  ADD COLUMN IF NOT EXISTS total_cost_pesewas INTEGER;
UPDATE public.stock_transactions SET unit_price_pesewas = ROUND(unit_price * 100)::INTEGER WHERE unit_price_pesewas IS NULL;
UPDATE public.stock_transactions SET total_cost_pesewas = ROUND(total_cost * 100)::INTEGER WHERE total_cost_pesewas IS NULL;

-- 5. feed_ingredients
ALTER TABLE public.feed_ingredients 
  ADD COLUMN IF NOT EXISTS unit_price_pesewas INTEGER,
  ADD COLUMN IF NOT EXISTS total_cost_pesewas INTEGER;
UPDATE public.feed_ingredients SET unit_price_pesewas = ROUND(unit_price * 100)::INTEGER WHERE unit_price_pesewas IS NULL;
UPDATE public.feed_ingredients SET total_cost_pesewas = ROUND(total_cost * 100)::INTEGER WHERE total_cost_pesewas IS NULL;

COMMIT;
