# QA Hardening & Production Finish — Final Report (2026-07-21)

## Scope
Closes the documented QA loopholes plus undocumented ledger inconsistencies, and finishes the app as a production-ready installable PWA. All server fixes are live on hosted Supabase (`ulliwnizurgfbwryhnng`), verified post-apply.

## Server spine (migration `20260721000000_qa_hardening_spine.sql` — applied & verified)
| Fix | Mechanism | Verified |
| --- | --- | --- |
| Egg collection week gate + duplicate guard | `record_egg_collection` server-side week window and dedupe | function present in `pg_proc` |
| Water double-log | unique index `water_records_batch_date_uniq` + `log_day_water` v2 upsert | index present |
| Feed with no stock (fail-open) | `confirm_day_feed` v2 fails closed with `insufficient_stock` | function present; client toast + "Book now" action |
| Double ledger on stock-backed feeding (F-E-005) | expense only at acquisition; `confirm_day_feed` skips expense when stock-backed | logic in RPC; contract test |
| Ready-made purchase didn't stock in | `record_ready_made_purchase` v2 inserts lot (grade 'A', valid per check constraint) + transaction + quantity | reviewed & fixed grade constraint bug pre-apply |
| Client-forged ledger rows (F-C-F-005) | dropped all client INSERT/UPDATE RLS on feed_logs, egg_collections, egg_sales, water_records, expenses, revenue, stock_transactions, stock_lots | `pg_policies` shows 0 write policies on all 8 tables |
| Manual finance entries bypassing spine | new idempotent `record_manual_expense` / `record_manual_revenue` (source+source_ref) | functions present |
| Unaudited stock edits | new `stock_adjust` RPC records a transaction per adjustment | function present |

## Client changes
- Shared day-feed writer `src/lib/feed-confirm.ts` — sole feeding writer for Feed Lab and Care (F-C-F-006); offline-safe via `queueRpc`.
- `synergy.ts`, `useFinanceData.ts`, `useStockData.ts` write ledgers via RPCs only; zero remaining direct client writes to ledger tables (grep + architect review confirmed).
- Optimistic local state retained for offline UX.

## PWA / production
- Real branded icons: `pwa-192.png`, `pwa-512.png`, `pwa-512-maskable.png`; manifest + apple-touch/head links; theme color.
- Missing workbox runtime deps added; production build succeeds (97 precache entries, injectManifest SW emitted).
- `dev-dist/` removed.

## Verification
- Test suite: **344/344 passing** (36 files), including updated contract tests for the RPC-only spine and shared feed writer.
- Architect code review: one critical finding (`quality_grade='good'` vs check constraint) — fixed before applying migration.
- App preview verified running after changes.
- Hosted DB verified via management API: all 7 RPCs exist; 0 client write policies on ledger tables; water unique index present.

## Known remainders (non-blocking)
- ~36 pre-existing `tsc --noEmit` errors in untouched legacy files (service-worker.ts, lib/sync.ts, some hooks/components); app builds and runs — candidates for a type-cleanup pass.
- GitHub main updated via API commit; local clone history may need a rebase on next pull.
