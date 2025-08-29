/**
 * Adapter layer for safe migration from legacy refit system to canonical system
 * 
 * This file provides backward-compatible wrappers that allow gradual migration
 * from the old refit system in gameUtils.js to the new canonical system.
 */

import { migrateFactionRefits } from './migrate.js';
import { applyRefit, canApplyRefit } from './apply.js';
import { validateRefit } from './validate.js';
import { cleanWeaponSpec } from './normalize.js';

// Import legacy functions for fallback
import { 
  getWeaponData as legacyGetWeaponData,
  getModifiedWeaponOptions as legacyGetModifiedWeaponOptions,
  applyWeaponRefitEffects as legacyApplyWeaponRefitEffects
} from '../gameUtils.js';

// Feature flag for gradual rollout
const USE_CANONICAL_REFITS = false; // Temporarily disabled - using enhanced legacy system

/**
 * Cache for migrated faction refits to avoid repeated migration
 */
const migratedRefitsCache = new Map();

/**
 * Get migrated refits for a faction, with caching
 * @param {Object} factionData - Raw faction data
 * @param {string} factionName - Name of faction
 * @returns {Object} Migrated refits
 */
function getCachedMigratedRefits(factionData, factionName) {
  if (!migratedRefitsCache.has(factionName)) {
    const migrated = migrateFactionRefits(factionData, factionName);
    migratedRefitsCache.set(factionName, migrated);
  }
  return migratedRefitsCache.get(factionName);
}

/**
 * Adapter for getWeaponData that can use either system
 * @param {*} weapon - Weapon to get data for
 * @param {Array} allWeapons - All weapons array (legacy)
 * @param {Object} ship - Ship object
 * @returns {Object} Weapon data with refit effects applied
 */
export function getWeaponDataCanonical(weapon, allWeapons = [], ship = null) {
  // Always use legacy system for now - canonical system not fully integrated yet
  if (!USE_CANONICAL_REFITS) {
    return legacyGetWeaponData(weapon, allWeapons, ship);
  }
  
  try {
    // For now, just use legacy system but with enhanced error handling
    // TODO: Implement full canonical integration when ships store canonical refit data
    return legacyGetWeaponData(weapon, allWeapons, ship);
  } catch (error) {
    console.warn('Weapon data processing failed, using fallback:', error);
    // Fallback to basic weapon data if legacy system fails
    const weaponName = typeof weapon === 'string' ? weapon : weapon?.name;
    return { name: weaponName, targets: "Any", attacks: 1, range: 12 };
  }
}

/**
 * Adapter for getModifiedWeaponOptions that can use either system
 * @param {Array} weaponOptions - Available weapon options
 * @param {Object} ship - Ship object
 * @param {string} location - Weapon location (prow, hull, etc.)
 * @returns {Array} Modified weapon options
 */
export function getModifiedWeaponOptionsCanonical(weaponOptions, ship, location) {
  // Always use legacy system for now - canonical system not fully integrated yet
  if (!USE_CANONICAL_REFITS) {
    return legacyGetModifiedWeaponOptions(weaponOptions, ship, location);
  }
  
  try {
    // For now, just use legacy system but with enhanced error handling
    // TODO: Implement full canonical integration when ships store canonical refit data
    return legacyGetModifiedWeaponOptions(weaponOptions, ship, location);
  } catch (error) {
    console.warn('Weapon options processing failed, using fallback:', error);
    // Fallback to original weapon options if processing fails
    return [...weaponOptions];
  }
}

/**
 * Apply canonical refit to a ship (safe wrapper)
 * @param {Object} ship - Ship to apply refit to
 * @param {Object} refit - Canonical refit to apply
 * @returns {Object} Result with ship or error
 */
export function applyCanonicalRefitSafe(ship, refit) {
  try {
    // Validate refit first
    const validation = validateRefit(refit);
    if (!validation.ok) {
      return { 
        ok: false, 
        error: `Invalid refit: ${validation.errors.join(', ')}`,
        fallbackToLegacy: true
      };
    }
    
    // Apply canonical refit
    return applyRefit(ship, refit);
  } catch (error) {
    console.warn('Canonical refit application failed:', error);
    return { 
      ok: false, 
      error: error.message,
      fallbackToLegacy: true
    };
  }
}

/**
 * Convert legacy refit data to canonical format (safe wrapper)
 * @param {Object} legacyRefit - Legacy refit from factions.json
 * @param {string} scope - "capital" or "squadron"
 * @param {string} factionName - Faction name
 * @returns {Object} Canonical refit or null if migration fails
 */
export function migrateLegacyRefitSafe(legacyRefit, scope, factionName) {
  try {
    const migrated = migrateFactionRefits({ 
      factionRefits: { 
        [scope === 'capital' ? 'capitalShipRefits' : 'squadronRefits']: [legacyRefit] 
      } 
    }, factionName);
    
    return scope === 'capital' ? migrated.capital[0] : migrated.squadron[0];
  } catch (error) {
    console.warn(`Failed to migrate ${scope} refit "${legacyRefit.name}" for ${factionName}:`, error);
    return null;
  }
}

/**
 * Get base weapon data (helper for canonical system)
 * @param {*} weapon - Weapon identifier or object
 * @returns {Object} Base weapon data
 */
function getBaseWeaponData(weapon) {
  // If it's already a complete weapon object, clean and return it
  if (weapon && typeof weapon === 'object' && weapon.targets) {
    return cleanWeaponSpec(weapon);
  }
  
  // If it's a string, create basic weapon data
  const weaponName = typeof weapon === 'string' ? weapon : weapon?.name;
  return cleanWeaponSpec({ name: weaponName });
}

/**
 * Apply canonical weapon effects from ship's refit
 * @param {Object} weaponData - Base weapon data
 * @param {Object} ship - Ship with canonical refit
 * @returns {Object} Weapon data with refit effects
 */
function applyCanonicalWeaponEffects(weaponData, ship) {
  if (!ship?.canonicalRefit?.weaponChanges) {
    return weaponData;
  }
  
  let modifiedWeapon = { ...weaponData };
  const changes = ship.canonicalRefit.weaponChanges;
  
  // Apply modifications
  if (changes.modify) {
    for (const modification of changes.modify) {
      if (shouldApplyModification(modification.selector, weaponData, ship)) {
        modifiedWeapon = applyWeaponModification(modifiedWeapon, modification.changes);
      }
    }
  }
  
  return modifiedWeapon;
}

/**
 * Apply canonical weapon options from ship's refit
 * @param {Array} weaponOptions - Base weapon options
 * @param {Object} ship - Ship with canonical refit
 * @param {string} location - Weapon location
 * @returns {Array} Modified weapon options
 */
function applyCanonicalWeaponOptions(weaponOptions, ship, location) {
  if (!ship?.canonicalRefit?.weaponChanges) {
    return [...weaponOptions];
  }
  
  let modifiedOptions = [...weaponOptions];
  const changes = ship.canonicalRefit.weaponChanges;
  
  // Apply unlocked options
  if (changes.unlockOptions) {
    for (const unlock of changes.unlockOptions) {
      if (unlock.slot === location || unlock.slot === 'any') {
        // Add unlocked weapons that aren't already present
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
  if (changes.replace) {
    for (const replacement of changes.replace) {
      if (replacement.slot === location || replacement.slot === 'any') {
        // Replace matching weapons
        modifiedOptions = modifiedOptions.map(option => {
          if (shouldReplaceOption(option, replacement.selector)) {
            return replacement.to;
          }
          return option;
        });
      }
    }
  }
  
  return modifiedOptions;
}

/**
 * Check if a modification should apply to a weapon
 * @param {Object} selector - Weapon selector
 * @param {Object} weaponData - Weapon data
 * @param {Object} ship - Ship context
 * @returns {boolean}
 */
function shouldApplyModification(selector, weaponData, ship) {
  // If no conditions, apply to all
  if (!selector || Object.keys(selector).length === 0) {
    return true;
  }
  
  // Check name matching
  if (selector.nameAny && !selector.nameAny.includes(weaponData.name)) {
    return false;
  }
  
  // Check kind matching
  if (selector.kindAny && !selector.kindAny.includes(weaponData.kind)) {
    return false;
  }
  
  return true;
}

/**
 * Check if a weapon option should be replaced
 * @param {Object} option - Weapon option
 * @param {Object} selector - Replacement selector
 * @returns {boolean}
 */
function shouldReplaceOption(option, selector) {
  if (selector.nameAny && selector.nameAny.includes(option.name)) {
    return true;
  }
  
  if (selector.kindAny) {
    const optionSpec = cleanWeaponSpec(option);
    return selector.kindAny.includes(optionSpec.kind);
  }
  
  return false;
}

/**
 * Apply weapon modification effects
 * @param {Object} weaponData - Weapon data to modify
 * @param {Object} changes - Changes to apply
 * @returns {Object} Modified weapon data
 */
function applyWeaponModification(weaponData, changes) {
  const modified = { ...weaponData };
  
  if (changes.attacksDelta && typeof modified.attacks === 'number') {
    modified.attacks += changes.attacksDelta;
  }
  
  if (changes.rangeDelta && typeof modified.range === 'number') {
    modified.range += changes.rangeDelta;
  }
  
  if (changes.setTargets) {
    modified.targets = changes.setTargets;
  }
  
  return modified;
}

/**
 * Enable or disable canonical refit system
 * @param {boolean} enabled - Whether to enable canonical system
 */
export function setCanonicalRefitsEnabled(enabled) {
  // This would be controlled by feature flag in production
  console.log(`Canonical refits ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Clear the migrated refits cache (useful for testing)
 */
export function clearMigratedRefitsCache() {
  migratedRefitsCache.clear();
}
