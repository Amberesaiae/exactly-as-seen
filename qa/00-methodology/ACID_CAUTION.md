# Acid caution (e2e)

**Acid** here means: treat every write as if money, birds, or safety are on the line. Prefer **fail-closed** over “farmer can work around it.”

---

## 1. Gate order (every write usecase)

```
Auth → farm ready → batch active (if scoped)
  → species / week / house eligibility
  → safety (C1–C8, withdrawal)
  → dual ledger decision
  → single atomic writer
  → side-effect set visible
```

If any gate is skipped in code, that is a finding—not a UX note.

---

## 2. Proof triple (required)

For each usecase, record all three:

| # | Proof | Pass if |
|---|--------|---------|
| 1 | **UI** | Correct enablement, toast/error, no silent success |
| 2 | **Writer** | Network shows intended RPC (or sole KEEP path); no surprise inserts |
| 3 | **DB** | Full side-effect set (or documented non-effect) |

**UI alone is fail.**  
**RPC alone without DB check is fail.**  
**DB row without knowing which writer is fail.**

---

## 3. Failure cases (always run)

| Case | Expect |
|------|--------|
| Invalid input | Error toast; no partial domain rows |
| RPC / network error | Fail closed; no client multi-write “rescue” |
| Duplicate day feed / sale | Idempotent or clear error |
| Withdrawal active | Block sale / warn terminate rules |
| No free house | Block create |
| No stock match intensive feed | Explicit warning; define if log still allowed |
| Flexible system | No auto expense; Book now optional |
| Intensive system | Auto stock/expense when product requires |

---

## 4. Dual pattern matrix (money systems)

Run **both** production systems where the module touches consumption:

| System class | Values |
|--------------|--------|
| Intensive | `intensive`, `deep_litter`, `cage` |
| Flexible | `semi_intensive`, `free_range`, `pasture` |

Purchase and sale: **always ledger** regardless of system.

---

## 5. Species matrix (when module is species-aware)

Minimum before closing a species-touching pack:

| Species | Notes |
|---------|--------|
| Broiler | Meat cycle, 5 vax lean |
| Layer | Egg week 19+ |
| Duck | Type meat/layer required; eggs if layer |
| Turkey | Longer cycle / blackhead courses |

Grey: quail/guinea/geese only if product claims them.

---

## 6. Multi-flock caution

Always include:

- ≥2 active batches  
- ops on **non-default** selected batch  
- no bleed of completion/logs to wrong batch  

---

## 7. Ledger acid

| Check | Method |
|-------|--------|
| source + source_ref set | DB |
| No double expense same kg | purchase same day + day feed |
| Pesewas only | no float amount columns written |
| Categories canonical | 9 expense / 5 revenue slugs |

---

## 8. Safety acid (care / sales)

| Check | Method |
|-------|--------|
| C1–C8 on add med | unit + live add |
| Withdrawal blocks egg/meat sale | live |
| Emergency terminate policy | live + RPC |

---

## 9. When unsure

**Open a grey.** Do not invent “probably fine.”  
Greys block `CLOSED` until resolved or deferred with owner + reason.
