# B1 — Missing Batch Endpoints: GET /mortality + PATCH /batches/:id

## Scope

Add the two batch endpoints that `BatchDetail.tsx` already calls but that do not exist in file:artifacts/api-server/src/modules/batch/routes.ts.

### Included

- `GET /api/v1/batches/:id/mortality` — returns paginated mortality records for a batch
- `PATCH /api/v1/batches/:id` — updates the `notes` field only; no FSM state changes

### Explicitly out

- Changes to the batch FSM
- Changes to `BatchDetail.tsx` (that is C1's job)

## Endpoint specifications

**`GET /api/v1/batches/:id/mortality`**

Response shape:

```json
{ "items": [MortalityRecord], "nextCursor": null }
```

Where `MortalityRecord` is `{ id, batchId, count, cause, notes, recordedAt }` from `mortalityRecordsTable`.

Authorization: same `batchByIdForUser` guard as existing batch routes.

**`PATCH /api/v1/batches/:id`**

Accepts: `{ notes: string | null }`

Rejects any field other than `notes` with `422 INVALID_PATCH_FIELD`.

Does not trigger FSM transitions. Does not emit an outbox event (notes are not domain events).

Response: `{ batch: updatedBatch }`

## Acceptance criteria

- `GET /api/v1/batches/:id/mortality` returns `{ items: [...] }` for a batch the user owns
- `GET /api/v1/batches/:id/mortality` returns `403` for a batch the user does not own
- `PATCH /api/v1/batches/:id` with `{ notes: "text" }` updates the notes field and returns the updated batch
- `PATCH /api/v1/batches/:id` with `{ status: "terminated" }` returns `422 INVALID_PATCH_FIELD`
- Both endpoints require authentication and respect the existing `requireAuth` middleware

## Dependencies

Depends on A1 (Finance correctness should be verified before expanding the API surface, per the plan). Can be implemented in parallel with A1 in practice since these endpoints are independent of Finance.

## Plan reference

spec:3a092065-e868-4799-849c-f707a0553261/ecd0ec8f-4fe6-44c2-afee-fa2592de59b8 — Batch Management data flow, issues 7, 8.