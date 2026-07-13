# Hosted security advisor fix

**Migration:** `supabase/migrations/20260713010000_security_advisor_hardening.sql`  
**Applied to:** project `ulliwnizurgfbwryhnng` (2026-07-13)

## Issues addressed

| Linter | Fix |
|--------|-----|
| `function_search_path_mutable` | `ALTER FUNCTION … SET search_path = public` on all public functions |
| `anon_security_definer_function_executable` | `REVOKE ALL … FROM PUBLIC, anon` on all public functions |
| Cron / triggers callable by clients | `REVOKE` from `authenticated`; `GRANT` only `service_role` |
| Client RPCs | `GRANT EXECUTE` to `authenticated` + `service_role` only |

## Post-migration privilege matrix (verified)

| Function | anon | authenticated | service_role |
|----------|------|---------------|--------------|
| Client RPCs (`allocate_fifo_*`, `get_*`, `bulk_complete_*`) | ❌ | ✅ | ✅ |
| Cron (`cron_*`) | ❌ | ❌ | ✅ |
| `handle_new_user`, `rls_auto_enable`, `assert_farm_owner` | ❌ | ❌ | ✅ |
| `search_path` | pinned `public` for all |

## Remaining intentional warnings (safe to leave)

After hardening, advisors may still show:

### `authenticated_security_definer_function_executable` (8 client RPCs)

| Function | Why DEFINER stays |
|----------|-------------------|
| `allocate_fifo_by_quality` | Multi-table FIFO under ownership |
| `bulk_complete_health_tasks` | Batch task updates + farm check |
| `get_batch_record_summary` | Aggregates across owned batches |
| `get_dashboard_overview` | Dashboard aggregates |
| `get_egg_inventory` / `get_graded_egg_inventory` | Inventory with ownership |
| `get_farm_financial_stats` | Finance aggregates |
| `get_weekly_health_summary` | Health week rollups |

**This is intentional.** Signed-in farmers *must* call these via `/rest/v1/rpc/*`.  
They are **not** open to `anon`. Bodies enforce farm ownership (`assert_farm_owner` or equivalent).

Supabase’s linter cannot distinguish “dangerous DEFINER” from “app RPC with ownership checks,” so the WARN remains.  
**Do not revoke `authenticated`** or the UI breaks.  
**Do not convert to INVOKER** without a full RLS rewrite of each RPC.

### `auth_leaked_password_protection`

Dashboard-only (not SQL / not migration):

1. Open [Auth settings](https://supabase.com/dashboard/project/ulliwnizurgfbwryhnng/auth/providers)  
2. **Email** provider  
3. Enable **Leaked password protection** (HaveIBeenPwned)

Optional for free tier; recommended for production.

## Acceptable advisor state

| Category | Expected after fix |
|----------|-------------------|
| Mutable search_path | **0** |
| Anon can run DEFINER | **0** |
| Cron/trigger as authenticated | **0** |
| Authenticated client RPCs DEFINER | **~8 WARN** (accepted) |
| Leaked password | **0 after dashboard toggle** |

## Smoke

```bash
# Should be 401/403 for anon:
curl -X POST "$VITE_SUPABASE_URL/rest/v1/rpc/cron_advance_batch_weeks" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```
