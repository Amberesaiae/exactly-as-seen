#3 - Phase 3 — Multi-Species + Egg Production
What & Why
Extend the platform to layer, duck (with meat / layer sub-types), and turkey species per spec §10 Phase 3, and add the Egg Production module. Apply species-protocol corrections from CONVENTIONS §2.1, §2.4–§2.10: layer egg production at Week 19+, layer cycle 72–78 (default 78), turkey 12–20 configurable (default 16), duck Step 1b sub-type, duck-layer eggs at Week 20+, broiler 5 vaccinations, duck niacin as a water-health task, Metronidazole for turkey blackhead.

Done looks like
Batch creation wizard supports all four species. Duck inserts Step 1b for sub-type per CONVENTIONS §2.6 / spec §3.4. Turkey shows the configurable cycle slider (12–20 wk, default 16); FSM phase thresholds scale linearly.
Layer batches automatically begin tracking egg production at Week 19; duck-layer at Week 20. Egg dashboard supports daily collection entry, inventory by size/quality grade, and sales (publishes EGG_SALE_RECORDED → revenue).
Duck batches auto-generate the niacin water task (1.5 tsp / gallon, daily through Week 4 then weekly) per 03_WATER_HEALTH.md §3.3.
Turkey batches auto-schedule Metronidazole blackhead prevention every 2 weeks per CONVENTIONS §2.10.
Semi-intensive / free-range production systems work for duck and turkey with the foraging modifier (12–30%) applied to feed quantities.
Frontend: species-specific batch detail views; Eggs page (currently 810-line monolith) rebuilt as composed components — Daily Collection, Inventory by Size/Quality, Sales — driven by the new endpoints. Semi-intensive feeding view added.
Out of scope
Records / analytics page (Phase 4).
Settings UI polish (Phase 4).
"Other" species support beyond the schema hooks already present (deferred unless explicitly requested).
Steps
Schema + seeds — add egg_productions, egg_inventory, egg_sales; seed species_protocols for layer/duck/turkey; add Metronidazole to medication seed; extend vaccination_protocols with full per-species schedules.
Batch FSM extension — parameterise phase thresholds by species + cycleWeeks + duckType; add Step 1b validation; layer/duck-layer transition into production phase at Week 19/20; turkey thresholds scale with cycle length.
Egg Production module — endpoints from spec §5; daily entry, inventory by size+quality, sales publishing EGG_SALE_RECORDED; analytics payload (§5.3) for the dashboard.
Water-Health species rules — duck niacin auto-generation on BATCH_CREATED for species=duck; turkey Metronidazole biweekly schedule; layer-specific vaccination schedule.
Feed species rules — layer/duck/turkey nutritional profiles per phase; foraging modifier for semi-intensive / free-range; species-specific safety preprocessor rules.
Frontend wizard — Step 1 enables all four species + production-system rules from spec §3.3; Step 1b for duck; turkey cycle slider; component breakdown matches step boundaries.
Frontend Eggs page — replace Eggs.tsx (810 lines) with composed parts: BatchPicker, ProductionHeader (rates / expected vs actual), CollectionDialog, SaleDialog, RecordsTable, SalesTable, WeeklySummary — preserving the existing visual language.
Frontend BatchDetail species views — conditional tabs/cards per species (eggs tab for layer + duck-layer, foraging notes for semi-intensive).
Verification — typecheck; create one batch of each species, walk lifecycle through to first lay (layer wk19, duck-layer wk20) using time-fast-forward; confirm niacin and Metronidazole tasks auto-generate; confirm EGG_SALE_RECORDED produces a revenue row.
Constraints
Every species rule comes from the protocol specs (12_PROTOCOL_LAYER, 13_PROTOCOL_DUCK, 14_PROTOCOL_TURKEY, 15_PROTOCOL_OTHER_SPECIES) and CONVENTIONS §2 — never invent values.
Egg production is a derived state of the batch FSM, not a parallel timeline.
Niacin is water-health, not feed (CONVENTIONS §2.9).
Relevant files
specs/05_EGG_PRODUCTION.md
specs/12_PROTOCOL_LAYER.md
specs/13_PROTOCOL_DUCK.md
specs/14_PROTOCOL_TURKEY.md
specs/15_PROTOCOL_OTHER_SPECIES.md
specs/02_BATCH_MANAGEMENT.md
specs/03_WATER_HEALTH.md
specs/04_FEED_CALCULATOR.md
specs/10_CORE_FLOWS.md
artifacts/lampfarms/src/pages/Eggs.tsx
artifacts/lampfarms/src/pages/BatchCreate.tsx
artifacts/lampfarms/src/pages/BatchDetail.tsx
artifacts/lampfarms/src/lib/batch-utils.ts
Dependencies

Phase 2 — Core Broiler Domain (health, feed, stock, finance)
Main
