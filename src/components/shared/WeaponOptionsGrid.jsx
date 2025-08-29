import React from 'react';
import { Box } from '@mui/material';
import WeaponStatsGrid from './WeaponStatsGrid';

const WeaponOptionsGrid = ({ 
  refit, 
  ship, 
  shipDef, 
  isEligible, 
  isSelected, 
  hasOtherSelection, 
  onSelect, 
  onSelectRefit 
}) => {
  // Check if refit has weapon options in either legacy or canonical format
  if (!refit.options || !refit.options.some(opt => 
    opt.gains?.weapons || opt.weaponChanges?.add
  )) {
    return null;
  }

  // Flatten all weapons from all options into a single array with metadata
  const allWeapons = [];
  
  refit.options.filter(opt => 
    opt.gains?.weapons || opt.weaponChanges?.add
  ).forEach((option, optionIdx) => {
    // Check if this option is affordable
    const canAffordOption = option.cost ? (() => {
      // Handle canonical format cost (statDeltas)
      if (option.cost.statDeltas) {
        return Object.entries(option.cost.statDeltas).every(([stat, delta]) => {
          const requiredReduction = Math.abs(delta);
          const currentValue = typeof shipDef.statline[stat] === 'string' ? 
            parseInt(shipDef.statline[stat]) : shipDef.statline[stat];
          return currentValue >= requiredReduction;
        });
      }
      // Handle legacy format cost
      return Object.entries(option.cost).every(([stat, cost]) => {
        const requiredReduction = parseInt(cost.replace('-', ''));
        const currentValue = typeof shipDef.statline[stat] === 'string' ? 
          parseInt(shipDef.statline[stat]) : shipDef.statline[stat];
        return currentValue >= requiredReduction;
      });
    })() : true;

    // Get weapons from either legacy or canonical format
    const weapons = option.gains?.weapons || 
      (option.weaponChanges?.add || []).map(weaponAdd => weaponAdd.weapon);

    weapons.forEach((weapon, weaponIdx) => {
      // Check if this specific option is currently selected for the ship
      const isThisOptionSelected = (ship.refit?.name === refit.name && 
                                   ship.refit?.selectedOption?.name === option.name) ||
                                  (ship.appliedCanonicalRefit?.name === refit.name &&
                                   ship.appliedCanonicalRefit?.selectedOption?.name === option.name);

      allWeapons.push({
        ...weapon,
        _option: option,
        _optionIdx: optionIdx,
        _weaponIdx: weaponIdx,
        _canAfford: canAffordOption,
        _isSelected: isThisOptionSelected
      });
    });
  });

  const handleWeaponAction = (weapon, weaponIdx) => {
    const option = weapon._option;
    const isThisOptionSelected = weapon._isSelected;
    
    if (isThisOptionSelected) {
      // If this option is selected, clear the refit (use new format)
      onSelectRefit(null);
    } else {
      // Otherwise, select this option
      onSelect(refit, option);
    }
  };

  const getActionProps = (weapon, weaponIdx) => {
    const canAfford = weapon._canAfford;
    const isThisOptionSelected = weapon._isSelected;
    
    return {
      disabled: !canAfford || !isEligible || (hasOtherSelection && !isSelected),
      sx: {
        minWidth: 24,
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: canAfford && (!hasOtherSelection || isSelected) ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
        color: canAfford && (!hasOtherSelection || isSelected) ? 'white' : 'rgba(255, 255, 255, 0.3)',
        '&:hover': canAfford && (!hasOtherSelection || isSelected) ? {
          backgroundColor: 'primary.dark'
        } : {}
      },
      label: isThisOptionSelected ? '×' : '+'
    };
  };

  return (
    <WeaponStatsGrid 
      weapons={allWeapons}
      showActions={true}
      onWeaponAction={handleWeaponAction}
      getActionProps={getActionProps}
    />
  );
};

export default WeaponOptionsGrid;
