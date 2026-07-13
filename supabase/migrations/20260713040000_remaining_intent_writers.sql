-- =============================================================================
-- Remaining atomic intent writers (no skip)
-- W3 log_day_water | W4 stock_purchase | W5 record_egg_sale
-- W6 create_batch | W7 terminate_batch | W8 record_mortality
-- T4 bulk_complete expense + withdrawal synergy
-- =============================================================================

-- ----------------------------------------------------------------------------
-- W3: log_day_water — water_records + optional intensive utility expense
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_day_water(
  p_farm_id UUID,
  p_batch_id UUID,
  p_gallons NUMERIC,
  p_temperature_c NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE,
  p_ledger BOOLEAN DEFAULT false,
  p_rate_per_liter_pesewas INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_liters NUMERIC;
  v_expense_pesewas INT := 0;
  v_source_ref TEXT;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_gallons IS NULL OR p_gallons <= 0 THEN
    RAISE EXCEPTION 'gallons must be positive';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.batches
    WHERE id = p_batch_id AND farm_id = p_farm_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'active batch not found';
  END IF;

  INSERT INTO public.water_records (
    farm_id, batch_id, date, gallons_consumed, temperature_c, notes
  ) VALUES (
    p_farm_id, p_batch_id, p_date, p_gallons, p_temperature_c, p_notes
  )
  RETURNING id INTO v_id;

  v_liters := p_gallons * 3.785;
  v_source_ref := 'water:' || v_id::text;

  IF p_ledger AND p_rate_per_liter_pesewas > 0 THEN
    v_expense_pesewas := ROUND(v_liters * p_rate_per_liter_pesewas)::INT;
    BEGIN
      INSERT INTO public.expenses (
        farm_id, batch_id, category, description, amount_pesewas, date,
        source, source_ref, payment_method, payment_status
      ) VALUES (
        p_farm_id, p_batch_id, 'utilities_and_services',
        'Water consumption: ' || p_gallons::text || ' gal (' || ROUND(v_liters, 1)::text || 'L)',
        v_expense_pesewas, p_date,
        'auto:water', v_source_ref, 'cash', 'paid'
      );
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END IF;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, p_batch_id, 'water_log',
    'Water ' || p_gallons::text || ' gal'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'water_record_id', v_id,
    'expense_pesewas', v_expense_pesewas,
    'source_ref', v_source_ref
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_day_water(UUID, UUID, NUMERIC, NUMERIC, TEXT, DATE, BOOLEAN, INT)
  TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- W4: stock_purchase — tx + lot + qty + expense in one transaction
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stock_purchase(
  p_farm_id UUID,
  p_stock_item_id UUID,
  p_qty NUMERIC,
  p_unit_price_pesewas INT DEFAULT 0,
  p_notes TEXT DEFAULT NULL,
  p_quality_grade TEXT DEFAULT 'A',
  p_expiry_date DATE DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_expense_category TEXT DEFAULT 'other_expenses'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.stock_items%ROWTYPE;
  v_tx_id UUID;
  v_new_qty NUMERIC;
  v_total_pesewas INT;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'qty must be positive';
  END IF;

  SELECT * INTO v_item
  FROM public.stock_items
  WHERE id = p_stock_item_id AND farm_id = p_farm_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'stock item not found';
  END IF;

  v_new_qty := v_item.current_quantity + p_qty;
  v_total_pesewas := ROUND(p_qty * COALESCE(p_unit_price_pesewas, 0))::INT;

  INSERT INTO public.stock_transactions (
    farm_id, stock_item_id, transaction_type, quantity,
    unit_price_pesewas, total_cost_pesewas, notes
  ) VALUES (
    p_farm_id, p_stock_item_id, 'purchase', p_qty,
    NULLIF(p_unit_price_pesewas, 0), NULLIF(v_total_pesewas, 0), p_notes
  )
  RETURNING id INTO v_tx_id;

  INSERT INTO public.stock_lots (
    farm_id, stock_item_id, qty_on_hand, unit_price_pesewas,
    quality_grade, expiry_date, received_at
  ) VALUES (
    p_farm_id, p_stock_item_id, p_qty, COALESCE(p_unit_price_pesewas, 0),
    COALESCE(NULLIF(p_quality_grade, ''), 'A'), p_expiry_date, NOW()
  );

  UPDATE public.stock_items
  SET
    current_quantity = v_new_qty,
    unit_price_pesewas = CASE
      WHEN p_unit_price_pesewas > 0 THEN p_unit_price_pesewas
      ELSE unit_price_pesewas
    END,
    updated_at = NOW()
  WHERE id = p_stock_item_id;

  IF p_unit_price_pesewas > 0 THEN
    BEGIN
      INSERT INTO public.expenses (
        farm_id, batch_id, category, description, amount_pesewas, date,
        source, source_ref, payment_method, payment_status
      ) VALUES (
        p_farm_id, p_batch_id, COALESCE(NULLIF(p_expense_category, ''), 'other_expenses'),
        'Purchase: ' || p_qty::text || ' ' || COALESCE(v_item.unit, 'unit') || ' of ' || v_item.name,
        v_total_pesewas, CURRENT_DATE,
        'auto:stock', v_tx_id::text, 'cash', 'paid'
      );
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END IF;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, p_batch_id, 'stock_transaction',
    'PURCHASE: ' || p_qty::text || ' ' || COALESCE(v_item.unit, 'unit') || ' of ' || v_item.name
  );

  RETURN jsonb_build_object(
    'ok', true,
    'transaction_id', v_tx_id,
    'new_quantity', v_new_qty,
    'expense_pesewas', CASE WHEN p_unit_price_pesewas > 0 THEN v_total_pesewas ELSE 0 END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.stock_purchase(UUID, UUID, NUMERIC, INT, TEXT, TEXT, DATE, UUID, TEXT)
  TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- W5: record_egg_sale — inventory check + egg_sales + revenue
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_egg_sale(
  p_farm_id UUID,
  p_batch_id UUID,
  p_quantity INT,
  p_crates_sold INT DEFAULT 0,
  p_looses_sold INT DEFAULT 0,
  p_size_category TEXT DEFAULT 'medium',
  p_price_per_crate_pesewas INT DEFAULT 0,
  p_price_per_loose_pesewas INT DEFAULT 0,
  p_total_revenue_pesewas INT DEFAULT 0,
  p_buyer TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'cash',
  p_payment_status TEXT DEFAULT 'paid',
  p_notes TEXT DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id UUID;
  v_on_hand INT := 0;
  v_has_withdrawal BOOLEAN := false;
  v_meat_until DATE;
  v_eggs_until DATE;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'quantity must be positive';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.batches
    WHERE id = p_batch_id AND farm_id = p_farm_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'active batch not found';
  END IF;

  -- Fail closed on active egg withdrawal
  SELECT EXISTS (
    SELECT 1 FROM public.health_tasks
    WHERE batch_id = p_batch_id
      AND completed = true
      AND withdrawal_eggs_until IS NOT NULL
      AND withdrawal_eggs_until >= CURRENT_DATE
  ) INTO v_has_withdrawal;

  IF v_has_withdrawal THEN
    RAISE EXCEPTION 'cannot record egg sale during active medication withdrawal';
  END IF;

  -- Inventory: prefer graded when size provided
  BEGIN
    SELECT public.get_graded_egg_inventory(p_batch_id, p_farm_id, p_size_category)::INT INTO v_on_hand;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      SELECT public.get_egg_inventory(p_batch_id, p_farm_id)::INT INTO v_on_hand;
    EXCEPTION WHEN OTHERS THEN
      v_on_hand := 0;
    END;
  END;

  IF v_on_hand < p_quantity THEN
    RAISE EXCEPTION 'insufficient eggs: on hand %, requested %', v_on_hand, p_quantity;
  END IF;

  INSERT INTO public.egg_sales (
    farm_id, batch_id, quantity, crates_sold, looses_sold, size_category,
    price_per_crate_pesewas, price_per_loose_pesewas, total_revenue_pesewas,
    buyer, payment_method, notes, date
  ) VALUES (
    p_farm_id, p_batch_id, p_quantity, p_crates_sold, p_looses_sold, p_size_category,
    p_price_per_crate_pesewas, p_price_per_loose_pesewas, p_total_revenue_pesewas,
    p_buyer, COALESCE(p_payment_method, 'cash'), p_notes, p_date
  )
  RETURNING id INTO v_sale_id;

  IF p_total_revenue_pesewas > 0 THEN
    BEGIN
      INSERT INTO public.revenue (
        farm_id, batch_id, category, description, amount_pesewas, date,
        buyer, source, source_ref, payment_method, payment_status
      ) VALUES (
        p_farm_id, p_batch_id, 'egg_sales',
        'Egg sale: ' || p_crates_sold::text || ' crates & ' || p_looses_sold::text
          || ' looses (' || COALESCE(p_size_category, 'medium') || ')',
        p_total_revenue_pesewas, p_date,
        p_buyer, 'auto:eggs', v_sale_id::text,
        COALESCE(p_payment_method, 'cash'), COALESCE(p_payment_status, 'paid')
      );
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END IF;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, p_batch_id, 'egg_sale',
    'Sold ' || p_quantity::text || ' eggs'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'sale_id', v_sale_id,
    'on_hand_before', v_on_hand,
    'revenue_pesewas', p_total_revenue_pesewas
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_egg_sale(
  UUID, UUID, INT, INT, INT, TEXT, INT, INT, INT, TEXT, TEXT, TEXT, TEXT, DATE
) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- W6: create_batch — batch + house occupy + optional seed JSON + activity
-- p_health_tasks / p_vaccinations: jsonb arrays of row objects
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_batch(
  p_farm_id UUID,
  p_name TEXT,
  p_species TEXT,
  p_house_id UUID,
  p_production_system TEXT,
  p_initial_quantity INT,
  p_start_date DATE,
  p_cycle_length_weeks INT,
  p_current_week INT DEFAULT 1,
  p_current_day INT DEFAULT 1,
  p_phase TEXT DEFAULT 'starter',
  p_duck_type TEXT DEFAULT NULL,
  p_health_tasks JSONB DEFAULT '[]'::jsonb,
  p_vaccinations JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id UUID;
  v_tasks_n INT := 0;
  v_vax_n INT := 0;
  v_elem JSONB;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'name is required';
  END IF;
  IF p_initial_quantity IS NULL OR p_initial_quantity <= 0 THEN
    RAISE EXCEPTION 'initial_quantity must be positive';
  END IF;
  IF p_species = 'duck' AND (p_duck_type IS NULL OR p_duck_type NOT IN ('meat', 'layer')) THEN
    RAISE EXCEPTION 'duck_type required for duck batches';
  END IF;

  -- House must exist, belong to farm, and be free
  IF NOT EXISTS (
    SELECT 1 FROM public.houses
    WHERE id = p_house_id AND farm_id = p_farm_id AND occupied_by_batch_id IS NULL
  ) THEN
    RAISE EXCEPTION 'house not available';
  END IF;

  INSERT INTO public.batches (
    farm_id, name, species, duck_type, house_id, production_system,
    initial_quantity, current_population, start_date, cycle_length_weeks,
    current_week, current_day, status, phase
  ) VALUES (
    p_farm_id, trim(p_name), p_species,
    CASE WHEN p_species = 'duck' THEN p_duck_type ELSE NULL END,
    p_house_id, p_production_system,
    p_initial_quantity, p_initial_quantity, p_start_date, p_cycle_length_weeks,
    p_current_week, p_current_day, 'active', p_phase
  )
  RETURNING id INTO v_batch_id;

  UPDATE public.houses
  SET occupied_by_batch_id = v_batch_id
  WHERE id = p_house_id AND farm_id = p_farm_id;

  IF p_health_tasks IS NOT NULL AND jsonb_typeof(p_health_tasks) = 'array' THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_health_tasks)
    LOOP
      INSERT INTO public.health_tasks (
        batch_id, farm_id, task_type, product_name, medication_id,
        delivery_method, scheduled_date, duration_days,
        withdrawal_meat_days, withdrawal_egg_days, notes, completed
      ) VALUES (
        v_batch_id, p_farm_id,
        COALESCE(v_elem->>'task_type', 'medication'),
        v_elem->>'product_name',
        NULLIF(v_elem->>'medication_id', '')::UUID,
        v_elem->>'delivery_method',
        COALESCE((v_elem->>'scheduled_date')::DATE, p_start_date),
        COALESCE((v_elem->>'duration_days')::INT, 1),
        COALESCE((v_elem->>'withdrawal_meat_days')::INT, 0),
        COALESCE((v_elem->>'withdrawal_egg_days')::INT, 0),
        v_elem->>'notes',
        false
      );
      v_tasks_n := v_tasks_n + 1;
    END LOOP;
  END IF;

  IF p_vaccinations IS NOT NULL AND jsonb_typeof(p_vaccinations) = 'array' THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_vaccinations)
    LOOP
      INSERT INTO public.vaccination_schedule (
        batch_id, farm_id, vaccine_name, scheduled_week, scheduled_date
      ) VALUES (
        v_batch_id, p_farm_id,
        v_elem->>'vaccine_name',
        COALESCE((v_elem->>'scheduled_week')::INT, 1),
        COALESCE((v_elem->>'scheduled_date')::DATE, p_start_date)
      );
      v_vax_n := v_vax_n + 1;
    END LOOP;
  END IF;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, v_batch_id, 'batch_created',
    'Created new ' || p_species || ' flock: "' || trim(p_name) || '" (' || p_initial_quantity::text || ' birds)'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'batch_id', v_batch_id,
    'health_tasks_seeded', v_tasks_n,
    'vaccinations_seeded', v_vax_n
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_batch(
  UUID, TEXT, TEXT, UUID, TEXT, INT, DATE, INT, INT, INT, TEXT, TEXT, JSONB, JSONB
) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- W7: terminate_batch — status + house release + optional revenue + cleanup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.terminate_batch(
  p_farm_id UUID,
  p_batch_id UUID,
  p_mode TEXT DEFAULT 'normal',
  p_revenue_pesewas INT DEFAULT 0,
  p_revenue_category TEXT DEFAULT 'bird_sales'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch public.batches%ROWTYPE;
  v_mode TEXT;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  v_mode := CASE WHEN p_mode IN ('normal', 'emergency') THEN p_mode ELSE 'normal' END;

  SELECT * INTO v_batch
  FROM public.batches
  WHERE id = p_batch_id AND farm_id = p_farm_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'batch not found';
  END IF;

  IF v_batch.status = 'completed' THEN
    RETURN jsonb_build_object('ok', true, 'already_terminated', true, 'batch_id', p_batch_id);
  END IF;

  -- Normal mode fail-closed on active withdrawal
  IF v_mode = 'normal' AND COALESCE(v_batch.has_active_withdrawal, false) THEN
    RAISE EXCEPTION 'cannot terminate normally during active withdrawal; use emergency';
  END IF;

  UPDATE public.batches
  SET
    status = 'completed',
    phase = 'terminated',
    termination_reason = v_mode,
    updated_at = NOW()
  WHERE id = p_batch_id;

  IF v_batch.house_id IS NOT NULL THEN
    UPDATE public.houses
    SET occupied_by_batch_id = NULL
    WHERE id = v_batch.house_id AND farm_id = p_farm_id;
  END IF;

  IF p_revenue_pesewas > 0 THEN
    BEGIN
      INSERT INTO public.revenue (
        farm_id, batch_id, category, description, amount_pesewas, date,
        source, source_ref, payment_method, payment_status
      ) VALUES (
        p_farm_id, p_batch_id, COALESCE(NULLIF(p_revenue_category, ''), 'bird_sales'),
        'Auto-revenue: Sold birds from terminated batch "' || v_batch.name || '" (' || v_mode || ' culling)',
        p_revenue_pesewas, CURRENT_DATE,
        'auto:batch', p_batch_id::text || ':terminate', 'cash', 'paid'
      );
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END IF;

  -- Cleanup pending care (same as client cleanupBatchCompletion)
  UPDATE public.feed_schedules
  SET completed = true, completed_at = NOW()
  WHERE batch_id = p_batch_id AND completed = false;

  UPDATE public.vaccination_schedule
  SET administered = true, administered_at = NOW()
  WHERE batch_id = p_batch_id AND COALESCE(administered, false) = false;

  UPDATE public.health_tasks
  SET completed = true, completed_at = NOW()
  WHERE batch_id = p_batch_id AND completed = false;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, p_batch_id, 'batch_completed',
    'Flock "' || v_batch.name || '" terminated (' || v_mode || ' mode)'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'batch_id', p_batch_id,
    'mode', v_mode,
    'house_released', v_batch.house_id IS NOT NULL,
    'revenue_pesewas', p_revenue_pesewas
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.terminate_batch(UUID, UUID, TEXT, INT, TEXT)
  TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- W8: record_mortality — mortality row + population + activity
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_mortality(
  p_farm_id UUID,
  p_batch_id UUID,
  p_count INT,
  p_cause TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch public.batches%ROWTYPE;
  v_new_pop INT;
  v_mr_id UUID;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_count IS NULL OR p_count <= 0 THEN
    RAISE EXCEPTION 'count must be positive';
  END IF;

  SELECT * INTO v_batch
  FROM public.batches
  WHERE id = p_batch_id AND farm_id = p_farm_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'batch not found';
  END IF;

  IF v_batch.status <> 'active' THEN
    RAISE EXCEPTION 'batch is not active';
  END IF;

  IF p_count > v_batch.current_population THEN
    RAISE EXCEPTION 'mortality count % exceeds population %', p_count, v_batch.current_population;
  END IF;

  INSERT INTO public.mortality_records (batch_id, farm_id, count, cause, notes)
  VALUES (p_batch_id, p_farm_id, p_count, p_cause, p_notes)
  RETURNING id INTO v_mr_id;

  v_new_pop := GREATEST(0, v_batch.current_population - p_count);

  UPDATE public.batches
  SET current_population = v_new_pop, updated_at = NOW()
  WHERE id = p_batch_id;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, p_batch_id, 'mortality',
    'Recorded ' || p_count::text || ' mortality in ' || v_batch.name
      || CASE WHEN p_cause IS NOT NULL AND p_cause <> '' THEN ': ' || p_cause ELSE '' END
  );

  RETURN jsonb_build_object(
    'ok', true,
    'mortality_id', v_mr_id,
    'new_population', v_new_pop
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_mortality(UUID, UUID, INT, TEXT, TEXT)
  TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- T4: bulk_complete — vax sync + intensive expense when cost_pesewas set
--     + withdrawal flags on batch
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
  v_system     TEXT;
  v_auto       BOOLEAN := false;
  v_has_wd     BOOLEAN := false;
  r            RECORD;
  v_expenses   INT := 0;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  SELECT start_date, production_system INTO v_start_date, v_system
  FROM public.batches
  WHERE id = p_batch_id AND farm_id = p_farm_id;

  IF v_start_date IS NULL THEN
    RETURN jsonb_build_object('completed_count', 0, 'skipped_count', 0, 'task_ids', '[]'::jsonb);
  END IF;

  v_auto := COALESCE(v_system, 'intensive') IN ('intensive', 'deep_litter', 'cage');
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
    SET
      completed    = true,
      completed_at = p_completed_at,
      withdrawal_meat_until = CASE
        WHEN COALESCE(withdrawal_meat_days, 0) > 0
        THEN (p_completed_at::date + withdrawal_meat_days)
        ELSE withdrawal_meat_until
      END,
      withdrawal_eggs_until = CASE
        WHEN COALESCE(withdrawal_egg_days, 0) > 0
        THEN (p_completed_at::date + withdrawal_egg_days)
        ELSE withdrawal_eggs_until
      END
    WHERE batch_id   = p_batch_id
      AND farm_id    = p_farm_id
      AND completed  = false
      AND scheduled_date BETWEEN v_week_start AND v_week_end
    RETURNING id, product_name, task_type, cost_pesewas,
              withdrawal_meat_days, withdrawal_egg_days
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

  -- Withdrawal flag on batch if any completed task this week has WD
  SELECT EXISTS (
    SELECT 1 FROM public.health_tasks
    WHERE batch_id = p_batch_id
      AND id = ANY (v_task_ids)
      AND (
        COALESCE(withdrawal_meat_days, 0) > 0
        OR COALESCE(withdrawal_egg_days, 0) > 0
      )
  ) INTO v_has_wd;

  IF v_has_wd THEN
    UPDATE public.batches
    SET has_active_withdrawal = true
    WHERE id = p_batch_id AND farm_id = p_farm_id;
  END IF;

  -- Intensive expense synergy for tasks that already carry cost_pesewas
  IF v_auto AND array_length(v_task_ids, 1) IS NOT NULL THEN
    FOR r IN
      SELECT id, product_name, task_type, cost_pesewas
      FROM public.health_tasks
      WHERE id = ANY (v_task_ids)
        AND COALESCE(cost_pesewas, 0) > 0
    LOOP
      BEGIN
        INSERT INTO public.expenses (
          farm_id, batch_id, category, description, amount_pesewas, date,
          source, source_ref, payment_method, payment_status
        ) VALUES (
          p_farm_id, p_batch_id, 'health_and_medicine',
          COALESCE(r.product_name, 'Health task') || ' — bulk complete',
          r.cost_pesewas, CURRENT_DATE,
          CASE WHEN r.task_type = 'vaccination' THEN 'auto:vaccination' ELSE 'auto:health' END,
          r.id::text, 'cash', 'paid'
        );
        v_expenses := v_expenses + 1;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'completed_count', COALESCE(array_length(v_task_ids, 1), 0),
    'skipped_count',   v_skipped,
    'task_ids',        to_jsonb(v_task_ids),
    'vax_synced',      COALESCE(array_length(v_names, 1), 0),
    'expenses_created', v_expenses,
    'withdrawal_flagged', v_has_wd
  );
END;
$$;

COMMENT ON FUNCTION public.log_day_water IS
  'Atomic water log + optional intensive utility expense';
COMMENT ON FUNCTION public.stock_purchase IS
  'Atomic stock purchase: transaction + lot + qty + expense';
COMMENT ON FUNCTION public.record_egg_sale IS
  'Atomic egg sale: inventory check + sale + revenue (withdrawal fail-closed)';
COMMENT ON FUNCTION public.create_batch IS
  'Atomic create: batch + house occupy + optional care/vax seed JSON';
COMMENT ON FUNCTION public.terminate_batch IS
  'Atomic terminate: status + house release + optional revenue + care cleanup';
COMMENT ON FUNCTION public.record_mortality IS
  'Atomic mortality: record + population decrement + activity';
COMMENT ON FUNCTION public.bulk_complete_health_tasks IS
  'Bulk complete week: tasks + vax sync + withdrawal flag + intensive expenses when cost set';
