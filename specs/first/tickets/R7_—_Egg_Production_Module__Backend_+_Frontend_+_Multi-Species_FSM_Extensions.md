# R7 — Egg Production Module: Backend + Frontend + Multi-Species FSM Extensions

## Goal

Implement the Egg Production backend module, rebuild file:artifacts/lampfarms/src/pages/Eggs.tsx, and add the duck/layer/turkey FSM and wizard extensions needed for Phase 3.

## Spec Reference

spec:3a092065-e868-4799-849c-f707a0553261/b7f8a421-4897-4bc3-bfc4-850e84f63a24 — Sprint 3

## Dependencies

- R5 and R6 (frontend foundation established)

## Backend

New module: file:artifacts/api-server/src/modules/egg-production/

| Endpoint | Notes |
| --- | --- |
| `POST /api/v1/eggs/collections` | Daily collection with grade breakdown (S/M/L/XL/cracked/dirty) |
| `GET /api/v1/eggs/batches/:id/collections` | Collection history |
| `GET /api/v1/eggs/batches/:id/inventory` | Derived query — no stored table |
| `POST /api/v1/eggs/sales` | Sale record; publishes `EGG_SALE_RECORDED` → Finance auto-revenue |
| `GET /api/v1/eggs/batches/:id/sales` | Sale history |

**Business rules:**

- Eligibility guard: broiler/turkey/duck-meat return `404 SPECIES_NOT_ELIGIBLE`
- Layer eligibility: Week 19+ only (`422 BATCH_NOT_IN_LAY` before Week 19)
- Duck-layer eligibility: Week 20+ only
- Withdrawal guard: `422 WITHDRAWAL_ACTIVE` when `has_active_withdrawal = true`

**DB schema** — new file file:lib/db/src/schema/egg-production.ts:

- `egg_collections` — batch_id, date, grade breakdown columns (s_count, m_count, l_count, xl_count, cracked_count, dirty_count), total_count
- `egg_sales` — batch_id, date, crates, loose_eggs, price_per_crate_pesewas, total_pesewas, buyer_name, payment_method

## FSM + Wizard Extensions

- Duck Step 1b wizard in file:artifacts/lampfarms/src/pages/BatchCreate.tsx — meat vs layer sub-type selection
- Turkey cycle-length slider (12–20 weeks, default 16) in batch create wizard
- Layer egg production enabled at Week 19+ (FSM already handles this via `phase` field)
- Duck-layer egg production at Week 20+

## Frontend

Replace `Eggs.tsx` (810 lines) with:

| Component | Responsibility |
| --- | --- |
| `BatchPicker` | Layer + duck-layer only |
| `ProductionHeader` | Rate vs expected, week-over-week trend |
| `CollectionDialog` | Grade breakdown (S/M/L/XL/cracked/dirty) |
| `SaleDialog` | Crates + loose, price, buyer, payment method |
| `RecordsTable` | Daily collection history |
| `SalesTable` | Sale history with revenue |

## Acceptance Criteria

- Layer Week 18 batch → `422 BATCH_NOT_IN_LAY`; Week 19 → 201
- Duck-layer Week 19 → `422`; Week 20 → 201
- Broiler batch → `404 SPECIES_NOT_ELIGIBLE`
- `EGG_SALE_RECORDED` → `revenue_entries` row created (via R4 consumer)
- Withdrawal active → `422 WITHDRAWAL_ACTIVE` on sale
- Duck batch create wizard shows meat/layer sub-type step
- Turkey batch create shows cycle-length slider
- `pnpm run typecheck` passes