# T1 — Feed Planning Step: Duration-Based target_kg Computation

## Overview

Add a **planning step** to the feed formulation flow that lets the farmer enter a duration (days or weeks) and auto-computes `target_kg = feedPerBirdG × current_population × duration_days / 1000`. The computed `target_kg` pre-fills the existing method components. Also add a phase transition prompt to `Feed.tsx` that detects when the batch has entered a new feed phase.

**Source:** `spec:8defac00-3b0b-4081-8337-151887bd3118` — Gap F1, R-FP-1 through R-FP-6
**Ground-truth verified against:** file:exactly-as-seen/src/pages/FeedFormulation.tsx, file:exactly-as-seen/src/pages/Feed.tsx, file:exactly-as-seen/src/lib/feed-data.ts

## Scope

### `FeedFormulation.tsx` (file:exactly-as-seen/src/pages/FeedFormulation.tsx)

**Current state (live code):**

- Line 20: `type FeedMethod = 'select' | 'ready_made' | 'custom' | 'concentrate'`
- Line 27: `const [method, setMethod] = useState<FeedMethod>('select')`
- Lines 67–68: back button — `method === 'select'` → navigate to `/feed`, else set `method` to `'select'`
- Lines 87–99: batch selector shown when `method === 'select'`
- Lines 101–137: method cards shown when `method === 'select'`
- Lines 140–148: method components rendered with `{ batch, phase, week, farmId, onDone }`

**Changes:**

1. Add `'plan'` to `FeedMethod`: `type FeedMethod = 'select' | 'plan' | 'ready_made' | 'custom' | 'concentrate'`
2. Add `const [targetKg, setTargetKg] = useState<number | undefined>(undefined)`
3. After batch selector (line 99), when `method === 'select'` and batch is selected, add a **"Plan Feed First"** button that sets `method = 'plan'`. Existing method cards remain as direct shortcuts (backward compatible).
4. Add `method === 'plan'` render block: phase info card (name, `feedPerBirdG`, `current_population`), duration input (number + `days | weeks` selector), live-computed `target_kg = feedPerBirdG × current_population × duration_days / 1000`, bag count = `Math.ceil(target_kg / 50)`, "Use This Target → Choose Method" button
5. "Use This Target" button: sets `targetKg` state, transitions back to method card display
6. Update back button: `method === 'plan'` → set `method = 'select'`
7. Pass `targetKg` to method components: `<ReadyMadeFeed ... targetKg={targetKg} />`

### Method Components

**Current props (confirmed lines 141–148):** `{ batch, phase, week, farmId, onDone }`

**Changes — add optional ****`targetKg?: number`**** prop to:**

- file:exactly-as-seen/src/components/feed/ReadyMadeFeed.tsx
- file:exactly-as-seen/src/components/feed/CustomFormulation.tsx
- file:exactly-as-seen/src/components/feed/ConcentrateMix.tsx

When `targetKg` is provided: pre-fill the relevant quantity/target input field; show helper text `"Pre-filled from your plan (X days × Y birds × Zg/bird)"`. Farmer can override.

### `Feed.tsx` — Phase Transition Prompt (file:exactly-as-seen/src/pages/Feed.tsx)

**Current state (live code):**

- Lines 62–70: loads `feed_schedules` ordered by `day DESC`, limit 14
- Line 77: `dailyTotalKg = phase.feedPerBirdG × batch.current_population / 1000`
- Line 164: inserts `amount_per_bird_g: phase.feedPerBirdG` into `feed_schedules` on log

**Changes:**

```ts
// Add after schedules load:
const lastSchedule = schedules[0]; // most recent (day DESC)
const phaseTransitionDetected = !!(lastSchedule && phase &&
  lastSchedule.amount_per_bird_g !== phase.feedPerBirdG);
const previousFeedPerBirdG = lastSchedule?.amount_per_bird_g ?? null;
const [phaseAlertDismissed, setPhaseAlertDismissed] = useState(false);
```

When `phaseTransitionDetected && !phaseAlertDismissed`, render a dismissible `Alert` card above the current phase info card:

- Title: `"🌾 Feed Phase Changed — [phase.name] Phase"`
- Body: `"New consumption rate: [phase.feedPerBirdG]g / bird / day (was [previousFeedPerBirdG]g)"`
- Button: `"Plan [phase.name] Feed →"` → navigates to `/feed/formulate`
- X button: sets `phaseAlertDismissed = true`

**No changes to ****`advance-batch-weeks`**** Edge Function or ****`cron_advance_batch_weeks`**** RPC** — phase transition detection is client-side only.

## Acceptance Criteria

Farmer enters "2 weeks" for broiler Grower (80g, 490 birds) → sees `548.8 kg ≈ 11 bags of 50 kg` computed live
Farmer enters "1 week" for turkey Finisher (250g, 200 birds) → sees `350.0 kg ≈ 7 bags of 50 kg`
Bag count always uses `Math.ceil(target_kg / 50)`
Duration input: 0 days → validation error; negative → validation error
`target_kg` is passed as `targetKg` prop to the selected method component and pre-fills the relevant input
Phase transition prompt appears in `Feed.tsx` when `schedules[0].amount_per_bird_g !== phase.feedPerBirdG`
Phase transition prompt is dismissible (X button sets local state, not persisted)
Phase transition prompt does NOT appear when `schedules` is empty (new batch, no logs yet)
Backward compatible: farmer can still tap a method card directly without going through the planning step
`targetKg` is `undefined` when farmer skips the planning step — method components show their default empty state

## Files to Change

- file:exactly-as-seen/src/pages/FeedFormulation.tsx (add `'plan'` to `FeedMethod`, add planning step UI, add `targetKg` state, pass to method components)
- file:exactly-as-seen/src/pages/Feed.tsx (add phase transition detection + dismissible alert card)
- file:exactly-as-seen/src/components/feed/ReadyMadeFeed.tsx (add optional `targetKg?: number` prop)
- file:exactly-as-seen/src/components/feed/CustomFormulation.tsx (add optional `targetKg?: number` prop)
- file:exactly-as-seen/src/components/feed/ConcentrateMix.tsx (add optional `targetKg?: number` prop)

## No Changes Needed

- file:exactly-as-seen/supabase/functions/advance-batch-weeks/index.ts (phase detection is client-side)
- file:exactly-as-seen/supabase/migrations/ (no new migrations for T1)
- file:exactly-as-seen/src/lib/feed-data.ts (already has correct `feedPerBirdG` values)