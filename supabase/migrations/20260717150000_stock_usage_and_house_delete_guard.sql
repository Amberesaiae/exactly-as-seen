-- =============================================================================
-- K9: stock_usage atomic writer
-- S residual: block house delete while occupied / active flock
-- =============================================================================

-- ----------------------------------------------------------------------------
-- stock_usage: tx + FIFO + stock_items qty + activity (single TX)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stock_usage(
  p_farm_id UUID,
  p_stock_item_id UUID,
  p_qty NUMERIC,
  p_batch_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
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

  IF v_item.current_quantity < p_qty THEN
    RAISE EXCEPTION 'insufficient stock: on hand %, requested %', v_item.current_quantity, p_qty;
  END IF;

  IF p_batch_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.batches
    WHERE id = p_batch_id AND farm_id = p_farm_id
  ) THEN
    RAISE EXCEPTION 'batch not found';
  END IF;

  INSERT INTO public.stock_transactions (
    farm_id, stock_item_id, transaction_type, quantity, notes
  ) VALUES (
    p_farm_id, p_stock_item_id, 'usage', p_qty, p_notes
  )
  RETURNING id INTO v_tx_id;

  PERFORM public.allocate_fifo_by_quality(
    p_farm_id,
    p_stock_item_id,
    p_qty,
    p_batch_id,
    COALESCE(p_notes, 'Stock usage'),
    v_tx_id::text
  );

  v_new_qty := GREATEST(0, v_item.current_quantity - p_qty);

  UPDATE public.stock_items
  SET current_quantity = v_new_qty, updated_at = NOW()
  WHERE id = p_stock_item_id AND farm_id = p_farm_id;

  INSERT INTO public.activity_log (farm_id, batch_id, event_type, description)
  VALUES (
    p_farm_id, p_batch_id, 'stock_transaction',
    'USAGE: ' || p_qty::text || ' ' || COALESCE(v_item.unit, 'unit') || ' of ' || v_item.name
  );

  RETURN jsonb_build_object(
    'ok', true,
    'transaction_id', v_tx_id,
    'new_quantity', v_new_qty
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.stock_usage(UUID, UUID, NUMERIC, UUID, TEXT)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.stock_usage IS
  'K9 atomic stock usage: transaction + FIFO + qty decrease';

-- ----------------------------------------------------------------------------
-- House delete: refuse if occupied or has active batch
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_house_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.occupied_by_batch_id IS NOT NULL THEN
    RAISE EXCEPTION 'cannot delete house while occupied by a flock';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.batches b
    WHERE b.house_id = OLD.id AND b.status = 'active'
  ) THEN
    RAISE EXCEPTION 'cannot delete house with an active flock';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS houses_guard_delete ON public.houses;
CREATE TRIGGER houses_guard_delete
  BEFORE DELETE ON public.houses
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_house_delete();
