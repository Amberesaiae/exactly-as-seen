-- Migration 12: Fix total_eggs ambiguity in get_batch_record_summary RPC
BEGIN;

CREATE OR REPLACE FUNCTION public.get_batch_record_summary(
  p_farm_id UUID,
  p_batch_ids UUID[]
)
RETURNS TABLE (
  batch_id UUID,
  initial_quantity INTEGER,
  current_population INTEGER,
  total_mortality INTEGER,
  total_feed_kg NUMERIC,
  total_eggs INTEGER,
  total_expenses_pesewas BIGINT,
  total_revenue_pesewas BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS batch_id,
    b.initial_quantity,
    b.current_population,
    COALESCE((SELECT SUM(count)::INTEGER FROM public.mortality_records WHERE mortality_records.batch_id = b.id AND mortality_records.farm_id = p_farm_id), 0) AS total_mortality,
    COALESCE((SELECT SUM(total_amount_kg)::NUMERIC FROM public.feed_schedules WHERE feed_schedules.batch_id = b.id AND feed_schedules.farm_id = p_farm_id AND feed_schedules.completed = true), 0.0) AS total_feed_kg,
    COALESCE((SELECT SUM(egg_records.total_eggs)::INTEGER FROM public.egg_records WHERE egg_records.batch_id = b.id AND egg_records.farm_id = p_farm_id), 0) AS total_eggs,
    COALESCE((SELECT SUM(amount_pesewas)::BIGINT FROM public.expenses WHERE expenses.batch_id = b.id AND expenses.farm_id = p_farm_id), 0::bigint) AS total_expenses_pesewas,
    COALESCE((SELECT SUM(amount_pesewas)::BIGINT FROM public.revenue WHERE revenue.batch_id = b.id AND revenue.farm_id = p_farm_id), 0::bigint) AS total_revenue_pesewas
  FROM public.batches b
  WHERE b.farm_id = p_farm_id AND b.id = ANY(p_batch_ids);
END;
$$;

COMMIT;
