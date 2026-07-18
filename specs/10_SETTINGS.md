# 10 — Settings Module

**Status:** Active
**Phase:** 4
**Canonical stack:** TypeScript / Express 5 / Drizzle ORM / React 19 / shadcn/ui

---

## 1. Purpose & Scope

The Settings module provides a 5-tab UI for managing user preferences, farm configuration, houses, market price overrides, and data management. It is the single source of truth for all per-user and per-farm configuration that affects the rest of the platform.

Backend module: `artifacts/api-server/src/modules/settings/`
Frontend: `artifacts/lampfarms/src/pages/SettingsPage.tsx` + `src/components/settings/`

---

## 2. Domain Model

### `user_preferences` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | varchar FK → users | unique per user |
| currency | text | `GHS` or `NGN` only |
| timezone | text | IANA timezone string; falls back to farm timezone when null |
| cost_privacy_enabled | boolean | default `true` |
| cost_privacy_pin | text | bcrypt/SHA-256 hash of 4-digit PIN; null = no PIN |
| theme | text | `light` or `dark` |

### `farms` table (relevant columns)

| Column | Type | Notes |
|--------|------|-------|
| name | text | Farm display name |
| location_region | text | |
| location_district | text | |
| timezone | text | Farm-level timezone (used when user has no override) |
| currency | text | Farm-level currency default |
| water_source_chlorinated | boolean | Affects Water-Health C8 conflict |
| egg_low_inventory_crates | integer | Threshold for EGG_INVENTORY_LOW alert |

### `houses` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| farm_id | uuid FK | |
| name | text | Unique per farm |
| capacity | integer | Max birds |
| occupied_by_batch_id | uuid nullable | Set when a batch is assigned |

### `config_overrides` table (L3 runtime overrides)

| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| farm_id | text | |
| config_key | text | e.g. `ingredient.maize.price_per_kg_ghs` |
| config_value | jsonb | Override value |
| updated_at | timestamp | |

Unique constraint: `(farm_id, config_key)`.

---

## 3. 5-Tab Structure

| Tab | Route | Key content |
|-----|-------|-------------|
| **Profile** | `#profile` | User name (editable), email (read-only from OIDC), profile image (read-only), OIDC provider note — **no password change** |
| **Farm** | `#farm` | Farm name, location region/district, timezone, currency, water source chlorinated toggle, houses CRUD, egg low-inventory threshold |
| **Preferences** | `#prefs` | Currency (GHS/NGN only), timezone override, cost-privacy toggle + PIN setup, theme |
| **Market Prices** | `#prices` | L3 runtime overrides for ingredient prices, feed prices; safety keys rejected with `422 SAFETY_KEY_NOT_OVERRIDABLE` |
| **Data** | `#data` | Export all data (JSON/CSV), account deletion with 30-day recovery window |

---

## 4. API Endpoints

All endpoints are mounted at `/api/v1/settings` and require authentication.

### Profile

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/profile` | Get user profile (name, email, profileImageUrl) |
| `PATCH` | `/profile` | Update firstName, lastName |

### Farm

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/farm` | Get farm settings |
| `PATCH` | `/farm` | Update name, location, timezone, currency, waterSourceChlorinated |

### Houses

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/houses` | List all houses with activeBatchId |
| `POST` | `/houses` | Create house (name, capacity) |
| `PATCH` | `/houses/:id` | Update name or capacity |
| `DELETE` | `/houses/:id` | Delete house (blocked if occupied) |

### Preferences

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/preferences` | Get user preferences |
| `PATCH` | `/preferences` | Update currency, timezone, costPrivacyEnabled, theme |
| `POST` | `/preferences/pin` | Set or change 4-digit cost-privacy PIN |
| `DELETE` | `/preferences/pin` | Remove PIN (requires current PIN) |

### Market Prices

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/market-prices` | List all L3 overrides for this farm |
| `POST` | `/market-prices` | Upsert override (configKey, configValue) |
| `DELETE` | `/market-prices/:configKey` | Remove override |

### Species Config (read-only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/species-config` | Read-only viewer of seeded species protocols |

### Data

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/export` | Trigger data export (format: json or csv) |
| `DELETE` | `/account` | Initiate soft-deletion (confirmPhrase: "DELETE MY ACCOUNT") |
| `DELETE` | `/account/cancel` | Cancel pending deletion within recovery window |

---

## 5. Zod Schemas

```typescript
// PATCH /preferences
const UpdatePrefsBody = z.object({
  costPrivacyEnabled: z.boolean().optional(),
  theme: z.enum(["light", "dark"]).optional(),
  currency: z.enum(["GHS", "NGN"]).optional(),   // R-S-1: only GHS and NGN
  timezone: z.string().min(1).optional(),
});

// POST /preferences/pin
const SetPinBody = z.object({
  pin: z.string().regex(/^\d{4}$/),
  currentPin: z.string().regex(/^\d{4}$/).optional(),
});

// POST /houses
const CreateHouseBody = z.object({
  name: z.string().min(1).max(100),
  capacity: z.number().int().min(1),
});

// POST /market-prices
const UpsertMarketPriceBody = z.object({
  configKey: z.string().min(1),
  configValue: z.unknown(),
});

// DELETE /account
const DeleteAccountBody = z.object({
  confirmPhrase: z.literal("DELETE MY ACCOUNT"),
});
```

---

## 6. Business Rules

| Code | Rule |
|------|------|
| **R-S-1** | Currency must be `GHS` or `NGN`. Any other value → `400 VALIDATION_FAILED`. |
| **R-S-2** | No password change UI. Password management is handled by the OIDC provider. |
| **R-S-3** | Cost-privacy PIN is 4 digits, stored as a hash (SHA-256 or bcrypt). Gates `POST /finance/privacy/unmask`. |
| **R-S-4** | PIN change requires the current PIN if one is already set. Wrong PIN → `422 PIN_INCORRECT`. |
| **R-S-5** | Safety keys (prefixes: `medication.`, `withdrawal.`, `vaccination.`, `container_volume.`, `dose.`) cannot be overridden via market prices → `422 SAFETY_KEY_NOT_OVERRIDABLE`. |
| **R-S-6** | House delete is blocked when `occupied_by_batch_id` references a non-terminated batch → `409 HOUSE_OCCUPIED`. |
| **R-S-7** | House capacity reduce is blocked when the new capacity is below the active batch's current population → `409 HOUSE_OCCUPIED`. |
| **R-S-8** | Account deletion is soft-delete: sets `users.deleted_at` and `users.recovery_window_ends_at = now() + 30 days`. A daily pg-boss job hard-deletes accounts past their recovery window. |
| **R-S-9** | Currency change applies to all future display. Historical records keep their stored pesewas value. |
| **R-S-10** | Timezone change on the farm record re-registers pg-boss scheduled jobs for that farm. |

---

## 7. 3-Tier Config System

Per `specs/01_MASTER_ARCHITECTURE.md §6`:

| Tier | Source | Mutability |
|------|--------|------------|
| L1 | Compiled defaults (code) | Immutable |
| L2 | Seeded DB rows (species_config, ingredients, medications) | Immutable at runtime |
| L3 | `config_overrides` table | Mutable via Settings → Market Prices |

Safety keys (L1/L2 values that affect drug safety) are always read from L1/L2 and cannot be overridden at L3.

---

## 8. Cost-Privacy PIN Flow

```
POST /preferences/pin { pin: "1234" }
  → hash(pin) stored in user_preferences.cost_privacy_pin
  → 200 { pinConfigured: true }

POST /finance/privacy/unmask { pin: "1234", ttlSeconds: 300 }
  → verify hash(pin) === stored hash
  → grantUnmask(req, 300)  // sets req.session.unmaskedUntil
  → INSERT unmask_events audit row
  → 200 { unmaskedUntil: "2026-05-10T12:05:00Z" }
```

---

## 9. Wireframes

### Desktop — 5-tab layout

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                    │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Profile  │   Farm   │  Prefs   │  Prices  │   Data   │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│                                                              │
│  [Tab content — max-w-2xl, single column]                   │
│                                                              │
│  Profile tab:                                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 👤 [Avatar]  Dev User                               │    │
│  │    dev@lampfarms.local  (read-only)                 │    │
│  │    First name: [___________]                        │    │
│  │    Last name:  [___________]                        │    │
│  │    ℹ Password management is handled by your         │    │
│  │      sign-in provider.                              │    │
│  │                              [Save Changes]         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Mobile — same 5 tabs, compact labels

```
┌──────────────────────────────────┐
│  Settings                        │
│  ┌────┬────┬─────┬──────┬──────┐ │
│  │Prof│Farm│Prefs│Price │Data  │ │
│  └────┴────┴─────┴──────┴──────┘ │
│                                  │
│  [Tab content — full width]      │
└──────────────────────────────────┘
```

### Farm tab

```
┌─────────────────────────────────────────────────────┐
│ Farm Settings                                        │
│                                                      │
│ Farm name:        [Dev Farm              ]           │
│ Region:           [Greater Accra         ]           │
│ District:         [Accra Metropolitan    ]           │
│ Timezone:         [Africa/Accra ▼        ]           │
│ Currency:         [GHS ▼                 ]           │
│ Water source:     [☑ Chlorinated water   ]           │
│ Egg low alert:    [5 crates              ]           │
│                                                      │
│ Houses                                               │
│ ┌──────────────────────────────────────────────┐    │
│ │ House A  Cap: 500  [Active batch]  [Edit][✕] │    │
│ │ House B  Cap: 300  [Empty]         [Edit][✕] │    │
│ └──────────────────────────────────────────────┘    │
│ [+ Add House]                                        │
│                                                      │
│                              [Save Changes]          │
└─────────────────────────────────────────────────────┘
```

### Preferences tab

```
┌─────────────────────────────────────────────────────┐
│ Preferences                                          │
│                                                      │
│ Currency:    [₵ GHS — Ghana Cedi ▼]                  │
│              (GHS and NGN only)                      │
│                                                      │
│ Timezone:    [Africa/Accra ▼]                        │
│                                                      │
│ Theme:       [○ Light  ● Dark]                       │
│                                                      │
│ Cost Privacy                                         │
│ ┌──────────────────────────────────────────────┐    │
│ │ [☑] Hide financial values by default         │    │
│ │                                              │    │
│ │ PIN protection (optional)                    │    │
│ │ [Set PIN]  ← 4-digit PIN gates unmask        │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│                              [Save Changes]          │
└─────────────────────────────────────────────────────┘
```

### Market Prices tab

```
┌─────────────────────────────────────────────────────┐
│ Market Price Overrides                               │
│ Override ingredient and feed prices for your farm.  │
│ Safety keys (medication doses, withdrawal periods)  │
│ cannot be overridden.                               │
│                                                      │
│ ┌──────────────────────────────────────────────┐    │
│ │ ingredient.maize.price_per_kg_ghs  →  3.80   │[✕]│
│ │ ingredient.soybean_meal.price_per_kg_ghs → 6.5│[✕]│
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ Add override:                                        │
│ Key: [________________________]                      │
│ Value: [_______________________]                     │
│ [Add Override]                                       │
└─────────────────────────────────────────────────────┘
```

### Data tab

```
┌─────────────────────────────────────────────────────┐
│ Data Management                                      │
│                                                      │
│ Export your data                                     │
│ [Export as JSON]  [Export as CSV]                    │
│                                                      │
│ ─────────────────────────────────────────────────   │
│                                                      │
│ Delete Account                                       │
│ This will schedule your account for deletion.        │
│ You have 30 days to cancel before data is removed.  │
│                                                      │
│ Type "DELETE MY ACCOUNT" to confirm:                 │
│ [________________________________]                   │
│ [Delete My Account]                                  │
└─────────────────────────────────────────────────────┘
```

---

## 10. Background Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `account-purge` | `0 2 * * *` UTC | Hard-deletes users where `deleted_at IS NOT NULL AND recovery_window_ends_at < NOW()`. Deletes in dependency order: preferences → memberships → farms → user. |

---

## 11. Error Codes

| Code | HTTP | Trigger |
|------|------|---------|
| `VALIDATION_FAILED` | 400 | Invalid currency (not GHS/NGN), invalid timezone, etc. |
| `HOUSE_NOT_FOUND` | 404 | House ID not found for this farm |
| `HOUSE_NAME_TAKEN` | 409 | Duplicate house name within farm |
| `HOUSE_OCCUPIED` | 409 | Delete/capacity-reduce blocked by active batch |
| `PIN_INCORRECT` | 422 | Wrong current PIN on change or delete |
| `SAFETY_KEY_NOT_OVERRIDABLE` | 422 | Attempt to override a safety key via market prices |
| `NO_PENDING_DELETION` | 409 | Cancel deletion when no deletion is pending |
