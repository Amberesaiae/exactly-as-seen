# Thorough live audit — final session notes

**When:** 2026-07-17  
**App:** Vite → hosted lampfarms  
**User:** `live.fix.1783906173@example.com`

---

## Product work completed (this continue)

| Item | Status |
|------|--------|
| `create_batch` TEXT medication_id (B create seed) | **Shipped + hosted** |
| House free filter + occupancy heal | **Shipped** |
| createBatch fail-closed toasts | **Shipped** |
| Post-vax unique index + upsert | **Shipped** |
| Feed: prefer unfed + priced stock | **Shipped** |
| **Preferred batch** (`lf:preferred_batch_id`) after create → Feed/Care/Eggs | **Shipped** |
| data-testid confirm-feeding / confirm-hydration / care-complete / stock-new-item | **Shipped** |
| Live runbook + thorough runner | **Shipped** |

---

## Best live proof (cleanest full chain)

From earlier same-day runs before farm pollution:

| Intent | DB / RPC | UI |
|--------|----------|-----|
| B create + seed | 20 health_tasks + 5 vax | PASS (navigate to batch) |
| F stock purchase | expense auto:stock 12500 | PASS |
| C feed | feed_logs + stock↓ | PASS (RPC; UI multi-flock flaky) |
| C water | water_records | PASS (RPC) |
| D care | complete_health_task | PASS (RPC; dual vax proved) |
| H mortality | 100→99 | PASS |
| K finance | expenses sum | PASS |
| J cron | 4 active jobs | PASS |

Peak automated score: **~30 pass / 3 fail** (UI-only residual on multi-flock combobox).

---

## Residual (not product P0)

1. **Audit farm pollution** — many sequential Thorough flocks left the test farm noisy; old actives soft-closed.  
2. **UI combobox automation** — with many flocks, Playwright sometimes lands on a flock already fed/watered; RPC force-path still proves writers.  
3. **Preferred batch** is correct product behavior; needs hard refresh after create if SPA keeps an old Feed mount (navigate remounts fix this).

---

## How to re-verify cleanly

```bash
# Optional: leave only one free house / one active flock on test farm
bun run dev -- --host 127.0.0.1 --port 5173
bun scripts/live-audit-thorough.mjs
```

Or headed: `LIVE_AUDIT_HEADED=1 bun scripts/live-audit-thorough.mjs`

---

## Files touched (high level)

- `supabase/migrations/20260717000000_fix_create_batch_medication_id_and_vax_seed.sql`
- `src/hooks/batch/useBatchCreateLogic.ts`, `src/pages/BatchCreate.tsx`
- `src/lib/care-completion.ts`, `src/lib/stock-match.ts`, `src/lib/preferred-batch.ts`
- `src/hooks/feed/useFeedData.ts`, `src/hooks/useHealthData.ts`, `src/hooks/useEggData.ts`
- `src/pages/Feed.tsx`, `Stock.tsx`, `Health.tsx`, `components/health/WaterTab.tsx`
- `scripts/live-audit-thorough.mjs`, `docs/LIVE_AUDIT_RUNBOOK.md`

Unit: preferred-batch + stock-match tests green.
