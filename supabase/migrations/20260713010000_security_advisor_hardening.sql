-- Security advisor hardening (Supabase database linter)
-- 1) Pin search_path on all public functions (mutable search_path WARN)
-- 2) Revoke EXECUTE from PUBLIC + anon on SECURITY DEFINER RPCs
-- 3) Cron / trigger helpers: authenticated cannot call (service_role only)
-- 4) Client RPCs: authenticated + service_role only (assert_farm_owner inside)

-- ─── 1. search_path ──────────────────────────────────────────────────────────

ALTER FUNCTION public.recompute_batch_phase(text, text, integer)
  SET search_path = public;

ALTER FUNCTION public.cron_check_withdrawal_periods()
  SET search_path = public;

ALTER FUNCTION public.cron_prune_idempotency_keys()
  SET search_path = public;

ALTER FUNCTION public.get_dashboard_overview(uuid)
  SET search_path = public;

ALTER FUNCTION public.get_batch_record_summary(uuid, uuid[])
  SET search_path = public;

ALTER FUNCTION public.cron_advance_batch_weeks()
  SET search_path = public;

ALTER FUNCTION public.cron_generate_daily_tasks()
  SET search_path = public;

ALTER FUNCTION public.allocate_fifo_by_quality(uuid, uuid, numeric, uuid, text, text)
  SET search_path = public;

ALTER FUNCTION public.assert_farm_owner(uuid)
  SET search_path = public;

ALTER FUNCTION public.bulk_complete_health_tasks(uuid, integer, uuid, timestamptz)
  SET search_path = public;

ALTER FUNCTION public.get_egg_inventory(uuid, uuid)
  SET search_path = public;

ALTER FUNCTION public.get_farm_financial_stats(uuid)
  SET search_path = public;

ALTER FUNCTION public.get_graded_egg_inventory(uuid, uuid, text)
  SET search_path = public;

ALTER FUNCTION public.get_weekly_health_summary(uuid, integer, uuid)
  SET search_path = public;

ALTER FUNCTION public.handle_new_user()
  SET search_path = public;

ALTER FUNCTION public.rls_auto_enable()
  SET search_path = public;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public;

-- ─── 2. Revoke default PUBLIC / anon EXECUTE on all public RPCs ──────────────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
  END LOOP;
END $$;

-- ─── 3. Internal-only SECURITY DEFINER (cron + triggers + helpers) ───────────
-- Not callable via PostgREST by farmers.

REVOKE ALL ON FUNCTION public.cron_advance_batch_weeks() FROM authenticated;
REVOKE ALL ON FUNCTION public.cron_check_withdrawal_periods() FROM authenticated;
REVOKE ALL ON FUNCTION public.cron_generate_daily_tasks() FROM authenticated;
REVOKE ALL ON FUNCTION public.cron_prune_idempotency_keys() FROM authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM authenticated;
REVOKE ALL ON FUNCTION public.assert_farm_owner(uuid) FROM authenticated;
-- assert_farm_owner is only for other DEFINER bodies; clients never need it

GRANT EXECUTE ON FUNCTION public.cron_advance_batch_weeks() TO service_role;
GRANT EXECUTE ON FUNCTION public.cron_check_withdrawal_periods() TO service_role;
GRANT EXECUTE ON FUNCTION public.cron_generate_daily_tasks() TO service_role;
GRANT EXECUTE ON FUNCTION public.cron_prune_idempotency_keys() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;

-- ─── 4. Client-callable RPCs (authenticated + service_role) ──────────────────
-- These remain SECURITY DEFINER but use assert_farm_owner / ownership checks.

GRANT EXECUTE ON FUNCTION public.allocate_fifo_by_quality(uuid, uuid, numeric, uuid, text, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bulk_complete_health_tasks(uuid, integer, uuid, timestamptz)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_batch_record_summary(uuid, uuid[])
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_overview(uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_egg_inventory(uuid, uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_farm_financial_stats(uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_graded_egg_inventory(uuid, uuid, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_weekly_health_summary(uuid, integer, uuid)
  TO authenticated, service_role;

-- Non-DEFINER helpers used by other functions / triggers
GRANT EXECUTE ON FUNCTION public.recompute_batch_phase(text, text, integer)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column()
  TO authenticated, service_role;

COMMENT ON FUNCTION public.cron_advance_batch_weeks() IS
  'Internal job only — call via Edge Function / service_role. Not granted to anon/authenticated.';
COMMENT ON FUNCTION public.assert_farm_owner(uuid) IS
  'Internal guard for SECURITY DEFINER RPCs — not client-callable.';
