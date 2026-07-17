-- =============================================================================
-- Fix create_batch seed + post-vax supplement uniqueness
--
-- Root cause (live audit 2026-07-17):
--   create_batch cast medication_id → UUID, but FE seeds TEXT slugs
--   (e.g. gumboro_(ibd), anti_stress). RPC failed → UI stuck on /batches/new.
--
-- Also: seedPostVaccinationSupplements upserts on
--   (batch_id, medication_id, scheduled_date) which had no unique constraint.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Recreate create_batch with TEXT medication_id (matches health_tasks column)
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

  -- House free: no occupied_by pointer AND no other active batch using it
  IF NOT EXISTS (
    SELECT 1 FROM public.houses h
    WHERE h.id = p_house_id
      AND h.farm_id = p_farm_id
      AND h.occupied_by_batch_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.batches b
        WHERE b.house_id = h.id AND b.status = 'active'
      )
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
        COALESCE(v_elem->>'product_name', 'Care task'),
        -- TEXT slugs from FE templates (NOT uuid)
        NULLIF(trim(COALESCE(v_elem->>'medication_id', '')), ''),
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

-- Unique key for post-vax supplement idempotent upsert (non-partial for PostgREST ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS health_tasks_batch_med_date_uidx
  ON public.health_tasks (batch_id, medication_id, scheduled_date);

-- Heal house occupancy drift (active batch vs pointer)
UPDATE public.houses h
SET occupied_by_batch_id = b.id
FROM public.batches b
WHERE b.house_id = h.id
  AND b.status = 'active'
  AND (h.occupied_by_batch_id IS DISTINCT FROM b.id);

UPDATE public.houses h
SET occupied_by_batch_id = NULL
WHERE h.occupied_by_batch_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.batches b
    WHERE b.id = h.occupied_by_batch_id AND b.status = 'active'
  );
