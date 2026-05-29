# Settings System (Theme + Market Prices + Species Config)

## Overview

Implement Settings system with 5-tab interface for user preferences, market prices, species configuration, system settings, and data management.

## Scope

**In Scope:**
- Implement Settings API endpoints (15 endpoints)
- Build settings dashboard (5 tabs: Preferences, Market Prices, Species Config, System Settings, Data Management)
- Build user preferences UI (theme, cost privacy, language, currency, notifications)
- Change toggle label from "Performance Tracking" to "Advanced Performance Tracking (Weight & FCR)"
- Add note: "Basic metrics (mortality, population, costs) are always tracked"
- Update UserPreferences model field: performance_tracking_enabled → advanced_performance_tracking_enabled
- Build market prices management UI (bird sales by species/weight, egg prices by size)
- Build species configuration viewer (read-only with database override capability)
- Build data management UI (export, backup, restore)
- Implement preference propagation to all systems
- Implement market price updates to revenue calculations
- Implement species configuration overrides (database > JSON)

**Out of Scope:**
- Advanced backup strategies (Phase 4)
- Multi-user preferences (Phase 4)

## Spec References

- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/e432a732-63cf-41ff-b091-d890b4bf8820 (Settings System)

## Settings Tabs

**1. Preferences Tab:**
- Theme (light/dark/system)
- Cost privacy toggle
- Language (English, French)
- Currency (GHS, NGN, USD)
- Date format
- Notifications (email, push)

**2. Market Prices Tab:**
- Bird sales prices (4 species × weight ranges)
- Egg prices (4 sizes: Large, Medium, Small, Duck)
- Update frequency tracking

**3. Species Config Tab:**
- Read-only view of species.json and species_protocols.json
- Database override capability (edit button → override form)
- Reset to defaults option

**4. System Settings Tab:**
- Farm details (name, location, contact)
- Backup schedule (daily, weekly, monthly)
- Data retention policy

**5. Data Management Tab:**
- Export all data (JSON, CSV)
- Import data
- Backup now
- Restore from backup

## Acceptance Criteria

- [ ] Settings dashboard displays all 5 tabs
- [ ] User preferences save and propagate to all systems
- [ ] Cost privacy toggle affects 6 systems (Dashboard, Finance, Feed, Stock, Egg, Records)
- [ ] Market prices update revenue calculations
- [ ] Species configuration viewer displays protocols
- [ ] Database overrides work (override species.json values)
- [ ] Data export/import working (JSON, CSV)
- [ ] Backup/restore working
- [ ] Theme changes apply to all pages
- [ ] Toggle labeled "Advanced Performance Tracking (Weight & FCR)"
- [ ] Note displayed: "Basic metrics (mortality, population, costs) are always tracked"
- [ ] UserPreferences.advanced_performance_tracking_enabled field working
- [ ] Preference propagates to Records, Batch Details, Dashboard

## Dependencies

- **Ticket 1:** UserPreferences, MarketPrices, SystemSettings models
- **Ticket 2:** ConfigService for species configuration
- **Ticket 8:** Finance for market price integration

## Estimated Effort

**4 days**
