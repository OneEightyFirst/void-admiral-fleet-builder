import { parseInches } from './normalize.js';

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(deepClone);
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Check if a ship meets refit requirements
 * @param {Object} ship - Ship object
 * @param {Object} refit - Refit to check
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canApplyRefit(ship, refit) {
  if (!refit.requirements) return { ok: true };
  
  const req = refit.requirements;
  
  // Check ship class requirements
  if (req.shipClassesAny) {
    if (!req.shipClassesAny.includes(ship.className)) {
      return { 
        ok: false, 
        reason: `Requires ship class: ${req.shipClassesAny.join(" or ")}` 
      };
    }
  }
  
  // Check weapon requirements
  if (req.hasWeapon) {
    for (const weaponReq of req.hasWeapon) {
      const hasRequired = checkWeaponRequirement(ship, weaponReq);
      if (!hasRequired) {
        const kindDesc = weaponReq.kindAny ? weaponReq.kindAny.join(" or ") : "any";
        const slotDesc = weaponReq.slot || "any slot";
        return { 
          ok: false, 
          reason: `Requires ${kindDesc} weapon in ${slotDesc}` 
        };
      }
    }
  }
  
  return { ok: true };
}

/**
 * Check if ship has required weapon
 * @param {Object} ship - Ship object
 * @param {Object} weaponReq - Weapon requirement
 * @returns {boolean}
 */
function checkWeaponRequirement(ship, weaponReq) {
  const { slot, kindAny, nameAny } = weaponReq;
  
  // Get weapons from the specified slot(s)
  let weaponsToCheck = [];
  
  if (slot === "prow" || slot === "any") {
    weaponsToCheck = weaponsToCheck.concat(ship.loadout?.prow || []);
  }
  if (slot === "hull" || slot === "any") {
    weaponsToCheck = weaponsToCheck.concat(ship.loadout?.hull || []);
  }
  if (slot === "turret" || slot === "any") {
    weaponsToCheck = weaponsToCheck.concat(ship.loadout?.turret || []);
  }
  
  // Also check begins with weapons
  if (ship.loadout?.begins) {
    weaponsToCheck = weaponsToCheck.concat(ship.loadout.begins);
  }
  
  // Check if any weapon matches
  return weaponsToCheck.some(weaponName => {
    if (nameAny && !nameAny.includes(weaponName)) return false;
    
    if (kindAny) {
      // Would need weapon data to check kind - for now assume match
      // In real implementation, this would look up weapon specs
      return true;
    }
    
    return true;
  });
}

/**
 * Apply stat deltas to ship stats
 * @param {Object} stats - Current stats
 * @param {Object} deltas - Stat deltas to apply
 * @returns {Object} Modified stats
 */
function applyStatDeltas(stats, deltas) {
  if (!deltas) return stats;
  
  
  const result = { ...stats };
  
  for (const [stat, delta] of Object.entries(deltas)) {
    if (typeof delta === "number") {
      const current = parseInches(result[stat]) || 0;
      const newValue = Math.max(0, current + delta);
      result[stat] = newValue;
    }
  }
  
  return result;
}

/**
 * Apply weapon slot changes
 * @param {Object} ship - Ship object
 * @param {Array} loseSlots - Slots to lose
 * @returns {Object} Modified ship
 */
function applySlotLoss(ship, loseSlots) {
  if (!loseSlots || loseSlots.length === 0) return ship;
  
  const result = deepClone(ship);
  
  for (const { slot, count } of loseSlots) {
    if (slot === "hull" && result.hullSlots) {
      result.hullSlots = Math.max(0, result.hullSlots - count);
    }
    // Add other slot types as needed
  }
  
  return result;
}

/**
 * Apply weapon changes to ship
 * @param {Object} ship - Ship object
 * @param {Object} weaponChanges - Weapon changes to apply
 * @returns {Object} Modified ship
 */
function applyWeaponChanges(ship, weaponChanges) {
  if (!weaponChanges) return ship;
  
  let result = deepClone(ship);
  
  // Apply replacements
  if (weaponChanges.replace) {
    for (const replacement of weaponChanges.replace) {
      result = applyWeaponReplacement(result, replacement);
    }
  }
  
  // Apply additions
  if (weaponChanges.add) {
    for (const addition of weaponChanges.add) {
      result = applyWeaponAddition(result, addition);
    }
  }
  
  // Apply modifications
  if (weaponChanges.modify) {
    for (const modification of weaponChanges.modify) {
      result = applyWeaponModification(result, modification);
    }
  }
  
  // Apply unlock options (doesn't modify current loadout, just availability)
  if (weaponChanges.unlockOptions) {
    result.unlockedOptions = result.unlockedOptions || [];
    result.unlockedOptions = result.unlockedOptions.concat(weaponChanges.unlockOptions);
  }
  
  return result;
}

/**
 * Apply weapon replacement
 * @param {Object} ship - Ship object
 * @param {Object} replacement - Replacement to apply
 * @returns {Object} Modified ship
 */
function applyWeaponReplacement(ship, replacement) {
  const result = deepClone(ship);
  const { slot, selector, to } = replacement;
  
  console.log('🔧 WEAPON_REPLACEMENT: Applying replacement to slot:', slot);
  console.log('🔧 WEAPON_REPLACEMENT: Selector:', selector);
  console.log('🔧 WEAPON_REPLACEMENT: To weapon:', to.name);
  console.log('🔧 WEAPON_REPLACEMENT: Current loadout:', result.loadout);
  
  // Replace in begins array if selector matches weapon names
  if (selector.nameAny && result.loadout?.begins) {
    result.loadout.begins = result.loadout.begins.map(weaponName =>
      selector.nameAny.includes(weaponName) ? to.name : weaponName
    );
  }
  
  // Replace in beginsWith array (ship definition level) - this modifies the ship's base weapons
  if (selector.nameAny && result.beginsWith) {
    console.log('🔧 WEAPON_REPLACEMENT: Checking beginsWith weapons:', result.beginsWith);
    result.beginsWith = result.beginsWith.map(weapon => {
      if (typeof weapon === 'string') {
        // Simple string weapon name
        return selector.nameAny.includes(weapon) ? to.name : weapon;
      } else if (weapon && weapon.name) {
        // Weapon object with name property
        if (selector.nameAny.includes(weapon.name)) {
          console.log('🔧 WEAPON_REPLACEMENT: Replacing beginsWith weapon:', weapon.name, 'with:', to.name);
          return { ...weapon, ...to };
        }
      }
      return weapon;
    });
    console.log('🔧 WEAPON_REPLACEMENT: Updated beginsWith:', result.beginsWith);
  }
  
  // Replace in specific slots
  if (slot !== "any") {
    const slotArray = result.loadout?.[slot];
    console.log('🔧 WEAPON_REPLACEMENT: Current slot content:', slotArray);
    
    if (Array.isArray(slotArray)) {
      // Special case: if selector only specifies slot (replace all), replace entire array with single weapon
      if (selector.slot && !selector.nameAny && !selector.kindAny) {
        console.log('🔧 WEAPON_REPLACEMENT: Replacing entire slot with single weapon');
        result.loadout[slot] = [to.name];
      } else {
        // Replace individual weapons that match selector
        for (let i = 0; i < slotArray.length; i++) {
          if (shouldReplaceWeapon(slotArray[i], selector)) {
            console.log('🔧 WEAPON_REPLACEMENT: Replacing weapon:', slotArray[i], 'with:', to.name);
            slotArray[i] = to.name;
          }
        }
      }
    } else if (slotArray !== undefined) {
      // Handle case where slot contains a single weapon (not an array)
      if (shouldReplaceWeapon(slotArray, selector)) {
        console.log('🔧 WEAPON_REPLACEMENT: Replacing single weapon:', slotArray, 'with:', to.name);
        result.loadout[slot] = to.name;
      }
    }
  }
  
  console.log('🔧 WEAPON_REPLACEMENT: Final loadout:', result.loadout);
  return result;
}

/**
 * Apply weapon addition
 * @param {Object} ship - Ship object
 * @param {Object} addition - Addition to apply
 * @returns {Object} Modified ship
 */
function applyWeaponAddition(ship, addition) {
  const result = deepClone(ship);
  const { slot, weapon } = addition;
  
  // Ensure loadout exists
  if (!result.loadout) {
    result.loadout = {};
  }
  
  // Mark weapon as unlocked by refit
  const weaponWithTag = {
    ...weapon,
    unlockedByRefit: true
  };
  
  // Add to appropriate slot
  if (slot === "hull") {
    result.loadout.hull = result.loadout.hull || [];
    result.loadout.hull.push(weapon.name);
  } else if (slot === "prow") {
    result.loadout.prow = weapon.name;
  } else if (slot === "turret") {
    // Turret weapons are added to dedicated refit slot
    result.loadout.refit = result.loadout.refit || [];
    result.loadout.refit.push({ name: weapon.name, originalSlot: slot });
  }
  // Add other slots as needed
  
  return result;
}

/**
 * Apply weapon modification
 * @param {Object} ship - Ship object
 * @param {Object} modification - Modification to apply
 * @returns {Object} Modified ship
 */
function applyWeaponModification(ship, modification) {
  const result = deepClone(ship);
  
  // Store weapon modifications for combat calculations
  result.weaponMods = result.weaponMods || [];
  result.weaponMods.push(modification);
  
  return result;
}

/**
 * Check if weapon should be replaced based on selector
 * @param {string} weaponName - Name of weapon
 * @param {Object} selector - Weapon selector
 * @returns {boolean}
 */
function shouldReplaceWeapon(weaponName, selector) {
  // If selector specifies specific weapon names, check those
  if (selector.nameAny) {
    return selector.nameAny.includes(weaponName);
  }
  
  // If selector only specifies slot (like "slot": "prow"), replace all weapons in that slot
  if (selector.slot && !selector.nameAny && !selector.kindAny) {
    return true;
  }
  
  // Add kind-based matching if weapon data is available
  return false; // Default to not replacing unless explicitly matched
}

/**
 * Apply combat modifiers
 * @param {Object} ship - Ship object
 * @param {Object} refit - Refit being applied
 * @returns {Object} Modified ship
 */
function applyCombatMods(ship, refit) {
  const result = deepClone(ship);
  
  // Initialize combat mods if not present
  result.combatMods = result.combatMods || {};
  
  // Apply boarding modifiers
  if (refit.boarding) {
    result.combatMods.boarding = {
      ...(result.combatMods.boarding || {}),
      ...refit.boarding
    };
  }
  
  // Apply ramming modifiers
  if (refit.ramming) {
    result.combatMods.ramming = {
      ...(result.combatMods.ramming || {}),
      ...refit.ramming
    };
  }
  
  return result;
}

/**
 * Apply constraints and validate final ship state
 * @param {Object} ship - Ship object
 * @param {Object} constraints - Constraints to enforce
 * @returns {{ ok: boolean, ship?: Object, error?: string }}
 */
function applyConstraints(ship, constraints) {
  if (!constraints) return { ok: true, ship };
  
  const result = deepClone(ship);
  
  // Check speed minimum
  if (constraints.speedMin !== undefined) {
    const currentSpeed = parseInches(result.statline?.Speed);
    if (currentSpeed < constraints.speedMin) {
      return { 
        ok: false, 
        error: `Speed would be below minimum (${constraints.speedMin})` 
      };
    }
  }
  
  // Check armour maximum  
  if (constraints.armourMax !== undefined) {
    const currentArmour = result.statline?.Armour || 0;
    if (currentArmour > constraints.armourMax) {
      return { 
        ok: false, 
        error: `Armour would exceed maximum (${constraints.armourMax})` 
      };
    }
  }
  
  return { ok: true, ship: result };
}

/**
 * Apply a refit to a ship
 * @param {Object} ship - Ship object to modify
 * @param {Object} refit - Refit to apply
 * @returns {{ ok: boolean, ship?: Object, error?: string }}
 */
export function applyRefit(ship, refit) {
  console.log('🛠️ APPLY_REFIT: Starting refit application');
  console.log('🛠️ APPLY_REFIT: Ship:', ship.className, ship.id);
  console.log('🛠️ APPLY_REFIT: Refit:', refit.name);
  if (refit.selectedOption) {
    console.log('🛠️ APPLY_REFIT: Selected option:', refit.selectedOption.name);
  } else {
    console.log('🛠️ APPLY_REFIT: No option selected, applying base refit');
  }
  
  // Check requirements first
  const canApply = canApplyRefit(ship, refit);
  if (!canApply.ok) {
    return { ok: false, error: canApply.reason };
  }
  
  let result = deepClone(ship);
  
  // CRITICAL FIX: Ensure ship has a complete statline before applying modifications
  if (!result.statline || Object.keys(result.statline).length === 0) {
    return { ok: false, error: 'Ship missing statline data' };
  }
  
  // If refit has a selected option, use that option's properties instead of base refit
  const effectiveRefit = refit.selectedOption ? refit.selectedOption : refit;
  

  
  // Apply costs (things you lose)
  if (effectiveRefit.cost) {
    if (effectiveRefit.cost.statDeltas) {
      result.statline = applyStatDeltas(result.statline, effectiveRefit.cost.statDeltas);
    }
    
    if (effectiveRefit.cost.loseSlots) {
      result = applySlotLoss(result, effectiveRefit.cost.loseSlots);
    }
    
    if (effectiveRefit.cost.loseKeywords) {
      result.lostKeywords = (result.lostKeywords || []).concat(effectiveRefit.cost.loseKeywords);
    }
  }
  
  // Apply gains
  if (effectiveRefit.gains) {
    if (effectiveRefit.gains.statDeltas) {
      result.statline = applyStatDeltas(result.statline, effectiveRefit.gains.statDeltas);
    }
    
    if (effectiveRefit.gains.addKeywords) {
      result.gainedKeywords = (result.gainedKeywords || []).concat(effectiveRefit.gains.addKeywords);
    }
    
    if (effectiveRefit.gains.capabilities) {
      result.capabilities = { ...(result.capabilities || {}), ...effectiveRefit.gains.capabilities };
    }
  }
  
  // Apply weapon changes
  if (effectiveRefit.weaponChanges) {
    console.log('🛠️ APPLY_REFIT: Applying weapon changes:', effectiveRefit.weaponChanges);
    result = applyWeaponChanges(result, effectiveRefit.weaponChanges);
    console.log('🛠️ APPLY_REFIT: After weapon changes, hull loadout:', result.loadout?.hull);
  } else {
    console.log('🛠️ APPLY_REFIT: No weapon changes found in effective refit');
  }
  
  // Apply combat modifiers
  result = applyCombatMods(result, refit);
  
  // Apply target profile changes
  if (refit.targetProfile) {
    result.targetProfile = { ...(result.targetProfile || {}), ...refit.targetProfile };
  }
  
  // Apply token changes
  if (refit.tokens) {
    result.tokens = { ...(result.tokens || {}), ...refit.tokens };
  }
  
  // Store applied refit info
  result.appliedRefit = {
    name: refit.name,
    scope: refit.scope
  };
  
  // Apply constraints and validate
  const constraintResult = applyConstraints(result, refit.constraints);
  if (!constraintResult.ok) {
    return { ok: false, error: constraintResult.error };
  }
  
  console.log('🛠️ APPLY_REFIT: ✅ Refit application completed successfully');
  return { ok: true, ship: constraintResult.ship };
}

/**
 * Create a simple diff between two objects for UI display
 * @param {Object} before - Object before changes
 * @param {Object} after - Object after changes
 * @returns {Array} Array of change descriptions
 */
export function createRefitDiff(before, after) {
  const changes = [];
  
  // Compare statlines
  if (before.statline && after.statline) {
    for (const stat of ["Hull", "Speed", "Armour", "Shields", "Flak"]) {
      const oldVal = before.statline[stat];
      const newVal = after.statline[stat];
      if (oldVal !== newVal) {
        const delta = (typeof newVal === "number" && typeof oldVal === "number") 
          ? newVal - oldVal : 0;
        const sign = delta > 0 ? "+" : "";
        changes.push(`${stat}: ${oldVal} → ${newVal} (${sign}${delta})`);
      }
    }
  }
  
  // Compare loadouts
  if (before.loadout && after.loadout) {
    for (const slot of ["prow", "hull", "begins"]) {
      const oldWeapons = before.loadout[slot] || [];
      const newWeapons = after.loadout[slot] || [];
      
      if (JSON.stringify(oldWeapons) !== JSON.stringify(newWeapons)) {
        changes.push(`${slot}: ${JSON.stringify(oldWeapons)} → ${JSON.stringify(newWeapons)}`);
      }
    }
  }
  
  return changes;
}
