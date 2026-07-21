-- =============================================================================
-- QA HARDENING SPINE (2026-07-21)
-- Closes open QA findings:
--   F-G-002  egg week gate enforced server-side (was client-only)
--   C-W-U04  water_records unique day constraint + idempotent log_day_water
--   C-F-U16  insufficient stock fail-closed in confirm_day_feed
--   F-E-004  ready-made purchase stocks-in bags (stock item + lot + txn)
--   F-E-005  E×C double-ledger: stock-backed day feed never re-expenses
--   F-C-F-005 / security: revoke client INSERT/UPDATE on RPC-owned ledger
--            tables; manual finance entries move to intent RPCs
--   (new)    record_manual_expense / record_manual_revenue / stock_adjust
-- =============================================================================
BEGIN;

-- ----------------------------------------------------------------------------
-- 1. F-G-002: record_egg_collection — server-side week gate + owner assert
--    Gate mirrors canonical product rules (lib/canonical.ts + cron generator):
--    layer >= 19, duck layer >= 20. Meat species never collect.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_egg_collection(
  p_farm_id UUID,
  p_batch_id UUID,
  p_date DATE,
  p_total_eggs INT,
  p_eggs_cracked INT,
  p_eggs_rejected INT,
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_good INT;
  v_existing_id UUID;
  v_collection_id UUID;
  v_batch RECORD;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_total_eggs IS NULL OR p_total_eggs <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_quantity');
  END IF;

  SELECT species, duck_type, current_week, status
  INTO v_batch
  FROM public.batches
  WHERE id = p_batch_id AND farm_id = p_farm_id;

  IF v_batch IS NULL OR v_batch.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'batch_not_found');
  END IF;

  -- Product gate (server authority; client gate is a preview)
  IF v_batch.species = 'layer' THEN
    IF COALESCE(v_batch.current_week, 1) < 19 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'week_gate', 'min_week', 19);
    END IF;
  ELSIF v_batch.species = 'duck' AND v_batch.duck_type = 'layer' THEN
    IF COALESCE(v_batch.current_week, 1) < 20 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'week_gate', 'min_week', 20);
    END IF;
  ELSE
    RETURN jsonb_build_object('ok', false, 'reason', 'not_egg_producer');
  END IF;

  SELECT id INTO v_existing_id
  FROM public.egg_collections
  WHERE batch_id = p_batch_id AND date = p_date;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'duplicate');
  END IF;

  v_good := GREATEST(0, p_total_eggs - COALESCE(p_eggs_cracked, 0) - COALESCE(p_eggs_rejected, 0));

  INSERT INTO public.egg_collections (
    farm_id, batch_id, date, total_eggs, broken, dirty, good, notes
  ) VALUES (
    p_farm_id, p_batch_id, p_date, p_total_eggs,
    COALESCE(p_eggs_cracked, 0), COALESCE(p_eggs_rejected, 0), v_good, p_notes
  ) RETURNING id INTO v_collection_id;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, p_batch_id, 'egg_collection',
    format('Collected %s eggs (%s good, %s cracked, %s rejected)',
      p_total_eggs, v_good, COALESCE(p_eggs_cracked, 0), COALESCE(p_eggs_rejected, 0))
  );

  RETURN jsonb_build_object('ok', true, 'collection_id', v_collection_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. C-W-U04: unique water day + idempotent log_day_water
-- ----------------------------------------------------------------------------
-- De-dupe any existing duplicates (keep earliest) before adding constraint
DELETE FROM public.water_records w
USING public.water_records w2
WHERE w.batch_id = w2.batch_id
  AND w.date = w2.date
  AND w.created_at > w2.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS water_records_batch_date_uniq
  ON public.water_records (batch_id, date);

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
  ON CONFLICT (batch_id, date) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.water_records
    WHERE batch_id = p_batch_id AND date = p_date;
    RETURN jsonb_build_object('ok', true, 'already_logged', true, 'water_record_id', v_id);
  END IF;

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
  VALUES (p_farm_id, p_batch_id, 'water_log', 'Day water ' || p_gallons::text || ' gal');

  RETURN jsonb_build_object(
    'ok', true, 'water_record_id', v_id,
    'ledgered', p_ledger, 'expense_pesewas', v_expense_pesewas
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. C-F-U16 + F-E-005: confirm_day_feed
--    a) fail-closed when stock is insufficient (no silent clamp-to-zero)
--    b) stock-backed feeding NEVER creates an expense: money enters the ledger
--       at acquisition (stock_purchase / ready-made / formulation), so
--       consumption from stock must not re-ledger (E×C double-count fix).
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
  v_on_hand NUMERIC;
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

  -- C-F-U16: fail-closed overdraw guard BEFORE any writes
  IF p_ledger AND p_stock_item_id IS NOT NULL THEN
    SELECT current_quantity INTO v_on_hand
    FROM public.stock_items
    WHERE id = p_stock_item_id AND farm_id = p_farm_id;

    IF v_on_hand IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'stock_item_not_found');
    END IF;
    IF v_on_hand < p_quantity_kg THEN
      RETURN jsonb_build_object(
        'ok', false, 'reason', 'insufficient_stock',
        'available_kg', v_on_hand, 'requested_kg', p_quantity_kg
      );
    END IF;
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
      p_farm_id, p_stock_item_id, p_quantity_kg, p_batch_id,
      'Daily feeding ' || p_quantity_kg::text || 'kg', v_source_ref
    );

    UPDATE public.stock_items
    SET current_quantity = GREATEST(0, current_quantity - p_quantity_kg),
        updated_at = NOW()
    WHERE id = p_stock_item_id AND farm_id = p_farm_id;
  END IF;

  -- F-E-005: expense only when feeding is NOT stock-backed (direct buy+feed).
  -- Stock-backed consumption was already expensed at acquisition.
  IF p_ledger AND p_stock_item_id IS NULL AND NOT p_skip_expense AND p_unit_price_pesewas > 0 THEN
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
  VALUES (p_farm_id, p_batch_id, 'feed_log', 'Day feed ' || p_quantity_kg::text || 'kg');

  RETURN jsonb_build_object(
    'ok', true,
    'feed_log_id', v_log_id,
    'ledgered', p_ledger,
    'expense_pesewas', v_expense_pesewas,
    'source_ref', v_source_ref
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. F-E-004: record_ready_made_purchase stocks-in the purchased bags
--    (find-or-create feed stock item, lot-in, transaction, quantity bump)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_ready_made_purchase(
  p_farm_id UUID,
  p_batch_id UUID,
  p_species TEXT,
  p_phase TEXT DEFAULT 'unknown',
  p_population INT DEFAULT 0,
  p_bags_count INT DEFAULT 1,
  p_bag_size_kg NUMERIC DEFAULT 50,
  p_total_kg NUMERIC DEFAULT 0,
  p_total_cost_pesewas INT DEFAULT 0,
  p_description TEXT DEFAULT NULL,
  p_feed_type TEXT DEFAULT NULL,
  p_brand TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_formulation_id UUID;
  v_desc TEXT;
  v_stock_item_id UUID;
  v_stock_name TEXT;
  v_unit_price INT := 0;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_total_kg IS NULL OR p_total_kg <= 0 THEN
    RAISE EXCEPTION 'total_kg must be positive';
  END IF;

  IF p_batch_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.batches
    WHERE id = p_batch_id AND farm_id = p_farm_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'active batch not found';
  END IF;

  INSERT INTO public.feed_formulations (
    farm_id, batch_id, species, phase, population,
    bags_count, bag_size_kg, total_kg, formulation_type
  ) VALUES (
    p_farm_id, p_batch_id, COALESCE(p_species, 'unknown'),
    COALESCE(NULLIF(p_phase, ''), 'unknown'),
    COALESCE(p_population, 0),
    COALESCE(p_bags_count, 1),
    COALESCE(p_bag_size_kg, 50),
    p_total_kg,
    'ready_made'
  )
  RETURNING id INTO v_formulation_id;

  -- F-E-004: stock-in the purchased feed
  v_stock_name := 'Feed: ' || COALESCE(NULLIF(p_feed_type, ''), 'Commercial')
    || CASE WHEN p_brand IS NOT NULL AND p_brand <> '' THEN ' (' || p_brand || ')' ELSE '' END;
  v_unit_price := CASE WHEN p_total_cost_pesewas > 0
    THEN ROUND(p_total_cost_pesewas / p_total_kg)::INT ELSE 0 END;

  SELECT id INTO v_stock_item_id
  FROM public.stock_items
  WHERE farm_id = p_farm_id AND name = v_stock_name
  LIMIT 1;

  IF v_stock_item_id IS NULL THEN
    INSERT INTO public.stock_items (farm_id, name, category, unit, current_quantity)
    VALUES (p_farm_id, v_stock_name, 'feed', 'kg', 0)
    RETURNING id INTO v_stock_item_id;
  END IF;

  INSERT INTO public.stock_lots (
    farm_id, stock_item_id, qty_on_hand,
    unit_price_pesewas, quality_grade, received_at
  ) VALUES (
    p_farm_id, v_stock_item_id, p_total_kg,
    COALESCE(v_unit_price, 0), 'A', NOW()
  );

  INSERT INTO public.stock_transactions (
    farm_id, stock_item_id, transaction_type, quantity,
    unit_price_pesewas, total_cost_pesewas, notes, source_ref
  ) VALUES (
    p_farm_id, v_stock_item_id, 'purchase', p_total_kg,
    NULLIF(v_unit_price, 0), NULLIF(p_total_cost_pesewas, 0),
    'Ready-made feed purchase', v_formulation_id::text
  );

  UPDATE public.stock_items
  SET current_quantity = current_quantity + p_total_kg,
      unit_price_pesewas = CASE WHEN v_unit_price > 0 THEN v_unit_price ELSE unit_price_pesewas END,
      updated_at = NOW()
  WHERE id = v_stock_item_id;

  v_desc := COALESCE(
    NULLIF(p_description, ''),
    'Ready-made feed: ' || COALESCE(p_feed_type, 'Commercial')
      || CASE WHEN p_brand IS NOT NULL AND p_brand <> '' THEN ' (' || p_brand || ')' ELSE '' END
      || ' — ' || p_total_kg::text || 'kg'
  );

  IF p_total_cost_pesewas > 0 THEN
    BEGIN
      INSERT INTO public.expenses (
        farm_id, batch_id, category, description, amount_pesewas, date,
        source, source_ref, payment_method, payment_status
      ) VALUES (
        p_farm_id, p_batch_id, 'feed_and_nutrition',
        v_desc, p_total_cost_pesewas, CURRENT_DATE,
        'auto:feed', v_formulation_id::text, 'cash', 'paid'
      );
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END IF;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, p_batch_id, 'feed_purchase',
    'Purchased ready-made feed ' || p_total_kg::text || 'kg (stocked in)'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'formulation_id', v_formulation_id,
    'stock_item_id', v_stock_item_id,
    'expense_pesewas', CASE WHEN p_total_cost_pesewas > 0 THEN p_total_cost_pesewas ELSE 0 END
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. New intent RPCs so ledger tables can go RPC-only
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_manual_expense(
  p_farm_id UUID,
  p_category TEXT,
  p_description TEXT,
  p_amount_pesewas INT,
  p_date DATE DEFAULT CURRENT_DATE,
  p_batch_id UUID DEFAULT NULL,
  p_source TEXT DEFAULT 'manual',
  p_source_ref TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'cash',
  p_payment_status TEXT DEFAULT 'paid'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_amount_pesewas IS NULL OR p_amount_pesewas <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  -- Idempotent on (source, source_ref) when a ref is provided
  IF p_source_ref IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.expenses
    WHERE farm_id = p_farm_id AND source = p_source AND source_ref = p_source_ref
  ) THEN
    SELECT id INTO v_id FROM public.expenses
    WHERE farm_id = p_farm_id AND source = p_source AND source_ref = p_source_ref
    LIMIT 1;
    RETURN jsonb_build_object('ok', true, 'already_recorded', true, 'expense_id', v_id);
  END IF;

  INSERT INTO public.expenses (
    farm_id, batch_id, category, description, amount_pesewas, date,
    source, source_ref, payment_method, payment_status
  ) VALUES (
    p_farm_id, p_batch_id, p_category, p_description, p_amount_pesewas, p_date,
    p_source, p_source_ref, p_payment_method, p_payment_status
  ) RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'expense_id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_manual_revenue(
  p_farm_id UUID,
  p_category TEXT,
  p_description TEXT,
  p_amount_pesewas INT,
  p_date DATE DEFAULT CURRENT_DATE,
  p_batch_id UUID DEFAULT NULL,
  p_buyer TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'manual',
  p_source_ref TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'cash',
  p_payment_status TEXT DEFAULT 'paid'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_amount_pesewas IS NULL OR p_amount_pesewas <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  IF p_source_ref IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.revenue
    WHERE farm_id = p_farm_id AND source = p_source AND source_ref = p_source_ref
  ) THEN
    SELECT id INTO v_id FROM public.revenue
    WHERE farm_id = p_farm_id AND source = p_source AND source_ref = p_source_ref
    LIMIT 1;
    RETURN jsonb_build_object('ok', true, 'already_recorded', true, 'revenue_id', v_id);
  END IF;

  INSERT INTO public.revenue (
    farm_id, batch_id, category, description, amount_pesewas, date,
    buyer, source, source_ref, payment_method, payment_status
  ) VALUES (
    p_farm_id, p_batch_id, p_category, p_description, p_amount_pesewas, p_date,
    p_buyer, p_source, p_source_ref, p_payment_method, p_payment_status
  ) RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'revenue_id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.stock_adjust(
  p_farm_id UUID,
  p_stock_item_id UUID,
  p_new_quantity NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current NUMERIC;
  v_delta NUMERIC;
  v_tx_id UUID;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_new_quantity IS NULL OR p_new_quantity < 0 THEN
    RAISE EXCEPTION 'new_quantity must be >= 0';
  END IF;

  SELECT current_quantity INTO v_current
  FROM public.stock_items
  WHERE id = p_stock_item_id AND farm_id = p_farm_id
  FOR UPDATE;

  IF v_current IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'stock_item_not_found');
  END IF;

  v_delta := p_new_quantity - v_current;
  IF v_delta = 0 THEN
    RETURN jsonb_build_object('ok', true, 'unchanged', true);
  END IF;

  INSERT INTO public.stock_transactions (
    farm_id, stock_item_id, transaction_type, quantity, notes
  ) VALUES (
    p_farm_id, p_stock_item_id, 'adjustment', v_delta,
    COALESCE(p_notes, 'Manual adjustment')
  ) RETURNING id INTO v_tx_id;

  UPDATE public.stock_items
  SET current_quantity = p_new_quantity, updated_at = NOW()
  WHERE id = p_stock_item_id;

  RETURN jsonb_build_object('ok', true, 'transaction_id', v_tx_id, 'delta', v_delta);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_manual_expense(UUID, TEXT, TEXT, INT, DATE, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_manual_revenue(UUID, TEXT, TEXT, INT, DATE, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stock_adjust(UUID, UUID, NUMERIC, TEXT) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 6. F-C-F-005 / security: RPC-only writes on ledger tables.
--    Drop every client INSERT/UPDATE policy on tables whose writes are owned
--    by SECURITY DEFINER intent RPCs. SELECT and (where present) DELETE
--    policies are left untouched.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'feed_logs', 'egg_collections', 'egg_sales', 'water_records',
        'expenses', 'revenue', 'stock_transactions', 'stock_lots'
      )
      AND cmd IN ('INSERT', 'UPDATE')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END;
$$;

COMMIT;
