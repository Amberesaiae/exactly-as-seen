# QA status board

**Rule:** Nothing is green from skim. Status only changes when the pack file’s Meta.Status is updated after real work.

**Priority for structural integrity (recommended order):**

1. C-today-ops-feed (K1/K2)  
2. D-care-health (K5/K6)  
3. F-stock (K3)  
4. G-eggs (K4)  
5. E-feed-lab (S1/S2)  
6. B-batches (re-prove sole + multi-species greys)  
7. C-water, H, I (re-prove, not assume)  
8. J-jobs, K-hub, A-onboarding  
9. Cross-cutting packs  
10. Integration full-day path  

---

## Systems

| Pack | Status | Open greys | Last session | Blocker |
|------|--------|------------|--------------|---------|
| [A-onboarding](02-systems/A-onboarding/AUDIT.md) | CURATED | deferred A-U01/03/05/07 | 2026-07-17 | login+setup re-proved |
| [B-batches](02-systems/B-batches/AUDIT.md) | CURATED | protocol parity DEFER | 2026-07-17 | multi-species 14/14 |
| [C-today-ops-feed](02-systems/C-today-ops-feed/AUDIT.md) | CURATED | deferred U09/U10-flush/U12… | 2026-07-17 | K1/K2 fixed |
| [C-today-ops-water](02-systems/C-today-ops-water/AUDIT.md) | CURATED | deferred U04/U05/U08 | 2026-07-17 | sole log_day_water |
| [D-care-health](02-systems/D-care-health/AUDIT.md) | CURATED | deferred bulk/UI greys | 2026-07-17 | K5/K6 fixed |
| [E-feed-lab](02-systems/E-feed-lab/AUDIT.md) | CURATED | stock-in / E×C DEFER | 2026-07-17 | S1/S2+K7/K8 |
| [F-stock](02-systems/F-stock/AUDIT.md) | CURATED | adjustment multi low | 2026-07-17 | K3+K9 fixed |
| [G-eggs](02-systems/G-eggs/AUDIT.md) | CURATED | species UI DEFER | 2026-07-17 | K4 fixed |
| [H-mortality-sales](02-systems/H-mortality-sales/AUDIT.md) | CURATED | — | 2026-07-17 | meat WD gate |
| [I-terminate](02-systems/I-terminate/AUDIT.md) | CURATED | — | 2026-07-17 | sole terminate |
| [J-jobs](02-systems/J-jobs/AUDIT.md) | CURATED | week/WD fixture DEFER | 2026-07-17 | cron 4 active |
| [K-dashboard-finance-records](02-systems/K-dashboard-finance-records/AUDIT.md) | CURATED | UI deep-links DEFER | 2026-07-17 | records RPC fixed |
| [S-settings-secondary](02-systems/S-settings-secondary/AUDIT.md) | CURATED | species/delete-farm DEFER | 2026-07-17 | occupied house delete FIXED |

## Cross-cutting

| Pack | Status |
|------|--------|
| [dual-pattern](04-cross-cutting/dual-pattern.md) | CURATED |
| [offline](04-cross-cutting/offline.md) | CURATED (code; live flush DEFER) |
| [security](04-cross-cutting/security.md) | CURATED |
| [multi-species](04-cross-cutting/multi-species.md) | CURATED |
| [money-ledger](04-cross-cutting/money-ledger.md) | CURATED |
| [multi-flock](04-cross-cutting/multi-flock.md) | CURATED |

## Journeys

| Journey | Status | Depends |
|---------|--------|---------|
| A–K (see `03-journeys/`) | **CURATED** (module deps) | systems above |

Integration monolithic day-path: optional — see `qa/06-evidence/integration/README.md`.

## Inputs (not substitutes)

| Doc | Role |
|-----|------|
| `docs/WRITER_MAP.md` | Kill/keep inventory (updated during arc) |
| `docs/CANONICAL_JOURNEYS.md` | Intent contracts |
| `docs/live-audit-artifacts/**` | Seed smoke only |
| `docs/PATH_TO_100.md` | **Do not trust** as substitute for packs |

## Session log (append)

| Date | Pack worked | Outcome |
|------|-------------|---------|
| 2026-07-17 | qa/ scaffold created | All packs NOT_STARTED; methodology + greys seeded |
| 2026-07-17 | C-today-ops-feed | K1/K2 FE FIX; live; **CURATED** |
| 2026-07-17 | D-care-health | K5/K6 FE FIX; live; **CURATED** |
| 2026-07-17 | F-stock | K3 FE FIX; live; **CURATED** |
| 2026-07-17 | G-eggs | K4 FE FIX; live; **CURATED** |
| 2026-07-17 | E-feed-lab | S1/S2 migration+FE; live; **CURATED** |
| 2026-07-17 | B-batches | multi-species re-prove; **CURATED** |
| 2026-07-17 | C-water + H + I | re-prove; meat WD gate; **CURATED** |
| 2026-07-17 | J + K + A | cron + records RPC fix + onboard; **CURATED** |
| 2026-07-17 | S + cross-cutting + journeys | all **CURATED**; integration pointer only |
| 2026-07-17 | residual K9 + house delete | stock_usage + houses_guard_delete live 7/7 |
| 2026-07-17 | residual re-prove + contract | K9/house live re-green; journeys-a-k 19/19 |

## Arc residual (explicit — not CLOSED product 100%)

| Residual | Owner |
|----------|--------|
| Live Dexie offline flush e2e | offline pack |
| E×C formulation vs day-feed allocation windows | E × C |
| feed_logs client INSERT RLS revoke | security / C-feed F-C-F-005 |
| Protocol parity research depth | B |
| Monolithic headed full-day path | integration |
| Stock adjustment multi-step (low) | F |
