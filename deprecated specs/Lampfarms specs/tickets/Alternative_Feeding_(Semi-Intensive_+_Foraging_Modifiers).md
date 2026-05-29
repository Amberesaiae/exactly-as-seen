# Alternative Feeding (Semi-Intensive + Foraging Modifiers)

## Overview

Implement alternative feeding architecture for semi-intensive and free-range production systems with foraging modifiers for ducks (Week 6+) and turkeys (Week 8+).

## Scope

**In Scope:**
- Implement alternative feeding toggle in batch creation (ducks/turkeys only)
- Implement foraging modifier calculations (ducks 15-30%, turkeys 12-28%)
- Build manual feed recording modal (Flexible pattern)
- Implement weight monitoring protocols
- Implement foraging area validation
- Integrate with Feed Calculator (reduce feed requirements based on foraging)
- Implement Flexible pattern workflows (manual expense, manual stock allocation)

**Out of Scope:**
- Advanced foraging analytics (Phase 4)
- Foraging source tracking (Phase 4)

## Spec References

- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/f81d53af-2866-4a23-a455-293cb5b0b141 (Alternative Feeding Architecture)
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/dfa10566-d896-41f4-805f-953f7b47d5f3 (Species-Specific - Foraging Modifiers)

## Foraging Modifiers

**Ducks (Week 6+):**
- Foraging reduction: 15-30% (configurable)
- Foraging sources: Grass, insects, snails, aquatic plants
- Space requirement: 10-15 sq ft per bird (semi-intensive)

**Turkeys (Week 8+):**
- Foraging reduction: 12-28% (configurable)
- Foraging sources: Grass, insects, seeds, grains
- Space requirement: 5-8 sq ft per bird (semi-intensive)

## Feed Calculation with Foraging

```python
# Intensive (Automatic)
daily_feed = population × daily_intake_per_bird

# Semi-Intensive (Flexible) - Week 6+ for ducks
if alternative_feeding_enabled and current_week >= 6:
    foraging_modifier = 0.20  # 20% reduction
    daily_feed = population × daily_intake_per_bird × (1 - foraging_modifier)
```

## Acceptance Criteria

- [ ] Alternative feeding toggle works in batch creation (ducks/turkeys only)
- [ ] Foraging modifiers reduce feed calculations correctly
- [ ] Manual feed recording modal working (Flexible pattern)
- [ ] Weight monitoring alerts trigger if weight loss detected
- [ ] Foraging area validation prevents errors (minimum space requirements)
- [ ] Feed Calculator integrates foraging reduction
- [ ] Flexible pattern workflows working (manual expense, manual stock)

## Dependencies

- **Ticket 5:** Batch with alternative_feeding_enabled field
- **Ticket 6:** Feed Calculator integration

## Estimated Effort

**3 days**