-- Migration 6: New Reference Tables + RLS

-- 1. medications
CREATE TABLE IF NOT EXISTS public.medications (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  delivery_method TEXT NOT NULL,
  dose_per_gallon NUMERIC,
  withdrawal_meat_days INTEGER NOT NULL DEFAULT 0,
  withdrawal_egg_days INTEGER NOT NULL DEFAULT 0,
  is_live_vaccine BOOLEAN NOT NULL DEFAULT false,
  is_sulfa BOOLEAN NOT NULL DEFAULT false,
  contains_calcium BOOLEAN NOT NULL DEFAULT false,
  is_tetracycline BOOLEAN NOT NULL DEFAULT false,
  is_activated_charcoal BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'medications' AND policyname = 'Anyone can view medications'
  ) THEN
    CREATE POLICY "Anyone can view medications" ON public.medications FOR SELECT USING (true);
  END IF;
END $$;


-- 2. container_types
CREATE TABLE IF NOT EXISTS public.container_types (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  volume_l NUMERIC NOT NULL,
  volume_gal NUMERIC NOT NULL
);

ALTER TABLE public.container_types ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'container_types' AND policyname = 'Anyone can view container_types'
  ) THEN
    CREATE POLICY "Anyone can view container_types" ON public.container_types FOR SELECT USING (true);
  END IF;
END $$;


-- 3. ingredients
CREATE TABLE IF NOT EXISTS public.ingredients (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  protein_pct NUMERIC NOT NULL DEFAULT 0,
  energy_kcal_per_kg NUMERIC NOT NULL DEFAULT 0,
  calcium_pct NUMERIC NOT NULL DEFAULT 0,
  phosphorus_pct NUMERIC NOT NULL DEFAULT 0,
  lysine_pct NUMERIC NOT NULL DEFAULT 0,
  methionine_pct NUMERIC NOT NULL DEFAULT 0,
  contains_gossypol BOOLEAN NOT NULL DEFAULT false,
  contains_aflatoxin_risk BOOLEAN NOT NULL DEFAULT false,
  max_share_pct NUMERIC NOT NULL DEFAULT 100
);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ingredients' AND policyname = 'Anyone can view ingredients'
  ) THEN
    CREATE POLICY "Anyone can view ingredients" ON public.ingredients FOR SELECT USING (true);
  END IF;
END $$;


-- 4. nutritional_requirements
CREATE TABLE IF NOT EXISTS public.nutritional_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  species TEXT NOT NULL,
  duck_type TEXT CHECK (duck_type IN ('meat', 'layer')),
  phase TEXT NOT NULL,
  protein_min NUMERIC NOT NULL DEFAULT 0,
  energy_min NUMERIC NOT NULL DEFAULT 0,
  energy_max NUMERIC NOT NULL DEFAULT 9999,
  calcium_min NUMERIC NOT NULL DEFAULT 0,
  calcium_max NUMERIC NOT NULL DEFAULT 100,
  phosphorus_min NUMERIC NOT NULL DEFAULT 0,
  lysine_min NUMERIC NOT NULL DEFAULT 0,
  methionine_min NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.nutritional_requirements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nutritional_requirements' AND policyname = 'Anyone can view nutritional_requirements'
  ) THEN
    CREATE POLICY "Anyone can view nutritional_requirements" ON public.nutritional_requirements FOR SELECT USING (true);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS nutritional_requirements_species_duck_type_phase_idx 
  ON public.nutritional_requirements (species, phase) 
  WHERE duck_type IS NULL;
  
CREATE UNIQUE INDEX IF NOT EXISTS nutritional_requirements_species_duck_type_phase_notnull_idx 
  ON public.nutritional_requirements (species, duck_type, phase) 
  WHERE duck_type IS NOT NULL;


-- 5. config_overrides
CREATE TABLE IF NOT EXISTS public.config_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT config_overrides_farm_key_key UNIQUE (farm_id, key)
);

ALTER TABLE public.config_overrides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'config_overrides' AND policyname = 'Users can view own config overrides') THEN
    CREATE POLICY "Users can view own config overrides" ON public.config_overrides FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = config_overrides.farm_id AND farms.user_id = auth.uid()));
    CREATE POLICY "Users can insert own config overrides" ON public.config_overrides FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = config_overrides.farm_id AND farms.user_id = auth.uid()));
    CREATE POLICY "Users can update own config overrides" ON public.config_overrides FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = config_overrides.farm_id AND farms.user_id = auth.uid()));
    CREATE POLICY "Users can delete own config overrides" ON public.config_overrides FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = config_overrides.farm_id AND farms.user_id = auth.uid()));
  END IF;
END $$;


-- 6. idempotency_keys
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'idempotency_keys' AND policyname = 'Users can view own idempotency keys') THEN
    CREATE POLICY "Users can view own idempotency keys" ON public.idempotency_keys FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = idempotency_keys.farm_id AND farms.user_id = auth.uid()));
    CREATE POLICY "Users can insert own idempotency keys" ON public.idempotency_keys FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = idempotency_keys.farm_id AND farms.user_id = auth.uid()));
  END IF;
END $$;


-- 7. stock_lots
CREATE TABLE IF NOT EXISTS public.stock_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  qty_on_hand NUMERIC NOT NULL DEFAULT 0,
  quality_grade TEXT NOT NULL DEFAULT 'good',
  expiry_date DATE,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unit_price_pesewas INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.stock_lots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_lots' AND policyname = 'Users can view own stock lots') THEN
    CREATE POLICY "Users can view own stock lots" ON public.stock_lots FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_lots.farm_id AND farms.user_id = auth.uid()));
    CREATE POLICY "Users can insert own stock lots" ON public.stock_lots FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_lots.farm_id AND farms.user_id = auth.uid()));
    CREATE POLICY "Users can update own stock lots" ON public.stock_lots FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_lots.farm_id AND farms.user_id = auth.uid()));
    CREATE POLICY "Users can delete own stock lots" ON public.stock_lots FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_lots.farm_id AND farms.user_id = auth.uid()));
  END IF;
END $$;


-- 8. stock_allocations
CREATE TABLE IF NOT EXISTS public.stock_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES public.stock_lots(id) ON DELETE CASCADE,
  qty_allocated NUMERIC NOT NULL DEFAULT 0,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  source_ref TEXT,
  allocated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_allocations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_allocations' AND policyname = 'Users can view own stock allocations') THEN
    CREATE POLICY "Users can view own stock allocations" ON public.stock_allocations FOR SELECT USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_allocations.farm_id AND farms.user_id = auth.uid()));
    CREATE POLICY "Users can insert own stock allocations" ON public.stock_allocations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_allocations.farm_id AND farms.user_id = auth.uid()));
    CREATE POLICY "Users can update own stock allocations" ON public.stock_allocations FOR UPDATE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_allocations.farm_id AND farms.user_id = auth.uid()));
    CREATE POLICY "Users can delete own stock allocations" ON public.stock_allocations FOR DELETE USING (EXISTS (SELECT 1 FROM farms WHERE farms.id = stock_allocations.farm_id AND farms.user_id = auth.uid()));
  END IF;
END $$;
