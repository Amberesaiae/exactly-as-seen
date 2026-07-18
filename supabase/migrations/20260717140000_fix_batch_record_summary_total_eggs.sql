-- K hub: fix ambiguous total_eggs in get_batch_record_summary
-- Must DROP to replace; keep OUT column order compatible with prior fourth_sprint shape.
DROP FUNCTION IF EXISTS public.get_batch_record_summary(UUID, UUID[]);

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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.id AS batch_id,
    b.initial_quantity::INTEGER,
    b.current_population::INTEGER,
    COALESCE((
      SELECT SUM(mr.count)::INTEGER
      FROM public.mortality_records mr
      WHERE mr.batch_id = b.id AND mr.farm_id = p_farm_id
    ), 0) AS total_mortality,
    COALESCE((
      SELECT SUM(fl.quantity_kg)
      FROM public.feed_logs fl
      WHERE fl.batch_id = b.id AND fl.farm_id = p_farm_id
    ), 0) AS total_feed_kg,
    COALESCE((
      SELECT SUM(ec.total_eggs)::INTEGER
      FROM public.egg_collections ec
      WHERE ec.batch_id = b.id AND ec.farm_id = p_farm_id
    ), 0) AS total_eggs,
    COALESCE((
      SELECT SUM(e.amount_pesewas)::BIGINT
      FROM public.expenses e
      WHERE e.batch_id = b.id AND e.farm_id = p_farm_id
    ), 0) AS total_expenses_pesewas,
    COALESCE((
      SELECT SUM(r.amount_pesewas)::BIGINT
      FROM public.revenue r
      WHERE r.batch_id = b.id AND r.farm_id = p_farm_id
    ), 0) AS total_revenue_pesewas
  FROM public.batches b
  WHERE b.farm_id = p_farm_id
    AND b.id = ANY (p_batch_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_batch_record_summary(UUID, UUID[])
  TO authenticated, service_role;
