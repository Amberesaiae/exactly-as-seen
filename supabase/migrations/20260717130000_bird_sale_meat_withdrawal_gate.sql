-- H integrity: fail-closed meat withdrawal on bird sale (parity with egg sale)
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
  v_has_meat_wd BOOLEAN := false;
BEGIN
  PERFORM public.assert_farm_owner(p_farm_id);

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'quantity must be positive';
  END IF;

  -- Fail closed on active meat withdrawal (explicit until date)
  SELECT EXISTS (
    SELECT 1 FROM public.health_tasks
    WHERE batch_id = p_batch_id
      AND completed = true
      AND withdrawal_meat_until IS NOT NULL
      AND withdrawal_meat_until >= CURRENT_DATE
  ) INTO v_has_meat_wd;

  IF v_has_meat_wd THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'meat_withdrawal');
  END IF;

  SELECT current_population INTO v_current_pop
  FROM public.batches
  WHERE id = p_batch_id AND farm_id = p_farm_id
  FOR UPDATE;

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

  INSERT INTO public.revenue (
    farm_id, batch_id, category, description, amount_pesewas,
    buyer, date, source, source_ref, payment_method, payment_status
  ) VALUES (
    p_farm_id, p_batch_id, 'bird_sales', v_desc, p_price_pesewas,
    p_buyer, p_date, 'bird_sale', p_batch_id || ':sale:' || p_quantity || ':' || p_price_pesewas || ':' || now(), 'cash', 'paid'
  ) RETURNING id INTO v_revenue_id;

  UPDATE public.batches
  SET current_population = v_new_pop, updated_at = NOW()
  WHERE id = p_batch_id AND current_population >= p_quantity;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, p_batch_id, 'bird_sale',
    format('Sold %s birds for %s%s', p_quantity, (p_price_pesewas / 100.0)::TEXT, CASE WHEN p_buyer IS NOT NULL THEN ' to ' || p_buyer ELSE '' END)
  );

  RETURN jsonb_build_object('ok', true, 'revenue_id', v_revenue_id, 'new_population', v_new_pop);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_bird_sale(UUID, UUID, INT, INT, TEXT, DATE, TEXT)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.record_bird_sale IS
  'Atomic bird sale: revenue + pop down; fail-closed on meat withdrawal';
