# Finance System - Production-Grade Specification (Expenses + Revenue + Cost Privacy)

# Finance System - Production-Grade Specification

**Version:** 1.0  
**Date:** January 16, 2026  
**Status:** Production-Ready  
**Epic:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/2c73a304-598c-472c-b79c-20584f6dc34b

---

## Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [Core Features](#core-features)
3. [Expense Categories](#expense-categories)
4. [Revenue Types](#revenue-types)
5. [Automatic Integration](#automatic-integration)
6. [Cost Privacy](#cost-privacy)
7. [Sales Estimation](#sales-estimation)
8. [UI Wireframes](#ui-wireframes)
9. [Backend Integration](#backend-integration)
10. [Event-Driven Integration](#event-driven-integration)
11. [Acceptance Criteria](#acceptance-criteria)

---

## Overview & Philosophy

### Purpose

The Finance System provides **comprehensive financial management** for poultry farmers, combining automatic expense recording from all systems with revenue tracking to deliver real-time profitability insights.

### Core Philosophy

**Backend Intelligence, Frontend Simplicity:**
- App automatically records expenses from feed, health, and stock systems
- Farmer sees complete financial picture without manual data entry
- Cost privacy protects sensitive financial information
- Sales estimation helps farmers plan and optimize

**Dovetail Synergy Integration:**
- Feed formulation → Auto-create expense
- Health task completion → Auto-create expense
- Stock purchase → Auto-create expense
- Egg sales → Auto-create revenue
- Bird sales → Auto-create revenue + update population

### Scope

**7 Expense Categories:**
1. Feed & Nutrition
2. Health & Medicine
3. Labor & Workers
4. Utilities & Services
5. Equipment & Tools
6. Transport & Delivery
7. Housing & Facilities
8. Chicks & Birds
9. Other Expenses

**5 Revenue Types:**
1. Egg Sales (layers, ducks, geese, quail, guinea fowl)
2. Bird Sales (all species - live bird sales)
3. Meat Sales (all species - processed meat)
4. Manure Sales (all species - compost/fertilizer)
5. Other Revenue (services, feathers, etc.)

---

## Core Features

### 1. Automatic Expense Recording

**From Feed Calculator:**
- Recipe completion → Auto-create feed expense
- Ingredient costs → Automatic categorization
- Batch allocation → Link expense to batch

**From Water-Health System:**
- Medication task completion → Auto-create health expense
- Vaccination completion → Auto-create vaccine expense
- Cost entered by farmer → Automatic recording

**From Stock Management:**
- Feed purchase → Auto-create feed expense
- Medication purchase → Auto-create health expense
- Equipment purchase → Auto-create equipment expense

### 2. Manual Expense Entry

**When Needed:**
- Labor costs (worker wages)
- Utilities (electricity, water bills)
- Transport (fuel, delivery charges)
- Facility maintenance (repairs, materials)
- Other miscellaneous costs

**Entry Flow:**
1. Select expense category
2. Enter amount (GHS)
3. Enter description
4. Select date
5. Optional: Add receipt photo
6. Confirm and save

### 3. Revenue Tracking

**Egg Sales (Species-Specific):**
- Layers: Daily egg production sales
- Ducks: Commercial duck egg sales (premium pricing)
- Geese: Seasonal egg sales (spring, large premium eggs)
- Quail: Daily egg sales (delicacy, premium product)
- Guinea Fowl: Seasonal egg sales

**Bird Sales (All Species):**
- Live bird sales (partial or complete batch)
- Population automatically updated
- Price per bird entry
- Buyer information tracking

**Meat Sales (All Species):**
- Processed meat sales by weight
- Spent layers (end of production cycle)
- Premium pricing for specialty birds

### 4. Cost Privacy

**Privacy Feature:**
- Hide financial data from workers/visitors
- Eye icon toggle to show/hide costs
- User preference saved in database
- Applies to: expenses, revenue, profit, ROI
- Does NOT apply to: batch count, population, mortality

**Display When Hidden:**
- Amounts show as "●●●●"
- Charts show structure without values
- Summaries show "Hidden" instead of amounts

### 5. Sales Estimation

**Species-Specific Formulas:**
- Broilers: Population × Expected Weight × Market Price
- Layers: Egg Production Rate × Egg Price × Days Remaining
- Ducks: (Egg Revenue + Meat Revenue) estimation
- Turkeys: Population × Expected Weight × Premium Holiday Price

**Estimation Display:**
- "Estimated Revenue: GHS 3,200"
- "Based on: 480 birds × 2.1kg × GHS 3.20/kg"
- "Market price updated: 2 days ago"

---

## Expense Categories

### 1. Feed & Nutrition

**Farmer Term:** "Feed Costs"  
**Description:** All costs related to feeding birds  
**Icon:** Feed bag icon (green)

**Subcategories:**
- Starter feed (chicks 0-4 weeks)
- Grower feed (birds 4-12 weeks)
- Finisher feed (broilers 6-8 weeks)
- Layer feed (egg production)
- Feed supplements (vitamins, minerals)
- Feed ingredients (for custom formulation)

**Automatic Recording From:**
- Feed calculator recipe completion
- Storage system feed purchases
- Custom formulation ingredient costs

### 2. Health & Medicine

**Farmer Term:** "Medicine and Vaccines"  
**Description:** All costs for keeping birds healthy  
**Icon:** Medication icon (blue)

**Subcategories:**
- Vaccines (Newcastle, Gumboro, etc.)
- Antibiotics and treatments
- Vitamins and supplements
- Dewormers
- Disinfectants
- Veterinary services

**Automatic Recording From:**
- Water-health system medication tasks
- Vaccination schedule completion
- Storage system health product purchases

### 3. Labor & Workers

**Farmer Term:** "Worker Costs"  
**Description:** Payments to farm workers and helpers  
**Icon:** Farmer icon (brown)

**Subcategories:**
- Daily labor wages
- Monthly worker salaries
- Casual labor (cleaning, repairs)
- Specialized services (vaccination teams)

**Manual Entry Required:** Labor costs not tracked automatically

### 4. Utilities & Services

**Farmer Term:** "Power and Water"  
**Description:** Ongoing operational costs  
**Icon:** Lightning icon (yellow)

**Subcategories:**
- Electricity bills
- Water bills
- Generator fuel
- Gas for heating
- Internet/phone for farm management

**Manual Entry Required:** Monthly utility bills, fuel purchases

### 5. Equipment & Tools

**Farmer Term:** "Tools and Equipment"  
**Description:** Farm equipment purchases and maintenance  
**Icon:** Wrench icon (gray)

**Subcategories:**
- Feeders and drinkers
- Cages and coops
- Tools (shovels, rakes, etc.)
- Equipment repairs
- Equipment maintenance

**Recording From:** Storage system equipment purchases, manual entry for repairs

### 6. Transport & Delivery

**Farmer Term:** "Transport Costs"  
**Description:** Moving birds, feed, and supplies  
**Icon:** Truck icon (orange)

**Subcategories:**
- Feed delivery charges
- Chick transportation
- Bird sales delivery
- Market transport
- Fuel for farm vehicle

**Manual Entry Required:** Transport receipts, delivery charges, fuel costs

### 7. Housing & Facilities

**Farmer Term:** "Coop and Building Costs"  
**Description:** Housing construction and maintenance  
**Icon:** Poultry farm icon (green)

**Subcategories:**
- Coop construction
- Coop repairs
- Roofing materials
- Fencing
- Building maintenance

**Manual Entry Required:** Construction costs, repair expenses, material purchases

### 8. Chicks & Birds

**Farmer Term:** "Buying Chicks"  
**Description:** Initial bird purchase costs  
**Icon:** Chick icon (gold)

**Subcategories:**
- Day-old chicks
- Point-of-lay pullets
- Breeding stock
- Replacement birds

**Recording From:** Batch creation with purchase cost, storage system bird purchases

### 9. Other Expenses

**Farmer Term:** "Other Costs"  
**Description:** Miscellaneous farm expenses  
**Icon:** Receipt icon (gray)

**Subcategories:**
- Bedding materials (sawdust, rice husks)
- Pest control
- Insurance
- Licenses and permits
- Training and education
- Miscellaneous supplies

**Manual Entry Required:** Various one-time costs, irregular expenses

---

## Revenue Types

### 1. Egg Sales (Species-Specific)

**Supported Species:**
- Layers (primary egg producers - daily laying)
- Ducks (commercial egg production + meat)
- Geese (seasonal egg production - spring, large premium eggs)
- Quail (year-round egg production + meat)
- Guinea Fowl (seasonal egg production + meat + pest control)

**NOT Supported:**
- Broilers (no egg production capability)
- Turkeys (not commercially viable for egg production)

**Entry Fields:**
- Quantity (eggs or crates)
- Price per unit
- Sale date
- Buyer information (optional)
- Payment method (cash, mobile money, credit)
- Payment status (paid, pending, partial)

### 2. Bird Sales (All Species)

**Supported Species:** ALL species (broilers, layers, ducks, turkeys, geese, quail, guinea fowl)

**Sale Types:**
- Live bird sales (partial or complete batch)
- Spent layers (end of production cycle)
- Breeding stock sales

**Entry Fields:**
- Number of birds sold
- Price per bird
- Sale date
- Buyer information
- Payment method
- Payment status

**Automatic Actions:**
- Update batch population (reduce bird count)
- Create revenue entry
- Recalculate batch profitability

### 3. Meat Sales (All Species)

**Supported Species:** ALL species including spent layers

**Sale Types:**
- Processed meat by weight (kg)
- Dressed birds
- Specialty cuts

**Entry Fields:**
- Weight (kg)
- Price per kg
- Sale date
- Buyer information
- Payment method
- Payment status

### 4. Manure Sales (All Species)

**Supported Species:** ALL species

**Sale Types:**
- Fresh manure (bags or tons)
- Composted manure
- Organic fertilizer

**Entry Fields:**
- Quantity (bags or kg)
- Price per unit
- Sale date
- Buyer information

### 5. Other Revenue

**Examples:**
- Pest control services (guinea fowl)
- Feather sales (ducks, geese, turkeys)
- Down sales (geese)
- Breeding services
- Farm tours/education

---

## Automatic Integration

### Feed Calculator Integration

```
USER ACTION: Complete feed formulation

1. FeedFormulationService.confirm_recipe()
   ↓
2. Calculate total cost (ingredients + supplements)
   ↓
3. Publish FEED_FORMULATION_CONFIRMED event
   ↓
4. UnifiedExpenseService handler (Automatic pattern only)
   - Create expense record
   - Category: "Feed & Nutrition"
   - Description: "Week X feed formulation - [recipe_type]"
   - Amount: total_cost_ghs
   - Link to batch
   - Link to formulation record
   ↓
5. Return success with expense_id
```

### Water-Health Integration

```
USER ACTION: Complete health task with cost entry

1. HealthTaskGenerationService.complete_task(task_id, cost)
   ↓
2. Publish HEALTH_TASK_COMPLETED event
   ↓
3. UnifiedExpenseService handler (Automatic pattern only)
   - Create expense record
   - Category: "Health & Medicine" (medication) or "Health & Medicine" (vaccination)
   - Description: "[medication_name] - Week X"
   - Amount: cost (entered by farmer)
   - Link to batch
   - Link to health task
   ↓
4. Return success with expense_id
```

### Stock Purchase Integration

```
USER ACTION: Record stock purchase

1. StorageIntegrationService.record_purchase()
   ↓
2. Determine category (feed, medication, equipment)
   ↓
3. Publish STOCK_PURCHASE_RECORDED event
   ↓
4. UnifiedExpenseService handler (Automatic pattern only)
   - Create expense record
   - Category: Based on item type
   - Description: "[item_name] - [quantity] [unit]"
   - Amount: purchase_cost
   - Link to batch (if allocated)
   - Link to stock record
   ↓
5. Return success with expense_id
```

### Dual Feed Pattern Integration

**Automatic (Intensive) Pattern:**
- All integrations active
- Expenses auto-created from feed, health, stock
- Full dovetail synergy

**Flexible (Semi-Intensive) Pattern:**
- Integrations disabled
- Farmer manually enters all expenses
- No automatic recording

**Implementation:**
```python
def record_expense_from_event(event: BatchEvent, batch: Batch):
    # Check production system
    if batch.production_system == "intensive":
        # Automatic pattern - create expense
        expense = create_expense(event.data)
        return expense
    else:
        # Flexible pattern - skip automatic recording
        # Farmer handles manually
        return None
```

---

## Cost Privacy

### Privacy Feature

**Purpose:** Hide financial data from workers/visitors

**How It Works:**
1. Farmer toggles cost privacy in Settings
2. User preference saved in database
3. Financial data hidden across all pages
4. Eye icon toggle to temporarily reveal data

**What Gets Hidden:**
- Expense amounts
- Revenue amounts
- Profit/loss values
- ROI percentages
- Cost breakdowns
- Financial charts (values hidden, structure shown)

**What Stays Visible:**
- Batch count
- Population numbers
- Mortality rates
- Task completion status
- Non-financial metrics

**Display When Hidden:**
```
Total Costs: ●●●●
Revenue: ●●●●
Net Profit: ●●●●
ROI: ●●●●
```

**Toggle Behavior:**
- Click eye icon → Temporarily reveal data
- Data visible for 30 seconds
- Auto-hide after timeout
- Or click eye icon again to hide immediately

---

## Sales Estimation

### Species-Specific Estimation Formulas

#### Broilers (6-8 weeks)

```
ESTIMATION:
estimated_revenue = current_population × expected_weight × market_price

WHERE:
- current_population = initial - mortality - culled - sold
- expected_weight = WEIGHT_TABLE[species][current_week]
- market_price = current_market_price_per_kg

EXAMPLE (Week 6):
- Population: 480 birds
- Expected weight: 2.1 kg per bird
- Market price: GHS 3.20/kg
- Estimated revenue: 480 × 2.1 × 3.20 = GHS 3,226

DISPLAY:
"Estimated Revenue: GHS 3,226"
"Based on: 480 birds × 2.1kg × GHS 3.20/kg"
"Market price updated: 2 days ago"
```

#### Layers (12+ months)

```
ESTIMATION:
estimated_revenue = (daily_eggs × egg_price × days_remaining) + spent_layer_value

WHERE:
- daily_eggs = current_population × production_rate
- production_rate = PRODUCTION_TABLE[current_week]
- egg_price = current_market_price_per_crate
- days_remaining = (production_end_week - current_week) × 7
- spent_layer_value = current_population × spent_layer_price

EXAMPLE (Week 30, 12 months remaining):
- Population: 295 birds
- Production rate: 85%
- Daily eggs: 295 × 0.85 = 251 eggs (8.4 crates)
- Egg price: GHS 18/crate
- Days remaining: 365 days
- Egg revenue: 8.4 × 18 × 365 = GHS 55,188
- Spent layer value: 295 × 15 = GHS 4,425
- Total estimated revenue: GHS 59,613

DISPLAY:
"Estimated Revenue: GHS 59,613"
"Egg sales: GHS 55,188 (365 days)"
"Spent layers: GHS 4,425 (end of cycle)"
```

#### Ducks (10 weeks, dual-purpose)

```
ESTIMATION:
estimated_revenue = egg_revenue + meat_revenue

WHERE:
- egg_revenue = (daily_eggs × egg_price × days_to_sale) if week >= 20
- meat_revenue = current_population × expected_weight × meat_price
- daily_eggs = current_population × 0.80 (duck production rate)
- egg_price = duck_egg_price (premium over chicken eggs)

EXAMPLE (Week 8):
- Population: 95 birds
- Expected weight: 2.5 kg per bird
- Meat price: GHS 4.50/kg (premium)
- Meat revenue: 95 × 2.5 × 4.50 = GHS 1,069
- Egg revenue: Not yet (starts Week 20)
- Total estimated revenue: GHS 1,069

DISPLAY:
"Estimated Revenue: GHS 1,069"
"Based on: 95 birds × 2.5kg × GHS 4.50/kg"
"Egg production starts Week 20"
```

#### Turkeys (16 weeks, seasonal premium)

```
ESTIMATION:
estimated_revenue = current_population × expected_weight × seasonal_price

WHERE:
- expected_weight = WEIGHT_TABLE['turkey'][current_week]
- seasonal_price = holiday_premium_price (if near holiday)
- base_price = GHS 5.00/kg
- holiday_premium = base_price × 1.5 (Christmas/New Year)

EXAMPLE (Week 14, 2 weeks to Christmas):
- Population: 48 birds
- Expected weight: 8 kg per bird
- Holiday premium price: GHS 7.50/kg
- Estimated revenue: 48 × 8 × 7.50 = GHS 2,880

DISPLAY:
"Estimated Revenue: GHS 2,880"
"Based on: 48 birds × 8kg × GHS 7.50/kg"
"🎄 Holiday premium pricing (50% above base)"
```

---

## Cost Estimates Per Species

### Typical Cost Breakdown (West African Context)

#### Broilers (8-week cycle, 500 birds)

**Feed Costs (60-65% of total):**
- Starter (Week 0-2): 500 birds × 0.025kg/day × 14 days × GHS 2.80/kg = GHS 490
- Grower (Week 3-5): 480 birds × 0.095kg/day × 21 days × GHS 2.60/kg = GHS 2,490
- Finisher (Week 6-8): 470 birds × 0.170kg/day × 21 days × GHS 2.50/kg = GHS 4,180
- **Total Feed:** GHS 7,160

**Health Costs (8-12% of total):**
- Vaccinations (6 protocols): GHS 600
- Anti-stress (post-vaccination): GHS 200
- Emergency medications (10% flock): GHS 300
- **Total Health:** GHS 1,100

**Chick Costs (15-20% of total):**
- Day-old chicks: 500 × GHS 3.50 = GHS 1,750

**Other Costs (8-10% of total):**
- Labor: GHS 400
- Utilities (electricity, water): GHS 300
- Bedding/litter: GHS 200
- **Total Other:** GHS 900

**TOTAL ESTIMATED COST:** GHS 10,910 (GHS 22.73 per bird)
**EXPECTED REVENUE:** 470 birds × 2.8kg × GHS 3.20/kg = GHS 4,198
**EXPECTED PROFIT:** GHS 4,198 - GHS 10,910 = **-GHS 6,712 (LOSS)**

**Note:** This shows why accurate cost tracking is CRITICAL. Many farmers lose money without realizing it.

---

#### Layers (68-week cycle, 300 birds)

**Feed Costs (55-60% of total):**
- Starter (Week 0-6): 300 birds × 0.040kg/day × 42 days × GHS 2.90/kg = GHS 1,460
- Grower (Week 7-16): 295 birds × 0.075kg/day × 70 days × GHS 2.70/kg = GHS 4,180
- Pre-Lay (Week 17-20): 290 birds × 0.110kg/day × 28 days × GHS 3.00/kg = GHS 2,680
- Layer (Week 21-68): 285 birds × 0.120kg/day × 336 days × GHS 3.20/kg = GHS 36,710
- **Total Feed:** GHS 45,030

**Health Costs (5-8% of total):**
- Vaccinations (12 protocols): GHS 1,800
- Deworming (monthly): GHS 1,200
- Emergency medications: GHS 800
- **Total Health:** GHS 3,800

**Chick Costs (8-10% of total):**
- Day-old pullets: 300 × GHS 18.00 = GHS 5,400

**Other Costs (15-20% of total):**
- Labor (68 weeks): GHS 8,000
- Utilities: GHS 4,000
- Bedding/litter: GHS 2,000
- **Total Other:** GHS 14,000

**TOTAL ESTIMATED COST:** GHS 68,230 (GHS 227.43 per bird)
**EXPECTED REVENUE:**
- Egg sales: 285 birds × 0.85 rate × 336 days × 30 eggs/crate × GHS 18/crate = GHS 146,664
- Spent layers: 285 × GHS 15 = GHS 4,275
- **Total Revenue:** GHS 150,939
**EXPECTED PROFIT:** GHS 150,939 - GHS 68,230 = **+GHS 82,709 (121% ROI)**

---

#### Ducks (10-week cycle, 100 birds, semi-intensive)

**Feed Costs (45-50% of total - reduced by foraging):**
- Starter (Week 0-4): 100 birds × 0.045kg/day × 28 days × GHS 2.90/kg = GHS 365
- Grower (Week 5-7): 98 birds × 0.095kg/day × 21 days × GHS 2.70/kg = GHS 527
- Finisher (Week 8-10, 20% foraging): 95 birds × 0.140kg/day × 0.80 × 21 days × GHS 2.60/kg = GHS 582
- **Total Feed:** GHS 1,474

**Health Costs (10-12% of total):**
- Vaccinations (6 protocols): GHS 300
- Niacin supplementation (CRITICAL): GHS 80
- Deworming: GHS 100
- **Total Health:** GHS 480

**Duckling Costs (20-25% of total):**
- Day-old ducklings: 100 × GHS 8.00 = GHS 800

**Other Costs (15-18% of total):**
- Labor: GHS 300
- Water (2-3x chickens): GHS 150
- Bedding: GHS 100
- **Total Other:** GHS 550

**TOTAL ESTIMATED COST:** GHS 3,304 (GHS 34.78 per bird)
**EXPECTED REVENUE:** 95 birds × 2.5kg × GHS 4.50/kg = GHS 1,069
**EXPECTED PROFIT:** GHS 1,069 - GHS 3,304 = **-GHS 2,235 (LOSS)**

**Note:** Ducks for meat alone are often unprofitable. Dual-purpose (eggs + meat) or layer ducks are more viable.

---

#### Turkeys (16-week cycle, 50 birds, semi-intensive)

**Feed Costs (50-55% of total - reduced by foraging):**
- Starter (Week 0-7): 50 birds × 0.060kg/day × 49 days × GHS 3.00/kg = GHS 441
- Grower (Week 8-11, 15% foraging): 48 birds × 0.150kg/day × 0.85 × 28 days × GHS 2.80/kg = GHS 1,428
- Finisher (Week 12-16, 20% foraging): 47 birds × 0.220kg/day × 0.80 × 35 days × GHS 2.70/kg = GHS 2,470
- **Total Feed:** GHS 4,339

**Health Costs (12-15% of total):**
- Vaccinations (12 protocols): GHS 800
- Blackhead prevention (CRITICAL): GHS 400
- Deworming: GHS 150
- **Total Health:** GHS 1,350

**Poult Costs (15-20% of total):**
- Day-old turkey poults: 50 × GHS 25.00 = GHS 1,250

**Other Costs (15-18% of total):**
- Labor: GHS 600
- Utilities: GHS 300
- Bedding (higher space needs): GHS 200
- **Total Other:** GHS 1,100

**TOTAL ESTIMATED COST:** GHS 8,039 (GHS 170.83 per bird)
**EXPECTED REVENUE (Holiday Premium):** 47 birds × 8kg × GHS 7.50/kg = GHS 2,820
**EXPECTED PROFIT:** GHS 2,820 - GHS 8,039 = **-GHS 5,219 (LOSS)**

**Note:** Turkeys require holiday premium pricing (GHS 7.50/kg vs GHS 5.00/kg base) to be profitable. Timing is critical.

---

### Cost Tracking Recommendations

**For Farmers:**
1. **Track EVERY expense** - Small costs add up (bedding, transport, etc.)
2. **Monitor feed costs weekly** - Feed is 50-65% of total costs
3. **Calculate cost per bird** - Know your break-even point
4. **Compare across batches** - Identify what works
5. **Use automatic expense creation** - Reduces manual entry errors

**System Features:**
- Automatic expense creation from feed/health systems
- Cost per bird calculation (real-time)
- Profit/loss tracking (per batch)
- ROI calculation (percentage)
- Cost privacy (hide from workers)

---

## UI Wireframes

### 1. Finance Dashboard (Overview Tab)

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: #f9fafb; padding: 20px; }
.dashboard-container { max-width: 1200px; margin: 0 auto; }
.dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.dashboard-title { font-size: 24px; font-weight: 600; color: #111827; }
.privacy-toggle { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: white; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; }
.privacy-icon { font-size: 18px; }
.privacy-text { font-size: 14px; color: #374151; }
.summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.summary-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.card-label { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
.card-value { font-size: 28px; font-weight: 600; color: #111827; margin-bottom: 4px; }
.card-value.positive { color: #16a34a; }
.card-value.negative { color: #dc2626; }
.card-trend { font-size: 13px; color: #6b7280; }
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
.chart-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.chart-title { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 16px; }
.chart-placeholder { height: 250px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af; }
.recent-section { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.section-title { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 16px; }
.transaction-table { width: 100%; border-collapse: collapse; }
.transaction-table th { text-align: left; font-size: 13px; font-weight: 500; color: #6b7280; padding: 12px; border-bottom: 1px solid #e5e7eb; }
.transaction-table td { font-size: 14px; color: #374151; padding: 12px; border-bottom: 1px solid #f3f4f6; }
.category-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.badge-feed { background: #dcfce7; color: #166534; }
.badge-health { background: #dbeafe; color: #1e40af; }
.badge-labor { background: #fef3c7; color: #92400e; }
.source-badge { padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; }
.source-auto { background: #f0fdf4; color: #166534; }
.source-manual { background: #f3f4f6; color: #6b7280; }
</style>
</head>
<body>
<div class="dashboard-container">
  <div class="dashboard-header">
    <div class="dashboard-title">Financial Overview</div>
    <div class="privacy-toggle">
      <span class="privacy-icon">👁️</span>
      <span class="privacy-text">Show Costs</span>
    </div>
  </div>
  
  <div class="summary-cards">
    <div class="summary-card">
      <div class="card-label">Total Expenses</div>
      <div class="card-value">GHS 2,450</div>
      <div class="card-trend">↑ 12% this week</div>
    </div>
    <div class="summary-card">
      <div class="card-label">Total Revenue</div>
      <div class="card-value">GHS 3,200</div>
      <div class="card-trend">Estimated</div>
    </div>
    <div class="summary-card">
      <div class="card-label">Net Profit</div>
      <div class="card-value positive">+GHS 750</div>
      <div class="card-trend">30.6% ROI</div>
    </div>
    <div class="summary-card">
      <div class="card-label">Cost Per Bird</div>
      <div class="card-value">GHS 5.10</div>
      <div class="card-trend">480 birds</div>
    </div>
  </div>
  
  <div class="charts-grid">
    <div class="chart-card">
      <div class="chart-title">Expense Breakdown</div>
      <div class="chart-placeholder">Pie Chart: Feed 49%, Health 16%, Labor 14%, Utilities 12%, Equipment 9%</div>
    </div>
    <div class="chart-card">
      <div class="chart-title">Revenue vs Expenses</div>
      <div class="chart-placeholder">Line Chart: Revenue and Expense trends over time</div>
    </div>
  </div>
  
  <div class="recent-section">
    <div class="section-title">Recent Transactions</div>
    <table class="transaction-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Jan 16</td>
          <td><span class="category-badge badge-feed">Feed</span></td>
          <td>Week 6 finisher feed formulation</td>
          <td>GHS 450.00</td>
          <td><span class="source-badge source-auto">Auto</span></td>
        </tr>
        <tr>
          <td>Jan 16</td>
          <td><span class="category-badge badge-health">Health</span></td>
          <td>Oxytetracycline - Week 5</td>
          <td>GHS 180.00</td>
          <td><span class="source-badge source-auto">Auto</span></td>
        </tr>
        <tr>
          <td>Jan 15</td>
          <td><span class="category-badge badge-labor">Labor</span></td>
          <td>Night shift - 8 hours</td>
          <td>GHS 320.00</td>
          <td><span class="source-badge source-manual">Manual</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
</body>
</html>
```

### 2. Manual Expense Entry Modal

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: rgba(0,0,0,0.5); padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.modal { background: white; border-radius: 12px; max-width: 500px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
.modal-header { padding: 24px; border-bottom: 1px solid #e5e7eb; }
.modal-title { font-size: 18px; font-weight: 600; color: #111827; }
.modal-content { padding: 24px; }
.form-group { margin-bottom: 20px; }
.form-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
.form-select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
.form-textarea { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: inherit; resize: vertical; min-height: 80px; }
.form-hint { font-size: 12px; color: #6b7280; margin-top: 4px; }
.category-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.category-option { padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.2s; }
.category-option:hover { border-color: #16a34a; background: #f0fdf4; }
.category-option.selected { border-color: #16a34a; background: #f0fdf4; }
.category-icon { font-size: 24px; margin-bottom: 8px; }
.category-label { font-size: 12px; color: #374151; font-weight: 500; }
.modal-actions { padding: 24px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; }
.btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; flex: 1; }
.btn-secondary { background: #f3f4f6; color: #374151; }
.btn-primary { background: #16a34a; color: white; }
</style>
</head>
<body>
<div class="modal">
  <div class="modal-header">
    <div class="modal-title">Add Expense</div>
  </div>
  
  <div class="modal-content">
    <div class="form-group">
      <label class="form-label">Expense Category *</label>
      <div class="category-grid">
        <div class="category-option selected">
          <div class="category-icon">🌾</div>
          <div class="category-label">Feed</div>
        </div>
        <div class="category-option">
          <div class="category-icon">💊</div>
          <div class="category-label">Health</div>
        </div>
        <div class="category-option">
          <div class="category-icon">👨‍🌾</div>
          <div class="category-label">Labor</div>
        </div>
        <div class="category-option">
          <div class="category-icon">⚡</div>
          <div class="category-label">Utilities</div>
        </div>
        <div class="category-option">
          <div class="category-icon">🔧</div>
          <div class="category-label">Equipment</div>
        </div>
        <div class="category-option">
          <div class="category-icon">🚚</div>
          <div class="category-label">Transport</div>
        </div>
        <div class="category-option">
          <div class="category-icon">🏠</div>
          <div class="category-label">Facility</div>
        </div>
        <div class="category-option">
          <div class="category-icon">🐣</div>
          <div class="category-label">Chicks</div>
        </div>
        <div class="category-option">
          <div class="category-icon">📄</div>
          <div class="category-label">Other</div>
        </div>
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Amount (GHS) *</label>
      <input type="number" class="form-input" placeholder="Enter amount..." step="0.01" required>
    </div>
    
    <div class="form-group">
      <label class="form-label">Description *</label>
      <input type="text" class="form-input" placeholder="e.g., Paid John for feeding birds this week" required>
      <div class="form-hint">Be specific to help you remember later</div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Date *</label>
      <input type="date" class="form-input" required>
    </div>
    
    <div class="form-group">
      <label class="form-label">Notes (Optional)</label>
      <textarea class="form-textarea" placeholder="Additional details..."></textarea>
    </div>
  </div>
  
  <div class="modal-actions">
    <button class="btn btn-secondary">Cancel</button>
    <button class="btn btn-primary">Add Expense</button>
  </div>
</div>
</body>
</html>
```

### 3. Revenue Entry Modal

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: rgba(0,0,0,0.5); padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.modal { background: white; border-radius: 12px; max-width: 500px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
.modal-header { padding: 24px; border-bottom: 1px solid #e5e7eb; }
.modal-title { font-size: 18px; font-weight: 600; color: #111827; }
.modal-content { padding: 24px; }
.form-group { margin-bottom: 20px; }
.form-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
.form-select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.calc-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-top: 12px; }
.calc-label { font-size: 13px; color: #166534; margin-bottom: 4px; }
.calc-value { font-size: 18px; font-weight: 600; color: #16a34a; }
.modal-actions { padding: 24px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; }
.btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; flex: 1; }
.btn-secondary { background: #f3f4f6; color: #374151; }
.btn-primary { background: #16a34a; color: white; }
</style>
</head>
<body>
<div class="modal">
  <div class="modal-header">
    <div class="modal-title">Record Revenue</div>
  </div>
  
  <div class="modal-content">
    <div class="form-group">
      <label class="form-label">Revenue Type *</label>
      <select class="form-select">
        <option value="">Select revenue type...</option>
        <option value="egg_sales">Egg Sales</option>
        <option value="bird_sales">Bird Sales (Live)</option>
        <option value="meat_sales">Meat Sales (Processed)</option>
        <option value="manure_sales">Manure Sales</option>
        <option value="other">Other Revenue</option>
      </select>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Quantity *</label>
        <input type="number" class="form-input" placeholder="e.g., 50" required>
      </div>
      <div class="form-group">
        <label class="form-label">Unit *</label>
        <select class="form-select">
          <option value="birds">Birds</option>
          <option value="kg">Kilograms</option>
          <option value="crates">Crates</option>
          <option value="eggs">Eggs</option>
          <option value="bags">Bags</option>
        </select>
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Price Per Unit (GHS) *</label>
      <input type="number" class="form-input" placeholder="e.g., 25.00" step="0.01" required>
      <div class="calc-box">
        <div class="calc-label">Total Revenue</div>
        <div class="calc-value">GHS 1,250.00</div>
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Sale Date *</label>
      <input type="date" class="form-input" required>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Payment Method</label>
        <select class="form-select">
          <option value="cash">Cash</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="credit">Credit</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Payment Status</label>
        <select class="form-select">
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
        </select>
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Buyer Information (Optional)</label>
      <input type="text" class="form-input" placeholder="Customer name or details...">
    </div>
  </div>
  
  <div class="modal-actions">
    <button class="btn btn-secondary">Cancel</button>
    <button class="btn btn-primary">Record Revenue</button>
  </div>
</div>
</body>
</html>
```

### 4. Cost Privacy (Hidden State)

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: #f9fafb; padding: 20px; }
.dashboard-container { max-width: 1200px; margin: 0 auto; }
.dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.dashboard-title { font-size: 24px; font-weight: 600; color: #111827; }
.privacy-toggle { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; cursor: pointer; }
.privacy-icon { font-size: 18px; }
.privacy-text { font-size: 14px; color: #991b1b; font-weight: 500; }
.summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.summary-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.card-label { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
.card-value { font-size: 28px; font-weight: 600; color: #6b7280; margin-bottom: 4px; }
.card-trend { font-size: 13px; color: #9ca3af; }
.info-banner { background: #fef3c7; border: 1px solid #fde047; border-radius: 8px; padding: 12px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
.info-icon { font-size: 20px; }
.info-text { font-size: 14px; color: #854d0e; }
</style>
</head>
<body>
<div class="dashboard-container">
  <div class="dashboard-header">
    <div class="dashboard-title">Financial Overview</div>
    <div class="privacy-toggle">
      <span class="privacy-icon">🔒</span>
      <span class="privacy-text">Costs Hidden</span>
    </div>
  </div>
  
  <div class="info-banner">
    <span class="info-icon">ℹ️</span>
    <span class="info-text">Financial data is hidden for privacy. Click "Costs Hidden" to reveal.</span>
  </div>
  
  <div class="summary-cards">
    <div class="summary-card">
      <div class="card-label">Total Expenses</div>
      <div class="card-value">●●●●</div>
      <div class="card-trend">Hidden</div>
    </div>
    <div class="summary-card">
      <div class="card-label">Total Revenue</div>
      <div class="card-value">●●●●</div>
      <div class="card-trend">Hidden</div>
    </div>
    <div class="summary-card">
      <div class="card-label">Net Profit</div>
      <div class="card-value">●●●●</div>
      <div class="card-trend">Hidden</div>
    </div>
    <div class="summary-card">
      <div class="card-label">Cost Per Bird</div>
      <div class="card-value">●●●●</div>
      <div class="card-trend">480 birds</div>
    </div>
  </div>
</div>
</body>
</html>
```

---

## Backend Integration

### Database Models

#### Expense Model

```python
class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, index=True)
    
    # Core expense data
    category = Column(String(50), nullable=False, index=True)  # feed, health, labor, utilities, equipment, transport, facility, birds, other
    amount_ghs = Column(Numeric(10, 2), nullable=False)
    description = Column(Text, nullable=False)
    expense_date = Column(Date, nullable=False, index=True)
    
    # Receipt and notes
    receipt_photo = Column(String(500), nullable=True)
    receipt_notes = Column(Text, nullable=True)
    entered_later = Column(Boolean, default=False)
    
    # Integration tracking
    source_system = Column(String(50), nullable=True)  # feed_calculator, water_health_system, storage_system, manual
    auto_generated = Column(Boolean, default=False)
    reference_id = Column(String(36), nullable=True)  # Reference to source record (formulation_id, task_id, purchase_id)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    batch = relationship("Batch", back_populates="expenses")
    
    # Indexes
    __table_args__ = (
        Index('idx_expense_batch_date', 'batch_id', 'expense_date'),
        Index('idx_expense_category', 'category'),
        Index('idx_expense_source', 'source_system'),
    )
```

#### Revenue Model

```python
class Revenue(Base):
    __tablename__ = "revenues"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, index=True)
    
    # Core revenue data
    revenue_type = Column(String(50), nullable=False, index=True)  # egg_sales, bird_sales, meat_sales, manure_sales, other
    amount_ghs = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(20), nullable=False)  # birds, kg, crates, eggs, bags
    price_per_unit = Column(Numeric(10, 2), nullable=False)
    sale_date = Column(Date, nullable=False, index=True)
    
    # Customer and transaction details
    buyer_info = Column(String(255), nullable=True)
    payment_method = Column(String(50), nullable=True)  # cash, mobile_money, credit
    payment_status = Column(String(50), default="pending")  # paid, pending, partial
    
    # Notes and references
    notes = Column(Text, nullable=True)
    receipt_photo = Column(String(500), nullable=True)
    
    # Integration tracking
    source_system = Column(String(50), nullable=True)  # manual, egg_tracker, sales_system
    auto_generated = Column(Boolean, default=False)
    reference_id = Column(String(36), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    batch = relationship("Batch", back_populates="revenues")
    
    # Indexes
    __table_args__ = (
        Index('idx_revenue_batch_date', 'batch_id', 'sale_date'),
        Index('idx_revenue_type', 'revenue_type'),
        Index('idx_revenue_source', 'source_system'),
    )
```

#### Enhanced Batch Model (Financial Fields)

```python
# Add to existing Batch model
class Batch(Base):
    # ... existing fields ...
    
    # Financial tracking
    total_costs_ghs = Column(Numeric(12, 2), default=0)
    total_revenue_ghs = Column(Numeric(12, 2), default=0)
    profit_ghs = Column(Numeric(12, 2), default=0)
    roi_percent = Column(Numeric(5, 2), nullable=True)
    
    # Relationships
    expenses = relationship("Expense", back_populates="batch", cascade="all, delete-orphan")
    revenues = relationship("Revenue", back_populates="batch", cascade="all, delete-orphan")
```

#### UserPreferences Model (Cost Privacy)

```python
class UserPreferences(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Cost privacy
    hide_costs = Column(Boolean, default=False)
    
    # Other preferences
    theme = Column(String(20), default="light")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="preferences")
```

### API Endpoints

#### Expenses

**POST /api/v1/finance/expenses**
- Create manual expense
- Request: `{batch_id, category, amount_ghs, description, expense_date, notes}`
- Response: `{expense, batch_updated}`

**GET /api/v1/finance/expenses**
- Get all expenses with filters
- Query params: `batch_id`, `category`, `start_date`, `end_date`, `source_system`
- Response: `{expenses: [{id, category, amount, description, date, source}]}`

**GET /api/v1/finance/expenses/batch/{batch_id}/summary**
- Get expense summary for a batch
- Response: `{total_expenses, category_breakdown, source_breakdown, weekly_trends}`

#### Revenue

**POST /api/v1/finance/revenue**
- Create manual revenue
- Request: `{batch_id, revenue_type, quantity, unit, price_per_unit, sale_date, buyer_info, payment_method, payment_status}`
- Response: `{revenue, batch_updated, population_updated}`

**GET /api/v1/finance/revenue**
- Get all revenue with filters
- Query params: `batch_id`, `revenue_type`, `start_date`, `end_date`
- Response: `{revenues: [{id, type, amount, quantity, unit, date, payment_status}]}`

**GET /api/v1/finance/revenue/batch/{batch_id}/summary**
- Get revenue summary for a batch
- Response: `{total_revenue, type_breakdown, payment_status_breakdown}`

#### Financial Summary

**GET /api/v1/finance/batch/{batch_id}/summary**
- Get complete financial summary
- Response: `{total_costs, total_revenue, net_profit, roi_percent, expense_breakdown, revenue_breakdown}`

**GET /api/v1/finance/batch/{batch_id}/estimation**
- Get sales estimation for a batch
- Response: `{estimated_revenue, calculation_method, market_price, expected_weight, confidence}`

#### Cost Privacy

**GET /api/v1/finance/preferences**
- Get user's cost privacy preferences
- Response: `{hide_costs, theme}`

**PUT /api/v1/finance/preferences**
- Update cost privacy preferences
- Request: `{hide_costs}`
- Response: `{preferences}`

### UnifiedExpenseService

```python
class UnifiedExpenseService:
    """Unified service for expense and revenue management"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.expense_repo = ExpenseRepository(session)
        self.revenue_repo = RevenueRepository(session)
        self.batch_repo = BatchRepository(session)
    
    async def record_feed_expense(self, batch_id: int, formulation_data: dict) -> Expense:
        """Record expense from feed formulation"""
        expense = Expense(
            batch_id=batch_id,
            category="feed",
            amount_ghs=formulation_data['total_cost_ghs'],
            description=f"Week {formulation_data['week']} feed formulation - {formulation_data['recipe_type']}",
            expense_date=date.today(),
            source_system="feed_calculator",
            auto_generated=True,
            reference_id=formulation_data['formulation_id']
        )
        
        await self.expense_repo.create(expense)
        await self._update_batch_financials(batch_id)
        
        return expense
    
    async def record_health_expense(self, batch_id: int, task_data: dict) -> Expense:
        """Record expense from health task completion"""
        expense = Expense(
            batch_id=batch_id,
            category="health",
            amount_ghs=task_data['cost'],
            description=f"{task_data['medication_name']} - Week {task_data['week']}",
            expense_date=date.today(),
            source_system="water_health_system",
            auto_generated=True,
            reference_id=task_data['task_id']
        )
        
        await self.expense_repo.create(expense)
        await self._update_batch_financials(batch_id)
        
        return expense
    
    async def record_bird_sales(self, batch_id: int, sales_data: dict) -> Revenue:
        """Record revenue from bird sales"""
        revenue = Revenue(
            batch_id=batch_id,
            revenue_type="bird_sales",
            amount_ghs=sales_data['quantity'] * sales_data['price_per_bird'],
            quantity=sales_data['quantity'],
            unit="birds",
            price_per_unit=sales_data['price_per_bird'],
            sale_date=sales_data['sale_date'],
            buyer_info=sales_data.get('buyer_info'),
            payment_method=sales_data.get('payment_method'),
            payment_status=sales_data.get('payment_status', 'pending'),
            source_system="manual",
            auto_generated=False
        )
        
        await self.revenue_repo.create(revenue)
        
        # Update batch population
        batch = await self.batch_repo.get(batch_id)
        batch.current_quantity -= sales_data['quantity']
        
        await self._update_batch_financials(batch_id)
        
        return revenue
    
    async def _update_batch_financials(self, batch_id: int):
        """Update batch financial totals"""
        # Get all expenses
        expenses = await self.expense_repo.get_by_batch(batch_id)
        total_expenses = sum(e.amount_ghs for e in expenses)
        
        # Get all revenues
        revenues = await self.revenue_repo.get_by_batch(batch_id)
        total_revenue = sum(r.amount_ghs for r in revenues)
        
        # Calculate profit and ROI
        net_profit = total_revenue - total_expenses
        roi_percent = (net_profit / total_expenses * 100) if total_expenses > 0 else 0
        
        # Update batch
        batch = await self.batch_repo.get(batch_id)
        batch.total_costs_ghs = total_expenses
        batch.total_revenue_ghs = total_revenue
        batch.profit_ghs = net_profit
        batch.roi_percent = roi_percent
        
        await self.session.commit()
```

---

## Event-Driven Integration

### Event Types

```python
class FinanceEventType(str, Enum):
    EXPENSE_CREATED = "expense_created"
    REVENUE_CREATED = "revenue_created"
    BATCH_FINANCIALS_UPDATED = "batch_financials_updated"
```

### Event Payloads

```python
@dataclass
class ExpenseCreatedEvent:
    event_type: FinanceEventType = FinanceEventType.EXPENSE_CREATED
    expense_id: str
    batch_id: int
    category: str
    amount_ghs: float
    source_system: str
    auto_generated: bool
    timestamp: datetime = field(default_factory=datetime.utcnow)

@dataclass
class RevenueCreatedEvent:
    event_type: FinanceEventType = FinanceEventType.REVENUE_CREATED
    revenue_id: str
    batch_id: int
    revenue_type: str
    amount_ghs: float
    quantity: float
    unit: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
```

### Integration Flows

#### Feed Formulation → Expense

```
USER ACTION: Confirm feed formulation

1. FeedFormulationService.confirm_recipe()
   ↓
2. Publish FEED_FORMULATION_CONFIRMED event
   ↓
3. UnifiedExpenseService handler (Automatic pattern only)
   - Create expense record
   - Category: "feed"
   - Amount: formulation.total_cost_ghs
   - Description: "Week X feed formulation"
   - Link to formulation_id
   ↓
4. Publish EXPENSE_CREATED event
   ↓
5. BatchService handler
   - Update batch.total_costs_ghs
   - Recalculate profit and ROI
   ↓
6. Publish BATCH_FINANCIALS_UPDATED event
   ↓
7. Frontend receives update
   - Refresh financial dashboard
   - Show notification: "Expense recorded: GHS X"
```

#### Health Task → Expense

```
USER ACTION: Complete health task with cost

1. HealthTaskGenerationService.complete_task(task_id, cost)
   ↓
2. Publish HEALTH_TASK_COMPLETED event
   ↓
3. UnifiedExpenseService handler (Automatic pattern only)
   - Create expense record
   - Category: "health"
   - Amount: cost (entered by farmer)
   - Description: "[medication_name] - Week X"
   - Link to task_id
   ↓
4. Publish EXPENSE_CREATED event
   ↓
5. BatchService handler
   - Update batch.total_costs_ghs
   - Recalculate profit and ROI
   ↓
6. Frontend receives update
   - Refresh financial dashboard
```

#### Bird Sales → Revenue + Population Update

```
USER ACTION: Record bird sales

1. UnifiedExpenseService.record_bird_sales()
   ↓
2. Create revenue record
   ↓
3. Update batch population (reduce bird count)
   ↓
4. Publish REVENUE_CREATED event
   ↓
5. BatchService handler
   - Update batch.total_revenue_ghs
   - Update batch.current_quantity
   - Recalculate profit and ROI
   ↓
6. Publish BATCH_FINANCIALS_UPDATED event
   ↓
7. Frontend receives update
   - Refresh financial dashboard
   - Refresh batch dashboard (population updated)
   - Show notification: "Revenue recorded: GHS X, Population: Y birds"
```

---

## Acceptance Criteria

### Functional Requirements

**Expense Management:**
- [ ] 9 expense categories available
- [ ] Manual expense entry with category selection
- [ ] Automatic expense creation from feed formulation (Automatic pattern)
- [ ] Automatic expense creation from health tasks (Automatic pattern)
- [ ] Automatic expense creation from stock purchases (Automatic pattern)
- [ ] Expense list with filters (category, date range, source)
- [ ] Expense details view with receipt photo

**Revenue Management:**
- [ ] 5 revenue types available
- [ ] Egg sales recording (layers, ducks, geese, quail, guinea fowl only)
- [ ] Bird sales recording (all species)
- [ ] Meat sales recording (all species)
- [ ] Manure sales recording (all species)
- [ ] Revenue list with filters (type, date range, payment status)
- [ ] Payment status tracking (paid, pending, partial)

**Financial Summary:**
- [ ] Total expenses calculated in real-time
- [ ] Total revenue calculated in real-time
- [ ] Net profit calculated (revenue - expenses)
- [ ] ROI calculated ((profit / expenses) × 100)
- [ ] Expense breakdown by category (9 categories)
- [ ] Revenue breakdown by type (5 types)
- [ ] Source breakdown (automatic vs manual)

**Cost Privacy:**
- [ ] Cost privacy toggle in Settings
- [ ] Financial data hidden when privacy enabled
- [ ] Eye icon toggle to temporarily reveal data
- [ ] Privacy preference saved in database
- [ ] Privacy applies to: expenses, revenue, profit, ROI
- [ ] Privacy does NOT apply to: batch count, population, mortality

**Sales Estimation:**
- [ ] Species-specific estimation formulas (4 species)
- [ ] Broilers: population × weight × market price
- [ ] Layers: egg production × price × days + spent layer value
- [ ] Ducks: egg revenue + meat revenue
- [ ] Turkeys: population × weight × seasonal premium price
- [ ] Market price updates (manual or API)
- [ ] Estimation confidence indicator

**Event-Driven Integration:**
- [ ] Feed formulation → Auto-create expense (Automatic pattern)
- [ ] Health task → Auto-create expense (Automatic pattern)
- [ ] Stock purchase → Auto-create expense (Automatic pattern)
- [ ] Expense created → Update batch financials
- [ ] Revenue created → Update batch financials + population
- [ ] Batch financials updated → Notify frontend

**Dual Feed Pattern Integration:**
- [ ] Automatic pattern: Full dovetail integration
- [ ] Flexible pattern: Manual expense/revenue entry
- [ ] Production system determines integration behavior

### Performance Requirements

- [ ] Expense creation < 300ms
- [ ] Revenue creation < 300ms
- [ ] Financial summary calculation < 500ms
- [ ] Dashboard load < 2 seconds
- [ ] Real-time updates < 1 second

### UI/UX Requirements

- [ ] Finance dashboard with 4 tabs (Overview, Expenses, Revenue, Reports)
- [ ] Manual expense entry modal with category grid
- [ ] Revenue entry modal with species-specific fields
- [ ] Cost privacy toggle with eye icon
- [ ] Sales estimation display with calculation breakdown
- [ ] Expense/revenue lists with filters
- [ ] Category breakdown charts
- [ ] Revenue vs expense charts

### Integration Requirements

- [ ] Feed calculator publishes FEED_FORMULATION_CONFIRMED event
- [ ] Water-health publishes HEALTH_TASK_COMPLETED event
- [ ] Stock management publishes STOCK_PURCHASE_RECORDED event
- [ ] Finance system subscribes to all integration events
- [ ] Finance system publishes EXPENSE_CREATED, REVENUE_CREATED events
- [ ] Batch system subscribes to finance events for total updates

---

## Implementation Notes

### Existing Files to Modify

**Backend:**
- `backend/app/models/finance.py` - Add Revenue model
- `backend/app/models/farm.py` - Add financial fields to Batch model
- `backend/app/models/auth.py` - Add UserPreferences model
- `backend/app/services/` - Add UnifiedExpenseService
- `backend/app/api/v1/` - Add finance.py router

**Frontend:**
- `frontend/src/pages/` - Add finance-dashboard-page.tsx
- `frontend/src/components/finance/` - Add expense/revenue components
- `frontend/src/services/` - Add financeService.ts

### New Files to Create

**Backend:**
- `backend/app/services/unified_expense_service.py`
- `backend/app/services/sales_estimation_service.py`
- `backend/app/repositories/expense_repository.py`
- `backend/app/repositories/revenue_repository.py`
- `backend/app/api/v1/finance.py`
- `backend/app/schemas/expense.py`
- `backend/app/schemas/revenue.py`

**Frontend:**
- `frontend/src/pages/finance-dashboard-page.tsx`
- `frontend/src/components/finance/expense-entry-modal.tsx`
- `frontend/src/components/finance/revenue-entry-modal.tsx`
- `frontend/src/components/finance/financial-summary-cards.tsx`
- `frontend/src/components/finance/expense-breakdown-chart.tsx`
- `frontend/src/components/finance/revenue-breakdown-chart.tsx`
- `frontend/src/components/finance/cost-privacy-toggle.tsx`
- `frontend/src/components/finance/sales-estimation-card.tsx`
- `frontend/src/services/financeService.ts`

---

## References

- **Priest Research:** file:priest/12-expense-tracking-visual-ux/
- **Backend Architecture:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/35142770-c1b0-4df2-85e2-5a839616334a
- **Frontend Architecture:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/9e3bb05f-9ca8-4cc6-9f97-a5d0eb53ae92
- **Feed Calculator System:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/fb99cad1-d468-4a18-bd81-d987f1ae6f63
- **Water-Health System:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/2a098707-5645-4c66-ba4b-27e04df312ca
- **Epic Brief:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/2c73a304-598c-472c-b79c-20584f6dc34b

---

**End of Finance System Specification**
