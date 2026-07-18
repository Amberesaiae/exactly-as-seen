# E2E proof standard

## Artifact minimum per usecase

Store under `qa/06-evidence/<system-id>/` or link from pack:

| Artifact | Required |
|----------|----------|
| Usecase ID | yes |
| Date / auditor | yes |
| Environment (hosted project ref, app URL) | yes |
| Batch / farm identifiers | yes (non-secret) |
| Screenshot or network note | yes for UI steps |
| SQL or table-editor result | yes for money/safety |
| Writer observed | RPC name or KEEP path |
| Verdict | PASS / FAIL / GREY |
| Finding IDs if FAIL | link to `05-findings/` |

## SQL snippets (adapt per system)

```sql
-- Ledger tail
SELECT id, category, amount_pesewas, source, source_ref, description, date
FROM expenses WHERE farm_id = :farm ORDER BY created_at DESC LIMIT 20;

SELECT id, category, amount_pesewas, source, source_ref, description, date
FROM revenue WHERE farm_id = :farm ORDER BY created_at DESC LIMIT 20;

-- Day ops
SELECT * FROM feed_logs WHERE batch_id = :batch AND date = CURRENT_DATE;
SELECT * FROM water_records WHERE batch_id = :batch AND date = CURRENT_DATE;

-- Care
SELECT id, product_name, task_type, completed, completed_at FROM health_tasks
WHERE batch_id = :batch ORDER BY scheduled_date;
SELECT vaccine_name, administered, administered_at FROM vaccination_schedule
WHERE batch_id = :batch;

-- Stock
SELECT id, name, category, current_quantity, unit_price_pesewas FROM stock_items
WHERE farm_id = :farm;
SELECT * FROM stock_transactions WHERE farm_id = :farm ORDER BY created_at DESC LIMIT 10;
```

## Network filter

Look for: `/rest/v1/rpc/<intent_name>`  
Flag: direct `POST` to `expenses`, `feed_logs`, `egg_sales`, `health_tasks` on paths that should be RPC-only.

## Pass language

- **PASS** — triple green, no unexpected writer  
- **FAIL** — any of UI lie, wrong writer, missing side-effect, unsafe allow  
- **GREY** — not yet run, or environment blocked, or product ambiguity  

Never “PASS with notes” on money or safety—those notes are **FAIL** or **GREY**.
