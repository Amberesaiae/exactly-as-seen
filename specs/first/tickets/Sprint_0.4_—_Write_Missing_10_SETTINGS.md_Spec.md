# Sprint 0.4 — Write Missing 10_SETTINGS.md Spec

## Goal

Write the file:specs/10_SETTINGS.md spec that is referenced by file:specs/phases/phase4.md but does not exist. This spec must be complete before Phase 4 planning and implementation can proceed.

## Content to Cover

The spec must follow the universal structure from file:specs/00_CONVENTIONS.md §3 and cover:

### 1. Purpose & Scope

5-tab Settings UI. Backend module at `artifacts/api-server/src/modules/settings/`. Covers user preferences, farm configuration, houses CRUD, market price overrides (L3 config), species config viewer, data management.

### 2. Domain Model

- `UserPreferences` — currency (GHS/NGN), timezone, cost_privacy_enabled, cost_privacy_pin (hashed), theme
- `FarmSettings` — name, location_region, location_district, water_source_chlorinated (boolean), egg_low_inventory_crates threshold
- `MarketPriceOverride` — config_key, config_value, farm_id (L3 overrides per file:specs/01_MASTER_ARCHITECTURE.md §6)

### 3. 5-Tab Structure

| Tab | Content |
| --- | --- |
| Profile | User name, profile image (read-only from OIDC), no password change |
| Farm | Farm name, location, houses CRUD, water source chlorinated flag |
| Preferences | Currency (GHS/NGN only), timezone, cost-privacy toggle + PIN setup, theme |
| Market Prices | L3 runtime overrides for ingredient prices, feed prices; safety keys rejected |
| Data | Export all data (JSON/CSV), account deletion (with confirmation) |

### 4. API Endpoints

- `GET/PATCH /api/v1/settings/preferences`
- `GET/PATCH /api/v1/settings/farm`
- `GET/POST/PATCH/DELETE /api/v1/settings/houses`
- `GET/POST/DELETE /api/v1/settings/market-prices`
- `GET /api/v1/settings/species-config` (read-only viewer)
- `POST /api/v1/settings/export`
- `DELETE /api/v1/settings/account`

### 5. Business Rules

- Safety keys (medication doses, withdrawal periods) cannot be overridden via market prices — return `422 SAFETY_KEY_NOT_OVERRIDABLE`
- Currency change applies to all future display; historical records keep their stored pesewas value
- PIN is 4 digits, stored as bcrypt hash, gates `POST /finance/privacy/unmask`
- Account deletion is soft-delete with 30-day recovery window

### 6. Wireframes

Include wireframes for the 5-tab layout (desktop + mobile).

## Acceptance Criteria

 exists and follows the universal spec structureAll 5 tabs are fully specified with endpoints, Zod schemas, and business rulesWireframes included for desktop and mobile layoutsNo password change UI anywhere in the specCurrency options are GHS and NGN onlySafety-key protection rule is documented with error code