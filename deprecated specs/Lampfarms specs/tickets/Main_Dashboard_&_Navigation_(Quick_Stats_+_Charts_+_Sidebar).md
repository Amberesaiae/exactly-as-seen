# Main Dashboard & Navigation (Quick Stats + Charts + Sidebar)

## Overview

Implement main dashboard with quick stats, active batch tiles, tab-based charts, recent activity feed, and complete navigation system (sidebar + mobile bottom nav).

## Scope

**In Scope:**
- Build main dashboard page:
  - Quick stats (active batches, tasks today, weekly expenses, monthly revenue)
  - Active batch tiles (compact cards with quick actions)
  - Tab-based charts (Overview, Expenses, Production, Performance)
  - Recent activity feed (latest 5 activities)
- Build sidebar navigation (9 menu items, collapsible, icon mode)
- Build mobile bottom navigation (5 items)
- Implement cost privacy on dashboard (weekly expenses, monthly revenue masked)
- Implement DashboardService (data aggregation from all systems)
- Integrate with all systems (batch, feed, health, finance, stock, egg)

**Performance Analytics (Hybrid Approach):**
- Implement conditional display for Performance chart tab
- Show FCR/weight trends if UserPreferences.advanced_performance_tracking_enabled
- Show mortality/population/feed trends if disabled
- Show enable prompt if disabled

**Out of Scope:**
- Advanced charts (Phase 3)
- Dashboard customization (Phase 3)

## Spec References

- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/8af1669c-fe26-4bb7-8b9d-59d4c7bf6621 (Main Dashboard)
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/9f7277e2-0a52-48a9-bfcf-d6142dad1259 (Navigation System)

## Dashboard Layout

**Quick Stats (4 cards):**
1. Active Batches (count + trend)
2. Tasks Today (count + urgent indicator)
3. Weekly Expenses (amount + trend, cost privacy applied)
4. Monthly Revenue (amount + trend, cost privacy applied)

**Active Batch Tiles:**
- Batch name, species icon, week/phase
- Population (current/initial)
- Quick actions (View Details, Record Mortality, Advance Week)

**Tab-Based Charts:**
- Overview: Batch status distribution (donut chart)
- Expenses: Weekly expense breakdown (bar chart, cost privacy applied)
- Production: Egg production trends (line chart)
- Performance: Mortality rates by batch (bar chart)

**Recent Activity Feed:**
- Latest 5 activities (feed_calculated, medication_completed, vaccination_completed, egg_sale_recorded, mortality_recorded, week_advanced, batch_created, batch_terminated)
- Relative time display (2 hours ago, 1 day ago)

## Navigation System

**Sidebar (Desktop):**
- Dashboard, Batches, Feed Calculator, Water & Health, Egg Production, Finance, Stock, Records, Settings
- Collapsible to icon mode
- Active state highlighting (green background + border)

**Bottom Nav (Mobile):**
- Dashboard, Batches, Feed, Health, More
- Fixed bottom position
- Active state highlighting

## Acceptance Criteria

- [ ] Dashboard displays quick stats from all systems
- [ ] Active batch tiles show batch summaries with quick actions
- [ ] Tab-based charts display data correctly
- [ ] Recent activity feed shows latest 5 activities
- [ ] Sidebar navigation works (desktop + collapsible)
- [ ] Mobile bottom navigation works (<768px)
- [ ] Cost privacy applied to weekly expenses and monthly revenue
- [ ] Eye icon temporary reveal (30 seconds)
- [ ] DashboardService aggregates data from all systems
- [ ] Navigation active state highlighting working
- [ ] Performance chart shows FCR/weight trends when advanced tracking enabled
- [ ] Performance chart shows mortality/population trends when advanced tracking disabled
- [ ] Enable prompt links to Settings page

## Dependencies

- **Ticket 5:** Batch data
- **Ticket 6:** Feed data
- **Ticket 7:** Health data
- **Ticket 8:** Finance data
- **Ticket 9:** Stock data

## Estimated Effort

**4 days**
