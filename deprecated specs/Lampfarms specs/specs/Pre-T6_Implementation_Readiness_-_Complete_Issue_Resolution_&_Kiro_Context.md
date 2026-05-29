# Pre-T6 Implementation Readiness - Complete Issue Resolution & Kiro Context

# Pre-T6 Implementation Readiness Specification

**Purpose:** Address ALL lurking issues blocking T6+ implementation and provide complete context for Kiro backend specialist agent.

**Scope:** 13 critical issues identified through comprehensive codebase analysis

**Target:** Enable seamless T6-T16 implementation without blockers

---

## 🚨 CRITICAL ISSUES IDENTIFIED (13 Total)

### **Issue #1: Setup API Schema Mismatch (CRITICAL - Blocks Login Flow)**

**Severity:** 🔴 CRITICAL  
**Impact:** Login appears to hang, setup doesn't persist  
**Location:** `backend/app/api/v1/setup.py` vs `frontend/src/services/setup-api.ts`  
**Fix Time:** 10 minutes

**Problem:**

Frontend sends (lines 65-70 in setup-api.ts):
```typescript
{
  farmData: { farmName, location, species },
  houses: [...],
  equipment: {...},
  settings: {...}
}
```

Backend expects (lines 21-26 in setup.py):
```python
{
  farm_name: str,
  location: str,
  timezone: str,
  currency: str,
  houses: [...]
}
```

**Mismatch:**
- Frontend sends `farmData.farmName` → Backend expects `farm_name`
- Frontend sends `farmData.species` → Backend doesn't expect this
- Frontend sends `equipment` → Backend doesn't expect this
- Frontend sends `settings.timezone` → Backend expects top-level `timezone`
- Frontend sends `settings.currency` → Backend expects top-level `currency`

**Solution:**

Update `backend/app/api/v1/setup.py`:

```python
class CompleteSetupRequest(BaseModel):
    farmData: dict  # {farmName, location, species}
    houses: List[dict]  # [{name, type, capacity}]
    equipment: dict  # {feeders, drinkers, heaters}
    settings: dict  # {country, currency, timezone, weightUnit}

@router.post("/complete")
async def complete_setup(
    data: CompleteSetupRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    # Extract from nested structure
    farm_name = data.farmData.get('farmName')
    location = data.farmData.get('location', '')
    species = data.farmData.get('species', [])
    timezone = data.settings.get('timezone', 'UTC')
    currency = data.settings.get('currency', 'GHS')
    
    # Create farm
    farm = Farm(
        name=farm_name,
        location=location,
        timezone=timezone,
        currency=currency,
        owner_id=current_user.id,
    )
    session.add(farm)
    await session.flush()
    
    # Create houses
    for house_data in data.houses:
        house = House(
            name=house_data.get('name'),
            capacity=house_data.get('capacity', 0),
            farm_id=farm.id,
            house_type=HouseType.OPEN,  # Map from house_data.type
        )
        session.add(house)
    
    # Update user
    current_user.farm_id = farm.id
    current_user.farm_setup_completed = True
    
    await session.commit()
    
    # Return response matching frontend expectations
    return {
        "success": True,
        "farm": {
            "id": str(farm.id),
            "name": farm.name,
            "location": farm.location,
            "species": species,
            "createdAt": farm.created_at.isoformat(),
            "updatedAt": farm.updated_at.isoformat()
        },
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "name": current_user.full_name,
            "farm_setup_completed": True
        }
    }
```

**Verification:**
```bash
# Test setup completion
curl -X POST http://localhost:8000/api/v1/setup/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "farmData": {"farmName": "Test Farm", "location": "Kumasi", "species": ["broiler"]},
    "houses": [{"name": "House A", "type": "intensive", "capacity": 1000}],
    "equipment": {"feeders": 8, "drinkers": 6},
    "settings": {"country": "Ghana", "currency": "GHS", "timezone": "Africa/Accra"}
  }'
```

---

### **Issue #2: Dashboard Using Mock Data (HIGH - Poor UX)**

**Severity:** 🟠 HIGH  
**Impact:** Dashboard shows hardcoded fake data  
**Location:** `frontend/src/routes/_authenticated/dashboard.tsx`  
**Fix Time:** 1 hour

**Problem:**

Dashboard page has hardcoded stats (lines 7-28):
```typescript
const statCards = [
  { label: 'Active Batches', value: 12 },  // ❌ Hardcoded
  { label: 'Total Birds', value: '24,500' },  // ❌ Hardcoded
  ...
]
```

**Solution:**

Update `frontend/src/routes/_authenticated/dashboard.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/services/dashboard-api'

export function DashboardPage() {
  // Fetch real data
  const { data: quickStats, isLoading } = useQuery({
    queryKey: ['dashboard', 'quick-stats'],
    queryFn: dashboardApi.getQuickStats
  })
  
  const { data: activeBatches } = useQuery({
    queryKey: ['dashboard', 'active-batches'],
    queryFn: dashboardApi.getActiveBatches
  })
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      <StatCard
        label="Active Batches"
        value={quickStats?.active_batches || 0}  // ✅ Real data
      />
      <StatCard
        label="Total Birds"
        value={quickStats?.total_birds || 0}  // ✅ Real data
      />
      {/* ... */}
    </div>
  )
}
```

**Backend Already Implemented:** ✅ `backend/app/api/v1/dashboard.py` has all endpoints!

---

### **Issue #3: Missing Feed Calculator Endpoints (CRITICAL - Blocks T6)**

**Severity:** 🔴 CRITICAL  
**Impact:** T6 (Feed Calculator) cannot be implemented  
**Location:** `backend/app/api/v1/` (missing feed.py)  
**Fix Time:** 2 hours

**Problem:** No feed calculator endpoints exist

**Required Endpoints (12 total):**
1. POST /api/v1/feed/calculate-ready-made
2. POST /api/v1/feed/calculate-custom
3. POST /api/v1/feed/calculate-concentrate
4. POST /api/v1/feed/optimize (LP optimization)
5. GET /api/v1/feed/ingredients
6. GET /api/v1/feed/formulations
7. POST /api/v1/feed/formulations/:id/confirm
8. GET /api/v1/feed/recipes
9. POST /api/v1/feed/recipes
10. GET /api/v1/feed/availability-check
11. GET /api/v1/feed/nutritional-requirements
12. GET /api/v1/feed/safety-rules

**Reference:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/fb99cad1-d468-4a18-bd81-d987f1ae6f63

---

### **Issue #4: Missing Water-Health Endpoints (CRITICAL - Blocks T7)**

**Severity:** 🔴 CRITICAL  
**Impact:** T7 (Water-Health) cannot be implemented  
**Location:** `backend/app/api/v1/` (missing health.py)  
**Fix Time:** 2 hours

**Required Endpoints (15 total):**
1. GET /api/v1/health/tasks
2. POST /api/v1/health/tasks/:id/complete
3. GET /api/v1/health/vaccinations
4. POST /api/v1/health/vaccinations/:id/complete
5. GET /api/v1/health/medications
6. POST /api/v1/health/medications/administer
7. GET /api/v1/health/withdrawal-periods
8. GET /api/v1/health/protocols/:species
9. POST /api/v1/health/emergency-protocol
10. GET /api/v1/health/conflict-check
11. GET /api/v1/health/dosage-calculator
12. GET /api/v1/health/container-types
13. POST /api/v1/health/preferences
14. GET /api/v1/health/preferences
15. GET /api/v1/health/traditional-remedies

**Reference:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/2a098707-5645-4c66-ba4b-27e04df312ca

---

### **Issue #5: Missing Finance Endpoints (CRITICAL - Blocks T8)**

**Severity:** 🔴 CRITICAL  
**Impact:** T8 (Finance) cannot be implemented  
**Location:** `backend/app/api/v1/` (missing finance.py)  
**Fix Time:** 1 hour

**Required Endpoints (12 total):**
1. GET /api/v1/finance/expenses
2. POST /api/v1/finance/expenses
3. GET /api/v1/finance/expenses/:id
4. PUT /api/v1/finance/expenses/:id
5. DELETE /api/v1/finance/expenses/:id
6. GET /api/v1/finance/revenue
7. POST /api/v1/finance/revenue
8. GET /api/v1/finance/summary
9. GET /api/v1/finance/batch/:id/costs
10. GET /api/v1/finance/sales-estimation
11. POST /api/v1/finance/preferences
12. GET /api/v1/finance/preferences

**Reference:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/9024827f-8dea-465d-800c-cdf5749dc498

---

### **Issue #6: Missing Stock Endpoints (CRITICAL - Blocks T9)**

**Severity:** 🔴 CRITICAL  
**Impact:** T9 (Stock Management) cannot be implemented  
**Location:** `backend/app/api/v1/` (missing stock.py)  
**Fix Time:** 2 hours

**Required Endpoints (10 total):**
1. GET /api/v1/stock/inventory
2. POST /api/v1/stock/purchase
3. POST /api/v1/stock/allocate
4. POST /api/v1/stock/consume
5. POST /api/v1/stock/transfer
6. GET /api/v1/stock/low-stock
7. GET /api/v1/stock/allocations
8. POST /api/v1/stock/check-availability
9. GET /api/v1/stock/suppliers
10. POST /api/v1/stock/suppliers

**Reference:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/e5714a4e-bc2c-494e-9725-b8797c41b5d2

---

### **Issue #7: LP Optimization Not Implemented (CRITICAL - Blocks T6)**

**Severity:** 🔴 CRITICAL  
**Impact:** Feed Calculator Custom Formulation won't work  
**Location:** `backend/app/services/feed_formulation_service.py` (missing LP logic)  
**Fix Time:** 3 hours

**Problem:** FeedFormulationService exists but LP optimization not implemented

**Required Implementation:**
- Pyomo ConcreteModel with 12 constraints
- GLPK solver integration
- Infeasibility analysis
- Price validation before optimization

**Reference:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/fb99cad1-d468-4a18-bd81-d987f1ae6f63 (Section: LP Optimization Engine)

---

### **Issue #8: Event Handlers Incomplete (HIGH - Breaks Auto-Integration)**

**Severity:** 🟠 HIGH  
**Impact:** Automatic expense creation, stock allocation won't work  
**Location:** `backend/app/services/` (event handlers not registered)  
**Fix Time:** 1 hour

**Problem:** Event bus exists but handlers not fully registered

**Missing Handlers:**
- FEED_FORMULATION_CONFIRMED → UnifiedExpenseService, StorageIntegrationService
- HEALTH_TASK_COMPLETED → UnifiedExpenseService, StorageIntegrationService
- STOCK_PURCHASE_RECORDED → UnifiedExpenseService
- EGG_SALE_RECORDED → RevenueService, EggInventoryService

**Solution:** Register all handlers in `backend/app/main.py` startup

---

### **Issue #9: Missing 8 Database Tables (HIGH - Blocks T11-T14)**

**Severity:** 🟠 HIGH  
**Impact:** Egg Production, Records, Alternative Feeding won't work  
**Location:** Database schema  
**Fix Time:** 30 minutes

**Missing Tables:**
1. `ingredients` - Ingredient master data
2. `medications` - Medication master data
3. `feed_consumption_records` - Alternative feeding manual recording
4. `batch_comparisons` - Saved batch comparisons
5. `egg_inventories` - Egg inventory by size/quality
6. `egg_production_records` - Daily egg production
7. `egg_sales` - Egg sales records
8. `customers` - Customer management

**Solution:** Create Alembic migration for 8 tables

---

### **Issue #10: State Machine Disabled (MEDIUM - No Lifecycle Automation)**

**Severity:** 🟡 MEDIUM  
**Impact:** Batch lifecycle transitions manual, no automatic phase advancement  
**Location:** `backend/app/main.py` line 34-37 (placeholder function)  
**Fix Time:** 30 minutes

**Problem:** State machine refactored but not re-enabled

**Status:** Already refactored for python-statemachine 2.5.0 ✅  
**Action:** Remove placeholder, uncomment import

---

### **Issue #11: Config Validation Disabled (MEDIUM - Invalid Data Accepted)**

**Severity:** 🟡 MEDIUM  
**Impact:** Invalid species protocols accepted, safety rules not enforced  
**Location:** `backend/app/services/config_service.py` (validation skipped)  
**Fix Time:** 1 hour

**Problem:** Validation disabled in development mode

**Solution:** Complete species_protocols.json with all 36 vaccination protocols, re-enable validation

---

### **Issue #12: Medication Conflict Matrix Missing (HIGH - Safety Risk)**

**Severity:** 🟠 HIGH  
**Impact:** Unsafe medication combinations allowed  
**Location:** `backend/app/services/water_health_calculation_service.py` (not implemented)  
**Fix Time:** 2 hours

**Problem:** Conflict checking not implemented

**Required Conflicts (5 critical):**
1. Antibiotics + Probiotics (7-day gap)
2. Vaccines + Antibiotics (3-day gap)
3. Ionophore coccidiostats + Tylosin/Tiamulin
4. Multiple dewormers simultaneously
5. Calcium supplements + Oxytetracycline

**Reference:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/2a098707-5645-4c66-ba4b-27e04df312ca (Section: Medication Conflict Matrix)

---

### **Issue #13: Missing Egg Production Endpoints (CRITICAL - Blocks T11)**

**Severity:** 🔴 CRITICAL  
**Impact:** T11 (Egg Production) cannot be implemented  
**Location:** `backend/app/api/v1/` (missing eggs.py)  
**Fix Time:** 1.5 hours

**Required Endpoints (8 total):**
1. POST /api/v1/eggs/production/record
2. GET /api/v1/eggs/production
3. GET /api/v1/eggs/inventory
4. POST /api/v1/eggs/sales
5. GET /api/v1/eggs/sales
6. GET /api/v1/eggs/customers
7. POST /api/v1/eggs/customers
8. GET /api/v1/eggs/pricing

**Reference:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/1e41ba59-5044-4636-a0dd-57ec571b7901

---

## 🔧 COMPLETE FIX GUIDE FOR KIRO

### **Priority 0: Immediate Fixes (15 minutes - Unblocks Login)**

**Fix 1.1: Update Setup Endpoint Schema**

File: `backend/app/api/v1/setup.py`

Replace entire file with schema-aligned version (see Issue #1 solution above).

**Fix 1.2: Verify VITE_USE_MOCK_APIS**

File: `frontend/.env`

Ensure line 4 is:
```
VITE_USE_MOCK_APIS=false
```

**Fix 1.3: Restart Both Servers**

```bash
# Backend
pkill -f "uvicorn"
cd /home/kinnah/Desktop/Lampfarms/backend
python -m uvicorn app.main:app --reload --port 8000

# Frontend  
cd /home/kinnah/Desktop/Lampfarms/frontend
npm run dev
```

**Test:**
1. Login at http://localhost:5174
2. Should redirect to /setup
3. Fill all 3 steps
4. Click "Complete Setup"
5. Should save to database and redirect to /dashboard
6. Verify user.farm_setup_completed = true in database

---

### **Priority 1: Critical Endpoints (6 hours - Enables T6-T9)**

**Fix 2: Create Feed Calculator Endpoints (2 hours)**

Create `backend/app/api/v1/feed.py` with 12 endpoints.

**Implementation Guide:**
- Use spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/fb99cad1-d468-4a18-bd81-d987f1ae6f63 as reference
- Implement 3 calculation methods (Ready-Made, Custom, Concentrate)
- Integrate LP optimization (see Issue #7)
- Add stock availability checking
- Validate prices before calculations

**Fix 3: Create Water-Health Endpoints (2 hours)**

Create `backend/app/api/v1/health.py` with 15 endpoints.

**Implementation Guide:**
- Use spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/2a098707-5645-4c66-ba4b-27e04df312ca as reference
- Implement 36 vaccination protocols
- Add medication conflict matrix (see Issue #12)
- Add container-based dosing calculations
- Add withdrawal period tracking

**Fix 4: Create Finance Endpoints (1 hour)**

Create `backend/app/api/v1/finance.py` with 12 endpoints.

**Implementation Guide:**
- Use spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/9024827f-8dea-465d-800c-cdf5749dc498 as reference
- Implement 9 expense categories
- Implement 5 revenue types
- Add cost privacy support
- Add sales estimation formulas

**Fix 5: Create Stock Endpoints (2 hours)**

Create `backend/app/api/v1/stock.py` with 10 endpoints.

**Implementation Guide:**
- Use spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/e5714a4e-bc2c-494e-9725-b8797c41b5d2 as reference
- Implement FIFO + quality allocation algorithm
- Add ingredient availability checking
- Add quality/expiry tracking
- Add low stock alerts

---

### **Priority 2: LP Optimization (3 hours - Critical for Feed Calculator)**

**Fix 6: Implement Pyomo LP Engine**

File: `backend/app/services/feed_formulation_service.py`

**Implementation:**

```python
from pyomo.environ import *

async def optimize_feed_formulation(
    batch_id: int,
    selected_ingredients: List[dict],
    species: str,
    phase: str
) -> dict:
    """
    Optimize feed formulation using Pyomo LP.
    
    Constraints (12 total):
    1. Protein (min/max)
    2. Energy (min/max)
    3. Lysine (min)
    4. Methionine (min)
    5. Calcium (min/max)
    6. Phosphorus (min)
    7. Niacin (≥55mg/kg for ducks)
    8. Fiber (max)
    9. Inclusion limits (11 ingredient-specific)
    10. Calcium single selection
    11. Species safety blocks
    12. Compulsory supplements
    """
    
    # Validate prices exist
    for ing in selected_ingredients:
        if not ing.get('price_per_kg') or ing['price_per_kg'] <= 0:
            raise ValueError(f"Price required for {ing['name']}")
    
    # Create Pyomo model
    model = ConcreteModel()
    
    # Sets
    model.ingredients = Set(initialize=[i['id'] for i in selected_ingredients])
    
    # Parameters
    model.protein = Param(model.ingredients, initialize={...})
    model.energy = Param(model.ingredients, initialize={...})
    model.cost_per_kg = Param(model.ingredients, initialize={i['id']: i['price_per_kg'] for i in selected_ingredients})
    
    # Variables
    model.quantity = Var(model.ingredients, domain=NonNegativeReals)
    
    # Objective: Minimize cost
    def cost_rule(model):
        return sum(model.quantity[i] * model.cost_per_kg[i] for i in model.ingredients)
    model.total_cost = Objective(rule=cost_rule, sense=minimize)
    
    # Constraints
    # 1. Total quantity = 100kg
    model.total_quantity = Constraint(expr=sum(model.quantity[i] for i in model.ingredients) == 100)
    
    # 2. Protein constraints
    requirements = await config_service.get_nutritional_requirements(species, phase)
    def protein_min_rule(model):
        return sum(model.quantity[i] * model.protein[i] for i in model.ingredients) >= requirements['protein_min'] * 100
    model.protein_min = Constraint(rule=protein_min_rule)
    
    # ... 10 more constraints
    
    # Solve
    solver = SolverFactory('glpk')
    results = solver.solve(model)
    
    if results.solver.status != SolverStatus.ok:
        # Infeasibility analysis
        raise ValueError("No feasible solution found")
    
    # Extract results
    formulation = {
        'ingredients': [
            {
                'id': i,
                'quantity_kg': model.quantity[i].value,
                'cost': model.quantity[i].value * model.cost_per_kg[i]
            }
            for i in model.ingredients if model.quantity[i].value > 0.01
        ],
        'total_cost': model.total_cost()
    }
    
    return formulation
```

**Reference:** spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/fb99cad1-d468-4a18-bd81-d987f1ae6f63 (Section: LP Optimization Engine)

---

### **Priority 3: Event Handler Registration (1 hour - Enables Auto-Integration)**

**Fix 7: Register All Event Handlers**

File: `backend/app/main.py`

Add to lifespan startup (after line 50):

```python
# Register event handlers
from app.services.batch_event_bus import batch_event_bus
from app.services.unified_expense_service import UnifiedExpenseService
from app.services.storage_integration_service import StorageIntegrationService

# Feed formulation handlers
async def on_feed_formulation_confirmed(event, session):
    batch = await session.get(Batch, event.batch_id)
    if batch.production_system == "intensive":
        # Automatic pattern
        expense_service = UnifiedExpenseService(session)
        await expense_service.create_from_feed(event.data)
        
        storage_service = StorageIntegrationService(session)
        await storage_service.allocate_stock(event.data)

batch_event_bus.subscribe("FEED_FORMULATION_CONFIRMED", on_feed_formulation_confirmed)

# Health task handlers
async def on_health_task_completed(event, session):
    batch = await session.get(Batch, event.batch_id)
    if batch.production_system == "intensive":
        expense_service = UnifiedExpenseService(session)
        await expense_service.create_from_health(event.data)
        
        storage_service = StorageIntegrationService(session)
        await storage_service.deduct_medication(event.data)

batch_event_bus.subscribe("HEALTH_TASK_COMPLETED", on_health_task_completed)

# ... register all 13 event types
```

---

### **Priority 4: Database Tables (30 minutes - Enables T11-T14)**

**Fix 8: Create Missing Tables Migration**

```bash
cd /home/kinnah/Desktop/Lampfarms/backend
alembic revision -m "add_missing_tables_for_t11_t14"
```

Edit migration file:

```python
def upgrade():
    # Ingredients table
    op.create_table('ingredients',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('protein', sa.Float(), nullable=False),
        sa.Column('energy', sa.Float(), nullable=False),
        # ... all nutritional fields
    )
    
    # Medications table
    op.create_table('medications',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('dosage_per_liter', sa.String(50)),
        sa.Column('withdrawal_days', sa.Integer()),
        # ... all medication fields
    )
    
    # ... 6 more tables
```

Run migration:
```bash
alembic upgrade head
```

---

## 📋 COMPLETE ISSUE SUMMARY

| Priority | Issue | Severity | Fix Time | Blocks |
|----------|-------|----------|----------|--------|
| **P0** | Setup schema mismatch | 🔴 CRITICAL | 10 min | Login flow |
| **P0** | Dashboard mock data | 🟠 HIGH | 1 hour | UX |
| **P1** | Feed endpoints missing | 🔴 CRITICAL | 2 hours | T6 |
| **P1** | Health endpoints missing | 🔴 CRITICAL | 2 hours | T7 |
| **P1** | Finance endpoints missing | 🔴 CRITICAL | 1 hour | T8 |
| **P1** | Stock endpoints missing | 🔴 CRITICAL | 2 hours | T9 |
| **P1** | LP optimization missing | 🔴 CRITICAL | 3 hours | T6 |
| **P2** | Event handlers incomplete | 🟠 HIGH | 1 hour | Auto-integration |
| **P2** | 8 tables missing | 🟠 HIGH | 30 min | T11-T14 |
| **P3** | State machine disabled | 🟡 MEDIUM | 30 min | Lifecycle automation |
| **P3** | Config validation disabled | 🟡 MEDIUM | 1 hour | Safety |
| **P3** | Medication conflicts missing | 🟠 HIGH | 2 hours | Safety |
| **P3** | Egg endpoints missing | 🔴 CRITICAL | 1.5 hours | T11 |

**Total Fix Time:** ~18 hours (2-3 days)

---

## 🎯 KIRO IMPLEMENTATION GUIDE

### **Phase 1: Unblock Login Flow (1 hour)**

**Tasks:**
1. Fix setup endpoint schema (10 min)
2. Integrate dashboard with real data (1 hour)
3. Test login → setup → dashboard flow

**Result:** Complete auth flow working

---

### **Phase 2: Create Missing Endpoints (8 hours)**

**Tasks:**
1. Create feed.py with 12 endpoints (2 hours)
2. Create health.py with 15 endpoints (2 hours)
3. Create finance.py with 12 endpoints (1 hour)
4. Create stock.py with 10 endpoints (2 hours)
5. Create eggs.py with 8 endpoints (1.5 hours)

**Result:** All T6-T11 endpoints ready

---

### **Phase 3: Implement LP Optimization (3 hours)**

**Tasks:**
1. Implement Pyomo LP engine (2 hours)
2. Add 12 constraints (30 min)
3. Add infeasibility analysis (30 min)

**Result:** Feed Calculator Custom Formulation working

---

### **Phase 4: Complete Integration (6 hours)**

**Tasks:**
1. Register all event handlers (1 hour)
2. Create 8 missing database tables (30 min)
3. Implement medication conflict matrix (2 hours)
4. Re-enable state machine (30 min)
5. Re-enable config validation (1 hour)
6. Test end-to-end flows (1 hour)

**Result:** Complete system with auto-integration

---

## ✅ WHAT'S ALREADY WORKING (No Changes Needed)

1. ✅ **Authentication** - Login, registration, JWT refresh all working
2. ✅ **Batch Management** - All 10 endpoints implemented and tested
3. ✅ **Database Schema** - 19 tables created (sufficient for T1-T10)
4. ✅ **Event Bus** - Transaction isolation working
5. ✅ **APScheduler** - 3 scheduled jobs registered
6. ✅ **Repository-Service Pattern** - Correctly implemented
7. ✅ **Frontend UI** - Batch wizard, dashboard, details all complete
8. ✅ **Setup Wizard UI** - All 3 steps implemented
9. ✅ **Dashboard Endpoints** - Already implemented in dashboard.py!
10. ✅ **Setup Endpoint** - Already implemented in setup.py! (just needs schema fix)

---

## 🚀 IMPLEMENTATION ROADMAP FOR KIRO

### **Day 1: Unblock Login + Dashboard (4 hours)**

**Morning (2 hours):**
- Fix setup endpoint schema (10 min)
- Test login → setup → dashboard flow (20 min)
- Integrate dashboard with real data (1.5 hours)

**Afternoon (2 hours):**
- Create feed.py skeleton (30 min)
- Create health.py skeleton (30 min)
- Create finance.py skeleton (30 min)
- Create stock.py skeleton (30 min)

**Result:** Login flow working, T6-T9 endpoint structure ready

---

### **Day 2: Implement Endpoints (8 hours)**

**Morning (4 hours):**
- Complete feed.py (12 endpoints)
- Complete health.py (15 endpoints)

**Afternoon (4 hours):**
- Complete finance.py (12 endpoints)
- Complete stock.py (10 endpoints)

**Result:** All T6-T9 endpoints functional

---

### **Day 3: LP Optimization + Integration (6 hours)**

**Morning (3 hours):**
- Implement Pyomo LP engine
- Add 12 constraints
- Test with real ingredient data

**Afternoon (3 hours):**
- Register all event handlers
- Create 8 missing tables
- Implement medication conflict matrix

**Result:** Complete system with auto-integration

---

## 📊 ACCEPTANCE CRITERIA

### **Login Flow:**
- [ ] User can login without hanging
- [ ] Redirects to /setup if farm_setup_completed = false
- [ ] Redirects to /dashboard if farm_setup_completed = true
- [ ] No infinite redirect loops

### **Setup Wizard:**
- [ ] All 3 steps render correctly
- [ ] Form validation works
- [ ] Backend saves all setup data
- [ ] user.farm_setup_completed updated to true
- [ ] Redirects to dashboard after completion

### **Dashboard:**
- [ ] Shows real quick stats (not hardcoded)
- [ ] Shows real active batches (from GET /batches)
- [ ] Shows real recent activity
- [ ] Cost privacy working

### **Feed Calculator (T6):**
- [ ] All 12 endpoints working
- [ ] LP optimization produces cost-optimal formulas
- [ ] Price validation before calculations
- [ ] Stock availability checking integrated
- [ ] Automatic expense creation (Automatic pattern)

### **Water-Health (T7):**
- [ ] All 15 endpoints working
- [ ] 36 vaccination protocols loaded
- [ ] Medication conflict matrix validates combinations
- [ ] Container-based dosing calculations correct
- [ ] Withdrawal period tracking blocks termination

### **Finance (T8):**
- [ ] All 12 endpoints working
- [ ] Automatic expense creation from feed/health/stock
- [ ] Manual expense entry working
- [ ] Revenue recording working
- [ ] Cost privacy applied

### **Stock (T9):**
- [ ] All 10 endpoints working
- [ ] FIFO + quality allocation working
- [ ] Ingredient availability checking working
- [ ] Low stock alerts triggering
- [ ] Automatic stock updates from feed/health

---

## 🎯 KIRO AGENT CONTEXT

**Current State:**
- ✅ T1-T5 complete (31% of project)
- ✅ Backend running on port 8000
- ✅ Frontend running on port 5174
- ✅ 19 database tables created
- ✅ Auth, batch management, setup wizard, dashboard all implemented
- ⚠️ Setup endpoint has schema mismatch (10-minute fix)
- ⚠️ Dashboard using mock data (1-hour fix)
- ❌ Feed, Health, Finance, Stock endpoints missing (8 hours)
- ❌ LP optimization not implemented (3 hours)
- ❌ Event handlers not registered (1 hour)

**What Kiro Should Do:**
1. Fix setup endpoint schema (Priority 0 - 10 min)
2. Integrate dashboard with real data (Priority 0 - 1 hour)
3. Create 4 missing endpoint files (Priority 1 - 8 hours)
4. Implement LP optimization (Priority 2 - 3 hours)
5. Register event handlers (Priority 3 - 1 hour)
6. Create 8 missing tables (Priority 4 - 30 min)

**Total Effort:** ~14 hours (2 days)

**After Completion:**
- ✅ Complete auth → setup → dashboard flow
- ✅ All T6-T9 endpoints ready
- ✅ LP optimization working
- ✅ Auto-integration working (Dovetail Synergy)
- ✅ Ready for T6-T16 implementation

---

## 📚 REFERENCE MATERIALS

**Specifications:**
- Backend Architecture: spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/35142770-c1b0-4df2-85e2-5a839616334a
- Feed Calculator: spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/fb99cad1-d468-4a18-bd81-d987f1ae6f63
- Water-Health: spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/2a098707-5645-4c66-ba4b-27e04df312ca
- Finance: spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/9024827f-8dea-465d-800c-cdf5749dc498
- Stock Management: spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/e5714a4e-bc2c-494e-9725-b8797c41b5d2
- Core Flows: spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/f8459c0d-edda-4273-a388-05dc54be731b

**Tickets:**
- T6: ticket:bceeaefd-5139-4801-8c12-de8a8b6faf8a/e4cfd12a-07cb-4c77-af7a-d2a63c721acd
- T7: ticket:bceeaefd-5139-4801-8c12-de8a8b6faf8a/fa2cc035-f159-4382-9a24-344f8aef909c
- T8: ticket:bceeaefd-5139-4801-8c12-de8a8b6faf8a/10493696-9658-493b-9508-7793935c3405
- T9: ticket:bceeaefd-5139-4801-8c12-de8a8b6faf8a/16efc0ff-0db2-4e5b-bf5a-1c27b0818339

**Codebase:**
- Backend: file:backend/app/
- Frontend: file:frontend/src/
- Config: file:backend/config/

---

## ✅ SUCCESS CRITERIA

**After All Fixes:**
- [ ] Login → Setup → Dashboard flow works end-to-end
- [ ] Dashboard shows real farm data (not mock)
- [ ] All T6-T9 endpoints exist and respond
- [ ] LP optimization produces cost-optimal formulas
- [ ] Event handlers trigger automatic integration
- [ ] Medication conflict matrix prevents unsafe combinations
- [ ] State machine automates lifecycle transitions
- [ ] All 27 database tables exist
- [ ] Ready for T6-T16 implementation without blockers

**Timeline:** 2-3 days to fix all issues

**Result:** Production-ready system with complete Dovetail Synergy integration