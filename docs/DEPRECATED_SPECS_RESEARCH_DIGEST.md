# Deprecated Specs — Research Digest

**Source tree:** `deprecated specs/Lampfarms specs/` (~43 markdown files, ~30k+ lines)  
**Read date:** 2026-07-13  
**How to use:** Domain rules here are **research truth**. Topology (FastAPI, Pyomo, React 19, TanStack Router, APScheduler) is **obsolete stack** — reimplement on Supabase + Vite/React runtime.

---

## 1. What this folder is

| Layer | Content |
|-------|---------|
| **Epic Brief** | Consolidate 15 systems + Dovetail Synergy; close ~90% implementation gap |
| **Core Flows** | Auth, wizards, 13 events, dual pattern demos, acceptance criteria |
| **System specs** (21) | Production-grade domain for each module + wireframes |
| **03-SPECIES-PROTOCOLS** | Farmer-facing weekly meds/vax/water tables (broiler/layer/duck/turkey/other) |
| **Tickets** (16) | Implementation slices (services, FIFO, 52 meds, 41 ingredients, etc.) |
| **Master architecture** | Integration catalog, models, jobs (mixed status claims — historical) |

**README.md is empty (1 line).** Navigation is by filenames.

---

## 2. Product thesis (unchanged by stack)

West African poultry **farm OS**:

1. **Backend intelligence, frontend simplicity** — farmer enters little; system generates protocols, tasks, phases, money side-effects.
2. **Dovetail Synergy** — one intent → events → finance + stock + health without scavenger hunt.
3. **Dual production pattern** — intensive automatic vs semi-intensive flexible.
4. **Config-driven** — species/protocols/ingredients/meds in JSON (or DB seeds), **not hardcoded UI magic numbers**.
5. **Food safety** — withdrawal blocks termination/sale; egg withdrawal for layers; WA aflatoxin/niacin/toxin binder.

---

## 3. Dual intensive / flexible (canonical research)

| | **Intensive (Automatic)** | **Semi-intensive / free-range (Flexible)** |
|--|---------------------------|--------------------------------------------|
| Who | All 4 species | **Ducks & turkeys** (broiler/layer intensive-only for alt feeding) |
| On feed **formulation confirm** | Auto expense + FIFO stock allocate | **No** auto handlers |
| On health **task complete** | Auto expense + stock deduct | Manual |
| On stock **purchase** | Auto expense by category | Still expected as purchase (always money out) |
| Foraging | None | Duck W6+, turkey W8+; 12–30% feed reduction by band |
| Farmer burden | Low | Higher — manual expense/stock (research) / consumption record |

**Foraging bands (research):**
- Duck semi: W6–7 **15%**, W8–10 **25%** (or 15–25% range model)
- Turkey semi: W8–12 **12%**, W13–16 **22%**
- Weight check: sample 10 birds; if >10% under target → reduce foraging 5%

**Note:** Core Flows flexible path is “manual Finance + Stock dashboards.” Later product contract (`CANONICAL_JOURNEYS`) softens this with optional **Book now** — research original is stricter manual.

---

## 4. Event catalog (Dovetail)

| Event | Primary side-effects |
|-------|----------------------|
| `BATCH_CREATED` | Generate full vax/checkpoint tasks from protocols |
| `FEED_FORMULATION_CONFIRMED` | Intensive: expense + stock allocate |
| `HEALTH_TASK_COMPLETED` | Intensive: expense + stock; always: withdrawal tracking |
| `VACCINATION_COMPLETED` | Anti-stress (+ multivitamins) next 2 days |
| `WEEK_ADVANCED` | Week tasks; feed phase update |
| `EGG_PRODUCTION_RECORDED` | Egg inventory |
| `EGG_SALE_RECORDED` | Revenue + inventory deduct |
| `STOCK_PURCHASE_RECORDED` | Expense by category map |
| `MORTALITY_RECORDED` | Population; analytics reserved |
| `BATCH_TERMINATED` | Finance finalize; status completed |
| `STOCK_LOW` / `STOCK_DEPLETED` | Alerts; block formulate if depleted |
| `WITHDRAWAL_PERIOD_ENDED` | Clear flag; ready to sell |

**Bus rules:** typed payload + batch_id; handler isolation (one failure ≠ cascade); prefer publish after primary commit.

---

## 5. Domain counts (research targets)

| Domain | Number | Notes |
|--------|--------|-------|
| Species (core) | **4** | Broiler, layer, duck, turkey (+ other: quail/guinea/geese research only) |
| Medications | **52** | 8 cocci, 15 abx, 6 dewormers, 13 vitamins, 4 antifungals, 7 traditional |
| Vaccination/health protocols | **36** | Broiler 6, Layer 12, Duck 6, Turkey 12 (ticket counts; day tables richer) |
| Ingredients | **41** | 9 energy + 15 protein + 6 Ca + 11 supplements |
| LP constraints | **12** | Protein/energy/AA/Ca/P/niacin ducks/fiber/inclusion/single Ca/species blocks/compulsory |
| Stock categories | **5** | Feed ingredients, meds, vaccines, supplements, equipment |
| Quality grades | **5** | excellent → damaged (runtime later used A/B/C/damaged) |
| Expense categories | **9** | Feed, health, labor, utilities, equipment, transport, housing, chicks, other |
| Revenue types | **5** | Eggs, birds, meat, manure, other |
| Critical med conflicts | **5** | **Not labeled C1–C8 in these docs** (see contradictions) |
| Containers | **~9–10** | West African drinkers/buckets (two catalogs disagree) |
| Config JSON files | **4** | species, protocols, ingredients, medications |
| Phase-1 services | **10** | Auth, EventBus, Config, BatchLifecycle, Feed, Health, Expense, Nutrition, Safety, WaterCalc |
| Scheduled jobs | **3** | Week advance; daily health tasks; withdrawal check |
| Cost privacy reveal | **30 s** | Eye icon temporary unmask |

---

## 6. Species protocols (03-SPECIES-PROTOCOLS)

### Broiler
- Cycle 6–8 weeks meat; **NO traditional remedies**
- **5 vaccines** by day: D7 Gumboro, D14 HB1, D21 Gumboro Plus, D28 Lasota, D35 Gumboro Plus
- D36 deworm → D39–42 plain water / sale compliance
- Coccidiostat + anti-stress + multivitamins interleaved
- App **blocks terminate** if withdrawal active
- Heat stress: electrolytes

### Layer
- Cycle 72–78 weeks (product specs also say 68)
- Rearing weeks 1–18 ≈ broiler early schedule + **Fowl Pox W8/W12**, deworm W7/W13, Newcastle W16
- Eggs: **egg withdrawal critical** (discard eggs until date)
- Production: monthly deworm; quarterly Newcastle; calcium for shells
- **NO traditional remedies**

### Duck
- Meat 8–10 weeks **or** layer 72+
- Water **1.5–3×** chickens; **niacin mandatory** 1.5 tsp/gal or ≥55 mg/kg feed
- Distinct diseases: Duck Viral Hepatitis (injection D7), Duck Plague, optional ND
- **Traditional remedies YES** (aloe, neem, papaya, garlic…)
- Alt feeding from **week 6+**

### Turkey
- Meat 12–20 weeks; **Blackhead #1 killer** (biweekly preventive; never with chickens)
- Fowl Pox **early (week 4)** vs chickens week 8
- Aflatoxin **very high** sensitivity — toxin binder mandatory
- **Traditional remedies YES**
- Alt feeding from **week 8+**

### Other (quail, guinea, geese)
- Research only — **not** in 4-species batch product core

---

## 7. Module domain summary

### Batch
- 3-step wizard: species/system → house/qty/date → review + protocol preview  
- Semi-intensive disabled for broiler/layer (alt feeding)  
- Mortality: count + reason; rate = deaths / initial  
- Terminate: **withdrawal block**; reason + weight required  
- FSM: `created → brooding → starter → grower → finisher ↔ withdrawal → ready_to_sell → terminated`  
- Parallel `batch_status`: preparation → active → completed → archived  

### Water-Health
- Container dosing: **tbsp/tsp per gallon**, never mg/kg bodyweight  
- Standard **1.5 tbsp/gallon**; vaccines in **half daily water** after 2–3h withhold  
- Conflict matrix **5 critical** pairs (charcoal/any, Ca/tetracycline, sulfa/acid vitamins, live vax/abx, live vax/chlorine)  
- Traditional remedies ducks/turkeys only  

### Feed
- **Planning first** (bags or duration → target kg)  
- Methods: Ready-made | Custom (Quick LP / Flexible Mix / Free Mix) | Concentrate  
- Farmer sees bags/kg/cost — **not** nutritional math  
- WA: toxin binder ~0.1% mandatory; duck niacin; cassava HQCP only; cottonseed blocked layers; etc.  

### Stock
- FIFO + quality preference; exclude damaged; **7-day** expiry buffer  
- Purchase → expense by category  
- Intensive auto-allocate on formulation/health; flexible manual  

### Eggs
- Layers **W17–68** (protocol/detail); ducks layer **W20–68**  
- Meat ducks: no eggs  
- Crates of **30**; sizes L/M/S/Duck  
- Sale → revenue always (not dual-gated)  
- Low inventory alert e.g. 5 crates  

### Finance
- 9 expense / 5 revenue categories  
- Intensive auto from events; flexible manual  
- Cost privacy mask money; counts/population always visible  

### Dashboard / Settings / Records
- Hub: active flocks, tasks today, masked money, charts, activity  
- Settings: theme, privacy, market prices (must feed estimates), species config view, data export  
- Records: overview, performance, financial, compare ≤3 batches  

### Jobs
1. Advance weeks (e.g. Sunday)  
2. Generate daily health tasks (morning)  
3. Clear expired withdrawals  

---

## 8. Internal contradictions (must resolve before “parity”)

1. **Simplified protocol JSON** (2–3 vax/species) vs **day tables** (5+ broiler, 11+ layer)  
2. **Layer Marek W2** in comparison tables vs **Gumboro D7** in LAYER.md (no Marek)  
3. **Free-range** in Alternative Feeding vs batch enum **intensive | semi only** in places  
4. **Conflict set A** (charcoal/chlorine…) vs **Pre-T6 set B** (probiotics/ionophores…)  
5. **Container catalogs** differ (Bell volumes vs ticket 10-type list)  
6. **Egg start week** 17 vs 19 in later product contracts  
7. **Week advance** auto-scheduler vs farmer “Advance Week” popup — both specified  
8. **Model counts** 27 / 31 / 52 — tickets inconsistent  
9. **Flexible expense**: no auto on formulation vs auto on “record consumption”  
10. Quality grades **excellent/good/fair** vs later runtime **A/B/C/damaged**

**Precedence recommendation for product:**  
`CANONICAL_JOURNEYS` + migrations for money/dual/gates; **03-SPECIES-PROTOCOLS day tables** for vax/med schedule depth; conflict matrix = Water-Health production table (set A) until product decides to merge set B.

---

## 9. Obsolete stack (do not re-implement as topology)

Python FastAPI · SQLAlchemy · APScheduler · python-statemachine · Pyomo/GLPK · Express · Redis/BullMQ · React 19 claims · TanStack Router v7 · JWT farm_name login · SQLite-as-prod.

**Portable:** events, dual pattern, config hierarchy, dosing, FIFO+quality, privacy, species protocols, 3 feed methods, 9/5 finance.

---

## 10. Mapping to current runtime (one line each)

| Research | Runtime today (LampFarms Vite+Supabase) |
|----------|------------------------------------------|
| Event bus + 10 services | Client hooks + `synergy.ts` multi-writes |
| 36 protocols JSON | FE `VACCINATION_TEMPLATES` + partial seed |
| 52 meds JSON | DB seed migration 7 |
| 41 ingredients | ~25 seeded |
| Dual pattern | `ledger-policy` / production-system helpers |
| FIFO + quality | RPC `allocate_fifo_by_quality` |
| Cost privacy 30s reveal | Privacy mask; reveal UX differs |
| Market prices → estimates | Settings tab exists; **MarketTrends hardcoded** |
| Daily task job | Edge function; virtual tasks also client-side |
| Dovetail complete | Partial — many silent/partial side-effects |

Full gap analysis: `docs/PRODUCTION_E2E_AUDIT.md`.  
**Protocol day-by-day vs runtime:** `docs/PROTOCOL_PARITY_MATRIX.md`.

---

## 11. File index (for deep dives)

```
deprecated specs/Lampfarms specs/
  Epic + master architecture (root)
  specs/   — Core_Flows, Batch, Feed, Water-Health, Stock, Eggs, Finance,
             Dashboard, Settings, Records, Alternative_Feeding, Species-Specific,
             Backend, Frontend, Navigation, Tech_Plan, Pre-T6, Onboarding…
  03-SPECIES-PROTOCOLS/ — BROILER, LAYER, DUCK, TURKEY, OTHER-SPECIES
  tickets/ — 16 implementation tickets
```

---

---

## 12. Gaps from first pass (you were right)

The initial digest underweighted or omitted these. They are **in the folder** and part of research product truth.

### 12.1 Auth & identity (Core Flows — not modern “email only”)
- Login identity is **`farm_name` + password** (not email) in research auth flows.
- JWT **access ~15 min**, **refresh ~7 days**, **rotation** on refresh, optional **HttpOnly cookie**.
- Auth FSM: `anonymous` → `authenticated-no-setup` → `setup-pending` → `setup-complete`.
- Roles mentioned in architecture: **owner / manager / worker** (privacy + permissions context).

### 12.2 Day-old chick arrival protocol
- Explicit **day-old chick arrival** journey / API (`GET .../health/day-old-protocol`).
- Wireframes for arrival: glucose/anti-stress first days, not “just open Health tab.”
- Batch create → protocol load includes **checkpoints**, not only the 5 vaccines.

### 12.3 Feed planning & shopping list (Feed Calculator)
- **Planning first** (by bags *or* duration → `target_kg`) before method choice.
- On intensive confirm: if stock short → **shopping list / shortfall** (“Purchase 30kg Soybean Meal”), not silent partial allocate only.
- **Stock reservation** before confirm (reservations expire ~**7 days** if unused).
- Ingredient pickers: energy/protein/calcium **category popups**; calcium = **single selection**.
- Concentrate method: **ratio slider** (e.g. 70/30 concentrate:grain).

### 12.4 Stock beyond FIFO
- **Stock transfer** between locations.
- **Supplier** entity and purchase linkage.
- Quality grades research: **excellent / good / fair / poor / damaged** (runtime later A/B/C).
- Manual override to use near-expiry in emergency.

### 12.5 Water-Health depth
- **Measurement unit preferences**: gallons vs liters vs named containers (display strings differ).
- **Regional container defaults** (Ghana vs Nigeria preferred drinkers).
- **Local product names** (Ghana/Nigeria trade names for meds).
- **Heat-stress water multipliers** by ambient band (1.0× → 2.5–3.0×).
- **Emergency protocols**: coccidiosis, respiratory, heat stress, Blackhead, sudden mortality; “when to call vet.”
- **Population formula for dosing**: initial − mortality − culled − sold + added (recalc on every pop change).
- **Water-health setup wizard** during/after batch (preferences), not only Care page.

### 12.6 Species environment schedules (`species.json` research)
Not only vaccines — week-by-week:
- **Temperature / brooding** (esp. turkey 35–37°C early weeks)
- **Lighting** (layers pre-lay light management)
- **Space** sq ft/bird (and foraging space validation for alt feeding)
- **Daily feed rates** by phase (kg/bird/day tables)
- **Nutrient minima** by phase (protein %, energy kcal, Ca for layers)

### 12.7 Finance depth
- **Sales estimation formulas** (broiler weight×price; layer remaining eggs + spent hen; turkey **holiday premium** e.g. 1.5×).
- **Spent layer** market price as separate settings field.
- Labor / utilities / transport / housing are **manual-only** categories by design.
- **Source badges** on expenses: Auto vs Manual.

### 12.8 Eggs depth
- **Pullet eggs** (<40g W17–19) **not for sale**.
- Broken-rate thresholds: &lt;2% normal, 2–5% acceptable, &gt;5% high.
- Production rate badges: Excellent ≥85% / Good 70–84% / Poor &lt;70%.
- **Customers** entity for repeat buyers; payment method/status on sales.
- Separate pages called out: **Customers**, **Suppliers**, **water-health-setup**.

### 12.9 Records / analytics
- Compare **up to 3** batches; **insights + recommendations** (not just tables).
- Metrics: FCR, weight, mortality, ROI (masked).
- **Historical snapshot** on batch completion.
- Export **PDF/CSV** respecting privacy.
- Performance thresholds (green/yellow/red mortality bands on charts).

### 12.10 Dashboard notifications & charts
- **Notifications** endpoint / surface (not only static tasks).
- Chart tabs: Overview donut, Expenses bars, Production (eggs 7d), Performance (mortality by batch).
- Tasks today vs active batches vs masked money — exact four quick-stat contract.

### 12.11 Settings beyond “tabs exist”
- Languages: **en / tw / yo / ha** (Twi, Yoruba, Hausa).
- Currencies: **GHS / NGN / USD**.
- Notifications prefs: health, low stock, withdrawal.
- **Backup schedule**, retention (completed 2y / archived 5y).
- **Export / import / restore** farm data.
- Market prices feed **break-even and sales estimates**, not a decorative widget.

### 12.12 Mobile & a11y (full ticket)
- Breakpoints: &lt;768 bottom nav + drawer; 768–1024 collapsed sidebar; &gt;1024 full.
- ARIA, keyboard (Tab/Enter/Escape), focus traps, live regions, skip-to-content.
- **Offline mode explicitly out of scope** in mobile ticket (“future”) — conflicts with later offline marketing.

### 12.13 Phase-2 services & expanded surface
Beyond Phase-1 “10 services,” research also names:
- **OrchestrationEngine**, **FeedWorkflowCoordinator**, **WeeklyAdvisor**
- Egg: production, sales, inventory, **alerts**, **analytics** services
- **ManualFeedConsumptionService** (flexible path)
- **RevenueService**, **RecordsService**, **SettingsService**, **DashboardService**
- Master claims **~20 services**, **114 API endpoints**, **14 pages** including customers/suppliers

### 12.14 FSM detail missed
- **emergency_terminate** from almost every non-terminal state (including withdrawal).
- Normal terminate only from **ready_to_sell** (after withdrawal complete).
- Week thresholds differ by species (broiler grower W5 vs layer W7, etc.).
- Job ticket says check withdrawal **daily 8am**; backend spec also says **every 4h** — still conflict.

### 12.15 Testing / QA contract (T16)
- Integration tests: create→tasks, feed→expense+stock, health→expense+stock, week→FSM, egg sale→revenue.
- E2E **8 journeys** (not 11).
- Perf: API &lt;200ms, page &lt;2s; load **100 concurrent users**.
- OWASP Top 10 audit; Swagger/OpenAPI; CI/CD GitHub Actions.
- Unit coverage **80%+**.

### 12.16 UI engineering contract
- **`data-element-id`** on interactive elements (test hooks) — everywhere in wireframes.
- FarmVista: Manrope, `#16A34A`, rounded-full inputs, StatCard/StatusBadge patterns.
- Canonical UI reference: **welcome page** “DO NOT DEVIATE.”
- Full HTML/CSS wireframes embedded in specs (production-looking, not sketch-only).

### 12.17 Historical “implementation status” docs (noise vs design)
- **Complete_Project_Analysis** and Master Architecture claim **87% complete**, 114 endpoints, 52 models — this describes a **prior Python monorepo ambition / claimed build**, not the current Vite+Supabase tree.
- **Pre-T6** and **Critical Onboarding** claim ~40% and blocked setup — **contradicts** the 87% claim.
- Treat these as **process archaeology**, not product rules — but they list **concrete missing pieces** (handlers unregistered, mock dashboard, conflict matrix incomplete, 8 tables missing) that still map to today’s gaps.

### 12.18 Navigation IA (exact 9 items)
Research nav: Dashboard, Batches, Feed, Water-Health, Eggs, Finance, Stock, Records, Settings.  
Current app renames (Flocks, Care & Water, Harvest, Ledger, Inventory, Performance) — fine UX, but research IA should be mapped 1:1 for audit checklists.

### 12.19 Dual traditional-remedy lists
Water-Health table vs config ticket **both say 7** remedies but **different names** (Moringa/Ginger/Charcoal vs Aloe/Papaya/Oregano). Must reconcile before seeding “traditional.”

### 12.20 Cost estimates (GHS) in protocols
Species protocol docs include **per-flock cost estimates** (e.g. broiler 100 birds GHS 185–260 health; layer rearing 370–520). Research expects finance/advisor context — not shipped as static MarketTrends fake % moves.

---

## 13. Honest coverage score after re-read

| Area | First pass | After gap fill |
|------|------------|----------------|
| Dual pattern + events | Strong | Strong |
| Species day protocols | Strong | Strong |
| Feed LP + 41 ingredients | Medium | Stronger (planning, shortfall, reservation) |
| Water dosing + conflicts | Medium | Stronger (heat, regional, emergency, units) |
| Auth / roles / tokens | Weak | Captured |
| Day-old / checkpoints | Weak | Captured |
| Stock transfer/suppliers | Weak | Captured |
| Records insights/FCR | Weak | Captured |
| Settings i18n/backup | Weak | Captured |
| Mobile/a11y | Weak | Captured |
| Phase-2 services / 114 APIs | Weak | Captured (as research scope) |
| Testing T16 gates | Weak | Captured |
| Status-doc contradictions | Weak | Captured |

**Still not a line-by-line dump of every wireframe HTML block** — those live in the source specs. For implementation, pull the module spec when building that screen.

---

*This digest is a map of the research folder, not a replacement for the source files when implementing a protocol day-by-day.*
