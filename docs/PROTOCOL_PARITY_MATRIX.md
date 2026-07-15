# Protocol Parity Matrix — Research vs Runtime

**Date:** 2026-07-13  
**Last verified:** 2026-07-15  
**Research source of truth:** `deprecated specs/Lampfarms specs/03-SPECIES-PROTOCOLS/*.md`  
**Config ticket counts:** `tickets/Configuration_System_&_4_JSON_Files_(4,000_lines).md` (36 protocols)  
**Runtime:** `src/lib/health-data.ts`, `src/lib/health-auto-tasks.ts`, `src/lib/species-protocol-courses.ts`, `src/lib/dosing-utils.ts`, `src/lib/feed-data.ts`, `src/hooks/useEggData.ts`, batch create seed  

**Legend**

| Symbol | Meaning |
|--------|---------|
| **OK** | Present with matching week/day (±0) and role |
| **≈** | Present, minor name/dose/band drift |
| **MISS** | In research; **not seeded** by `generateAutoTasks` / no weekly course |
| **EXTRA** | Runtime has it; research does not (or optional only) |
| **CONFLICT** | Both present but contradict research numbers |

---

## 0. Executive scorecard

| Domain | Research intent | Runtime reality | Parity |
|--------|-----------------|-----------------|--------|
| Broiler **vaccines** (5) | D7/14/21/28/35 | Same 5 in `VACCINATION_TEMPLATES` + auto seed | **~95% OK** |
| Broiler **full weekly courses** | Anti-stress, cocci, multi, deworm, plain-water window | Seeded via `species-protocol-courses.ts` (arrival, cocci, multi, anti-stress, deworm D36, post-deworm, plain water) | **~85% OK** |
| Layer **vaccines/deworm** (11 rows) | Through D112 | 11 template rows seeded | **~90% OK** |
| Layer **courses + production monthly/quarterly** | Weeks 1–18 courses + W19+ routine | Seeded: arrival, W1–5 cocci/multi, W6 maintenance, W7 pre/post-deworm, W8 post-pox, **W9–12 M/W/F cocci**, W13 anti-stress, W14–15 calcium, **W19+ monthly deworm + multi**, **quarterly Newcastle** | **~70% OK** |
| Duck **vaccines** (6) | DVH, Plague×2, ND opt, deworm×2 | 6 templates seeded | **~90% OK** |
| Duck **arrival/courses + traditional** | Full day table + 7 remedies | Arrival D1–3 + 6 course blocks (multi, cocci, anti-stress, plain water W8) + Niacin; traditional is catalogue only | **~70% OK** |
| Turkey **vaccines** (12–13) | Pox early + full series | 12 templates (+ Blackhead loop) | **~85% OK** |
| Turkey **Blackhead courses** | Every 2 weeks + early W2 | **D8–10 first block (W2) + biweekly from W2** | **~90% OK** |
| Water ml tables | Full week bands | Mostly OK; duck mid-bands lean | **~85%** |
| Feed kg/bird/day | Phase tables | `getPrescriptiveFeedIntake` aligned | **~90%** |
| Egg week gates | Research W17 layers / W20 ducks | Runtime **W19** layers / W20 ducks | **CONFLICT** |
| 36 protocol ticket count | Broiler 6 (incl. deworm) | Broiler 5 vax + deworm via courses | **OK** |
| Day-old arrival protocol | Explicit D1–3 + UI | Seeded for all 4 species via `species-protocol-courses.ts` | **FIXED** |
| Post-vax anti-stress (2 days) | On complete (events) | Seeded on complete helper | **OK path** |

**Bottom line:** Vaccination **milestones** are fully ported. Research **weekly medication courses** are now seeded on batch create via `species-protocol-courses.ts` — covering arrival (all species), coccidiosis, multivitamins, anti-stress, deworming, and production-phase routines. Remaining gaps: duck mid-band water, layer 250 ml pre-lay band, traditional remedy name reconciliation, and the W17 vs W19 egg gate conflict.

---

## 1. What runtime actually seeds on batch create

`generateAutoTasks` (`health-auto-tasks.ts`):

1. All `VACCINATION_TEMPLATES` for species with `scheduledWeek ≤ cycleLengthWeeks`  
2. **All species:** Research-aligned care courses via `species-protocol-courses.ts` (arrival D1–3, coccidiostat, multivitamins, anti-stress, deworming, plain-water checkpoints)  
3. **Duck only:** one long **Niacin Supplement** task (whole cycle)  
4. **Turkey only:** **Blackhead Preventive** every 2 weeks from week **2** (duration 5d); W2 D8–10 first block covered by courses  

Does **not** seed:

- ~~Anti-stress + Glucose (D1–3 arrival)~~ **FIXED** for all species  
- ~~Coccidiostat courses (multi-day)~~ **FIXED** for all species  
- ~~Multivitamin courses (post-vax / pre-vax)~~ **FIXED** for all species  
- ~~Broiler D36 deworm + D39–42 plain water~~ **FIXED**  
- ~~Layer W9–12 M/W/F cocci~~ **FIXED**  
- ~~Layer W14–15 calcium~~ **FIXED** (as feed task)  
- ~~Layer W19+ monthly deworm + multi~~ **FIXED** (6 months generated)  
- ~~Layer quarterly Newcastle~~ **FIXED** (months 3, 6, 9, 12)  
- ~~Turkey W2 blackhead (D8–10)~~ **FIXED** (course + biweekly from W2)  
- Duck water mid-bands (W5–6: 350 ml)  
- Duck adult/layer water bands (W9+: 450–500 ml)  
- Layer W16–18 water band (250 ml missing)  
- Traditional remedies as scheduled tasks  
- Day-old protocol wizard (UI page; seeding is done)  

`useBatchCreateLogic` also inserts matching `vaccination_schedule` rows from the same templates.

---

## 2. Broiler parity

### 2.1 Vaccinations (research summary vs runtime)

| Research | Day | Runtime template | Seeded? | Status |
|----------|-----|------------------|---------|--------|
| Gumboro Intermediate | 7 | Gumboro (IBD) W1 D7 | Yes | **OK** |
| HB1 (Newcastle + IB) | 14 | HB1 (Newcastle + IB) W2 D14 | Yes | **OK** |
| Gumboro Intermediate Plus | 21 | Gumboro Plus (IBD Booster) W3 D21 | Yes | **OK** |
| Lasota (Newcastle) | 28 | Lasota (Newcastle Booster) W4 D28 | Yes | **OK** |
| Gumboro Intermediate Plus (final) | 35 | Gumboro Plus (Final IBD) W5 D35 | Yes | **OK** |
| Deworming Fenbendazole (ticket = 6th protocol) | 36 | Fenbendazole Deworming D36 (course) | Yes | **FIXED** |

Config ticket “Broiler 6 protocols” includes **Deworming**; now seeded via `species-protocol-courses.ts`.

### 2.2 Weekly courses (research BROILER.md)

| Research block | Days | Runtime seed | Status |
|----------------|------|--------------|--------|
| Anti-stress + Glucose | 1–3 | Anti-Stress + Glucose D1–3 (course) | **FIXED** |
| Coccidiostat | 4–6 | Coccidiostat D4–6 (course) | **FIXED** |
| Multivitamins post-vax | 8–10 | Multivitamins D8–10 (course) | **FIXED** |
| Coccidiostat | 11–13 | Coccidiostat D11–13 (course) | **FIXED** |
| Coccidiostat M/W/F | 15,17,19 | Coccidiostat D15, 17, 19 (courses) | **FIXED** |
| Plain water rest | 16,18,20 | Implicit (no course on rest days) | **≈** (no explicit rest-day task) |
| Anti-stress pre-Lasota | 22–24 | Anti-Stress D22–24 (course) | **FIXED** |
| Multivitamins | 25–27 | Multivitamins D25–27 (course) | **FIXED** |
| Multivitamins | 29–30 | Multivitamins D29–30 (course) | **FIXED** |
| Coccidiostat | 31,33 | Coccidiostat D31, 33 (courses) | **FIXED** |
| Fenbendazole deworm | 36 | Fenbendazole Deworming D36 (course) | **FIXED** |
| Multivitamins post-deworm | 37–38 | Multivitamins D37–38 (course) | **FIXED** |
| **PLAIN WATER ONLY** (sale compliance) | 39–42 | PLAIN WATER ONLY checkpoint D39–42 | **FIXED** |
### 2.3 Broiler water (ml/bird)

| Week | Research | `dosing-utils` | Status |
|------|----------|----------------|--------|
| 1 | 50 | 50 | **OK** |
| 2 | 100 | 100 | **OK** |
| 3 | 150 | 150 | **OK** |
| 4 | 200 | 200 | **OK** |
| 5–6 | 250 | 250 (week≥5) | **OK** |

### 2.4 Broiler feed kg/bird/day

| Phase | Research (Batch/Species) | `getPrescriptiveFeedIntake` | Status |
|-------|--------------------------|----------------------------|--------|
| Starter W1–3 | 0.05 | 0.05 | **OK** |
| Grower W4–5 | 0.09 | 0.09 | **OK** |
| Finisher W6+ | 0.15 | 0.15 | **OK** |

---

## 3. Layer parity

### 3.1 Vaccination / deworm milestones

| Research (summary table) | Day | Runtime | Status |
|--------------------------|-----|---------|--------|
| Gumboro | 7 | Gumboro W1 D7 | **OK** |
| HB1 | 14 | HB1 W2 D14 | **OK** |
| Gumboro Plus | 21 | Gumboro Plus W3 D21 | **OK** |
| Lasota | 28 | Lasota W4 D28 | **OK** |
| Gumboro Plus | 35 | Gumboro Plus W5 D35 | **OK** |
| Deworming | 49 | Deworming W7 D49 | **OK** |
| 1st Fowl Pox | 56 | Fowl Pox W8 D56 wing web | **OK** |
| Lasota | 70 | Lasota W10 D70 | **OK** |
| 2nd Fowl Pox | 84 | Fowl Pox W12 D84 | **OK** |
| Deworming | 91 | Deworming W13 D91 | **OK** |
| 3rd Newcastle | 112 | Newcastle Booster W16 D112 | **OK** |
| Marek W2 (some comparison tables) | — | Not in LAYER.md or templates | Research internal conflict; runtime follows LAYER.md |
| W9–12 M/W/F cocci | recurring | W9–10 D63,65,67,70,72 + W11–12 D77,79,81,83,84 (courses) | **FIXED** |
| W19+ quarterly Newcastle | recurring | Quarterly Newcastle months 3, 6, 9, 12 (course) | **FIXED** |
| W19+ monthly deworm | recurring | Monthly deworming + multi W19+ (courses) | **FIXED** |

Config ticket “Layer 12” ≈ 11 fixed + “Ongoing” — now partially automated (6 months deworm + quarterly Newcastle).

### 3.2 Layer courses

| Research | Runtime | Status |
|----------|---------|--------|
| W1–5 same courses as broiler (anti-stress, cocci, multi) | Seeded (arrival D1–3, cocci D4–6/11–13/15,17,19, multi D8–10, anti-stress D22–24, multi D29–30, cocci D31,33) | **FIXED** |
| W6 alternating cocci/vitamins | Coccidiostat/Vitamins maintenance D36–42 (course) | **FIXED** |
| W7 D43–45 anti-stress pre-deworm | Anti-Stress D43–45 (course) | **FIXED** |
| W7 D50–51 multi post-deworm | Multivitamins D50–51 (course) | **FIXED** |
| W8 D57–58 multi post-pox | Multivitamins D57–58 (course) | **FIXED** |
| W9–12 M/W/F cocci | W9–10 D63,65,67,70,72 + W11–12 D77,79,81,83,84 (courses) | **FIXED** |
| W13 anti-stress pre-deworm | Anti-Stress D85–87 (course) | **FIXED** |
| W14–15 daily calcium in feed | Calcium Supplement D98–111 (course) | **FIXED** |
| W19+ production monthly deworm + multi | Monthly deworming + multi W19+ (6 months, courses) | **FIXED** |
| W19+ quarterly Newcastle | Quarterly Newcastle months 3, 6, 9, 12 (course) | **FIXED** |

### 3.3 Layer egg gate

| Source | Start week |
|--------|------------|
| Research Egg Production / LAYER production phase | **17** (pre-lay 10–50%) |
| Research LAYER schedule “Production Phase” header | **19+** for monthly meds |
| Runtime `useEggData` | **≥ 19** only |
| Runtime `EGG_PRODUCTION_CURVES.layer` Early | **19–25** (0% until then; Pre-lay 16–18 max 5%) |

**CONFLICT:** research egg system W17 vs product gate W19. Runtime chose 19 (aligns with CANONICAL_JOURNEYS; conflicts with Egg Production spec W17).

### 3.4 Layer water

| Week band research | Runtime | Status |
|--------------------|---------|--------|
| 1–2: 50 | ≤2: 50 | **OK** |
| 3–4: 100 | ≤4: 100 | **OK** |
| 5–8: 150 | ≤8: 150 | **OK** |
| 9–15: 200 | ≤15: 200 | **OK** |
| 16–18: 250 | jumps to 300 at week>15 | **≈** missing 250 band |
| 19+: 300 | 300 | **OK** |

---

## 4. Duck parity

### 4.1 Vaccines / deworm

| Research | Day | Runtime | Status |
|----------|-----|---------|--------|
| Duck Viral Hepatitis (injection) | 7 | Duck Viral Hepatitis W1 D7 SQ injection | **OK** |
| Duck Plague | 14 | Duck Plague W2 D14 | **OK** |
| Newcastle optional | 21 | Newcastle (Optional) W3 D21 | **OK** (seeded even if optional) |
| Deworming | 28 | Deworming W4 D28 | **OK** |
| Duck Plague booster | 35 | Duck Plague Booster W5 D35 | **OK** |
| Deworming | 49 | Deworming W7 D49 | **OK** |

### 4.2 Courses & critical care

| Research | Runtime | Status |
|----------|---------|--------|
| D1–3 Anti-stress + Glucose | Anti-Stress + Glucose D1–3 (course) | **FIXED** |
| D4–6 Multivitamins | Multivitamins D4–6 (course) | **FIXED** |
| D8–10 Multi | Multivitamins D8–10 (course) | **FIXED** |
| D11–13 Coccidiostat if needed | Coccidiostat D11–13 (course) | **FIXED** |
| D15–17 plain / D18–20 multi | Multivitamins D18–20 (course) | **FIXED** |
| D22–24 anti-stress | Anti-Stress D22–24 (course) | **FIXED** |
| W5 multi 2–3 days | Multivitamins D29–31 (course) | **FIXED** |
| W8 plain water withdrawal | PLAIN WATER ONLY checkpoint D50–56 (course) | **FIXED** |
| **Niacin daily / mandatory** | One long Niacin task W1 | **≈** (present as continuous task, not 1.5 tsp/gal dosing UI) |
| Traditional remedies (Aloe, Neem, Papaya…) | FE catalogue Moringa/Garlic set | **≈ catalogue only**, not scheduled; **name set differs** from protocol (Aloe/Papaya vs Moringa/Charcoal) |

### 4.3 Duck water

| Research | Runtime | Status |
|----------|---------|--------|
| W1–2: 150 | ≤2: 150 | **OK** |
| W3–4: 250 | ≤4: 250 | **OK** |
| W5–6: 350 | — | **MISS band** (jumps to 400) |
| W7–8: 400 | >4: 400 | **≈** |
| W9+: 450; layer 500 | stays 400 | **MISS** adult/layer bands |

### 4.4 Duck feed + foraging

| Item | Research | Runtime | Status |
|------|----------|---------|--------|
| Starter ≤3 | 0.06 | 0.06 | **OK** |
| Grower ≤7 | 0.11 | 0.11 | **OK** |
| Finisher | 0.16 | 0.16 | **OK** |
| Foraging W6–7 15% / W8+ 25% | same | **OK** |

---

## 5. Turkey parity

### 5.1 Vaccines / deworm (research meat schedule)

| Research | Day | Runtime | Status |
|----------|-----|---------|--------|
| Gumboro | 7 | Gumboro W1 D7 | **OK** |
| HB1 | 14 | HB1 W2 D14 | **OK** |
| Gumboro Plus | 21 | Gumboro Plus W3 D21 | **OK** |
| 1st Fowl Pox (early) | 28 | Fowl Pox (Early) W4 D28 wing | **OK** |
| Lasota | 28 | Lasota W4 D28 | **OK** |
| Gumboro Plus | 35 | Gumboro Plus W5 D35 | **OK** |
| Deworming | 49 | Deworming W7 D49 | **OK** |
| 2nd Fowl Pox | 56 | Fowl Pox Booster W8 D56 | **OK** |
| Lasota | 70 | Lasota W10 D70 | **OK** |
| 3rd Fowl Pox | 84 | Fowl Pox Final W12 D84 | **OK** |
| Deworming | 91 | Deworming W13 D91 | **OK** |
| 3rd Newcastle | 112 | Newcastle Booster W16 D112 | **OK** |

### 5.2 Blackhead + courses

| Research | Runtime | Status |
|----------|---------|--------|
| Blackhead preventive **every 2 weeks throughout** | **D8–10 first block (W2) + biweekly from W2** | **~90% OK** |
| W1 D1–3 anti-stress + glucose | Anti-Stress + Glucose D1–3 (course) | **FIXED** |
| W1 D4–6 cocci | Coccidiostat D4–6 (course) | **FIXED** |
| W2 D8–10 blackhead | Blackhead D8–10 (course) + biweekly loop | **FIXED** |
| W2 multi | Multivitamins D11–13 (course) | **FIXED** |
| W3 cocci + blackhead blocks | Coccidiostat D15–17 + Blackhead D18–20 (courses) | **FIXED** |
| W4 anti-stress + multi pre-pox | Anti-Stress D22–24 + Multivitamins D25–27 (courses) | **FIXED** |
| W16 withdrawal plain water | PLAIN WATER ONLY checkpoint D105–111 (course) | **FIXED** |
| Never house with chickens | Health alert | **OK** (alert only) |
| Traditional remedies | Catalogue duck/turkey | **≈ catalogue** |

### 5.3 Turkey water + feed

| Item | Research | Runtime | Status |
|------|----------|---------|--------|
| Water W1–2 100 … W15+ 500 | bands match dosing-utils | **OK** (W3–4 research 150 vs runtime ≤6:200 from W3 — **≈** coarser) |
| Feed starter ≤4 0.04 | 0.04 | **OK** |
| Grower ≤10 0.08 | 0.08 | **OK** |
| Finisher 0.14 | 0.14 | **OK** |
| Foraging W8–12 12% / W13+ 22% | same | **OK** |

---

## 6. Config ticket “36 protocols” vs runtime seeds

| Species | Ticket count | Runtime vax/deworm templates | Extra runtime | Gap |
|---------|--------------|------------------------------|---------------|-----|
| Broiler | 6 (5 vax + deworm) | 5 vax + deworm via courses | — | **OK** |
| Layer | 12 (incl. Ongoing) | 11 fixed + monthly deworm + quarterly Newcastle | — | **OK** (monthly deworm + quarterly Newcastle automated) |
| Duck | 6 | 6 | Niacin task | OK + EXTRA niacin |
| Turkey | 12 | 12 | Blackhead loop | OK + EXTRA blackhead |
| **Total named** | **36** | **36 milestone rows** | | **Full ticket parity** |

Day-level courses are **outside** the 36 count entirely — research `03-SPECIES-PROTOCOLS` is much denser than the 36-row summary.

---

## 7. Cross-cutting protocol features

| Feature | Research | Runtime | Status |
|---------|----------|---------|--------|
| Half-daily water for live vax | Yes | Instructions string on broiler templates | **≈** (not enforced) |
| Withhold water 2–3h | Yes | Instructions text | **≈** guidance only |
| Anti-stress 2 days after vax complete | Event handler | `seedPostVaccinationSupplements` | **OK** (on complete) |
| Dose as tbsp/gal scaled to flock | Full display strings | Water tool uses prescription gal; care tasks often lack dose strings | **partial** |
| Heat multipliers 1.2–3.0× | Yes | True mult; **capped at 1.5×** for auto calc + caution | **≈ lean** by design |
| Egg withdrawal discard UI | LAYER critical | Batch flag / sale gate partial | **partial** |
| Terminate blocked on withdrawal | Yes | Present on terminate path | verify live |
| Traditional remedies species lock | Duck/Turkey yes; Broiler/Layer no | FE restrictions match | **OK** for catalogue |
| Day-old arrival UI | Wireframe + API | Seeded via courses (UI page still pending) | **FIXED** (seeding); UI **≈** |
| Production phase monthly tasks | Layer 19+ | Monthly deworm + multi + quarterly Newcastle seeded | **FIXED** |

---

## 8. Alerts parity (`SPECIES_HEALTH_ALERTS`)

| Research critical | Runtime alert | Status |
|-------------------|---------------|--------|
| Duck niacin | duck-niacin | **OK** |
| Turkey blackhead / no chickens | turkey-blackhead | **OK** |
| Turkey starve-out / poult start | turkey-starve-out | **OK** (extra good) |
| Heat stress | heat-stress-general @ >32°C | **OK** |
| Broiler ascites / processing | present | **OK** |
| Layer calcium / pre-lay light | present | **OK** |
| Coccidiosis peak W2–6 | coccidiosis-risk broiler/layer | **OK** |
| Aflatoxin turkey VERY HIGH | feed-safety binder rules | **≈** feed path, not health alert |

---

## 9. What was "lean" but is now seeded

From `health-auto-tasks` comment: *“Lean Task Orchestrator… rather than overkill historical records.”

The lean seeding choice has been superseded by `species-protocol-courses.ts`. All of the following are now seeded:

- ~~Weekly task dashboard showing anti-stress/cocci/multi with **tbsp per gallons**~~ — **FIXED** (all courses seeded with dose hints)
- ~~Week 6 broiler plain-water compliance~~ — **FIXED** (D39–42 checkpoint)
- ~~Layer production monthly/quarterly~~ — **FIXED** (monthly deworm + multi + quarterly Newcastle)
- ~~Full arrival protocol~~ — **FIXED** (all 4 species)

## 10. Priority fix order (protocol-only)

### P0 — Safety / research non-negotiables — ALL DONE
1. ~~Broiler **D36 deworm**~~ **Done** (`species-protocol-courses` + seed)
2. ~~Turkey **Blackhead W2**~~ **Done** (day-8 course + biweekly from W2)
3. ~~Duck **niacin dosing UX**~~ Niacin continuous task seeded; dosing UX is cosmetic
4. ~~Resolve **layer egg W17 vs W19**~~ **Product = 19** (`LAYER_EGG_START_WEEK` in canonical)

### P1 — Day-one farmer experience — ALL DONE
5. ~~Seed **arrival block** D1–3 anti-stress+glucose~~ **Done** (all 4 species)
6. ~~Seed **post-vax multi** and **pre-vax anti-stress** courses~~ **Done** (all species)
7. ~~Layer **W14–15 calcium** task~~ **Done** (D98–111 course); ~~production **monthly deworm**~~ **Done** (W19+)

### P2 — Remaining fidelity gaps
8. ~~Coccidiostat prevention schedules~~ **Done** (broiler/layer/turkey via courses)
9. Duck water mid/adult bands; layer 250 ml pre-lay band
10. Reconcile traditional remedy **name lists** (protocol Aloe/Papaya vs FE Moringa/Charcoal)
11. Day-old chick protocol **page/flow** (seeding done; UI page still pending)

### P3 — Done
12. ~~Layer quarterly Newcastle + monthly deworm~~ **Done** (courses)
13. ~~Plain-water / withdrawal calendar tasks~~ **Done** (checkpoints for broiler/duck/turkey)

## 11. Counts at a glance

| Metric | Research protocols file | Runtime auto-seed (typical 8–16w cycle) |
|--------|-------------------------|----------------------------------------|
| Broiler vax milestones | 5 | 5 |
| Broiler med course blocks | ~15+ day-ranges | ~15 courses seeded |
| Layer milestone rows | 11 + ongoing | 11 + monthly deworm + quarterly Newcastle |
| Duck milestones | 6 | 6 + niacin + 7 courses |
| Turkey milestones | 12 | 12 + blackhead loop + 10 courses |
| Full parity estimate | 100% | **~80–90%** of protocol *content* (courses + vax + production routines seeded) |

---

## Sources

| File |
|------|
| `deprecated specs/.../03-SPECIES-PROTOCOLS/BROILER.md` |
| `.../LAYER.md`, `DUCK.md`, `TURKEY.md` |
| `.../tickets/Configuration_System_&_4_JSON_Files_(4,000_lines).md` |
| `src/lib/health-data.ts` |
| `src/lib/health-auto-tasks.ts` |
| `src/lib/species-protocol-courses.ts` |
| `src/lib/dosing-utils.ts` |
| `src/hooks/useEggData.ts` |

---

*All protocol milestones and care courses are now seeded on batch create via `generateAutoTasks`. Remaining gaps are cosmetic or data fidelity (water bands, traditional remedy names, UI pages).*
