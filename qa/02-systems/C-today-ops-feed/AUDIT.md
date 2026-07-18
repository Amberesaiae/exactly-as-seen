# C — Today ops: day feed

| Field | Value |
|-------|-------|
| Status | **CURATED** — K1/K2 fixed; core greys writer+DB live PASS; UI triple intensive PASS; residual greys deferred |
| Related journeys | C, E, F, K |
| Code roots | `Feed.tsx`, `useFeedData.ts`, `useHealthData` feed path, `confirm_day_feed` RPC |
| Spine | `confirm_day_feed` |
| WRITER_MAP | FE sole after 2026-07-17 (K1/K2 killed). Residual: RLS insert F-C-F-005; dual FE copies F-C-F-006. |
| Inventory complete | **2026-07-17** |
| Open greys | Deferred: U09, U10-flush, U12, U16–U17, U19–U20, U24, U26–U27 (see §4) |
| Auditor | deep QA session 2026-07-17 |

---

## 1. Purpose

Log today’s feed kg for a batch; intensive stock-out (+ expense rules); flexible log + Book now; no double-ledger with same-day purchase.

Canonical side-effects (`docs/CANONICAL_JOURNEYS.md`):

| System class | Effects |
|--------------|---------|
| Always | `feed_logs` row (unique batch_id + date) |
| Intensive (`intensive` / `deep_litter` / `cage`) | FIFO stock-out + expense `auto:feed` / `day-feed:{batch}:{date}` unless skip |
| Flexible (`semi_intensive` / `free_range` / `pasture`) | Log only; optional Book now expense `…:book` |
| Same-day stock purchase | Stock-out yes; expense skip (`p_skip_expense` / `shouldSkipDayFeedExpense`) |

---

## 2. Inventory (complete)

### 2.1 Spine RPC

| Site | Kind | Tables / effects |
|------|------|------------------|
| `supabase/migrations/20260713030000_intent_writers_and_seed_gaps.sql` → `public.confirm_day_feed` | **SPINE** | `assert_farm_owner`; insert `feed_logs` ON CONFLICT DO NOTHING → `already_logged`; if `p_ledger`: `allocate_fifo_by_quality` + `stock_items` qty↓; if ledger && !skip && price>0: `expenses` (`auto:feed`, unique source+source_ref); `activity_log` |
| Grant | authenticated, service_role | No later migration redefines this function (only definition is W2 migration) |

Args: `p_farm_id, p_batch_id, p_quantity_kg, p_feed_type, p_date, p_ledger, p_stock_item_id, p_unit_price_pesewas, p_skip_expense`.

### 2.2 Client writers (every write site)

| # | file:function | Network / queue | Side-effects | Class | Verdict |
|---|---------------|-----------------|--------------|-------|---------|
| W1 | `src/hooks/feed/useFeedData.ts`:`confirmDayFeed` → `supabase.rpc('confirm_day_feed')` | `POST …/rpc/confirm_day_feed` | full spine set | SPINE | **SPINE** |
| W2 | ~~rpcErr multi-write~~ **removed 2026-07-17** | — | — | dual | **KILLED** |
| W3 | offline `queueRpc('confirm_day_feed')` | outbox `rpc:confirm_day_feed` | full intent on flush | OFFLINE-OK | **KEEP** (was K2) |
| W4 | same, Book now toast action | `autoCreateExpense` → `expenses` upsert | expense only, `source_ref` `:book` | optional manual | **KEEP** |
| W5 | `src/hooks/useHealthData.ts`:`fulfillOperationalTask` (feeding) → RPC | `confirm_day_feed` | full spine | SPINE | **SPINE** (second entry — OK if RPC-only) |
| W6 | same, offline | `queueRpc('confirm_day_feed', args)` | full intent on flush | OFFLINE-OK | **KEEP** (already correct; WRITER_MAP “useHealthData” under K2 is **stale**) |
| W7 | same, `if (rpcErr) throw rpcErr` | none | fail closed | fail-closed | **KEEP** |
| W8 | same, Book now: re-RPC `confirm_day_feed` then `autoCreateExpense` if bookErr | re-RPC returns `already_logged` **without error** → expense path skipped | **false success toast, no expense** | dual / ledger-lie | **FIX** (align to KEEP Book now expense-only) |
| W9 | `src/lib/synergy.ts`:`autoDeductStock` | `allocate_fifo_by_quality` + `stock_items.update` | stock only | helper dual | **KILL as primary** (only used by K1 fallback for day feed) |
| W10 | `src/lib/synergy.ts`:`autoCreateExpense` | `expenses` upsert / offline queueWrite expenses | expense | helper | **KEEP** for Book now only |
| W11 | `src/lib/ensure-daily-tasks.ts`:`markBatchTaskComplete` | `batch_tasks` update (or offline queueWrite) | dashboard task flag | FE sync | **KEEP** (not domain ledger; must not substitute for feed_logs) |
| W12 | `ensureDailyBatchTasks` / `Once` | `batch_tasks` insert | virtual daily rows | FE | **KEEP** |

**Reads only (not writers):** `useFeedData` load of `feed_logs`; `useHealthData` load; scripts audit selects.

**Not day-feed writers (adjacent, pack E):** `ReadyMadeFeed`, `CustomFormulation`, `ConcentrateMix` — purchase/formulation multi-writes; double-ledger grey C-F-U12 / E×C.

### 2.3 UI entry points

| UI | Writer |
|----|--------|
| `src/pages/Feed.tsx` Confirm Feeding Protocol (`data-testid=confirm-feeding`) | W1 (+ W2/W3 until killed) |
| Dashboard `HealthTasksList` feeding row | **Link to `/feed` only** — no direct write |
| `Health` Care path `fulfillOperationalTask` feeding | W5–W8 (reachable if task_type `feeding` passed; WaterTab only passes hydration) |
| Virtual feed amount | `getPrescriptiveFeedIntake` × population × optional foraging mod (`useFeedData` `dailyTotalKg`) |

### 2.4 Policy helpers (no writes)

| file:function | Role |
|---------------|------|
| `ledger-policy.ts`:`shouldDeductStockOnConsumption` / `shouldExpenseConsumption` | both → `shouldAutoLedger(system)` |
| `ledger-policy.ts`:`shouldOfferBookNow` | !autoLedger |
| `ledger-policy.ts`:`shouldSkipDayFeedExpense` | skip if price≤0 **or** same-day purchase |
| `stock-match.ts`:`pickPreferredFeedStock` | rank feedish stock: name, price, qty, updated_at |
| `preferred-batch.ts` | session preferred batch for multi-flock |

### 2.5 Client vs RPC arg mapping

| Client flag | RPC |
|-------------|-----|
| `doLedger = deductStock && !!feedStock` (Feed) | `p_ledger` |
| Health: `ledger && expenseConsumption` | same gate in practice (`deduct` ≡ `expense` policy) |
| `skipExpense \|\| !expenseConsumption` | `p_skip_expense` |
| stock id / unit_price_pesewas | `p_stock_item_id` / `p_unit_price_pesewas` |

**Note:** RPC does stock-out when `p_ledger` regardless of `p_skip_expense`. Expense only when ledger && !skip && price>0. Matches same-day purchase guard.

### 2.6 Inventory checklist

- [x] Sole call sites to `confirm_day_feed` (client): `useFeedData.confirmDayFeed`, `useHealthData.fulfillOperationalTask` feeding (+ Health Book now re-RPC)
- [x] **KILL** block: feed_logs.insert + autoDeduct + autoExpense on rpcErr — **present** in useFeedData only
- [x] Offline path: Feed = queueWrite feed_logs (**KILL**); Health = queueRpc (**OK**)
- [x] `shouldSkipDayFeedExpense` client vs RPC `p_skip_expense` — wired both paths
- [x] `pickPreferredFeedStock` multi-item farms — ranked helper
- [x] Multi-flock selectedBatch / preferred batch — resolvePreferred + setPreferred on select
- [x] Prescriptive kg + foraging modifiers — in dailyTotalKg
- [x] batch_tasks feed_log complete sync — markBatchTaskComplete after success (online paths)

### 2.7 RLS surface (enabler)

`feed_logs` still has user INSERT policy (`20260711000000_contract_alignment.sql`). That **enables** K1 client insert. Closing K1 in FE is mandatory; optional later: revoke direct insert from clients so only SECURITY DEFINER RPC can write (out of pack unless curated).

---

## 3. Static findings (pre-acid)

| ID | Sev | Class | Summary | Curation |
|----|-----|-------|---------|----------|
| F-C-F-001 | P0 | dual-writer | **K1:** `useFeedData` on `rpcErr` multi-writes feed_logs + stock + expense | **FIXED** FE |
| F-C-F-002 | P0 | offline | **K2:** Feed Lab offline queues raw `feed_logs` only → offline ≠ online | **FIXED** FE |
| F-C-F-003 | P1 | ledger-lie | Health Book now re-RPC → false success without expense | **FIXED** FE |
| F-C-F-004 | P2 | gate/UX | Health `rpcErr` throw | **FIXED** toast+return |
| F-C-F-005 | P3 | surface | Client INSERT on `feed_logs` still allowed by RLS | **DEFER** |
| F-C-F-006 | P2 | path-skew | Two confirm implementations | **DEFER** extract helper |

Findings files: `qa/05-findings/F-C-F-001.md` … (as created).

---

## 4. Grey usecases (mandatory depth)

### 4.1 Seed (from pack)

| ID | Usecase | Acid | Status |
|----|---------|------|--------|
| C-F-U01 | Intensive, stock present, priced | feed_logs + stock↓ + expense? | **PASS** writer+DB; UI intensive also (expense skip when same-day buy) |
| C-F-U02 | Intensive, no stock match | log allowed; no stock/expense | **PASS** writer+DB |
| C-F-U03 | Intensive, same-day purchase | stock↓, expense skip | **PASS** writer+DB (`p_skip_expense`) |
| C-F-U04 | Flexible, log only | no expense | **PASS** writer+DB |
| C-F-U05 | Book now after flexible | expense `:book` | **PASS** writer+DB (KEEP expense path) |
| C-F-U06 | Double confirm same day | already_logged | **PASS** writer+DB |
| C-F-U07 | RPC fails | no client partial write | **PASS** FE clean + RPC fail-closed; UI force-fail not mocked |
| C-F-U08 | Multi-flock batch isolation | batch_id scoped logs | **PASS** writer+DB (RPC scoped; UI selection not dual-confirmed) |
| C-F-U09 | Preferred new flock after create | Confirm CTA | **DEFER** (preferred-batch unit tests exist; live create UI not re-run) |
| C-F-U10 | Offline day feed | queueRpc full semantics | **PASS** contract; **DEFER** live Dexie flush |
| C-F-U11 | Week/foraging modifiers | helper values | **PASS** unit (broiler w1=0.05); multi-species UI **DEFER** |
| C-F-U12 | Formulation × day feed | double-ledger | **DEFER** → pack E |

### 4.2 Expanded greys

| ID | Usecase | Status |
|----|---------|--------|
| C-F-U13 | Entry skew Feed vs Health | **PASS** both RPC-only + queueRpc after fix; extract helper DEFER F-C-F-006 |
| C-F-U14 | Book now Health lie | **PASS** fixed (expense-only) |
| C-F-U15 | unit_price 0 intensive | **PASS** writer+DB stock-out no expense |
| C-F-U16 | Stock qty < kg / overdraw | **DEFER** |
| C-F-U17 | markBatchTaskComplete fail drift | **DEFER** |
| C-F-U18 | Wrong batch | **PASS** `active batch not found` |
| C-F-U19 | Double-click race | **DEFER** (U06 covers sequential) |
| C-F-U20 | Multi-item pick ranking | **DEFER** (UI picked alternate bag vs harness stock — observe OK) |
| C-F-U21 | cage intensive-class | **PASS** writer+DB |
| C-F-U22 | free_range flexible | **PASS** writer+DB |
| C-F-U23 | qty ≤ 0 | **PASS** exception |
| C-F-U24 | Offline batch_tasks order | **DEFER** |
| C-F-U25 | book vs auto source_ref | **PASS** |
| C-F-U26 | Feed vs withdrawal | **DEFER** (product: feed not gated) |
| C-F-U27 | K1 UI network error toast | **DEFER** (code path toast+return; no browser mock) |

### 4.3 Live evidence

| Artifact | Content |
|----------|---------|
| `qa/06-evidence/C-feed/LIVE-2026-07-17-writer-db.md` | 22/22 writer+DB |
| `qa/06-evidence/C-feed/LIVE-2026-07-17-ui-triple.md` | 9/9 UI+network+DB intensive |
| `qa/06-evidence/C-feed/UI-01-feed-page.png` etc. | screenshots |
| `qa/06-evidence/C-feed/STATIC-2026-07-17-sole-writer.txt` | grep clean |

### 4.3 Acid matrix template

Per usecase (see `qa/00-methodology/E2E_PROOF_STANDARD.md`):

| Proof | Required |
|-------|----------|
| UI | enablement, toast, no silent success |
| Writer | only `rpc/confirm_day_feed` (or sole KEEP Book expense); **no** client feed_logs/expenses/stock on confirm |
| DB | feed_logs ± stock_transactions/lots ± expenses ± batch_tasks ± activity_log |

Evidence dir: `qa/06-evidence/C-feed/`.

---

## 5. Kill list (this pack owns)

| ID | Target | Status |
|----|--------|--------|
| **K1** | Feed RPC fallback multi-write in `useFeedData` | **FIXED** FE 2026-07-17 — live U07 |
| **K2** | Offline feed_logs-only in `useFeedData` | **FIXED** FE 2026-07-17 — live U10 |
| Book now Health re-RPC | F-C-F-003 | **FIXED** FE 2026-07-17 |

**Not in pack:** formulation writers (E), stock purchase (F), care dual (D).

---

## 6. Cross edges

| Edge | Note |
|------|------|
| E purchase / formulation | Double-ledger C-F-U12 |
| F stock lots | FIFO via allocate_fifo_by_quality inside RPC |
| K finance | expenses source `auto:feed` |
| Dashboard batch_tasks | feed_log complete sync |
| Offline outbox | `sync.ts` flush supports `rpc:confirm_day_feed` |

---

## 7. Session log

| Date | Work |
|------|------|
| 2026-07-17 | Full writer inventory; expanded greys U13–U27; static K1/K2/Book-now findings; pack opened from NOT_STARTED |
| 2026-07-17 | FIX K1/K2/Book-now/Health fail-closed; findings F-C-F-001…006; status → ACID_IN_PROGRESS; greys still open |
| 2026-07-17 | Live RPC attempt AUTH blocked (email not confirmed; no LIVE_AUDIT_*). Greys remain GREY. Evidence: `qa/06-evidence/C-feed/` |
| 2026-07-17 | Auth via thorough user `live.fix.1783906173@example.com`. Writer+DB 22/22. UI triple 9/9 (sole `confirm_day_feed`, no feed_logs/expenses POST). Status → **CURATED**. Not CLOSED (deferred greys). |
