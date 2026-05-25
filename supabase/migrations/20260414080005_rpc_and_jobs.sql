-- Migration 8: RPC Database Functions and Scheduled Jobs
BEGIN;

-- Unique constraint for idempotent batch_tasks
ALTER TABLE public.batch_tasks DROP CONSTRAINT IF EXISTS batch_tasks_batch_due_type_uniq;
ALTER TABLE public.batch_tasks ADD CONSTRAINT batch_tasks_batch_due_type_uniq UNIQUE (batch_id, due_date, task_type);

-- ----------------------------------------------------
-- 1. Helper function for phase boundaries
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_batch_phase(
  p_species TEXT,
  p_duck_type TEXT,
  p_week INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_species = 'broiler' THEN
    IF p_week <= 1 THEN RETURN 'brooding';
    ELSIF p_week <= 3 THEN RETURN 'starter';
    ELSIF p_week <= 5 THEN RETURN 'grower';
    ELSE RETURN 'finisher';
    END IF;
  ELSIF p_species = 'layer' THEN
    IF p_week <= 4 THEN RETURN 'brooding';
    ELSIF p_week <= 8 THEN RETURN 'starter';
    ELSIF p_week <= 18 THEN RETURN 'grower';
    ELSE RETURN 'finisher';
    END IF;
  ELSIF p_species = 'duck' THEN
    IF p_duck_type = 'layer' THEN
      IF p_week <= 4 THEN RETURN 'brooding';
      ELSIF p_week <= 8 THEN RETURN 'starter';
      ELSIF p_week <= 19 THEN RETURN 'grower';
      ELSE RETURN 'finisher';
      END IF;
    ELSE -- meat duck
      IF p_week <= 1 THEN RETURN 'brooding';
      ELSIF p_week <= 3 THEN RETURN 'starter';
      ELSIF p_week <= 6 THEN RETURN 'grower';
      ELSE RETURN 'finisher';
      END IF;
    END IF;
  ELSIF p_species = 'turkey' THEN
    IF p_week <= 4 THEN RETURN 'brooding';
    ELSIF p_week <= 8 THEN RETURN 'starter';
    ELSIF p_week <= 12 THEN RETURN 'grower';
    ELSE RETURN 'finisher';
    END IF;
  ELSE -- other
    IF p_week <= 2 THEN RETURN 'brooding';
    ELSIF p_week <= 6 THEN RETURN 'starter';
    ELSIF p_week <= 12 THEN RETURN 'grower';
    ELSE RETURN 'finisher';
    END IF;
  END IF;
END;
$$;

-- ----------------------------------------------------
-- 2. Cron: advance-batch-weeks
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.cron_advance_batch_weeks()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_farm RECORD;
  v_batch RECORD;
  v_new_week INTEGER;
  v_new_phase TEXT;
BEGIN
  FOR v_farm IN SELECT id, timezone FROM public.farms LOOP
    -- Sunday 00:00 - 01:00 in farm timezone
    IF EXTRACT(dow FROM now() AT TIME ZONE v_farm.timezone) = 0 
       AND EXTRACT(hour FROM now() AT TIME ZONE v_farm.timezone) = 0 THEN
       
      FOR v_batch IN 
        SELECT id, species, duck_type, current_week, current_day 
        FROM public.batches 
        WHERE farm_id = v_farm.id AND status = 'active'
      LOOP
        v_new_week := v_batch.current_week + 1;
        v_new_phase := public.recompute_batch_phase(v_batch.species, v_batch.duck_type, v_new_week);
        
        UPDATE public.batches
        SET current_week = v_new_week,
            current_day = COALESCE(current_day, 1) + 7,
            phase = v_new_phase,
            updated_at = NOW()
        WHERE id = v_batch.id AND current_week = v_batch.current_week;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- ----------------------------------------------------
-- 3. Cron: check-withdrawal-periods
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.cron_check_withdrawal_periods()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.batches b
  SET has_active_withdrawal = false,
      updated_at = NOW()
  WHERE b.status = 'active'
    AND b.has_active_withdrawal = true
    AND NOT EXISTS (
      SELECT 1 FROM public.health_tasks ht
      WHERE ht.batch_id = b.id
        AND ht.completed = true
        AND (ht.withdrawal_meat_until >= CURRENT_DATE OR ht.withdrawal_eggs_until >= CURRENT_DATE)
    );
END;
$$;

-- ----------------------------------------------------
-- 4. Cron: generate-daily-tasks
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.cron_generate_daily_tasks()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_farm RECORD;
  v_batch RECORD;
  v_today DATE;
BEGIN
  FOR v_farm IN SELECT id, timezone FROM public.farms LOOP
    -- Runs at 06:00 - 07:00 local time in farm timezone
    IF EXTRACT(hour FROM now() AT TIME ZONE v_farm.timezone) = 6 THEN
      v_today := (now() AT TIME ZONE v_farm.timezone)::date;
      
      FOR v_batch IN 
        SELECT id, species, duck_type, current_week 
        FROM public.batches 
        WHERE farm_id = v_farm.id AND status = 'active'
      LOOP
        -- Daily feed recording task
        INSERT INTO public.batch_tasks (batch_id, farm_id, title, description, due_date, task_type, completed)
        VALUES (v_batch.id, v_farm.id, 'Daily Feed', 'Record daily feed consumption', v_today, 'feed_log', false)
        ON CONFLICT ON CONSTRAINT batch_tasks_batch_due_type_uniq DO NOTHING;

        -- Daily water recording task
        INSERT INTO public.batch_tasks (batch_id, farm_id, title, description, due_date, task_type, completed)
        VALUES (v_batch.id, v_farm.id, 'Daily Water', 'Record daily water and health intake', v_today, 'water_log', false)
        ON CONFLICT ON CONSTRAINT batch_tasks_batch_due_type_uniq DO NOTHING;

        -- Daily egg collection task (if of laying age)
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
    END IF;
  END LOOP;
END;
$$;

-- ----------------------------------------------------
-- 5. Cron: prune-idempotency-keys
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.cron_prune_idempotency_keys()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.idempotency_keys
  WHERE expires_at < NOW();
END;
$$;

-- ----------------------------------------------------
-- 6. RPC: get_dashboard_overview
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_overview(p_farm_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_greeting JSONB;
  v_quick_stats JSONB;
  v_active_batches JSONB;
  v_recent_activity JSONB;
  v_sync_state JSONB;
  v_currency TEXT;
  v_cost_privacy BOOLEAN;
  v_user_id UUID;
BEGIN
  -- Get farm currency and user_id
  SELECT currency, user_id INTO v_currency, v_user_id
  FROM public.farms
  WHERE id = p_farm_id;

  -- Get cost privacy setting
  SELECT COALESCE(cost_privacy_enabled, false) INTO v_cost_privacy
  FROM public.user_preferences
  WHERE user_id = v_user_id;

  -- Build Greeting
  v_greeting := jsonb_build_object(
    'user_name', COALESCE((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = v_user_id), 'Farmer'),
    'farm_name', COALESCE((SELECT name FROM public.farms WHERE id = p_farm_id), 'My Farm')
  );

  -- Build Quick Stats
  v_quick_stats := jsonb_build_object(
    'active_batches_count', (
      SELECT COUNT(*)::INT 
      FROM public.batches 
      WHERE farm_id = p_farm_id AND status = 'active'
    ),
    'tasks_today_count', (
      (SELECT COUNT(*)::INT FROM public.batch_tasks WHERE farm_id = p_farm_id AND completed = false AND due_date <= CURRENT_DATE) +
      (SELECT COUNT(*)::INT FROM public.health_tasks WHERE farm_id = p_farm_id AND completed = false AND scheduled_date <= CURRENT_DATE)
    ),
    'weekly_expenses_pesewas', COALESCE(
      (SELECT SUM(amount_pesewas)::INT FROM public.expenses WHERE farm_id = p_farm_id AND date >= (CURRENT_DATE - INTERVAL '7 days')::date),
      0
    ),
    'monthly_revenue_pesewas', COALESCE(
      (SELECT SUM(amount_pesewas)::INT FROM public.revenue WHERE farm_id = p_farm_id AND date >= date_trunc('month', CURRENT_DATE)::date),
      0
    )
  );

  -- Build Active Batches
  SELECT COALESCE(jsonb_agg(b_json), '[]'::jsonb) INTO v_active_batches
  FROM (
    SELECT jsonb_build_object(
      'batch_id', b.id,
      'species', b.species,
      'duck_type', b.duck_type,
      'name', b.name,
      'house_name', COALESCE(h.name, 'No House'),
      'current_week', b.current_week,
      'current_day_of_week', COALESCE(((b.current_day - 1) % 7) + 1, 1),
      'phase', b.phase,
      'population_current', b.current_population,
      'population_initial', b.initial_quantity,
      'pending_tasks_count', (
        (SELECT COUNT(*)::INT FROM public.batch_tasks WHERE batch_id = b.id AND completed = false) +
        (SELECT COUNT(*)::INT FROM public.health_tasks WHERE batch_id = b.id AND completed = false)
      ),
      'has_overdue', (
        EXISTS (SELECT 1 FROM public.batch_tasks WHERE batch_id = b.id AND completed = false AND due_date < CURRENT_DATE) OR
        EXISTS (SELECT 1 FROM public.health_tasks WHERE batch_id = b.id AND completed = false AND scheduled_date < CURRENT_DATE)
      ),
      'in_withdrawal', b.has_active_withdrawal
    ) AS b_json
    FROM public.batches b
    LEFT JOIN public.houses h ON b.house_id = h.id
    WHERE b.farm_id = p_farm_id AND b.status = 'active'
    ORDER BY b.created_at DESC
  ) active_b;

  -- Build Recent Activity
  SELECT COALESCE(jsonb_agg(act_json), '[]'::jsonb) INTO v_recent_activity
  FROM (
    SELECT jsonb_build_object(
      'event_id', id,
      'event_type', COALESCE(event_type, 'activity'),
      'summary', description,
      'occurred_at', created_at,
      'batch_id', batch_id
    ) AS act_json
    FROM public.activity_log
    WHERE farm_id = p_farm_id
    ORDER BY created_at DESC
    LIMIT 5
  ) recent_act;

  -- Build Sync State
  v_sync_state := jsonb_build_object(
    'is_online', true,
    'pending_writes_count', 0,
    'last_synced_at', NOW()
  );

  -- Return combined result
  RETURN jsonb_build_object(
    'greeting', v_greeting,
    'quick_stats', v_quick_stats,
    'active_batches', v_active_batches,
    'recent_activity', v_recent_activity,
    'sync_state', v_sync_state,
    'currency', v_currency,
    'cost_privacy_enabled', v_cost_privacy
  );
END;
$$;

-- ----------------------------------------------------
-- 7. RPC: get_batch_record_summary
-- ----------------------------------------------------
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
    COALESCE((SELECT SUM(total_eggs)::INTEGER FROM public.egg_records WHERE egg_records.batch_id = b.id AND egg_records.farm_id = p_farm_id), 0) AS total_eggs,
    COALESCE((SELECT SUM(amount_pesewas)::BIGINT FROM public.expenses WHERE expenses.batch_id = b.id AND expenses.farm_id = p_farm_id), 0::bigint) AS total_expenses_pesewas,
    COALESCE((SELECT SUM(amount_pesewas)::BIGINT FROM public.revenue WHERE revenue.batch_id = b.id AND revenue.farm_id = p_farm_id), 0::bigint) AS total_revenue_pesewas
  FROM public.batches b
  WHERE b.farm_id = p_farm_id AND b.id = ANY(p_batch_ids);
END;
$$;

-- ----------------------------------------------------
-- 8. RPC: get_egg_inventory
-- ----------------------------------------------------
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
  FROM public.egg_records
  WHERE batch_id = p_batch_id AND farm_id = p_farm_id;

  SELECT COALESCE(SUM(quantity), 0) INTO v_sold
  FROM public.egg_sales
  WHERE batch_id = p_batch_id AND farm_id = p_farm_id;

  RETURN GREATEST(0, v_collected - v_sold);
END;
$$;

-- ----------------------------------------------------
-- 9. RPC: allocate_fifo_by_quality
-- ----------------------------------------------------
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
AS $$
DECLARE
  v_remaining NUMERIC := p_qty_needed;
  v_lot RECORD;
  v_allocated NUMERIC;
BEGIN
  -- FOR UPDATE row locking on stock_lots matching the criteria
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

    -- Allocate the minimum of remaining and qty_on_hand
    v_allocated := LEAST(v_remaining, v_lot.qty_on_hand);
    
    -- Update the lot's qty_on_hand
    UPDATE public.stock_lots 
    SET qty_on_hand = qty_on_hand - v_allocated
    WHERE id = v_lot.id;

    -- Insert into stock_allocations
    INSERT INTO public.stock_allocations (
      farm_id,
      lot_id,
      qty_allocated,
      batch_id,
      reason,
      source_ref
    ) VALUES (
      p_farm_id,
      v_lot.id,
      v_allocated,
      p_batch_id,
      p_reason,
      p_source_ref
    );

    -- Return the allocation
    allocated_lot_id := v_lot.id;
    qty_from_lot := v_allocated;
    RETURN NEXT;

    v_remaining := v_remaining - v_allocated;
  END LOOP;

  -- Verify allocation was completed fully
  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient stock available for allocation';
  END IF;
END;
$$;

-- ----------------------------------------------------
-- 10. Register pg_cron background jobs
-- ----------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  -- Perform cron schedules if extension cron exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unsched before resched to ensure idempotency
    BEGIN
      PERFORM cron.unschedule('advance-batch-weeks-job');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      PERFORM cron.unschedule('check-withdrawal-periods-job');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      PERFORM cron.unschedule('generate-daily-tasks-job');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      PERFORM cron.unschedule('prune-idempotency-keys-job');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- Perform schedules
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('advance-batch-weeks-job', '0 * * * *', 'SELECT public.cron_advance_batch_weeks();');
    PERFORM cron.schedule('check-withdrawal-periods-job', '0 */4 * * *', 'SELECT public.cron_check_withdrawal_periods();');
    PERFORM cron.schedule('generate-daily-tasks-job', '0 * * * *', 'SELECT public.cron_generate_daily_tasks();');
    PERFORM cron.schedule('prune-idempotency-keys-job', '0 3 * * *', 'SELECT public.cron_prune_idempotency_keys();');
  END IF;
END $$;

COMMIT;

