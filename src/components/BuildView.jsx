import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  Stack,
  Alert,
  Chip,
  TextField,
  IconButton,
  Tooltip as MuiTooltip,
  ClickAwayListener,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Remove as RemoveIcon,
  Add as PlusIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { DiceFace, ProwIcon, HullIcon } from './SVGComponents';
import BuildViewCard from './BuildViewCard';
import RefitModal from './RefitModal';
import BeginsWithSection from './shared/BeginsWithSection';
import {
  getFluff,
  getSpecialRules,
  getCommandAbilities,
  getShipCost,
  getStatDisplayName,
  hasUnplannedConstruction,
  calculateEffectiveHullSlots,
  calculateUsedHullSlots
} from '../utils/gameUtils';

// Import refit display utilities
import { hasRefit, getRefitName, getRefitDisplayText } from '../utils/refitDisplayUtils';

// Import refit lookup utilities
import { getAvailableRefits, convertToCanonicalFormat, isRefitEligible } from '../utils/refitLookup';

// Import canonical refit functions
import {
  getWeaponDataByIndex,
  convertLoadoutToIndices,
  getCanonicalModifiedWeaponOptions as getModifiedWeaponOptions,
  getRefitSlotWeapons
} from '../utils/refits/weaponData.js';

import {
  applyCanonicalRefitToShip
} from '../utils/refits/shipRefits.js';

const BuildView = ({
  // Fleet data
  fleetName,
  setFleetName,
  faction,
  setFaction,
  points,
  setPoints,
  roster,
  setRoster,
  factions,
  refits,
  ships,
  
  // UI state
  isEditingName,
  setIsEditingName,
  saveStatus,
  user,
  
  // Calculated values
  cap,
  used,
  uniqueClash,
  
  // Content toggles
  useRefits,
  setUseRefits,
  useJuggernauts,
  setUseJuggernauts,
  
  // Refit data
  maxRefits,
  usedRefits,
  canAddRefit,
  
  // Functions
  addShip,
  removeShip,
  removeGroup,
  duplicateGroup,
  pickProw,
  addHull,
  removeHullByName,
  randomizeHull,
  selectAdvancementWeapon,
  addRefit,
  removeRefit,
  addRefitToGroup,
  removeRefitFromGroup,
  saveFleet,
  startNewFleet,
  signInWithGoogle,
  isPlayMode,
  setIsPlayMode
}) => {

  
  const [refitModalOpen, setRefitModalOpen] = useState(false);
  const [refitModalShip, setRefitModalShip] = useState(null);
  const [squadronRefitModalOpen, setSquadronRefitModalOpen] = useState(false);
  const [squadronRefitModalSquadron, setSquadronRefitModalSquadron] = useState(null);
  const [weaponOptionsRefreshKey, setWeaponOptionsRefreshKey] = useState(0);

  // Helper function to check if a weapon option should be auto-selected
  const shouldAutoSelectWeapon = (weaponOptions, currentSelection) => {
    // Only auto-select if:
    // 1. There's exactly one option
    // 2. Nothing is currently selected
    // 3. The weapon has no cost (no +/- points)
    if (weaponOptions.length !== 1 || currentSelection) {
      return false;
    }
    
    const option = weaponOptions[0];
    
    // Check if weapon has cost indicators (contains + or - signs)
    const hasCost = option.name && (option.name.includes('+') || option.name.includes('-'));
    
    return !hasCost;
  };

  // Auto-selection effect for prow and hull weapons
  useEffect(() => {
    if (!roster || roster.length === 0) return;
    
    roster.forEach(ship => {
      if (ship.squadron) return; // Skip squadrons
      
      const shipDef = ships[ship.className];
      if (!shipDef) return;
      
      // Auto-select prow weapons
      if (shipDef.prow?.options) {
        const modifiedProwOptions = getModifiedWeaponOptions(shipDef.prow.options, ship, 'prow');
        
        if (shouldAutoSelectWeapon(modifiedProwOptions, ship.loadout.prow)) {

          pickProw(ship.id, modifiedProwOptions[0]);
        }
      }
      
      // Auto-select hull weapons if there's only one option and slots are available
      if (shipDef.hull?.options) {
        const modifiedHullOptions = getModifiedWeaponOptions(shipDef.hull.options, ship, 'hull');
        const effectiveSlots = calculateEffectiveHullSlots(ship, shipDef);
        const usedSlots = calculateUsedHullSlots(ship, shipDef);
        const availableSlots = effectiveSlots - usedSlots;
        
        // Auto-select if there's exactly one hull option, available slots, and no cost
        if (availableSlots > 0 && shouldAutoSelectWeapon(modifiedHullOptions, null)) {

          addHull(ship.id, modifiedHullOptions[0]);
        }
      }
    });
  }, [roster, ships, weaponOptionsRefreshKey]); // Include weaponOptionsRefreshKey to trigger after refits

  const handleOpenRefitModal = (ship) => {

    setRefitModalShip(ship);
    setRefitModalOpen(true);
  };

  const handleCloseRefitModal = () => {
    setRefitModalOpen(false);
    setRefitModalShip(null);
  };

  // Legacy refit handler replaced by canonical system below

  const handleOpenSquadronRefitModal = (squadron) => {
    const groupId = squadron[0].groupId;
    setSquadronRefitModalSquadron({
      groupId: groupId,
      ships: squadron,
      squadronRefit: squadron[0].squadronRefit // Assuming refit is stored on first ship
    });
    setSquadronRefitModalOpen(true);
  };

  const handleCloseSquadronRefitModal = () => {
    setSquadronRefitModalOpen(false);
    setSquadronRefitModalSquadron(null);
  };

  // Canonical refit handlers
  const handleSelectRefit = (shipIdOrRefit, refitData = null) => {
    console.log('REFIT: Modal selected refit:', (refitData || shipIdOrRefit)?.name);
    
    if (!refitModalShip) {
      console.error('REFIT ERROR: No refitModalShip');
      return;
    }
    
    // Handle both old format (shipId, refit) and new format (refit)
    const refit = refitData || shipIdOrRefit;
    
    // Handle refit removal (clearing)
    if (refit === null) {
      console.log('REFIT: Clearing refit from', refitModalShip.className);
      console.log('REFIT: Current ship state:', {
        hasRefit: !!refitModalShip.refit,
        hasCanonicalRefit: !!refitModalShip.appliedCanonicalRefit,
        currentStats: refitModalShip.statline
      });
      
      // Get original ship definition for stat restoration
      const shipDef = ships[refitModalShip.className];
      if (!shipDef) {
        console.error('REFIT ERROR: Ship definition not found for', refitModalShip.className);
        return;
      }
      
      const originalStatline = shipDef.statline ? { ...shipDef.statline } : {};
      console.log('REFIT: Restoring to original stats:', originalStatline);
      
      // Remove canonical refit and restore original stats
      const clearedShip = {
        ...refitModalShip,
        refit: null,
        appliedCanonicalRefit: null,
        statline: originalStatline,
        // Also clear any other refit-related properties
        capabilities: undefined,
        combatMods: undefined,
        lostKeywords: undefined,
        gainedKeywords: undefined,
        targetProfile: undefined,
        tokens: undefined
      };
      
      console.log('REFIT: Cleared ship state:', {
        hasRefit: !!clearedShip.refit,
        hasCanonicalRefit: !!clearedShip.appliedCanonicalRefit,
        restoredStats: clearedShip.statline
      });
      
      // Update roster with cleared ship
      setRoster(currentRoster => {
        const newRoster = currentRoster.map(ship => 
          ship.id === refitModalShip.id ? clearedShip : ship
        );
        return newRoster;
      });
      
      // Update the modal ship state to reflect the cleared refit
      setRefitModalShip(clearedShip);
      
      console.log('REFIT: Clear completed, modal should stay open');
      // Don't close modal - allow selecting a different refit
      return;
    }
    
    // Check if same refit is already applied
    if (refitModalShip.appliedCanonicalRefit?.name === refit.name) {
      console.log('REFIT: Same refit already applied, ignoring');
      handleCloseRefitModal();
      return;
    }
    

    
    console.log('REFIT: Calling applyCanonicalRefitToShip with:', {
      shipName: refitModalShip.className,
      refitName: refit.name,
      refitId: refit.id
    });
    
    const result = applyCanonicalRefitToShip(refitModalShip, refit, 'capital');
    
    console.log('REFIT: applyCanonicalRefitToShip result:', {
      ok: result.ok,
      hasShip: !!result.ship,
      error: result.error
    });
    
    if (result.ok) {
      console.log('REFIT: Applied successfully to', refitModalShip.className);
      console.log('REFIT: Ship now has appliedCanonicalRefit:', !!result.ship.appliedCanonicalRefit);
      
      // Check if refit has weapon additions to trigger refresh
      const hasWeaponAdditions = refit.selectedOption?.weaponChanges?.add || refit.weaponChanges?.add;
      console.log('REFIT: Has weapon additions:', !!hasWeaponAdditions);
      
      // Update roster with modified ship
      setRoster(currentRoster => {
        const newRoster = currentRoster.map(ship => 
          ship.id === refitModalShip.id ? result.ship : ship
        );
        return newRoster;
      });
      
      // Force refresh of weapon options if refit adds weapons
      if (hasWeaponAdditions) {
        console.log('REFIT: Triggering weapon options refresh');
        setWeaponOptionsRefreshKey(prev => prev + 1);
        // Small delay to ensure state update completes
        setTimeout(() => {
          setWeaponOptionsRefreshKey(prev => prev + 1);
        }, 100);
      }
      
      handleCloseRefitModal();
    } else {
      console.error('REFIT ERROR: Failed to apply:', result.error);
    }
  };



  // Wrapper function to add Micro Hives logic to squadron refit application
  const handleAddRefitToGroup = (groupId, refit, selectedOption) => {
    console.log('🔧 Adding refit to group:', groupId, refit.name);
    
    // Apply the refit manually with ship definition access
    setRoster(currentRoster => {
      const newRoster = currentRoster.map(ship => {
        if (ship.groupId === groupId) {
          // Get ship definition for beginsWith weapons
          const shipDef = ships[ship.className];
          console.log('🔧 SQUADRON_REFIT: Ship def beginsWith:', shipDef?.beginsWith);
          
          // Apply the canonical refit with ship definition
          const result = applyCanonicalRefitToShip(ship, refit, selectedOption, shipDef);
          if (result.success) {
            console.log('🔧 SQUADRON_REFIT: Applied successfully');
            return result.ship;
          } else {
            console.error('Failed to apply squadron refit:', result.error);
            return ship;
          }
        }
        return ship;
      });

      // Handle Micro Hives special logic after normal refit application
      if (faction === 'Insectoids' && refit.name === 'Micro Hives') {
        console.log('🐛 MICRO HIVES: Removing one free Pincer squadron');
        
        // Find a free Pincer squadron to remove (not the one getting the refit)
        const freePincerGroupToRemove = newRoster.find(ship => 
          ship.className === 'Pincer' && 
          ship.isFree === true && 
          ship.groupId !== groupId
        )?.groupId;

        if (freePincerGroupToRemove) {
          console.log('🐛 MICRO HIVES: Removing free Pincer squadron:', freePincerGroupToRemove);
          // Remove all ships from that squadron group
          return newRoster.filter(ship => ship.groupId !== freePincerGroupToRemove);
        } else {
          console.log('🐛 MICRO HIVES: No free Pincer squadrons found to remove');
        }
      }

      return newRoster;
    });
  };

  // Wrapper function to add Micro Hives logic to squadron refit removal
  const handleRemoveRefitFromGroup = (groupId) => {
    console.log('🔧 Removing refit from group:', groupId);
    
    // Check if this group had Micro Hives refit before removing it
    const groupShips = roster.filter(ship => ship.groupId === groupId);
    const hadMicroHives = groupShips.length > 0 && 
                         groupShips[0].appliedCanonicalRefit?.name === 'Micro Hives';
    
    // First remove the refit using the parent function
    removeRefitFromGroup(groupId);
    
    // Then handle Micro Hives special logic
    if (faction === 'Insectoids' && hadMicroHives) {
      console.log('🐛 MICRO HIVES REMOVAL: Adding back one free Pincer squadron');
      
      setRoster(currentRoster => {
        // Add back one free Pincer squadron
        const shipDef = ships['Pincer'];
        if (shipDef) {
          const timestamp = Date.now();
          const newGroupId = `micro-hives-restored-${timestamp}`;
          const squadronSize = 3; // Pincer squadrons are typically 3 ships
          
          const newPincerSquadron = [];
          for (let i = 0; i < squadronSize; i++) {
            newPincerSquadron.push({
              id: `pincer-${timestamp}-${i}`,
              className: 'Pincer',
              groupId: newGroupId,
              isFree: true,
              statline: { ...shipDef.statline },
              loadout: {
                prow: shipDef.prow?.options?.[0] || null, // Default to first prow option
                hull: []
              }
            });
          }
          
          console.log('🐛 MICRO HIVES REMOVAL: Added free Pincer squadron with', squadronSize, 'ships');
          return [...currentRoster, ...newPincerSquadron];
        }
        return currentRoster;
      });
    }
  };

  const handleApplySquadronRefit = (groupId, refit, selectedOption) => {
    handleAddRefitToGroup(groupId, refit, selectedOption);
  };

  const handleClearSquadronRefit = (groupId) => {
    handleRemoveRefitFromGroup(groupId);
  };

  return (
    <>
      {/* Secondary Sticky Navigation */}
      <div className="build-view__secondary-nav">
                <div className="build-view__secondary-nav-content">
          <div className="build-view__secondary-nav-left">
            {/* Name and Faction - Mobile: Stack vertically, Desktop: Inline */}
            <div className="build-view__secondary-nav-name-row">
              {isEditingName ? (
                <ClickAwayListener onClickAway={() => setIsEditingName(false)}>
                  <TextField 
                    value={fleetName}
                    onChange={e => setFleetName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
                    size="small"
                    autoFocus
                    className="build-view__header-fleet-name"
                  />
                </ClickAwayListener>
              ) : (
                <Typography 
                  variant="h4" 
                  className="build-view__fleet-name-display"
                  onClick={() => setIsEditingName(true)}
                >
                  {fleetName}
                </Typography>
              )}
              <Chip 
                label={faction} 
                variant="outlined" 
                size="small"
              />
            </div>
            
            {/* Mobile: Action buttons go in buttons row, Desktop: Inline with name */}
            <div className="build-view__secondary-nav-buttons-row">
              {/* New Fleet and Save Buttons - Symbol Only */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="build-view__icon-button"
                  onClick={startNewFleet}
                  title="New Fleet"
                >
                  <AddIcon fontSize="small" />
                </button>
                
                <button 
                  className={`build-view__icon-button ${saveStatus === 'saved' ? 'build-view__icon-button--saved' : ''}`}
                  onClick={saveFleet}
                  disabled={saveStatus === 'saving' || !user || !fleetName.trim() || roster.length === 0}
                  title={saveStatus === 'saved' ? 'Saved' : 'Save'}
                >
                  {saveStatus === 'saving' ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SaveIcon fontSize="small" />
                  )}
                </button>
              </div>
              
              {/* Build/Play Toggle - Symbol Only */}
              <div className="build-view__mode-toggle">
                <button 
                  className={`build-view__mode-button ${!isPlayMode ? 'build-view__mode-button--active' : ''}`}
                  onClick={() => setIsPlayMode(false)}
                  title="Build Mode"
                >
                  <EditIcon fontSize="small" />
                </button>
                <button 
                  className={`build-view__mode-button ${isPlayMode ? 'build-view__mode-button--active' : ''}`}
                  onClick={() => setIsPlayMode(true)}
                  title="Play Mode"
                >
                  <PlayIcon fontSize="small" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {!user && (
        <div className="build-view__sign-in-container">
          <Button 
            variant="outlined" 
            startIcon={<LoginIcon/>}
            onClick={signInWithGoogle}
            size="small"
          >
            Sign In to Save
          </Button>
        </div>
      )}

      <Grid container spacing={2} className="build-view__main-grid">
        {!isPlayMode && (
        <Grid item xs={12} md={3}>
          <Card><CardContent>
            <FormControl fullWidth size="small" className="build-view__form-control--mb-2">
              <InputLabel>Game Size</InputLabel>
              <Select label="Game Size" value={points} onChange={e=>setPoints(e.target.value)}>
                <MenuItem value={15}>15 pts - Quick Skirmish</MenuItem>
                <MenuItem value={30}>30 pts - Standard Engagement</MenuItem>
                <MenuItem value={45}>45 pts - Large Battle</MenuItem>
                <MenuItem value={60}>60 pts - Epic Battle</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small" className="build-view__form-control--mt-1">
              <InputLabel>Faction</InputLabel>
              <Select label="Faction" value={faction} onChange={e=>{ setFaction(e.target.value); setRoster([]); }}>
                {factions ? Object.keys(factions).filter(f => f !== 'Universal').map(f=> <MenuItem key={f} value={f}>{f}</MenuItem>) : []}
              </Select>
            </FormControl>

            <Divider className="build-view__divider--my-2"/>
            <Typography variant="subtitle1" className="build-view__section-title--bold">Add Ships</Typography>
            <Stack spacing={1}>
              {Object.entries(ships).map(([cls,def])=> {
                // Create tooltip content with ship stats
                const statsTooltip = def.statline ? 
                  Object.entries(def.statline)
                    .map(([statName, value]) => `${getStatDisplayName(statName)}: ${value}`)
                    .join(' • ') : 
                  'No stats available';
                
                return (
                <Paper key={cls} variant="outlined" className="build-view__ship-paper">
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <MuiTooltip title={statsTooltip} arrow>
                      <Box className="build-view__tooltip-box">
                        <Typography variant="subtitle2" className="build-view__ship-name">{cls}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {def.squadron ? (
                            faction === "Insectoids" && cls === "Pincer" ? 
                              `Squadron • 1pt x 3 (+3 free)` :
                              `Squadron • ${getShipCost(faction, { ...def, className: cls }, roster)}pt x 3`
                          ) : (
                            `${def.size} • ${getShipCost(faction, { ...def, className: cls }, roster)} pts`
                          )}
                        </Typography>
                      </Box>
                    </MuiTooltip>
                    <Button 
                      size="small" 
                      variant="contained" 
                      onClick={()=>addShip(cls)}
                      sx={{ minWidth: 'auto', width: 32, height: 32, p: 0 }}
                    >
                      <AddIcon fontSize="small" />
                    </Button>
                  </Stack>
                </Paper>
                );
              })}
            </Stack>
            <Divider className="build-view__divider--my-1"/>
            <Typography>Total: {used}/{cap} pts</Typography>
            {cap !== points && (
              <Typography variant="caption" color="text.secondary" className="build-view__caption-block">
                {cap < points ? `Reduced from ${points} pts (Few in Number)` : `Increased from ${points} pts (${factions ? getSpecialRules(faction, factions).find(r => r.name === "Wealthy" || r.name === "Industrious")?.name : ""})`}
              </Typography>
            )}
            {useRefits && (
              <Typography variant="caption" color="text.secondary" className="build-view__caption-block">
                Refits: {usedRefits}/{maxRefits} used
              </Typography>
            )}
            {uniqueClash && <Alert severity="warning" className="build-view__alert--mt-1">Unique rule: two non‑squadron ships are armed identically. Change a prow or hull mix.</Alert>}
            
            {/* Content Toggles - HIDDEN */}
            {/*
            <Divider className="build-view__divider--my-2"/>
            <Typography variant="subtitle2" className="build-view__toggle-section-title">
              Additional Content
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useRefits}
                    onChange={(e) => setUseRefits(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" className="build-view__toggle-label">
                    Use Refits
                  </Typography>
                }
                className={`build-view__form-control-label ${useRefits ? 'build-view__form-control-label--active' : ''}`}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={useJuggernauts}
                    onChange={(e) => setUseJuggernauts(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" className="build-view__toggle-label">
                    Use Juggernauts
                  </Typography>
                }
                className={`build-view__form-control-label ${useJuggernauts ? 'build-view__form-control-label--active' : ''}`}
              />
            </Stack>
            */}
          </CardContent></Card>
        </Grid>
        )}

        <Grid item xs={12} md={isPlayMode ? 12 : 9}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
                  {factions && getFluff(faction, factions) && (
                <Accordion disableGutters className="build-view__accordion--mb-1">
                  <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant="subtitle2" className="build-view__accordion-title">Faction Overview</Typography>
                  </AccordionSummary>
                  <AccordionDetails className="build-view__accordion-details">
                    <Paper variant="outlined" className="build-view__fluff-paper">
                      <Typography variant="body2" color="text.secondary">{getFluff(faction, factions)}</Typography>
                    </Paper>
                  </AccordionDetails>
                </Accordion>
                  )}

              <Accordion disableGutters className="build-view__accordion--mb-1" defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                  <Typography variant="subtitle2" className="build-view__accordion-title">Special Rules</Typography>
                    </AccordionSummary>
                <AccordionDetails className="build-view__accordion-details">
                      {getSpecialRules(faction, factions).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">None listed.</Typography>
                      ) : (
                        <Stack spacing={0.75}>
                          {getSpecialRules(faction, factions).map((r, i)=>(
                        <Paper key={i} variant="outlined" className="build-view__rule-paper">
                          <Typography variant="body2" className="build-view__rule-name">{r.name}</Typography>
                          <Typography variant="body2" color="text.secondary" className="build-view__rule-description">{r.description}</Typography>
                            </Paper>
                          ))}
                        </Stack>
                      )}
                    </AccordionDetails>
                  </Accordion>

                  <Accordion disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                  <Typography variant="subtitle2" className="build-view__accordion-title">Command Abilities</Typography>
                    </AccordionSummary>
                <AccordionDetails className="build-view__accordion-details">
                      {getCommandAbilities(faction, factions).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">None listed.</Typography>
                      ) : (
                        <Grid container spacing={1}>
                          {getCommandAbilities(faction, factions).sort((a,b)=>a.dice-b.dice).map((c, i)=>(
                            <Grid key={i} item xs={12} sm={6} lg={4}>
                          <Paper variant="outlined" className="build-view__ability-paper">
                                <Stack direction="row" spacing={1} alignItems="stretch">
                              <Box className="build-view__ability-dice-container">
                                    <DiceFace value={c.dice} size={32} />
                                  </Box>
                              <Stack className="build-view__ability-content">
                                <Typography variant="body2" className="build-view__ability-name">{c.name}</Typography>
                                <Typography variant="body2" color="text.secondary" className="build-view__ability-description">{c.description}</Typography>
                                  </Stack>
                                </Stack>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </AccordionDetails>
                  </Accordion>
            </Grid>
            
            {/* Ship Cards */}
            {(() => {
              // Group squadron ships together, show individual ships separately
              const processedGroups = new Set();
              const cards = [];
              
              roster.forEach(s => {
                const def = ships[s.className];
                
                if (def.squadron && s.groupId && !processedGroups.has(s.groupId)) {
                  // Handle squadron as a group
                  processedGroups.add(s.groupId);
                  const squadronShips = roster.filter(ship => ship.groupId === s.groupId);
                  
                  cards.push(
                    <Grid key={s.groupId} item xs={12} md={6} lg={4}>
                      <BuildViewCard
                        squadron={squadronShips}
                        shipDef={def}
                        faction={faction}
                        onDuplicateGroup={duplicateGroup}
                        onRemoveGroup={removeGroup}
                        onSelectAdvancementWeapon={selectAdvancementWeapon}
                        isPlayMode={isPlayMode}
                        onSelectWeapon={(location, weaponOption) => {
                          // For squadrons, apply weapon selection to the first available ship
                          const targetShip = squadronShips.find(ship => {
                            if (location === 'prow') {
                              return !ship.loadout.prow || ship.loadout.prow.name !== weaponOption?.name;
                            }
                            return true;
                          }) || squadronShips[0];
                          
                          if (location === 'prow') {
                            pickProw(targetShip.id, weaponOption);
                          }
                        }}
                        onAddWeapon={(location, weaponName) => {
                          // For squadrons, add weapon to the first available ship
                          const targetShip = squadronShips[0];
                          if (location === 'hull') {
                            // Add hull weapon to squadron (multi-select) - same logic as prow
                            const updatedShip = { ...targetShip };
                            if (!updatedShip.loadout.hull) {
                              updatedShip.loadout.hull = [];
                            }
                            updatedShip.loadout.hull.push(weaponName);
                            
                            // Update the roster
                            setRoster(prevRoster => 
                              prevRoster.map(ship => 
                                ship.id === targetShip.id ? updatedShip : ship
                              )
                            );
                          } else if (location === 'prow') {
                            // Add prow weapon to squadron (multi-select)
                            const updatedShip = { ...targetShip };
                            if (!updatedShip.loadout.prow) {
                              updatedShip.loadout.prow = [];
                            }
                            updatedShip.loadout.prow.push(weaponName);
                            
                            // Update the roster
                            setRoster(prevRoster => 
                              prevRoster.map(ship => 
                                ship.id === targetShip.id ? updatedShip : ship
                              )
                            );
                          }
                        }}
                        onRemoveWeapon={(location, weaponName) => {
                          // For squadrons, remove weapon from the ship that has it
                          if (location === 'hull') {
                            // Remove hull weapon from squadron (multi-select) - same logic as prow
                            const targetShip = squadronShips.find(ship => 
                              ship.loadout.hull && ship.loadout.hull.some(h => 
                                (typeof h === 'string' ? h : h.name) === weaponName
                              )
                            ) || squadronShips[0];
                            
                            const updatedShip = { ...targetShip };
                            if (updatedShip.loadout.hull) {
                              const index = updatedShip.loadout.hull.findIndex(h => 
                                (typeof h === 'string' ? h : h.name) === weaponName
                              );
                              if (index !== -1) {
                                updatedShip.loadout.hull.splice(index, 1);
                              }
                            }
                            
                            // Update the roster
                            setRoster(prevRoster => 
                              prevRoster.map(ship => 
                                ship.id === targetShip.id ? updatedShip : ship
                              )
                            );
                          } else if (location === 'prow') {
                            // Remove prow weapon from squadron (multi-select)
                            const targetShip = squadronShips.find(ship => 
                              ship.loadout.prow && ship.loadout.prow.some(p => 
                                (typeof p === 'string' ? p : p.name) === weaponName
                              )
                            ) || squadronShips[0];
                            
                            const updatedShip = { ...targetShip };
                            if (updatedShip.loadout.prow) {
                              const index = updatedShip.loadout.prow.findIndex(p => 
                                (typeof p === 'string' ? p : p.name) === weaponName
                              );
                              if (index !== -1) {
                                updatedShip.loadout.prow.splice(index, 1);
                              }
                            }
                            
                            // Update the roster
                            setRoster(prevRoster => 
                              prevRoster.map(ship => 
                                ship.id === targetShip.id ? updatedShip : ship
                              )
                            );
                          }
                        }}
                      >
                        {/* Squadron weapon selection content */}
                        <Grid container spacing={2}>
                          {/* Begins with weapons section */}
                          {((squadronShips[0]?.beginsWith && squadronShips[0].beginsWith.length > 0) || (def.beginsWith && def.beginsWith.length > 0)) && (
                          <Grid item xs={12}>
                              <BeginsWithSection 
                                beginsWith={squadronShips[0]?.beginsWith || def.beginsWith}
                                squadronRefit={squadronShips[0]?.squadronRefit}
                                getWeaponData={getWeaponDataByIndex}
                                shipDef={def}
                                isPlayMode={isPlayMode}
                              />
                        </Grid>
                        )}


                        </Grid>

                        {/* Squadron Refit Button - only when squadron refits are enabled */}
                        {useRefits && (
                          <Grid item xs={12}>
                            <Paper variant="outlined" className="build-view__refit-paper">
                              <Box className="build-view__refit-header">
                                <Box>
                                  <Typography variant="subtitle2" className="build-view__refit-title">
                                    Squadron Refit
                                  </Typography>
                                  {squadronShips[0].squadronRefit ? (
                                    <Typography variant="caption" color="text.secondary">
                                      {squadronShips[0].squadronRefit.name}
                                      {squadronShips[0].squadronRefit.selectedOption && (
                                        <> - {squadronShips[0].squadronRefit.selectedOption}</>
                                      )}
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">
                                      No refit selected
                                    </Typography>
                                  )}
                                </Box>
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => {

                                      handleOpenSquadronRefitModal(squadronShips);
                                    }}
                                    className="build-view__refit-button"
                                  >
                                    {squadronShips[0].squadronRefit ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                                  </Button>
                                  {squadronShips[0].squadronRefit && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      onClick={() => handleClearSquadronRefit(squadronShips[0].groupId)}
                                      className="build-view__refit-button build-view__refit-button--error"
                                    >
                                      <CloseIcon fontSize="small" />
                                    </Button>
                                  )}
                                </Stack>
                              </Box>
                            </Paper>
                          </Grid>
                        )}
                      </BuildViewCard>
                    </Grid>
                  );
                } else if (!def.squadron) {
                  // Handle individual ships (non-squadron)
                  cards.push(
                    <Grid key={s.id} item xs={12} md={6} lg={4}>
                      <BuildViewCard
                        ship={s}
                        shipDef={def}
                        faction={faction}
                        onRemoveShip={removeShip}
                        onRemoveGroup={removeGroup}
                        onSelectAdvancementWeapon={selectAdvancementWeapon}
                        onSelectWeapon={(location, weaponOption) => {
                          // Handle weapon selection (prow and single-slot hull)
                          if (location === 'prow') {
                            pickProw(s.id, weaponOption);
                          } else if (location === 'hull') {
                            // Handle single-select hull weapons (when effective slots = 1)
                            if (weaponOption === null) {
                              // Clear hull selection
                              // Remove all hull weapons first
                              const currentHull = s.loadout?.hull || [];
                              currentHull.forEach(weapon => {
                                const weaponName = typeof weapon === 'string' ? weapon : weapon.name;
                                removeHullByName(s.id, weaponName, def);
                              });
                            } else {
                              // Clear existing hull selection and add new one
                              const currentHull = s.loadout?.hull || [];
                              currentHull.forEach(weapon => {
                                const weaponName = typeof weapon === 'string' ? weapon : weapon.name;
                                removeHullByName(s.id, weaponName, def);
                              });
                              // Add the new weapon
                              addHull(s.id, weaponOption.name, def);
                            }
                          }
                        }}
                        onAddWeapon={(location, weaponName) => {
                          // Handle adding weapon (hull and prow allow multiple)
                          if (location === 'hull') {
                            addHull(s.id, weaponName, def);
                          } else if (location === 'prow') {
                            // Add prow weapon to individual ship (multi-select)
                            const updatedShip = { ...s };
                            if (!updatedShip.loadout.prow) {
                              updatedShip.loadout.prow = [];
                            }
                            updatedShip.loadout.prow.push(weaponName);
                            
                            // Update the roster
                            setRoster(prevRoster => 
                              prevRoster.map(ship => 
                                ship.id === s.id ? updatedShip : ship
                              )
                            );
                          }
                        }}
                        onRemoveWeapon={(location, weaponName) => {
                          // Handle removing weapon (hull and prow allow multiple)
                          if (location === 'hull') {
                            removeHullByName(s.id, weaponName, def);
                          } else if (location === 'prow') {
                            // Remove prow weapon from individual ship (multi-select)
                            const updatedShip = { ...s };
                            if (updatedShip.loadout.prow) {
                              const index = updatedShip.loadout.prow.findIndex(p => 
                                (typeof p === 'string' ? p : p.name) === weaponName
                              );
                              if (index !== -1) {
                                updatedShip.loadout.prow.splice(index, 1);
                              }
                            }
                            
                            // Update the roster
                            setRoster(prevRoster => 
                              prevRoster.map(ship => 
                                ship.id === s.id ? updatedShip : ship
                              )
                            );
                          }
                        }}
                        isPlayMode={isPlayMode}
                      />
                    </Grid>
                  );
                }
              });
              
              return cards;
            })()}
          </Grid>
        </Grid>
      </Grid>
      


      {/* Refit Modal */}
      <RefitModal
        open={refitModalOpen && !!refitModalShip}
        onClose={handleCloseRefitModal}
        ship={refitModalShip ? roster.find(s => s.id === refitModalShip.id) || refitModalShip : null}
        shipDef={refitModalShip ? ships[refitModalShip.className] : null}
        faction={faction}
        factions={factions}
        refits={refits}
        onSelectRefit={handleSelectRefit}
        usedRefits={usedRefits}
        maxRefits={maxRefits}
      />

      {/* Squadron Refit Modal */}
      <RefitModal
        open={squadronRefitModalOpen && !!squadronRefitModalSquadron}
        onClose={handleCloseSquadronRefitModal}
        squadron={useMemo(() => 
          squadronRefitModalSquadron ? roster.filter(ship => ship.groupId === squadronRefitModalSquadron.groupId) : null, 
          [squadronRefitModalSquadron, roster]
        )}
        shipDef={squadronRefitModalSquadron ? ships[roster.find(ship => ship.groupId === squadronRefitModalSquadron.groupId)?.className] : null}
        faction={faction}
        factions={factions}
        refits={refits}
        onApplyRefit={handleApplySquadronRefit}
        onClearRefit={handleClearSquadronRefit}
      />
    </>
  );
};

export default BuildView;