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
import { getAvailableRefits, convertToCanonicalFormat, isRefitEligible } from '../utils/refitLookup';

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
  squadron,
  onSelectRefit,
  onSelectOption,
  isSquadron = false
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  
  // Different logic for squadron vs capital ship refits
  const getClickabilityLogic = () => {
    if (isSquadron) {
      return {
        isClickable: isEligible && !refit.options && (!hasOtherSelection || isSelected),
        hasStatOptions: false,
        hasWeaponOptions: false
      };
    } else {
      // Capital ship logic
      const hasStatOptions = refit.options && refit.options.some(opt => opt.cost?.statDeltas || opt.gains?.statDeltas) && !refit.options.some(opt => opt.gains?.weapons || opt.weaponChanges?.add);
      const hasWeaponOptions = refit.options && refit.options.some(opt => opt.gains?.weapons || opt.weaponChanges?.add);
      const isClickable = isEligible && !hasStatOptions && (!hasOtherSelection || isSelected);
      
      return { isClickable, hasStatOptions, hasWeaponOptions };
    }
  };

  const { isClickable, hasStatOptions, hasWeaponOptions } = getClickabilityLogic();
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
      onClick={isClickable ? () => onSelect(refit) : undefined}
    >
      {/* Clear button for selected refits */}
      {isSelected && (
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
            backgroundColor: 'error.main',
            color: 'white',
            width: 24,
            height: 24,
            '&:hover': {
              backgroundColor: 'error.dark',
            }
          }}
          aria-label="Clear selected refit"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
      
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, pr: 1 }}>
          {refit.name}
          </Typography>
          <Stack direction="row" spacing={0.5}>
          {isFactionRefit && (
            <Chip 
              label="Faction" 
                size="small" 
                color="secondary"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
            {refit.cost && (
              <Chip 
                label={`${refit.cost} pts`} 
              size="small" 
              color="primary" 
                sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
          </Stack>
        </Box>
        
        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {refit.description}
        </Typography>

        {/* Stat changes */}
        {refit.cost?.statDeltas && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Stat Changes:
                  </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {Object.entries(refit.cost.statDeltas).map(([stat, delta]) => (
                <Chip
                  key={stat}
                  label={`${stat}: ${delta > 0 ? '+' : ''}${delta}`}
                  size="small"
                  color={delta > 0 ? 'success' : 'error'}
                  variant="outlined"
                />
              ))}
            </Stack>
                  </Box>
        )}

        {/* Gains */}
        {refit.gains?.statDeltas && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Gains:
                    </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {Object.entries(refit.gains.statDeltas).map(([stat, delta]) => (
                <Chip
                  key={stat}
                  label={`${stat}: ${delta > 0 ? '+' : ''}${delta}`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              ))}
            </Stack>
                  </Box>
        )}

        {/* Weapon gains - use shared WeaponStatsGrid component */}
        <WeaponStatsGrid weapons={refit.gains?.weapons} />

        {/* Options handling */}
        {!isSquadron && hasStatOptions && refit.options && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Choose Option:
                        </Typography>
            <Stack spacing={1}>
              {refit.options.map((option, index) => (
                        <Button
                  key={index}
                  variant={selectedOption === index ? 'contained' : 'outlined'}
                          size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOption(index);
                    onSelectRefit(refit, option);
                  }}
                  disabled={!isEligible || hasOtherSelection}
                  aria-label={`Select refit option: ${option.name}`}
                >
                  {option.name}
                        </Button>
              ))}
            </Stack>
          </Box>
        )}

        {!isSquadron && hasWeaponOptions && refit.options && (
          <WeaponOptionsGrid 
            options={refit.options}
            ship={ship}
            shipDef={shipDef}
            onSelectOption={(option) => onSelectRefit(refit, option)}
            disabled={!isEligible || hasOtherSelection}
          />
        )}

        {/* Squadron-specific options handling */}
        {isSquadron && refit.options && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Choose Option:
            </Typography>
            <Grid container spacing={1}>
              {refit.options.map((option, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOption(refit, option);
                    }}
                    disabled={!isEligible || hasOtherSelection}
                    sx={{ 
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      textTransform: 'none'
                    }}
                    aria-label={`Select weapon option: ${option.name}`}
                  >
                    {option.name}
                  </Button>
                </Grid>
              ))}
                </Grid>
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
  squadron,
  shipDef, 
  faction, 
  factions, 
  refits,
  onSelectRefit,
  onApplyRefit,
  onClearRefit,
  usedRefits,
  maxRefits 
}) => {
  // Determine if this is a squadron modal based on shipDef.squadron
  const isSquadron = shipDef?.squadron === true;
  const currentShip = isSquadron ? (squadron ? squadron[0] : ship) : ship;
  
  if (!open || !currentShip || !refits) {
    return null;
  }

  // Get available refits using new system
  const targetType = isSquadron ? 'squadron' : 'capital';
  const availableRefits = getAvailableRefits(refits, faction, targetType);
  
  // Debug logging
  console.log(`🔧 ${isSquadron ? 'Squadron' : 'Capital'}RefitModal Debug:`, {
    refitsCount: refits?.length || 0,
    faction,
    availableRefitsCount: availableRefits.length,
    ship: currentShip?.className
  });

  // Separate global and faction refits
  const globalRefits = availableRefits.filter(refit => refit.scope === 'global');
  const factionRefits = availableRefits.filter(refit => refit.scope === faction);

  // Sort refits by name
  const sortedGlobalRefits = globalRefits.sort((a, b) => a.name.localeCompare(b.name));
  const sortedFactionRefits = factionRefits.sort((a, b) => a.name.localeCompare(b.name));

  // Get selected refit info
  const getSelectedRefitInfo = () => {
    if (isSquadron) {
      const selectedRefitName = squadron?.squadronRefit?.name || squadron?.[0]?.squadronRefit?.name;
      return {
        selectedRefitName,
        hasSelectedRefit: Boolean(selectedRefitName)
      };
    } else {
      const selectedRefitName = ship?.appliedCanonicalRefit?.name;
  const canAddMoreRefits = usedRefits < maxRefits;
      return {
        selectedRefitName,
        hasSelectedRefit: Boolean(selectedRefitName),
        canAddMoreRefits
      };
    }
  };

  const { selectedRefitName, hasSelectedRefit, canAddMoreRefits } = getSelectedRefitInfo();

  // Handle refit selection
  const handleRefitSelect = (refit, option = null) => {
    console.log(`MODAL: Selected ${isSquadron ? 'squadron ' : ''}refit`, refit.name);
    
    // Convert to canonical format
    const canonicalRefit = convertToCanonicalFormat(refit);
    console.log('MODAL: Converted to canonical format:', canonicalRefit);
    
    if (isSquadron) {
      if (onApplyRefit) {
        onApplyRefit(squadron, canonicalRefit, option);
      }
    } else {
      if (onSelectRefit) {
        onSelectRefit(canonicalRefit);
      }
    }
    onClose();
  };

  // Handle option selection (squadron-specific)
  const handleOptionSelect = (refit, option) => {
    console.log('MODAL: Selected option', option.name, 'for refit', refit.name);
    
    // Convert to canonical format
    const canonicalRefit = convertToCanonicalFormat(refit);
    console.log('MODAL: Converted to canonical format:', canonicalRefit);
    
    if (onApplyRefit) {
      onApplyRefit(squadron, canonicalRefit, option);
    }
    onClose();
  };

  // Handle clearing selected refit
  const handleClearRefit = () => {
    if (isSquadron) {
      if (onClearRefit) {
        onClearRefit(squadron);
      }
    } else {
      if (onSelectRefit) {
        onSelectRefit(null);
      }
    }
    onClose();
  };

  // Check if refit is eligible
  const isRefitEligibleLocal = (refit) => {
    if (isSquadron) {
      return isRefitEligible(refit, squadron?.[0], shipDef);
    } else {
      return isRefitEligible(refit, ship, shipDef);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        color: 'white'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {isSquadron ? 'Squadron Refits' : 'Capital Ship Refits'} - {currentShip.className}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }} aria-label="Close refit modal">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, backgroundColor: '#1a1a1a' }}>
        {/* Current refit status */}
        {hasSelectedRefit && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(255, 193, 7, 0.1)', borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ffc107' }}>
              Current {isSquadron ? 'Squadron ' : ''}Refit: {selectedRefitName}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleClearRefit}
              sx={{ mt: 1 }}
              aria-label={`Clear ${isSquadron ? 'squadron' : 'ship'} refit`}
            >
              Clear {isSquadron ? 'Squadron ' : ''}Refit
            </Button>
          </Box>
        )}

        {/* Refit limit info for capital ships */}
        {!isSquadron && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Refits Used: {usedRefits} / {maxRefits}
        {!canAddMoreRefits && (
                <Typography component="span" color="warning.main" sx={{ ml: 1 }}>
                  (Maximum reached)
                </Typography>
              )}
            </Typography>
          </Box>
        )}

        {/* Global refits */}
        {sortedGlobalRefits.length > 0 && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
              Global {isSquadron ? 'Squadron ' : 'Capital Ship '}Refits
            </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
              {sortedGlobalRefits.map((refit) => {
                const eligible = isRefitEligibleLocal(refit);
                const isSelected = refit.name === selectedRefitName;
                const hasOtherSelection = hasSelectedRefit && !isSelected;
                
              return (
                  <Grid item xs={12} md={6} key={refit.id}>
                  <RefitCard 
                    refit={refit} 
                    onSelect={handleRefitSelect}
                      onClear={handleClearRefit}
                      isEligible={eligible}
                    isFactionRefit={false}
                      ineligibilityReason={eligible ? null : "Not eligible for this ship"}
                    shipDef={shipDef}
                      isSelected={isSelected}
                      hasOtherSelection={hasOtherSelection}
                    ship={ship}
                      squadron={squadron}
                      onSelectRefit={handleRefitSelect}
                      onSelectOption={handleOptionSelect}
                      isSquadron={isSquadron}
                  />
                </Grid>
              );
            })}
          </Grid>
          </>
        )}

        {/* Faction refits */}
        {sortedFactionRefits.length > 0 && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
              {faction} {isSquadron ? 'Squadron ' : 'Capital Ship '}Refits
            </Typography>
            <Grid container spacing={2}>
              {sortedFactionRefits.map((refit) => {
                const eligible = isRefitEligibleLocal(refit);
                const isSelected = refit.name === selectedRefitName;
                const hasOtherSelection = hasSelectedRefit && !isSelected;
                
                return (
                  <Grid item xs={12} md={6} key={refit.id}>
                    <RefitCard 
                      refit={refit} 
                      onSelect={handleRefitSelect}
                      onClear={handleClearRefit}
                      isEligible={eligible}
                      isFactionRefit={true}
                      ineligibilityReason={eligible ? null : "Not eligible for this squadron"}
                      shipDef={shipDef}
                      isSelected={isSelected}
                      hasOtherSelection={hasOtherSelection}
                      ship={ship}
                      squadron={squadron}
                      onSelectRefit={handleRefitSelect}
                      onSelectOption={handleOptionSelect}
                      isSquadron={isSquadron}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}

        {/* No refits available message */}
        {sortedGlobalRefits.length === 0 && sortedFactionRefits.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No {isSquadron ? 'squadron ' : 'capital ship '}refits available
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RefitModal;