# 🚀 Refit System Migration Plan - Option A

## Overview
Migrate from legacy refit system in `gameUtils.js` to the new canonical refit system in `src/utils/refits/` with minimal risk and maximum safety.

## 🎯 Goals
- ✅ Remove dual refit system conflicts
- ✅ Maintain all existing functionality  
- ✅ Improve maintainability and extensibility
- ✅ Zero data loss
- ✅ Gradual, testable migration

## 🔍 Current State Analysis

### Legacy System (src/utils/gameUtils.js)
**Used by:**
- `BuildView.jsx` - `getModifiedWeaponOptions()` for weapon selection UI
- `PlayViewCard.jsx` - `getWeaponData()` for weapon display with refit effects
- `PlayViewSquadronCard.jsx` - `getWeaponData()` for weapon display

**Key Functions:**
- `applyWeaponRefitEffects()` - Applies legacy refit modifications to weapons
- `getModifiedWeaponOptions()` - Modifies weapon options based on refits
- `shouldApplyWeaponModification()` - Checks if refit applies to weapon

### New Canonical System (src/utils/refits/)
**Features:**
- Complete JSDoc type definitions
- Robust validation and error handling
- Pure functions with deep cloning
- Comprehensive test coverage
- Migration from legacy JSON format

## 📋 Migration Phases

### Phase 1: Integration Layer (SAFEST - No Breaking Changes)
**Risk Level: 🟢 LOW**

Create adapter functions that bridge old and new systems:

1. **Create `src/utils/refits/adapter.js`**
   - `adaptLegacyRefitToCanonical(legacyRefit)` 
   - `getCanonicalWeaponData(weapon, ship)` - Wrapper for legacy `getWeaponData()`
   - `getCanonicalModifiedOptions(options, ship, location)` - Wrapper for `getModifiedWeaponOptions()`

2. **Benefits:**
   - Zero risk of breaking existing functionality
   - Both systems work simultaneously
   - Can test new system without affecting UI
   - Easy rollback if issues found

### Phase 2: Data Migration (MEDIUM RISK)
**Risk Level: 🟡 MEDIUM**

Migrate data loading to use canonical format:

1. **Update `App.jsx` faction loading:**
   ```javascript
   // Add after loading factions data
   const migratedFactions = {};
   for (const [name, data] of Object.entries(factionsData)) {
     migratedFactions[name] = {
       ...data,
       canonicalRefits: migrateFactionRefits(data, name)
     };
   }
   ```

2. **Update props passed to components:**
   - Pass `canonicalRefits` alongside legacy refit data
   - Components can choose which system to use

### Phase 3: UI Component Migration (HIGHEST RISK)
**Risk Level: 🔴 HIGH** 

Migrate UI components one by one:

1. **Start with PlayView components (least risk):**
   - These only display data, don't modify it
   - `PlayViewCard.jsx` → use canonical weapon display
   - `PlayViewSquadronCard.jsx` → use canonical weapon display

2. **Then BuildView (highest risk):**
   - This modifies ship loadouts and applies refits
   - Most complex integration point
   - Requires careful testing

### Phase 4: Legacy System Removal
**Risk Level: 🟢 LOW** (after Phase 3 complete)

Remove old functions from `gameUtils.js`:
- `applyWeaponRefitEffects()`
- `getModifiedWeaponOptions()`  
- `shouldApplyWeaponModification()`
- `getAttackBonus()`

## 🛠️ Implementation Strategy

### Step 1: Create Adapter Layer (This Week)
```javascript
// src/utils/refits/adapter.js
import { migrateFactionRefits } from './migrate.js';
import { applyRefit } from './apply.js';
import { getWeaponData as legacyGetWeaponData } from '../gameUtils.js';

// Adapter that uses new system but maintains old interface
export function getWeaponDataCanonical(weapon, allWeapons, ship) {
  // Use new canonical system if ship has canonical refit data
  if (ship?.canonicalRefit) {
    // Apply canonical refit effects
    return applyCanonicalWeaponEffects(weapon, ship);
  }
  
  // Fallback to legacy system
  return legacyGetWeaponData(weapon, allWeapons, ship);
}

export function getModifiedWeaponOptionsCanonical(weaponOptions, ship, location) {
  // Similar pattern - new system first, legacy fallback
}
```

### Step 2: Gradual Component Updates
1. **Week 1**: Create adapter layer
2. **Week 2**: Update data loading in App.jsx  
3. **Week 3**: Migrate PlayView components
4. **Week 4**: Migrate BuildView (most complex)
5. **Week 5**: Remove legacy system

### Step 3: Testing Strategy
- **Unit tests**: Test each adapter function
- **Integration tests**: Test UI components with both systems
- **Regression tests**: Ensure existing functionality works
- **User testing**: Test all refit workflows manually

## 🚨 Risk Mitigation

### Rollback Plan
```javascript
// Feature flag approach
const USE_CANONICAL_REFITS = false; // Can toggle in emergency

export function getWeaponData(weapon, allWeapons, ship) {
  if (USE_CANONICAL_REFITS) {
    return getWeaponDataCanonical(weapon, allWeapons, ship);
  }
  return legacyGetWeaponData(weapon, allWeapons, ship);
}
```

### Data Backup
- Backup current `factions.json` before any changes
- Test migration on copy of data first
- Version control all changes

### Validation
- Compare old vs new refit results for same ships
- Automated tests for critical refit combinations
- Manual testing of all faction refits

## 📊 Success Metrics

### Functionality Preserved
- ✅ All existing refits work identically
- ✅ No data loss during migration
- ✅ Performance maintained or improved
- ✅ No UI regressions

### Code Quality Improved  
- ✅ Reduced code duplication
- ✅ Better type safety with JSDoc
- ✅ More maintainable architecture
- ✅ Comprehensive test coverage

## 🗓️ Timeline

### Week 1: Foundation (Low Risk)
- Create adapter layer
- Add feature flags
- Unit tests for adapters

### Week 2: Data Integration (Medium Risk)  
- Update App.jsx data loading
- Add canonical refit data to state
- Integration tests

### Week 3: Display Migration (Medium Risk)
- Migrate PlayView components
- Test weapon display with new system
- User acceptance testing

### Week 4: Build System Migration (High Risk)
- Migrate BuildView components
- Test weapon option modification
- Test refit application workflow
- Extensive regression testing

### Week 5: Cleanup (Low Risk)
- Remove legacy functions
- Remove feature flags
- Final testing
- Documentation update

## 🎯 Next Immediate Actions

1. **Create adapter layer** - bridges old/new systems safely
2. **Add feature flags** - enable easy rollback
3. **Write migration tests** - ensure compatibility
4. **Update App.jsx** - add canonical data loading

This plan ensures we can migrate with confidence while maintaining the ability to rollback at any point.
