/**
 * Canonical weapon data handling functions
 * Replaces legacy weapon functions from gameUtils.js
 */

import { cleanWeaponSpec, inferWeaponKind } from './normalize.js';

/**
 * Get fighter bay stats for special weapon types
 * @param {string} weaponName - Name of weapon
 * @returns {Object|null} Fighter bay stats or null
 */
export function getFighterBayStats(weaponName) {
  if (weaponName === "Fighter Bays" || weaponName === "Hive Bays" || weaponName === "Drone Bay") {
    return {
      targets: "Any",
      attacks: "1d6*",
      range: "18″"
    };
  }
  return null;
}

/**
 * Get weapon data by index from ship definition
 * @param {number|Object} weaponRef - Weapon index or weapon object with optionIndex
 * @param {Object} shipDef - Ship definition with weapon options
 * @param {string} location - Weapon location ('prow', 'hull', 'turret')
 * @param {Object} ship - Ship object with potential refit data
 * @returns {Object} Complete weapon data
 */
export function getWeaponDataByIndex(weaponRef, shipDef, location, ship = null) {
  // Handle direct weapon objects (already complete)
  if (weaponRef && typeof weaponRef === 'object' && weaponRef.targets) {
    const cleaned = cleanWeaponSpec(weaponRef);
    const withRefits = applyCanonicalRefitEffects(cleaned, ship);
    return applyLiberationistAdvancement(withRefits, ship, location);
  }
  
  // Handle beginsWith weapons that need special stats (like Drone Bay)
  if (weaponRef && typeof weaponRef === 'object' && weaponRef.name) {
    // Check if this is a special weapon that needs standardized stats (regardless of location parameter)
    if (weaponRef.name === "Fighter Bays" || weaponRef.name === "Hive Bays" || weaponRef.name === "Drone Bay") {
      const fighterBayStats = getFighterBayStats(weaponRef.name);
      if (fighterBayStats) {
        const weaponData = cleanWeaponSpec({ name: weaponRef.name, ...fighterBayStats });
        const withRefits = applyCanonicalRefitEffects(weaponData, ship);
        return applyLiberationistAdvancement(withRefits, ship, location);
      }
    }
    // For beginsWith weapons or other complete weapon objects, use the data as-is if it has stats
    if (location === 'begins' || weaponRef.targets || weaponRef.attacks || weaponRef.range) {
      const cleaned = cleanWeaponSpec(weaponRef);
      const withRefits = applyCanonicalRefitEffects(cleaned, ship);
      return applyLiberationistAdvancement(withRefits, ship, location);
    }
  }
  
  // Handle index references
  let optionIndex;
  if (typeof weaponRef === 'number') {
    optionIndex = weaponRef;
  } else if (weaponRef && typeof weaponRef === 'object' && weaponRef.optionIndex !== undefined) {
    optionIndex = weaponRef.optionIndex;
  } else {
    console.error('Invalid weapon reference:', weaponRef);
    return { name: "Unknown", kind: "other", targets: "Front", attacks: 1, range: 12 };
  }
  
  // Get weapon from ship definition
  const options = shipDef?.[location]?.options;
  if (!options || optionIndex < 0 || optionIndex >= options.length) {
    console.error(`Invalid weapon index ${optionIndex} for ${location} in ship ${shipDef?.className}`);
    return { name: "Unknown", kind: "other", targets: "Front", attacks: 1, range: 12 };
  }
  
  const weaponDef = options[optionIndex];
  
  // Handle Fighter Bays and similar weapons (special case)
  if (weaponDef.name === "Fighter Bays" || weaponDef.name === "Hive Bays" || weaponDef.name === "Drone Bay") {
    const fighterBayStats = getFighterBayStats(weaponDef.name);
    if (fighterBayStats) {
      const weaponData = cleanWeaponSpec({ name: weaponDef.name, ...fighterBayStats });
      const withRefits = applyCanonicalRefitEffects(weaponData, ship);
      return applyLiberationistAdvancement(withRefits, ship, location);
    }
  }
  
  // Return cleaned weapon data
  const weaponData = cleanWeaponSpec(weaponDef);
  const withRefits = applyCanonicalRefitEffects(weaponData, ship);
  return applyLiberationistAdvancement(withRefits, ship, location);
}

/**
 * Convert name-based weapon loadout to index-based loadout
 * @param {Object} ship - Ship with name-based loadout
 * @param {Object} shipDef - Ship definition
 * @returns {Object} Ship with index-based loadout
 */
export function convertLoadoutToIndices(ship, shipDef) {
  if (!ship.loadout || !shipDef) return ship;
  
  const newLoadout = { ...ship.loadout };
  
  // Convert prow weapon
  if (newLoadout.prow && typeof newLoadout.prow === 'object' && newLoadout.prow.name) {
    const prowIndex = shipDef.prow?.options?.findIndex(w => w.name === newLoadout.prow.name);
    if (prowIndex !== -1) {
      newLoadout.prow = { optionIndex: prowIndex };
    }
  }
  
  // Convert hull weapons
  if (Array.isArray(newLoadout.hull)) {
    newLoadout.hull = newLoadout.hull.map(weaponName => {
      if (typeof weaponName === 'string') {
        const hullIndex = shipDef.hull?.options?.findIndex(w => w.name === weaponName);
        return hullIndex !== -1 ? { optionIndex: hullIndex } : weaponName;
      }
      return weaponName; // Already converted or invalid
    });
  }
  
  // Convert turret weapons (if any)
  if (Array.isArray(newLoadout.turret)) {
    newLoadout.turret = newLoadout.turret.map(weaponName => {
      if (typeof weaponName === 'string') {
        const turretIndex = shipDef.turret?.options?.findIndex(w => w.name === weaponName);
        return turretIndex !== -1 ? { optionIndex: turretIndex } : weaponName;
      }
      return weaponName;
    });
  }
  
  return { ...ship, loadout: newLoadout };
}

/**
 * Apply Liberationist capital ship advancement weapon upgrades
 * @param {Object} weaponData - Base weapon data
 * @param {Object} ship - Ship object with potential advancement data
 * @param {string} location - Weapon location ('prow', 'hull', 'begins')
 * @returns {Object} Modified weapon data
 */
function applyLiberationistAdvancement(weaponData, ship, location = null) {
  if (!ship || !ship.capitalShipAdvancement) {
    return weaponData;
  }
  
  const advancement = ship.capitalShipAdvancement;
  
  // Only apply to advancement 5 (Upgraded weapons) with a selected weapon
  if (advancement.roll !== 5 || !advancement.selectedWeapon) {
    return weaponData;
  }
  
  // Check if this weapon matches the selected weapon for upgrade
  // selectedWeapon format: "location:weaponName" (e.g., "prow:Cyclone Guns")
  if (!advancement.selectedWeapon || !advancement.selectedWeapon.includes(':')) {
    return weaponData;
  }
  
  const [selectedLocation, selectedWeaponName] = advancement.selectedWeapon.split(':');
  
  // Must match both weapon name and location
  if (weaponData.name !== selectedWeaponName || location !== selectedLocation) {
    return weaponData;
  }
  
  // Apply the upgrade: +2 attacks (+1 for lasers)
  const modifiedWeapon = { ...weaponData };
  const isLaser = weaponData.name.toLowerCase().includes('laser');
  const bonus = isLaser ? 1 : 2;
  
  // Handle different attack formats
  if (typeof modifiedWeapon.attacks === 'number') {
    modifiedWeapon.attacks += bonus;
  } else if (typeof modifiedWeapon.attacks === 'string') {
    // Try to parse and add bonus
    const numMatch = modifiedWeapon.attacks.match(/^(\d+)/);
    if (numMatch) {
      const baseAttacks = parseInt(numMatch[1]);
      const suffix = modifiedWeapon.attacks.replace(/^\d+/, '');
      modifiedWeapon.attacks = `${baseAttacks + bonus}${suffix}`;
    }
  }
  
  return modifiedWeapon;
}

/**
 * Apply canonical refit effects to weapon data
 * @param {Object} weaponData - Base weapon data
 * @param {Object} ship - Ship with potential refit
 * @returns {Object} Modified weapon data
 */
function applyCanonicalRefitEffects(weaponData, ship) {
  console.log('🔧 applyCanonicalRefitEffects: weapon:', weaponData?.name, 'ship:', ship?.id);
  console.log('🔧 applyCanonicalRefitEffects: ship.appliedCanonicalRefit:', ship?.appliedCanonicalRefit?.name);
  
  if (!ship || !ship.appliedCanonicalRefit) {
    console.log('🔧 applyCanonicalRefitEffects: No refit to apply');
    return weaponData;
  }
  
  const refit = ship.appliedCanonicalRefit;
  console.log('🔧 applyCanonicalRefitEffects: Found refit:', refit.name);
  
  // Check for weapon modifications in the selected option first, then in the base refit
  let weaponChanges = null;
  if (refit.selectedOption?.weaponChanges) {
    weaponChanges = refit.selectedOption.weaponChanges;
  } else if (refit.weaponChanges) {
    weaponChanges = refit.weaponChanges;
  }
  
  // Only process modify operations, not add operations (those are handled elsewhere)
  if (!weaponChanges?.modify) {
    return weaponData;
  }
  
  console.log('🔧 applyCanonicalRefitEffects: Processing', weaponChanges.modify.length, 'modifications');
  
  let modifiedWeapon = { ...weaponData };
  
  // Apply weapon modifications
  for (const modification of weaponChanges.modify) {
    if (shouldApplyCanonicalModification(modification.selector, weaponData, ship)) {
      console.log('WEAPON MODIFIED:', weaponData.name, 'by refit:', refit.name);
      modifiedWeapon = applyCanonicalWeaponModification(modifiedWeapon, modification.changes);
    }
  }
  
  return modifiedWeapon;
}

/**
 * Check if a canonical modification should apply to a weapon
 * @param {Object} selector - Weapon selector
 * @param {Object} weaponData - Weapon data
 * @param {Object} ship - Ship context
 * @returns {boolean}
 */
function shouldApplyCanonicalModification(selector, weaponData, ship) {
  console.log('🔍 shouldApplyCanonicalModification: selector:', selector);
  console.log('🔍 shouldApplyCanonicalModification: weaponData:', weaponData);
  
  if (!selector || Object.keys(selector).length === 0) {
    console.log('🔍 shouldApplyCanonicalModification: No selector, applying to all weapons');
    return true; // Apply to all weapons if no selector
  }
  
  // Check slot matching
  if (selector.slot && selector.slot !== "any") {
    const weaponInSlot = isWeaponInSlot(weaponData.name, selector.slot, ship);
    console.log('🔍 shouldApplyCanonicalModification: Slot check:', selector.slot, 'weapon in slot:', weaponInSlot);
    if (!weaponInSlot) return false;
  }
  
  // Check name matching
  if (selector.nameAny && !selector.nameAny.includes(weaponData.name)) {
    console.log('🔍 shouldApplyCanonicalModification: Name check failed. Required names:', selector.nameAny, 'weapon name:', weaponData.name);
    return false;
  }
  
  // Check kind matching
  if (selector.kindAny && !selector.kindAny.includes(weaponData.kind)) {
    return false;
  }
  
  return true;
}

/**
 * Check if weapon is in specified slot
 * @param {string} weaponName - Name of weapon
 * @param {string} slot - Slot to check
 * @param {Object} ship - Ship object
 * @returns {boolean}
 */
function isWeaponInSlot(weaponName, slot, ship) {
  if (!ship.loadout) return false;
  
  switch (slot) {
    case "prow":
      // Handle both string and object formats for prow weapon
      const prowWeapon = ship.loadout.prow;
      const prowName = typeof prowWeapon === 'string' ? prowWeapon : prowWeapon?.name;
      return prowName === weaponName;
    case "hull":
      return ship.loadout.hull?.includes(weaponName);
    case "begins":
      return ship.loadout.begins?.includes(weaponName);
    default:
      return true;
  }
}

/**
 * Apply weapon modification changes
 * @param {Object} weaponData - Weapon to modify
 * @param {Object} changes - Changes to apply
 * @returns {Object} Modified weapon
 */
function applyCanonicalWeaponModification(weaponData, changes) {
  const modified = { ...weaponData };
  
  if (changes.attacksDelta && typeof modified.attacks === 'number') {
    modified.attacks = Math.max(0, modified.attacks + changes.attacksDelta);
  }
  
  if (changes.rangeDelta && typeof modified.range === 'number') {
    modified.range = Math.max(0, modified.range + changes.rangeDelta);
  }
  
  if (changes.setTargets) {
    modified.targets = changes.setTargets;
  }
  
  return modified;
}

/**
 * Get modified weapon options based on canonical refits
 * @param {Array} weaponOptions - Base weapon options
 * @param {Object} ship - Ship object
 * @param {string} location - Weapon location
 * @returns {Array} Modified weapon options
 */
export function getCanonicalModifiedWeaponOptions(weaponOptions, ship, location) {
  console.log('🔧 getCanonicalModifiedWeaponOptions: location:', location, 'ship:', ship?.id);
  console.log('🔧 getCanonicalModifiedWeaponOptions: ship.appliedCanonicalRefit:', ship?.appliedCanonicalRefit?.name);
  console.log('🔧 getCanonicalModifiedWeaponOptions: ship.loadout?.hull:', ship?.loadout?.hull);
  
  let modifiedOptions = [...weaponOptions];
  
  if (!ship || !ship.appliedCanonicalRefit) {
    console.log('🔧 getCanonicalModifiedWeaponOptions: No refit, returning original options');
    return modifiedOptions;
  }
  
  const refit = ship.appliedCanonicalRefit;
  // Check for weapon changes in both the selected option and the base refit
  const weaponChanges = refit.selectedOption?.weaponChanges || refit.weaponChanges;
  
  console.log('🔧 getCanonicalModifiedWeaponOptions: refit weaponChanges:', weaponChanges);
  console.log('🔧 getCanonicalModifiedWeaponOptions: selectedOption weaponChanges:', refit.selectedOption?.weaponChanges);
  
  if (!weaponChanges) {
    console.log('🔧 getCanonicalModifiedWeaponOptions: No weapon changes, returning original options');
    return modifiedOptions;
  }
  
  // Add weapons from refit additions (only for non-refit locations)
  // Refit slot weapons are handled separately in the UI
  if (weaponChanges.add && location !== 'refit') {
    for (const addition of weaponChanges.add) {
      if (addition.slot === location) {
        const weaponSpec = cleanWeaponSpec({
          ...addition.weapon,
          addedByRefit: true // Mark as refit-added
        });
        
        // Only add if not already in options
        if (!modifiedOptions.some(opt => opt.name === weaponSpec.name)) {
          modifiedOptions.push(weaponSpec);
        }
      }
    }
  }
  
  // Apply unlock options
  if (weaponChanges.unlockOptions) {
    for (const unlock of weaponChanges.unlockOptions) {
      if (unlock.slot === location || unlock.slot === "any") {
        // Support for unlocking existing weapon names
        if (unlock.allowNamesAny) {
          for (const weaponName of unlock.allowNamesAny) {
            if (!modifiedOptions.some(opt => opt.name === weaponName)) {
              modifiedOptions.push(cleanWeaponSpec({ name: weaponName }));
            }
          }
        }
        
        // Support for adding new weapon options
        if (unlock.options) {
          for (const newWeapon of unlock.options) {
            if (!modifiedOptions.some(opt => opt.name === newWeapon.name)) {
              modifiedOptions.push(cleanWeaponSpec(newWeapon));
            }
          }
        }
      }
    }
  }
  
  // Apply replacements
  if (weaponChanges.replace) {
    for (const replacement of weaponChanges.replace) {
      if (replacement.slot === location || replacement.slot === "any") {
        // Check if this is a slot-only replacement (replace all weapons in slot with single weapon)
        const isSlotOnlyReplacement = replacement.selector.slot && 
          !replacement.selector.nameAny && 
          !replacement.selector.kindAny;
        
        if (isSlotOnlyReplacement) {
          // For slot-only replacements, replace all matching options with a single replacement
          const hasMatchingOptions = modifiedOptions.some(option => 
            shouldReplaceCanonicalOption(option, replacement.selector)
          );
          
          if (hasMatchingOptions) {
            // Remove all matching options and add single replacement
            modifiedOptions = modifiedOptions.filter(option => 
              !shouldReplaceCanonicalOption(option, replacement.selector)
            );
            modifiedOptions.push(replacement.to);
          }
        } else {
          // For specific weapon replacements, do 1:1 mapping
          modifiedOptions = modifiedOptions.map(option => {
            if (shouldReplaceCanonicalOption(option, replacement.selector)) {
              return replacement.to;
            }
            return option;
          });
        }
      }
    }
  }
  
  console.log('🔧 getCanonicalModifiedWeaponOptions: Final modified options:', modifiedOptions);
  return modifiedOptions;
}

/**
 * Check if a weapon option should be replaced based on selector
 * @param {Object} option - Weapon option to check
 * @param {Object} selector - Replacement selector
 * @returns {boolean}
 */
function shouldReplaceCanonicalOption(option, selector) {
  // If selector specifies specific weapon names, check those
  if (selector.nameAny) {
    return selector.nameAny.includes(option.name);
  }
  
  // If selector specifies weapon kinds, check those
  if (selector.kindAny) {
    const optionKind = option.kind || inferWeaponKind(option.name);
    return selector.kindAny.includes(optionKind);
  }
  
  // If selector only specifies slot, replace all weapons in that slot
  if (selector.slot && !selector.nameAny && !selector.kindAny) {
    return true;
  }
  
  return false;
}

/**
 * Get weapons from refit additions for display in dedicated refit slot UI
 * @param {Object} ship - Ship object with appliedCanonicalRefit
 * @returns {Array} Array of refit weapons with their original slot info
 */
export function getRefitSlotWeapons(ship) {
  if (!ship || !ship.appliedCanonicalRefit) {
    return [];
  }

  const refit = ship.appliedCanonicalRefit;
  const weaponChanges = refit.selectedOption?.weaponChanges || refit.weaponChanges;
  
  if (!weaponChanges || !weaponChanges.add) {
    return [];
  }

  const refitWeapons = [];
  
  for (const addition of weaponChanges.add) {
    const weaponSpec = cleanWeaponSpec({
      ...addition.weapon,
      originalSlot: addition.slot
    });
    refitWeapons.push(weaponSpec);
  }
  
  return refitWeapons;
}


