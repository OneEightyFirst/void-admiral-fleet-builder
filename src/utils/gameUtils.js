// Ship cost calculation
export function shipCost(def) {
  return def.points ?? (def.size === "Large" ? 9 :
                        def.size === "Medium" ? 6 :
                        def.size === "Small" ? 3 : 1);
}

// Generate unique ID
export function uid() { 
  return Math.random().toString(36).slice(2,9); 
}

// Utility function for efficient array comparison
export function arraysEqual(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  
  return sortedA.every((val, index) => val === sortedB[index]);
}

// Create arming key for unique rule checking
export function armingKey(cls, loadout) {
  const prow = loadout.prow?.name || "";
  const hull = (loadout.hull || []).slice().sort().join("|");
  return `${cls}::prow:${prow}::hull:${hull}`;
}

// Safe getters for faction fields
export function getFluff(f, factions) { 
  return (factions?.[f]?.fluff || "").trim(); 
}

export function getSpecialRules(f, factions) { 
  return Array.isArray(factions?.[f]?.specialRules) ? factions[f].specialRules : []; 
}

export function getCommandAbilities(f, factions) { 
  return Array.isArray(factions?.[f]?.commandAbilities) ? factions[f].commandAbilities : []; 
}

// Fleet building rule modifiers
export function getPointLimit(faction, basePoints, factions) {
  const specialRules = getSpecialRules(faction, factions);
  
  // Few in Number: 20% fewer points (Ancients, Cyborgs)
  if (specialRules.some(rule => rule.name === "Few in Number")) {
    return Math.floor(basePoints * 0.8);
  }
  
  // Wealthy: 20% more points (Merchants)
  if (specialRules.some(rule => rule.name === "Wealthy")) {
    return Math.floor(basePoints * 1.2);
  }
  
  // Industrious: 20% more points (Scrap Bots)
  if (specialRules.some(rule => rule.name === "Industrious")) {
    return Math.floor(basePoints * 1.2);
  }
  
  return basePoints;
}

// Special ship cost calculations
export function getShipCost(faction, def, roster) {
  // Note: Insectoid Pincers cost 1pt each for fleet building
  // The 0.5pt value is only for opponent victory point scoring
  return shipCost(def);
}

// Check if faction has special squadron rules
export function hasSwarmRule(faction, factions) {
  return getSpecialRules(faction, factions).some(rule => rule.name === "The Swarm");
}

// Check if faction has random weapon construction
export function hasUnplannedConstruction(faction, factions) {
  return getSpecialRules(faction, factions).some(rule => rule.name === "Unplanned Construction");
}

// Group weapons by name and count duplicates
export function groupWeapons(weaponNames, allWeapons) {
  const weaponCounts = {};
  const weaponData = {};
  
  weaponNames.forEach(name => {
    weaponCounts[name] = (weaponCounts[name] || 0) + 1;
    if (!weaponData[name]) {
      weaponData[name] = allWeapons.find(x => x.name === name) || { name };
    }
  });
  
  return Object.entries(weaponCounts).map(([name, count]) => ({
    name,
    count,
    data: weaponData[name]
  }));
}

// Generate random weapons for Scrap Bots
export function randomizeScrapBotWeapons(def) {
  if (!def.hull?.options) return def;
  
  const randomOptions = [];
  for (let i = 0; i < def.hull.select; i++) {
    const randomIndex = Math.floor(Math.random() * def.hull.options.length);
    randomOptions.push(def.hull.options[randomIndex].name);
  }
  
  return {
    ...def,
    hull: {
      ...def.hull,
      randomized: randomOptions
    }
  };
}

// Clean roster data for Firestore (remove undefined values)
export function cleanRosterForSave(rosterData) {
  const cleanValue = (value) => {
    if (value === undefined) {
      return null; // Convert undefined to null for Firestore compatibility
    }
    if (Array.isArray(value)) {
      return value.map(cleanValue).filter(v => v !== null);
    }
    if (value && typeof value === 'object') {
      const cleaned = {};
      Object.keys(value).forEach(key => {
        const cleanedVal = cleanValue(value[key]);
        if (cleanedVal !== null) {
          cleaned[key] = cleanedVal;
        }
      });
      return Object.keys(cleaned).length > 0 ? cleaned : null;
    }
    return value;
  };

  return rosterData.map(ship => cleanValue(ship)).filter(ship => ship !== null);
}

// Get stat name - abbreviated only for longer names that would overflow
export function getStatDisplayName(statName) {
  // Only abbreviate the longer stat names that tend to overflow
  const abbreviations = {
    'Armour': 'Arm',
    'Shields': 'Sh'
  };
  
  return abbreviations[statName] || statName;
}

// Format stat value with appropriate units
export function formatStatValue(statName, value) {
  if (value == null || value === undefined) return '—';
  
  // Add units for specific stats
  if (statName === 'Speed') {
    return `${value}"`;
  }
  
  return String(value);
}

// Check if a weapon is a Fighter Bay and return standard stats
export function getFighterBayStats(weaponName) {
  if (weaponName === "Fighter Bays" || weaponName === "Hive Bays") {
    return {
      targets: "Any",
      attacks: "1d6*",
      range: "18\""
    };
  }
  return null;
}

// Legacy getWeaponData function removed - replaced by index-based system in weaponData.js

// Legacy weapon refit effects function - REMOVED
// This has been replaced by the canonical refit system in src/utils/refits/weaponData.js
export function applyWeaponRefitEffects(weaponData, ship) {
  console.warn('⚠️ Legacy applyWeaponRefitEffects called - should use canonical system');
  return weaponData;
}

// Get modified weapon options based on refits
export function getModifiedWeaponOptions(weaponOptions, ship, location) {
  console.warn('⚠️ Legacy getModifiedWeaponOptions called - should use canonical system');
  return weaponOptions;
  

  

  
  // Apply weapon modifications if present
  if (refit?.weaponModifications) {
    // Check if any modifications apply to this location
    const applicableModifications = refit.weaponModifications.filter(mod => 
      mod.conditions?.some(condition => 
        condition.type === 'weaponLocation' && condition.value === location
      )
    );

    // If we have a replaceWith modification, return the replacement weapon
    for (const modification of applicableModifications) {
      if (modification.effects?.replaceWith) {
        return [modification.effects.replaceWith];
      }
    }
  }
  
  // Check for refits that add new weapon options (like Carrier Refit)
  if (refit && refit.name === "Carrier Refit" && location === 'hull') {
    // Check if ship class matches the requirements (if any)
    if (!refit.requirements?.shipClasses || refit.requirements.shipClasses.includes(ship.className)) {
      // Add Launch Bays as an option if not already present
      const hasLaunchBays = modifiedOptions.some(option => option.name === "Launch Bays");
      if (!hasLaunchBays) {
        modifiedOptions.push({ "name": "Launch Bays" });
      }
    }
  }

  // Check for Missile Systems refit (Merchants)
  if (refit && refit.name === "Missile Systems" && location === 'hull') {
    // Add Missile Turrets as an option
    const hasMissileTurrets = modifiedOptions.some(option => option.name === "Missile Turrets");
    if (!hasMissileTurrets) {
      modifiedOptions.push({ 
        "name": "Missile Turrets", 
        "targets": "Fr/Sd", 
        "attacks": 3, 
        "range": "18″" 
      });
    }
  }

  return modifiedOptions;
}

// Check if a weapon modification should be applied to this weapon
function shouldApplyWeaponModification(modification, weaponData, ship) {
  if (!modification.conditions) return true;
  if (!weaponData || !weaponData.name) return false;
  
  return modification.conditions.every(condition => {
    switch (condition.type) {
      case 'weaponLocation':
        // Check if weapon is in specified location (prow, hull)
        if (condition.value === 'prow' && ship.loadout?.prow?.name === weaponData.name) {
          return true;
        }
        if (condition.value === 'hull' && ship.loadout?.hull?.includes(weaponData.name)) {
          return true;
        }
        return false;
        
      case 'weaponType':
        // Check if weapon name contains specified type
        const weaponName = weaponData.name.toLowerCase();
        const conditionValues = condition.values || condition.value ? [condition.value] : [];
        return conditionValues.some(type => weaponName.includes(type.toLowerCase()));
        
      case 'weaponName':
        // Exact weapon name match
        return condition.values.includes(weaponData.name);
        
      case 'attackRange':
        // Check if weapon attacks are within specified range
        const attacks = parseInt(weaponData.attacks) || 0;
        return attacks >= (condition.min || 0) && attacks <= (condition.max || Infinity);
        
      default:
        return true;
    }
  });
}

// Get attack bonus for a weapon modification
function getAttackBonus(modification, weaponData, ship) {
  if (!modification.attackBonus) return 0;
  
  // Static bonus
  if (typeof modification.attackBonus === 'number') {
    return modification.attackBonus;
  }
  
  // Conditional bonuses based on weapon type
  if (typeof modification.attackBonus === 'object') {
    const weaponName = weaponData.name.toLowerCase();
    
    // First check for specific weapon type matches
    for (const [type, bonus] of Object.entries(modification.attackBonus)) {
      if (type !== 'default' && weaponName.includes(type.toLowerCase())) {
        return typeof bonus === 'string' ? parseInt(bonus.replace('+', '')) : bonus;
      }
    }
    
    // If no specific match found, use default if available
    if (modification.attackBonus.default !== undefined) {
      const defaultBonus = modification.attackBonus.default;
      return typeof defaultBonus === 'string' ? parseInt(defaultBonus.replace('+', '')) : defaultBonus;
    }
  }
  
  return 0;
}

// Hull slot management functions
export function calculateTotalHullSlots(shipDef) {
  return shipDef.hull?.select || 0;
}



export function calculateRefitHullSlotCost(ship) {
  if (!ship.refit) return 0;
  
  // Check main refit cost
  let totalCost = 0;
  if (ship.refit.cost?.hull_weapons) {
    totalCost += parseInt(ship.refit.cost.hull_weapons.replace('-', ''));
  }
  
  // Check selected option cost
  if (ship.refit.selectedOption?.cost?.hull_weapons) {
    totalCost += parseInt(ship.refit.selectedOption.cost.hull_weapons.replace('-', ''));
  }
  
  return totalCost;
}

export function calculateAvailableHullSlots(ship, shipDef) {
  const effectiveSlots = calculateEffectiveHullSlots(ship, shipDef);
  const usedSlots = calculateUsedHullSlots(ship, shipDef);
  return Math.max(0, effectiveSlots - usedSlots);
}

// Calculate effective hull weapon slots for a ship (base slots minus refit penalties)
export function calculateEffectiveHullSlots(ship, shipDef) {
  const baseSlots = shipDef.hull?.select || 0;
  let reduction = 0;
  
  // Check for legacy refit format that reduces hull weapon slots
  if (ship.refit?.effects?.hull_weapons) {
    reduction = parseInt(ship.refit.effects.hull_weapons.replace('-', '')) || 0;
  }
  
  // Check for canonical refit format with loseSlots
  if (ship.appliedCanonicalRefit?.cost?.loseSlots) {
    for (const lostSlot of ship.appliedCanonicalRefit.cost.loseSlots) {
      if (lostSlot.slot === 'hull') {
        reduction += lostSlot.count || 0;
      }
    }
  }
  
  return Math.max(0, baseSlots - reduction);
}



// Calculate used hull weapon slots
export function calculateUsedHullSlots(ship, shipDef) {
  if (!ship.loadout?.hull) return 0;
  
  // Filter out beginsWith weapons from the count
  const beginsWithNames = (shipDef.beginsWith || []).map(w => w.name);
  const editableWeapons = ship.loadout.hull.filter(weaponName => 
    !beginsWithNames.includes(weaponName)
  );
  
  return editableWeapons.length;
}
