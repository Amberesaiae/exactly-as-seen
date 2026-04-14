
# LampFarms Phase 1: Auth + Farm Setup + Dashboard

## Overview
Build the foundation of LampFarms — authentication, farm onboarding wizard, and the main dashboard — as a React frontend with Supabase (Lovable Cloud) for auth and database, plus Dexie.js for offline-first local storage.

## Design System
- **Brand color**: Green (#16a34a) as primary, matching the spec's FarmVista design system
- **Font**: Manrope (Google Fonts)
- **Icons**: Lucide React (no emoji in UI)
- **Border radius**: Rounded (pill buttons, 12px cards)
- **Cost privacy**: Financial values masked with dots by default

---

## 1. Supabase Setup (Lovable Cloud)
- Enable email/password auth
- Create database tables via migrations:
  - `farms` (id, user_id, name, location_region, location_district, farm_type, setup_complete)
  - `houses` (id, farm_id, name, capacity)
  - `user_preferences` (id, user_id, cost_privacy_enabled, theme, currency)
  - `batches` (id, farm_id, house_id, name, species, production_system, status, initial_quantity, current_population, start_date, current_week, current_day, phase, notes)
  - `activity_log` (id, farm_id, batch_id, event_type, description, created_at)
- RLS policies: users can only access their own farm data

## 2. Auth Pages
- **Welcome/Landing page**: App name "LampFarms", tagline, Sign In and Create Account buttons
- **Registration**: Full name, email, password, farm name — creates Supabase auth user + farm record
- **Sign In**: Email + password, redirects to dashboard (or farm setup if incomplete)
- **Auth context/provider**: Session management, protected routes, auto-redirect logic

## 3. Farm Setup Wizard (3 steps, cannot be skipped)
- **Step 1 — Farm Details**: Farm name (pre-filled from registration), region/district dropdowns (Ghana regions), farm type (poultry, pre-selected)
- **Step 2 — Houses**: Add at least one house with name + capacity. Can add multiple. Validate unique names.
- **Step 3 — Preferences**: Currency (GHS default), cost privacy toggle (on by default), theme (light/dark)
- Progress bar across steps, back navigation, validation before advancing
- On finish: mark farm setup complete, redirect to dashboard

## 4. App Shell & Navigation
- **Desktop**: 240px sidebar with 9 nav items (Dashboard, Batches, Feed, Water-Health, Eggs, Finance, Stock, Records, Settings) + user avatar footer. Active state highlight with green left border.
- **Mobile**: Top header bar + bottom navigation (Home, Batches, Feed, Health, More). Responsive breakpoint at 768px.
- Placeholder pages for all nav items (just page title + "Coming soon")

## 5. Main Dashboard
- **Quick Stats**: 4 cards — Active Batches count, Tasks Today, Weekly Expenses (masked), Monthly Revenue (masked)
- **Cost privacy toggle**: Eye icon on financial cards; toggles show/hide, persists preference to Supabase
- **Active Batch Tiles**: Grid of cards showing species, batch name, week/day, population, phase, pending tasks, quick actions (View, Mortality)
- **Tab-based Charts section**: 4 tabs (Overview, Expenses, Production, Performance) with Recharts — initially showing empty states or sample data
- **Recent Activity panel**: Right sidebar on desktop showing last 10 events with timestamps
- **Empty state**: When no batches exist, show "Create Your First Batch" CTA prominently
- **Mobile layout**: 2x2 stat grid, stacked batch cards, chart section, no activity sidebar

## 6. Offline-First Foundation (Dexie.js)
- Install and configure Dexie.js with schema matching Supabase tables
- Create a sync service that:
  - Caches dashboard data locally on fetch
  - Serves from cache when offline
  - Shows sync status badge in header (online/offline/syncing)
- Write operations save to Dexie first, queue in outbox for sync
- Basic online/offline detection with visual indicator

## 7. Dependencies to Install
- `dexie` (IndexedDB wrapper)
- `recharts` (charts)
- `lucide-react` (icons — already likely available)
- `@fontsource/manrope` (font)
- `zustand` (client state for UI prefs, wizard drafts)
- `framer-motion` (micro-interactions/transitions)
