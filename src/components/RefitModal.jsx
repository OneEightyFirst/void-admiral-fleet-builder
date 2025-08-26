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
import { calculateAvailableHullSlots, calculateTotalHullSlots } from '../utils/gameUtils';

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
  const isClickable = isEligible && !(refit.options && refit.options.some(opt => opt.gains?.weapons)) && (!hasOtherSelection || isSelected);
  const shouldGrayOut = hasOtherSelection && !isSelected;

  return (
    <Card 
      sx={{ 
        position: 'relative',
        cursor: isClickable ? 'pointer' : 'default',
        opacity: shouldGrayOut ? 0.3 : (isSelected || isEligible ? 1 : 0.6),
        border: isSelected ? 3 : (isFactionRefit ? 2 : 1),
        borderColor: isSelected ? '#ffc107' : (isFactionRefit ? 'primary.main' : 'divider'),
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

        {/* Weapon options for turret refits */}
        {refit.options && refit.options.some(opt => opt.gains?.weapons) && (
          <Box sx={{ mt: 1, mx: -2 }}>
            {/* Weapon Headers - Full Width */}
            <Box sx={{
              backgroundColor: '#1f1f1f',
              px: 2,
              py: 1
            }}>
              <Grid container spacing={0}>
                <Grid item xs={4}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '0.75rem'
                    }}
                  >
                    Weapon
                  </Typography>
                </Grid>
                <Grid item xs={2.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.75rem'
                      }}
                    >
                      Target
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={2.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.75rem'
                      }}
                    >
                      Attacks
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.75rem'
                      }}
                    >
                      Range
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={1}>
                  {/* Space for + button */}
                </Grid>
              </Grid>
            </Box>
            
            {/* Weapon Data with + buttons */}
            {refit.options.filter(opt => opt.gains?.weapons).map((option, idx) => {
              // Check if this option is affordable
              const canAffordOption = option.cost ? Object.entries(option.cost).every(([stat, cost]) => {
                const requiredReduction = parseInt(cost.replace('-', ''));
                const currentValue = typeof shipDef.statline[stat] === 'string' ? 
                  parseInt(shipDef.statline[stat]) : shipDef.statline[stat];
                return currentValue >= requiredReduction;
              }) : true;

              return option.gains.weapons.map((weapon, weaponIdx) => {
                // Check if this specific option is currently selected for the ship
                const isThisOptionSelected = ship.refit?.name === refit.name && 
                                           ship.refit?.selectedOption?.name === option.name;

                return (
                  <Box key={`${idx}-${weaponIdx}`} sx={{ px: 2, py: 0.5, backgroundColor: '#181818' }}>
                    <Grid container spacing={0} alignItems="center">
                      <Grid item xs={4}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 600,
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '0.75rem'
                          }}
                        >
                          {weapon.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={2.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              color: 'rgba(255, 255, 255, 0.9)'
                            }}
                          >
                            {weapon.targets}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={2.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              color: 'rgba(255, 255, 255, 0.9)'
                            }}
                          >
                            {weapon.attacks}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              color: 'rgba(255, 255, 255, 0.9)'
                            }}
                          >
                            {weapon.range}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={1}>
                        <Button
                          size="small"
                          disabled={!canAffordOption || !isEligible || (hasOtherSelection && !isSelected)}
                          onClick={() => {
                            if (isThisOptionSelected) {
                              // If this option is selected, clear the refit
                              onSelectRefit(ship.id, null);
                            } else {
                              // Otherwise, select this option
                              onSelect(refit, option);
                            }
                          }}
                          sx={{
                            minWidth: 24,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: canAffordOption && (!hasOtherSelection || isSelected) ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
                            color: canAffordOption && (!hasOtherSelection || isSelected) ? 'white' : 'rgba(255, 255, 255, 0.3)',
                            '&:hover': canAffordOption && (!hasOtherSelection || isSelected) ? {
                              backgroundColor: 'primary.dark'
                            } : {}
                          }}
                        >
                          {isThisOptionSelected ? '×' : '+'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                );
              });
            })}
          </Box>
        )}

        {/* Weapon gains styled like your weapon cards - for refits without options */}
        {(refit.gains?.weapons && !refit.options) && (
          <Box sx={{ mt: 1 }}>
            {/* Weapon Headers */}
            <Box sx={{
              backgroundColor: '#1f1f1f',
              borderRadius: 1,
              px: 1,
              py: 0.5,
              mb: 0.5
            }}>
              <Grid container spacing={0}>
                <Grid item xs={4}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '0.75rem'
                    }}
                  >
                    Weapon
                  </Typography>
                </Grid>
                <Grid item xs={2.67}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.75rem'
                      }}
                    >
                      Target
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={2.67}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.75rem'
                      }}
                    >
                      Attacks
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={2.67}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.75rem'
                      }}
                    >
                      Range
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            
            {/* Weapon Data */}
            {refit.gains.weapons.map((weapon, weaponIdx) => (
              <Box key={weaponIdx} sx={{ px: 1, py: 0.25 }}>
                <Grid container spacing={0}>
                  <Grid item xs={4}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'primary.main',
                        fontSize: '0.75rem'
                      }}
                    >
                      {weapon.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={2.67}>
                    <Typography
                      variant="caption"
                      sx={{
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    >
                      {weapon.targets}
                    </Typography>
                  </Grid>
                  <Grid item xs={2.67}>
                    <Typography
                      variant="caption"
                      sx={{
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    >
                      {weapon.attacks}
                    </Typography>
                  </Grid>
                  <Grid item xs={2.67}>
                    <Typography
                      variant="caption"
                      sx={{
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    >
                      {weapon.range}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        )}

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

  const universalRefits = factions?.universalRefits?.capitalShipRefits || [];
  const factionRefits = factions?.[faction]?.factionRefits?.capitalShipRefits || [];

  const canAddMoreRefits = usedRefits < maxRefits;

  const handleRefitSelect = (refit, option = null) => {
    if (refit.options && !option) {
      // Don't auto-close for refits with options - let user choose the option first
      return;
    }
    onSelectRefit(ship.id, { ...refit, selectedOption: option });
    onClose();
  };

  const handleRefitClear = () => {
    onSelectRefit(ship.id, null);
    // Don't close modal to allow selecting a different refit
  };

  // Check if ship has any refit selected
  const hasSelectedRefit = ship.refit !== null && ship.refit !== undefined;
  const selectedRefitName = ship.refit?.name;

  const isRefitEligible = (refit) => {
    if (!refit.requirements) return true;
    
    // Check requirements against ship stats
    const stats = shipDef.statline;
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
    return true;
  };

  const getIneligibilityReason = (refit) => {
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
                    isFactionRefit={false}
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
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {faction} Faction Refits
            </Typography>
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
