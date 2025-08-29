/**
 * Validate a canonical refit object
 * @param {Object} refit - Refit to validate
 * @returns {{ ok: boolean, errors?: string[] }}
 */
export function validateRefit(refit) {
  const errors = [];
  
  // Required fields
  if (!refit.name || typeof refit.name !== "string") {
    errors.push("Missing or invalid name");
  }
  
  if (!refit.description || typeof refit.description !== "string") {
    errors.push("Missing or invalid description");
  }
  
  if (!["capital", "squadron"].includes(refit.scope)) {
    errors.push("Invalid scope, must be 'capital' or 'squadron'");
  }
  
  // Validate enums
  const validArcs = ["Front", "Sides", "Rear", "Fr/Sd", "Fr/Re", "Sd/Re", "Sides/Rear", "360", "Any"];
  const validWeaponKinds = ["missiles", "lasers", "cannons", "launch_bays", "other"];
  const validSlots = ["prow", "hull", "turret", "any"];
  const validStats = ["Hull", "Speed", "Armour", "Shields", "Flak"];
  
  /**
   * Validate an arc value
   * @param {*} arc - Arc to validate
   * @param {string} path - Path for error reporting
   */
  function validateArc(arc, path) {
    if (arc !== undefined && !validArcs.includes(arc)) {
      errors.push(`Invalid arc at ${path}: ${arc}`);
    }
  }
  
  /**
   * Validate weapon kind
   * @param {*} kind - Kind to validate
   * @param {string} path - Path for error reporting
   */
  function validateWeaponKind(kind, path) {
    if (kind !== undefined && !validWeaponKinds.includes(kind)) {
      errors.push(`Invalid weapon kind at ${path}: ${kind}`);
    }
  }
  
  /**
   * Validate weapon slot
   * @param {*} slot - Slot to validate
   * @param {string} path - Path for error reporting
   */
  function validateSlot(slot, path) {
    if (slot !== undefined && !validSlots.includes(slot)) {
      errors.push(`Invalid weapon slot at ${path}: ${slot}`);
    }
  }
  
  /**
   * Validate stat deltas
   * @param {*} deltas - Deltas object to validate
   * @param {string} path - Path for error reporting
   */
  function validateStatDeltas(deltas, path) {
    if (!deltas || typeof deltas !== "object") return;
    
    for (const [stat, value] of Object.entries(deltas)) {
      if (!validStats.includes(stat)) {
        errors.push(`Invalid stat name at ${path}.${stat}`);
      }
      if (typeof value !== "number") {
        errors.push(`Invalid stat delta at ${path}.${stat}, must be number`);
      }
    }
  }
  
  /**
   * Validate dice notation
   * @param {*} attacks - Attacks value to validate
   * @param {string} path - Path for error reporting
   */
  function validateAttacks(attacks, path) {
    if (attacks === undefined) return;
    
    if (typeof attacks === "number") return;
    
    if (typeof attacks === "object" && attacks.dice) {
      if (!attacks.dice.match(/^\d+d\d+(?:[+-]\d+)?$/)) {
        errors.push(`Invalid dice notation at ${path}: ${attacks.dice}`);
      }
      return;
    }
    
    errors.push(`Invalid attacks value at ${path}: ${attacks}`);
  }
  
  /**
   * Validate weapon spec
   * @param {*} weapon - Weapon to validate
   * @param {string} path - Path for error reporting
   */
  function validateWeaponSpec(weapon, path) {
    if (!weapon || typeof weapon !== "object") {
      errors.push(`Invalid weapon spec at ${path}`);
      return;
    }
    
    if (!weapon.name) {
      errors.push(`Missing weapon name at ${path}`);
    }
    
    validateWeaponKind(weapon.kind, `${path}.kind`);
    validateArc(weapon.targets, `${path}.targets`);
    validateAttacks(weapon.attacks, `${path}.attacks`);
    
    if (weapon.range !== undefined && weapon.range !== "-" && typeof weapon.range !== "number") {
      errors.push(`Invalid range at ${path}.range`);
    }
  }
  
  // Validate requirements
  if (refit.requirements) {
    const req = refit.requirements;
    
    if (req.hasWeapon) {
      req.hasWeapon.forEach((weapon, i) => {
        validateSlot(weapon.slot, `requirements.hasWeapon[${i}].slot`);
        if (weapon.kindAny) {
          weapon.kindAny.forEach((kind, j) => {
            validateWeaponKind(kind, `requirements.hasWeapon[${i}].kindAny[${j}]`);
          });
        }
      });
    }
  }
  
  // Validate cost
  if (refit.cost) {
    validateStatDeltas(refit.cost.statDeltas, "cost.statDeltas");
    
    if (refit.cost.loseSlots) {
      refit.cost.loseSlots.forEach((slot, i) => {
        validateSlot(slot.slot, `cost.loseSlots[${i}].slot`);
        if (typeof slot.count !== "number") {
          errors.push(`Invalid slot count at cost.loseSlots[${i}].count`);
        }
      });
    }
  }
  
  // Validate gains
  if (refit.gains) {
    validateStatDeltas(refit.gains.statDeltas, "gains.statDeltas");
  }
  
  // Validate weapon changes
  if (refit.weaponChanges) {
    const wc = refit.weaponChanges;
    
    if (wc.replace) {
      wc.replace.forEach((replace, i) => {
        validateSlot(replace.slot, `weaponChanges.replace[${i}].slot`);
        validateWeaponSpec(replace.to, `weaponChanges.replace[${i}].to`);
      });
    }
    
    if (wc.add) {
      wc.add.forEach((add, i) => {
        validateSlot(add.slot, `weaponChanges.add[${i}].slot`);
        validateWeaponSpec(add.weapon, `weaponChanges.add[${i}].weapon`);
      });
    }
    
    if (wc.modify) {
      wc.modify.forEach((modify, i) => {
        validateSlot(modify.selector?.slot, `weaponChanges.modify[${i}].selector.slot`);
        
        if (modify.changes) {
          const changes = modify.changes;
          validateArc(changes.setTargets, `weaponChanges.modify[${i}].changes.setTargets`);
          
          if (changes.attacksDelta !== undefined) {
            if (typeof changes.attacksDelta === "object") {
              if (typeof changes.attacksDelta.multiply !== "number") {
                errors.push(`Invalid multiply at weaponChanges.modify[${i}].changes.attacksDelta.multiply`);
              }
            } else if (typeof changes.attacksDelta !== "number") {
              errors.push(`Invalid attacksDelta at weaponChanges.modify[${i}].changes.attacksDelta`);
            }
          }
        }
      });
    }
    
    if (wc.unlockOptions) {
      wc.unlockOptions.forEach((unlock, i) => {
        validateSlot(unlock.slot, `weaponChanges.unlockOptions[${i}].slot`);
        if (unlock.allowKindsAny) {
          unlock.allowKindsAny.forEach((kind, j) => {
            validateWeaponKind(kind, `weaponChanges.unlockOptions[${i}].allowKindsAny[${j}]`);
          });
        }
      });
    }
  }
  
  // Validate constraints
  if (refit.constraints) {
    const constraints = refit.constraints;
    if (constraints.armourMax !== undefined && typeof constraints.armourMax !== "number") {
      errors.push("Invalid armourMax constraint");
    }
    if (constraints.speedMin !== undefined && typeof constraints.speedMin !== "number") {
      errors.push("Invalid speedMin constraint");
    }
  }
  
  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}
