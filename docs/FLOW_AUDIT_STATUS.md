# Flow audit status (canonical journeys)

**Branch:** `feat/canonical-journeys`  
**Updated:** 2026-07-13  
**Master plan:** `docs/JOURNEY_AUDIT_MASTER_PLAN.md`  
**Production E2E audit (research vs runtime):** `docs/PRODUCTION_E2E_AUDIT.md`  
**Backend:** Hosted Supabase `lampfarms` (`ulliwnizurgfbwryhnng`) — **no local Docker required**

Method: code-path audit vs CANONICAL_JOURNEYS + Vitest; live smoke on hosted.  
**Honesty gate:** UI-present ≠ production-complete. See PRODUCTION_E2E_AUDIT completeness ~35–40%.

---

## Stack (no admin PowerShell)

| Command | Purpose |
|---------|---------|
| `bun install` / `bun run setup` | Frontend deps only |
| `bun run dev` / `bun run frontend` | Vite app |
| `bun run db:push` | Push migrations to linked hosted project |
| `bun run test` | Unit suite |
| `bun run win:stack:*` | **Optional** local Docker (Windows) — not default |

`.env.local` → hosted URL. Docker Desktop / Admin UAC **not** required for daily work.

---

## Flow board

| Flow | Offline | Live | Notes |
|------|---------|------|-------|
| **A Onboard** | Green | **Live green** | Playwright A0–A3; email-confirm residual on public register |
| **B Start flock** | Green | **Live green ×4 species** | Broiler/layer/duck/turkey create + redirect; houses gate |
| **C Today ops** | Green | **Live green** | Broiler feed+water; feed auto-deduct misses `feed_ingredient` category |
| **D Care complete** | **Green** | Re-verify | Dual writers sync via `care-completion.ts` (This Week ↔ Vaccines + bulk) |
| **E Plan/buy feed** | Partial | Smoke | Ready-made always expenses (code); full E not re-run |
| **F Stock** | **Green** | Re-verify | Purchase inserts expense + surfaces errors; unit_price for day feed |
| **G Eggs** | Green | **Gate green** | Week-19 block on collect (layer week 1) |
| **H Mortality** | Green | **Live green** | Turkey −1 → 99 birds / 1% |
| **I–J** | Pending | — | Terminate / edge not re-run this session |
| **K Hub** | Green | **Live green UI** | Dashboard 4 flocks / 399 birds; Finance period filter fixed (local dates) |

---

## This session fixes

### C — Today feed reachable + consistent kg
- `useHealthBatchStatus`: virtual tasks include `batch_id`
- `Feed.tsx`: resolve feeding task by type (+ optional batch_id); amount from task; done = `feed_logs` only
- `useDashboardLogic`: same `getPrescriptiveFeedIntake` + foraging as Health
- Day feed uses `ledger-policy` dual gates

### B — One schedule seed
- `useBatchCreateLogic`: insert `vaccination_schedule` from same templates; toast if seed fails

### E — Purchase always ledger
- `ReadyMadeFeed`: expense even on flexible systems (purchase class)

### Tooling
- Default npm scripts no longer invoke PowerShell stack-up
- `docs/JOURNEY_AUDIT_MASTER_PLAN.md` written

---

## Live browser (2026-07-13)

- Script: `scripts/live-audit-browser.mjs` (Playwright = Chrome DevTools Protocol engine)  
- Optional real Chrome attach: `scripts/live-audit-cdp.mjs` (needs Chrome `--remote-debugging-port=9222` reachable from the agent)  
- Report: `docs/live-audit-artifacts/REPORT.md`  
- **12/12 pass** (re-verified after security migration)  
- **Headed multi-species MCP session:** `docs/live-audit-artifacts/CDP_LIVE_AUDIT_SESSION.md`  
  - Broiler → Layer → Duck → Turkey create; care/feed/water/mortality/eggs/stock/dashboard  
  - Screenshot: `docs/live-audit-artifacts/cdp-session/dashboard-4-species.png`  
- Public register still blocked by hosted **email confirmation** (use admin createUser for automation)  
- Security hardening: `docs/SECURITY_ADVISOR_FIX.md` + migration `20260713010000_security_advisor_hardening.sql`

## This session code fixes (post live audit)

| Fix | Files |
|-----|--------|
| Dual vax complete sync | `src/lib/care-completion.ts`, `useMedicationLogic`, `useVaccinationLogic`, `useWeeklyHealthSummary`, `useHealthData` |
| Stock purchase always expense + toast on fail | `useStockData.ts`, `synergy.ts` |
| Feed stock category match | `src/lib/stock-match.ts`, `useHealthData`, `useCustomFormulationSolver` |
| Health max update depth | `useWeeklyHealthSummary` (useCallback), `useHealthData` effect deps |
| Finance period DATE filter | `useFinanceData.ts` (local `yyyy-MM-dd` compare) |

## Superpowers plan execution (2026-07-13 production-protocol-hardening)

Plan: `docs/superpowers/plans/2026-07-13-production-protocol-hardening.md`

| Deliverable | Status |
|-------------|--------|
| Research care courses seed (arrival, cocci, multi, broiler D36 deworm, turkey BH W2) | **Done** — `species-protocol-courses.ts` + `health-auto-tasks.ts` |
| Dashboard Today checklist (due only, no medication relabel) | **Done** — `today-tasks.ts` + dashboard hook |
| Flexible **Book now** (feed + water) | **Done** |
| Egg week constants (layer 19 / duck-layer 20) | **Done** — `canonical.ts` |
| Duck water mid bands | **Done** — `dosing-utils.ts` |
| MarketTrends no hardcode | **Done** — loads `config_overrides` or Settings CTA |
| Protocol parity matrix | `docs/PROTOCOL_PARITY_MATRIX.md` |
| Vitest | **63/63 pass** |

## Next (atomic, do not skip)

1. Headed re-smoke: complete vax → Vaccines shows done; stock purchase → Ledger expense; day feed deducts feed_ingredient  
2. Flexible **Book now** toasts on feed/water/health  
3. Dev project: disable email confirm **or** document confirm UX  
4. Flows I–J deep audit

---

## Verify

```bash
bun install
bun run test
bun run lint
bunx tsc -p tsconfig.app.json --noEmit
bun run dev
```
