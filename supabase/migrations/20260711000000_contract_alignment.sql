-- =============================================================================
-- Contract Alignment Sprint
-- - feed_logs table (used by Health/Dashboard daily feed tasks)
-- - get_graded_egg_inventory + get_farm_financial_stats
-- - Week advancement catch-up (no 1-hour timezone window)
-- - SECURITY DEFINER ownership guards on critical RPCs
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. feed_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_kg NUMERIC NOT NULL DEFAULT 0,
  feed_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feed_logs_farm_date_idx ON public.feed_logs (farm_id, date);
CREATE INDEX IF NOT EXISTS feed_logs_batch_date_idx ON public.feed_logs (batch_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS feed_logs_batch_date_uniq ON public.feed_logs (batch_id, date);

ALTER TABLE public.feed_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own feed logs" ON public.feed_logs;
CREATE POLICY "Users can view own feed logs" ON public.feed_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.farms WHERE farms.id = feed_logs.farm_id AND farms.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own feed logs" ON public.feed_logs;
CREATE POLICY "Users can insert own feed logs" ON public.feed_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.farms WHERE farms.id = feed_logs.farm_id AND farms.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own feed logs" ON public.feed_logs;
CREATE POLICY "Users can update own feed logs" ON public.feed_logs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.farms WHERE farms.id = feed_logs.farm_id AND farms.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own feed logs" ON public.feed_logs;
CREATE POLICY "Users can delete own feed logs" ON public.feed_logs FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.farms WHERE farms.id = feed_logs.farm_id AND farms.user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- 2. Helper: assert farm ownership for DEFINER RPCs
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assert_farm_owner(p_farm_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id = p_farm_id AND f.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied for farm %', p_farm_id;
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Week advancement: catch-up from start_date (no hour gate)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cron_advance_batch_weeks()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch RECORD;
  v_farm_tz TEXT;
  v_local_date DATE;
  v_expected_week INTEGER;
  v_new_phase TEXT;
BEGIN
  FOR v_batch IN
    SELECT b.id, b.farm_id, b.species, b.duck_type, b.current_week, b.current_day, b.start_date,
           COALESCE(f.timezone, 'Africa/Accra') AS timezone
    FROM public.batches b
    JOIN public.farms f ON f.id = b.farm_id
    WHERE b.status = 'active'
  LOOP
    v_local_date := (now() AT TIME ZONE v_batch.timezone)::date;
    -- Week 1 = start_date .. start_date+6
    v_expected_week := GREATEST(1, (v_local_date - v_batch.start_date::date) / 7 + 1);

    IF v_expected_week > COALESCE(v_batch.current_week, 1) THEN
      v_new_phase := public.recompute_batch_phase(v_batch.species, v_batch.duck_type, v_expected_week);

      UPDATE public.batches
      SET current_week = v_expected_week,
          current_day = GREATEST(1, (v_local_date - start_date::date) + 1),
          phase = v_new_phase,
          updated_at = NOW()
      WHERE id = v_batch.id
        AND current_week = v_batch.current_week;
    END IF;
  END LOOP;
END;
$$;

-- Daily tasks: remove hour gate; run when called (scheduler still hourly is fine)
CREATE OR REPLACE FUNCTION public.cron_generate_daily_tasks()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_farm RECORD;
  v_batch RECORD;
  v_today DATE;
BEGIN
  FOR v_farm IN SELECT id, COALESCE(timezone, 'Africa/Accra') AS timezone FROM public.farms LOOP
    v_today := (now() AT TIME ZONE v_farm.timezone)::date;

    FOR v_batch IN
      SELECT id, species, duck_type, current_week
      FROM public.batches
      WHERE farm_id = v_farm.id AND status = 'active'
    LOOP
      INSERT INTO public.batch_tasks (batch_id, farm_id, title, description, due_date, task_type, completed)
      VALUES (v_batch.id, v_farm.id, 'Daily Feed', 'Record daily feed consumption', v_today, 'feed_log', false)
      ON CONFLICT ON CONSTRAINT batch_tasks_batch_due_type_uniq DO NOTHING;

      INSERT INTO public.batch_tasks (batch_id, farm_id, title, description, due_date, task_type, completed)
      VALUES (v_batch.id, v_farm.id, 'Daily Water', 'Record daily water and health intake', v_today, 'water_log', false)
      ON CONFLICT ON CONSTRAINT batch_tasks_batch_due_type_uniq DO NOTHING;

      IF v_batch.species = 'layer' AND v_batch.current_week >= 19 THEN
        INSERT INTO public.batch_tasks (batch_id, farm_id, title, description, due_date, task_type, completed)
        VALUES (v_batch.id, v_farm.id, 'Egg Collection', 'Record daily egg collection', v_today, 'egg_collection', false)
        ON CONFLICT ON CONSTRAINT batch_tasks_batch_due_type_uniq DO NOTHING;
      ELSIF v_batch.species = 'duck' AND v_batch.duck_type = 'layer' AND v_batch.current_week >= 20 THEN
        INSERT INTO public.batch_tasks (batch_id, farm_id, title, description, due_date, task_type, completed)
        VALUES (v_batch.id, v_farm.id, 'Egg Collection', 'Record daily egg collection', v_today, 'egg_collection', false)
        ON CONFLICT ON CONSTRAINT batch_tasks_batch_due_type_uniq DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. get_graded_egg_inventory
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_graded_egg_inventory(
  p_batch_id UUID,
  p_farm_id UUID,
  p_size TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collected INTEGER := 0;
  v_sold INTEGER := 0;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  SELECT COALESCE(SUM(good), 0) INTO v_collected
  FROM public.egg_collections
  WHERE batch_id = p_batch_id
    AND farm_id = p_farm_id
    AND (p_size IS NULL OR size_category = p_size);

  SELECT COALESCE(SUM(quantity), 0) INTO v_sold
  FROM public.egg_sales
  WHERE batch_id = p_batch_id
    AND farm_id = p_farm_id
    AND (p_size IS NULL OR size_category = p_size);

  RETURN GREATEST(0, v_collected - v_sold);
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. get_farm_financial_stats
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_farm_financial_stats(p_farm_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_exp BIGINT;
  v_month_rev BIGINT;
  v_month_exp BIGINT;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  SELECT COALESCE(SUM(amount_pesewas), 0) INTO v_week_exp
  FROM public.expenses
  WHERE farm_id = p_farm_id AND date >= (CURRENT_DATE - INTERVAL '7 days')::date;

  SELECT COALESCE(SUM(amount_pesewas), 0) INTO v_month_rev
  FROM public.revenue
  WHERE farm_id = p_farm_id AND date >= date_trunc('month', CURRENT_DATE)::date;

  SELECT COALESCE(SUM(amount_pesewas), 0) INTO v_month_exp
  FROM public.expenses
  WHERE farm_id = p_farm_id AND date >= date_trunc('month', CURRENT_DATE)::date;

  RETURN jsonb_build_object(
    'weekly_expenses_pesewas', v_week_exp,
    'monthly_revenue_pesewas', v_month_rev,
    'monthly_expenses_pesewas', v_month_exp,
    'monthly_net_pesewas', v_month_rev - v_month_exp
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Ownership guards on existing DEFINER RPCs
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.allocate_fifo_by_quality(
  p_farm_id UUID,
  p_stock_item_id UUID,
  p_qty_needed NUMERIC,
  p_batch_id UUID,
  p_reason TEXT,
  p_source_ref TEXT
)
RETURNS TABLE (
  allocated_lot_id UUID,
  qty_from_lot NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining NUMERIC := p_qty_needed;
  v_lot RECORD;
  v_allocated NUMERIC;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  FOR v_lot IN
    SELECT id, qty_on_hand
    FROM public.stock_lots
    WHERE farm_id = p_farm_id
      AND stock_item_id = p_stock_item_id
      AND qty_on_hand > 0
      AND COALESCE(quality_grade, '') <> 'damaged'
    ORDER BY
      CASE WHEN expiry_date IS NULL THEN 1 ELSE 0 END,
      expiry_date ASC,
      received_at ASC
    FOR UPDATE
  LOOP
    IF v_remaining <= 0 THEN
      EXIT;
    END IF;

    v_allocated := LEAST(v_remaining, v_lot.qty_on_hand);

    UPDATE public.stock_lots
    SET qty_on_hand = qty_on_hand - v_allocated
    WHERE id = v_lot.id;

    INSERT INTO public.stock_allocations (
      farm_id, lot_id, qty_allocated, batch_id, reason, source_ref
    ) VALUES (
      p_farm_id, v_lot.id, v_allocated, p_batch_id, p_reason, p_source_ref
    );

    allocated_lot_id := v_lot.id;
    qty_from_lot := v_allocated;
    RETURN NEXT;

    v_remaining := v_remaining - v_allocated;
  END LOOP;

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient stock available for allocation';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_egg_inventory(
  p_batch_id UUID,
  p_farm_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collected INTEGER := 0;
  v_sold INTEGER := 0;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  SELECT COALESCE(SUM(good), 0) INTO v_collected
  FROM public.egg_collections
  WHERE batch_id = p_batch_id AND farm_id = p_farm_id;

  SELECT COALESCE(SUM(quantity), 0) INTO v_sold
  FROM public.egg_sales
  WHERE batch_id = p_batch_id AND farm_id = p_farm_id;

  RETURN GREATEST(0, v_collected - v_sold);
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_complete_health_tasks(
  p_batch_id UUID,
  p_week_number INT,
  p_farm_id UUID,
  p_completed_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE;
  v_week_start DATE;
  v_week_end   DATE;
  v_task_ids   UUID[] := '{}';
  v_skipped    INT    := 0;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  SELECT start_date INTO v_start_date
  FROM public.batches
  WHERE id = p_batch_id AND farm_id = p_farm_id;

  IF v_start_date IS NULL THEN
    RETURN jsonb_build_object('completed_count', 0, 'skipped_count', 0, 'task_ids', '[]'::jsonb);
  END IF;

  v_week_start := v_start_date + ((p_week_number - 1) * 7);
  v_week_end   := v_week_start + 6;

  SELECT COUNT(*)::INT INTO v_skipped
  FROM public.health_tasks
  WHERE batch_id = p_batch_id
    AND farm_id  = p_farm_id
    AND completed = true
    AND scheduled_date BETWEEN v_week_start AND v_week_end;

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

  v_task_ids := COALESCE(v_task_ids, '{}');

  RETURN jsonb_build_object(
    'completed_count', COALESCE(array_length(v_task_ids, 1), 0),
    'skipped_count',   v_skipped,
    'task_ids',        to_jsonb(v_task_ids)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_weekly_health_summary(
  p_batch_id UUID,
  p_week_number INT,
  p_farm_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE;
  v_week_start DATE;
  v_week_end DATE;
  v_cost_privacy BOOLEAN;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  SELECT start_date INTO v_start_date
  FROM public.batches
  WHERE id = p_batch_id AND farm_id = p_farm_id;

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

  SELECT COALESCE(up.cost_privacy_enabled, false) INTO v_cost_privacy
  FROM public.user_preferences up
  JOIN public.farms f ON f.user_id = up.user_id
  WHERE f.id = p_farm_id
  LIMIT 1;

  RETURN jsonb_build_object(
    'health_tasks_total',
      (SELECT COUNT(*)::INT FROM public.health_tasks
       WHERE batch_id = p_batch_id AND scheduled_date BETWEEN v_week_start AND v_week_end),
    'health_tasks_completed',
      (SELECT COUNT(*)::INT FROM public.health_tasks
       WHERE batch_id = p_batch_id AND completed = true AND scheduled_date BETWEEN v_week_start AND v_week_end),
    'health_tasks_pending',
      (SELECT COUNT(*)::INT FROM public.health_tasks
       WHERE batch_id = p_batch_id AND completed = false AND scheduled_date BETWEEN v_week_start AND v_week_end),
    'batch_tasks_total',
      (SELECT COUNT(*)::INT FROM public.batch_tasks
       WHERE batch_id = p_batch_id AND due_date BETWEEN v_week_start AND v_week_end),
    'batch_tasks_completed',
      (SELECT COUNT(*)::INT FROM public.batch_tasks
       WHERE batch_id = p_batch_id AND completed = true AND due_date BETWEEN v_week_start AND v_week_end),
    'total_health_cost_pesewas',
      CASE WHEN v_cost_privacy THEN NULL
      ELSE (
        SELECT SUM(cost_pesewas) FROM public.health_tasks
        WHERE batch_id = p_batch_id AND completed = true
          AND scheduled_date BETWEEN v_week_start AND v_week_end
      ) END,
    'next_week_tasks',
      COALESCE(
        (SELECT jsonb_agg(
           jsonb_build_object(
             'product_name', product_name,
             'task_type', task_type,
             'scheduled_date', scheduled_date,
             'is_vaccination', (task_type = 'vaccination')
           ) ORDER BY scheduled_date
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

GRANT EXECUTE ON FUNCTION public.assert_farm_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_graded_egg_inventory(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_farm_financial_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_fifo_by_quality(UUID, UUID, NUMERIC, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_egg_inventory(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_complete_health_tasks(UUID, INT, UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_health_summary(UUID, INT, UUID) TO authenticated;
