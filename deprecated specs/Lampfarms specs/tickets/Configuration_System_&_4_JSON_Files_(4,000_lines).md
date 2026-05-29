# Configuration System & 4 JSON Files (4,000 lines)

## Overview

Create the configuration system with 4 JSON files containing all species protocols, vaccination schedules, ingredients, and medications. This enables configuration-driven behavior across all systems.

## Scope

**In Scope:**
- Create 4 configuration JSON files in file:backend/config/:
  - species.json (500 lines, 4 species with week-by-week protocols)
  - species_protocols.json (800 lines, 36 vaccination protocols)
  - ingredients.json (1,200 lines, 41 ingredients with nutritional profiles)
  - medications.json (1,500 lines, 52 medications with dosages/conflicts)
- Implement ConfigService with 3-tier hierarchy (cache → DB overrides → JSON files)
- Add configuration validation
- Add database override capability

**Out of Scope:**
- Services that consume configuration (Ticket 3)
- UI for configuration management (Ticket 13)

## Spec References

- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/dfa10566-d896-41f4-805f-953f7b47d5f3 (Species-Specific - species.json, species_protocols.json)
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/fb99cad1-d468-4a18-bd81-d987f1ae6f63 (Feed Calculator - ingredients.json)
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/2a098707-5645-4c66-ba4b-27e04df312ca (Water-Health - medications.json)
- spec:bceeaefd-5139-4801-8c12-de8a8b6faf8a/35142770-c1b0-4df2-85e2-5a839616334a (Backend Architecture - Configuration System)

## Configuration Files Content

**species.json (4 species):**
- Broilers: 8-week, 4 phases, nutritional requirements, temperature/lighting/space schedules
- Layers: 68-week, 6 phases, egg production schedules, calcium requirements
- Ducks: 10-week, 4 phases, niacin requirements, water consumption (2-3x chickens), foraging modifiers
- Turkeys: 16-week, 5 phases, higher space/temperature, foraging modifiers, Blackhead prevention

**species_protocols.json (36 vaccination protocols):**
- Broilers: 6 protocols (Gumboro, HB1, Gumboro Plus x2, Lasota, Deworming)
- Layers: 12 protocols (Gumboro, HB1, Gumboro Plus x2, Lasota x2, Fowl Pox x2, Deworming x2, Newcastle, Ongoing)
- Ducks: 6 protocols (Duck Viral Hepatitis, Duck Plague x2, Newcastle, Deworming x2)
- Turkeys: 12 protocols (Gumboro, HB1, Gumboro Plus x2, Fowl Pox x3, Lasota x2, Deworming x2, Newcastle)

**ingredients.json (41 ingredients):**
- 9 Energy Sources (Maize, Sorghum, Millet, Cassava, Wheat Bran, Rice Bran, Oils, Molasses)
- 15 Protein Sources (Soybean Meal, Groundnut Cake, Fish Meal, Palm Kernel Cake, Cotton Seed Cake, Blood Meal, BSF Larvae, Azolla, etc.)
- 6 Calcium Sources (Limestone, Oyster Shell, Bone Meal, DCP, MCP, Eggshell)
- 11 Supplements (Salt, Lysine, Methionine, Toxin Binder, Premixes, Niacin, Coccidiostat, Blackhead Preventive)

**medications.json (52 medications):**
- 8 Coccidiostats (CORID, Albon, Sulmet, Baycox, etc.)
- 15 Antibiotics (Terramycin, Tylan, Baytril, Lincomycin, Amoxicillin, etc.)
- 6 Dewormers (Safe-Guard, Wazine, Levamisole, Ivermectin, Albendazole, Praziquantel)
- 13 Vitamins/Supplements (Multivitamins, Electrolytes, Vitamin C, Glucose, etc.)
- 4 Antifungals (Nystatin, Copper Sulfate, Ketoconazole, Amphotericin B)
- 7 Traditional Remedies (Aloe, Neem, Papaya, Garlic, Turmeric, Oregano, ACV)

## ConfigService Implementation

```python
class ConfigService:
    def __init__(self):
        self._cache = {}
        self._json_data = {}
    
    async def load_species_config(self, species: str) -> dict:
        # 3-tier hierarchy: cache → DB → JSON
        if species in self._cache:
            return self._cache[species]
        
        # Check database overrides
        db_override = await get_db_override(species)
        if db_override:
            self._cache[species] = db_override
            return db_override
        
        # Load from JSON file
        json_data = self._load_json("species.json")[species]
        self._cache[species] = json_data
        return json_data
```

## Acceptance Criteria

- [ ] All 4 JSON files created in file:backend/config/
- [ ] species.json has complete week-by-week protocols for 4 species
- [ ] species_protocols.json has all 36 vaccination protocols
- [ ] ingredients.json has all 41 ingredients with nutritional profiles
- [ ] medications.json has all 52 medications with dosages/conflicts
- [ ] ConfigService implemented with 3-tier hierarchy
- [ ] Configuration loads on app startup
- [ ] Database overrides work correctly
- [ ] Validation prevents invalid configuration
- [ ] JSON files are valid and parseable

## Dependencies

**None** - Can run in parallel with Ticket 1

## Estimated Effort

**4 days**