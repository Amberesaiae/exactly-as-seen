-- Schema gaps surfaced after hosted typegen + tsc
-- water rate on farms; recipe library; optional stock link on feed ingredients

ALTER TABLE public.farms
  ADD COLUMN IF NOT EXISTS water_rate_per_liter_pesewas INTEGER;

-- Feed recipe library (client already reads/writes feed_recipes)
CREATE TABLE IF NOT EXISTS public.feed_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  species TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  nutritional_profile JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feed_recipes_farm_id_idx ON public.feed_recipes (farm_id);

ALTER TABLE public.feed_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own feed recipes" ON public.feed_recipes;
CREATE POLICY "Users can view own feed recipes"
  ON public.feed_recipes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert own feed recipes" ON public.feed_recipes;
CREATE POLICY "Users can insert own feed recipes"
  ON public.feed_recipes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update own feed recipes" ON public.feed_recipes;
CREATE POLICY "Users can update own feed recipes"
  ON public.feed_recipes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete own feed recipes" ON public.feed_recipes;
CREATE POLICY "Users can delete own feed recipes"
  ON public.feed_recipes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.user_id = auth.uid()
  ));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_recipes TO authenticated;

-- Optional stock linkage for formulation lines (client may send stock_item_id)
ALTER TABLE public.feed_ingredients
  ADD COLUMN IF NOT EXISTS stock_item_id UUID REFERENCES public.stock_items(id) ON DELETE SET NULL;
