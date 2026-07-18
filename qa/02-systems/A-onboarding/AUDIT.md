# A — Onboarding & auth

| Field | Value |
|-------|-------|
| Status | **CURATED** — auth + setup_complete farm re-proved; residual email-confirm UX |
| Related journeys | A |
| Code roots | `Login`, `Register`, `FarmSetup`, `AuthContext`, password reset pages |
| Spine | Auth + farms/houses/prefs (multi-write acceptable for setup) |
| Inventory complete | **2026-07-17** |

---

## Inventory

| Writer | Verdict |
|--------|---------|
| Supabase auth login/register | platform |
| Farm create/update + houses + setup_complete | **KEEP** secondary |
| user_preferences | **KEEP** |
| Offline queueWrite farms/prefs | **KEEP** |
| Password reset pages | present |

## Greys

| ID | Status |
|----|--------|
| A-U02 pre-confirmed login | **PASS** |
| A-U04 setup_complete + houses | **PASS** setup=true, houses≥1 |
| A-U08 primary farm | **PASS** |
| A-U06 reset pages | **PASS** static |
| A-U01 email confirm blocked UX | **DEFER** (hosted confirm required) |
| A-U03 no houses block | **DEFER** live negative (inverse proved) |
| A-U05 offline register | **DEFER** |
| A-U07 session expire mid-setup | **DEFER** |

Evidence: `qa/06-evidence/A-onboarding/LIVE-2026-07-17.md`
