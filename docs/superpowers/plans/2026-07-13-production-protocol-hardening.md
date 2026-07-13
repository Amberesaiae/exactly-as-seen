# Production Protocol Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Status 2026-07-13:** Tasks 1–7 implemented in-session (executing-plans). Vitest 63/63 green.

**Goal:** Close P0/P1 production and protocol gaps so batch create seeds research-aligned care courses, Today tasks are truthful, flexible farms get Book now, and hardcodes/conflicts from the audit are fixed.

**Architecture:** Expand protocol data as pure TypeScript tables (config-driven, no hardcode in UI). Seed via `generateAutoTasks`. Unify dashboard checklist filtering in one pure helper. Ledger-friendly Book now uses existing `autoCreateExpense` + stock helpers. Single egg-week constant in `canonical.ts`.

**Tech Stack:** React 18 + Vite + TypeScript + Vitest + Supabase client (hosted). Branch: `feat/canonical-journeys`.

**Authority:** `docs/PROTOCOL_PARITY_MATRIX.md`, `docs/PRODUCTION_E2E_AUDIT.md`, `docs/CANONICAL_JOURNEYS.md`, `deprecated specs/.../03-SPECIES-PROTOCOLS/*`.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/species-protocol-courses.ts` | **Create** — day-range course rows per species (research-aligned) |
| `src/lib/health-auto-tasks.ts` | Seed vax + courses + blackhead W2 + broiler deworm |
| `src/lib/canonical.ts` | `LAYER_EGG_START_WEEK`, `DUCK_EGG_START_WEEK` |
| `src/lib/today-tasks.ts` | **Create** — pure checklist merge/filter for dashboard/health |
| `src/hooks/dashboard/useDashboardLogic.ts` | Use today-tasks helper; stop wrong medication relabel |
| `src/hooks/useHealthData.ts` / water / feed fulfill | Book now for flexible consumption |
| `src/components/dashboard/MarketTrends.tsx` | Load farm market overrides or hide |
| `src/lib/dosing-utils.ts` | Duck water mid bands |
| `src/hooks/useEggData.ts` | Import egg week constants |
| `src/test/species-protocol-courses.test.ts` | Parity tests |
| `src/test/today-tasks.test.ts` | Checklist tests |
| `src/test/health-auto-tasks.test.ts` | Expand expectations |
| `docs/FLOW_AUDIT_STATUS.md` | Status after ship |

---

### Task 1: Species protocol courses data + failing tests

**Files:**
- Create: `src/lib/species-protocol-courses.ts`
- Create: `src/test/species-protocol-courses.test.ts`

- [ ] **Step 1: Write failing tests** for broiler course count, D36 deworm, turkey blackhead W2, duck niacin course presence.

- [ ] **Step 2: Implement `species-protocol-courses.ts`** exporting:

```typescript
export type ProtocolCourse = {
  species: string;
  product_name: string;
  task_type: 'medication' | 'supplement' | 'vaccination' | 'checkpoint';
  startDay: number; // 1-based day of cycle
  durationDays: number;
  delivery_method: string;
  indication: string;
  priority: 'critical' | 'high' | 'medium';
  doseHint?: string;
  withdrawal_meat_days?: number;
  withdrawal_egg_days?: number;
};

export function getProtocolCourses(species: string): ProtocolCourse[];
```

Include (minimum P0/P1 from matrix):
- **All species:** arrival anti-stress+glucose D1–3
- **Broiler:** cocci blocks, multi blocks, D36 fenbendazole deworm
- **Layer:** same early courses + calcium W14–15 (day 98–105)
- **Duck:** multi blocks matching research skeleton; keep niacin separate in auto-tasks
- **Turkey:** blackhead D8–10 (week 2), plus biweekly handled in auto-tasks

- [ ] **Step 3: Tests pass**

- [ ] **Step 4: Commit** `feat(protocol): add species protocol course tables`

---

### Task 2: Wire courses into generateAutoTasks

**Files:**
- Modify: `src/lib/health-auto-tasks.ts`
- Modify: `src/test/health-auto-tasks.test.ts`

- [ ] **Step 1: Expand tests** — broiler cycle 8 seeds ≥1 deworm + ≥1 arrival supplement; turkey seeds blackhead at week ≤2; no course with scheduled_week > cycleLengthWeeks.

- [ ] **Step 2: Implement** merge of `getProtocolCourses` into task list (skip if week > cycle). Convert startDay → date like vax: `addDays(start, startDay - 1)`.

- [ ] **Step 3: Turkey blackhead loop starts at week 2** (not 4).

- [ ] **Step 4: Tests pass + commit** `feat(protocol): seed research care courses on batch create`

---

### Task 3: Today task checklist pure helper + dashboard fix

**Files:**
- Create: `src/lib/today-tasks.ts`
- Create: `src/test/today-tasks.test.ts`
- Modify: `src/hooks/dashboard/useDashboardLogic.ts`

- [ ] **Step 1: Tests** for:
  - Keep virtual feed/water with batch_id
  - Health tasks only if `scheduled_date <= today` and `!completed`
  - Preserve real `task_type` (vaccination stays vaccination)
  - Cap list size optional

- [ ] **Step 2: Implement `buildTodayChecklist`**

- [ ] **Step 3: Dashboard uses helper** — remove `.map(t => ({...t, task_type: 'medication'}))`

- [ ] **Step 4: Commit** `fix(dashboard): truthful today checklist without medication relabel`

---

### Task 4: Egg week constants (resolve W17 vs W19)

**Decision (product):** Keep **layer ≥ 19**, **duck-layer ≥ 20** (CANONICAL_JOURNEYS + live gate). Document research W17 as pre-lay / production curve only.

**Files:**
- Modify: `src/lib/canonical.ts`
- Modify: `src/hooks/useEggData.ts`
- Modify: `src/lib/health-data.ts` curves comment if needed
- Create or modify test for constants

- [ ] **Step 1–4:** Export constants, use in useEggData, test, commit `fix(eggs): single source egg start weeks`

---

### Task 5: Flexible Book now (feed + water)

**Files:**
- Modify: `src/hooks/useHealthData.ts` (fulfillOperationalTask feed branch)
- Modify: `src/hooks/health/useWaterLogic.ts`
- Optionally small toast action component if sonner supports action

- [ ] **Step 1:** When flexible + consumption logged, toast with **Book now** action that calls `autoCreateExpense` (and stock deduct if stock exists).

- [ ] **Step 2:** Unit test pure decision helper `shouldOfferBookNow(system)` if extracted to ledger-policy.

- [ ] **Step 3:** Commit `feat(ledger): flexible Book now on day feed and water`

---

### Task 6: Duck water bands + MarketTrends

**Files:**
- Modify: `src/lib/dosing-utils.ts` (+ test if exists)
- Modify: `src/components/dashboard/MarketTrends.tsx`
- Modify: `src/pages/Dashboard.tsx` if props needed

- [ ] Duck: W5–6 → 350, W7–8 → 400, W9+ → 450 (research)
- [ ] MarketTrends: fetch `config_overrides` / market keys for farm OR show empty state “Set prices in Settings” — **no fake 85/52/185**
- [ ] Commit

---

### Task 7: Docs + full test suite

- [ ] Update `docs/FLOW_AUDIT_STATUS.md`, protocol matrix P0 rows
- [ ] `bun run test` green
- [ ] `bunx tsc -p tsconfig.app.json --noEmit` green

---

## Out of scope this plan (tracked, not blocked)

- Full RPC atomic writers for all intents
- Layer monthly/quarterly recurring job
- Full cocci MWF every week for 16w turkey
- Offline Dexie product path
- Hosted cron dashboard verification

---

## Spec coverage self-check

| Spec item | Task |
|-----------|------|
| Protocol P0 deworm/blackhead/arrival | 1–2 |
| Task glitch dashboard | 3 |
| Egg week conflict | 4 |
| Book now | 5 |
| Hardcoded market + duck water | 6 |
| Verification | 7 |
