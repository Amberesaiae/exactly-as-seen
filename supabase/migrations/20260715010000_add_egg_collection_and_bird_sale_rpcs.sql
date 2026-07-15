-- Migration: Atomic RPCs for egg collection and bird sale
BEGIN;

-- ----------------------------------------------------
-- 1. RPC: record_egg_collection
-- ----------------------------------------------------
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
BEGIN
  -- Duplicate guard
  SELECT id INTO v_existing_id
  FROM public.egg_collections
  WHERE batch_id = p_batch_id AND date = p_date;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'duplicate');
  END IF;

  v_good := GREATEST(0, p_total_eggs - p_eggs_cracked - p_eggs_rejected);

  INSERT INTO public.egg_collections (
    farm_id, batch_id, date, total_eggs, broken, dirty, good, notes
  ) VALUES (
    p_farm_id, p_batch_id, p_date, p_total_eggs, p_eggs_cracked, p_eggs_rejected, v_good, p_notes
  ) RETURNING id INTO v_collection_id;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, p_batch_id, 'egg_collection',
    format('Collected %s eggs (%s good, %s cracked, %s rejected)', p_total_eggs, v_good, p_eggs_cracked, p_eggs_rejected)
  );

  RETURN jsonb_build_object('ok', true, 'collection_id', v_collection_id);
END;
$$;

-- ----------------------------------------------------
-- 2. RPC: record_bird_sale
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_bird_sale(
  p_farm_id UUID,
  p_batch_id UUID,
  p_quantity INT,
  p_price_pesewas INT,
  p_buyer TEXT,
  p_date DATE,
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_pop INT;
  v_new_pop INT;
  v_revenue_id UUID;
  v_desc TEXT;
BEGIN
  -- Safety guard: check population
  SELECT current_population INTO v_current_pop
  FROM public.batches
  WHERE id = p_batch_id AND farm_id = p_farm_id;

  IF v_current_pop IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'batch_not_found');
  END IF;

  IF v_current_pop < p_quantity THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_population');
  END IF;

  v_new_pop := v_current_pop - p_quantity;
  v_desc := format('Bird Sale: %s birds for %s%s',
    p_quantity,
    (p_price_pesewas / 100.0)::TEXT,
    CASE WHEN p_notes IS NOT NULL THEN ' — ' || p_notes ELSE '' END
  );

  -- Insert revenue
  INSERT INTO public.revenue (
    farm_id, batch_id, category, description, amount_pesewas,
    buyer, date, source, source_ref, payment_method, payment_status
  ) VALUES (
    p_farm_id, p_batch_id, 'bird_sales', v_desc, p_price_pesewas,
    p_buyer, p_date, 'bird_sale', p_batch_id || ':sale:' || p_quantity || ':' || p_price_pesewas || ':' || now(), 'cash', 'paid'
  ) RETURNING id INTO v_revenue_id;

  -- Update batch population
  UPDATE public.batches
  SET current_population = v_new_pop, updated_at = NOW()
  WHERE id = p_batch_id AND current_population >= p_quantity;

  -- Activity log
  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, p_batch_id, 'bird_sale',
    format('Sold %s birds for %s%s', p_quantity, (p_price_pesewas / 100.0)::TEXT, CASE WHEN p_buyer IS NOT NULL THEN ' to ' || p_buyer ELSE '' END)
  );

  RETURN jsonb_build_object('ok', true, 'revenue_id', v_revenue_id, 'new_population', v_new_pop);
END;
$$;

COMMIT;
