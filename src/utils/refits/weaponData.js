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
  if (weaponName === "Fighter Bays") {
    return {
      targets: "Any",
      attacks: "1d6*",
      range: "18″"
    };
  }
  return null;
}

/**
 * Get canonical weapon data with proper structure
 * @param {*} weapon - Weapon identifier or object
 * @param {Array} allWeapons - Available weapons (legacy compatibility) 
 * @param {Object} ship - Ship object with potential refit data
 * @returns {Object} Complete weapon data
 */
export function getCanonicalWeaponData(weapon, allWeapons = [], ship = null) {
  console.log('🎯 getCanonicalWeaponData: Input weapon:', weapon, 'ship:', ship?.id);
  
  // Handle complete weapon objects
  if (weapon && typeof weapon === 'object' && weapon.targets) {
    console.log('🎯 getCanonicalWeaponData: Processing weapon object');
    const cleaned = cleanWeaponSpec(weapon);
    console.log('🎯 getCanonicalWeaponData: Cleaned weapon spec:', cleaned);
    return applyCanonicalRefitEffects(cleaned, ship);
  }
  
  // Handle weapon names
  const weaponName = typeof weapon === 'string' ? weapon : weapon?.name;
  console.log('🎯 getCanonicalWeaponData: Weapon name:', weaponName);
  
  if (!weaponName) {
    return { name: "Unknown", kind: "other", targets: "Any", attacks: 1, range: 12 };
  }
  
  // Check for Fighter Bay first
  const fighterBayStats = getFighterBayStats(weaponName);
  if (fighterBayStats) {
    console.log('🎯 getCanonicalWeaponData: Found fighter bay stats');
    const weaponData = cleanWeaponSpec({ name: weaponName, ...fighterBayStats });
    return applyCanonicalRefitEffects(weaponData, ship);
  }
  
  // Look up in weapons list (legacy support)
  const foundWeapon = allWeapons.find(w => w.name === weaponName);
  if (foundWeapon) {
    console.log('🎯 getCanonicalWeaponData: Found weapon in list:', foundWeapon);
    const weaponData = cleanWeaponSpec(foundWeapon);
    console.log('🎯 getCanonicalWeaponData: Cleaned found weapon:', weaponData);
    return applyCanonicalRefitEffects(weaponData, ship);
  }
  
  // Create default weapon data
  console.log('🎯 getCanonicalWeaponData: Creating default weapon for:', weaponName);
  const defaultWeapon = cleanWeaponSpec({ name: weaponName });
  console.log('🎯 getCanonicalWeaponData: Default weapon spec:', defaultWeapon);
  return applyCanonicalRefitEffects(defaultWeapon, ship);
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
        if (unlock.allowNamesAny) {
          for (const weaponName of unlock.allowNamesAny) {
            if (!modifiedOptions.some(opt => opt.name === weaponName)) {
              modifiedOptions.push(cleanWeaponSpec({ name: weaponName }));
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
        modifiedOptions = modifiedOptions.map(option => {
          if (shouldReplaceCanonicalOption(option, replacement.selector)) {
            return replacement.to;
          }
          return option;
        });
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


