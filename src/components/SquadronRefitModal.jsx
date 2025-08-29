import React from 'react';
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

// SquadronRefitCard component for displaying individual squadron refits
const SquadronRefitCard = ({ 
  refit, 
  onSelect, 
  onClear,
  isEligible = true, 
  isFactionRefit = false, 
  ineligibilityReason = null, 
  shipDef,
  isSelected = false,
  hasOtherSelection = false,
  squadron,
  onSelectOption
}) => {
  const isClickable = isEligible && !refit.options && (!hasOtherSelection || isSelected);
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
        // Only allow card click for refits without options and if no other selection
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
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: refit.note ? 1 : 2 }}>
          {refit.description}
        </Typography>

        {/* Special note for refits like Bulky Design */}
        {refit.note && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2, 
              mt: 1,
              fontStyle: 'italic',
              fontSize: '0.875rem'
            }}
          >
            {refit.note}
          </Typography>
        )}

        {/* Options for refits like Bulky Design */}
        {refit.options && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {refit.options.map((option, index) => {
              const optionEligible = !option.requirements || Object.entries(option.requirements).every(([stat, requirement]) => {
                const statValue = shipDef.statline[stat];
                if (!statValue) return false;
                
                if (requirement.includes('+')) {
                  const minValue = parseInt(requirement);
                  const currentValue = typeof statValue === 'string' ? parseInt(statValue) : statValue;
                  return currentValue >= minValue;
                }
                return true;
              });

              const isThisOptionSelected = squadron.squadronRefit?.name === refit.name && squadron.squadronRefit?.selectedOption === option.name;
              
              // Create simple pill text based on effects (canonical format)
              let pillText = option.name;
              
              // Check canonical format first (cost.statDeltas and gains.statDeltas)
              if (option.cost?.statDeltas) {
                const costDeltas = Object.entries(option.cost.statDeltas);
                if (costDeltas.some(([stat, delta]) => stat === 'Shields' && delta === -1)) {
                  pillText = '-1 Shield';
                } else if (costDeltas.some(([stat, delta]) => stat === 'Flak' && delta === -1)) {
                  pillText = '-1 Flak';
                }
              }
              // Fallback to legacy effects format
              else if (option.effects) {
                const effects = Object.entries(option.effects);
                if (effects.some(([stat, effect]) => stat === 'Shields' && effect === '-1')) {
                  pillText = '-1 Shield';
                } else if (effects.some(([stat, effect]) => stat === 'Flak' && effect === '-1')) {
                  pillText = '-1 Flak';
                }
              }

              return (
                <Chip
                  key={index}
                  clickable
                  color={isThisOptionSelected ? "primary" : "default"}
                  disabled={!optionEligible || (!isSelected && hasOtherSelection)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isThisOptionSelected) {
                      // If this option is selected, clear the refit
                      onClear();
                    } else if (optionEligible) {
                      // Otherwise, select this option
                      onSelectOption(refit, option);
                    }
                  }}
                  label={pillText}
                />
              );
            })}
          </Box>
        )}

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

const SquadronRefitModal = ({ 
  open, 
  onClose, 
  squadron, 
  shipDef, 
  faction,
  factions,
  onApplyRefit,
  onClearRefit
}) => {
  if (!open || !squadron || !shipDef || !factions) return null;

  // Get squadron refits from Universal faction
  const universalSquadronRefits = factions.Universal?.factionRefits?.squadronRefits || [];
  
  // Get faction-specific squadron refits if they exist
  const factionData = factions[faction];
  const factionSquadronRefits = factionData?.factionRefits?.squadronRefits || [];
  


  const selectedRefitName = squadron.squadronRefit?.name;
  const hasSelectedRefit = Boolean(selectedRefitName);

  const handleRefitSelect = (refit) => {
    onApplyRefit(squadron.groupId, refit, null);
    onClose(); // Auto-close like capital ship modal
  };

  const handleRefitClear = () => {
    onClearRefit(squadron.groupId);
    // Don't close on clear - allow selecting a different refit (matches capital ship behavior)
  };

  const handleOptionSelect = (refit, option) => {
    console.log('🔧 SQUADRON MODAL: Selecting option for refit:', refit.name, 'option:', option.name);
    console.log('🔧 SQUADRON MODAL: Option details:', option);
    onApplyRefit(squadron.groupId, refit, option);
    onClose(); // Auto-close like capital ship modal
  };

  const isRefitEligible = (refit) => {
    console.log('🔍 SQUADRON CHECKING ELIGIBILITY for:', refit.name, 'constraints:', refit.constraints);
    
    // Check hull slot costs (for canonical refit format)
    if (refit.cost?.loseSlots) {
      for (const lostSlot of refit.cost.loseSlots) {
        if (lostSlot.slot === 'hull') {
          // For squadrons, we need to adapt this logic since they don't have loadouts like capital ships
          // For now, assume squadrons can't afford to lose hull slots
          return false;
        }
      }
    }
    
    // Get ship stats for both requirements and constraints checking
    const stats = shipDef.statline;
    
    // Check requirements if they exist
    if (refit.requirements) {
      for (const [stat, requirement] of Object.entries(refit.requirements)) {
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
      
      const statValue = stats[stat];
      
      if (!statValue) {
        return false;
      }
      
      if (requirement.includes('+')) {
        const minValue = parseInt(requirement);
        const currentValue = typeof statValue === 'string' ? parseInt(statValue) : statValue;
        if (currentValue < minValue) {
          return false;
        }
      } else if (requirement.startsWith('max_')) {
        const maxValue = parseInt(requirement.split('_')[1]);
        const currentValue = typeof statValue === 'string' ? parseInt(statValue) : statValue;
        if (currentValue > maxValue) {
          return false;
        }
      }
    }
    }
    
    // Check constraints (different from requirements)
    if (refit.constraints) {
      for (const [constraint, value] of Object.entries(refit.constraints)) {
        if (constraint === 'speedMin') {
          const currentSpeed = squadron.statline?.Speed || stats.Speed || 0;
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
          const currentArmour = squadron.statline?.Armour || stats.Armour || 0;
          const maxArmour = parseInt(value);
          
          // Check if applying this refit would exceed max armour
          const armourGain = refit.gains?.statDeltas?.Armour || 0;
          const resultingArmour = currentArmour + armourGain;
          
          console.log('🔍 SQUADRON ARMOUR DEBUG:', {
            refitName: refit.name,
            currentArmour,
            armourGain,
            resultingArmour,
            maxArmour,
            squadronStatline: squadron.statline,
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
    // Check hull slot costs first
    if (refit.cost?.loseSlots) {
      for (const lostSlot of refit.cost.loseSlots) {
        if (lostSlot.slot === 'hull') {
          return `Cannot lose hull slots`;
        }
      }
    }
    
    const stats = shipDef.statline;
    
    // Check requirements
    if (refit.requirements) {
    for (const [stat, requirement] of Object.entries(refit.requirements)) {
      // Special handling for prow_weapons requirement
      if (stat === 'prow_weapons') {
        const prowOptions = shipDef.prow?.options || [];
        if (prowOptions.length === 0) {
          return `Squadron has no prow weapons`;
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
      
      const statValue = stats[stat];
      
      if (!statValue) {
        return `Ship has no ${stat}`;
      }
      
      if (requirement.includes('+')) {
        const minValue = parseInt(requirement);
        const currentValue = typeof statValue === 'string' ? parseInt(statValue) : statValue;
        if (currentValue < minValue) {
          return `Requires ${stat} ${minValue}+ (squadron has ${currentValue})`;
        }
      } else if (requirement.startsWith('max_')) {
        const maxValue = parseInt(requirement.split('_')[1]);
        const currentValue = typeof statValue === 'string' ? parseInt(statValue) : statValue;
        if (currentValue > maxValue) {
          return `${stat} already at maximum (${currentValue})`;
        }
      }
    }
    }
    
    // Check constraints
    if (refit.constraints) {
      for (const [constraint, value] of Object.entries(refit.constraints)) {
        if (constraint === 'speedMin') {
          const currentSpeed = squadron.statline?.Speed || stats.Speed || 0;
          const minSpeed = parseInt(value);
          
          if (refit.options) {
            const allOptionsViolateConstraint = refit.options.every(option => {
              const speedCost = option.cost?.statDeltas?.Speed || 0;
              return (currentSpeed + speedCost) < minSpeed;
            });
            if (allOptionsViolateConstraint) {
              return `All options would reduce speed below minimum (${minSpeed}")`;
            }
          } else if (currentSpeed < minSpeed) {
            return `Speed below minimum (${minSpeed}")`;
          }
        } else if (constraint === 'armourMax') {
          const currentArmour = squadron.statline?.Armour || stats.Armour || 0;
          const maxArmour = parseInt(value);
          const armourGain = refit.gains?.statDeltas?.Armour || 0;
          const resultingArmour = currentArmour + armourGain;
          
          if (resultingArmour > maxArmour) {
            return `Armour would exceed maximum (${maxArmour})`;
          }
        }
      }
    }
    
    return null;
  };

  // Sort refits: eligible first, then ineligible
  const sortedUniversalRefits = [...universalSquadronRefits].sort((a, b) => {
    const aEligible = isRefitEligible(a);
    const bEligible = isRefitEligible(b);
    if (aEligible && !bEligible) return -1;
    if (!aEligible && bEligible) return 1;
    return 0;
  });

  const sortedFactionRefits = [...factionSquadronRefits].sort((a, b) => {
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
          Squadron Refits for {shipDef.size}
        </Typography>

        <IconButton 
          onClick={onClose} 
          sx={{ 
            position: 'absolute', 
            right: 8, 
            top: 8, 
            color: 'grey.500' 
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {/* Universal Squadron Refits */}
        {sortedUniversalRefits.length > 0 && (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {sortedUniversalRefits.map((refit, index) => {
                const eligible = isRefitEligible(refit);
                const canUse = eligible;

                return (
                  <Grid item xs={12} md={6} key={index}>
                    <SquadronRefitCard
                      refit={refit}
                      onSelect={handleRefitSelect}
                      onClear={handleRefitClear}
                      isEligible={canUse}
                      isFactionRefit={false}
                      ineligibilityReason={!eligible ? getIneligibilityReason(refit) : null}
                      shipDef={shipDef}
                      isSelected={selectedRefitName === refit.name}
                      hasOtherSelection={hasSelectedRefit && selectedRefitName !== refit.name}
                      squadron={squadron}
                      onSelectOption={handleOptionSelect}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}

        {/* Faction Squadron Refits */}
        {sortedFactionRefits.length > 0 && (
          <>
            <Grid container spacing={2}>
              {sortedFactionRefits.map((refit, index) => {
                const eligible = isRefitEligible(refit);
                const canUse = eligible;

                return (
                  <Grid item xs={12} md={6} key={index}>
                    <SquadronRefitCard
                      refit={refit}
                      onSelect={handleRefitSelect}
                      onClear={handleRefitClear}
                      isEligible={canUse}
                      isFactionRefit={true}
                      ineligibilityReason={!eligible ? getIneligibilityReason(refit) : null}
                      shipDef={shipDef}
                      isSelected={selectedRefitName === refit.name}
                      hasOtherSelection={hasSelectedRefit && selectedRefitName !== refit.name}
                      squadron={squadron}
                      onSelectOption={handleOptionSelect}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}

        {/* No refits available message */}
        {sortedUniversalRefits.length === 0 && sortedFactionRefits.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No squadron refits available
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SquadronRefitModal;
