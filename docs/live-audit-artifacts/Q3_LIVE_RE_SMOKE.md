# Q3 Live re-smoke (multi-species farm)

**Date:** 2026-07-13  
**App:** `http://127.0.0.1:5173` (Vite) against hosted Supabase  
**Method:** Chrome DevTools CDP session (authenticated farm)

## Flocks observed (Dashboard)

| Flock | Species | Week | Birds |
|-------|---------|-----:|------:|
| Audit Broiler A | broiler | 1 | 100 |
| Audit Layer A | layer | 1 | 100 |
| Audit Duck A | duck | 1 | 100 |
| Audit Turkey A | turkey | 1 | 99 |

**Total birds:** 399 · **Pending care (week):** 16

## Hub smoke

| Hub | URL | Result |
|-----|-----|--------|
| K Dashboard | `/dashboard` | Overview stats, 4 flocks, TODAY'S HOUSE TASKS (hydration/feeding/care) |
| C Care | `/health` | Batch select, Week summary, Daily Farm Ops (feed + water), vaccines 1 due / 5 schedule, water ✓ logged 28°C |
| C Feed | `/feed` | Broiler A **Feeding Complete** Day 1; phase protein 23% / 3200 kcal / 25g |
| Nav | Flocks, Harvest, Inventory, Ledger, Performance, Settings | Links present in shell |

## Care detail (Broiler A)

- This Week: Total tasks 3 (1 health + 2 daily), Completed 1 health
- Daily Farm Operations: Daily Feed + Daily Water due links
- Gumboro (IBD) completed 2026-07-13 01:53
- Next week preview: HB1 (Newcastle + IB) as Vaccination/Vaccine

## Hosted data alignment

- 52 meds, 46 ingredients, 7 active batches, 44 vax schedule rows
- 14 `batch_tasks` for today (feed + water)

## Residual UI note (fixed in same session)

- Dashboard checklist was rendering vaccine protocol rows as raw `medication` → **Vaccine** label via `formatTaskTypeLabel`
- Water logged but daily `batch_tasks` still open → **load-time reconcile** marks water/feed tasks complete when logs exist

## Verdict

**Q3 live re-smoke: PASS** for multi-species authenticated hubs C/K + care/feed ops.  
Full write-path re-smoke of every intent (purchase, egg sale, terminate) not re-run this pass; prior sessions exercised writers.
