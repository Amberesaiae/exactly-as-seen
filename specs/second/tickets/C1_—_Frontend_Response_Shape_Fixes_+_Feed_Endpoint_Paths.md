# C1 — Frontend Response Shape Fixes + Feed Endpoint Paths

## Scope

Fix all frontend pages that consume API responses with the wrong shape, and fix the Feed page's wrong endpoint paths.

### Included

file:artifacts/lampfarms/src/pages/Health.tsx**:**

- Line 45: `data?.data ?? data ?? []` → `data.items ?? []` (batch endpoint returns `{ items: [...] }`)
- Line 60: `data?.data ?? data ?? []` → `data.items ?? []` (tasks endpoint returns `{ items: [...], active_withdrawal_count: N }`)
- Extend the `HealthTask` interface to include all fields currently accessed via `unknown` casts: `withdrawal_meat_until`, `withdrawal_eggs_until`, `task_type`, `vaccine_code`, `dose_amount`, `dose_unit`, `bird_count`, `computed_dose_amount`, `delivery_method`, `product_name`, `scheduled_date`, `status`
- Remove all `(t as unknown as { ... })` casts — use the extended interface directly

file:artifacts/lampfarms/src/pages/Feed.tsx**:**

- Line 49: `batchData?.data ?? batchData ?? []` → `batchData.items ?? []`
- Line 53: `ingData?.data ?? ingData ?? []` → `ingData ?? []` (ingredients endpoint returns a plain array)
- Lines 66–71: fix `endpointMap` to use the actual endpoint paths:
  - `automatic` → `POST /api/v1/feed/optimize`
  - `flexible` → `POST /api/v1/feed/flexible`
  - `ready_made` → `POST /api/v1/feed/ready-made`
  - `concentrate_mix` → `POST /api/v1/feed/concentrate-mix`

file:artifacts/lampfarms/src/pages/Stock.tsx**:**

- Line 34: `itemData?.data ?? itemData ?? []` → `itemData.items ?? []`
- Line 35: `lotData?.data ?? lotData ?? []` → `lotData.lots ?? []` (lots endpoint returns `{ lots: [...] }`)
- Line 36: `lowData?.data ?? lowData ?? []` → `lowData.items ?? []`

file:artifacts/lampfarms/src/pages/Records.tsx**:**

- Line 83: rename parameter `fmt` to `exportFormat` in `handleExport` to eliminate the shadowing of the outer `fmt` function

file:artifacts/lampfarms/src/pages/BatchDetail.tsx**:**

- Line 48: `GET /api/v1/batches/${id}/mortality` — this endpoint now exists (B1). Confirm the response shape `{ items: [...] }` is consumed correctly.

### Explicitly out

- Backend changes (those are A1–A4 and B1)
- Masking fixes (those are C2)
- Reliability fixes (those are C3)

## Acceptance criteria

- `Health.tsx` renders the task list without any `unknown` casts — all fields are typed via the `HealthTask` interface
- `Feed.tsx` batch picker populates correctly from `data.items`
- `Feed.tsx` "Generate Formulation" button calls the correct endpoint for each feed method
- `Stock.tsx` items table, lot history, and low-stock alerts all render from the correct response fields
- `Records.tsx` export buttons call `handleExport(batchId, 'pdf')` and `handleExport(batchId, 'csv')` — the `exportFormat` parameter is used correctly inside the function, not the outer `fmt` function
- `BatchDetail.tsx` mortality tab renders the list from `GET /api/v1/batches/:id/mortality`

## Dependencies

Depends on A3 (SQL filters must be in place before testing filtered responses) and B1 (mortality endpoint must exist before `BatchDetail.tsx` can be tested).

## Plan reference

spec:3a092065-e868-4799-849c-f707a0553261/ecd0ec8f-4fe6-44c2-afee-fa2592de59b8 — issues 9, 10, 11, 12, 13, 29, 31.