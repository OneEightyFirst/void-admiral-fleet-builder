import { describe, it, expect } from 'vitest';
import { normalizeArc, parseInches, parseAttacks, inferWeaponKind } from '../src/utils/refits/normalize.js';
import { migrateRefitLegacy, migrateFactionRefits } from '../src/utils/refits/migrate.js';
import { validateRefit } from '../src/utils/refits/validate.js';
import { applyRefit, canApplyRefit } from '../src/utils/refits/apply.js';

describe('normalize', () => {
  it('normalizes arcs correctly', () => {
    expect(normalizeArc('Front/Sides')).toBe('Fr/Sd');
    expect(normalizeArc('360°')).toBe('360');
    expect(normalizeArc('Front')).toBe('Front');
    expect(normalizeArc('')).toBe('Any');
  });

  it('parses inches correctly', () => {
    expect(parseInches('18″')).toBe(18);
    expect(parseInches(12)).toBe(12);
    expect(parseInches('-')).toBe('-');
    expect(parseInches('—')).toBe('-');
  });

  it('parses attacks correctly', () => {
    expect(parseAttacks(3)).toBe(3);
    expect(parseAttacks('2d6')).toEqual({ dice: '2d6' });
    expect(parseAttacks('1d6*')).toEqual({ dice: '1d6', star: true });
    expect(parseAttacks('2d6+1')).toEqual({ dice: '2d6+1' });
  });

  it('infers weapon kinds correctly', () => {
    expect(inferWeaponKind('Missiles')).toBe('missiles');
    expect(inferWeaponKind('Light Laser')).toBe('lasers');
    expect(inferWeaponKind('Cannon Turret')).toBe('cannons');
    expect(inferWeaponKind('Fighter Bays')).toBe('launch_bays');
    expect(inferWeaponKind('Unknown Weapon')).toBe('other');
  });
});

describe('migrate', () => {
  it('migrates Up-gunned Prow correctly', () => {
    const legacy = {
      name: "Up-gunned Prow",
      description: "Your ship loses the benefits of armoured prows but adds +2 to the attacks of its prow mounted missiles or +1 to the attacks of its prow mounted lasers.",
      requirements: { prow_weapons: "missiles_or_lasers" },
      cost: { special_rule: "armoured_prows" },
      gains: { prow_weapon_bonus: { missiles: "+2_attacks", lasers: "+1_attacks" } }
    };

    const migrated = migrateRefitLegacy(legacy, "capital", "Loyalists");

    expect(migrated.name).toBe("Up-gunned Prow");
    expect(migrated.scope).toBe("capital");
    expect(migrated.requirements.hasWeapon[0].slot).toBe("prow");
    expect(migrated.requirements.hasWeapon[0].kindAny).toEqual(["missiles", "lasers"]);
    expect(migrated.cost.loseKeywords).toEqual(["Armoured Prows"]);
  });

  it('migrates Sloped Armour correctly', () => {
    const legacy = {
      name: "Sloped Armour",
      description: "Your squadron gains +1 armour but loses 1\" speed.",
      effects: {
        Armour: "+1",
        Speed: "-1″"
      }
    };

    const migrated = migrateRefitLegacy(legacy, "squadron", "Loyalists");

    expect(migrated.name).toBe("Sloped Armour");
    expect(migrated.scope).toBe("squadron");
    expect(migrated.gains.statDeltas.Armour).toBe(1);
    expect(migrated.gains.statDeltas.Speed).toBe(-1);
  });

  it('migrates Marauders with weapon modifications', () => {
    const legacy = {
      name: "Marauders",
      description: "Your raiders gain +2\" speed and +1 to hit with all weapons but lose 1 shield.",
      effects: {
        Speed: "+2″",
        Shields: "-1"
      },
      weaponModifications: [
        {
          conditions: [],
          effects: { hitBonus: "+1" }
        }
      ]
    };

    const migrated = migrateRefitLegacy(legacy, "squadron", "Renegades");

    expect(migrated.gains.statDeltas.Speed).toBe(2);
    expect(migrated.gains.statDeltas.Shields).toBe(-1);
    expect(migrated.weaponChanges.modify[0].changes.toHitDelta).toBe(1);
  });

  it('migrates Auto-Drillers with weapon replacement', () => {
    const legacy = {
      name: "Auto-Drillers",
      description: "Your defender squadron lose their prow cannon turret and replace it with a laser.",
      weaponModifications: [
        {
          conditions: [{ type: "weaponName", values: ["Cannon Turret"] }],
          effects: { 
            replaceWith: { 
              name: "Light Laser", 
              targets: "Fr/Sd", 
              attacks: 1, 
              range: "12″" 
            } 
          }
        }
      ]
    };

    const migrated = migrateRefitLegacy(legacy, "squadron", "Mining Guilds");

    expect(migrated.weaponChanges.replace).toBeDefined();
    expect(migrated.weaponChanges.replace[0].to.name).toBe("Light Laser");
    expect(migrated.weaponChanges.replace[0].to.targets).toBe("Fr/Sd");
  });

  it('migrates Micro Hives with starred dice', () => {
    const legacy = {
      name: "Micro Hives",
      description: "Your pincer squadron does not benefit from the swarm special rule. Exchange their prow weapons for a launch bay.",
      weaponModifications: [
        {
          conditions: [{ type: "weaponLocation", value: "prow" }],
          effects: { 
            replaceWith: { 
              name: "Hive Bays", 
              targets: "Any", 
              attacks: "1d6*", 
              range: "18″" 
            } 
          }
        }
      ]
    };

    const migrated = migrateRefitLegacy(legacy, "squadron", "Insectoids");

    expect(migrated.weaponChanges.replace[0].to.attacks).toEqual({ dice: "1d6", star: true });
    expect(migrated.tokens.hasHiveBays).toBe(true);
  });

  it('migrates Rearguard with 360° arcs', () => {
    const legacy = {
      name: "Rearguard",
      description: "Your squadron of bodyguards subtract 2\" from their speed. Their weapons gain a 360 degree arc of fire.",
      effects: {
        Speed: "-2″"
      },
      weaponModifications: [
        {
          conditions: [],
          effects: { targets: "360" }
        }
      ]
    };

    const migrated = migrateRefitLegacy(legacy, "squadron", "Merchants");

    expect(migrated.gains.statDeltas.Speed).toBe(-2);
    expect(migrated.weaponChanges.modify[0].changes.setTargets).toBe("360");
  });

  it('migrates Command Chapel with slot loss', () => {
    const legacy = {
      name: "Command Chapel",
      description: "Your ship loses one of its hull mounted weapons.",
      effects: {
        hull_weapons: "-1"
      }
    };

    const migrated = migrateRefitLegacy(legacy, "capital", "Disciples");

    expect(migrated.cost.loseSlots[0].slot).toBe("hull");
    expect(migrated.cost.loseSlots[0].count).toBe(1);
  });

  it('migrates Rigged to Blow with ramming effects', () => {
    const legacy = {
      name: "Rigged to Blow",
      description: "Your torchbearer squadron are rigged with bombs."
    };

    const migrated = migrateRefitLegacy(legacy, "squadron", "Disciples");

    expect(migrated.ramming.attacksDelta).toBe(2);
    expect(migrated.ramming.autoSelfDestructOnRam).toBe(true);
  });
});

describe('validate', () => {
  it('validates valid refit', () => {
    const refit = {
      name: "Test Refit",
      description: "A test refit",
      scope: "capital",
      gains: {
        statDeltas: { Hull: 1, Speed: -2 }
      }
    };

    const result = validateRefit(refit);
    expect(result.ok).toBe(true);
  });

  it('rejects invalid scope', () => {
    const refit = {
      name: "Test Refit",
      description: "A test refit",
      scope: "invalid"
    };

    const result = validateRefit(refit);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Invalid scope, must be 'capital' or 'squadron'");
  });

  it('rejects invalid dice notation', () => {
    const refit = {
      name: "Test Refit",
      description: "A test refit",
      scope: "capital",
      weaponChanges: {
        add: [{
          slot: "hull",
          weapon: {
            name: "Test Weapon",
            attacks: { dice: "invalid" }
          }
        }]
      }
    };

    const result = validateRefit(refit);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.includes("Invalid dice notation"))).toBe(true);
  });
});

describe('apply', () => {
  const mockShip = {
    className: "Test Ship",
    statline: { Hull: 5, Speed: 8, Armour: 2, Shields: 3, Flak: 2 },
    loadout: {
      prow: "Cannons",
      hull: ["Lasers"],
      begins: ["Cannon Turret"]
    }
  };

  it('applies stat deltas correctly', () => {
    const refit = {
      name: "Test Refit",
      description: "Test",
      scope: "capital",
      gains: {
        statDeltas: { Hull: 1, Speed: -2 }
      }
    };

    const result = applyRefit(mockShip, refit);
    expect(result.ok).toBe(true);
    expect(result.ship.statline.Hull).toBe(6);
    expect(result.ship.statline.Speed).toBe(6);
  });

  it('checks requirements correctly', () => {
    const refit = {
      name: "Test Refit",
      description: "Test",
      scope: "capital",
      requirements: {
        shipClassesAny: ["Wrong Ship"]
      }
    };

    const result = applyRefit(mockShip, refit);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Requires ship class");
  });

  it('applies weapon replacements', () => {
    const refit = {
      name: "Test Refit",
      description: "Test",
      scope: "squadron",
      weaponChanges: {
        replace: [{
          slot: "any",
          selector: { nameAny: ["Cannon Turret"] },
          to: { name: "Light Laser", kind: "lasers" }
        }]
      }
    };

    const result = applyRefit(mockShip, refit);
    expect(result.ok).toBe(true);
    expect(result.ship.loadout.begins).toContain("Light Laser");
  });

  it('enforces constraints', () => {
    const refit = {
      name: "Test Refit",
      description: "Test",
      scope: "capital",
      gains: {
        statDeltas: { Speed: -10 }
      },
      constraints: {
        speedMin: 4
      }
    };

    const result = applyRefit(mockShip, refit);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Speed would be below minimum");
  });
});
