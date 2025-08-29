/**
 * Normalize arc strings to canonical format
 * @param {string} str - Arc string like "Front/Sides", "360°", etc.
 * @returns {string} Normalized arc
 */
export function normalizeArc(str = "") {
  const m = String(str).replace(/[°\s]/g, "").trim();
  if (m === "360" || m === "360°") return "360";
  
  const map = {
    "Fr/Sd": "Fr/Sd",
    "Front/Sides": "Fr/Sd",
    "Fr/Re": "Fr/Re", 
    "Front/Rear": "Fr/Re",
    "Sd/Re": "Sd/Re",
    "Sides/Rear": "Sides/Rear",
    "Front": "Front",
    "Sides": "Sides", 
    "Rear": "Rear",
    "Any": "Any"
  };
  
  return map[m] || "Any";
}

/**
 * Parse inches from various formats
 * @param {*} v - Value like "18″", 12, "-", etc.
 * @returns {number|"-"|undefined}
 */
export function parseInches(v) {
  if (v == null) return undefined;
  if (v === "-" || v === "—") return "-";
  if (typeof v === "number") return v;
  
  const clean = String(v).replace(/[″"\s]/g, "");
  const num = Number(clean);
  return Number.isFinite(num) ? num : undefined;
}

/**
 * Parse attack values including dice notation
 * @param {*} v - Attack value like 3, "2d6", "1d6*", etc.
 * @returns {number|{dice:string, star?:boolean}|undefined}
 */
export function parseAttacks(v) {
  if (v == null) return undefined;
  if (typeof v === "number") return v;
  
  const s = String(v).trim();
  
  // Check for dice notation like "1d6", "2d6+1", "1d6*"
  if (/^\d+d\d+(?:[+-]\d+)?\*?$/.test(s)) {
    const star = s.endsWith("*");
    const dice = s.replace("*", "");
    return star ? { dice, star: true } : { dice };
  }
  
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

// Weapon classification arrays
const MISSILES = [
  "Missiles", "Missile", "Missile Pods", "Missile Tubes", "Missile Turrets",
  "Mining Charges", "Shard Missiles", "Spore Missiles", "Hunter's Spears", 
  "Sludge Rockets", "Bio-Missiles", "Proton Missiles"
];

const LAUNCH_BAYS = [
  "Launch Bays", "Fighter Bays", "Hive Bays", "Drone Bay", "Fighter Bay"
];

const LASERS = [
  "Lasers", "Laser", "Laser Turret", "Laser Turrets", "Light Laser", "Heavy Laser",
  "Laser Spitters", "Hypha-Lasers", "Leech Lasers", "Laser Crystals", 
  "Lasers Crystals", "Drilling Laser", "Quad-Lasers"
];

const CANNONS = [
  "Cannons", "Cannon", "Cannon Turret", "Cannon Turrets", "Light Cannons", "Heavy Cannons",
  "Short Cannons", "Spine Cannons", "Mycho-Cannons", "Debris Cannons", 
  "Blasting Cannon", "Pulse Cannons", "Mega Cannons", "Cyclone Guns"
];

/**
 * Infer weapon kind from weapon name
 * @param {string} name - Weapon name
 * @returns {"missiles"|"lasers"|"cannons"|"launch_bays"|"other"}
 */
export function inferWeaponKind(name = "") {
  const n = String(name).trim();
  
  // Check launch bays first since some contain "Missile" 
  if (LAUNCH_BAYS.includes(n)) return "launch_bays";
  if (MISSILES.includes(n)) return "missiles";
  if (LASERS.includes(n)) return "lasers";
  if (CANNONS.includes(n)) return "cannons";
  
  return "other";
}

/**
 * Clean and normalize a weapon specification
 * @param {Object} raw - Raw weapon object from JSON
 * @returns {Object} Cleaned weapon spec
 */
export function cleanWeaponSpec(raw = {}) {
  return {
    name: raw.name,
    kind: inferWeaponKind(raw.name),
    targets: normalizeArc(raw.targets),
    attacks: parseAttacks(raw.attacks),
    range: parseInches(raw.range),
    ...(raw.ignoresShields ? { ignoresShields: true } : {})
  };
}
