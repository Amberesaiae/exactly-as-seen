# BC-1c — Migration 6: New Reference Tables + RLS

## Overview

Creates 8 new reference and operational tables with full RLS policies. These tables are required by BC-2 (medications, container_types), BC-3 (ingredients, nutritional_requirements), BC-4 (stock_lots, stock_allocations, config_overrides), and BC-8 (idempotency_keys).

**Sprint:** Sprint 1 (runs after BC-1a, in parallel with BC-1b).

**Spec reference:** spec:e4556d74-53bc-432d-b750-3db37d529bab/f907ab32-46cf-48cf-a173-d28f90d1c466 — BC-1 Migration 6 section.

## Scope

### Migration 6 — New tables

New SQL file in file:supabase/migrations/. All tables use `CREATE TABLE IF NOT EXISTS`.

| Table | Key columns | RLS |
| --- | --- | --- |
| `medications` | `id TEXT PK`, `name`, `category`, `delivery_method`, `dose_per_gallon`, `withdrawal_meat_days`, `withdrawal_egg_days`, `is_live_vaccine BOOLEAN`, `is_sulfa BOOLEAN`, `contains_calcium BOOLEAN`, `is_tetracycline BOOLEAN`, `is_activated_charcoal BOOLEAN` | SELECT only (reference data) |
| `container_types` | `id TEXT PK`, `name`, `volume_l NUMERIC`, `volume_gal NUMERIC` | SELECT only |
| `ingredients` | `id TEXT PK`, `name`, `category`, `protein_pct`, `energy_kcal_per_kg`, `calcium_pct`, `phosphorus_pct`, `lysine_pct`, `methionine_pct`, `contains_gossypol BOOLEAN`, `contains_aflatoxin_risk BOOLEAN`, `max_share_pct NUMERIC` | SELECT only |
| `nutritional_requirements` | `species`, `duck_type`, `phase`, `protein_min`, `energy_min`, `energy_max`, `calcium_min`, `calcium_max`, `phosphorus_min`, `lysine_min`, `methionine_min` — PK `(species, duck_type, phase)` | SELECT only |
| `config_overrides` | `id UUID PK`, `farm_id UUID FK`, `key TEXT`, `value TEXT`, `created_at` — UNIQUE `(farm_id, key)` | Full CRUD, farm-scoped |
| `idempotency_keys` | `id UUID PK`, `farm_id UUID FK`, `key TEXT UNIQUE`, `expires_at TIMESTAMPTZ` | INSERT + SELECT, farm-scoped |
| `stock_lots` | `id UUID PK`, `farm_id UUID FK`, `stock_item_id UUID FK`, `qty_on_hand NUMERIC`, `quality_grade TEXT`, `expiry_date DATE`, `received_at TIMESTAMPTZ`, `unit_price_pesewas INTEGER` | Full CRUD, farm-scoped |
| `stock_allocations` | `id UUID PK`, `farm_id UUID FK`, `lot_id UUID FK`, `qty_allocated NUMERIC`, `batch_id UUID FK`, `reason TEXT`, `source_ref TEXT`, `allocated_at TIMESTAMPTZ` | Full CRUD, farm-scoped |

## Acceptance Criteria

1. All 8 tables created with `IF NOT EXISTS`
2. All tables have RLS enabled
3. Reference tables (`medications`, `container_types`, `ingredients`, `nutritional_requirements`) have SELECT-only policies
4. Operational tables have full CRUD policies scoped to `farm_id`
5. `config_overrides` UNIQUE constraint on `(farm_id, key)` enforced
6. `idempotency_keys.key` UNIQUE constraint enforced
7. `stock_lots` and `stock_allocations` have correct FK relationships

## Dependencies

BC-1a (Migration 4 must be applied first for FK references to `batches` and `stock_items`).