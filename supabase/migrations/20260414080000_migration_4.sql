-- Migration 4: Core Column Additions

-- farms additions
ALTER TABLE public.farms 
  ADD COLUMN IF NOT EXISTS water_source_chlorinated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Africa/Accra',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'GHS',
  ADD COLUMN IF NOT EXISTS egg_low_inventory_crates INTEGER NOT NULL DEFAULT 5;

-- batches additions
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS duck_type TEXT CHECK (duck_type IN ('meat', 'layer')),
  ADD COLUMN IF NOT EXISTS cycle_length_weeks INTEGER NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS has_active_withdrawal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS termination_reason TEXT CHECK (termination_reason IN ('normal', 'emergency'));

-- Enforce: duck_type required when species = 'duck'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'batches' AND constraint_name = 'duck_type_required'
  ) THEN
    ALTER TABLE public.batches ADD CONSTRAINT duck_type_required CHECK (species <> 'duck' OR duck_type IS NOT NULL);
  END IF;
END $$;

-- Partial unique index: one non-terminated batch per house
CREATE UNIQUE INDEX IF NOT EXISTS batches_house_active_uniq
  ON public.batches (house_id)
  WHERE status <> 'terminated' AND house_id IS NOT NULL;

-- houses additions
ALTER TABLE public.houses
  ADD COLUMN IF NOT EXISTS occupied_by_batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;

-- health_tasks additions
ALTER TABLE public.health_tasks
  ADD COLUMN IF NOT EXISTS medication_id TEXT,
  ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'drinking_water',
  ADD COLUMN IF NOT EXISTS container_type_id TEXT,
  ADD COLUMN IF NOT EXISTS container_count INTEGER,
  ADD COLUMN IF NOT EXISTS water_volume_l NUMERIC,
  ADD COLUMN IF NOT EXISTS computed_dose_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS computed_dose_unit TEXT,
  ADD COLUMN IF NOT EXISTS bird_count INTEGER,
  ADD COLUMN IF NOT EXISTS withdrawal_meat_until DATE,
  ADD COLUMN IF NOT EXISTS withdrawal_eggs_until DATE,
  ADD COLUMN IF NOT EXISTS cost_pesewas INTEGER,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- egg_sales additions
ALTER TABLE public.egg_sales
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS crates_sold INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS looses_sold INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_per_crate_pesewas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_per_loose_pesewas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue_pesewas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS ledger_entry_id TEXT;

-- user_preferences additions
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS cost_privacy_pin TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT;

-- revenue additions
ALTER TABLE public.revenue
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_ref TEXT;
