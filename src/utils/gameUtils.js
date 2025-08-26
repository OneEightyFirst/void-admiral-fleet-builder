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
  return rosterData.map(ship => {
    const cleanShip = {};
    Object.keys(ship).forEach(key => {
      if (ship[key] !== undefined) {
        cleanShip[key] = ship[key];
      }
    });
    return cleanShip;
  });
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

// Check if a weapon is a Fighter Bay and return standard stats
export function getFighterBayStats(weaponName) {
  if (weaponName === "Fighter Bays") {
    return {
      targets: "Any",
      attacks: "1d6*",
      range: "18\""
    };
  }
  return null;
}

// Get weapon data with Fighter Bay handling
export function getWeaponData(weapon, allWeapons = []) {
  // If it's already a complete weapon object, return it
  if (weapon && typeof weapon === 'object' && weapon.targets) {
    return weapon;
  }
  
  // If it's a string (weapon name), look it up or check for Fighter Bay
  const weaponName = typeof weapon === 'string' ? weapon : weapon?.name;
  
  // Check for Fighter Bay first
  const fighterBayStats = getFighterBayStats(weaponName);
  if (fighterBayStats) {
    return { name: weaponName, ...fighterBayStats };
  }
  
  // Look up in provided weapons list
  return allWeapons.find(w => w.name === weaponName) || { name: weaponName };
}
