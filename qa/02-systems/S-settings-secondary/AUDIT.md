# S — Settings & secondary (non-blocking A–K)

| Field | Value |
|-------|-------|
| Status | **CURATED** |
| Related journeys | Secondary |
| Code roots | `SettingsPage`, Farm/Preferences/Market/Data tabs |
| Spine | Direct table KEEP (prefs/farms/houses/config) |
| Inventory complete | **2026-07-17** |

---

## Inventory

| Writer | Verdict |
|--------|---------|
| profiles / farms update | **KEEP** |
| houses insert/update/delete | **KEEP** (+ `houses_guard_delete` + FE block occupied) |
| user_preferences upsert | **KEEP** |
| config_overrides market | **KEEP** |
| Offline queueWrite prefs/houses/farms | **KEEP** |
| Data export read / farm delete | **KEEP** destructive |

## Greys

| ID | Status |
|----|--------|
| S-U01 farm save | **PASS** |
| S-U02 houses add / occupied delete | **PASS**; occupied delete **BLOCKED** (trigger + FE) |
| S-U03 theme/currency/privacy | **PASS** |
| S-U04 market override | **PASS** |
| S-U07 offline prefs | **PASS** code |
| S-U05/U06 species config / delete farm | **DEFER** |

Evidence: `qa/06-evidence/S-settings/LIVE-2026-07-17.md`; house delete `LIVE-2026-07-17-house-delete.md`
