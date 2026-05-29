# Records System (Historical Data + Batch Comparison)

## Overview

Implement Records system with 4-tab interface for historical batch data, performance analytics, financial records, and batch comparison (up to 3 batches side-by-side).

## Scope

**In Scope:**
- Implement Records API endpoints (8 endpoints)
- Build records dashboard (4 tabs: Batch Overview, Performance History, Financial Records, Batch Compare)
- Build batch comparison (up to 3 batches side-by-side with insights)
- Implement insights generation algorithm (best performer, gaps, improvements)
- Implement export functionality (PDF, CSV with cost privacy)
- Implement automatic record creation (BATCH_TERMINATED event)
- Implement performance trends calculation
- Implement week-by-week progression display

**Out of Scope:**
- Advanced analytics (Phase 4)
- Predictive insights (Phase 4)

## Spec References

- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/d91a5a67-17b1-4b07-a2dc-4affaca2b7f0 (Records System)
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/f8459c0d-edda-4273-a388-05dc54be731b (Core Flows - Records Journey)

## Batch Comparison

**Comparison Dimensions:**
- Mortality rate (lower is better)
- Feed efficiency (FCR - lower is better)
- Cost per bird (lower is better)
- Revenue per bird (higher is better)
- Profit per bird (higher is better)
- ROI percentage (higher is better)

**Insights Generation:**
- Best performer identification
- Gap analysis (what could be improved)
- Recommendations (apply best practices from top performer)

## Acceptance Criteria

- [ ] Records dashboard displays all 4 tabs
- [ ] Batch Overview tab shows active and completed batches
- [ ] Performance History tab shows week-by-week progression
- [ ] Financial Records tab shows expenses and revenue (cost privacy applied)
- [ ] Batch Compare tab allows selecting up to 3 batches
- [ ] Insights generation provides recommendations
- [ ] Export respects cost privacy settings (PDF, CSV)
- [ ] Automatic record creation on batch termination
- [ ] Performance History tab shows full analysis when advanced tracking enabled
- [ ] Performance History tab shows basic metrics when advanced tracking disabled
- [ ] Enable prompt links to Settings page
- [ ] Batch comparison excludes FCR dimension when advanced tracking disabled
- [ ] Performance trends calculation working

## Dependencies

- **Ticket 1:** BatchRecord, BatchComparison models
- **Ticket 5:** Batch data
- **Ticket 6:** Feed data
- **Ticket 7:** Health data
- **Ticket 8:** Finance data
- **Ticket 11:** Egg production data (for layers/ducks)

## Estimated Effort

**5 days**
