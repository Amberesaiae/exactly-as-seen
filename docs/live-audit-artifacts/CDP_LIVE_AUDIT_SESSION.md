# Chrome DevTools MCP Live Audit (headed)

**Date:** 2026-07-13  
**Method:** Chrome DevTools MCP (visible browser), Vite `http://127.0.0.1:5173`, hosted Supabase `ulliwnizurgfbwryhnng`  
**Account:** `cdp.live.1783907193@example.com`  
**Farm:** CDP Live Farm  

Screenshot: `docs/live-audit-artifacts/cdp-session/dashboard-4-species.png`

---

## Species matrix (Flow B)

| Species | Flock | House | System | Result | Notes |
|---------|-------|-------|--------|--------|-------|
| Broiler | Audit Broiler A | House 1 | Deep Litter (intensive) | **PASS** | `fe3fdeb5…`, 100 birds, toast + detail URL |
| Layer | Audit Layer A | House Layer | Cage (intensive) | **PASS** | `61ffcf35…`, cycle default 72 wks |
| Duck | Audit Duck A | House Duck | Semi-Intensive (flexible) | **PASS** | Requires Duck Type (Meat); `b0e171e3…` |
| Turkey | Audit Turkey A | House Turkey | Semi-Intensive | **PASS** | `b6cabdae…` |

**Gate:** After first flock, no free houses until Settings → Add House. Settings briefly showed “No houses” while House 1 existed (occupied) — list recovered after add.

Dashboard after multi-species: **399 birds**, **4 active flocks** (turkey −1 mortality).

---

## Flow board (this session)

| Flow | Live | Evidence |
|------|------|----------|
| **A Onboard** | Prior green | Login session reused |
| **B Start flock** | **Green ×4 species** | Create + redirect; dual seed visible |
| **C Today ops** | **Green (broiler)** | Feed: `Feed logged (5kg) — no feed stock…`; Water: `Today's hydration confirmed: 2 gal` + ✓ Logged |
| **D Care complete** | **Partial** | health_tasks Complete → “Task completed”; **vaccination_schedule not updated** (Vaccines tab still Complete; summary 0/5) |
| **E Plan/buy feed** | Smoke only | New Formulation link present; day feed OK |
| **F Stock** | **Partial** | Add item + PURCHASE qty/price → stock 75 kg; **Ledger Expenses empty** (purchase expense silent?) |
| **G Eggs** | **Gate OK** | Collect blocked: *not permitted for layers before week 19* |
| **H Mortality** | **Green** | Turkey −1 → pop 99, rate 1.0% |
| **I Terminate** | Not exercised | Buttons present |
| **J Jobs** | N/A | Edge not re-run |
| **K Hub** | **Green UI** | Dashboard 4 flocks + house tasks; Finance overview loads; profit 0 |

---

## Findings (severity)

### P0 / P1 — product correctness

1. **Dual vaccination writers not unified (Flow D)**  
   Completing Gumboro on **This Week** (`health_tasks`) does not mark the matching row on **Vaccines** (`vaccination_schedule`). Summary stays `0/5 done` with `1 due`. Matches known backlog in `FLOW_AUDIT_STATUS.md`.

2. **Stock purchase → expense may not book (Flow F / dual purchase class)**  
   UI: `Recorded purchase: 25 kg` and inventory +25 kg. Finance → Expenses: *No expenses recorded yet.* Code path upserts `expenses` without checking error (`useStockData.ts`). Possible silent 400/constraint/RLS failure. **Hard failure vs contract:** purchases always ledger.

3. **Feed auto-deduct category mismatch (Flow C intensive)**  
   Toast: no feed stock for auto-deduct. Matcher uses `.ilike('category', 'feed')` but stock UI category is `feed_ingredient` / `FEED_INGREDIENT`. Intensive broiler day-feed never finds stock even after purchase.

### P2 — UX / reliability

4. **Health.tsx infinite update loop**  
   Console: `Maximum update depth exceeded` at `Health.tsx` when switching batches / Vaccines tab.

5. **Suspected cross-batch bleed on Care**  
   After switching Active Batch to Layer, Water showed `✓ Logged` and completed Gumboro at broiler’s completion time without Layer care actions. Needs repro after Health state fix.

6. **House capacity gate**  
   Multi-species audit needs N free houses; only one house from farm setup. Expected product rule; friction for demos.

7. **Egg collect CTA before eligibility**  
   Collect opens and validates only on submit (week 19 gate). Prefer disable/warn earlier.

8. **Settings house count**  
   Header “Houses” count vs Farm tab list inconsistency observed once (0 formulations / odd counts).

---

## What worked well

- Headed Chrome DevTools audit is fully operable for A–H smoke without admin PowerShell.  
- Species defaults sensible: broiler deep litter 8 wks; layer cage 72; duck type + semi-intensive 12; turkey semi-intensive.  
- Harvest nav appears when a layer flock exists.  
- Water dual intensive path ledgers message + protocol fulfilled.  
- Egg week eligibility gate correct.  
- Mortality updates population + rate immediately.  
- Dashboard aggregates multi-species flocks and pending care tasks.

---

## Recommended next fixes (atomic)

1. ~~Unify vax complete~~ **Done** — `src/lib/care-completion.ts`  
2. ~~Surface expense errors~~ **Done** — `useStockData` insert + toast; unit_price on purchase  
3. ~~Match feed stock categories~~ **Done** — `src/lib/stock-match.ts`  
4. ~~Health update-depth loop~~ **Done** — stable `fetchWeeklySummary` + lean effect deps  
5. Headed re-smoke of 1–4 on live farm  
6. Optional: seed free houses or multi-house farm setup for multi-species demos

---

## Session trail (abbrev)

1. Resume `/batches/new` step 2 broiler → Create Flock → detail  
2. Health: Complete Gumboro; Water confirm; Feed confirm  
3. Settings: House Layer / Duck / Turkey  
4. Create Layer, Duck (Meat), Turkey  
5. Turkey mortality 1  
6. Eggs collect blocked week 1  
7. Stock item + purchase 25 kg  
8. Finance expenses empty; Dashboard 399 / 4 flocks  
