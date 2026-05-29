# Records System - Production-Grade Specification (Historical Data & Analytics)

# Records System - Production-Grade Specification (Historical Data & Analytics)

**Epic:** epic:bceeaefd-5139-4801-8c12-de8a8b6faf8a  
**Status:** Production-Ready Specification  
**Last Updated:** January 2026  
**References:** file:priest/16-records-management-simple/, file:docs/priest new/specs/Records_System_-_Enhanced_Comprehensive_Specification.md

---

## Overview

The Records System provides comprehensive historical data access, batch comparison, performance analytics, and financial records for all completed and active batches. It serves as the **central information hub** for farmers to learn from past batches, compare performance, and make data-driven decisions for future batches.

### Core Philosophy

**Backend Intelligence, Frontend Simplicity:**
- Backend handles all analytics calculations (trends, comparisons, insights)
- Frontend displays clear, actionable insights with single-click access
- Historical data preserved for learning and regulatory compliance
- Cost privacy maintained throughout all financial displays

**Farmer-Centric Design:**
- Single-click access to complete batch information
- Unified information display (feed, health, expenses, performance in one view)
- Simple batch comparison interface (up to 3 batches side-by-side)
- Clear performance metrics with actionable recommendations
- Export capabilities for record-keeping and compliance

### Scope

**Key Features:**
1. **Batch Overview Tab** - All active and completed batches with quick access
2. **Performance History Tab** - Detailed performance tracking and analysis
3. **Financial Records Tab** - Complete expense/revenue history with cost privacy
4. **Batch Compare Tab** - Side-by-side comparison with insights
5. **Export Capabilities** - PDF and CSV export for all records
6. **Insights Engine** - Automatic recommendations based on historical data

---

## Section 1: Records Dashboard - Tab-Based Interface

### Purpose
4-tab interface for viewing historical records, analyzing performance, tracking finances, and comparing batches.

### ASCII Flow Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                     RECORDS DASHBOARD                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  TABS: [Batch Overview] [Performance] [Financial] [Compare]│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  FILTERS: [All Species ▼] [All Status ▼] [Date Range]      │ │
│  │  [Export Records] button                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  SUMMARY CARDS (4 cards)                                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │ │
│  │  │  Total   │ │ Active   │ │Completed │ │ Avg ROI  │      │ │
│  │  │ Batches  │ │ Batches  │ │ Batches  │ │ ●●●●%    │      │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  BATCH CARDS (Expandable)                                   │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │ B2024-001 - Broiler (Completed)                     │   │ │
│  │  │ 500→485 birds • 2.1kg avg • FCR 2.1 • ROI ●●●●%   │   │ │
│  │  │ [📊 Details] [📈 Performance] [💰 Finances]        │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Wireframe: Records Dashboard - Batch Overview Tab

```wireframe
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Records Dashboard - Batch Overview</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; padding: 20px; }
  .container { max-width: 1200px; margin: 0 auto; }
  .header { margin-bottom: 24px; }
  .header h1 { font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
  .header p { font-size: 14px; color: #666; }
  
  /* Tabs */
  .tabs { background: white; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 24px; overflow: hidden; }
  .tab-list { display: flex; border-bottom: 1px solid #e5e7eb; padding: 0 20px; }
  .tab-button { background: none; border: none; padding: 16px 20px; font-size: 14px; font-weight: 500; color: #666; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
  .tab-button.active { color: #16a34a; border-bottom-color: #16a34a; }
  .tab-button:hover { color: #16a34a; }
  
  /* Filters */
  .filters { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
  .filter-select { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; cursor: pointer; font-family: 'Manrope', sans-serif; }
  .btn-primary { background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 9999px; font-size: 14px; font-weight: 500; cursor: pointer; margin-left: auto; transition: background 0.2s; }
  .btn-primary:hover { background: #15803d; }
  
  /* Summary Cards */
  .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .summary-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
  .summary-card-title { font-size: 14px; color: #666; font-weight: 500; margin-bottom: 12px; }
  .summary-card-value { font-size: 32px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
  .summary-card-change { font-size: 13px; color: #666; }
  
  /* Batch Cards */
  .batch-cards { display: flex; flex-direction: column; gap: 16px; }
  .batch-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; transition: box-shadow 0.2s; }
  .batch-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  .batch-card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; }
  .batch-card-title { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
  .batch-card-meta { font-size: 13px; color: #666; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
  .badge-completed { background: #dcfce7; color: #166534; }
  .badge-active { background: #dbeafe; color: #1e40af; }
  .badge-terminated { background: #fef2f2; color: #dc2626; }
  
  .batch-card-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px; }
  .metric { }
  .metric-label { font-size: 12px; color: #666; margin-bottom: 4px; }
  .metric-value { font-size: 16px; font-weight: 600; color: #1a1a1a; }
  
  .batch-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .btn-small { background: none; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; color: #374151; transition: all 0.2s; font-family: 'Manrope', sans-serif; }
  .btn-small:hover { border-color: #16a34a; color: #16a34a; }
  
  .section-title { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; margin-top: 32px; }
  
  @media (max-width: 768px) {
    .filters { flex-direction: column; align-items: stretch; }
    .btn-primary { margin-left: 0; width: 100%; }
    .summary-cards { grid-template-columns: 1fr; }
    .batch-card-metrics { grid-template-columns: 1fr 1fr; }
    .batch-card-actions { flex-direction: column; }
    .btn-small { width: 100%; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Records</h1>
    <p>Historical batch data and performance analytics</p>
  </div>
  
  <!-- Tabs -->
  <div class="tabs">
    <div class="tab-list">
      <button class="tab-button active" data-element-id="tab-batch-overview">Batch Overview</button>
      <button class="tab-button" data-element-id="tab-performance">Performance History</button>
      <button class="tab-button" data-element-id="tab-financial">Financial Records</button>
      <button class="tab-button" data-element-id="tab-compare">Batch Compare</button>
    </div>
  </div>
  
  <!-- Filters -->
  <div class="filters">
    <select class="filter-select" data-element-id="filter-species">
      <option>All Species</option>
      <option>Broilers</option>
      <option>Layers</option>
      <option>Ducks</option>
      <option>Turkeys</option>
    </select>
    
    <select class="filter-select" data-element-id="filter-status">
      <option>All Status</option>
      <option>Active</option>
      <option>Completed</option>
      <option>Terminated</option>
    </select>
    
    <input type="date" class="filter-select" data-element-id="filter-date-start" placeholder="Start Date">
    <input type="date" class="filter-select" data-element-id="filter-date-end" placeholder="End Date">
    
    <button class="btn-primary" data-element-id="btn-export-records">Export Records</button>
  </div>
  
  <!-- Summary Cards -->
  <div class="summary-cards">
    <div class="summary-card">
      <div class="summary-card-title">Total Batches</div>
      <div class="summary-card-value">12</div>
      <div class="summary-card-change">Since farm creation</div>
    </div>
    
    <div class="summary-card">
      <div class="summary-card-title">Active Batches</div>
      <div class="summary-card-value">3</div>
      <div class="summary-card-change">Currently running</div>
    </div>
    
    <div class="summary-card">
      <div class="summary-card-title">Completed Batches</div>
      <div class="summary-card-value">9</div>
      <div class="summary-card-change">Successfully completed</div>
    </div>
    
    <div class="summary-card">
      <div class="summary-card-title">Average ROI</div>
      <div class="summary-card-value">●●●●%</div>
      <div class="summary-card-change">Across all batches</div>
    </div>
  </div>
  
  <!-- Active Batches Section -->
  <h2 class="section-title">Active Batches (3)</h2>
  <div class="batch-cards">
    <div class="batch-card">
      <div class="batch-card-header">
        <div>
          <div class="batch-card-title">B2024-003 - Broiler Batch</div>
          <div class="batch-card-meta">House A • Started Dec 1, 2024 • Week 4/8</div>
        </div>
        <span class="badge badge-active">Active</span>
      </div>
      
      <div class="batch-card-metrics">
        <div class="metric">
          <div class="metric-label">Current Population</div>
          <div class="metric-value">485 birds</div>
        </div>
        <div class="metric">
          <div class="metric-label">Current Weight</div>
          <div class="metric-value">850g avg</div>
        </div>
        <div class="metric">
          <div class="metric-label">FCR</div>
          <div class="metric-value">1.8</div>
        </div>
        <div class="metric">
          <div class="metric-label">Mortality</div>
          <div class="metric-value">3%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Total Costs</div>
          <div class="metric-value">●●●●●</div>
        </div>
        <div class="metric">
          <div class="metric-label">Projected Profit</div>
          <div class="metric-value">●●●●●</div>
        </div>
      </div>
      
      <div class="batch-card-actions">
        <button class="btn-small" data-element-id="view-batch-details-3">📊 Full Details</button>
        <button class="btn-small" data-element-id="view-performance-3">📈 Performance</button>
        <button class="btn-small" data-element-id="view-finances-3">💰 Finances</button>
        <button class="btn-small" data-element-id="compare-batch-3">📋 Compare</button>
      </div>
    </div>
    
    <div class="batch-card">
      <div class="batch-card-header">
        <div>
          <div class="batch-card-title">L2024-012 - Layer Batch</div>
          <div class="batch-card-meta">House B • Started Jul 15, 2024 • Week 25/68</div>
        </div>
        <span class="badge badge-active">Active</span>
      </div>
      
      <div class="batch-card-metrics">
        <div class="metric">
          <div class="metric-label">Current Population</div>
          <div class="metric-value">280 birds</div>
        </div>
        <div class="metric">
          <div class="metric-label">Egg Production</div>
          <div class="metric-value">85%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Daily Eggs</div>
          <div class="metric-value">238 eggs</div>
        </div>
        <div class="metric">
          <div class="metric-label">Weekly Revenue</div>
          <div class="metric-value">●●●●●</div>
        </div>
        <div class="metric">
          <div class="metric-label">Total Costs</div>
          <div class="metric-value">●●●●●</div>
        </div>
        <div class="metric">
          <div class="metric-label">Net Profit</div>
          <div class="metric-value">●●●●●</div>
        </div>
      </div>
      
      <div class="batch-card-actions">
        <button class="btn-small" data-element-id="view-batch-details-12">📊 Full Details</button>
        <button class="btn-small" data-element-id="view-performance-12">📈 Performance</button>
        <button class="btn-small" data-element-id="view-finances-12">💰 Finances</button>
        <button class="btn-small" data-element-id="compare-batch-12">📋 Compare</button>
      </div>
    </div>
  </div>
  
  <!-- Completed Batches Section -->
  <h2 class="section-title">Completed Batches (Recent)</h2>
  <div class="batch-cards">
    <div class="batch-card">
      <div class="batch-card-header">
        <div>
          <div class="batch-card-title">B2024-002 - Broiler Batch</div>
          <div class="batch-card-meta">House A • Oct 1 - Nov 26, 2024 • 8 weeks</div>
        </div>
        <span class="badge badge-completed">Completed</span>
      </div>
      
      <div class="batch-card-metrics">
        <div class="metric">
          <div class="metric-label">Final Population</div>
          <div class="metric-value">470/500 birds</div>
        </div>
        <div class="metric">
          <div class="metric-label">Final Weight</div>
          <div class="metric-value">2.0kg avg</div>
        </div>
        <div class="metric">
          <div class="metric-label">FCR</div>
          <div class="metric-value">2.2</div>
        </div>
        <div class="metric">
          <div class="metric-label">Mortality</div>
          <div class="metric-value">6%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Net Profit</div>
          <div class="metric-value">●●●●●</div>
        </div>
        <div class="metric">
          <div class="metric-label">ROI</div>
          <div class="metric-value">●●●●%</div>
        </div>
      </div>
      
      <div class="batch-card-actions">
        <button class="btn-small" data-element-id="view-batch-details-2">📊 Full Details</button>
        <button class="btn-small" data-element-id="view-performance-2">📈 Performance</button>
        <button class="btn-small" data-element-id="view-finances-2">💰 Finances</button>
        <button class="btn-small" data-element-id="compare-batch-2">📋 Compare</button>
      </div>
    </div>
    
    <div class="batch-card">
      <div class="batch-card-header">
        <div>
          <div class="batch-card-title">B2024-001 - Broiler Batch</div>
          <div class="batch-card-meta">House A • Jan 15 - Mar 11, 2024 • 8 weeks</div>
        </div>
        <span class="badge badge-completed">Completed</span>
      </div>
      
      <div class="batch-card-metrics">
        <div class="metric">
          <div class="metric-label">Final Population</div>
          <div class="metric-value">485/500 birds</div>
        </div>
        <div class="metric">
          <div class="metric-label">Final Weight</div>
          <div class="metric-value">2.1kg avg</div>
        </div>
        <div class="metric">
          <div class="metric-label">FCR</div>
          <div class="metric-value">2.1</div>
        </div>
        <div class="metric">
          <div class="metric-label">Mortality</div>
          <div class="metric-value">3%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Net Profit</div>
          <div class="metric-value">●●●●●</div>
        </div>
        <div class="metric">
          <div class="metric-label">ROI</div>
          <div class="metric-value">●●●●%</div>
        </div>
      </div>
      
      <div class="batch-card-actions">
        <button class="btn-small" data-element-id="view-batch-details-1">📊 Full Details</button>
        <button class="btn-small" data-element-id="view-performance-1">📈 Performance</button>
        <button class="btn-small" data-element-id="view-finances-1">💰 Finances</button>
        <button class="btn-small" data-element-id="compare-batch-1">📋 Compare</button>
      </div>
    </div>
  </div>
</div>
</body>
</html>
```

---

## Section 2: Batch Compare Tab

### Purpose
Side-by-side comparison of up to 3 batches to identify best practices, success factors, and areas for improvement.

### Wireframe: Batch Compare Tab

```wireframe
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Batch Compare Tab</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; padding: 20px; }
  .container { max-width: 1200px; margin: 0 auto; }
  
  /* Batch Selectors */
  .batch-selectors { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
  .batch-selectors h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
  .selector-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
  .field-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
  .field-select { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; cursor: pointer; font-family: 'Manrope', sans-serif; }
  
  /* Comparison Table */
  .comparison-table-container { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; overflow-x: auto; }
  .comparison-table-container h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
  .comparison-table { width: 100%; border-collapse: collapse; min-width: 600px; }
  .comparison-table th { text-align: left; font-size: 13px; font-weight: 500; color: #666; padding: 12px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
  .comparison-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  .comparison-table tr:hover { background: #f9fafb; }
  .best-performer { background: #dcfce7; font-weight: 600; color: #166534; }
  
  /* Insights Section */
  .insights-section { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
  .insights-section h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
  .insight-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .insight-card:last-child { margin-bottom: 0; }
  .insight-title { font-size: 14px; font-weight: 600; color: #166534; margin-bottom: 8px; }
  .insight-description { font-size: 14px; color: #374151; line-height: 1.6; }
  
  @media (max-width: 768px) {
    .selector-grid { grid-template-columns: 1fr; }
    .comparison-table-container { padding: 16px; }
  }
</style>
</head>
<body>
<div class="container">
  <!-- Batch Selectors -->
  <div class="batch-selectors">
    <h3>Select Batches to Compare (Up to 3)</h3>
    <div class="selector-grid">
      <div>
        <label class="field-label">Batch 1</label>
        <select class="field-select" data-element-id="batch-1-select">
          <option value="">Select batch...</option>
          <option value="batch1" selected>B2024-001 - Broiler (Completed)</option>
          <option value="batch2">B2024-002 - Broiler (Completed)</option>
          <option value="batch3">B2023-045 - Broiler (Completed)</option>
        </select>
      </div>
      
      <div>
        <label class="field-label">Batch 2</label>
        <select class="field-select" data-element-id="batch-2-select">
          <option value="">Select batch...</option>
          <option value="batch1">B2024-001 - Broiler (Completed)</option>
          <option value="batch2" selected>B2024-002 - Broiler (Completed)</option>
          <option value="batch3">B2023-045 - Broiler (Completed)</option>
        </select>
      </div>
      
      <div>
        <label class="field-label">Batch 3 (Optional)</label>
        <select class="field-select" data-element-id="batch-3-select">
          <option value="" selected>Select batch...</option>
          <option value="batch1">B2024-001 - Broiler (Completed)</option>
          <option value="batch2">B2024-002 - Broiler (Completed)</option>
          <option value="batch3">B2023-045 - Broiler (Completed)</option>
        </select>
      </div>
    </div>
  </div>
  
  <!-- Comparison Table -->
  <div class="comparison-table-container">
    <h3>Side-by-Side Comparison</h3>
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>B2024-001</th>
          <th>B2024-002</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Duration</strong></td>
          <td class="best-performer">56 days (8 weeks)</td>
          <td>58 days (8.3 weeks)</td>
        </tr>
        <tr>
          <td><strong>Initial Birds</strong></td>
          <td>500</td>
          <td>500</td>
        </tr>
        <tr>
          <td><strong>Final Birds</strong></td>
          <td class="best-performer">485 (97%)</td>
          <td>470 (94%)</td>
        </tr>
        <tr>
          <td><strong>Mortality Rate</strong></td>
          <td class="best-performer">3.0%</td>
          <td>6.0%</td>
        </tr>
        <tr>
          <td><strong>Final Weight (avg)</strong></td>
          <td class="best-performer">2.1 kg</td>
          <td>2.0 kg</td>
        </tr>
        <tr>
          <td><strong>FCR</strong></td>
          <td class="best-performer">2.1</td>
          <td>2.2</td>
        </tr>
        <tr>
          <td><strong>Feed Efficiency</strong></td>
          <td class="best-performer">+3.9%</td>
          <td>+1.2%</td>
        </tr>
        <tr>
          <td><strong>Total Feed Cost</strong></td>
          <td class="best-performer">●●●●●</td>
          <td>●●●●●</td>
        </tr>
        <tr>
          <td><strong>Total Health Cost</strong></td>
          <td class="best-performer">●●●●●</td>
          <td>●●●●●</td>
        </tr>
        <tr>
          <td><strong>Total Expenses</strong></td>
          <td class="best-performer">●●●●●</td>
          <td>●●●●●</td>
        </tr>
        <tr>
          <td><strong>Total Revenue</strong></td>
          <td class="best-performer">●●●●●</td>
          <td>●●●●●</td>
        </tr>
        <tr>
          <td><strong>Net Profit</strong></td>
          <td class="best-performer">●●●●●</td>
          <td>●●●●●</td>
        </tr>
        <tr>
          <td><strong>ROI</strong></td>
          <td class="best-performer">●●●●%</td>
          <td>●●●●%</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- Insights Section -->
  <div class="insights-section">
    <h3>Insights & Recommendations</h3>
    
    <div class="insight-card">
      <div class="insight-title">🏆 Best Performer: B2024-001</div>
      <div class="insight-description">
        This batch achieved the highest ROI (●●●●%) with excellent mortality rate (3%) and FCR (2.1). 
        Key success factors: consistent feed quality, timely vaccinations, optimal environmental conditions, 
        and efficient feed transitions (starter→grower→finisher).
      </div>
    </div>
    
    <div class="insight-card">
      <div class="insight-title">📊 Mortality Rate Difference (3% improvement)</div>
      <div class="insight-description">
        B2024-001 had 3% lower mortality than B2024-002 (3% vs 6%). Review health protocols from B2024-001: 
        proactive vaccination schedule, weekly health checks, preventive medication approach, and early disease detection.
      </div>
    </div>
    
    <div class="insight-card">
      <div class="insight-title">💰 Feed Efficiency Advantage (+2.7%)</div>
      <div class="insight-description">
        B2024-001 achieved better FCR (2.1 vs 2.2) and feed efficiency (+3.9% vs +1.2%), resulting in lower feed costs 
        per kg of weight gain. Consider using the same feed formulation strategy and transition timing for future batches.
      </div>
    </div>
    
    <div class="insight-card">
      <div class="insight-title">⏱️ Duration Optimization (2 days faster)</div>
      <div class="insight-description">
        B2024-001 completed 2 days faster (56 vs 58 days) while achieving better weight. This suggests optimal 
        feed management and environmental conditions. Target 56-day completion for future broiler batches.
      </div>
    </div>
  </div>
</div>
</body>
</html>
```

---

## Section 3: Performance History Tab

### Purpose
Detailed performance tracking with week-by-week progression, feed efficiency analysis, and health performance metrics.

### Wireframe: Performance History Tab

```wireframe
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Performance History Tab</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; padding: 20px; }
  .container { max-width: 1200px; margin: 0 auto; }
  
  /* Batch Selector */
  .batch-selector { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
  .field-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
  .field-select { width: 100%; max-width: 400px; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; cursor: pointer; font-family: 'Manrope', sans-serif; }
  
  /* Performance Summary */
  .performance-summary { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
  .performance-summary h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
  .summary-item { }
  .summary-item-label { font-size: 13px; color: #666; margin-bottom: 4px; }
  .summary-item-value { font-size: 18px; font-weight: 600; color: #1a1a1a; }
  .grade-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; background: #dcfce7; color: #166534; margin-left: 8px; }
  
  /* Weekly Progression */
  .weekly-progression { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
  .weekly-progression h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
  .week-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
  .week-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
  .week-card-title { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 8px; }
  .week-card-value { font-size: 16px; font-weight: 600; color: #1a1a1a; }
  .week-card-change { font-size: 11px; color: #16a34a; margin-top: 4px; }
  
  /* Feed Efficiency */
  .feed-efficiency { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
  .feed-efficiency h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
  .phase-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
  .phase-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  .phase-card-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }
  .phase-metric { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
  .phase-metric-label { color: #666; }
  .phase-metric-value { font-weight: 600; color: #1a1a1a; }
  .efficiency-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; background: #dcfce7; color: #166534; }
  
  /* Health Performance */
  .health-performance { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
  .health-performance h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
  .health-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .health-section { }
  .health-section-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }
  .health-list { list-style: none; }
  .health-list li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; }
  .health-list li:last-child { border-bottom: none; }
  .health-status { float: right; font-weight: 500; color: #16a34a; }
  
  @media (max-width: 768px) {
    .summary-grid { grid-template-columns: 1fr 1fr; }
    .week-grid { grid-template-columns: repeat(2, 1fr); }
    .phase-grid { grid-template-columns: 1fr; }
    .health-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="container">
  <!-- Batch Selector -->
  <div class="batch-selector">
    <label class="field-label">Select Batch for Performance Analysis</label>
    <select class="field-select" data-element-id="performance-batch-select">
      <option value="">Select batch...</option>
      <option value="batch1" selected>B2024-001 - Broiler (Completed) - Excellent Performance</option>
      <option value="batch2">B2024-002 - Broiler (Completed) - Good Performance</option>
      <option value="batch3">L2024-012 - Layer (Active) - Week 25/68</option>
    </select>
  </div>
  
  <!-- Performance Summary -->
  <div class="performance-summary">
    <h3>Performance Summary - B2024-001</h3>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-item-label">Duration</div>
        <div class="summary-item-value">56 days (8 weeks)</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">Final Population</div>
        <div class="summary-item-value">485/500 birds</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">Final Weight</div>
        <div class="summary-item-value">2.1 kg avg</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">FCR</div>
        <div class="summary-item-value">2.1</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">Mortality Rate</div>
        <div class="summary-item-value">3.0%</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">Performance Grade</div>
        <div class="summary-item-value">Excellent <span class="grade-badge">✅</span></div>
      </div>
    </div>
  </div>
  
  <!-- Weekly Weight Progression -->
  <div class="weekly-progression">
    <h3>Weekly Weight Progression</h3>
    <div class="week-grid">
      <div class="week-card">
        <div class="week-card-title">Week 1</div>
        <div class="week-card-value">45g → 120g</div>
        <div class="week-card-change">+75g gain</div>
      </div>
      <div class="week-card">
        <div class="week-card-title">Week 2</div>
        <div class="week-card-value">120g → 280g</div>
        <div class="week-card-change">+160g gain</div>
      </div>
      <div class="week-card">
        <div class="week-card-title">Week 3</div>
        <div class="week-card-value">280g → 480g</div>
        <div class="week-card-change">+200g gain</div>
      </div>
      <div class="week-card">
        <div class="week-card-title">Week 4</div>
        <div class="week-card-value">480g → 720g</div>
        <div class="week-card-change">+240g gain</div>
      </div>
      <div class="week-card">
        <div class="week-card-title">Week 5</div>
        <div class="week-card-value">720g → 1,050g</div>
        <div class="week-card-change">+330g gain</div>
      </div>
      <div class="week-card">
        <div class="week-card-title">Week 6</div>
        <div class="week-card-value">1,050g → 1,420g</div>
        <div class="week-card-change">+370g gain</div>
      </div>
      <div class="week-card">
        <div class="week-card-title">Week 7</div>
        <div class="week-card-value">1,420g → 1,800g</div>
        <div class="week-card-change">+380g gain</div>
      </div>
      <div class="week-card">
        <div class="week-card-title">Week 8</div>
        <div class="week-card-value">1,800g → 2,100g</div>
        <div class="week-card-change">+300g gain</div>
      </div>
    </div>
  </div>
  
  <!-- Feed Efficiency Analysis -->
  <div class="feed-efficiency">
    <h3>Feed Efficiency Analysis</h3>
    <div class="phase-grid">
      <div class="phase-card">
        <div class="phase-card-title">Starter Phase (Week 1-3)</div>
        <div class="phase-metric">
          <span class="phase-metric-label">Planned</span>
          <span class="phase-metric-value">2.5 tons</span>
        </div>
        <div class="phase-metric">
          <span class="phase-metric-label">Actual</span>
          <span class="phase-metric-value">2.3 tons</span>
        </div>
        <div class="phase-metric">
          <span class="phase-metric-label">FCR</span>
          <span class="phase-metric-value">1.2 <span class="efficiency-badge">Excellent</span></span>
        </div>
        <div class="phase-metric">
          <span class="phase-metric-label">Efficiency</span>
          <span class="phase-metric-value">+8.0%</span>
        </div>
      </div>
      
      <div class="phase-card">
        <div class="phase-card-title">Grower Phase (Week 4-6)</div>
        <div class="phase-metric">
          <span class="phase-metric-label">Planned</span>
          <span class="phase-metric-value">4.2 tons</span>
        </div>
        <div class="phase-metric">
          <span class="phase-metric-label">Actual</span>
          <span class="phase-metric-value">4.0 tons</span>
        </div>
        <div class="phase-metric">
          <span class="phase-metric-label">FCR</span>
          <span class="phase-metric-value">1.8 <span class="efficiency-badge">Good</span></span>
        </div>
        <div class="phase-metric">
          <span class="phase-metric-label">Efficiency</span>
          <span class="phase-metric-value">+4.8%</span>
        </div>
      </div>
      
      <div class="phase-card">
        <div class="phase-card-title">Finisher Phase (Week 7-8)</div>
        <div class="phase-metric">
          <span class="phase-metric-label">Planned</span>
          <span class="phase-metric-value">3.8 tons</span>
        </div>
        <div class="phase-metric">
          <span class="phase-metric-label">Actual</span>
          <span class="phase-metric-value">3.9 tons</span>
        </div>
        <div class="phase-metric">
          <span class="phase-metric-label">FCR</span>
          <span class="phase-metric-value">2.8 <span class="efficiency-badge">Acceptable</span></span>
        </div>
        <div class="phase-metric">
          <span class="phase-metric-label">Efficiency</span>
          <span class="phase-metric-value">-2.6%</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Health Performance -->
  <div class="health-performance">
    <h3>Health Performance</h3>
    <div class="health-grid">
      <div class="health-section">
        <div class="health-section-title">Vaccination Schedule</div>
        <ul class="health-list">
          <li>Day 7: Gumboro (IBD) <span class="health-status">✅ Completed</span></li>
          <li>Day 14: HB1 (Newcastle + IB) <span class="health-status">✅ Completed</span></li>
          <li>Day 21: Gumboro Plus <span class="health-status">✅ Completed</span></li>
          <li>Day 28: Lasota <span class="health-status">✅ Completed</span></li>
          <li>Day 35: Gumboro Plus <span class="health-status">✅ Completed</span></li>
          <li>Day 36: Deworming <span class="health-status">✅ Completed</span></li>
        </ul>
      </div>
      
      <div class="health-section">
        <div class="health-section-title">Mortality Tracking</div>
        <ul class="health-list">
          <li>Week 1: 0 birds (0.0%)</li>
          <li>Week 2: 1 bird (0.2%)</li>
          <li>Week 3: 2 birds (0.4%)</li>
          <li>Week 4: 3 birds (0.6%)</li>
          <li>Week 5: 4 birds (0.8%)</li>
          <li>Week 6: 5 birds (1.0%)</li>
          <li>Week 7: 7 birds (1.4%)</li>
          <li>Week 8: 15 birds (3.0%) <span class="health-status">✅ Good</span></li>
        </ul>
      </div>
    </div>
  </div>
</div>
</body>
</html>
```

---

## Section 4: Backend Integration

### Database Models

#### BatchRecord Model (Historical Data Storage)

```python
class BatchRecord(Base):
    """Complete historical record of a batch (created on batch completion)."""
    __tablename__ = "batch_records"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Batch Reference
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, unique=True, index=True)
    
    # Basic Information
    batch_name = Column(String(100), nullable=False)
    species = Column(String(50), nullable=False, index=True)
    production_system = Column(String(50), nullable=False)  # intensive, semi-intensive
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    duration_days = Column(Integer, nullable=False)
    duration_weeks = Column(Integer, nullable=False)
    
    # Population Data
    initial_quantity = Column(Integer, nullable=False)
    final_quantity = Column(Integer, nullable=False)
    total_mortality = Column(Integer, nullable=False)
    mortality_rate = Column(Float, nullable=False)  # Percentage
    
    # Performance Metrics
    final_weight_avg = Column(Float, nullable=False)  # kg
    fcr = Column(Float, nullable=False)  # Feed Conversion Ratio
    feed_efficiency_percentage = Column(Float, nullable=False)  # vs planned
    growth_rate_per_week = Column(Float, nullable=False)  # grams
    
    # Financial Metrics (JSON for cost privacy)
    total_feed_cost = Column(Float, nullable=False)
    total_health_cost = Column(Float, nullable=False)
    total_labor_cost = Column(Float, nullable=False)
    total_other_cost = Column(Float, nullable=False)
    total_expenses = Column(Float, nullable=False)
    total_revenue = Column(Float, nullable=False)
    net_profit = Column(Float, nullable=False)
    roi_percentage = Column(Float, nullable=False)
    cost_per_bird = Column(Float, nullable=False)
    profit_per_bird = Column(Float, nullable=False)
    
    # Weekly Progression (JSON)
    weekly_weight_progression = Column(JSON, nullable=False)
    # [{"week": 1, "start_weight": 45, "end_weight": 120, "gain": 75}, ...]
    
    weekly_mortality_progression = Column(JSON, nullable=False)
    # [{"week": 1, "deaths": 0, "cumulative": 0, "rate": 0.0}, ...]
    
    weekly_cost_progression = Column(JSON, nullable=False)
    # [{"week": 1, "feed": 620, "health": 75, "labor": 105, "other": 50, "total": 850}, ...]
    
    # Feed History (JSON)
    feed_phases = Column(JSON, nullable=False)
    # [{"phase": "starter", "weeks": "1-3", "planned": 2.5, "actual": 2.3, "fcr": 1.2}, ...]
    
    # Health History (JSON)
    vaccination_history = Column(JSON, nullable=False)
    # [{"day": 7, "vaccine": "Gumboro", "cost": 75, "response": "excellent"}, ...]
    
    medication_history = Column(JSON, nullable=False)
    # [{"day": 25, "medication": "Deworming", "cost": 50, "reason": "preventive"}, ...]
    
    # Performance Grade
    performance_grade = Column(String(20), nullable=False)  # excellent, good, fair, poor
    
    # Lessons Learned (JSON)
    success_factors = Column(JSON, nullable=True)
    # ["Optimal feed transitions", "Proactive health management", ...]
    
    improvement_opportunities = Column(JSON, nullable=True)
    # ["Reduce finisher phase waste", "Improve market timing", ...]
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    batch = relationship("Batch", back_populates="historical_record")
```

#### BatchComparison Model (Saved Comparisons)

```python
class BatchComparison(Base):
    """Saved batch comparisons for future reference."""
    __tablename__ = "batch_comparisons"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # User Reference
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Comparison Details
    comparison_name = Column(String(100), nullable=False)
    batch_ids = Column(JSON, nullable=False)  # [1, 2, 3]
    
    # Comparison Results (JSON)
    performance_comparison = Column(JSON, nullable=False)
    financial_comparison = Column(JSON, nullable=False)
    insights = Column(JSON, nullable=False)
    recommendations = Column(JSON, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="batch_comparisons")
```

### API Endpoints

```typescript
// Records API Endpoints
interface RecordsAPI {
  // Batch Records
  "GET /api/v1/records/batches": {
    query: { 
      species?: string; 
      status?: string; 
      start_date?: string; 
      end_date?: string;
      limit?: number;
      offset?: number;
    };
    response: {
      batches: BatchRecordSummary[];
      total: number;
      summary: {
        total_batches: number;
        active_batches: number;
        completed_batches: number;
        average_roi: number | null;  // null if cost privacy enabled
      };
    };
  };
  
  "GET /api/v1/records/batches/{batch_id}": {
    response: BatchRecordDetail;
  };
  
  // Batch Comparison
  "POST /api/v1/records/compare": {
    request: { 
      batch_ids: number[];  // 2-3 batch IDs
    };
    response: {
      batches: BatchComparisonData[];
      best_performer: {
        batch_id: number;
        metrics_won: string[];  // ["fcr", "mortality", "roi", ...]
      };
      insights: Insight[];
      recommendations: Recommendation[];
    };
  };
  
  "POST /api/v1/records/comparisons": {
    request: {
      name: string;
      batch_ids: number[];
    };
    response: { comparison_id: number };
  };
  
  "GET /api/v1/records/comparisons": {
    response: SavedComparison[];
  };
  
  // Performance Analytics
  "GET /api/v1/records/performance-trends": {
    query: { 
      species?: string; 
      metric?: string;  // fcr, mortality, weight, etc.
      period?: string;  // last_6_months, last_year, all_time
    };
    response: {
      trends: TrendData[];
      benchmarks: BenchmarkData;
    };
  };
  
  // Financial Analytics
  "GET /api/v1/records/financial-summary": {
    query: { 
      species?: string; 
      start_date?: string; 
      end_date?: string;
    };
    response: {
      total_revenue: number | null;  // null if cost privacy
      total_expenses: number | null;
      net_profit: number | null;
      average_roi: number | null;
      expense_breakdown: ExpenseBreakdown | null;
    };
  };
  
  // Export
  "GET /api/v1/records/export": {
    query: { 
      format: 'pdf' | 'csv'; 
      batch_ids?: string;  // comma-separated
      include_financial?: boolean;
    };
    response: Blob;
  };
}
```

### Service Layer

#### RecordsService

```python
class RecordsService:
    """Service for historical records management and analytics."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.batch_repo = BatchRepository(session)
        self.batch_record_repo = BatchRecordRepository(session)
        self.comparison_repo = BatchComparisonRepository(session)
    
    async def get_batch_records(
        self,
        species: Optional[str] = None,
        status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get batch records with filters and summary."""
        # Implementation retrieves from batch_records table
        pass
    
    async def get_batch_record_detail(self, batch_id: int) -> BatchRecordDetail:
        """Get complete batch record with all historical data."""
        # Implementation retrieves complete record
        pass
    
    async def compare_batches(self, batch_ids: List[int]) -> BatchComparisonResult:
        """Compare multiple batches and generate insights."""
        # Implementation performs multi-dimensional comparison
        pass
    
    async def generate_performance_trends(
        self,
        species: Optional[str] = None,
        metric: Optional[str] = None,
        period: str = "last_6_months"
    ) -> PerformanceTrends:
        """Generate performance trends over time."""
        # Implementation calculates trends
        pass
    
    async def export_records(
        self,
        format: str,
        batch_ids: Optional[List[int]] = None,
        include_financial: bool = True
    ) -> bytes:
        """Export records in PDF or CSV format."""
        # Implementation generates export file
        pass
```

### Event-Driven Integration

#### Events Published

```python
# Records System Events
class RecordsEventType(str, Enum):
    BATCH_RECORD_CREATED = "batch_record_created"
    BATCH_COMPARISON_SAVED = "batch_comparison_saved"
    RECORDS_EXPORTED = "records_exported"
```

#### Events Subscribed

```python
# Listen to batch completion
@event_bus.subscribe(EventType.BATCH_TERMINATED)
async def on_batch_terminated(event: BatchEvent, session: AsyncSession):
    """Create historical record when batch is terminated."""
    records_service = RecordsService(session)
    await records_service.create_batch_record(event.batch_id)
```

---

## Section 5: Complete Batch Information Hub

### Single-Click Access to All Data

**Concept:** When farmer clicks "📊 Full Details" on any batch card, they see a comprehensive view with all batch information from all systems.

### Complete Batch Details View

```
┌─────────────────────────────────────────────────────────┐
│ Batch B2024-001 - Broiler (Completed)                  │
│ ─────────────────────────────────────────────────────── │
│ Basic Information:                                      │
│ ├── Species: Broiler                                   │
│ ├── Duration: 8 weeks (56 days)                       │
│ ├── Initial: 500 birds → Final: 485 birds             │
│ ├── Housing: House A                                   │
│ └── Period: Jan 15 - Mar 11, 2024                     │
│                                                         │
│ Final Performance:                                      │
│ ├── Final Weight: 2.1kg average                       │
│ ├── FCR: 2.1 (Good performance)                       │
│ ├── Mortality: 3% (15 birds total)                    │
│ └── Grade: Excellent ✅                                │
│                                                         │
│ Financial Summary:                                      │
│ ├── Total Revenue: ●●●●●                               │
│ ├── Total Expenses: ●●●●●                              │
│ ├── Net Profit: ●●●●●                                  │
│ └── ROI: ●●●●%                                         │
│                                                         │
│ Quick Actions:                                          │
│ [Feed History] [Health Records] [Cost Details]         │
│ [Performance Chart] [Compare Batches] [Export Report]  │
└─────────────────────────────────────────────────────────┘
```

### Activity Timeline (Chronological)

**All batch activities from all systems in one timeline:**

```
Week 1 (Jan 15-21):
├── Day 1: Batch created, 500 chicks received
├── Day 1: Starter feed plan activated (2.5 tons planned)
├── Day 7: Gumboro vaccination administered (GHS 75)
├── Week cost: GHS 620 (Feed: GHS 450, Health: GHS 75, Labor: GHS 95)
└── Week end: All birds healthy, good start

Week 2 (Jan 22-28):
├── Day 14: HB1 vaccination (Newcastle + IB) (GHS 125)
├── Day 14: Weekly check - 280g average weight
├── Week cost: GHS 580 (Feed: GHS 520, Health: GHS 60)
└── Week end: Growth on target, 1 mortality

Week 4 (Feb 5-11):
├── Day 22: Switch to grower feed (4.2 tons planned)
├── Day 28: Lasota vaccination (GHS 100)
├── Day 28: Weekly check - 720g average weight
├── Week cost: GHS 1,134 (Feed: GHS 980, Health: GHS 154)
└── Week end: Excellent growth, FCR 1.8

Week 8 (Mar 4-11):
├── Day 52: Final weight check - 2.1kg average
├── Day 56: Batch completion, market sale
├── Final cost: GHS 9,850 total
└── Final result: GHS 2,881 profit, 29% ROI
```

---

## Section 6: Batch Comparison Engine

### Comparison Algorithm

**Multi-Dimensional Comparison:**

```python
async def compare_batches(batch_ids: List[int]) -> BatchComparisonResult:
    """
    Compare batches across multiple dimensions:
    1. Performance metrics (FCR, mortality, weight, duration)
    2. Financial metrics (costs, revenue, profit, ROI)
    3. Feed efficiency (planned vs actual, phase performance)
    4. Health performance (vaccination response, mortality patterns)
    5. Timeline comparison (milestone achievements)
    """
    
    # Retrieve complete records
    records = await get_batch_records(batch_ids)
    
    # Performance comparison
    performance = {
        "fcr": compare_metric(records, "fcr", lower_is_better=True),
        "mortality": compare_metric(records, "mortality_rate", lower_is_better=True),
        "final_weight": compare_metric(records, "final_weight_avg", higher_is_better=True),
        "duration": compare_metric(records, "duration_days", lower_is_better=True),
        "feed_efficiency": compare_metric(records, "feed_efficiency_percentage", higher_is_better=True)
    }
    
    # Financial comparison (respects cost privacy)
    financial = {
        "revenue": compare_metric(records, "total_revenue", higher_is_better=True),
        "expenses": compare_metric(records, "total_expenses", lower_is_better=True),
        "profit": compare_metric(records, "net_profit", higher_is_better=True),
        "roi": compare_metric(records, "roi_percentage", higher_is_better=True)
    }
    
    # Identify best performer
    best_performer = identify_best_performer(performance, financial)
    
    # Generate insights
    insights = generate_insights(records, performance, financial, best_performer)
    
    # Generate recommendations
    recommendations = generate_recommendations(records, best_performer)
    
    return {
        "batches": records,
        "performance_comparison": performance,
        "financial_comparison": financial,
        "best_performer": best_performer,
        "insights": insights,
        "recommendations": recommendations
    }
```

### Insights Generation

**Automatic Insights Based on Comparison:**

1. **Best Performer Identification**
   - Batch that wins most metrics
   - Success factors extraction
   - Replicable practices identification

2. **Performance Gap Analysis**
   - Mortality rate differences
   - FCR variations
   - Weight gain patterns
   - Duration optimization

3. **Cost Efficiency Analysis**
   - Feed cost per kg comparison
   - Health cost effectiveness
   - Labor efficiency
   - Overall cost optimization

4. **Improvement Recommendations**
   - Apply best practices from top performer
   - Address specific weaknesses
   - Optimize feed transitions
   - Improve health protocols

---

## Section 7: Export Capabilities

### PDF Export

**Complete Batch Report:**
- Batch overview (species, duration, population)
- Performance summary (FCR, mortality, weight)
- Financial summary (expenses, revenue, profit) - respects cost privacy
- Weekly progression (weight, mortality, costs)
- Feed history (phases, consumption, efficiency)
- Health history (vaccinations, medications, observations)
- Lessons learned and recommendations

### CSV Export

**Raw Data Export:**
- Batch basic information
- Weekly metrics (weight, mortality, costs)
- Feed consumption data
- Health events
- Expense records
- Revenue records

**Use Cases:**
- Regulatory compliance
- Tax reporting
- Farm record-keeping
- Data analysis in external tools

---

## Section 8: Integration with All Systems

### Feed Calculator Integration

**Data Collected:**
- All feed formulations (method, ingredients, quantities, costs)
- Daily consumption records
- Feed phase transitions
- FCR calculations
- Feed efficiency metrics

**Display in Records:**
- Complete feed history by phase
- Planned vs actual consumption
- Cost breakdown by feed type
- Feed efficiency trends

### Water-Health Integration

**Data Collected:**
- All vaccination events (date, vaccine, cost, response)
- All medication administrations (date, medication, dosage, cost, reason)
- Health observations (weekly checks, farmer notes)
- Mortality events (date, count, cumulative)
- Withdrawal periods

**Display in Records:**
- Complete vaccination timeline
- Medication history
- Mortality progression
- Health cost tracking

### Finance Integration

**Data Collected:**
- All expenses (category, amount, date, source)
- All revenue (type, amount, date, customer)
- Weekly cost progression
- Budget variance
- Profitability calculations

**Display in Records:**
- Complete expense breakdown
- Revenue tracking
- Profit/loss analysis
- ROI calculations
- Cost privacy applied

### Batch Lifecycle Integration

**Data Collected:**
- Batch creation details
- Phase transitions
- Milestone achievements
- Population changes
- Completion data

**Display in Records:**
- Complete batch timeline
- Milestone tracking
- Status change history
- Population progression

---

## Section 9: Cost Privacy in Records

### Privacy Rules

**Financial Data Masking:**
- All monetary values shown as "●●●●●" when cost privacy enabled
- ROI shown as "●●●●%" when cost privacy enabled
- Percentages and ratios still visible (FCR, mortality rate, feed efficiency)
- Non-financial metrics always visible (weight, population, duration)

**Eye Icon Temporary Reveal:**
- Click eye icon to reveal financial data for 30 seconds
- Auto-hide after timeout
- User preference saved in database

**Export Behavior:**
- PDF export respects cost privacy (masks financial data)
- CSV export includes all data (farmer's own records)
- Warning shown before export if cost privacy enabled

---

## Section 10: Acceptance Criteria

### Functional Requirements
- [ ] Records dashboard displays all batch records with filters (species, status, date range)
- [ ] Tab-based navigation (Batch Overview, Performance, Financial, Compare)
- [ ] Batch comparison supports 2-3 batches side-by-side
- [ ] Best performer highlighting in comparison table
- [ ] Insights and recommendations generated automatically
- [ ] Performance trends visualization
- [ ] Financial records with cost privacy maintained
- [ ] Export functionality (PDF, CSV) with cost privacy support
- [ ] Single-click access to complete batch information
- [ ] Activity timeline shows all events chronologically

### Performance Requirements
- [ ] Records dashboard loads in <2 seconds
- [ ] Batch comparison completes in <1 second
- [ ] Export generation completes in <5 seconds for single batch
- [ ] Export generation completes in <10 seconds for multiple batches

### Integration Requirements
- [ ] Batch Management integration (historical data collection)
- [ ] Feed Calculator integration (feed history)
- [ ] Water-Health integration (health history)
- [ ] Finance System integration (financial records)
- [ ] Automatic record creation on batch completion

### UI/UX Requirements
- [ ] Follows FarmVista design system (green #16A34A, Manrope font, rounded-xl cards)
- [ ] Follows welcome-page.tsx canonical patterns
- [ ] Mobile-responsive design (stacked layout, bottom nav)
- [ ] Cost privacy maintained throughout
- [ ] Clear error messages and validation
- [ ] Accessible (keyboard navigation, ARIA labels)

---

## Related Specifications

- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/c18bcbcb-e4da-43cc-b5cd-5e27c2e4ed1f - Batch Management System
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/fb99cad1-d468-4a18-bd81-d987f1ae6f63 - Feed Calculator System
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/2a098707-5645-4c66-ba4b-27e04df312ca - Water-Health System
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/9024827f-8dea-465d-800c-cdf5749dc498 - Finance System
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/35142770-c1b0-4df2-85e2-5a839616334a - Backend Architecture
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/9e3bb05f-9ca8-4cc6-9f97-a5d0eb53ae92 - Frontend Architecture

**Research References:**
- file:priest/16-records-management-simple/ - Complete records management research
- file:docs/priest new/specs/Records_System_-_Enhanced_Comprehensive_Specification.md - Enhanced specification

---

**End of Records System Specification**