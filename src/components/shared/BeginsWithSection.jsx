import React from 'react';
import { HullIcon } from '../SVGComponents';

// Helper functions for weapon display (same as BuildViewCard)
const formatAttacks = (attacksObj) => {
  if (!attacksObj) return '';
  if (typeof attacksObj === 'string') return attacksObj;
  if (typeof attacksObj === 'object' && attacksObj.dice) {
    return attacksObj.star ? `${attacksObj.dice}*` : attacksObj.dice;
  }
  return attacksObj.toString();
};

const formatRange = (range) => {
  if (!range) return '';
  return `${range}"`;
};

const BeginsWithSection = ({ 
  beginsWith, 
  squadronRefit = null,
  getWeaponData = null,
  shipDef = null
}) => {
  if (!beginsWith || beginsWith.length === 0) {
    return null;
  }

  return (
    <div className="weapon-section">
      <div className="weapon-section__header weapon-section__header--sticky">
        <div className="weapon-section__table-header">
          <div className="weapon-section__title">Begins with</div>
          <div className="weapon-section__column-label">Target</div>
          <div className="weapon-section__column-label">Attacks</div>
          <div className="weapon-section__column-label">Range</div>
        </div>
      </div>

      <div className="weapon-section__rows">
        {beginsWith.map((weapon, idx) => {
          // Check if this weapon has been replaced by a squadron refit
          const effectiveWeapon = (() => {
            if (squadronRefit?.weaponModifications) {
              for (const modification of squadronRefit.weaponModifications) {
                if (modification.effects?.replaceWith && modification.conditions) {
                  for (const condition of modification.conditions) {
                    if (condition.type === 'weaponName' && 
                        condition.values?.includes(weapon.name)) {
                      return modification.effects.replaceWith;
                    }
                  }
                }
              }
            }
            return weapon;
          })();

          // Get weapon data for display
          const weaponData = getWeaponData 
            ? getWeaponData(effectiveWeapon, shipDef, 'hull', { squadronRefit })
            : effectiveWeapon;

          return (
            <div 
              key={`begins-${idx}`} 
              className="weapon-row weapon-row--readonly weapon-row--selected"
            >
              <div className="weapon-row__content">
                <div className="weapon-row__name">{effectiveWeapon.name}</div>
                <div className="weapon-row__target">{weaponData.targets || "—"}</div>
                <div className="weapon-row__attacks">{formatAttacks(weaponData.attacks) || "—"}</div>
                <div className="weapon-row__range">{formatRange(weaponData.range) || "—"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BeginsWithSection;
