# Core Flows — User Journeys

**Status:** Spec v2 (rewritten 2026-05-03)
**Module path:** Cross-cutting; primary frontend at `artifacts/web/src/routes/`
**Owner:** TBD

---

## 1. Purpose & Scope

This spec is the canonical product-level walkthrough of every primary LampFarms user journey. It does **not** define entities, schemas, or jobs (those live in module specs); it defines **what the farmer sees, taps, and gets back** for each flow, and how each flow composes the API endpoints owned by other specs.

Guiding principles (apply to every flow):

- **Offline-first:** every write succeeds locally; the outbox replays on reconnect (Flow 10).
- **Safety-first:** medication conflicts (CONVENTIONS §2.2) and withdrawal periods (`04_WATER_HEALTH.md` §6) are enforced before any write completes.
- **Dovetail Synergy:** one user action fans out to feed/stock/finance/health side-effects via the event bus (`11_EVENTS.md`). Banners explicitly tell the farmer what fired.
- **Cost privacy:** all currency values are masked (`●●●●`) until the per-user toggle is enabled. The toggle UI is owned by `07_FINANCE.md` §8 and embedded on Dashboard, Finance, batch detail, and Records.
- **Doses:** every medication/water dose displayed in any flow uses the formula `dose = dose_per_gallon × (water_volume_l / 3.785)` from CONVENTIONS §2.13. The legacy `× 1.5` formula is gone.

Out of scope:

- Backend implementation details (see numbered module specs).
- Hardware integrations, SMS, vet portal (CONVENTIONS §7).

---

## 2. Domain Model Summary

This spec touches every entity defined elsewhere; it owns none. Quick reference:

| Term | Source spec |
|---|---|
| Farm, House, User, UserPreference | `12_AUTH_AND_USERS.md` |
| Batch, BatchPhase, Mortality | `02_BATCH_MANAGEMENT.md` |
| HealthTask (with `delivery_method`, CONVENTIONS §2.12) | `04_WATER_HEALTH.md` |
| FeedFormulation, FeedRecord | `05_FEED_CALCULATOR.md` |
| EggProduction, EggSale | `06_EGG_PRODUCTION.md` |
| Expense, Revenue | `07_FINANCE.md` |
| StockItem, StockAllocation, Supplier | `03_STOCK.md` |
| BatchRecord, ComparisonView | `08_RECORDS.md` |
| OutboxEntry, SyncConflict | This spec §7 + `13_SYNC.md` |

---

## 3. Wireframes

ASCII wireframes per flow. Pixel-level mockups remain in `attached_assets/` and `artifacts/mockup-sandbox/` for visual reference; this section is the authoritative content / counts / labels.

### 3.1 Registration & Sign-in (Flows 1–2)

```
┌─────────────────────────────┐    ┌─────────────────────────────┐
│ 🌾 LampFarms                │    │ 🌾 LampFarms                │
│ Create your account         │    │ Sign in                     │
│                             │    │                             │
│ Full Name  [____________]   │    │ Email     [____________]    │
│ Email      [____________]   │    │ Password  [____________]    │
│ Farm Name  [____________]   │    │ [ Sign In →            ]    │
│ Password   [____________]   │    │ Forgot password?            │
│ [ Create Account →      ]   │    │ New here? Create account    │
│ Already have an account?    │    └─────────────────────────────┘
│ Sign In                     │
└─────────────────────────────┘
```

### 3.2 Farm Setup Wizard (Flow 1, post-register)

```
[●●○]  Step 2 of 3 — Houses
─────────────────────────────────────
Add at least one house. You can add more later.

  House Name          Capacity (birds)
  [House A         ]  [ 500          ]   [✕]
  [House B         ]  [ 300          ]   [✕]
  [+ Add another house]

                          [ Back ] [ Next → ]
```

### 3.3 Create Batch — Step 1 (species + production system)

```
[●○○○]  Step 1 of 3/4 — Species & Production System
─────────────────────────────────────────────────────
Species:
  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
  │ 🐔   │ │ 🐓   │ │ 🦆   │ │ 🦃   │
  │Broil │ │Layer │ │Duck  │ │Turkey│
  │6–8 wk│ │72–78w│ │ see  │ │12–20w│
  │      │ │      │ │ next │ │def 16│
  └──────┘ └──────┘ └──────┘ └──────┘

Production system:
  ◉ Intensive — Automatic feed pattern
  ○ Semi-Intensive — Flexible feed (Duck Wk6+ / Turkey Wk8+)
  ○ Free-Range  (Duck/Turkey only)

[ Cancel ]                     [ Next → ]
```

Rules in this step:

- Broiler & Layer: Intensive only, the other two options are disabled.
- Layer cycle label is **72–78 weeks** (CONVENTIONS §2.4); production starts Week 19+ (CONVENTIONS §2.1).
- Turkey label is **12–20 weeks (default 16)** (CONVENTIONS §2.5).
- Duck shows no fixed cycle on the card — Step 1b resolves it.

### 3.4 Create Batch — Step 1b (Duck only, CONVENTIONS §2.6)

Inserted between Step 1 and Step 2 **iff species = duck**.

```
[●●○○]  Step 1b of 4 — Duck Type
─────────────────────────────────────
Pick the type of duck batch:

  ┌─────────────────────────┐  ┌─────────────────────────┐
  │ 🍗 Meat Duck            │  │ 🥚 Layer Duck           │
  │ 8–10 weeks              │  │ 72+ weeks               │
  │ Sold for meat           │  │ Egg production Wk 20+   │
  │ No egg tracking         │  │ Egg tracking enabled    │
  └─────────────────────────┘  └─────────────────────────┘

[ Back ]                              [ Next → ]
```

The selection is persisted on the batch as `duck_type` and drives the FSM, water tables, feed phases, and egg tracking.

### 3.5 Create Batch — Step 3 review (Broiler example, CONVENTIONS §2.8)

```
Step 3 of 3 — Review
─────────────────────────────────────
Species:           Broiler (Intensive)
House:             House A
Initial quantity:  500 birds
Start date:        2026-04-10
Lifecycle:         8 weeks (default broiler)

Auto-generated on confirm:
  • Day 1 brooding setup tasks
  • 5 vaccinations scheduled:
      Day  7 — Gumboro Intermediate
      Day 14 — HB1 (Newcastle + IB)
      Day 21 — Gumboro Intermediate Plus
      Day 28 — Lasota (Newcastle)
      Day 35 — Gumboro Intermediate Plus
  • Daily water + medication tasks per Broiler protocol

[ Back ]                       [ Confirm Batch ]
```

For Layer/Duck/Turkey the auto-generated list reflects their protocol (`14_LAYER.md`, `15_DUCK.md`, `16_TURKEY.md`). Duck-layer batches additionally show `"Niacin task generated daily Day 1–Wk 4, then weekly (1.5 tsp / 1 gal)"` (CONVENTIONS §2.9).

### 3.6 Health task — drinking-water medication

```
Task: Amprolium 20% (Coccidiostat)
Batch: Broiler #12 · Wk 3 · 490 birds
─────────────────────────────────────
Delivery method:   Drinking water
Container:         [ Bell Drinker 6L          ▾ ]
                   (one of 9 canonical containers)
Water volume:      6 L
Dose per gallon:   1.5 tsp        ← from medication record
Calculated dose:   1.5 × (6 / 3.785) = 2.4 tsp     ← CONVENTIONS §2.13
Rounded for use:   2.5 tsp (½ tsp granularity)
Withdrawal:        0–24 h
Notes:             [______________________________]

[ Mark Complete ]
```

### 3.7 Health task — injection vaccine (CONVENTIONS §2.12)

The container/teaspoon UI is **not shown** for injection tasks.

```
Task: Duck Viral Hepatitis Vaccine
Batch: Duck #5 · Wk 1 · 300 birds (meat)
─────────────────────────────────────
Delivery method:   Injection — Subcutaneous
Site:              Back of neck (subcutaneous)
Dose per bird:     0.5 ml
Total to draw:     150 ml (300 birds × 0.5 ml)
Manual administration — give to each bird individually.

Withdrawal:        21 days (meat)
Notes:             [______________________________]

[ Mark Complete ]
```

Same pattern for Fowl Pox (delivery_method = `injection_wing_web`, site = "wing web").

### 3.8 Conflict warning banner (unified 8-conflict matrix, CONVENTIONS §2.2)

Shown above the **Mark Complete** button when the safety preprocessor flags a conflict. The codes match CONVENTIONS §2.2.

```
┌─────────────────────────────────────────────────────────┐
│ ⛔  BLOCK · C5 — Enrofloxacin + another antibiotic       │
│ Reason: Fluoroquinolone resistance development.         │
│ This task cannot be completed while the conflicting     │
│ task is active. Cancel one of them, or wait until the   │
│ conflicting course ends (Apr 13).                       │
│ [ View conflicting task ]   [ Cancel this task ]        │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│ ⚠  WARN · C3 — Dewormer + Coccidiostat same day         │
│ Reason: Reduced efficacy of both.                       │
│ You can proceed but the result may be sub-optimal.      │
│ [ Acknowledge & Continue ]   [ Cancel ]                 │
└─────────────────────────────────────────────────────────┘
```

Severity rendering:

| Severity | Color | Action button |
|---|---|---|
| `BLOCK` | red | "Mark Complete" disabled until conflict resolved |
| `WARN`  | amber | "Acknowledge & Continue" enables completion |

All 8 codes (C1–C8) use the same component with different copy pulled from a static dictionary keyed by code.

### 3.9 Sync conflict resolution (Flow 10)

Two variants per CONVENTIONS / safety considerations:

```
Benign field (e.g. notes, name, cost_privacy_enabled, batch.notes)
┌─────────────────────────────────────────────────────────┐
│ ⚠ Sync Conflict — Batch #12 notes                       │
│ Your version:   "Switched to Amo finisher"              │
│ Server version: "Try local maize next round"            │
│ [ Keep Mine ]   [ Use Server ]   [ Edit & Merge ]       │
└─────────────────────────────────────────────────────────┘
```

```
Safety-critical field (population, mortality, withdrawal_until, health_task.status)
┌─────────────────────────────────────────────────────────┐
│ ⛔ Sync Conflict — Batch #12 population                  │
│ Resolved automatically: server version kept (488).      │
│ Your local change (490) was reverted to prevent unsafe  │
│ data divergence on safety-critical fields.              │
│ [ View what changed ]                                   │
└─────────────────────────────────────────────────────────┘
```

Field classification table is owned by `13_SYNC.md` §4.

### 3.10 Cost-privacy toggle (referenced from `07_FINANCE.md` §8)

Eye icon appears on every currency value. Tap toggles globally and persists `user_preferences.cost_privacy_enabled`.

```
Weekly Expenses   👁          Weekly Expenses   🚫
●●●●                 →        GHS 1,240.50
```

### 3.11 Offline banner

Shown at the very top of every page while offline.

```
█ You're offline · 4 changes pending sync           [ Sync Now ] █
```

Per-record pending pill: `⏳ Pending` (orange) → `✓ Synced` (green) once flushed.

---

## 4. Component Inventory

| Component | Used in flows | Notes |
|---|---|---|
| `<AuthForm kind="signin"\|"register">` | 1, 2 | Plain form; redirects on success. |
| `<FarmSetupWizard>` | 1 | 3 steps; cannot be skipped post-register. |
| `<BatchWizard>` | 3 | 3 steps for non-duck; 4 steps for duck (Step 1b). |
| `<SpeciesCard>` | 3 | One per species. Duck card shows "see next" (no fixed cycle). |
| `<DuckTypeCard>` | 3 (Step 1b) | meat / layer. |
| `<BatchHeader>` | 4, 6, 9 | Name + species badge + phase + week + withdrawal countdown. |
| `<BatchTabs>` | 4 | Overview / Feed / Health / Performance / Expenses. |
| `<MortalityModal>` | 4 | Number, reason (disease/injury/unknown/other), notes. Idempotent. |
| `<AdvanceWeekModal>` | 4 | Preview of new phase/tasks; 409 → reload (CONVENTIONS §2.14). |
| `<TerminateBatchModal>` | 9 | Disabled if `withdrawal_until > now` (FSM guard from `02_BATCH_MANAGEMENT.md` §4). |
| `<FeedFormulationCard>` | 5 | Method (Ready-Made / Custom / Concentrate); horizon (bags / days). |
| `<DovetailBanner>` | 5, 6, 7, 8 | "Confirming will: create expense · allocate stock · update batch cost". |
| `<HealthTaskCard>` | 6 | Renders dose per CONVENTIONS §2.13 for water tasks; injection layout per §2.12. |
| `<ContainerPicker>` | 6 | One of 9 containers (CONVENTIONS §2.3). Hidden when `delivery_method` ≠ `drinking_water`. |
| `<ConflictBanner>` | 6 | 8 codes; severity-driven button state (§3.8). |
| `<WithdrawalBanner>` | 4, 6, 9 | Countdown to `withdrawal_until` in farm timezone. |
| `<EggEntryForm>` | 8 | Eggs, broken, size distribution. |
| `<EggSaleModal>` | 8 | Crate / individual; auto-creates revenue. |
| `<TransactionModal>` | 14 | 9-category grid (matches `07_FINANCE.md` §2). Expense/Revenue tab toggle. |
| `<RecordsTabs>` | 11 | Batch Overview / Performance / Financial / Compare. |
| `<CompareView>` | 17 | 2–3 columns; best-value highlighting. |
| `<OfflineBanner>` | 10 | Persistent header when `!navigator.onLine`. |
| `<SyncConflictModal>` | 10 | Two variants (§3.9). |
| `<CostPrivacyToggle>` | every currency surface | Owned spec: `07_FINANCE.md` §8. |

---

## 5. Interaction Flows

Each flow lists Trigger → Steps → Side effects → Exit. Endpoint references go to §6.

### Flow 1 — Registration & Farm Setup

1. Welcome → tap **Create Account** → form (full name, email, password, farm name).
2. `POST /auth/register` (§6.1) → server returns access + refresh tokens; user signed in.
3. Client checks `farm.setup_complete=false` → forces `<FarmSetupWizard>`.
4. Step 1 Farm details, Step 2 Houses (≥ 1), Step 3 Preferences (currency `GHS` default; cost privacy on by default; theme).
5. **Finish** → `PATCH /farms/me` + `POST /farms/me/houses[]` + `PATCH /users/me/preferences`.
6. Redirect to Dashboard with empty state CTA "Create Your First Batch".

### Flow 2 — Sign In

1. Email + password → `POST /auth/login` (§6.2).
2. On success: if `farm.setup_complete` → Dashboard, else wizard.
3. On 401: inline error.
4. Offline + valid local session → load Dexie cache, no re-login.

### Flow 3 — Create a Batch

1. Open wizard from Dashboard / Batches → Step 1 species + production system.
2. **Step 1b only when species=duck:** pick duck type (`meat` / `layer`).
3. Step 2 batch details (auto-suggested name, house dropdown, initial quantity, start date).
4. Step 3 review (preview list of auto-generated tasks; broiler shows the 5 vaccinations from §3.5).
5. Confirm → `POST /batches` (§6.3) with idempotency key.
6. Server creates batch, runs species protocol task generator (`04_WATER_HEALTH.md` §7), and emits `BATCH_CREATED`.
7. Toast: `"Batch created — N health tasks generated for Week 1"` (N reflects actual count).
8. Navigate to batch Overview tab.

Offline: batch is created in Dexie with a UUIDv7 generated client-side; outbox entry queued.

### Flow 4 — Batch Detail & Daily Management

1. Tap **View** → 5-tab batch detail.
2. **Overview** = badges + 4 stat cards + recent activity.
3. **Record Mortality:** modal → `POST /batches/:id/mortality` (§6.4); population recomputed; event `MORTALITY_RECORDED`.
4. **Advance Week (manual):** preview modal → `POST /batches/:id/advance-week` with `expected_current_week`. 409 → re-fetch + retry (CONVENTIONS §2.14).
5. **Terminate:** disabled while `withdrawal_until > now`. See Flow 9.

### Flow 5 — Feed Formulation (Dovetail)

1. Open Feed tab; context (species/phase/week/population) auto-set.
2. Choose method: Ready-Made / Custom Mix (41 ingredients) / Concentrate.
3. Set horizon (bags or days).
4. System renders preview: ingredients, kg, cost (masked), stock check.
5. If shortfall: amber "⚠ Maize: 40 kg short" with options Continue / Add to Stock.
6. **Confirm** → `POST /feed/formulations/:id/confirm` (§6.5). Server fires `FEED_FORMULATION_CONFIRMED` →
   - `expenses` row inserted (`07_FINANCE.md`)
   - `stock_allocations[]` inserted (FIFO + Quality, CONVENTIONS §2.15)
   - batch cost updated
7. Banner: `"Feed confirmed · Expense recorded · Stock allocated"`.

Offline: queued; Dovetail effects re-run server-side on flush.

### Flow 6 — Health Task Management

1. Open Health tab → tasks sorted Overdue → Today → Upcoming.
2. Tap a task → modal renders per delivery method:
   - `drinking_water` → §3.6 layout, dose computed via §2.13 formula.
   - `injection_subcutaneous` / `injection_wing_web` → §3.7 layout, no container/tablespoon.
   - `in_feed` → "Mix into feed: X g per kg" (no container).
   - `topical` → "Apply to … " freeform notes.
3. Conflict preprocessor runs → if any of C1–C8 fires, `<ConflictBanner>` appears (§3.8). BLOCK disables the action; WARN gates it behind acknowledgement.
4. **Mark Complete** → `POST /health-tasks/:id/complete` (§6.6) with idempotency key.
5. Side effects via `HEALTH_TASK_COMPLETED`:
   - medication expense
   - stock deduction
   - anti-stress follow-up task generated if applicable
   - if medication has withdrawal: batch enters `withdrawal` FSM state with `withdrawal_until = max(existing, completed_at + medication.withdrawal_days)`.
6. Withdrawal banner appears on batch header; **Terminate** disabled.

### Flow 7 — Stock Management

1. Stock page lists items by category; low-stock at top.
2. **+ Add Stock** → form (category, item, qty, unit price, supplier, purchase date) → `POST /stock/items` (§6.7) + `POST /stock/lots`.
3. Server emits `STOCK_PURCHASED` → expense auto-created.
4. **View Allocations** drills into `stock_allocations` per item.
5. Auto-allocation runs server-side on Feed confirm (FIFO + Quality, CONVENTIONS §2.15).

### Flow 8 — Egg Production

1. Eggs page shows today's entry form for active layer/duck-layer batches in production phase (Layer Wk 19+, Duck-layer Wk 20+; CONVENTIONS §2.1, §2.7).
2. Enter eggs collected, broken/rejected, size distribution → `POST /eggs/production` (§6.8).
3. **Record Sale** → `POST /eggs/sales`; emits `EGG_SALE_RECORDED` → revenue auto-created.
4. **Egg withdrawal:** if batch is in withdrawal, eggs entered are flagged `discarded=true` and excluded from revenue.

### Flow 9 — Batch Termination

1. Tap **Terminate** (Overview) → server pre-check.
2. If withdrawal active → button disabled with tooltip showing days remaining.
3. Else modal shows summary; farmer enters sales (qty, price/bird, buyer optional, reason).
4. **Confirm** → `POST /batches/:id/terminate` (§6.9). FSM moves to `terminated`; revenue created; final P&L computed.
5. Batch disappears from active lists, appears in Records.

### Flow 10 — Offline Sync

1. App detects `online` event (or manual **Sync Now**).
2. Outbox is replayed in insertion order; each request carries its persisted `Idempotency-Key`.
3. Per-entity result handling:
   - **2xx** → mark synced, drop from outbox.
   - **4xx (validation)** → mark `permanently_failed`; surface to user with reason.
   - **409 Conflict** → fetch server state and route to conflict resolution:
     - Safety-critical fields (`population_current`, `mortality_count`, `withdrawal_until`, `health_task.status`, `batch.phase`, `batch.current_week`) → **server-wins automatically**, local diff discarded, user notified (§3.9 second variant).
     - Benign fields (`notes`, names, `cost_privacy_enabled`, descriptions, optional metadata) → **user-choice modal** with Keep Mine / Use Server / Edit & Merge (§3.9 first variant).
4. While offline: every page works; offline banner persistent; per-record `⏳ Pending` pill until flushed.

### Flow 11 — Records & Analytics

1. Records page → 4 tabs (Batch Overview / Performance / Financial / Compare) + filter bar (species, status, date range) + Export button.
2. Tab 1 lists active + completed batches with metrics + Compare checkbox (max 3).
3. Tab 2: farm-wide trends + Insights panel.
4. Tab 3: revenue/expense summary + breakdowns + monthly trend.
5. Export → PDF/CSV via `GET /records/export` (§6.11). Mobile uses native share sheet.

### Flow 12 — Settings (5 tabs)

Preferences / Market Prices / Species Config (read-only) / System / Data. Cost-privacy toggle and currency selection live in Preferences. See `12_AUTH_AND_USERS.md` §6.

### Flow 13 — Alternative Feeding (Semi-Intensive Duck/Turkey)

1. At batch creation Step 1, picking Semi-Intensive surfaces a foraging-modifier slider (Duck 15–25%, Turkey 12–22%; defaults pre-selected).
2. From the eligible week (Duck Wk 6, Turkey Wk 8) the Feed tab replaces the auto-formulation card with **Record This Week's Feed**:
   - Shows `base_kg`, `foraging_reduction_kg`, `recommended_kg = base × (1 − modifier)`.
   - Farmer enters actual; optionally adjusts next week's slider.
3. **Save** → `POST /feed/records` (§6.13). Stock deducted, expense created, weekly summary updated.
4. Mid-batch slider edits show note `"Adjusted from X% → Y% — watch for weight loss if reducing"` and apply from next week.

### Flow 14 — Manual Finance Entry

1. Modal → toggle Expense / Revenue at top.
2. Expense: 3×3 category grid (9 categories — see `07_FINANCE.md` §2), amount, description, date, optional batch link, payment method.
3. Revenue: type, amount, qty + unit, buyer optional, date.
4. **Save** → `POST /finance/expenses` or `POST /finance/revenues` (§6.14). Updates summaries in real time.
5. Toast e.g. `"Expense saved — GHS 450 added to Labor & Workers"`. Offline → ⏳ Pending pill.

### Flow 15 — Finance Dashboard

1. Header summary (expenses month, revenue month, net P&L) — masked unless privacy off.
2. Donut: expense breakdown by category. Section: revenue by type. Transactions list with filter tabs (All / Expenses / Revenue) + search.
3. Each row: category icon, description, batch, date, amount, source badge (Auto / Manual).
4. Tap a row → detail; manual entries are editable/deletable.

### Flow 16 — Data Export & Account Management

1. Settings → Data → Export Farm Data (JSON / CSV / PDF) → `GET /data/export?format=…` (§6.16).
2. Export Batch Report → choose batch → same formats.
3. Delete Account → confirmation requires typing farm name → `DELETE /users/me`.
4. Clear Local Cache → wipes Dexie, reloads SW.

### Flow 17 — Batch Comparison

1. Pick 2–3 batches via Records checkboxes → floating **Compare Selected** button.
2. Compare view: fixed metric column + one column per batch (Overview / Performance / Financial / Health / Feed metric groups).
3. Best value per row highlighted green. Insights panel below auto-generates observations (e.g. FCR diff with vaccination correlation).
4. Export Comparison → PDF.
5. Remove a batch column → swap from picker.

---

## 6. API Calls Made

All endpoints are owned by other specs; this section is a routing table.

| # | Method · Path | Triggered by | Owned by |
|---|---|---|---|
| 6.1 | `POST /api/v1/auth/register` | Flow 1 | `12_AUTH_AND_USERS.md` §5 |
| 6.2 | `POST /api/v1/auth/login` | Flow 2 | `12_AUTH_AND_USERS.md` §5 |
| 6.3 | `POST /api/v1/batches` | Flow 3 | `02_BATCH_MANAGEMENT.md` §5 |
| 6.4 | `POST /api/v1/batches/:id/mortality` | Flow 4 | `02_BATCH_MANAGEMENT.md` §5 |
| 6.4b | `POST /api/v1/batches/:id/advance-week` | Flow 4 | `02_BATCH_MANAGEMENT.md` §5 (CONVENTIONS §2.14) |
| 6.5 | `POST /api/v1/feed/formulations/:id/confirm` | Flow 5 | `05_FEED_CALCULATOR.md` §5 |
| 6.6 | `POST /api/v1/health-tasks/:id/complete` | Flow 6 | `04_WATER_HEALTH.md` §5 |
| 6.6b | `POST /api/v1/health-tasks/:id/conflict-check` | Flow 6 (preprocessor) | `04_WATER_HEALTH.md` §5 |
| 6.7 | `POST /api/v1/stock/items`, `POST /api/v1/stock/lots` | Flow 7 | `03_STOCK.md` §5 |
| 6.8 | `POST /api/v1/eggs/production`, `POST /api/v1/eggs/sales` | Flow 8 | `06_EGG_PRODUCTION.md` §5 |
| 6.9 | `POST /api/v1/batches/:id/terminate` | Flow 9 | `02_BATCH_MANAGEMENT.md` §5 |
| 6.10 | `GET /api/v1/sync/delta?since=…`, `POST /api/v1/sync/run` | Flow 10 | `13_SYNC.md` §5 |
| 6.11 | `GET /api/v1/records/export` | Flow 11 | `08_RECORDS.md` §5 |
| 6.12 | `PATCH /api/v1/users/me/preferences` | Flow 12 + privacy toggle everywhere | `12_AUTH_AND_USERS.md` §5 |
| 6.13 | `POST /api/v1/feed/records` | Flow 13 | `05_FEED_CALCULATOR.md` §5 |
| 6.14 | `POST /api/v1/finance/expenses`, `POST /api/v1/finance/revenues` | Flow 14 | `07_FINANCE.md` §5 |
| 6.15 | `GET /api/v1/finance/overview` | Flow 15 | `07_FINANCE.md` §5 |
| 6.16 | `GET /api/v1/data/export?format=…`, `DELETE /api/v1/users/me` | Flow 16 | `12_AUTH_AND_USERS.md` §5 |
| 6.17 | `GET /api/v1/records/compare?batch_ids=…` | Flow 17 | `08_RECORDS.md` §5 |
| 6.D  | `GET /api/v1/dashboard/overview` | every Dashboard mount | `09_MAIN_DASHBOARD.md` §6 |

Every write call carries `Idempotency-Key` (CONVENTIONS §4.5). Schemas are the canonical Zod schemas in the owning specs — do **not** redefine here.

---

## 7. Offline Behavior

### 7.1 Per-flow offline matrix

| Flow | Read offline | Write offline | Notes |
|---|---|---|---|
| 1 Register | ❌ | ❌ | Requires server. Surfaces "Connect to register". |
| 2 Sign In | ✅ (cached session) | n/a | Re-auth when token expires + offline → soft prompt. |
| 3 Create batch | ✅ | ✅ | UUIDv7 client-side; queued. |
| 4 Mortality / Advance week | ✅ | ✅ | Advance week conflict detection happens at sync time. |
| 5 Feed formulation | ✅ | ✅ (queued) | Stock check uses cached stock; reconciliation may differ on flush. |
| 6 Health task complete | ✅ | ✅ (queued) | Conflict preprocessor runs locally too against cached active tasks. |
| 7 Stock add | ✅ | ✅ (queued) | |
| 8 Egg production / sale | ✅ | ✅ (queued) | |
| 9 Terminate | ✅ | ⚠ Allowed only if local cache shows withdrawal cleared; server may reject on flush. |
| 10 Sync | n/a | n/a | This *is* the sync flow. |
| 11 Records | ✅ (cached) | n/a | Export PDF/CSV requires online. |
| 12 Settings | ✅ | ✅ (queued for prefs) | |
| 13 Alt. feeding | ✅ | ✅ (queued) | |
| 14 Manual finance | ✅ | ✅ (queued) | |
| 15 Finance dashboard | ✅ (cached) | n/a | |
| 16 Export / delete account | ❌ | ❌ | Both require server. |
| 17 Compare | ✅ (cached batches only) | n/a | |

### 7.2 Conflict resolution policy (CONVENTIONS §2.14 + safety-critical extension)

Outbox flush handles 409 by classifying the conflicting field. Server-wins automatically for the safety-critical set listed in Flow 10 §3; user-choice for everything else.

```ts
// artifacts/web/src/lib/sync/conflict-policy.ts
export type ConflictField =
  | 'population_current' | 'mortality_count' | 'withdrawal_until'
  | 'health_task.status' | 'batch.phase' | 'batch.current_week';

export const SAFETY_CRITICAL_FIELDS: ReadonlySet<string> = new Set([
  'population_current','mortality_count','withdrawal_until',
  'health_task.status','batch.phase','batch.current_week',
]);

export function resolveConflict(field: string): 'server_wins' | 'user_choice' {
  return SAFETY_CRITICAL_FIELDS.has(field) ? 'server_wins' : 'user_choice';
}
```

### 7.3 Pending visibility

Every list rendering an entity that has unflushed local writes shows `⏳ Pending` next to the row. The Dashboard's `sync_state.pending_writes_count` (see `09_MAIN_DASHBOARD.md` §2) is the global counter.

---

## 8. Business Rules & Invariants

1. **R-FLOW-1.** No flow may proceed past a BLOCK conflict (CONVENTIONS §2.2 codes C1, C2, C4, C5, C6, C7, C8). The Mark Complete control must be disabled until the conflict is resolved upstream.
2. **R-FLOW-2.** WARN conflict (C3) requires an explicit acknowledgement (`acknowledged=true` in the request body) before the server accepts completion.
3. **R-FLOW-3.** The Duck Step 1b is mandatory whenever `species='duck'`; the wizard cannot advance without `duck_type ∈ {meat, layer}`. A duck batch persisted without `duck_type` is a server-side invariant violation.
4. **R-FLOW-4.** The broiler Step 3 review must list exactly the **5** vaccinations from CONVENTIONS §2.8 with the listed days and names.
5. **R-FLOW-5.** Health task UI must branch on `delivery_method`. Injection methods MUST NOT show `<ContainerPicker>` or compute a teaspoon dose.
6. **R-FLOW-6.** All water-task doses must be computed via `dose_per_gallon × (water_volume_l / 3.785)` (CONVENTIONS §2.13). The legacy `× 1.5` formula is forbidden in any UI surface.
7. **R-FLOW-7.** Cost-privacy mask is applied client-side at render time; the server always returns real values. Toggle is per-user, persisted via `PATCH /users/me/preferences`, and applies globally across Dashboard, batch detail, Finance, Records, and Compare.
8. **R-FLOW-8.** Batch Terminate is disabled (server-enforced) while `withdrawal_until > now()`; the UI must reflect the disabled state with the days-remaining tooltip.
9. **R-FLOW-9.** Manual Advance Week always sends `expected_current_week`. A 409 must trigger a re-fetch + retry path (CONVENTIONS §2.14); the UI never silently retries.
10. **R-FLOW-10.** Sync conflict resolution must classify the field per §7.2. Safety-critical fields are never resolved by user choice.
11. **R-FLOW-11.** Layer egg-entry is only enabled at `current_week ≥ 19` (CONVENTIONS §2.1); duck-layer egg-entry only at `current_week ≥ 20` (CONVENTIONS §2.7); duck-meat batches never expose egg entry.
12. **R-FLOW-12.** Feed Calculator UI must not list duck niacin among feed ingredients; niacin is a Water-Health auto-task (CONVENTIONS §2.9).
13. **R-FLOW-13.** Container picker offers exactly the 9 containers in CONVENTIONS §2.3 — never 10.
14. **R-FLOW-14.** Every write action displays an immediate optimistic confirmation; any server error rolls back the optimistic state and surfaces a toast with the error code.
15. **R-FLOW-15.** Currency symbol respects `farm.currency` (`GHS` default, `NGN` opt-in, CONVENTIONS §4.3) on every currency surface.

---

## 9. Error Codes (UI-side mapping)

These are surfaced in toasts/banners; the underlying codes live in the owning specs.

| Code (from server) | UI message |
|---|---|
| `WITHDRAWAL_ACTIVE` | "Cannot terminate — N days of withdrawal remaining." |
| `BATCH_RACE_CONDITION` (409 from advance-week) | "This batch was advanced from another device. Reloading…" |
| `MED_CONFLICT_BLOCK` | Conflict banner BLOCK variant (§3.8) with code C1–C2/C4–C8. |
| `MED_CONFLICT_WARN` | Conflict banner WARN variant with code C3. |
| `STOCK_INSUFFICIENT` | Amber preview warning in Flow 5; never blocks. |
| `IDEMPOTENCY_REPLAY` | Silent (treat as success). |
| `OFFLINE_NO_CACHE` | Empty-state on first-load offline. |
| `SYNC_CONFLICT_BENIGN` | Open user-choice modal (§3.9 variant 1). |
| `SYNC_CONFLICT_SAFETY` | Open auto-resolved notice (§3.9 variant 2). |
| `EXPORT_GENERATION_FAILED` | Toast + retry. |
| `AUTH_INVALID_CREDENTIALS` | Inline form error. |

---

## 10. Observability

UI-side events emitted for analytics/log correlation:

- `flow_started{flow_id, user_id, farm_id}`
- `flow_completed{flow_id, duration_ms}`
- `flow_abandoned{flow_id, last_step}`
- `conflict_banner_shown{code, severity}`
- `conflict_banner_resolved{code, action}` (`acknowledged` | `cancelled` | `blocked`)
- `sync_conflict_resolved{field, policy, choice?}`
- `cost_privacy_toggled{enabled}`
- `dose_displayed{medication_id, container_id, computed_value, unit}` (sample-rate 1%)

Server logs every endpoint per CONVENTIONS §4.8.

---

## 11. Test Plan

| ID | Covers | Test |
|---|---|---|
| T-FLOW-1 | R-FLOW-1 | Create two active antibiotic tasks → Enrofloxacin task shows BLOCK banner C5 → Mark Complete stays disabled. |
| T-FLOW-2 | R-FLOW-2 | Schedule dewormer + coccidiostat same day → WARN banner C3 → completing without acknowledgement fails 400. |
| T-FLOW-3 | R-FLOW-3 | Wizard with `species=duck` and no `duck_type` selection → Next disabled; submitting via API directly is rejected server-side. |
| T-FLOW-4 | R-FLOW-4 | Broiler wizard Step 3 snapshot lists all 5 vaccinations and days. |
| T-FLOW-5 | R-FLOW-5 | Open injection task (Duck Viral Hepatitis) → no container picker, dose-per-bird in ml shown. |
| T-FLOW-6 | R-FLOW-6 | Amprolium 1.5 tsp/gal × 6 L drinker → renders 2.4 tsp (rounded 2.5); never 1.5×6/3.785×1.5. |
| T-FLOW-7 | R-FLOW-7 | Toggle privacy on dashboard → all currency surfaces in Finance and Records also update without reload. |
| T-FLOW-8 | R-FLOW-8 | Complete antibiotic with 14-day withdrawal → Terminate disabled with countdown 14 → 0; on day 15 enabled. |
| T-FLOW-9 | R-FLOW-9 | Race two advance-week clicks → second gets 409, UI reloads + shows current week. |
| T-FLOW-10a | R-FLOW-10 | Conflict on `notes` → user-choice modal (§3.9 variant 1). |
| T-FLOW-10b | R-FLOW-10 | Conflict on `population_current` → server-wins notice (§3.9 variant 2); local value reverts. |
| T-FLOW-11 | R-FLOW-11 | Layer batch at week 18 → egg form hidden; week 19 → visible. Duck-layer at 19 → hidden; 20 → visible. Duck-meat → never visible. |
| T-FLOW-12 | R-FLOW-12 | Feed Calculator preview for duck batch → niacin not in ingredient list; Water-Health Health tab shows niacin auto-task daily Wk 1–4. |
| T-FLOW-13 | R-FLOW-13 | Container dropdown enumerates 9 entries in CONVENTIONS §2.3 order. |
| T-FLOW-14 | R-FLOW-14 | Force 500 on `POST /batches/:id/mortality` → optimistic count rolls back, toast appears. |
| T-FLOW-15 | R-FLOW-15 | Set `farm.currency='NGN'` → every currency label switches to ₦. |
| T-FLOW-OFF-1 | §7.1 | Offline → create batch + 2 mortality records + complete a task → all show ⏳; reconnect → flush in order, ⏳ → ✓. |
| T-FLOW-OFF-2 | §7.2 | Offline edit batch.notes locally; another device edits same notes → on sync, user-choice modal appears with both versions. |
| T-FLOW-OFF-3 | §7.2 | Offline lower batch.population locally while server raises it → on sync, server value wins, user notified. |

---

## 12. Open Questions

- Q1. For Flow 9 (Terminate) we currently rely on server cache for withdrawal status; should the UI block submission entirely when offline if local cache shows any active withdrawal?
- Q2. The "Edit & Merge" option in §3.9 benign conflict modal needs a per-field merge editor design — currently we punt to text only.
- Q3. Should "Compare" (Flow 17) allow comparing batches across different species, or restrict to same species? Restriction simplifies "best value" highlighting.
- Q4. Manual Advance Week vs Sunday scheduler (CONVENTIONS §2.11): do we surface the next scheduled advance time in the AdvanceWeekModal so farmers don't double-trigger?
- Q5. Cost-privacy preference: per-device or per-user? Currently per-user — confirm with stakeholders before launch.

---

## 13. Daily Operation Tasks (batch_tasks)

The `batch_tasks` table represents automated daily operational tasks generated dynamically for active batches (e.g., feed logging, water logging, egg collection).

### 13.1 Schema & Columns

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary Key |
| `batch_id` | `uuid` | Foreign key referencing `batches(id)` |
| `farm_id` | `uuid` | Foreign key referencing `farms(id)` |
| `title` | `text` | Human-readable title of the task |
| `description` | `text` | Detailed description of instructions |
| `due_date` | `date` | Scheduled date for the task |
| `task_type` | `text` | Enum: `'feed_log'`, `'water_log'`, or `'egg_collection'` |
| `completed` | `boolean` | Completion state |
| `completed_at` | `timestamp` | Timestamp of completion |
| `created_at` | `timestamp` | Time of task creation |
| `updated_at` | `timestamp` | Time of last update |

- **Unique Constraint:** `(batch_id, due_date, task_type)` prevents duplicate daily tasks for a single batch.
- **Generation:** Dynamically generated daily in the early morning in the farm's timezone by the `cron_generate_daily_tasks` database trigger / cron script.
- **Relationship:** Complements `health_tasks` by tracking routine daily operational checklists alongside medical care events. `batch_tasks` are client-completable on redirect (navigating feed_log → `/feed`, water_log → `/health`, egg_collection → `/eggs`), whereas `health_tasks` represent medical treatments tracked separately.
