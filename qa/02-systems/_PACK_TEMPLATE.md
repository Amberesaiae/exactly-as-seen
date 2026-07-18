# System pack template

Copy structure into each system folder as `AUDIT.md`. Do not delete sections—mark N/A with reason.

---

## Meta

| Field | Value |
|-------|-------|
| System ID | |
| Status | NOT_STARTED |
| Owner | |
| Started | |
| Last deep session | |
| Related journeys | A–K ids |
| Primary code roots | `src/...` |
| Spine RPCs | |
| WRITER_MAP rows | |

---

## 1. Purpose (farmer language)

What this system is for. What it is **not**.

---

## 2. Code inventory

### 2.1 UI surfaces

| Route / component | Role |
|-------------------|------|

### 2.2 Hooks / libs

| File | Writes? | Reads? |
|------|---------|--------|

### 2.3 Writers (complete)

| Site (file:fn) | Kind (SPINE/KILL/…) | Tables / RPC | Notes |
|----------------|---------------------|--------------|-------|

### 2.4 Read models

| Consumer | Source | Drift risk |
|----------|--------|------------|

---

## 3. Contracts

### 3.1 Canonical rules that apply

(Cite CANONICAL_JOURNEYS / RUNTIME sections)

### 3.2 Dual pattern impact

Intensive / flexible / N/A

### 3.3 Safety gates

Conflicts, withdrawal, week, house, …

---

## 4. Grey usecase map

Every row must end PASS / FAIL / GREY / DEFERRED.

| ID | Usecase | Species | System class | Acid focus | Proof | Verdict |
|----|---------|---------|--------------|------------|-------|---------|
| U01 | | | | | | |
| U02 | | | | | | |
| … | | | | | | |

**Minimum greys before ACID_IN_PROGRESS:** 8 for large systems, 5 for small.  
Include sad paths and multi-flock.

---

## 5. Cross-module edges

| Edge | Other system | What must stay true |
|------|--------------|---------------------|
| | | |

---

## 6. Known holes (seed from WRITER_MAP / prior audits)

| Hole | Severity | Source |
|------|----------|--------|
| | | |

---

## 7. Acid sessions log

| Date | Usecases run | Evidence path | Notes |
|------|--------------|---------------|-------|
| | | | |

---

## 8. Open greys

| ID | Why open | Blocker | Owner |
|----|----------|---------|-------|
| | | | |

---

## 9. Curation decisions

Link CURATION_LOG rows.

---

## 10. Sign-off

| Gate | Met? |
|------|------|
| Inventory complete | |
| Greys empty or deferred | |
| Acid triple for all non-deferred | |
| KILL paths gone or ticketed | |
| Status → CLOSED | |

Auditor: ________  Date: ________
