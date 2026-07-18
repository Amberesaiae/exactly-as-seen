-- =============================================================================
-- Fourth Sprint Migration
-- T3: Schema Correctness Fixes (M1, M2, M3)
-- T2: New RPCs — get_weekly_health_summary + bulk_complete_health_tasks (M4, M5)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- M1 + M2: Fix C — stock_lots quality_grade 'good' → 'A' + CHECK constraint
-- ----------------------------------------------------------------------------
UPDATE public.stock_lots SET quality_grade = 'A' WHERE quality_grade = 'good';

ALTER TABLE public.stock_lots
  DROP CONSTRAINT IF EXISTS stock_lots_quality_grade_check;

ALTER TABLE public.stock_lots
  ADD CONSTRAINT stock_lots_quality_grade_check
  CHECK (quality_grade IN ('A', 'B', 'C', 'damaged'));

-- ----------------------------------------------------------------------------
-- M3: Fix D — Rename egg_records → egg_collections (atomic with code deploy)
-- ----------------------------------------------------------------------------
ALTER TABLE public.egg_records RENAME TO egg_collections;

-- Recreate get_batch_record_summary using egg_collections
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
    COALESCE((SELECT SUM(total_eggs)::INTEGER FROM public.egg_collections WHERE egg_collections.batch_id = b.id AND egg_collections.farm_id = p_farm_id), 0) AS total_eggs,
    COALESCE((SELECT SUM(amount_pesewas)::BIGINT FROM public.expenses WHERE expenses.batch_id = b.id AND expenses.farm_id = p_farm_id), 0::bigint) AS total_expenses_pesewas,
    COALESCE((SELECT SUM(amount_pesewas)::BIGINT FROM public.revenue WHERE revenue.batch_id = b.id AND revenue.farm_id = p_farm_id), 0::bigint) AS total_revenue_pesewas
  FROM public.batches b
  WHERE b.farm_id = p_farm_id AND b.id = ANY(p_batch_ids);
END;
$$;

-- Recreate get_egg_inventory using egg_collections
CREATE OR REPLACE FUNCTION public.get_egg_inventory(
  p_batch_id UUID,
  p_farm_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_collected INTEGER := 0;
  v_sold INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(good), 0) INTO v_collected
  FROM public.egg_collections
  WHERE batch_id = p_batch_id AND farm_id = p_farm_id;

  SELECT COALESCE(SUM(quantity), 0) INTO v_sold
  FROM public.egg_sales
  WHERE batch_id = p_batch_id AND farm_id = p_farm_id;

  RETURN GREATEST(0, v_collected - v_sold);
END;
$$;

-- ----------------------------------------------------------------------------
-- M4: New RPC — get_weekly_health_summary
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_weekly_health_summary(
  p_batch_id UUID,
  p_week_number INT,
  p_farm_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE;
  v_week_start DATE;
  v_week_end DATE;
  v_cost_privacy BOOLEAN;
BEGIN
  -- Compute week date range from batch start_date
  SELECT start_date INTO v_start_date
  FROM public.batches
  WHERE id = p_batch_id;

  IF v_start_date IS NULL THEN
    RETURN jsonb_build_object(
      'health_tasks_total', 0,
      'health_tasks_completed', 0,
      'health_tasks_pending', 0,
      'batch_tasks_total', 0,
      'batch_tasks_completed', 0,
      'total_health_cost_pesewas', NULL,
      'next_week_tasks', '[]'::jsonb
    );
  END IF;

  v_week_start := v_start_date + ((p_week_number - 1) * 7);
  v_week_end   := v_week_start + 6;

  -- Check cost privacy
  SELECT COALESCE(up.cost_privacy_enabled, false) INTO v_cost_privacy
  FROM public.user_preferences up
  JOIN public.farms f ON f.user_id = up.user_id
  WHERE f.id = p_farm_id
  LIMIT 1;

  RETURN jsonb_build_object(
    'health_tasks_total',
      (SELECT COUNT(*)::INT FROM public.health_tasks
       WHERE batch_id = p_batch_id
         AND scheduled_date BETWEEN v_week_start AND v_week_end),

    'health_tasks_completed',
      (SELECT COUNT(*)::INT FROM public.health_tasks
       WHERE batch_id = p_batch_id
         AND completed = true
         AND scheduled_date BETWEEN v_week_start AND v_week_end),

    'health_tasks_pending',
      (SELECT COUNT(*)::INT FROM public.health_tasks
       WHERE batch_id = p_batch_id
         AND completed = false
         AND scheduled_date BETWEEN v_week_start AND v_week_end),

    'batch_tasks_total',
      (SELECT COUNT(*)::INT FROM public.batch_tasks
       WHERE batch_id = p_batch_id
         AND due_date BETWEEN v_week_start AND v_week_end),

    'batch_tasks_completed',
      (SELECT COUNT(*)::INT FROM public.batch_tasks
       WHERE batch_id = p_batch_id
         AND completed = true
         AND due_date BETWEEN v_week_start AND v_week_end),

    'total_health_cost_pesewas',
      CASE
        WHEN v_cost_privacy THEN NULL
        ELSE (
          SELECT SUM(cost_pesewas)
          FROM public.health_tasks
          WHERE batch_id = p_batch_id
            AND completed = true
            AND scheduled_date BETWEEN v_week_start AND v_week_end
        )
      END,

    'next_week_tasks',
      COALESCE(
        (SELECT jsonb_agg(
           jsonb_build_object(
             'product_name',    product_name,
             'task_type',       task_type,
             'scheduled_date',  scheduled_date,
             'is_vaccination',  (task_type = 'vaccination')
           )
           ORDER BY scheduled_date
         )
         FROM public.health_tasks
         WHERE batch_id = p_batch_id
           AND scheduled_date BETWEEN (v_week_end + 1) AND (v_week_end + 7)
        ),
        '[]'::jsonb
      )
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- M5: New RPC — bulk_complete_health_tasks
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bulk_complete_health_tasks(
  p_batch_id UUID,
  p_week_number INT,
  p_farm_id UUID,
  p_completed_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE;
  v_week_start DATE;
  v_week_end   DATE;
  v_task_ids   UUID[] := '{}';
  v_skipped    INT    := 0;
BEGIN
  SELECT start_date INTO v_start_date
  FROM public.batches
  WHERE id = p_batch_id;

  IF v_start_date IS NULL THEN
    RETURN jsonb_build_object('completed_count', 0, 'skipped_count', 0, 'task_ids', '[]'::jsonb);
  END IF;

  v_week_start := v_start_date + ((p_week_number - 1) * 7);
  v_week_end   := v_week_start + 6;

  -- Count already-completed tasks (skipped)
  SELECT COUNT(*)::INT INTO v_skipped
  FROM public.health_tasks
  WHERE batch_id = p_batch_id
    AND farm_id  = p_farm_id
    AND completed = true
    AND scheduled_date BETWEEN v_week_start AND v_week_end;

  -- Update pending tasks and collect their IDs
  WITH updated AS (
    UPDATE public.health_tasks
    SET completed    = true,
        completed_at = p_completed_at
    WHERE batch_id   = p_batch_id
      AND farm_id    = p_farm_id
      AND completed  = false
      AND scheduled_date BETWEEN v_week_start AND v_week_end
    RETURNING id
  )
  SELECT ARRAY_AGG(id) INTO v_task_ids FROM updated;

  -- Normalise NULLs
  v_task_ids := COALESCE(v_task_ids, '{}');

  RETURN jsonb_build_object(
    'completed_count', array_length(v_task_ids, 1),
    'skipped_count',   v_skipped,
    'task_ids',        to_jsonb(v_task_ids)
  );
END;
$$;
