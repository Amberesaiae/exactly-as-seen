-- =============================================================================
-- Atomic intent writers + research seed gaps (ingredients → 41)
-- W1 complete_health_task | W2 confirm_day_feed | bulk vax sync | N1 ingredients
-- =============================================================================

-- ----------------------------------------------------------------------------
-- W1: complete_health_task
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_health_task(
  p_farm_id UUID,
  p_task_id UUID,
  p_cost_pesewas INT DEFAULT 0,
  p_completed_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.health_tasks%ROWTYPE;
  v_system TEXT;
  v_meat_until DATE;
  v_eggs_until DATE;
  v_has_withdrawal BOOLEAN := false;
  v_auto BOOLEAN := false;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  SELECT * INTO v_task
  FROM public.health_tasks
  WHERE id = p_task_id AND farm_id = p_farm_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'health task not found';
  END IF;

  IF v_task.completed THEN
    RETURN jsonb_build_object('ok', true, 'already_completed', true, 'task_id', p_task_id);
  END IF;

  IF COALESCE(v_task.withdrawal_meat_days, 0) > 0 THEN
    v_meat_until := (p_completed_at::date + v_task.withdrawal_meat_days);
    v_has_withdrawal := true;
  END IF;
  IF COALESCE(v_task.withdrawal_egg_days, 0) > 0 THEN
    v_eggs_until := (p_completed_at::date + v_task.withdrawal_egg_days);
    v_has_withdrawal := true;
  END IF;

  UPDATE public.health_tasks
  SET
    completed = true,
    completed_at = p_completed_at,
    withdrawal_meat_until = v_meat_until,
    withdrawal_eggs_until = v_eggs_until,
    cost_pesewas = NULLIF(p_cost_pesewas, 0)
  WHERE id = p_task_id;

  IF v_task.task_type = 'vaccination' AND v_task.product_name IS NOT NULL THEN
    UPDATE public.vaccination_schedule
    SET administered = true, administered_at = p_completed_at
    WHERE batch_id = v_task.batch_id
      AND vaccine_name = v_task.product_name
      AND COALESCE(administered, false) = false;
  END IF;

  IF v_has_withdrawal THEN
    UPDATE public.batches
    SET has_active_withdrawal = true
    WHERE id = v_task.batch_id AND farm_id = p_farm_id;
  END IF;

  SELECT production_system INTO v_system
  FROM public.batches WHERE id = v_task.batch_id;

  v_auto := COALESCE(v_system, 'intensive') IN ('intensive', 'deep_litter', 'cage');

  IF v_auto AND p_cost_pesewas > 0 THEN
    BEGIN
      INSERT INTO public.expenses (
        farm_id, batch_id, category, description, amount_pesewas, date,
        source, source_ref, payment_method, payment_status
      ) VALUES (
        p_farm_id, v_task.batch_id, 'health_and_medicine',
        COALESCE(v_task.product_name, 'Health task') || ' — completed',
        p_cost_pesewas, CURRENT_DATE,
        CASE WHEN v_task.task_type = 'vaccination' THEN 'auto:vaccination' ELSE 'auto:health' END,
        p_task_id::text, 'cash', 'paid'
      );
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END IF;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, v_task.batch_id, 'health_task_completed',
    'Completed ' || COALESCE(v_task.product_name, 'care task')
  );

  RETURN jsonb_build_object(
    'ok', true,
    'task_id', p_task_id,
    'has_withdrawal', v_has_withdrawal,
    'auto_ledgered', v_auto AND p_cost_pesewas > 0,
    'production_system', v_system,
    'withdrawal_meat_until', v_meat_until,
    'withdrawal_eggs_until', v_eggs_until
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_health_task(UUID, UUID, INT, TIMESTAMPTZ)
  TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- W2: confirm_day_feed
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_day_feed(
  p_farm_id UUID,
  p_batch_id UUID,
  p_quantity_kg NUMERIC,
  p_feed_type TEXT DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE,
  p_ledger BOOLEAN DEFAULT false,
  p_stock_item_id UUID DEFAULT NULL,
  p_unit_price_pesewas INT DEFAULT 0,
  p_skip_expense BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_expense_pesewas INT := 0;
  v_source_ref TEXT;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_quantity_kg IS NULL OR p_quantity_kg <= 0 THEN
    RAISE EXCEPTION 'quantity_kg must be positive';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.batches
    WHERE id = p_batch_id AND farm_id = p_farm_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'active batch not found';
  END IF;

  v_source_ref := 'day-feed:' || p_batch_id::text || ':' || p_date::text;

  INSERT INTO public.feed_logs (farm_id, batch_id, date, quantity_kg, feed_type)
  VALUES (p_farm_id, p_batch_id, p_date, p_quantity_kg, p_feed_type)
  ON CONFLICT (batch_id, date) DO NOTHING
  RETURNING id INTO v_log_id;

  IF v_log_id IS NULL THEN
    SELECT id INTO v_log_id FROM public.feed_logs WHERE batch_id = p_batch_id AND date = p_date;
    RETURN jsonb_build_object('ok', true, 'already_logged', true, 'feed_log_id', v_log_id);
  END IF;

  IF p_ledger AND p_stock_item_id IS NOT NULL THEN
    PERFORM public.allocate_fifo_by_quality(
      p_farm_id,
      p_stock_item_id,
      p_quantity_kg,
      p_batch_id,
      'Daily feeding ' || p_quantity_kg::text || 'kg',
      v_source_ref
    );

    UPDATE public.stock_items
    SET
      current_quantity = GREATEST(0, current_quantity - p_quantity_kg),
      updated_at = NOW()
    WHERE id = p_stock_item_id AND farm_id = p_farm_id;
  END IF;

  IF p_ledger AND NOT p_skip_expense AND p_unit_price_pesewas > 0 THEN
    v_expense_pesewas := ROUND(p_quantity_kg * p_unit_price_pesewas)::INT;
    BEGIN
      INSERT INTO public.expenses (
        farm_id, batch_id, category, description, amount_pesewas, date,
        source, source_ref, payment_method, payment_status
      ) VALUES (
        p_farm_id, p_batch_id, 'feed_and_nutrition',
        'Daily Feeding: ' || p_quantity_kg::text || 'kg ' || COALESCE(p_feed_type, 'feed'),
        v_expense_pesewas, p_date,
        'auto:feed', v_source_ref, 'cash', 'paid'
      );
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END IF;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, p_batch_id, 'feed_log',
    'Day feed ' || p_quantity_kg::text || 'kg'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'feed_log_id', v_log_id,
    'ledgered', p_ledger,
    'expense_pesewas', v_expense_pesewas,
    'source_ref', v_source_ref
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_day_feed(UUID, UUID, NUMERIC, TEXT, DATE, BOOLEAN, UUID, INT, BOOLEAN)
  TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- bulk_complete: sync vaccination_schedule for completed vaccination tasks
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
SET search_path = public
AS $$
DECLARE
  v_start_date DATE;
  v_week_start DATE;
  v_week_end   DATE;
  v_task_ids   UUID[] := '{}';
  v_skipped    INT    := 0;
  v_names      TEXT[];
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
    RETURNING id, product_name, task_type
  )
  SELECT
    COALESCE(ARRAY_AGG(id), '{}'),
    COALESCE(ARRAY_AGG(product_name) FILTER (WHERE task_type = 'vaccination' AND product_name IS NOT NULL), '{}')
  INTO v_task_ids, v_names
  FROM updated;

  IF array_length(v_names, 1) IS NOT NULL THEN
    UPDATE public.vaccination_schedule
    SET administered = true, administered_at = p_completed_at
    WHERE batch_id = p_batch_id
      AND COALESCE(administered, false) = false
      AND vaccine_name = ANY (v_names);
  END IF;

  RETURN jsonb_build_object(
    'completed_count', COALESCE(array_length(v_task_ids, 1), 0),
    'skipped_count',   v_skipped,
    'task_ids',        to_jsonb(v_task_ids),
    'vax_synced',      COALESCE(array_length(v_names, 1), 0)
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- N1: research ingredients gap-fill (toward 41)
-- ----------------------------------------------------------------------------
INSERT INTO public.ingredients (
  id, name, category, protein_pct, energy_kcal_per_kg, calcium_pct, phosphorus_pct,
  lysine_pct, methionine_pct, contains_gossypol, contains_aflatoxin_risk, max_share_pct
) VALUES
  ('pearl_millet', 'Pearl Millet', 'energy', 11.0, 3000, 0.05, 0.30, 0.25, 0.20, false, false, 40),
  ('cassava_hqcp', 'Cassava HQCP (processed)', 'energy', 3.5, 3000, 0.10, 0.10, 0.12, 0.05, false, false, 20),
  ('palm_oil', 'Palm Oil', 'energy', 0.0, 8800, 0.0, 0.0, 0.0, 0.0, false, false, 5),
  ('molasses', 'Molasses', 'energy', 4.0, 2400, 0.80, 0.08, 0.0, 0.0, false, false, 5),
  ('soybean_meal_48', 'Soybean Meal 48%', 'protein', 48.0, 2400, 0.30, 0.65, 2.90, 0.65, false, false, 30),
  ('fish_meal_72', 'Fish Meal 72%', 'protein', 72.0, 3000, 4.5, 2.8, 5.8, 2.1, false, false, 10),
  ('meat_bone_meal', 'Meat and Bone Meal', 'protein', 50.0, 2400, 10.0, 5.0, 2.5, 0.70, false, false, 10),
  ('bsf_larvae', 'Black Soldier Fly Larvae', 'protein', 42.0, 2400, 3.0, 0.90, 2.4, 0.85, false, false, 15),
  ('azolla', 'Azolla (Water Fern)', 'protein', 25.0, 1600, 1.5, 0.50, 1.0, 0.40, false, false, 10),
  ('sesame_cake', 'Sesame Seed Cake', 'protein', 40.0, 2200, 2.0, 1.10, 1.0, 1.10, false, false, 15),
  ('brewers_grains', 'Brewers Dried Grains', 'protein', 25.0, 1900, 0.30, 0.50, 0.8, 0.45, false, false, 10),
  ('bone_meal', 'Bone Meal', 'calcium', 12.0, 0, 24.0, 12.0, 0.0, 0.0, false, false, 5),
  ('mcp', 'Monocalcium Phosphate', 'calcium', 0.0, 0, 16.0, 21.0, 0.0, 0.0, false, false, 2),
  ('eggshell_meal', 'Eggshell Meal', 'calcium', 0.0, 0, 36.0, 0.0, 0.0, 0.0, false, false, 5),
  ('premix_broiler', 'Broiler Premix', 'supplement', 0.0, 0, 0.0, 0.0, 0.0, 0.0, false, false, 1),
  ('premix_layer', 'Layer Premix', 'supplement', 0.0, 0, 0.0, 0.0, 0.0, 0.0, false, false, 1),
  ('premix_waterfowl', 'Waterfowl Premix', 'supplement', 0.0, 0, 0.0, 0.0, 0.0, 0.0, false, false, 1),
  ('premix_turkey', 'Turkey Premix', 'supplement', 0.0, 0, 0.0, 0.0, 0.0, 0.0, false, false, 1),
  ('niacin_pure', 'Niacin (Vitamin B3)', 'supplement', 0.0, 0, 0.0, 0.0, 0.0, 0.0, false, false, 0.1),
  ('coccidiostat_feed', 'Coccidiostat (Feed)', 'supplement', 0.0, 0, 0.0, 0.0, 0.0, 0.0, false, false, 0.1),
  ('blackhead_prev_feed', 'Blackhead Preventive (Feed)', 'supplement', 0.0, 0, 0.0, 0.0, 0.0, 0.0, false, false, 0.1)
ON CONFLICT (id) DO NOTHING;

COMMENT ON FUNCTION public.complete_health_task IS
  'Atomic care complete: health_tasks + vaccination_schedule + optional intensive expense';
COMMENT ON FUNCTION public.confirm_day_feed IS
  'Atomic day feed: feed_logs + optional FIFO stock-out + expense (skip_expense for double-ledger)';
