# Stock Management System - Production-Grade Specification (Batch Allocation + Dual Feed Patterns)

# Stock Management System - Production-Grade Specification

## Overview

The Stock Management System provides comprehensive inventory tracking with batch allocation, purchase recording, consumption tracking, and low stock alerts. It integrates seamlessly with the Feed Calculator and Water-Health systems through event-driven architecture, supporting both Automatic (Intensive) and Flexible (Semi-Intensive) production patterns.

**Core Principles:**
- **Batch Allocation Tracking:** Track which stock is allocated to which batch (Automatic pattern)
- **Category-Based Organization:** 5 stock categories with automatic expense creation
- **Dual Pattern Support:** Automatic (intensive) vs Flexible (semi-intensive) integration
- **Low Stock Alerts:** Proactive reorder suggestions based on consumption rate
- **Supplier Management:** Track suppliers for quick reordering

---

## System Architecture

### Stock Categories

```
1. Feed Ingredients (Maize, Soya, Fish Meal, etc.)
   → Auto-creates Feed expense on purchase
   → Auto-allocated to batch on feed formulation (Automatic pattern)

2. Medications (Antibiotics, Coccidiostats, etc.)
   → Auto-creates Health expense on purchase
   → Auto-allocated to batch on health task completion (Automatic pattern)

3. Vaccines (Gumboro, Newcastle, Fowl Pox, etc.)
   → Auto-creates Health expense on purchase
   → Auto-allocated to batch on vaccination (Automatic pattern)

4. Supplements (Toxin Binder, Lysine, Methionine, Niacin, etc.)
   → Auto-creates Feed expense on purchase
   → Auto-allocated to batch on feed formulation (Automatic pattern)

5. Equipment (Feeders, Drinkers, Heaters, etc.)
   → Auto-creates Equipment expense on purchase
   → No batch allocation (farm-level asset)
```

### Dual Feed Pattern Integration

**Automatic Pattern (Intensive Production):**
```
Feed Formulation Confirmed
  ↓
FEED_FORMULATION_CONFIRMED event published
  ↓
StorageIntegrationService handler
  ↓
Auto-allocate stock to batch
  ↓
Update InventoryItem.quantity_available
  ↓
Create StockAllocation record
  ↓
Check low stock threshold
  ↓
Send alert if needed
```

**Flexible Pattern (Semi-Intensive Production):**
```
Feed Formulation Confirmed
  ↓
NO automatic stock allocation
  ↓
Farmer manually records consumption later
  ↓
Manual consumption entry
  ↓
Update InventoryItem.quantity_available
  ↓
Check low stock threshold
```

---

## Database Models

### InventoryItem Model

```python
class InventoryItem(Base):
    """
    Stock inventory item with category, quantity tracking, and reorder management.
    """
    __tablename__ = "inventory_items"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)
    
    # Item Details
    category = Column(Enum(StockCategory), nullable=False, index=True)
    # StockCategory: feed_ingredient, medication, vaccine, supplement, equipment
    
    name = Column(String(200), nullable=False, index=True)
    # Examples: "Maize", "Amprolium", "Gumboro Vaccine", "Toxin Binder"
    
    description = Column(Text, nullable=True)
    # Additional details about the item
    
    # Quantity Tracking
    quantity_total = Column(Float, nullable=False, default=0.0)
    # Total quantity in stock
    
    quantity_available = Column(Float, nullable=False, default=0.0)
    # Available quantity (not allocated to batches)
    
    quantity_allocated = Column(Float, nullable=False, default=0.0)
    # Quantity allocated to batches (Automatic pattern only)
    
    unit = Column(String(50), nullable=False)
    # Examples: "kg", "bags", "liters", "bottles", "pieces"
    
    # Cost Tracking
    unit_cost = Column(Float, nullable=True)
    # Cost per unit (GHS)
    
    total_cost = Column(Float, nullable=True)
    # Total cost of current stock (GHS)
    
    # Reorder Management
    reorder_level = Column(Float, nullable=False, default=0.0)
    # Alert when quantity_available falls below this level
    
    reorder_quantity = Column(Float, nullable=True)
    # Suggested reorder quantity
    
    is_low_stock = Column(Boolean, nullable=False, default=False, index=True)
    # Flag for low stock alerts
    
    # Storage Location
    storage_location = Column(String(200), nullable=True)
    # Examples: "Main Store", "Cold Room", "Medication Cabinet"
    
    # Quality Tracking (Optional but Essential)
    quality_grade = Column(String(20), nullable=True)
    # Values: "excellent", "good", "fair", "poor", "damaged"
    # Used for FIFO allocation with quality preference
    
    expiry_date = Column(Date, nullable=True)
    # Expiry date for perishable items (feed ingredients, medications)
    # Used for FIFO allocation and safety checks
    
    batch_number = Column(String(50), nullable=True)
    # Supplier batch number for traceability
    
    supplier_batch_id = Column(String(50), nullable=True)
    # Supplier's internal batch ID
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_purchase_date = Column(DateTime, nullable=True)
    
    # Relationships
    farm = relationship("Farm", back_populates="inventory_items")
    supplier = relationship("Supplier", back_populates="inventory_items")
    allocations = relationship("StockAllocation", back_populates="inventory_item", cascade="all, delete-orphan")
    transfers = relationship("StockTransfer", foreign_keys="[StockTransfer.item_id]", back_populates="item")
    
    # Indexes
    __table_args__ = (
        Index('idx_inventory_farm_category', 'farm_id', 'category'),
        Index('idx_inventory_low_stock', 'farm_id', 'is_low_stock'),
    )
```

### StockAllocation Model

```python
class StockAllocation(Base):
    """
    Tracks stock allocated to specific batches (Automatic pattern only).
    """
    __tablename__ = "stock_allocations"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)
    
    # Allocation Details
    quantity = Column(Float, nullable=False)
    # Quantity allocated to this batch
    
    unit = Column(String(50), nullable=False)
    # Unit of measurement
    
    allocation_type = Column(Enum(AllocationType), nullable=False)
    # AllocationType: feed_formulation, health_task, manual
    
    source_id = Column(Integer, nullable=True)
    # ID of the source record (FeedFormulation.id or HealthTask.id)
    
    # Cost Tracking
    unit_cost = Column(Float, nullable=True)
    # Cost per unit at time of allocation
    
    total_cost = Column(Float, nullable=True)
    # Total cost of this allocation
    
    # Status
    status = Column(Enum(AllocationStatus), nullable=False, default=AllocationStatus.ALLOCATED)
    # AllocationStatus: allocated, consumed, returned
    
    consumed_at = Column(DateTime, nullable=True)
    # When the stock was consumed
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    farm = relationship("Farm")
    batch = relationship("Batch", back_populates="stock_allocations")
    inventory_item = relationship("InventoryItem", back_populates="allocations")
    
    # Indexes
    __table_args__ = (
        Index('idx_allocation_batch', 'batch_id', 'status'),
        Index('idx_allocation_item', 'item_id', 'status'),
    )
```

### StockTransfer Model

```python
class StockTransfer(Base):
    """
    Tracks stock transfers between storage locations.
    """
    __tablename__ = "stock_transfers"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)
    
    # Transfer Details
    from_location = Column(String(200), nullable=False)
    to_location = Column(String(200), nullable=False)
    
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    
    reason = Column(Text, nullable=True)
    # Reason for transfer
    
    # Timestamps
    transferred_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    farm = relationship("Farm")
    item = relationship("InventoryItem", back_populates="transfers")
```

### Supplier Model

```python
class Supplier(Base):
    """
    Supplier information for quick reordering.
    """
    __tablename__ = "suppliers"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    
    # Supplier Details
    name = Column(String(200), nullable=False)
    contact_person = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(200), nullable=True)
    address = Column(Text, nullable=True)
    
    # Categories Supplied
    categories = Column(JSON, nullable=True)
    # List of StockCategory values this supplier provides
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    farm = relationship("Farm", back_populates="suppliers")
    inventory_items = relationship("InventoryItem", back_populates="supplier")
```

---

## UI Wireframes

### 1. Stock Dashboard (Inventory Overview)

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: #f9fafb; padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.header h1 { font-size: 24px; font-weight: 600; color: #111827; }
.btn-primary { background: #16a34a; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
.tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
.tab { padding: 12px 16px; cursor: pointer; border-bottom: 2px solid transparent; color: #6b7280; font-weight: 500; }
.tab.active { border-bottom-color: #16a34a; color: #16a34a; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
.stat-label { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 600; color: #111827; }
.alert-banner { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
.alert-icon { color: #f59e0b; font-size: 20px; }
.alert-text { flex: 1; color: #92400e; }
.alert-action { background: #f59e0b; color: white; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; }
.table-container { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
.table { width: 100%; }
.table th { background: #f9fafb; padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
.table td { padding: 16px; border-bottom: 1px solid #f3f4f6; }
.badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.badge-low { background: #fee2e2; color: #991b1b; }
.badge-ok { background: #dcfce7; color: #166534; }
.item-name { font-weight: 500; color: #111827; }
.item-category { font-size: 14px; color: #6b7280; }
.quantity { font-weight: 600; color: #111827; }
.actions { display: flex; gap: 8px; }
.btn-icon { background: none; border: none; color: #6b7280; cursor: pointer; padding: 4px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Stock Management</h1>
    <button class="btn-primary" data-element-id="btn-record-purchase">+ Record Purchase</button>
  </div>

  <div class="tabs">
    <div class="tab active" data-element-id="tab-all">All Items (48)</div>
    <div class="tab" data-element-id="tab-feed">Feed Ingredients (18)</div>
    <div class="tab" data-element-id="tab-medications">Medications (12)</div>
    <div class="tab" data-element-id="tab-vaccines">Vaccines (8)</div>
    <div class="tab" data-element-id="tab-supplements">Supplements (6)</div>
    <div class="tab" data-element-id="tab-equipment">Equipment (4)</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total Items</div>
      <div class="stat-value">48</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Low Stock Items</div>
      <div class="stat-value" style="color: #dc2626;">5</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Value</div>
      <div class="stat-value">GHS 12,450</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Allocated Stock</div>
      <div class="stat-value">GHS 3,200</div>
    </div>
  </div>

  <div class="alert-banner">
    <div class="alert-icon">⚠️</div>
    <div class="alert-text">
      <strong>5 items are running low:</strong> Maize, Soya Bean Meal, Amprolium, Gumboro Vaccine, Toxin Binder
    </div>
    <button class="alert-action" data-element-id="btn-view-low-stock">View Details</button>
  </div>

  <div class="table-container">
    <table class="table">
      <thead>
        <tr>
          <th>Item Name</th>
          <th>Category</th>
          <th>Available</th>
          <th>Allocated</th>
          <th>Unit Cost</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="item-name">Maize</div>
            <div class="item-category">Feed Ingredient</div>
          </td>
          <td>Feed Ingredient</td>
          <td class="quantity">45 kg</td>
          <td class="quantity">120 kg</td>
          <td>GHS 2.50/kg</td>
          <td><span class="badge badge-low">Low Stock</span></td>
          <td class="actions">
            <button class="btn-icon" data-element-id="btn-purchase-maize" title="Purchase">🛒</button>
            <button class="btn-icon" data-element-id="btn-view-maize" title="View Details">👁️</button>
          </td>
        </tr>
        <tr>
          <td>
            <div class="item-name">Soya Bean Meal</div>
            <div class="item-category">Feed Ingredient</div>
          </td>
          <td>Feed Ingredient</td>
          <td class="quantity">180 kg</td>
          <td class="quantity">80 kg</td>
          <td>GHS 4.20/kg</td>
          <td><span class="badge badge-ok">In Stock</span></td>
          <td class="actions">
            <button class="btn-icon" data-element-id="btn-purchase-soya" title="Purchase">🛒</button>
            <button class="btn-icon" data-element-id="btn-view-soya" title="View Details">👁️</button>
          </td>
        </tr>
        <tr>
          <td>
            <div class="item-name">Amprolium (Coccidiostat)</div>
            <div class="item-category">Medication</div>
          </td>
          <td>Medication</td>
          <td class="quantity">2 bottles</td>
          <td class="quantity">1 bottle</td>
          <td>GHS 45.00/bottle</td>
          <td><span class="badge badge-low">Low Stock</span></td>
          <td class="actions">
            <button class="btn-icon" data-element-id="btn-purchase-amprolium" title="Purchase">🛒</button>
            <button class="btn-icon" data-element-id="btn-view-amprolium" title="View Details">👁️</button>
          </td>
        </tr>
        <tr>
          <td>
            <div class="item-name">Gumboro Vaccine</div>
            <div class="item-category">Vaccine</div>
          </td>
          <td>Vaccine</td>
          <td class="quantity">150 doses</td>
          <td class="quantity">0 doses</td>
          <td>GHS 0.80/dose</td>
          <td><span class="badge badge-ok">In Stock</span></td>
          <td class="actions">
            <button class="btn-icon" data-element-id="btn-purchase-gumboro" title="Purchase">🛒</button>
            <button class="btn-icon" data-element-id="btn-view-gumboro" title="View Details">👁️</button>
          </td>
        </tr>
        <tr>
          <td>
            <div class="item-name">Toxin Binder</div>
            <div class="item-category">Supplement</div>
          </td>
          <td>Supplement</td>
          <td class="quantity">8 kg</td>
          <td class="quantity">5 kg</td>
          <td>GHS 12.00/kg</td>
          <td><span class="badge badge-low">Low Stock</span></td>
          <td class="actions">
            <button class="btn-icon" data-element-id="btn-purchase-toxin" title="Purchase">🛒</button>
            <button class="btn-icon" data-element-id="btn-view-toxin" title="View Details">👁️</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>
```

### 2. Purchase Recording Modal

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 600px; padding: 32px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-title { font-size: 20px; font-weight: 600; color: #111827; }
.btn-close { background: none; border: none; font-size: 24px; color: #6b7280; cursor: pointer; }
.form-group { margin-bottom: 20px; }
.label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
.required { color: #dc2626; }
.category-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.category-btn { padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; text-align: center; transition: all 0.2s; }
.category-btn:hover { border-color: #16a34a; background: #f0fdf4; }
.category-btn.selected { border-color: #16a34a; background: #f0fdf4; }
.category-icon { font-size: 24px; margin-bottom: 8px; }
.category-name { font-size: 14px; font-weight: 500; color: #111827; }
.input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
.input:focus { outline: none; border-color: #16a34a; }
.select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.info-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.info-title { font-size: 14px; font-weight: 600; color: #166534; margin-bottom: 8px; }
.info-text { font-size: 14px; color: #166534; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.btn-secondary { background: #f3f4f6; color: #374151; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
.btn-primary { background: #16a34a; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
</style>
</head>
<body>
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Record Stock Purchase</h2>
      <button class="btn-close" data-element-id="btn-close-modal">×</button>
    </div>

    <div class="form-group">
      <label class="label">Category <span class="required">*</span></label>
      <div class="category-grid">
        <button class="category-btn selected" data-element-id="category-feed">
          <div class="category-icon">🌾</div>
          <div class="category-name">Feed</div>
        </button>
        <button class="category-btn" data-element-id="category-medication">
          <div class="category-icon">💊</div>
          <div class="category-name">Medication</div>
        </button>
        <button class="category-btn" data-element-id="category-vaccine">
          <div class="category-icon">💉</div>
          <div class="category-name">Vaccine</div>
        </button>
        <button class="category-btn" data-element-id="category-supplement">
          <div class="category-icon">🧪</div>
          <div class="category-name">Supplement</div>
        </button>
        <button class="category-btn" data-element-id="category-equipment">
          <div class="category-icon">🔧</div>
          <div class="category-name">Equipment</div>
        </button>
      </div>
    </div>

    <div class="form-group">
      <label class="label">Item Name <span class="required">*</span></label>
      <select class="select" data-element-id="select-item">
        <option value="">Select or add new item...</option>
        <option value="maize">Maize (existing)</option>
        <option value="soya">Soya Bean Meal (existing)</option>
        <option value="new">+ Add New Item</option>
      </select>
    </div>

    <div class="row">
      <div class="form-group">
        <label class="label">Quantity <span class="required">*</span></label>
        <input type="number" class="input" placeholder="e.g., 500" data-element-id="input-quantity" />
      </div>
      <div class="form-group">
        <label class="label">Unit <span class="required">*</span></label>
        <select class="select" data-element-id="select-unit">
          <option value="kg">Kilograms (kg)</option>
          <option value="bags">Bags (50kg)</option>
          <option value="liters">Liters</option>
          <option value="bottles">Bottles</option>
          <option value="doses">Doses</option>
          <option value="pieces">Pieces</option>
        </select>
      </div>
    </div>

    <div class="row">
      <div class="form-group">
        <label class="label">Unit Cost (GHS) <span class="required">*</span></label>
        <input type="number" class="input" placeholder="e.g., 2.50" step="0.01" data-element-id="input-unit-cost" />
      </div>
      <div class="form-group">
        <label class="label">Total Cost (GHS)</label>
        <input type="number" class="input" placeholder="Auto-calculated" disabled value="1,250.00" />
      </div>
    </div>

    <div class="form-group">
      <label class="label">Supplier</label>
      <select class="select" data-element-id="select-supplier">
        <option value="">Select supplier (optional)</option>
        <option value="supplier1">Agro Supplies Ltd</option>
        <option value="supplier2">Farm Inputs Ghana</option>
        <option value="supplier3">Livestock Solutions</option>
        <option value="new">+ Add New Supplier</option>
      </select>
    </div>

    <div class="form-group">
      <label class="label">Storage Location</label>
      <input type="text" class="input" placeholder="e.g., Main Store" data-element-id="input-location" />
    </div>

    <div class="info-box">
      <div class="info-title">What happens when you confirm:</div>
      <div class="info-text">
        ✓ Stock added to inventory<br>
        ✓ Feed expense auto-created (GHS 1,250.00)<br>
        ✓ Available for batch allocation
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" data-element-id="btn-cancel">Cancel</button>
      <button class="btn-primary" data-element-id="btn-confirm-purchase">Confirm Purchase</button>
    </div>
  </div>
</body>
</html>
```

### 3. Stock Allocation Modal (Automatic Pattern)

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; padding: 32px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-title { font-size: 20px; font-weight: 600; color: #111827; }
.btn-close { background: none; border: none; font-size: 24px; color: #6b7280; cursor: pointer; }
.allocation-info { background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
.info-label { font-size: 14px; color: #6b7280; }
.info-value { font-size: 14px; font-weight: 600; color: #111827; }
.form-group { margin-bottom: 20px; }
.label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
.batch-list { max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; }
.batch-item { padding: 16px; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background 0.2s; }
.batch-item:hover { background: #f9fafb; }
.batch-item:last-child { border-bottom: none; }
.batch-item.selected { background: #f0fdf4; border-left: 3px solid #16a34a; }
.batch-name { font-weight: 600; color: #111827; margin-bottom: 4px; }
.batch-details { font-size: 14px; color: #6b7280; }
.allocation-summary { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.summary-title { font-size: 14px; font-weight: 600; color: #92400e; margin-bottom: 8px; }
.summary-text { font-size: 14px; color: #92400e; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.btn-secondary { background: #f3f4f6; color: #374151; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
.btn-primary { background: #16a34a; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
</style>
</head>
<body>
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Allocate Stock to Batch</h2>
      <button class="btn-close" data-element-id="btn-close-modal">×</button>
    </div>

    <div class="allocation-info">
      <div class="info-row">
        <span class="info-label">Item:</span>
        <span class="info-value">Maize</span>
      </div>
      <div class="info-row">
        <span class="info-label">Quantity to Allocate:</span>
        <span class="info-value">120 kg</span>
      </div>
      <div class="info-row">
        <span class="info-label">Available Stock:</span>
        <span class="info-value">165 kg</span>
      </div>
      <div class="info-row">
        <span class="info-label">After Allocation:</span>
        <span class="info-value">45 kg (Low Stock)</span>
      </div>
    </div>

    <div class="form-group">
      <label class="label">Select Batch</label>
      <div class="batch-list">
        <div class="batch-item selected" data-element-id="batch-1">
          <div class="batch-name">Batch #1 - Broilers Week 3</div>
          <div class="batch-details">500 birds • Intensive • House A</div>
        </div>
        <div class="batch-item" data-element-id="batch-2">
          <div class="batch-name">Batch #2 - Layers Week 8</div>
          <div class="batch-details">300 birds • Intensive • House B</div>
        </div>
        <div class="batch-item" data-element-id="batch-3">
          <div class="batch-name">Batch #3 - Ducks Week 5</div>
          <div class="batch-details">200 birds • Semi-Intensive • House C</div>
        </div>
      </div>
    </div>

    <div class="allocation-summary">
      <div class="summary-title">⚠️ Low Stock Warning</div>
      <div class="summary-text">
        After this allocation, Maize will be at 45 kg (below reorder level of 100 kg). Consider reordering soon.
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" data-element-id="btn-cancel">Cancel</button>
      <button class="btn-primary" data-element-id="btn-confirm-allocation">Confirm Allocation</button>
    </div>
  </div>
</body>
</html>
```

### 4. Low Stock Alert Banner

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: #f9fafb; padding: 24px; }
.alert-banner { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 12px; padding: 20px; display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
.alert-icon { color: #f59e0b; font-size: 24px; flex-shrink: 0; }
.alert-content { flex: 1; }
.alert-title { font-size: 16px; font-weight: 600; color: #92400e; margin-bottom: 8px; }
.alert-text { font-size: 14px; color: #92400e; margin-bottom: 12px; }
.item-list { list-style: none; margin-bottom: 12px; }
.item-list li { font-size: 14px; color: #92400e; padding: 4px 0; display: flex; justify-content: space-between; }
.item-name { font-weight: 500; }
.item-stock { color: #dc2626; }
.alert-actions { display: flex; gap: 12px; }
.btn-primary { background: #f59e0b; color: white; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; font-size: 14px; }
.btn-secondary { background: white; color: #92400e; padding: 8px 16px; border-radius: 6px; border: 1px solid #fbbf24; cursor: pointer; font-weight: 500; font-size: 14px; }
.btn-close { background: none; border: none; color: #92400e; cursor: pointer; font-size: 20px; flex-shrink: 0; }
</style>
</head>
<body>
  <div class="alert-banner">
    <div class="alert-icon">⚠️</div>
    <div class="alert-content">
      <div class="alert-title">5 Items Running Low on Stock</div>
      <div class="alert-text">The following items are below their reorder levels and need restocking:</div>
      <ul class="item-list">
        <li>
          <span class="item-name">Maize</span>
          <span class="item-stock">45 kg (need 100 kg)</span>
        </li>
        <li>
          <span class="item-name">Soya Bean Meal</span>
          <span class="item-stock">28 kg (need 50 kg)</span>
        </li>
        <li>
          <span class="item-name">Amprolium</span>
          <span class="item-stock">2 bottles (need 5 bottles)</span>
        </li>
        <li>
          <span class="item-name">Gumboro Vaccine</span>
          <span class="item-stock">80 doses (need 200 doses)</span>
        </li>
        <li>
          <span class="item-name">Toxin Binder</span>
          <span class="item-stock">8 kg (need 20 kg)</span>
        </li>
      </ul>
      <div class="alert-actions">
        <button class="btn-primary" data-element-id="btn-reorder-all">Reorder All</button>
        <button class="btn-secondary" data-element-id="btn-view-details">View Details</button>
      </div>
    </div>
    <button class="btn-close" data-element-id="btn-dismiss-alert">×</button>
  </div>
</body>
</html>
```

### 5. Stock Transfer Modal

```wireframe
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Manrope', sans-serif; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.modal { background: white; border-radius: 16px; width: 500px; max-width: 90vw; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
.modal-header { padding: 24px; border-bottom: 1px solid #e5e7eb; }
.modal-title { font-size: 20px; font-weight: 600; color: #111827; }
.modal-body { padding: 24px; }
.form-group { margin-bottom: 20px; }
.label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
.input { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
.select { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; }
.textarea { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; min-height: 80px; resize: vertical; }
.info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
.info-text { font-size: 14px; color: #166534; }
.modal-footer { padding: 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; }
.btn-secondary { background: white; color: #374151; padding: 10px 20px; border-radius: 8px; border: 1px solid #d1d5db; cursor: pointer; font-weight: 500; }
.btn-primary { background: #16a34a; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; }
</style>
</head>
<body>
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">Transfer Stock</div>
    </div>

    <div class="modal-body">
      <div class="form-group">
        <label class="label">Item *</label>
        <select class="select" data-element-id="select-item">
          <option value="">Select item to transfer...</option>
          <option value="1">Maize (120 kg available)</option>
          <option value="2">Soybean Meal (80 kg available)</option>
          <option value="3">Amprolium (15 bottles available)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="label">From Location *</label>
        <select class="select" data-element-id="select-from-location">
          <option value="">Select source location...</option>
          <option value="main-store">Main Store</option>
          <option value="cold-room">Cold Room</option>
          <option value="medication-cabinet">Medication Cabinet</option>
          <option value="feed-store">Feed Store</option>
        </select>
      </div>

      <div class="form-group">
        <label class="label">To Location *</label>
        <select class="select" data-element-id="select-to-location">
          <option value="">Select destination location...</option>
          <option value="main-store">Main Store</option>
          <option value="cold-room">Cold Room</option>
          <option value="medication-cabinet">Medication Cabinet</option>
          <option value="feed-store">Feed Store</option>
        </select>
      </div>

      <div class="form-group">
        <label class="label">Quantity *</label>
        <input type="number" class="input" placeholder="Enter quantity to transfer" data-element-id="input-quantity" />
      </div>

      <div class="form-group">
        <label class="label">Reason for Transfer</label>
        <select class="select" data-element-id="select-reason">
          <option value="">Select reason (optional)...</option>
          <option value="reorganization">Storage Reorganization</option>
          <option value="temperature-control">Temperature Control</option>
          <option value="accessibility">Easier Accessibility</option>
          <option value="security">Security Concerns</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label class="label">Additional Notes</label>
        <textarea class="textarea" placeholder="Add any additional notes about this transfer..." data-element-id="textarea-notes"></textarea>
      </div>

      <div class="info-box">
        <div class="info-text">
          ℹ️ This transfer will update the storage location for the specified quantity. The item's total quantity remains unchanged.
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" data-element-id="btn-cancel">Cancel</button>
      <button class="btn-primary" data-element-id="btn-confirm-transfer">Confirm Transfer</button>
    </div>
  </div>
</body>
</html>
```

---

## API Endpoints

### Stock Management Endpoints

```
GET    /api/v1/stock/inventory
       Get all inventory items with filters
       Query params: category, is_low_stock, search
       Response: List of InventoryItem with allocation summary

POST   /api/v1/stock/purchase
       Record stock purchase
       Body: { category, name, quantity, unit, unit_cost, supplier_id, storage_location }
       Response: InventoryItem + Expense created
       Events: STOCK_PURCHASE_RECORDED

GET    /api/v1/stock/inventory/{item_id}
       Get inventory item details
       Response: InventoryItem with allocations, transfers, consumption history

PUT    /api/v1/stock/inventory/{item_id}
       Update inventory item (reorder level, storage location, etc.)
       Body: { reorder_level, reorder_quantity, storage_location }
       Response: Updated InventoryItem

POST   /api/v1/stock/allocate
       Manually allocate stock to batch (Flexible pattern)
       Body: { item_id, batch_id, quantity, unit }
       Response: StockAllocation created
       Events: STOCK_ALLOCATED

POST   /api/v1/stock/consume
       Manually record stock consumption (Flexible pattern)
       Body: { allocation_id, quantity_consumed }
       Response: Updated StockAllocation
       Events: STOCK_CONSUMED

POST   /api/v1/stock/transfer
       Transfer stock between locations
       Body: { item_id, from_location, to_location, quantity, reason }
       Response: StockTransfer created

GET    /api/v1/stock/low-stock
       Get all low stock items
       Response: List of InventoryItem where is_low_stock = true

GET    /api/v1/stock/allocations
       Get stock allocations by batch
       Query params: batch_id, status
       Response: List of StockAllocation

GET    /api/v1/stock/suppliers
       Get all suppliers
       Response: List of Supplier

POST   /api/v1/stock/suppliers
       Create new supplier
       Body: { name, contact_person, phone, email, address, categories }
       Response: Supplier created

POST   /api/v1/stock/check-availability
       Check ingredient availability for feed formulation
       Body: { ingredients: [{name, quantity, unit}], batch_id, species, required_date }
       Response: { overall_status, ingredients: [{name, requested, available, shortfall, status, quality_grades, locations}], total_shortfall_cost, can_proceed, recommendation }
       Used by: Feed Calculator before showing results
```

---

## Event-Driven Integration

### Events Published

```python
# Stock Purchase Recorded
STOCK_PURCHASE_RECORDED = {
    "event_type": "STOCK_PURCHASE_RECORDED",
    "payload": {
        "item_id": 123,
        "category": "feed_ingredient",
        "name": "Maize",
        "quantity": 500,
        "unit": "kg",
        "unit_cost": 2.50,
        "total_cost": 1250.00,
        "supplier_id": 5,
        "farm_id": 1
    }
}
# Handler: UnifiedExpenseService.on_stock_purchase()
# Action: Auto-create expense based on category

# Stock Low Alert
STOCK_LOW = {
    "event_type": "STOCK_LOW",
    "payload": {
        "item_id": 123,
        "name": "Maize",
        "quantity_available": 45,
        "reorder_level": 100,
        "reorder_quantity": 500,
        "supplier_id": 5,
        "farm_id": 1
    }
}
# Handler: NotificationService.on_stock_low()
# Action: Send alert to farmer

# Stock Depleted
STOCK_DEPLETED = {
    "event_type": "STOCK_DEPLETED",
    "payload": {
        "item_id": 123,
        "name": "Maize",
        "category": "feed_ingredient",
        "farm_id": 1
    }
}
# Handler: FeedFormulationService.on_stock_depleted()
# Action: Block feed formulation using this ingredient
```

### Events Subscribed

```python
# Feed Formulation Confirmed (Automatic Pattern Only)
FEED_FORMULATION_CONFIRMED = {
    "event_type": "FEED_FORMULATION_CONFIRMED",
    "payload": {
        "formulation_id": 456,
        "batch_id": 10,
        "production_system": "intensive",  # Only process if intensive
        "ingredients": [
            {"ingredient_id": 123, "quantity": 120, "unit": "kg"},
            {"ingredient_id": 124, "quantity": 80, "unit": "kg"}
        ],
        "farm_id": 1
    }
}
# Handler: StorageIntegrationService.on_feed_formulation_confirmed()
# Action: Auto-allocate stock to batch, update quantities, check low stock

# Health Task Completed (Automatic Pattern Only)
HEALTH_TASK_COMPLETED = {
    "event_type": "HEALTH_TASK_COMPLETED",
    "payload": {
        "task_id": 789,
        "batch_id": 10,
        "production_system": "intensive",  # Only process if intensive
        "medication_id": 45,
        "quantity_used": 2,
        "unit": "bottles",
        "farm_id": 1
    }
}
# Handler: StorageIntegrationService.on_health_task_completed()
# Action: Auto-allocate stock to batch, update quantities, check low stock
```

---

## Stock Allocation Strategy

### FIFO with Quality Preference

When allocating stock to batches (Automatic pattern), the system uses a **FIFO (First In, First Out) with Quality Preference** algorithm:

**Algorithm:**
1. **Quality Filtering:** Exclude poor/damaged/expired items
2. **Expiry Date Priority:** Use items closest to expiry first (within quality tier)
3. **Quality Preference:** Within same expiry window, prefer excellent > good > fair
4. **Multi-Location Optimization:** Select from nearest storage location

**Implementation:**
```python
async def select_stock_for_allocation(
    item_id: int,
    quantity_needed: float,
    batch_id: int
) -> List[StockItemAllocation]:
    """
    Select optimal stock items for batch allocation using FIFO + quality preference.
    """
    
    # Get available stock items
    stock_items = await get_available_stock_items(item_id)
    
    # Filter by quality (exclude poor/damaged/expired)
    quality_filtered = [
        item for item in stock_items 
        if item.quality_grade in ['excellent', 'good', 'fair']
        and (not item.expiry_date or item.expiry_date > date.today() + timedelta(days=7))
    ]
    
    # Sort by expiry date (oldest first), then quality (best first)
    sorted_items = sorted(
        quality_filtered, 
        key=lambda x: (
            x.expiry_date or date.max,  # Items without expiry last
            ['excellent', 'good', 'fair'].index(x.quality_grade) if x.quality_grade else 999
        )
    )
    
    # Allocate from sorted items
    allocations = []
    remaining = quantity_needed
    
    for item in sorted_items:
        if remaining <= 0:
            break
        
        allocation_qty = min(remaining, item.available_quantity)
        allocations.append(StockItemAllocation(
            stock_item_id=item.id,
            quantity=allocation_qty,
            unit_cost=item.unit_cost,
            quality_grade=item.quality_grade,
            expiry_date=item.expiry_date
        ))
        remaining -= allocation_qty
    
    return allocations
```

**Quality Grade Definitions:**
- **Excellent:** Fresh stock, optimal quality, no issues
- **Good:** Normal stock, acceptable quality, minor cosmetic issues
- **Fair:** Older stock, acceptable quality, approaching expiry (>7 days remaining)
- **Poor:** Near expiry (<7 days), quality degradation, use with caution
- **Damaged:** Physical damage, contamination, do not use

**Expiry Date Buffer:**
- 7-day minimum buffer before expiry
- Items expiring within 7 days excluded from automatic allocation
- Manual override available for emergency use

---

## Ingredient Availability Checking

### Real-Time Availability Service

The system provides real-time ingredient availability checking for the Feed Calculator to prevent over-allocation and enable "Reserve Available + Purchase Remainder" workflows.

**Features:**
- Check current stock levels across all storage locations
- Consider existing reservations (prevent double-allocation)
- Filter by quality grade and expiry date
- Species safety verification (block unsafe ingredients)
- Partial availability handling (some stock + some purchase)
- Shopping list generation for shortfalls

**API Endpoint:**
```
POST /api/v1/stock/check-availability

Request Body:
{
  "ingredients": [
    { "name": "Maize", "quantity": 120, "unit": "kg" },
    { "name": "Soybean Meal", "quantity": 80, "unit": "kg" }
  ],
  "batch_id": 10,
  "species": "broiler",
  "required_date": "2026-01-20"
}

Response:
{
  "overall_status": "partial",  // sufficient, partial, insufficient
  "ingredients": [
    {
      "name": "Maize",
      "requested": 120,
      "available": 120,
      "shortfall": 0,
      "status": "sufficient",
      "quality_grades": ["excellent", "good"],
      "locations": ["Main Store"],
      "estimated_cost": 300.00
    },
    {
      "name": "Soybean Meal",
      "requested": 80,
      "available": 50,
      "shortfall": 30,
      "status": "partial",
      "quality_grades": ["good"],
      "locations": ["Main Store"],
      "estimated_cost": 200.00,
      "purchase_needed": 30,
      "purchase_cost_estimate": 120.00
    }
  ],
  "total_shortfall_cost": 120.00,
  "can_proceed": true,
  "recommendation": "reserve_available_and_purchase_remainder"
}
```

**Integration with Feed Calculator:**

The Feed Calculator calls availability check before showing results:

```typescript
// In Feed Calculator Results Display
const checkIngredientAvailability = async (ingredients) => {
  const response = await stockService.checkAvailability({
    ingredients,
    batch_id: currentBatch.id,
    species: currentBatch.species,
    required_date: new Date()
  })
  
  // Update UI based on availability
  ingredients.forEach((ingredient, index) => {
    const availability = response.ingredients[index]
    
    if (availability.status === 'sufficient') {
      // Highlight in green - "Reserve from stock"
      ingredient.source = 'stock'
      ingredient.source_color = 'green'
    } else if (availability.status === 'partial') {
      // Highlight in yellow - "Reserve 50kg + Purchase 30kg"
      ingredient.source = 'mixed'
      ingredient.source_color = 'yellow'
      ingredient.stock_portion = availability.available
      ingredient.purchase_portion = availability.shortfall
    } else {
      // Highlight in red - "Purchase 80kg"
      ingredient.source = 'purchase'
      ingredient.source_color = 'red'
    }
  })
}
```

**Reservation Management:**

When farmer confirms feed formulation, the system:
1. Creates reservations for available stock
2. Adds shortfall items to shopping list
3. Prevents double-allocation across batches
4. Expires reservations after 7 days if not consumed

---

## Service Layer

```python
class StorageIntegrationService:
    """
    Handles stock allocation and consumption tracking.
    Integrates with Feed Calculator and Water-Health systems.
    """
    
    async def record_purchase(
        self,
        category: StockCategory,
        name: str,
        quantity: float,
        unit: str,
        unit_cost: float,
        supplier_id: Optional[int] = None,
        storage_location: Optional[str] = None
    ) -> InventoryItem:
        """
        Record stock purchase and auto-create expense.
        
        Flow:
        1. Create/update InventoryItem
        2. Publish STOCK_PURCHASE_RECORDED event
        3. UnifiedExpenseService handler creates expense
        4. Check low stock threshold
        """
        pass
    
    async def allocate_stock_to_batch(
        self,
        item_id: int,
        batch_id: int,
        quantity: float,
        allocation_type: AllocationType,
        source_id: Optional[int] = None
    ) -> StockAllocation:
        """
        Allocate stock to batch (Automatic pattern).
        
        Flow:
        1. Validate sufficient stock available
        2. Create StockAllocation record
        3. Update InventoryItem quantities
        4. Check low stock threshold
        5. Publish STOCK_ALLOCATED event
        """
        pass
    
    async def consume_stock(
        self,
        allocation_id: int,
        quantity_consumed: float
    ) -> StockAllocation:
        """
        Mark stock as consumed (Flexible pattern).
        
        Flow:
        1. Update StockAllocation status
        2. Update consumed_at timestamp
        3. Publish STOCK_CONSUMED event
        """
        pass
    
    async def check_low_stock(self, item_id: int) -> None:
        """
        Check if item is below reorder level.
        
        Flow:
        1. Compare quantity_available with reorder_level
        2. Update is_low_stock flag
        3. Publish STOCK_LOW event if below threshold
        """
        pass
    
    async def on_feed_formulation_confirmed(self, event: BatchEvent) -> None:
        """
        Event handler for FEED_FORMULATION_CONFIRMED (Automatic pattern only).
        
        Flow:
        1. Check production_system == "intensive"
        2. For each ingredient in formulation:
           - Allocate stock to batch
           - Update quantities
           - Check low stock
        3. If any ingredient depleted, publish STOCK_DEPLETED
        """
        pass
    
    async def on_health_task_completed(self, event: BatchEvent) -> None:
        """
        Event handler for HEALTH_TASK_COMPLETED (Automatic pattern only).
        
        Flow:
        1. Check production_system == "intensive"
        2. Allocate medication/vaccine stock to batch
        3. Update quantities
        4. Check low stock
        """
        pass
```

---

## Acceptance Criteria

### Functional Requirements

**Stock Purchase Recording:**
- [ ] Farmer can record stock purchase with category, name, quantity, unit, cost
- [ ] System auto-creates expense based on category (Feed → Feed expense, Medication → Health expense)
- [ ] Supplier information can be optionally recorded
- [ ] Storage location can be specified
- [ ] Purchase updates inventory quantities immediately

**Batch Allocation (Automatic Pattern):**
- [ ] Feed formulation auto-allocates ingredients to batch
- [ ] Health task completion auto-allocates medications/vaccines to batch
- [ ] Stock allocation creates StockAllocation record
- [ ] Inventory quantities updated (quantity_available decreases, quantity_allocated increases)
- [ ] Low stock check triggered after allocation

**Manual Consumption (Flexible Pattern):**
- [ ] Farmer can manually record stock consumption for semi-intensive batches
- [ ] Consumption updates inventory quantities
- [ ] Consumption history tracked per batch

**Low Stock Alerts:**
- [ ] System checks reorder level after every stock change
- [ ] Alert banner displayed when items below reorder level
- [ ] Alert shows item name, current stock, reorder level
- [ ] Farmer can view low stock items in dedicated view
- [ ] Reorder suggestions based on consumption rate

**Stock Transfers:**
- [ ] Farmer can transfer stock between storage locations
- [ ] Transfer reason can be recorded
- [ ] Transfer history tracked per item

**Supplier Management:**
- [ ] Farmer can add/edit suppliers
- [ ] Supplier contact information stored
- [ ] Supplier categories tracked
- [ ] Quick reorder from supplier

### Integration Requirements

**Feed Calculator Integration:**
- [ ] Feed formulation triggers FEED_FORMULATION_CONFIRMED event
- [ ] StorageIntegrationService handler allocates ingredients (Automatic pattern only)
- [ ] Insufficient stock blocks feed formulation
- [ ] Stock depletion blocks ingredient selection

**Water-Health Integration:**
- [ ] Health task completion triggers HEALTH_TASK_COMPLETED event
- [ ] StorageIntegrationService handler allocates medications/vaccines (Automatic pattern only)
- [ ] Insufficient stock blocks health task completion
- [ ] Stock depletion blocks medication selection

**Finance Integration:**
- [ ] Stock purchase triggers STOCK_PURCHASE_RECORDED event
- [ ] UnifiedExpenseService handler creates expense
- [ ] Expense category determined by stock category
- [ ] Expense amount equals total_cost

### Performance Requirements

- [ ] Stock dashboard loads in < 1 second
- [ ] Purchase recording completes in < 500ms
- [ ] Stock allocation completes in < 300ms
- [ ] Low stock check completes in < 200ms

### UI/UX Requirements

- [ ] Category-based stock organization (5 categories)
- [ ] Low stock items highlighted in red
- [ ] Alert banner for low stock items
- [ ] Quick purchase action from stock dashboard
- [ ] Batch allocation modal for Automatic pattern
- [ ] Manual consumption entry for Flexible pattern
- [ ] Supplier quick contact from stock details

---

## Implementation Notes

### Dual Pattern Handling

```python
# In StorageIntegrationService.on_feed_formulation_confirmed()
async def on_feed_formulation_confirmed(self, event: BatchEvent) -> None:
    # Check production system
    batch = await self.batch_repo.get(event.payload["batch_id"])
    
    if batch.production_system == ProductionSystem.INTENSIVE:
        # Automatic pattern: Auto-allocate stock
        for ingredient in event.payload["ingredients"]:
            await self.allocate_stock_to_batch(
                item_id=ingredient["ingredient_id"],
                batch_id=batch.id,
                quantity=ingredient["quantity"],
                allocation_type=AllocationType.FEED_FORMULATION,
                source_id=event.payload["formulation_id"]
            )
    else:
        # Flexible pattern: No automatic allocation
        # Farmer will manually record consumption later
        pass
```

### Low Stock Threshold Logic

```python
async def check_low_stock(self, item_id: int) -> None:
    item = await self.inventory_repo.get(item_id)
    
    # Check if below reorder level
    is_low = item.quantity_available < item.reorder_level
    
    if is_low != item.is_low_stock:
        # Status changed
        item.is_low_stock = is_low
        await self.inventory_repo.update(item)
        
        if is_low:
            # Publish alert
            await self.event_bus.publish(BatchEvent(
                event_type=EventType.STOCK_LOW,
                payload={
                    "item_id": item.id,
                    "name": item.name,
                    "quantity_available": item.quantity_available,
                    "reorder_level": item.reorder_level,
                    "reorder_quantity": item.reorder_quantity,
                    "supplier_id": item.supplier_id,
                    "farm_id": item.farm_id
                }
            ))
```

### Category-Based Expense Creation

```python
# In UnifiedExpenseService.on_stock_purchase()
async def on_stock_purchase(self, event: BatchEvent) -> None:
    category_mapping = {
        StockCategory.FEED_INGREDIENT: ExpenseCategory.FEED,
        StockCategory.MEDICATION: ExpenseCategory.HEALTH,
        StockCategory.VACCINE: ExpenseCategory.HEALTH,
        StockCategory.SUPPLEMENT: ExpenseCategory.FEED,
        StockCategory.EQUIPMENT: ExpenseCategory.EQUIPMENT
    }
    
    expense_category = category_mapping[event.payload["category"]]
    
    await self.create_expense(
        farm_id=event.payload["farm_id"],
        category=expense_category,
        amount=event.payload["total_cost"],
        description=f"Stock purchase: {event.payload['name']} ({event.payload['quantity']} {event.payload['unit']})",
        source="stock_purchase",
        source_id=event.payload["item_id"],
        is_auto_generated=True
    )
```

---

## References

- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/35142770-c1b0-4df2-85e2-5a839616334a (Backend Architecture)
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/fb99cad1-d468-4a18-bd81-d987f1ae6f63 (Feed Calculator System)
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/2a098707-5645-4c66-ba4b-27e04df312ca (Water-Health System)
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/9024827f-8dea-465d-800c-cdf5749dc498 (Finance System)
- file:priest/13-stock-management-visual-ux/ (Stock management research)
- file:priest/04-integration-layer/ADR-002-EVENT-DRIVEN-INTEGRATION.md (Event-driven integration)
- file:priest/06-backend-service-layer/01-SERVICE-ARCHITECTURE-SPEC.md (Service architecture)

---

**Status:** Production-Ready  
**Last Updated:** 2026-01-16  
**Version:** 1.0.0
