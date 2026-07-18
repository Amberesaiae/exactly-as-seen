# M4 — Stock, Eggs, Finance: FIFO Allocation, Inventory Guards, Auto-Ledger

## Problem & Context

Three modules have correctness gaps that affect real data:

**Stock:** The current `useStockData.ts` has a live bug (`item_id` vs `stock_item_id`), uses `category: 'equipment'` for all purchase expenses (wrong), and has no lot-level tracking or FIFO allocation. The spec requires `stock_lots` with quality grades, expiry dates, and FIFO+quality allocation.

**Eggs:** `egg_sales` has no `batch_id` FK (farm-level only), no inventory guard (a farmer can sell more eggs than exist), no withdrawal guard, and no duplicate-per-day check on collections.

**Finance:** `markTaskComplete` creates an expense with `amount: 0` (hardcoded). Stock purchases use `category: 'equipment'`. No chick purchase expense on batch creation. The auto-ledger is incomplete across all 6 triggers.

**Constraints:**

- M1 (schema) must be complete — `stock_lots`, `stock_allocations`, `egg_sales.batch_id` all depend on M1
- The FIFO allocator must use `FOR UPDATE` row locking to prevent concurrent overdraw
- Finance auto-ledger entries must use `ON CONFLICT DO NOTHING` on `(source_event, source_ref_id)` for idempotency
- Money must be in integer pesewas throughout

## Technical Approach

### Stock — FIFO+Quality Allocator

The allocator is implemented as a Supabase Postgres function `allocate_fifo_by_quality(farm_id, item_id, qty_needed, batch_id, reason, source_ref_id)` that runs inside a transaction with `FOR UPDATE` row locking.

**Sort order (CONVENTIONS §2.15):**

1. Near-expiry bucket: lots with `expiry_date ≤ CURRENT_DATE + 30 days` → bucket 0 (use first)
2. `expiry_date ASC NULLS LAST` within bucket
3. `received_at ASC` as final tiebreaker
4. `quality_grade = 'damaged'` excluded from auto-allocation

The function returns the list of `stock_allocation` rows created. If `qty_needed` cannot be satisfied, it raises an exception and the entire transaction rolls back.

**`useStockData.ts`**** changes:**

- Fix `item_id` → `stock_item_id` in the insert payload (the schema column is already correct)
- Replace flat `current_quantity` tracking with lot-based tracking via `stock_lots`
- Fix purchase expense category mapping: `feed_ingredients`/`finished_feed` → `feed_and_nutrition`; `medications`/`vaccines` → `health_and_medicine`; `supplies` → `other_expenses`
- Add `suppliers` table support

### Eggs — Inventory Guards

**Inventory computation** (derived, not stored):

```sql
good_eggs_on_hand =
  COALESCE(SUM(ec.good_count), 0)
  - COALESCE((SELECT SUM(crates_sold*30 + looses_sold) FROM egg_sales WHERE batch_id = b.id), 0)
  - COALESCE((SELECT SUM(count) FROM egg_discards WHERE batch_id = b.id), 0)
```

This is implemented as a Supabase Postgres function `get_egg_inventory(batch_id, farm_id)` called by `useEggData.ts`.

**Guards added to ****`useEggData.ts`****:**

1. **R10 — Non-negative inventory:** Before `recordSale`, call `get_egg_inventory()`. If `(crates_sold × 30 + looses_sold) > good_eggs_on_hand` → reject with toast `"Insufficient egg inventory"`.
2. **R11 — Withdrawal guard:** Before `recordSale`, check `batch.has_active_withdrawal`. If true → reject with toast `"Cannot sell eggs during active withdrawal period"`.
3. **R5 — Duplicate-per-day:** Before `recordCollection`, check if a record exists for `(batch_id, date)`. If exists → reject with toast `"Collection already recorded for today. Use edit to update."`.
4. **R2/R3 — Start week guard:** Before `recordCollection`, check `batch.current_week ≥ 19` (layer) or `≥ 20` (duck-layer). If not → reject with toast.

**`egg_sales.batch_id`** is now populated in `recordSale` using `selectedBatch`.

### Finance — Auto-Ledger Completion

The auto-ledger is implemented as client-side triggers in the relevant hooks, using `ON CONFLICT DO NOTHING` on `(source, source_ref)` for idempotency.

**6 auto-ledger triggers:**

| Trigger | Where | Category | Amount | Idempotency anchor |
| --- | --- | --- | --- | --- |
| Stock purchase | `useStockData.ts` `recordTransaction` | mapped by item category | `qty × unit_price_pesewas` | `('auto:stock', lot_id)` |
| Health task complete | `useHealthData.ts` `markTaskComplete` | `health_and_medicine` | `cost_pesewas` from task (user-entered) | `('auto:health', task_id)` |
| Feed formulation confirmed | `FeedFormulation.tsx` confirm handler | `feed_and_nutrition` | `total_cost_pesewas` | `('auto:feed', formulation_id)` |
| Batch created | `BatchCreate.tsx` | `chicks_and_birds` | chick purchase amount (new field in wizard) | `('auto:batch', batch_id)` |
| Egg sale | `useEggData.ts` `recordSale` | revenue `egg_sales` | `total_revenue_pesewas` | `('auto:eggs', sale_id)` |
| Batch terminated with sale | `BatchDetail.tsx` terminate handler | revenue `bird_sales` or `meat_sales` | sale amount (new field in terminate dialog) | `('auto:batch', batch_id + ':terminate')` |

**Health task expense fix:** The current `amount: 0` hardcode is replaced with a `cost_pesewas` input field in the "Complete Task" modal. The farmer enters the actual cost; it defaults to 0 (optional).

**Cost privacy:** `useFinanceData.ts` reads `costPrivacyEnabled` from Zustand. The server-side masking (Finance spec §5.3) is a future concern — for now, client-side masking is correct for this Supabase-native deployment.

### Settings — 5-Tab Completion

file:src/pages/SettingsPage.tsx is extended with two new tabs:

**Market Prices tab:** Reads/writes `config_overrides` table. Safety keys (prefixes: `medication.`, `withdrawal.`, `vaccination.`, `container_volume.`, `dose.`) are rejected client-side with a toast `"Safety keys cannot be overridden"`.

**Data tab:** Export buttons (JSON/CSV — triggers Supabase data export), account deletion with confirmation phrase `"DELETE MY ACCOUNT"`.

**Farm tab additions:** `water_source_chlorinated` toggle, `egg_low_inventory_crates` number input, `timezone` select.

**Preferences tab additions:** PIN setup (4-digit, stored as SHA-256 hash in `user_preferences.cost_privacy_pin`).

```wireframe

<html>
<head>
<style>
body { font-family: sans-serif; max-width: 680px; margin: 20px auto; padding: 0 16px; }
.tabs { display: flex; border-bottom: 2px solid #e5e7eb; margin-bottom: 20px; }
.tab { padding: 8px 16px; cursor: pointer; font-size: 14px; color: #6b7280; }
.tab.active { color: #111827; border-bottom: 2px solid #111827; margin-bottom: -2px; font-weight: 600; }
.card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.field { margin-bottom: 14px; }
label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: #374151; }
input, select { width: 100%; padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
.toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
.toggle { width: 40px; height: 22px; background: #059669; border-radius: 11px; position: relative; }
.toggle-dot { width: 18px; height: 18px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px; }
.btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 14px; }
.btn-primary { background: #111827; color: white; }
.btn-danger { background: #dc2626; color: white; }
.override-row { display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #f9fafb; border-radius: 6px; margin-bottom: 6px; font-size: 13px; }
</style>
</head>
<body>
<div class="tabs">
  <div class="tab">Profile</div>
  <div class="tab active">Farm</div>
  <div class="tab">Preferences</div>
  <div class="tab">Market Prices</div>
  <div class="tab">Data</div>
</div>
<div class="card">
  <div class="field"><label>Farm Name</label><input value="Dev Farm" /></div>
  <div class="field"><label>Region</label><select><option>Greater Accra</option></select></div>
  <div class="field"><label>Timezone</label><select><option>Africa/Accra (GMT+0)</option></select></div>
  <div class="field"><label>Currency</label><select><option>GHS — Ghana Cedi</option><option>NGN — Nigerian Naira</option></select></div>
  <div class="toggle-row"><span>Chlorinated water source</span><div class="toggle"><div class="toggle-dot"></div></div></div>
  <div class="field" style="margin-top:12px"><label>Egg low-inventory alert (crates)</label><input type="number" value="5" /></div>
  <button class="btn btn-primary" style="margin-top:8px">Save Changes</button>
</div>
<div class="card">
  <strong>Market Price Overrides</strong>
  <div style="margin:10px 0">
    <div class="override-row"><span>ingredient.maize.price_per_kg_ghs</span><span>3.80 <button style="background:none;border:none;color:#dc2626;cursor:pointer">✕</button></span></div>
    <div class="override-row"><span>ingredient.soybean_meal.price_per_kg_ghs</span><span>6.50 <button style="background:none;border:none;color:#dc2626;cursor:pointer">✕</button></span></div>
  </div>
  <div style="display:flex;gap:8px">
    <input placeholder="config.key" style="flex:2" />
    <input placeholder="value" style="flex:1" />
    <button class="btn btn-primary">Add</button>
  </div>
</div>
</body>
</html>
```

### Acceptance Criteria

**Stock:**

1. `recordTransaction` uses `stock_item_id` (not `item_id`) in the insert payload
2. Purchase expense category maps correctly: `feed_ingredients` → `feed_and_nutrition`, `medications` → `health_and_medicine`
3. FIFO allocator sorts near-expiry lots first, then by expiry date, then by received_at
4. Damaged lots are excluded from auto-allocation
5. Concurrent allocations do not overdraw (Postgres `FOR UPDATE` lock)

**Eggs:**
6. `recordSale` rejects when `(crates × 30 + looses) > good_eggs_on_hand`
7. `recordSale` rejects when `batch.has_active_withdrawal = true`
8. `recordCollection` rejects duplicate `(batch_id, date)` with a clear toast
9. `egg_sales` rows have `batch_id` populated
10. Layer collection rejected before week 19; duck-layer before week 20

**Finance:**
11. `markTaskComplete` creates expense with `cost_pesewas` from user input (not hardcoded 0)
12. Stock purchase creates expense with correct category
13. Batch creation creates `chicks_and_birds` expense
14. Egg sale creates revenue entry with `source: 'auto:eggs'`
15. All auto-ledger entries use `ON CONFLICT DO NOTHING` on `(source, source_ref)`

**Settings:**
16. Market Prices tab reads/writes `config_overrides` table
17. Safety key prefixes are rejected client-side
18. `water_source_chlorinated` toggle saves to `farms` table
19. PIN setup hashes the 4-digit PIN before storing in `user_preferences.cost_privacy_pin`