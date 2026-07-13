# Live browser audit report

**When:** 2026-07-13T01:30:12.026Z
**Base:** http://127.0.0.1:5173
**User:** live.fix.1783906173@example.com
**Pass/Fail:** 12 / 0

## Steps
- ✅ **A0 landing /welcome** — welcome visible
- ✅ **A1 login → session** — landed http://127.0.0.1:5173/farm-setup (pre-confirmed user; hosted email-confirm bypass)
- ✅ **A2 farm setup complete** — http://127.0.0.1:5173/dashboard
- ✅ **A3 dashboard gate** — http://127.0.0.1:5173/dashboard
- ✅ **B1 create batch** — http://127.0.0.1:5173/batches/c601ccc4-7fb7-4cbb-96e6-e1243b9505a0
- ✅ **B2 health page loads** — health UI present
- ✅ **C1 feed page** — Confirm CTA visible
- ✅ **C2 confirm feed** — Feed logged (5kg) — no feed stock item found for auto-deduct
LampFarms®
TODAY
Overview
OPERATIONS
Flocks
Feed Lab
Care & Water
Inventory
INSIGHTS
Ledg
- ✅ **C3 water tab** — opened
- ✅ **F stock page smoke** — ok
- ✅ **K finance page smoke** — ok
- ✅ **G eggs page smoke** — ok

## Console errors (sample)
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`
- `Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on ev`

## Artifacts
- Screenshots: `/mnt/c/src/exactly-as-seen/docs/live-audit-artifacts/*.png`
- JSON: `/mnt/c/src/exactly-as-seen/docs/live-audit-artifacts/report.json`