import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { migrateFactionRefits } from '../src/utils/refits/migrate.js';
import { validateRefit } from '../src/utils/refits/validate.js';
import { applyRefit, createRefitDiff } from '../src/utils/refits/apply.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load factions data
const factionsPath = path.join(__dirname, '../public/data/factions.json');
const factionsData = JSON.parse(fs.readFileSync(factionsPath, 'utf8'));

console.log('🚀 Void Admiral Refits Playground\n');

// Test with a few key factions
const testFactions = ['Loyalists', 'Renegades', 'Mining Guilds', 'Disciples'];

for (const factionName of testFactions) {
  console.log(`\n=== ${factionName.toUpperCase()} ===`);
  
  const factionData = factionsData[factionName];
  if (!factionData?.factionRefits) {
    console.log('❌ No faction refits found');
    continue;
  }
  
  // Migrate refits
  const migratedRefits = migrateFactionRefits(factionData, factionName);
  
  console.log(`📦 Migrated ${migratedRefits.capital.length} capital + ${migratedRefits.squadron.length} squadron refits`);
  
  // Validate each refit
  const allRefits = [...migratedRefits.capital, ...migratedRefits.squadron];
  let validCount = 0;
  
  for (const refit of allRefits) {
    const validation = validateRefit(refit);
    if (validation.ok) {
      validCount++;
      console.log(`  ✅ ${refit.name} (${refit.scope})`);
    } else {
      console.log(`  ❌ ${refit.name} (${refit.scope})`);
      validation.errors.forEach(error => console.log(`     - ${error}`));
    }
  }
  
  console.log(`📊 ${validCount}/${allRefits.length} refits validated successfully`);
}

console.log('\n=== REFIT APPLICATION TESTS ===\n');

// Create test ship fixtures
const mockCapitalShip = {
  className: "Galleon",
  statline: { Hull: 10, Speed: 6, Armour: 3, Shields: 4, Flak: 3 },
  loadout: {
    prow: "Heavy Missiles",
    hull: ["Cannons", "Lasers"],
    begins: []
  }
};

const mockSquadronShip = {
  className: "Defender",
  statline: { Hull: 1, Speed: 8, Armour: 2, Shields: 2, Flak: 1 },
  loadout: {
    prow: null,
    hull: [],
    begins: ["Cannon Turret"]
  }
};

// Test Up-gunned Prow (Loyalists)
console.log('🔧 Testing Up-gunned Prow on Galleon');
const loyalistRefits = migrateFactionRefits(factionsData.Loyalists, 'Loyalists');
const upGunnedProw = loyalistRefits.capital.find(r => r.name === "Up-gunned Prow");

if (upGunnedProw) {
  console.log('Before:', JSON.stringify(mockCapitalShip.statline, null, 2));
  const result = applyRefit(mockCapitalShip, upGunnedProw);
  
  if (result.ok) {
    console.log('✅ Refit applied successfully');
    console.log('After:', JSON.stringify(result.ship.statline, null, 2));
    
    const diff = createRefitDiff(mockCapitalShip, result.ship);
    console.log('Changes:');
    diff.forEach(change => console.log(`  - ${change}`));
    
    if (result.ship.lostKeywords) {
      console.log('Lost Keywords:', result.ship.lostKeywords);
    }
  } else {
    console.log('❌ Refit failed:', result.error);
  }
} else {
  console.log('❌ Up-gunned Prow refit not found');
}

// Test Auto-Drillers (Mining Guilds)
console.log('\n🔧 Testing Auto-Drillers on Defender');
const miningRefits = migrateFactionRefits(factionsData['Mining Guilds'], 'Mining Guilds');
const autoDrillers = miningRefits.squadron.find(r => r.name === "Auto-Drillers");

if (autoDrillers) {
  console.log('Before loadout:', JSON.stringify(mockSquadronShip.loadout, null, 2));
  const result = applyRefit(mockSquadronShip, autoDrillers);
  
  if (result.ok) {
    console.log('✅ Refit applied successfully');
    console.log('After loadout:', JSON.stringify(result.ship.loadout, null, 2));
    
    const diff = createRefitDiff(mockSquadronShip, result.ship);
    console.log('Changes:');
    diff.forEach(change => console.log(`  - ${change}`));
  } else {
    console.log('❌ Refit failed:', result.error);
  }
} else {
  console.log('❌ Auto-Drillers refit not found');
}

// Test Sloped Armour (Loyalists squadron)
console.log('\n🔧 Testing Sloped Armour on Squadron');
const slopedArmour = loyalistRefits.squadron.find(r => r.name === "Sloped Armour");

if (slopedArmour) {
  console.log('Before stats:', JSON.stringify(mockSquadronShip.statline, null, 2));
  const result = applyRefit(mockSquadronShip, slopedArmour);
  
  if (result.ok) {
    console.log('✅ Refit applied successfully');
    console.log('After stats:', JSON.stringify(result.ship.statline, null, 2));
    
    const diff = createRefitDiff(mockSquadronShip, result.ship);
    console.log('Changes:');
    diff.forEach(change => console.log(`  - ${change}`));
  } else {
    console.log('❌ Refit failed:', result.error);
  }
} else {
  console.log('❌ Sloped Armour refit not found');
}

// Test Command Chapel (Disciples)
console.log('\n🔧 Testing Command Chapel hull slot reduction');
const disciplesRefits = migrateFactionRefits(factionsData.Disciples, 'Disciples');
const commandChapel = disciplesRefits.capital.find(r => r.name === "Command Chapel");

if (commandChapel) {
  const shipWithHull = {
    ...mockCapitalShip,
    hullSlots: 3,
    loadout: { ...mockCapitalShip.loadout, hull: ["Cannons", "Lasers", "Missiles"] }
  };
  
  console.log('Before hull slots:', shipWithHull.hullSlots);
  console.log('Before hull weapons:', shipWithHull.loadout.hull);
  
  const result = applyRefit(shipWithHull, commandChapel);
  
  if (result.ok) {
    console.log('✅ Refit applied successfully');
    console.log('After hull slots:', result.ship.hullSlots || 'unchanged');
    console.log('Hull weapons still:', result.ship.loadout.hull);
  } else {
    console.log('❌ Refit failed:', result.error);
  }
} else {
  console.log('❌ Command Chapel refit not found');
}

console.log('\n🎯 Playground complete! All major refit patterns tested.\n');

// Summary statistics
const totalFactions = Object.keys(factionsData).length;
const factionsWithRefits = Object.values(factionsData).filter(f => f.factionRefits).length;

console.log('📈 SUMMARY');
console.log(`Total factions: ${totalFactions}`);
console.log(`Factions with refits: ${factionsWithRefits}`);
console.log(`Coverage: ${Math.round(factionsWithRefits / totalFactions * 100)}%`);

// Export sample canonical refit for reference
const sampleRefit = {
  name: "Example Canonical Refit",
  description: "Shows all possible fields in canonical format",
  scope: "capital",
  requirements: {
    shipClassesAny: ["Galleon", "Battleship"],
    hasWeapon: [{
      slot: "prow",
      kindAny: ["missiles", "lasers"]
    }]
  },
  cost: {
    loseKeywords: ["Armoured Prows"],
    loseSlots: [{ slot: "hull", count: 1 }],
    statDeltas: { Shields: -1 }
  },
  gains: {
    addKeywords: ["Small Target"],
    statDeltas: { Speed: 2, Armour: 1 },
    capabilities: {
      boardAndShootSameActivation: true
    }
  },
  weaponChanges: {
    unlockOptions: [{
      slot: "hull",
      allowKindsAny: ["missiles"]
    }],
    replace: [{
      slot: "prow",
      selector: { kindAny: ["cannons"] },
      to: { name: "Heavy Laser", kind: "lasers", targets: "Fr/Sd", attacks: 3, range: 18 }
    }],
    add: [{
      slot: "hull",
      weapon: { name: "Point Defense", kind: "other", targets: "360", attacks: 2, range: 6 }
    }],
    modify: [{
      selector: { slot: "any", kindAny: ["missiles"] },
      changes: { attacksDelta: 1, setTargets: "360" }
    }]
  },
  boarding: { diceDelta: 1, perFighterTokenBonus: 1 },
  ramming: { toHitDelta: 1, autoSelfDestructOnRam: false },
  deployment: { deployOutsideZoneInches: 6 },
  tokens: { hasLaunchBays: true },
  targetProfile: { smallTarget: true },
  constraints: { speedMin: 4, armourMax: 5 },
  notes: ["Example refit showcasing all canonical fields", "This would never be a real refit"]
};

console.log('\n📋 Sample canonical refit structure:');
console.log(JSON.stringify(sampleRefit, null, 2));
