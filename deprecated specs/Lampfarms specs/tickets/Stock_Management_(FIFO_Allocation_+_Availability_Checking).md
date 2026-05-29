# Stock Management (FIFO Allocation + Availability Checking)

## Overview

Implement complete Stock Management system with batch allocation, FIFO + quality preference algorithm, ingredient availability checking, and automatic expense creation.

## Scope

**In Scope:**
- Implement Stock Management API endpoints (10 endpoints)
- Build stock dashboard (5 category tabs: Feed Ingredients, Medications, Vaccines, Supplements, Equipment)
- Build purchase recording modal (category-based with supplier selection)
- Build stock allocation modal (batch selection for Automatic pattern)
- Build stock transfer modal (between storage locations)
- Implement FIFO + quality preference allocation algorithm
- Implement ingredient availability checking (Feed Calculator integration)
- Implement reservation management (prevent double-allocation)
- Implement low stock alerts (reorder level triggers)
- Implement automatic expense creation (STOCK_PURCHASE_RECORDED event)
- Implement quality grades (excellent, good, fair, poor, damaged)
- Implement expiry date tracking (7-day buffer)

**Out of Scope:**
- Bulk purchase optimization (Phase 4)
- Purchase workflow coordination (Phase 4)
- Supplier management UI (Phase 3)

## Spec References

- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/e5714a4e-bc2c-494e-9725-b8797c41b5d2 (Stock Management System)
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/f8459c0d-edda-4273-a388-05dc54be731b (Core Flows - Stock Purchase Journey)

## FIFO + Quality Allocation Algorithm

```python
async def select_stock_for_allocation(
    item_id: int,
    quantity_needed: float,
    batch_id: int
) -> List[StockItemAllocation]:
    # 1. Get available stock items
    stock_items = await get_available_stock_items(item_id)
    
    # 2. Filter by quality (exclude poor/damaged/expired)
    quality_filtered = [
        item for item in stock_items 
        if item.quality_grade in ['excellent', 'good', 'fair']
        and not item.is_expired
    ]
    
    # 3. Sort by expiry (oldest first), then quality (best first)
    sorted_items = sorted(
        quality_filtered, 
        key=lambda x: (
            x.expiry_date or datetime.max,  # FIFO
            quality_score(x.quality_grade)   # Quality preference
        )
    )
    
    # 4. Allocate from sorted items
    allocations = []
    remaining = quantity_needed
    for item in sorted_items:
        if remaining <= 0:
            break
        allocation_qty = min(remaining, item.available_quantity)
        allocations.append(StockItemAllocation(
            stock_item_id=item.id,
            quantity=allocation_qty
        ))
        remaining -= allocation_qty
    
    return allocations
```

## Ingredient Availability Checking

**API Endpoint:**
```
POST /api/v1/stock/check-availability

Request:
{
  "ingredients": [
    { "name": "Maize", "quantity": 120, "unit": "kg" },
    { "name": "Soybean Meal", "quantity": 80, "unit": "kg" }
  ],
  "batch_id": 10,
  "species": "broiler"
}

Response:
{
  "overall_status": "partial",
  "ingredients": [
    {
      "name": "Maize",
      "requested": 120,
      "available": 120,
      "status": "sufficient",
      "quality_grades": ["excellent", "good"]
    },
    {
      "name": "Soybean Meal",
      "requested": 80,
      "available": 50,
      "shortfall": 30,
      "status": "partial"
    }
  ]
}
```

## Acceptance Criteria

- [ ] Stock dashboard displays all inventory (5 category tabs)
- [ ] Purchase recording creates expense automatically (category-based)
- [ ] FIFO + quality allocation working (oldest first, best quality preferred)
- [ ] Quality grades tracked (excellent, good, fair, poor, damaged)
- [ ] Expiry date tracking with 7-day buffer
- [ ] Ingredient availability checking integrated with Feed Calculator
- [ ] Reservation management prevents double-allocation
- [ ] Low stock alerts trigger at reorder level
- [ ] Stock transfer between locations working
- [ ] Automatic expense creation from stock purchase
- [ ] Category-based expense mapping (Feed Ingredients → Feed, Medications → Health, etc.)

## Dependencies

- **Ticket 1:** InventoryItem, StockAllocation, StockTransfer, Supplier models
- **Ticket 3:** StorageIntegrationService, UnifiedExpenseService, EventBusService
- **Ticket 6:** Feed Calculator calls availability checking

## Estimated Effort

**6 days**