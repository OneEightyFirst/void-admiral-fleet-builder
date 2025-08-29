import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import WeaponStatsGrid from './shared/WeaponStatsGrid';
import WeaponOptionsGrid from './shared/WeaponOptionsGrid';
import { calculateAvailableHullSlots, calculateTotalHullSlots, calculateUsedHullSlots, calculateEffectiveHullSlots } from '../utils/gameUtils';

// RefitCard component for displaying individual refits
const RefitCard = ({ 
  refit, 
  onSelect, 
  onClear,
  isEligible = true, 
  isFactionRefit = false,
  ineligibilityReason = null, 
  shipDef,
  isSelected = false,
  hasOtherSelection = false,
  ship,
  onSelectRefit
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  
  // A refit is clickable if it's eligible and either has no options or only weapon-based options (handled by WeaponOptionsGrid)
  const hasStatOptions = refit.options && refit.options.some(opt => opt.cost?.statDeltas || opt.gains?.statDeltas) && !refit.options.some(opt => opt.gains?.weapons || opt.weaponChanges?.add);
  const hasWeaponOptions = refit.options && refit.options.some(opt => opt.gains?.weapons || opt.weaponChanges?.add);
  const isClickable = isEligible && !hasStatOptions && (!hasOtherSelection || isSelected);
  const shouldGrayOut = hasOtherSelection && !isSelected;

  return (
    <Card 
      sx={{ 
        position: 'relative',
        cursor: isClickable ? 'pointer' : 'default',
        opacity: shouldGrayOut ? 0.3 : (isSelected || isEligible ? 1 : 0.6),
        border: isSelected ? 3 : 1,
        borderColor: isSelected ? '#ffc107' : 'divider',
        backgroundColor: isSelected ? 'rgba(255, 193, 7, 0.1)' : 'background.paper',
        '&:hover': isClickable ? {
          borderColor: 'primary.main',
          boxShadow: 2
        } : {}
      }}
      onClick={() => {
        // Only allow card click for refits without weapon options and if no other selection
        if (isClickable) {
          onSelect(refit);
        }
      }}
    >
      {/* Clear button for selected refits */}
      {isSelected && onClear && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#ffc107',
            width: 24,
            height: 24,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}
      
      <CardContent>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
          {refit.name}
          {isFactionRefit && (
            <Chip 
              label="Faction" 
              size="small" 
              color="primary" 
              sx={{ ml: 1, fontSize: '0.7rem' }} 
            />
          )}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {refit.description}
        </Typography>

        {/* Stat-based options (like Extended Hull) */}
        {hasStatOptions && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Choose Option:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {refit.options.map((option, index) => {
                const isOptionSelected = selectedOption === index;
                const baseCanSelect = isEligible && (!hasOtherSelection || isSelected);
                
                // Check if this specific option would violate speed constraints
                const currentSpeed = ship.statline?.Speed || ship.originalStatline?.Speed || 0;
                const speedCost = option.cost?.statDeltas?.Speed || 0;
                const resultingSpeed = currentSpeed + speedCost;
                const speedMin = refit.constraints?.speedMin || 0;
                const wouldViolateSpeed = resultingSpeed < speedMin;
                
                const canSelectOption = baseCanSelect && !wouldViolateSpeed;
                
                return (
                  <Chip
                    key={index}
                    label={option.name}
                    variant="filled"
                    color="primary"
                    clickable={canSelectOption}
                    disabled={!canSelectOption}
                    sx={{
                      cursor: canSelectOption ? 'pointer' : 'default',
                      opacity: wouldViolateSpeed ? 0.4 : 1,
                      border: isOptionSelected ? 2 : 0,
                      borderColor: isOptionSelected ? 'primary.dark' : 'transparent',
                      '&.Mui-disabled': {
                        opacity: 0.4,
                        color: 'text.disabled',
                        borderColor: 'action.disabled'
                      }
                    }}
                    onClick={() => {
                      if (canSelectOption) {
                        setSelectedOption(index);
                        onSelect(refit, option);
                      }
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Weapon options for turret refits - use shared WeaponOptionsGrid component */}
        <WeaponOptionsGrid 
          refit={refit}
          ship={ship}
          shipDef={shipDef}
          isEligible={isEligible}
          isSelected={isSelected}
          hasOtherSelection={hasOtherSelection}
          onSelect={onSelect}
          onSelectRefit={onSelectRefit}
        />

        {/* Weapon gains - use shared WeaponStatsGrid component */}
        <WeaponStatsGrid weapons={refit.gains?.weapons} />

        {/* Ineligibility reason */}
        {!isEligible && ineligibilityReason && !isSelected && (
          <Typography variant="caption" color="error.main" sx={{ fontWeight: 600, mt: 2, display: 'block' }}>
            {ineligibilityReason}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const RefitModal = ({ 
  open, 
  onClose, 
  ship, 
  shipDef, 
  faction, 
  factions, 
  onSelectRefit,
  usedRefits,
  maxRefits 
}) => {
  if (!open || !ship || !factions) {
    return null;
  }

  const universalRefits = factions?.Universal?.factionRefits?.capitalShipRefits || [];
  const factionRefits = factions?.[faction]?.factionRefits?.capitalShipRefits || [];
  


  const canAddMoreRefits = usedRefits < maxRefits;

  const handleRefitSelect = (refit, option = null) => {
    console.log('MODAL: Selected refit', refit.name);
    
    // For refits with options, we need an option to be selected
    if (refit.options && !option) {
      // Don't proceed without a selected option
      return;
    }
    
    // Apply the refit with the selected option
    onSelectRefit(ship.id, { ...refit, selectedOption: option });
    onClose();
  };

  const handleRefitClear = () => {
    onSelectRefit(null);
    // Don't close modal to allow selecting a different refit
  };

  // Check if ship has any refit selected (canonical or legacy)
  const hasSelectedRefit = (ship.refit !== null && ship.refit !== undefined) || 
                          (ship.appliedCanonicalRefit !== null && ship.appliedCanonicalRefit !== undefined);
  const selectedRefitName = ship.appliedCanonicalRefit?.name || ship.refit?.name;

  const isRefitEligible = (refit) => {
    console.log('🔍 CHECKING ELIGIBILITY for:', refit.name, 'constraints:', refit.constraints);
    
    // Early exit debug
    if (refit.name === 'Heavy Armour') {
      const currentArmour = ship.statline?.Armour || shipDef.statline?.Armour || 0;
      const armourGain = refit.gains?.statDeltas?.Armour || 0;
      console.log('🚨 HEAVY ARMOUR EARLY DEBUG:', {
        currentArmour,
        armourGain,
        resultingArmour: currentArmour + armourGain,
        maxAllowed: 3,
        shipStatline: ship.statline,
        shipDefStatline: shipDef.statline,
        constraints: refit.constraints
      });
    }
    
    // Check hull slot costs (for canonical refit format)
    if (refit.cost?.loseSlots) {
      for (const lostSlot of refit.cost.loseSlots) {
        if (lostSlot.slot === 'hull') {
          const currentUsed = calculateUsedHullSlots(ship, shipDef);
          const currentAvailable = calculateEffectiveHullSlots(ship, shipDef);
          const availableSlots = currentAvailable - currentUsed;
          
          if (availableSlots < lostSlot.count) {
            return false;
          }
        }
      }
    }
    
    // Get ship stats for both requirements and constraints checking
    const stats = shipDef.statline;
    
    // Check requirements if they exist
    if (refit.requirements) {
      for (const [stat, requirement] of Object.entries(refit.requirements)) {
      // Special handling for hull_weapons requirement
      if (stat === 'hull_weapons') {
        const totalHullSlots = calculateTotalHullSlots(shipDef);
        if (totalHullSlots === 0) return false;
        
        if (requirement.includes('+')) {
          const requiredSlots = parseInt(requirement);
          const availableSlots = calculateAvailableHullSlots(ship, shipDef);
          if (availableSlots < requiredSlots) return false;
        }
        continue;
      }
      
      // Special handling for prow_weapons requirement
      if (stat === 'prow_weapons') {
        const prowOptions = shipDef.prow?.options || [];
        if (prowOptions.length === 0) return false;
        
        // Check if any prow weapon matches the requirement (e.g., "missile|laser")
        const requiredTypes = requirement.split('|');
        const hasRequiredWeapon = prowOptions.some(weapon => 
          requiredTypes.some(type => 
            weapon.name.toLowerCase().includes(type.toLowerCase())
          )
        );
        if (!hasRequiredWeapon) return false;
        continue;
      }
      
      // Special handling for className requirement
      if (stat === 'className') {
        if (ship.className !== requirement) return false;
        continue;
      }
      
      // Special handling for shipClasses requirement (array of allowed classes)
      if (stat === 'shipClasses') {
        if (!requirement.includes(ship.className)) return false;
        continue;
      }
      
      // Special handling for shipClassesAny requirement (array of allowed classes)
      if (stat === 'shipClassesAny') {
        if (!requirement.includes(ship.className)) return false;
        continue;
      }
      
      const statValue = stats[stat];
      if (!statValue) return false;
      
      // Parse requirement (e.g., "1+", "max_2", "6+")
      if (requirement.includes('+')) {
        const minValue = parseInt(requirement);
        if (typeof statValue === 'string') {
          const numValue = parseInt(statValue);
          if (numValue < minValue) return false;
        } else if (statValue < minValue) {
          return false;
        }
      } else if (requirement.startsWith('max_')) {
        const maxValue = parseInt(requirement.split('_')[1]);
        if (typeof statValue === 'string') {
          const numValue = parseInt(statValue);
          if (numValue > maxValue) return false;
        } else if (statValue > maxValue) {
          return false;
        }
      }
    }
    }
    
    // Check constraints (different from requirements)
    if (refit.constraints) {
      for (const [constraint, value] of Object.entries(refit.constraints)) {
        if (constraint === 'speedMin') {
          const currentSpeed = ship.statline?.Speed || stats.Speed || 0;
          const minSpeed = parseInt(value);
          
          // For refits with options, check if ALL options would violate the constraint
          if (refit.options) {
            const allOptionsViolateConstraint = refit.options.every(option => {
              const speedCost = option.cost?.statDeltas?.Speed || 0;
              return (currentSpeed + speedCost) < minSpeed;
            });
            if (allOptionsViolateConstraint) return false;
          } else if (currentSpeed < minSpeed) {
            return false;
          }
        } else if (constraint === 'armourMax') {
          const currentArmour = ship.statline?.Armour || stats.Armour || 0;
          const maxArmour = parseInt(value);
          
          // Check if applying this refit would exceed max armour
          const armourGain = refit.gains?.statDeltas?.Armour || 0;
          const resultingArmour = currentArmour + armourGain;
          
          console.log('🔍 ARMOUR DEBUG:', {
            refitName: refit.name,
            currentArmour,
            armourGain,
            resultingArmour,
            maxArmour,
            shipStatline: ship.statline,
            stats
          });
          
          if (resultingArmour > maxArmour) {
            return false;
          }
        }
      }
    }
    
    return true;
  };

  const getIneligibilityReason = (refit) => {
    // Check hull slot costs (for canonical refit format)
    if (refit.cost?.loseSlots) {
      for (const lostSlot of refit.cost.loseSlots) {
        if (lostSlot.slot === 'hull') {
          const currentUsed = calculateUsedHullSlots(ship, shipDef);
          const currentAvailable = calculateEffectiveHullSlots(ship, shipDef);
          const availableSlots = currentAvailable - currentUsed;
          
          if (availableSlots < lostSlot.count) {
            return `All hull slots used`;
          }
        }
      }
    }
    
    if (!refit.requirements) return null;
    
    const stats = shipDef.statline;
    for (const [stat, requirement] of Object.entries(refit.requirements)) {
      // Special handling for hull_weapons requirement
      if (stat === 'hull_weapons') {
        const totalHullSlots = calculateTotalHullSlots(shipDef);
        
        if (totalHullSlots === 0) {
          return `No hull weapon slots available`;
        }
        
        if (requirement.includes('+')) {
          const requiredSlots = parseInt(requirement);
          const availableSlots = calculateAvailableHullSlots(ship, shipDef);
          if (availableSlots < requiredSlots) {
            return `Not available: No empty hull slots`;
          }
        }
        continue;
      }
      
      // Special handling for prow_weapons requirement
      if (stat === 'prow_weapons') {
        const prowOptions = shipDef.prow?.options || [];
        if (prowOptions.length === 0) {
          return `Ship has no prow weapons`;
        }
        
        // Check if any prow weapon matches the requirement (e.g., "missile|laser")
        const requiredTypes = requirement.split('|');
        const hasRequiredWeapon = prowOptions.some(weapon => 
          requiredTypes.some(type => 
            weapon.name.toLowerCase().includes(type.toLowerCase())
          )
        );
        if (!hasRequiredWeapon) {
          return `Requires prow-mounted ${requiredTypes.join(' or ')} weapons`;
        }
        continue;
      }
      
      // Special handling for className requirement
      if (stat === 'className') {
        if (ship.className !== requirement) {
          return `Ship is not ${requirement}`;
        }
        continue;
      }
      
      // Special handling for shipClasses requirement (array of allowed classes)
      if (stat === 'shipClasses') {
        if (!requirement.includes(ship.className)) {
          return `Only available for ${requirement.join(', ')} ships`;
        }
        continue;
      }
      
      const statValue = stats[stat];
      
      if (!statValue) {
        return `Ship has no ${stat}`;
      }
      
      if (requirement.includes('+')) {
        const minValue = parseInt(requirement);
        const currentValue = typeof statValue === 'string' ? parseInt(statValue) : statValue;
        if (currentValue < minValue) {
          return `Requires ${stat} ${minValue}+ (ship has ${currentValue})`;
        }
      } else if (requirement.startsWith('max_')) {
        const maxValue = parseInt(requirement.split('_')[1]);
        const currentValue = typeof statValue === 'string' ? parseInt(statValue) : statValue;
        if (currentValue > maxValue) {
          return `${stat} already at maximum (${currentValue})`;
        }
      }
    }
    
    // Check constraints (different from requirements)
    if (refit.constraints) {
      for (const [constraint, value] of Object.entries(refit.constraints)) {
        if (constraint === 'speedMin') {
          const currentSpeed = ship.statline?.Speed || stats.Speed || 0;
          const minSpeed = parseInt(value);
          
          // For refits with options, check if any option would violate the constraint
          if (refit.options) {
            const wouldViolateConstraint = refit.options.some(option => {
              const speedCost = option.cost?.statDeltas?.Speed || 0;
              return (currentSpeed + speedCost) < minSpeed;
            });
            if (wouldViolateConstraint) {
              return `Would reduce speed below minimum ${minSpeed}" (ship has ${currentSpeed}")`;
            }
          } else if (currentSpeed < minSpeed) {
            return `Requires minimum Speed ${minSpeed}" (ship has ${currentSpeed}")`;
          }
        } else if (constraint === 'armourMax') {
          const currentArmour = ship.statline?.Armour || stats.Armour || 0;
          const maxArmour = parseInt(value);
          
          // Check if applying this refit would exceed max armour
          const armourGain = refit.gains?.statDeltas?.Armour || 0;
          const resultingArmour = currentArmour + armourGain;
          
          if (resultingArmour > maxArmour) {
            return `Armour already at maximum ${maxArmour} (ship has ${currentArmour})`;
          }
        }
      }
    }
    
    return null;
  };

  // Sort refits: eligible first, then ineligible
  const sortedUniversalRefits = [...universalRefits].sort((a, b) => {
    const aEligible = isRefitEligible(a);
    const bEligible = isRefitEligible(b);
    if (aEligible && !bEligible) return -1;
    if (!aEligible && bEligible) return 1;
    return 0;
  });

  const sortedFactionRefits = [...factionRefits].sort((a, b) => {
    const aEligible = isRefitEligible(a);
    const bEligible = isRefitEligible(b);
    if (aEligible && !bEligible) return -1;
    if (!aEligible && bEligible) return 1;
    return 0;
  });



  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ position: 'relative', pb: 1 }}>
        <Typography variant="h5" component="div">
          Select Refit for {ship.className}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Refits used: {usedRefits}/{maxRefits} | 1 refit per 15 points | 1 refit per ship
        </Typography>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'text.secondary'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {!canAddMoreRefits && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.contrastText">
              Maximum refits reached for this fleet size. Remove an existing refit to add a new one.
            </Typography>
          </Box>
        )}

        {/* Universal Refits */}
        {sortedUniversalRefits.length > 0 ? (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {sortedUniversalRefits.map((refit, idx) => {
              const eligible = isRefitEligible(refit);
              const canUse = canAddMoreRefits && eligible;
              return (
                <Grid key={idx} item xs={12} sm={6} md={6}>
                  <RefitCard 
                    refit={refit} 
                    onSelect={handleRefitSelect}
                    onClear={handleRefitClear}
                    isEligible={canUse}
                    ineligibilityReason={!eligible ? getIneligibilityReason(refit) : (!canAddMoreRefits ? "Maximum refits reached" : null)}
                    shipDef={shipDef}
                    isSelected={selectedRefitName === refit.name}
                    hasOtherSelection={hasSelectedRefit && selectedRefitName !== refit.name}
                    ship={ship}
                    onSelectRefit={onSelectRefit}
                  />
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No universal refits available. Check factions.json data structure.
          </Typography>
        )}

        {/* Faction Refits */}
        {factionRefits.length > 0 && (
          <>
            <Grid container spacing={2}>
              {sortedFactionRefits.map((refit, idx) => {
                const eligible = isRefitEligible(refit);
                const canUse = canAddMoreRefits && eligible;
                return (
                  <Grid key={idx} item xs={12} sm={6} md={6}>
                    <RefitCard 
                      refit={refit} 
                      onSelect={handleRefitSelect}
                      onClear={handleRefitClear}
                      isEligible={canUse}
                      isFactionRefit={true}
                      ineligibilityReason={!eligible ? getIneligibilityReason(refit) : (!canAddMoreRefits ? "Maximum refits reached" : null)}
                      shipDef={shipDef}
                      isSelected={selectedRefitName === refit.name}
                      hasOtherSelection={hasSelectedRefit && selectedRefitName !== refit.name}
                      ship={ship}
                      onSelectRefit={onSelectRefit}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}

        {/* Debug info if no refits */}
        {universalRefits.length === 0 && factionRefits.length === 0 && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Debug: No refits found. 
              Universal: {universalRefits.length}, 
              Faction: {factionRefits.length}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RefitModal;
