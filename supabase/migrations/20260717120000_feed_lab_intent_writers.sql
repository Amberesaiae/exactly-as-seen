-- =============================================================================
-- E feed lab spine: S1 ready-made purchase + S2 formulation confirm/allocation
-- Atomic replacements for client multi-write (K7/K8)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- S1: record_ready_made_purchase
-- formulation row + always expense when cost > 0 + activity
-- (purchase-class money — independent of production system)
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
    'Purchased ready-made feed ' || p_total_kg::text || 'kg'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'formulation_id', v_formulation_id,
    'expense_pesewas', CASE WHEN p_total_cost_pesewas > 0 THEN p_total_cost_pesewas ELSE 0 END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_ready_made_purchase(
  UUID, UUID, TEXT, TEXT, INT, INT, NUMERIC, NUMERIC, INT, TEXT, TEXT, TEXT
) TO authenticated, service_role;

COMMENT ON FUNCTION public.record_ready_made_purchase IS
  'S1 atomic ready-made purchase: feed_formulations + expense (always when priced)';

-- ----------------------------------------------------------------------------
-- S2: confirm_formulation_allocation
-- formulation + ingredients JSON + intensive FIFO stock-out + intensive expense
-- p_ingredients: [{name, category, quantity_kg, unit_price_pesewas, stock_item_id?}]
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_formulation_allocation(
  p_farm_id UUID,
  p_batch_id UUID,
  p_species TEXT,
  p_phase TEXT DEFAULT 'unknown',
  p_population INT DEFAULT 0,
  p_bags_count INT DEFAULT 1,
  p_bag_size_kg NUMERIC DEFAULT 50,
  p_total_kg NUMERIC DEFAULT 0,
  p_formulation_type TEXT DEFAULT 'custom',
  p_ingredients JSONB DEFAULT '[]'::jsonb,
  p_total_cost_pesewas INT DEFAULT 0,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_formulation_id UUID;
  v_system TEXT;
  v_auto BOOLEAN := false;
  v_ing JSONB;
  v_name TEXT;
  v_category TEXT;
  v_qty NUMERIC;
  v_price INT;
  v_stock_id UUID;
  v_matched UUID;
  v_desc TEXT;
  v_ing_count INT := 0;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_total_kg IS NULL OR p_total_kg <= 0 THEN
    RAISE EXCEPTION 'total_kg must be positive';
  END IF;

  IF p_batch_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.batches
    WHERE id = p_batch_id AND farm_id = p_farm_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'active batch not found';
  END IF;

  SELECT production_system INTO v_system FROM public.batches WHERE id = p_batch_id;
  v_auto := COALESCE(v_system, 'intensive') IN ('intensive', 'deep_litter', 'cage');

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
    COALESCE(NULLIF(p_formulation_type, ''), 'custom')
  )
  RETURNING id INTO v_formulation_id;

  FOR v_ing IN SELECT * FROM jsonb_array_elements(COALESCE(p_ingredients, '[]'::jsonb))
  LOOP
    v_name := COALESCE(v_ing->>'name', 'ingredient');
    v_category := COALESCE(v_ing->>'category', 'energy');
    v_qty := COALESCE((v_ing->>'quantity_kg')::NUMERIC, 0);
    v_price := COALESCE((v_ing->>'unit_price_pesewas')::INT, 0);
    v_stock_id := NULLIF(v_ing->>'stock_item_id', '')::UUID;

    IF v_qty <= 0 THEN
      CONTINUE;
    END IF;

    INSERT INTO public.feed_ingredients (
      formulation_id, category, name, quantity_kg,
      unit_price_pesewas, total_cost_pesewas, stock_item_id
    ) VALUES (
      v_formulation_id, v_category, v_name, v_qty,
      NULLIF(v_price, 0),
      CASE WHEN v_price > 0 THEN ROUND(v_qty * v_price)::INT ELSE NULL END,
      v_stock_id
    );
    v_ing_count := v_ing_count + 1;

    -- Intensive: stock-out via FIFO (match stock_item_id or name)
    IF v_auto THEN
      v_matched := v_stock_id;
      IF v_matched IS NULL THEN
        SELECT id INTO v_matched
        FROM public.stock_items
        WHERE farm_id = p_farm_id
          AND name ILIKE v_name
        ORDER BY current_quantity DESC
        LIMIT 1;
      END IF;

      IF v_matched IS NOT NULL THEN
        PERFORM public.allocate_fifo_by_quality(
          p_farm_id,
          v_matched,
          v_qty,
          p_batch_id,
          'Formulation allocation: ' || v_name,
          v_formulation_id::text
        );
        UPDATE public.stock_items
        SET
          current_quantity = GREATEST(0, current_quantity - v_qty),
          updated_at = NOW()
        WHERE id = v_matched AND farm_id = p_farm_id;
      END IF;
    END IF;
  END LOOP;

  v_desc := COALESCE(
    NULLIF(p_description, ''),
    'Feed formulation (' || COALESCE(p_formulation_type, 'custom') || '): '
      || p_total_kg::text || 'kg'
  );

  IF v_auto AND p_total_cost_pesewas > 0 THEN
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
    p_farm_id, p_batch_id, 'feed_formulation',
    'Confirmed formulation ' || p_total_kg::text || 'kg (' || COALESCE(p_formulation_type, 'custom') || ')'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'formulation_id', v_formulation_id,
    'ingredient_count', v_ing_count,
    'intensive_ledger', v_auto AND p_total_cost_pesewas > 0,
    'expense_pesewas', CASE WHEN v_auto AND p_total_cost_pesewas > 0 THEN p_total_cost_pesewas ELSE 0 END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_formulation_allocation(
  UUID, UUID, TEXT, TEXT, INT, INT, NUMERIC, NUMERIC, TEXT, JSONB, INT, TEXT
) TO authenticated, service_role;

COMMENT ON FUNCTION public.confirm_formulation_allocation IS
  'S2 atomic formulation confirm: formulation + ingredients + intensive FIFO/expense';
