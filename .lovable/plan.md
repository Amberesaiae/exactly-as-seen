

# Plan: Rebuild Health Page with Full Coverage (Ticket 6)

## What's Missing vs Tickets 4 & 5

Comparing the current Health.tsx (586 lines) against the spec and the thoroughness of BatchDetail/Feed/FeedFormulation:

1. **No auto-generation of vaccination schedules** — when a batch has no vaccinations, the user sees an empty state but has no way to generate them from the `VACCINATION_TEMPLATES` based on species and start date
2. **No "Today's Health Summary" card** — Feed has a "Current Phase" info card; Health lacks an equivalent overview showing batch age, pending vaccines, active meds, withdrawal status at a glance
3. **No water consumption chart** — Feed and Eggs both have Recharts line charts; Water tab only shows a list
4. **No species-specific health alerts** — Feed has safety rules engine; Health should warn about duck niacin needs, turkey blackhead risk, etc.
5. **No egg discard tracking during withdrawal** — spec says "Egg withdrawal tracking for layers (discard eggs count)" but current page only shows a date countdown
6. **No heat stress water alert** — when logged temperature exceeds ~32°C, no warning appears
7. **Medication dialog missing dosing route display** — the `MEDICATION_TEMPLATES` have `dosePerGallon` as a string but the dialog stores `dose_per_gallon` as null
8. **No vaccination route info displayed** — template has `route` field but it's not shown
9. **Missing DialogDescription** on some dialogs (accessibility warning)
10. **No batch-specific health route** — spec defines `/health/schedule/:batchId`

## Implementation Steps

### Step 1: Auto-Generate Vaccination Schedule
When a batch is selected and has zero vaccinations, offer a "Generate Schedule" button that:
- Filters `VACCINATION_TEMPLATES` by the batch's species
- Calculates `scheduled_date` from `batch.start_date + (scheduledWeek * 7) days`
- Bulk-inserts into `vaccination_schedule` table
- Shows the route (e.g., "Eye drop / Drinking water") alongside each vaccine

### Step 2: Today's Health Summary Card
Add a summary card (like Feed's phase card) showing:
- Batch age (week/day/phase)
- Overdue vaccines count with red badge
- Active medications with withdrawal countdown
- Today's water logged status
- Species-specific alerts (duck niacin, turkey blackhead)

### Step 3: Water Consumption Chart
Add a Recharts `LineChart` to the Water tab showing 14-day gallons trend alongside the per-bird guideline line, matching the chart style in Eggs.tsx and BatchDetail.tsx.

### Step 4: Egg Discard Tracker During Withdrawal
For layer/duck/turkey batches with active egg withdrawal periods:
- Calculate eggs to discard = `batch.current_population × expected_rate × withdrawal_days_remaining`
- Show a warning card: "Discard eggs until [date] — estimated [N] eggs affected"

### Step 5: Heat Stress Water Alert
When `temperature_c > 32`, show an orange alert recommending increased water + electrolytes (from `MEDICATION_TEMPLATES` supplements).

### Step 6: Enhance Medication Dialog
- Store `dosePerGallon` string in the `notes` field or display it properly
- Show the medication `indication` and `dosePerGallon` in the recorded task card
- Add `DialogDescription` for accessibility

### Step 7: Vaccination Route Display
Show the administration route (e.g., "Wing web", "Drinking water") from `VACCINATION_TEMPLATES` next to each vaccine in the schedule list.

### Step 8: Species-Specific Health Alerts
Add a rules engine (similar to `SAFETY_RULES` in feed-data.ts) in `health-data.ts`:
- Duck: "Ensure niacin supplementation in water"
- Turkey: "Monitor for blackhead (histomoniasis) — avoid housing near chickens"
- Broiler finisher phase: "Prepare for processing — check withdrawal clearances"
- Layer pre-lay: "Begin calcium supplementation"

### Files Changed
- `src/pages/Health.tsx` — Major rewrite with all 8 enhancements
- `src/lib/health-data.ts` — Add species health alerts array, export vaccination route info

No database migrations needed — existing tables cover all data requirements.

