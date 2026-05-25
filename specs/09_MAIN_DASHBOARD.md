# Main Dashboard

**Status:** Spec v2 (rewritten 2026-05-03)
**Module path:** `artifacts/web/src/routes/dashboard/` (frontend) + `artifacts/api-server/src/modules/dashboard/` (aggregator)
**Owner:** TBD

---

## 1. Purpose & Scope

The Main Dashboard is the central hub a farmer sees after sign-in. It aggregates read-only summaries from every other module (batches, water-health, feed, eggs, finance, stock, records) into one screen. It is **read-mostly**: only the cost-privacy toggle and quick navigation actions originate here; every numeric value is computed by a backend aggregator.

In scope:

- Desktop layout (sidebar + main + activity panel).
- Mobile layout (header + stacked cards + bottom nav).
- 4 quick-stat cards, active-batch tiles, tab-based charts, recent-activity feed.
- Cost-privacy masking driven by `user_preferences.cost_privacy_enabled` (see `07_FINANCE.md` §8 for the canonical rule).
- Offline behavior: render last-cached `DashboardOverview`; show pending-sync badge when outbox is non-empty.

Out of scope:

- Any write action other than navigation and the cost-privacy toggle.
- Per-batch detail (handled by `02_BATCH_MANAGEMENT.md`).
- Charts beyond the four named tabs (Overview/Expenses/Production/Performance) — see `08_RECORDS.md` for full analytics.

---

## 2. Domain Model Summary

The dashboard does not own entities. It composes a single read DTO from owned data in other modules:

```ts
type DashboardOverview = {
  greeting: { user_name: string; farm_name: string };
  quick_stats: {
    active_batches_count: number;
    tasks_today_count: number;            // overdue + due-today health tasks
    weekly_expenses_pesewas: number;      // last 7 days, farm currency
    monthly_revenue_pesewas: number;      // current calendar month, farm currency
  };
  active_batches: Array<{
    batch_id: string;                     // UUIDv7
    species: 'broiler' | 'layer' | 'duck' | 'turkey' | 'other';
    duck_type?: 'meat' | 'layer';         // present iff species='duck' (CONVENTIONS §2.6)
    name: string;
    house_name: string;
    current_week: number;
    current_day_of_week: number;
    phase: 'brooding'|'starter'|'grower'|'finisher'|'withdrawal'|'ready_to_sell'|'production'|'terminated';
    population_current: number;
    population_initial: number;
    pending_tasks_count: number;
    has_overdue: boolean;
    in_withdrawal: boolean;
  }>;
  recent_activity: Array<{
    event_id: string;
    event_type: string;                   // SCREAMING_SNAKE_CASE
    summary: string;                      // pre-rendered, localized
    occurred_at: string;                  // ISO8601 UTC; UI converts to farm.timezone
    batch_id?: string;
  }>;
  sync_state: {
    is_online: boolean;
    pending_writes_count: number;
    last_synced_at: string | null;
  };
  currency: 'GHS' | 'NGN';
  cost_privacy_enabled: boolean;
};
```

`weekly_expenses_pesewas` and `monthly_revenue_pesewas` are **always** sent to the client; the client applies the privacy mask (`●●●●`) at render time so toggling is instant and offline.

---

## 3. Wireframes

### 3.1 Desktop (≥ 1024px)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (240px)      │           MAIN CONTENT (flex)               │ ACTIVITY (280px) │
│                      │                                              │                  │
│ 🌾 LampFarms         │ Welcome back, Farmer Kofi! 👋                │ Recent Activity  │
│ ─────────────        │                                              │                  │
│ 🏠 Dashboard ◀       │ ┌──────────┬──────────┬──────────┬────────┐ │ • Feed confirmed │
│ 🐔 Batches           │ │ Active   │ Tasks    │ Weekly   │Monthly │ │   2h ago         │
│ 🌾 Feed              │ │ Batches  │ Today    │ Expenses │Revenue │ │                  │
│ 💧 Water-Health      │ │   3      │   5      │ ●●●● 👁  │●●●● 👁 │ │ • Mortality 2    │
│ 🥚 Eggs              │ └──────────┴──────────┴──────────┴────────┘ │   5h ago         │
│ 💰 Finance           │                                              │                  │
│ 📦 Stock             │ Active Batches                               │ • Gumboro done   │
│ 📊 Records           │ ┌──────────┬──────────┬──────────┐           │   1d ago         │
│ ⚙️ Settings          │ │ Broiler  │ Layer    │ Duck     │           │                  │
│                      │ │ Batch#12 │ Batch#8  │ Batch#5  │           │ • Egg sale 15c   │
│ ─────────────        │ │ Wk 6 D5  │ Wk 30 D3 │ Wk 12 D2 │           │   1d ago         │
│ [KM] Kofi Mensah     │ │ 490/500  │ 485/500  │ 295/300  │           │                  │
│ Farm Owner           │ │ Finisher │ Peak Prd │ Finisher │           │ [View All →]     │
│                      │ │ 2 tasks  │ 1 task   │ 3 tasks⚠│           │                  │
│                      │ │ [View]   │ [View]   │ [View]   │           │                  │
│                      │ └──────────┴──────────┴──────────┘           │                  │
│                      │                                              │                  │
│                      │ [Overview][Expenses][Production][Performance]│                  │
│                      │ ┌──────────────────────────────────────────┐ │                  │
│                      │ │ Chart canvas (tab-switchable)            │ │                  │
│                      │ └──────────────────────────────────────────┘ │                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Mobile (< 1024px)

```
┌────────────────────────────────────┐
│ 🌾 LampFarms          [KM] ⚙️      │
│ ⚠ Offline · 3 changes pending sync │  ← shown only when offline
├────────────────────────────────────┤
│ Welcome back, Farmer Kofi! 👋      │
│ ┌──────────┬──────────┐            │
│ │ Active   │ Tasks    │            │
│ │ Batches  │ Today    │            │
│ │   3      │   5      │            │
│ ├──────────┼──────────┤            │
│ │ Weekly   │ Monthly  │            │
│ │ Expenses │ Revenue  │            │
│ │ ●●●● 👁  │ ●●●● 👁  │            │
│ └──────────┴──────────┘            │
│                                    │
│ Active Batches (stacked):          │
│ ┌────────────────────────────────┐ │
│ │ Broiler · Batch #12            │ │
│ │ Wk 6 · 490/500 · Finisher      │ │
│ │ 2 tasks pending                │ │
│ │ [View]  [📝 Mortality]         │ │
│ └────────────────────────────────┘ │
│ ...                                │
│ [Overview][Expenses][Prod][Perf]   │
│ ┌────────────────────────────────┐ │
│ │ Chart canvas                   │ │
│ └────────────────────────────────┘ │
├────────────────────────────────────┤
│ 🏠  🐔  🌾  💧  ⚙️  (Bottom Nav)   │
└────────────────────────────────────┘
```

### 3.3 Quick-stat card states

| State | Trigger | Render |
|---|---|---|
| Normal | `cost_privacy_enabled=false` | `GHS 12,450.00` |
| Masked | `cost_privacy_enabled=true` | `●●●●` (4 bullets, gray) |
| Loading | aggregator pending | skeleton bar |
| Cached | offline, served from Dexie | value + small `⏳` cached-at timestamp on hover |

### 3.4 Batch tile color rules

- `pending_tasks_count == 0` → no badge.
- `pending_tasks_count > 0 && !has_overdue` → amber pill `"N task(s) pending"`.
- `has_overdue` → red pill `"N task(s) pending · overdue"`.
- `in_withdrawal` → orange ring on the tile + `"Withdrawal · Xd remaining"` row (countdown comes from `04_WATER_HEALTH.md` §6).

---

## 4. Component Inventory

| Component | Location | Notes |
|---|---|---|
| `<SidebarNav>` | layout | 9 items (Dashboard, Batches, Feed, Water-Health, Eggs, Finance, Stock, Records, Settings). Active item from current route. |
| `<BottomNav>` | layout (mobile) | 5 items: Home, Batches, Feed, Water-Health, Settings. |
| `<UserAvatarFooter>` | sidebar footer | Initials + name + role; tap → Settings. |
| `<WelcomeHeader>` | main top | Pulls `greeting.user_name`. |
| `<QuickStatCard>` × 4 | stats grid | Props: `label`, `value`, `kind` (`count` \| `currency`), `mask?`, `accent?`. Currency cards expose the `<EyeToggle>`. |
| `<EyeToggle>` | inside currency stat cards + Finance header | Calls `togglePrivacy()` (see §6.5). |
| `<BatchTile>` | active batches grid | Renders one item from `active_batches[]`. Shows duck-type sub-badge when `duck_type` present. |
| `<TaskBadge>` | inside `<BatchTile>` | Color per §3.4. |
| `<ChartTabs>` | charts card | 4 tabs: Overview, Expenses, Production, Performance. State held in URL hash `#tab=expenses`. |
| `<ChartCanvas>` | charts card | Reads from same `DashboardOverview` for Overview tab; lazy-loads `08_RECORDS.md` chart endpoints for the other three. |
| `<ActivityPanel>` | right panel (desktop) / not on mobile | Renders `recent_activity[]` (last 5). |
| `<OfflineBanner>` | top of layout | Visible iff `!sync_state.is_online`; shows `pending_writes_count` and `[Sync Now]`. |
| `<SyncConflictModal>` | overlay | See `10_CORE_FLOWS.md` Flow 10 + §6.5 below. |

All components are React 19 function components, TanStack Query for server state, no class components. Color tokens from `artifacts/mockup-sandbox/src/index.css`.

---

## 5. Interaction Flows

### 5.1 Initial load (online)

1. Route mounts → `useDashboardOverview()` fires `GET /api/v1/dashboard/overview`.
2. While pending, render skeleton placeholders.
3. On success, hydrate Dexie cache table `dashboard_cache` with `(farm_id, payload, fetched_at)`.
4. Apply `cost_privacy_enabled` from `user_preferences` (also cached) before paint.

### 5.2 Initial load (offline)

1. Route mounts → cache hit served from Dexie immediately.
2. `<OfflineBanner>` shown.
3. Background fetch is skipped until `online` event fires (handled by `10_CORE_FLOWS.md` Flow 10).

### 5.3 Toggle cost privacy

1. Farmer taps any 👁 icon.
2. Optimistic local flip of `cost_privacy_enabled`.
3. `PATCH /api/v1/users/me/preferences { cost_privacy_enabled }` sent with `Idempotency-Key`.
4. On failure, revert and show toast `"Could not save preference — will retry"`. The pending change is queued in the outbox (see `10_CORE_FLOWS.md` Flow 10).

### 5.4 Open batch

1. Tap **View** on `<BatchTile>` → SPA navigation to `/batches/:batch_id` (Overview tab).
2. No API call from dashboard; the batch route fetches its own data.

### 5.5 Quick "Mortality" action (mobile only)

The 📝 Mortality button on the tile opens the same Record Mortality modal defined in `02_BATCH_MANAGEMENT.md` §4.3. Dashboard does not own the mutation.

### 5.6 Switch chart tab

1. Tap a tab → URL hash updates.
2. Overview tab renders from already-loaded `DashboardOverview`.
3. Expenses/Production/Performance tabs lazy-fetch from endpoints in `07_FINANCE.md` §5 and `08_RECORDS.md` §5 (cached for 60s).

---

## 6. API Calls Made

The dashboard issues exactly the calls below. All payload schemas live in the referenced specs.

| # | Method | Path | Purpose | Owned by spec |
|---|---|---|---|---|
| 6.1 | `GET` | `/api/v1/dashboard/overview` | Aggregated `DashboardOverview` | This spec §6.6 |
| 6.2 | `GET` | `/api/v1/finance/expenses/series?range=weekly` | Expenses chart tab | `07_FINANCE.md` §5 |
| 6.3 | `GET` | `/api/v1/eggs/production/series?range=monthly` | Production chart tab | `06_EGG_PRODUCTION.md` §5 |
| 6.4 | `GET` | `/api/v1/records/performance/summary` | Performance chart tab | `08_RECORDS.md` §5 |
| 6.5 | `PATCH` | `/api/v1/users/me/preferences` | Toggle cost privacy | `12_AUTH_AND_USERS.md` §5 |
| 6.6 | `POST` | `/api/v1/sync/run` | Manual "Sync Now" from offline banner | `10_CORE_FLOWS.md` Flow 10 |

### 6.6 Aggregator endpoint (this spec owns)

```ts
// artifacts/api-server/src/modules/dashboard/dashboard.routes.ts
import { z } from 'zod';

export const DashboardOverviewQuery = z.object({
  // No params — derived entirely from authenticated farm.
}).strict();

export const DashboardOverviewResponse = z.object({
  greeting: z.object({ user_name: z.string(), farm_name: z.string() }),
  quick_stats: z.object({
    active_batches_count: z.number().int().nonnegative(),
    tasks_today_count: z.number().int().nonnegative(),
    weekly_expenses_pesewas: z.number().int().nonnegative(),
    monthly_revenue_pesewas: z.number().int().nonnegative(),
  }),
  active_batches: z.array(z.object({
    batch_id: z.string().uuid(),
    species: z.enum(['broiler','layer','duck','turkey','other']),
    duck_type: z.enum(['meat','layer']).optional(),
    name: z.string(),
    house_name: z.string(),
    current_week: z.number().int().nonnegative(),
    current_day_of_week: z.number().int().min(1).max(7),
    phase: z.enum(['brooding','starter','grower','finisher','withdrawal','ready_to_sell','production','terminated']),
    population_current: z.number().int().nonnegative(),
    population_initial: z.number().int().positive(),
    pending_tasks_count: z.number().int().nonnegative(),
    has_overdue: z.boolean(),
    in_withdrawal: z.boolean(),
  })),
  recent_activity: z.array(z.object({
    event_id: z.string().uuid(),
    event_type: z.string(),
    summary: z.string(),
    occurred_at: z.string().datetime(),
    batch_id: z.string().uuid().optional(),
  })).max(5),
  sync_state: z.object({
    is_online: z.literal(true),                  // server always reports true; client overrides
    pending_writes_count: z.number().int().nonnegative(),
    last_synced_at: z.string().datetime().nullable(),
  }),
  currency: z.enum(['GHS','NGN']),
  cost_privacy_enabled: z.boolean(),
});
```

The route handler composes the response from internal services and **must not** issue more than one query per source module (use the joins / read models defined in those specs).

---

## 7. Offline Behavior

| Concern | Behavior |
|---|---|
| First load offline | Service worker serves shell; `useDashboardOverview()` reads from Dexie `dashboard_cache`. If cache empty → empty-state card with `"Connect to load your dashboard"`. |
| Subsequent offline visits | Cached payload always rendered immediately; staleness pill `"Updated Xh ago"` shown above the welcome header when cache age > 1 h. |
| Cost-privacy toggle | Optimistic; queued in outbox if offline. |
| Activity feed | Last cached events only. New events emitted while offline (e.g. local mortality record) are merged in client-side and tagged `⏳ pending`. |
| Quick-stat counts | The client recomputes `active_batches_count` and `tasks_today_count` from local Dexie tables when offline so they reflect locally-created batches/tasks. Currency sums fall back to the cached server values (no local recomputation — stock/finance flows are server-authoritative). |
| Sync conflict on `user_preferences` (toggle) | Benign field → user-choice modal (`Keep Mine` / `Use Server`). See `10_CORE_FLOWS.md` Flow 10 §3.2. |

---

## 8. Business Rules & Invariants

1. **R-DASH-1.** Every numeric value displayed must originate from `DashboardOverview` or a Dexie cache derived from it. The dashboard component tree must not perform arithmetic that mixes values from different fetches.
2. **R-DASH-2.** Cost-privacy mask is applied client-side at render. The server always returns the real values; do **not** zero them server-side based on the preference.
3. **R-DASH-3.** `active_batches[]` excludes batches in state `terminated`. Batches in `withdrawal` are included with the orange ring (per §3.4).
4. **R-DASH-4.** `tasks_today_count` is the count of `health_tasks` rows where `farm_id = $farm AND status IN ('overdue','due_today')`, computed in farm timezone (CONVENTIONS §2.11, §4.4).
5. **R-DASH-5.** `weekly_expenses_pesewas` uses the rolling last 7 days ending at "now in farm timezone". `monthly_revenue_pesewas` uses the current calendar month in farm timezone.
6. **R-DASH-6.** Duck batch tiles must show `duck_type` ("Meat" or "Layer") as a sub-badge under the species label (CONVENTIONS §2.6).
7. **R-DASH-7.** When `species='broiler'` and the batch is in week 1, the tile's "tasks pending" count must reflect the **5** Week-1 vaccinations from CONVENTIONS §2.8 if they are not yet completed.
8. **R-DASH-8.** Recent activity is capped at 5 items server-side; the "View All" link navigates to `/records?tab=activity` (see `08_RECORDS.md`).
9. **R-DASH-9.** The dashboard must render its first paint in ≤ 200 ms from cache when offline; aggregator response must be ≤ 400 ms p95 when online.
10. **R-DASH-10.** All currency values respect `farm.currency` (GHS or NGN). The currency symbol is a render-only concern (CONVENTIONS §4.3).

---

## 9. Error Codes

| Code | When | UI |
|---|---|---|
| `DASHBOARD_AGGREGATION_FAILED` | Aggregator threw / timed out | Show last cached payload + red toast `"Couldn't refresh dashboard — showing last known data"` |
| `PREF_UPDATE_FAILED` | `PATCH /users/me/preferences` non-2xx | Revert toggle, toast, queue in outbox |
| `UNAUTHORIZED` | 401 from any call | Redirect to sign-in |
| `OFFLINE_NO_CACHE` | Offline + no Dexie cache | Empty state with `[Try Again]` |

---

## 10. Observability

- Log fields on every aggregator request: `request_id`, `farm_id`, `user_id`, `route='/dashboard/overview'`, `status`, `duration_ms`, `active_batches_count`, `recent_activity_count`.
- Metric `dashboard_overview_duration_ms` (histogram).
- Metric `dashboard_cache_hit_total{kind="hit"|"miss"|"stale"}` (counter, client-reported via beacon).
- Metric `cost_privacy_toggle_total{enabled="true"|"false"}` (counter).

---

## 11. Test Plan

Each test maps to a numbered rule.

| ID | Covers | Test |
|---|---|---|
| T-DASH-1 | R-DASH-1 | Snapshot dashboard with mocked aggregator response; assert no UI value is computed (every text matches a payload field). |
| T-DASH-2 | R-DASH-2 | Toggle privacy → assert API still returns real values; only render output changes. |
| T-DASH-3 | R-DASH-3, 6 | Aggregator fixture with 1 broiler, 1 duck-meat, 1 duck-layer, 1 terminated layer → response excludes terminated; duck tiles show sub-badge. |
| T-DASH-4 | R-DASH-4 | Seed 3 overdue + 2 due-today + 1 upcoming task → `tasks_today_count === 5`. |
| T-DASH-5 | R-DASH-5 | Seed expenses/revenues across timezone boundary → window matches farm timezone, not UTC. |
| T-DASH-7 | R-DASH-7 | Create broiler batch in week 1 → tile shows `5 tasks pending` until each is completed. |
| T-DASH-8 | R-DASH-8 | Seed 7 events → response has 5 only. |
| T-DASH-9 | R-DASH-9 | Load test aggregator under 500 RPS; p95 ≤ 400 ms. |
| T-DASH-10 | R-DASH-10 | Set `farm.currency='NGN'` → currency code in response is `NGN`; UI symbol changes. |
| T-DASH-OFF-1 | §7 row 1 | Disable network before first load → empty state renders, no crash. |
| T-DASH-OFF-2 | §7 row 4 | Create local mortality offline → activity feed shows pending row with `⏳`. |
| T-DASH-OFF-3 | §7 last row | Two devices toggle preference offline → on reconnect, conflict modal appears (benign → user-choice). |

---

## 12. Open Questions

- Q1. Should the dashboard expose a "compact" density toggle for small Android screens (< 360 px)? Currently we only have one mobile layout.
- Q2. Should "tasks today" include feed-record-due reminders for semi-intensive batches, or stay strictly health tasks?
- Q3. The `recent_activity[]` summary string is server-rendered; once we add localization beyond English we need to decide between server-side i18n vs sending a key+params payload.
