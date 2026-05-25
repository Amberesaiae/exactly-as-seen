# BC-7 — BatchCreate Wizard: duck_type Step 1b + cycle_length_weeks

## Overview

The batch creation wizard needs two additions: Step 1b for duck sub-type selection (required by CONVENTIONS §2.6) and a cycle length slider for turkey (configurable 12–20 weeks per CONVENTIONS §2.5) and layer (72–78 weeks per CONVENTIONS §2.4).

## Scope

### `BatchCreate.tsx` — Step 1b (duck sub-type)

When `species = 'duck'` is selected in Step 1, immediately show Step 1b with two cards:

- "Meat Duck (8–10 weeks) — no eggs" → sets `duck_type = 'meat'`
- "Layer Duck (72+ weeks) — eggs from Week 20+" → sets `duck_type = 'layer'`

`duck_type` is required before proceeding to Step 2. The batch payload includes `duck_type`.

### `BatchCreate.tsx` — cycle length

For turkey: show a slider (12–20 weeks, default 16) in Step 2.
For layer: show a slider (72–78 weeks, default 78) in Step 2.
For duck-layer: show a slider (72+ weeks, default 78) in Step 2.
For broiler and duck-meat: `cycle_length_weeks` is fixed (8 and 10 respectively) — no slider.

### Step 3 review — vaccination count

The "Automatic Setup" block in Step 3 shows the correct vaccination count per species:

- Broiler: "5 vaccinations scheduled"
- Layer: "11 vaccinations scheduled"
- Duck-meat: per duck protocol count
- Duck-layer: per duck-layer protocol count
- Turkey: per turkey protocol count

These counts are derived from `VACCINATION_TEMPLATES` filtered by species (already correct after Track A).

### Species card corrections

- Layer card subtitle: "72–78 weeks" (not 68)
- Duck card subtitle: "meat 8–10 / layer 72+ weeks" (not "10 / 68")

## Acceptance Criteria

- Duck batch creation requires `duck_type` selection before proceeding
- Turkey batch shows cycle length slider (12–20 weeks)
- Layer batch shows cycle length slider (72–78 weeks)
- `duck_type` and `cycle_length_weeks` are included in the batch insert payload
- Step 3 shows correct vaccination count per species
- Species card subtitles are correct

## Dependencies

BC-1 (schema — `batches.duck_type`, `batches.cycle_length_weeks`)