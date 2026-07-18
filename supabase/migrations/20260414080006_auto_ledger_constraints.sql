-- Migration 10: Auto-Ledger Unique Constraints for Expenses and Revenue
BEGIN;

-- 1. Create unique index for expenses (source, source_ref)
CREATE UNIQUE INDEX IF NOT EXISTS expenses_source_source_ref_uniq ON public.expenses (source, source_ref) WHERE source_ref IS NOT NULL;

-- 2. Create unique index for revenue (source, source_ref)
CREATE UNIQUE INDEX IF NOT EXISTS revenue_source_source_ref_uniq ON public.revenue (source, source_ref) WHERE source_ref IS NOT NULL;

COMMIT;
