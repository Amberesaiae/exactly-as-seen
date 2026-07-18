-- =============================================================================
-- Fifth Sprint Migration: Finance Canonical Alignment
-- R1: Add payment_method + payment_status to expenses
-- R2: Add payment_method + payment_status to revenue (already has buyer/source)
-- R3: Enforce canonical 9 expense categories & 5 revenue categories
-- =============================================================================

-- ----------------------------------------------------------------------------
-- R1: Extend expenses table
-- ----------------------------------------------------------------------------
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS payment_method  TEXT DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'mobile_money', 'bank_transfer', 'credit')),
  ADD COLUMN IF NOT EXISTS payment_status  TEXT NOT NULL DEFAULT 'paid'
    CHECK (payment_status IN ('paid', 'pending', 'partial'));

-- Canonical 9 expense categories (drop old open-ended constraint if it exists)
ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_category_check;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_category_check
  CHECK (category IN (
    'feed_and_nutrition',
    'health_and_medicine',
    'labor_and_workers',
    'utilities_and_services',
    'equipment_and_tools',
    'transport_and_delivery',
    'housing_and_facilities',
    'chicks_and_birds',
    'other_expenses'
  ));

-- ----------------------------------------------------------------------------
-- R2: Extend revenue table
-- ----------------------------------------------------------------------------
ALTER TABLE public.revenue
  ADD COLUMN IF NOT EXISTS payment_method  TEXT DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'mobile_money', 'bank_transfer', 'credit')),
  ADD COLUMN IF NOT EXISTS payment_status  TEXT NOT NULL DEFAULT 'paid'
    CHECK (payment_status IN ('paid', 'pending', 'partial'));

-- Canonical 5 revenue categories
ALTER TABLE public.revenue
  DROP CONSTRAINT IF EXISTS revenue_category_check;

ALTER TABLE public.revenue
  ADD CONSTRAINT revenue_category_check
  CHECK (category IN (
    'egg_sales',
    'bird_sales',
    'meat_sales',
    'manure_sales',
    'other_revenue'
  ));

-- Migrate any legacy 'manure' to 'manure_sales'
UPDATE public.revenue SET category = 'manure_sales' WHERE category = 'manure';
