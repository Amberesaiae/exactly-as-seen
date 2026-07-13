# Protocol Parity Matrix — Research vs Runtime

**Date:** 2026-07-13  
**Research source of truth:** `deprecated specs/Lampfarms specs/03-SPECIES-PROTOCOLS/*.md`  
**Config ticket counts:** `tickets/Configuration_System_&_4_JSON_Files_(4,000_lines).md` (36 protocols)  
**Runtime:** `src/lib/health-data.ts`, `src/lib/health-auto-tasks.ts`, `src/lib/dosing-utils.ts`, `src/lib/feed-data.ts`, `src/hooks/useEggData.ts`, batch create seed  

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
| Broiler **full weekly courses** | Anti-stress, cocci, multi, deworm, plain-water window | **Not seeded** (vax only) | **~15%** |
| Layer **vaccines/deworm** (11 rows) | Through D112 | 11 template rows seeded | **~90% OK** |
| Layer **courses + production monthly/quarterly** | Weeks 1–18 courses + W19+ routine | Not seeded | **~25%** |
| Duck **vaccines** (6) | DVH, Plague×2, ND opt, deworm×2 | 6 templates seeded | **~90% OK** |
| Duck **arrival/courses + traditional** | Full day table + 7 remedies | Niacin task only (+ vax); traditional is catalogue only | **~30%** |
| Turkey **vaccines** (12–13) | Pox early + full series | 12 templates (+ Blackhead loop) | **~85% OK** |
| Turkey **Blackhead courses** | Every 2 weeks + early W2 | Biweekly from W4 only | **≈ partial** |
| Water ml tables | Full week bands | Mostly OK; duck mid-bands lean | **~85%** |
| Feed kg/bird/day | Phase tables | `getPrescriptiveFeedIntake` aligned | **~90%** |
| Egg week gates | Research W17 layers / W20 ducks | Runtime **W19** layers / W20 ducks | **CONFLICT** |
| 36 protocol ticket count | Broiler 6 (incl. deworm) | Broiler 5 vax (no deworm seed) | **MISS** |
| Day-old arrival protocol | Explicit D1–3 + UI | Not a first-class seed block | **MISS** |
| Post-vax anti-stress (2 days) | On complete (events) | Seeded on complete helper | **OK path** |

**Bottom line:** Vaccination **milestones** are largely ported. Research **weekly medication courses** (arrival, cocci, multi, plain water, production routines) are **not** generated at batch create. Runtime deliberately “lean” — that is a product gap vs `03-SPECIES-PROTOCOLS`, not a complete implementation.

---

## 1. What runtime actually seeds on batch create

`generateAutoTasks` (`health-auto-tasks.ts`):

1. All `VACCINATION_TEMPLATES` for species with `scheduledWeek ≤ cycleLengthWeeks`  
2. **Duck only:** one long **Niacin Supplement** task (whole cycle)  
3. **Turkey only:** **Blackhead Preventive** every 2 weeks from week **4** (duration 5d)  

Does **not** seed:

- Anti-stress + Glucose (D1–3 arrival)  
- Coccidiostat courses (multi-day)  
- Multivitamin courses (post-vax / pre-vax)  
- Broiler D36 deworm + D39–42 plain water  
- Layer W6 maintenance, W14–15 calcium, W19+ monthly/quarterly  
- Duck multivitamin/coccidiostat day blocks  
- Traditional remedies as schedule  
- Day-old protocol wizard  

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
| Deworming Fenbendazole (ticket = 6th protocol) | 36 | — | No | **MISS** |

Config ticket “Broiler 6 protocols” includes **Deworming**; runtime has **5 vaccines only**.

### 2.2 Weekly courses (research BROILER.md)

| Research block | Days | Runtime seed | Status |
|----------------|------|--------------|--------|
| Anti-stress + Glucose | 1–3 | — | **MISS** |
| Coccidiostat | 4–6 | — | **MISS** |
| Multivitamins post-vax | 8–10 | — | **MISS** (anti-stress only after *complete*, not pre-scheduled) |
| Coccidiostat | 11–13 | — | **MISS** |
| Coccidiostat M/W/F | 15,17,19 | — | **MISS** |
| Plain water rest | 16,18,20 | — | **MISS** (implicit) |
| Anti-stress pre-Lasota | 22–24 | — | **MISS** |
| Multivitamins | 25–27 | — | **MISS** |
| Multivitamins | 29–30 | — | **MISS** |
| Coccidiostat | 31,33 | — | **MISS** |
| Fenbendazole deworm | 36 | — | **MISS** |
| Multivitamins post-deworm | 37–38 | — | **MISS** |
| **PLAIN WATER ONLY** (sale compliance) | 39–42 | — | **MISS** (no hard block UI for “no meds”) |

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
| W19+ quarterly Newcastle | recurring | Not generated | **MISS** |
| W19+ monthly deworm | recurring | Not generated | **MISS** |

Config ticket “Layer 12” ≈ 11 fixed + “Ongoing” — ongoing **not** automated.

### 3.2 Layer courses

| Research | Status |
|----------|--------|
| W1–5 same courses as broiler (anti-stress, cocci, multi) | **MISS** |
| W6 alternating cocci/vitamins | **MISS** |
| W7 D43–45 anti-stress pre-deworm | **MISS** |
| W7 D50–51 multi post-deworm | **MISS** |
| W8 D57–58 multi post-pox | **MISS** |
| W9–10 / 11–12 MWF cocci | **MISS** |
| W14–15 daily calcium in feed | **MISS** as task (alert only ≈) |
| Production monthly routine | **MISS** |

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
| D1–3 Anti-stress + Glucose | — | **MISS** |
| D4–6 Multivitamins | — | **MISS** |
| D8–10 Multi | — | **MISS** |
| D11–13 Coccidiostat if needed | — | **MISS** |
| D15–17 plain / D18–20 multi | — | **MISS** |
| D22–24 anti-stress | — | **MISS** |
| W5 multi 2–3 days | — | **MISS** |
| W8 plain water withdrawal | — | **MISS** |
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
| Blackhead preventive **every 2 weeks throughout** | Biweekly from **W4** only | **≈** misses W2 (D8–10) first block |
| W1 D1–3 anti-stress + glucose | — | **MISS** |
| W1 D4–6 cocci | — | **MISS** |
| W2 D8–10 blackhead | Covered only if W4+ loop | **MISS** early |
| W2 multi | — | **MISS** |
| W3 cocci + blackhead blocks | partial via loop | **≈** |
| W4 anti-stress + multi pre-pox | — | **MISS** |
| W16 withdrawal plain water | — | **MISS** |
| Never house with chickens | Health alert | **OK** (alert only) |
| Traditional remedies | Catalogue duck/turkey | **≈** catalogue |

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
| Broiler | 6 (5 vax + deworm) | 5 vax | — | **−1 deworm** |
| Layer | 12 (incl. Ongoing) | 11 fixed | — | **−Ongoing** recurring |
| Duck | 6 | 6 | Niacin task | OK + EXTRA niacin |
| Turkey | 12 | 12 | Blackhead loop | OK + EXTRA blackhead |
| **Total named** | **36** | **34 milestone rows** | | ~2 short of ticket framing |

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
| Day-old arrival UI | Wireframe + API | Missing | **MISS** |
| Production phase monthly tasks | Layer 19+ | Missing | **MISS** |

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

## 9. What “lean” runtime intentionally dropped

From `health-auto-tasks` comment: *“Lean Task Orchestrator… rather than overkill historical records.”*

That choice **fails research acceptance** for:

- Weekly task dashboard showing anti-stress/cocci/multi with **tbsp per gallons**  
- Week 6 broiler plain-water compliance  
- Layer production monthly/quarterly  
- Full arrival protocol  

If product keeps lean seeding, it must be an **explicit, documented deviation** from `03-SPECIES-PROTOCOLS` — not claimed “protocol complete.”

---

## 10. Priority fix order (protocol-only)

### P0 — Safety / research non-negotiables missing from seed
1. ~~Broiler **D36 deworm**~~ **Done** (`species-protocol-courses` + seed)  
2. ~~Turkey **Blackhead W2**~~ **Done** (day-8 course + biweekly from W4)  
3. Duck **niacin dosing UX** (1.5 tsp/gal) — notes on continuous task; full dosing UI residual  
4. ~~Resolve **layer egg W17 vs W19**~~ **Product = 19** (`LAYER_EGG_START_WEEK` in canonical)  

### P1 — Day-one farmer experience (research wireframes)
5. Seed **arrival block** D1–3 anti-stress+glucose (all species)  
6. Seed **post-vax multi** and **pre-vax anti-stress** courses OR generate them when vaccine is scheduled  
7. Layer **W14–15 calcium** task; production **monthly deworm** generator  

### P2 — Fidelity
8. Coccidiostat prevention schedules (broiler/layer/turkey tables)  
9. Duck water mid/adult bands; layer 250 ml pre-lay band  
10. Reconcile traditional remedy **name lists** (protocol Aloe/Papaya vs FE Moringa/Charcoal)  
11. Day-old chick protocol page/flow  

### P3 — Automation
12. Layer quarterly Newcastle + monthly deworm as recurring jobs  
13. Plain-water / withdrawal calendar tasks  

---

## 11. Counts at a glance

| Metric | Research protocols file | Runtime auto-seed (typical 8–16w cycle) |
|--------|-------------------------|----------------------------------------|
| Broiler vax milestones | 5 | 5 |
| Broiler med course blocks | ~15+ day-ranges | 0 |
| Layer milestone rows | 11 + ongoing | 11 |
| Duck milestones | 6 | 6 + niacin |
| Turkey milestones | 12 | 12 + blackhead loop |
| Full parity estimate | 100% | **~35–40%** of protocol *content* (high on vax list, low on courses) |

---

## Sources

| File |
|------|
| `deprecated specs/.../03-SPECIES-PROTOCOLS/BROILER.md` |
| `.../LAYER.md`, `DUCK.md`, `TURKEY.md` |
| `.../tickets/Configuration_System_&_4_JSON_Files_(4,000_lines).md` |
| `src/lib/health-data.ts` |
| `src/lib/health-auto-tasks.ts` |
| `src/lib/dosing-utils.ts` |
| `src/hooks/useEggData.ts` |

---

*Next implementation step if desired: expand `generateAutoTasks` with a structured `species_protocol_courses` table driven by research day ranges (P0–P1 only first).*
