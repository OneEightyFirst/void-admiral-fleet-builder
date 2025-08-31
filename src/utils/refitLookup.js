/**
 * Refit lookup utilities for the new refits.json structure
 */

/**
 * Get available refits for a faction and target type
 * @param {Array} refits - Array of all refits from refits.json
 * @param {string} faction - Faction name (e.g., "Loyalists")
 * @param {string} target - Target type ("capital" or "squadron")
 * @returns {Array} Array of available refits
 */
export function getAvailableRefits(refits, faction, target) {
  if (!refits || !faction || !target) {
    return [];
  }

  return refits.filter(refit => {
    // Check if refit targets the correct ship type
    if (!refit.targets.includes(target)) {
      return false;
    }

    // Include global refits
    if (refit.scope === "global") {
      return true;
    }

    // Include faction-specific refits
    if (refit.scope === faction) {
      return true;
    }

    return false;
  });
}

/**
 * Get a specific refit by ID
 * @param {Array} refits - Array of all refits from refits.json
 * @param {string} refitId - Refit ID (e.g., "refit:global:heavy-armour")
 * @returns {Object|null} Refit object or null if not found
 */
export function getRefitById(refits, refitId) {
  if (!refits || !refitId) {
    return null;
  }

  return refits.find(refit => refit.id === refitId) || null;
}

/**
 * Convert new refit format to canonical format for existing refit system
 * @param {Object} refit - Refit in new format
 * @param {Object} selectedOption - Selected option if refit has options
 * @returns {Object} Refit in canonical format
 */
export function convertToCanonicalFormat(refit, selectedOption = null) {
  if (!refit) return null;

  const canonical = {
    name: refit.name,
    description: refit.description,
    scope: refit.targets[0], // "capital" or "squadron"
    notes: refit.notes || []
  };

  // Add constraints if present
  if (refit.constraints) {
    canonical.constraints = refit.constraints;
  }

  // Determine which effects to use (option effects or base effects)
  const effectsToProcess = selectedOption ? selectedOption.effects : refit.effects;
  
  if (!effectsToProcess) {
    return canonical;
  }

  // Process effects and convert to canonical format
  const cost = {};
  const gains = {};
  const weaponChanges = {};

  effectsToProcess.forEach(effect => {
    switch (effect.type) {
      case 'statChange':
        if (effect.delta < 0) {
          // Negative changes go to cost
          cost.statDeltas = cost.statDeltas || {};
          cost.statDeltas[effect.stat] = effect.delta;
        } else {
          // Positive changes go to gains
          gains.statDeltas = gains.statDeltas || {};
          gains.statDeltas[effect.stat] = effect.delta;
        }
        break;

      case 'slotLoss':
        cost.loseSlots = cost.loseSlots || [];
        cost.loseSlots.push({
          slot: effect.slot,
          count: effect.count
        });
        break;

      case 'weaponAdd':
        weaponChanges.add = weaponChanges.add || [];
        weaponChanges.add.push({
          slot: effect.slot,
          weapon: effect.weapon
        });
        break;

      case 'weaponReplace':
        weaponChanges.replace = weaponChanges.replace || [];
        weaponChanges.replace.push({
          slot: effect.slot,
          selector: {
            slot: effect.slot,
            nameAny: effect.nameAny,
            kindAny: effect.kindAny
          },
          to: effect.to
        });
        break;

      case 'weaponModify':
        weaponChanges.modify = weaponChanges.modify || [];
        const modification = {
          selector: {
            slot: effect.slot,
            nameAny: effect.nameAny,
            kindAny: effect.kindAny
          },
          changes: {}
        };
        
        if (effect.attacksDelta !== undefined) {
          modification.changes.attacksDelta = effect.attacksDelta;
        }
        if (effect.rangeDelta !== undefined) {
          modification.changes.rangeDelta = effect.rangeDelta;
        }
        if (effect.setTargets !== undefined) {
          modification.changes.setTargets = effect.setTargets;
        }
        
        weaponChanges.modify.push(modification);
        break;

      case 'weaponOptionUnlock':
        weaponChanges.unlockOptions = weaponChanges.unlockOptions || [];
        weaponChanges.unlockOptions.push({
          slot: effect.slot,
          allowNamesAny: effect.allowNamesAny,
          allowKindsAny: effect.allowKindsAny
        });
        break;

      case 'ruleChange':
        // Rule changes are just added to notes for display
        canonical.notes = canonical.notes || [];
        canonical.notes.push(effect.text);
        break;

      default:
        console.warn('Unknown effect type:', effect.type);
    }
  });

  // Add processed sections to canonical format
  if (Object.keys(cost).length > 0) {
    canonical.cost = cost;
  }
  if (Object.keys(gains).length > 0) {
    canonical.gains = gains;
  }
  if (Object.keys(weaponChanges).length > 0) {
    canonical.weaponChanges = weaponChanges;
  }

  // Add selected option info if applicable
  if (selectedOption) {
    canonical.selectedOption = selectedOption;
  }

  return canonical;
}

/**
 * Check if a refit is eligible for a ship
 * @param {Object} refit - Refit object
 * @param {Object} ship - Ship object
 * @param {Object} shipDef - Ship definition
 * @returns {boolean} True if refit is eligible
 */
export function isRefitEligible(refit, ship, shipDef) {
  if (!refit || !ship || !shipDef) {
    return false;
  }

  // Check constraints
  if (refit.constraints) {
    const constraints = refit.constraints;
    
    // Check ship class constraints
    if (constraints.shipClassesAny) {
      if (!constraints.shipClassesAny.includes(ship.className)) {
        return false;
      }
    }

    // Check armour max constraint
    if (constraints.armourMax !== undefined) {
      const currentArmour = ship.statline?.Armour || shipDef.statline?.Armour || 0;
      // Calculate what armour would be after applying refit
      const armourGain = refit.effects?.find(e => e.type === 'statChange' && e.stat === 'Armour')?.delta || 0;
      if (currentArmour + armourGain > constraints.armourMax) {
        return false;
      }
    }

    // Check speed min constraint
    if (constraints.speedMin !== undefined) {
      const currentSpeed = ship.statline?.Speed || shipDef.statline?.Speed || 0;
      // Calculate what speed would be after applying refit
      const speedCost = refit.effects?.find(e => e.type === 'statChange' && e.stat === 'Speed')?.delta || 0;
      if (currentSpeed + speedCost < constraints.speedMin) {
        return false;
      }
    }
  }

  return true;
}
