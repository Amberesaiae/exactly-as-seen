#4 - Phase 4 — Records, Settings, Polish
What & Why
Close out the v1 surface from spec §10 Phase 4: full Records analytics, full Settings UI (5 tabs), mobile/PWA polish, and ops hardening. With this phase the platform is feature-complete against the spec.

Done looks like
Records page delivers the 4-tab analytics layout from 08_RECORDS.md: per-batch history, batch comparison (≤3), financial summary, exports. PDF + CSV exports work.
Settings page (currently a 980-line monolith) is rebuilt as five tabs per 10_SETTINGS.md: Preferences, Market Prices (L3 runtime overrides), Species Config, System, Data. Safety-critical keys reject overrides with 422 SAFETY_KEY_NOT_OVERRIDABLE.
Cost-privacy toggle, currency, timezone, and notification preferences round-trip through user_preferences and farm columns.
PWA install banner appears on supported browsers; service worker (Workbox injectManifest) precaches the shell and routes the API offline-cache strategy.
Mobile bottom nav for the primary five routes (Dashboard, Batches, Health, Eggs, Finance); WCAG 2.1 AA pass on every primary page.
Ops: rate limiting on auth + write endpoints; CORS hardened to known origins; daily DB backup configured; /healthz /readyz /metrics already in place from Phase 1; uptime check verified.
Out of scope
Push notifications (deferred per CONVENTIONS §7).
Vet portal, marketplace, AI/ML predictions (out per CONVENTIONS §7).
Native mobile apps (PWA only in v1).
Steps
Records module — endpoints + queries for per-batch history, comparison (≤3), and financial summary; PDF generator (server-side) and CSV stream.
Records page — replace Records.tsx (321 lines) with the 4-tab layout; chart components reuse the existing visual language.
Settings module — endpoints for preferences, market prices, runtime config overrides, species config, data export/delete; reject safety-key overrides.
Settings page — replace SettingsPage.tsx (980 lines) with five tabs as composed components: ProfileTab, FarmTab, HousesTab, PreferencesTab, MarketPricesTab, SpeciesConfigTab, SystemTab, DataTab — each under ~250 lines. Keep the existing visual rhythm.
PWA polish — install banner, Workbox service worker, offline routing for known views, sync-on-reconnect surface.
Mobile nav + a11y — bottom nav for the five primary routes, keyboard nav across all dialogs/menus, ARIA labels, focus management, contrast audit.
Ops — rate limiter (auth + write), CORS allowlist, daily backup task, uptime check; surface outbox_pending_total and DLQ count on a small admin panel.
Verification — typecheck; full WCAG audit; export a real batch as PDF + CSV; verify PWA installs on Chrome desktop + mobile; rate limiter rejects abusive traffic; safety-key override returns documented error.
Constraints
Records computes via SQL CTEs / read-model views, never client-side aggregation across full datasets.
Settings honours the 3-tier config rules (L1 immutable, L2 editable per-farm via L3, safety keys never overridable).
Visual language stays LampFarms — Manrope, condensed display type, plain-black numbers with colored bars; no design drift in the new Settings/Records pages.
Relevant files
specs/08_RECORDS.md
specs/09_MAIN_DASHBOARD.md
specs/01_MASTER_ARCHITECTURE.md
artifacts/lampfarms/src/pages/Records.tsx
artifacts/lampfarms/src/pages/SettingsPage.tsx
artifacts/lampfarms/src/pages/Dashboard.tsx
artifacts/lampfarms/src/components/AppSidebar.tsx
artifacts/lampfarms/src/components/MobileNav.tsx
artifacts/lampfarms/src/components/AppLayout.tsx
artifacts/lampfarms/vite.config.ts
artifacts/lampfarms/index.html
