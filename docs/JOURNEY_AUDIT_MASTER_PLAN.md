# Journey Audit Master Plan — Canonical, Farmer-Lean, No Admin

**Date:** 2026-07-13  
**Branch:** `feat/canonical-journeys`  
**Stack (canonical):** Hosted Supabase + Vite/React on Ubuntu/WSL — **zero Windows Admin / zero daily Docker**

---

## Authority ladder

| Rank | Source |
|------|--------|
| 1 | `docs/CANONICAL_JOURNEYS.md` + `docs/CANONICAL_RUNTIME.md` + migrations |
| 2 | `src/lib/canonical.ts`, `ledger-policy.ts`, `production-system.ts` |
| 3 | Domain corrections in `specs/00_CONVENTIONS.md` (C6/C7 = WARN) |
| 4 | Research in `deprecated specs/` (protocols, dual pattern, dosing — **not** Express/Python topology) |
| 5 | Module specs / wireframes (ignore Express paths) |

**Full production gap analysis:** `docs/PRODUCTION_E2E_AUDIT.md` (task dual-source glitch, hardcoded MarketTrends, missing Book now, client multi-write vs research RPCs).

---

## First principles

1. **One farmer intent → one writer → one side-effect set** (`source` + `source_ref`).
2. **Safety before money** (C1–C8, withdrawal).
3. **Dual pattern only on consumption**; purchases & sales always ledger.
4. **Never double-expense the same kg.**
5. **Farmer-lean:** few primary buttons; no scavenger hunt; optional “Book now” for flexible — never dead-end.
6. **No admin PowerShell** for daily work. Hosted backend = zero local Docker RAM.

---

## Research → runtime (deprecated specs)

| Keep (product domain) | Drop (obsolete topology) |
|----------------------|---------------------------|
| Dual intensive/flexible | Python FastAPI, Express, Redis, BullMQ |
| 5 broiler vax, species protocols | Admin portal / Docker Desktop daily |
| Dual water-health + feed safety (aflatoxin, gossypol, cassava) | Quality grades excellent/good… |
| FIFO + A/B/C/damaged | Float `amount` money columns |
| Pesewas, 9/5 finance categories | C6/C7 hard BLOCK |

---

## Flow status board

| ID | Intent | Offline | Live | Next work |
|----|--------|---------|------|-----------|
| **A** | Onboard | Green | Hosted smoke | Soft prefs fail |
| **B** | Start flock | In progress | Hosted | One vax seed; seed failure toast |
| **C** | Today ops | **P0 fix** | Hosted | batch_id, kg unify, feed_logs done |
| **D** | Care complete | Pending | — | Single vax writer; bulk=side-effects |
| **E** | Plan/buy feed | Pending | — | Ready-made always expense |
| **F** | Stock | Pending | — | Purchase always expense (mostly OK) |
| **G** | Eggs | Pending | — | Withdrawal gate |
| **H** | Mortality/sale | Pending | — | Withdrawal gate |
| **I** | Terminate | Pending | — | Revenue + house release |
| **J** | Jobs | Deployed | Schedule crons | Dashboard schedules |
| **K** | Money hub | Pending | — | Read models only |

**Implementation order (atomic):** C-P0 → B seed → E purchase → D bulk/vax → flexible Book now → F–K.

---

## No-admin install (complete project)

```bash
# Ubuntu / WSL user shell — no elevation
cd /mnt/c/src/exactly-as-seen   # or C:\src\exactly-as-seen via WSL
bun install
# Hosted project already linked (lampfarms / ulliwnizurgfbwryhnng)
# .env.local → VITE_SUPABASE_URL=https://….supabase.co
bun run db:push      # migrations only (CLI token once)
bun run dev          # frontend
bun run test
```

Optional Windows-local Docker remains under `scripts/*-wsl.ps1` as **opt-in**, not default `npm run backend`.

---

## Integration matrix (must stay fluid)

| Intent | After success | Source | Gate |
|--------|---------------|--------|------|
| B create | Seed health_tasks **and** vaccination_schedule | — | — |
| C day feed | Always feed_logs; intensive stock+expense | `auto:feed` | dual |
| C day water | Always water_records; rate∧intensive expense | `auto:water` | dual |
| D care complete | Withdrawal; intensive stock+expense | `auto:health` | dual + conflicts on add |
| E ready-made buy | Always expense | `auto:feed` | **purchase always** |
| F stock buy | Always expense | `auto:stock` | purchase always |
| G/H/I sales | Always revenue | `auto:eggs`/`auto:sale` | withdrawal block |

---

## Acceptance per flow (gate before next)

1. Audit code vs this plan + journeys  
2. Minimal fix  
3. Vitest green for touched domain  
4. Live smoke when possible (hosted)  
5. Update `FLOW_AUDIT_STATUS.md`  
6. Only then next flow  

---

## P0 backlog (this session targets)

1. **C:** Virtual feed/water tasks include `batch_id`; Feed CTA works.  
2. **C:** Single today kg = `getPrescriptiveFeedIntake` (+ foraging); dashboard same.  
3. **C:** Done flag = `feed_logs` only; honest flexible complete copy.  
4. **B:** Seed `vaccination_schedule` on create; toast if seed fails.  
5. **E:** Ready-made purchase always ledgers expense.  
6. **Stack:** `package.json` default scripts = bun/vite/supabase CLI (no PowerShell).
