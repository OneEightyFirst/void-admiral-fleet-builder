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
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Remove as RemoveIcon,
  Add as PlusIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import DiceFace from './DiceFace';
import { ProwIcon, HullIcon } from './WeaponIcons';
import BuildViewCard from './BuildViewCard';
import BuildViewSquadronCard from './BuildViewSquadronCard';
import RefitModal from './RefitModal';
import SquadronRefitModal from './SquadronRefitModal';
import BeginsWithSection from './shared/BeginsWithSection';
import {
  getFluff,
  getSpecialRules,
  getCommandAbilities,
  getShipCost,
  getStatDisplayName,
  hasUnplannedConstruction,
  calculateAvailableHullSlots,
  calculateEffectiveHullSlots,
  calculateUsedHullSlots
} from '../utils/gameUtils';

// Import canonical refit functions
import {
  getCanonicalWeaponData as getWeaponData,
  getCanonicalModifiedWeaponOptions as getModifiedWeaponOptions,
  getRefitSlotWeapons
} from '../utils/refits/weaponData.js';

import {
  applyCanonicalRefitToShip,
  canApplyCanonicalRefit,
  removeRefitFromShip,
  getAvailableRefits
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
  addRefit,
  removeRefit,
  addRefitToGroup,
  removeRefitFromGroup,
  saveFleet,
  startNewFleet,
  signInWithGoogle
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
          console.log('🔧 AUTO-SELECT: Auto-selecting prow weapon:', modifiedProwOptions[0].name, 'for ship:', ship.id);
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
          console.log('🔧 AUTO-SELECT: Auto-selecting hull weapon:', modifiedHullOptions[0].name, 'for ship:', ship.id);
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
    

    
    const result = applyCanonicalRefitToShip(refitModalShip, refit, 'capital');
    
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
      {/* Fleet Name Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isEditingName ? (
            <ClickAwayListener onClickAway={() => setIsEditingName(false)}>
              <TextField 
                value={fleetName}
                onChange={e => setFleetName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
                size="small"
                autoFocus
                sx={{ '& .MuiInputBase-root': { fontSize: '1.5rem', fontWeight: 700 } }}
              />
            </ClickAwayListener>
          ) : (
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: 'white', 
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
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
        </Box>
        
        {/* New Fleet Button */}
        <Button 
          variant="outlined" 
          onClick={startNewFleet}
          size="small"
          sx={{ 
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(25, 118, 210, 0.08)'
            }
          }}
        >
          New Fleet
        </Button>
      </Box>
      
      {!user && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Button 
            variant="outlined" 
            startIcon={<LoginIcon/>}
            onClick={signInWithGoogle}
            size="small"
          >
            Sign In to Save
          </Button>
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card><CardContent>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Game Size</InputLabel>
              <Select label="Game Size" value={points} onChange={e=>setPoints(e.target.value)}>
                <MenuItem value={15}>15 pts - Quick Skirmish</MenuItem>
                <MenuItem value={30}>30 pts - Standard Engagement</MenuItem>
                <MenuItem value={45}>45 pts - Large Battle</MenuItem>
                <MenuItem value={60}>60 pts - Epic Battle</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small" sx={{ mt:1 }}>
              <InputLabel>Faction</InputLabel>
              <Select label="Faction" value={faction} onChange={e=>{ setFaction(e.target.value); setRoster([]); }}>
                {factions ? Object.keys(factions).filter(f => f !== 'Universal').map(f=> <MenuItem key={f} value={f}>{f}</MenuItem>) : []}
              </Select>
            </FormControl>

            <Divider sx={{ my:2 }}/>
            <Typography variant="subtitle1" sx={{ fontWeight:800, mb:1 }}>Add Ships</Typography>
            <Stack spacing={1}>
              {Object.entries(ships).map(([cls,def])=> {
                // Create tooltip content with ship stats
                const statsTooltip = def.statline ? 
                  Object.entries(def.statline)
                    .map(([statName, value]) => `${getStatDisplayName(statName)}: ${value}`)
                    .join(' • ') : 
                  'No stats available';
                
                return (
                <Paper key={cls} variant="outlined" sx={{ p:1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <MuiTooltip title={statsTooltip} arrow>
                      <Box sx={{ cursor: 'help' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight:700 }}>{cls}</Typography>
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
                    <Button size="small" variant="contained" startIcon={<AddIcon/>} onClick={()=>addShip(cls)}>Add</Button>
                  </Stack>
                </Paper>
                );
              })}
            </Stack>
            <Divider sx={{ my:1 }}/>
            <Typography>Total: {used}/{cap} pts</Typography>
            {cap !== points && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {cap < points ? `Reduced from ${points} pts (Few in Number)` : `Increased from ${points} pts (${factions ? getSpecialRules(faction, factions).find(r => r.name === "Wealthy" || r.name === "Industrious")?.name : ""})`}
              </Typography>
            )}
            {useRefits && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Refits: {usedRefits}/{maxRefits} used
              </Typography>
            )}
            {uniqueClash && <Alert severity="warning" sx={{ mt:1 }}>Unique rule: two non‑squadron ships are armed identically. Change a prow or hull mix.</Alert>}
            
            {/* Content Toggles */}
            <Divider sx={{ my: 2 }}/>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
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
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Use Refits
                  </Typography>
                }
                sx={{ 
                  margin: 0,
                  '& .MuiFormControlLabel-label': {
                    color: useRefits ? 'primary.main' : 'text.secondary'
                  }
                }}
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
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Use Juggernauts
                  </Typography>
                }
                sx={{ 
                  margin: 0,
                  '& .MuiFormControlLabel-label': {
                    color: useJuggernauts ? 'primary.main' : 'text.secondary'
                  }
                }}
              />
            </Stack>
          </CardContent></Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight:800, mb:1 }}>Faction Overview</Typography>

                  {factions && getFluff(faction, factions) && (
                    <Paper variant="outlined" sx={{ p:1, mb:1 }}>
                      <Typography variant="body2" color="text.secondary">{getFluff(faction, factions)}</Typography>
                    </Paper>
                  )}

                  <Accordion disableGutters sx={{ mb:1 }} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                      <Typography variant="subtitle2" sx={{ fontWeight:800 }}>Special Rules</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt:0 }}>
                      {getSpecialRules(faction, factions).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">None listed.</Typography>
                      ) : (
                        <Stack spacing={0.75}>
                          {getSpecialRules(faction, factions).map((r, i)=>(
                            <Paper key={i} variant="outlined" sx={{ p:1 }}>
                              <Typography variant="body2" sx={{ fontWeight:700 }}>{r.name}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt:0.5 }}>{r.description}</Typography>
                            </Paper>
                          ))}
                        </Stack>
                      )}
                    </AccordionDetails>
                  </Accordion>

                  <Accordion disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                      <Typography variant="subtitle2" sx={{ fontWeight:800 }}>Command Abilities</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt:0 }}>
                      {getCommandAbilities(faction, factions).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">None listed.</Typography>
                      ) : (
                        <Grid container spacing={1}>
                          {getCommandAbilities(faction, factions).sort((a,b)=>a.dice-b.dice).map((c, i)=>(
                            <Grid key={i} item xs={12} sm={6} lg={4}>
                              <Paper variant="outlined" sx={{ p:1, height: '100%' }}>
                                <Stack direction="row" spacing={1} alignItems="stretch">
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <DiceFace value={c.dice} size={32} />
                                  </Box>
                                  <Stack sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight:700 }}>{c.name}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt:0.5 }}>{c.description}</Typography>
                                  </Stack>
                                </Stack>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
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
                      <BuildViewSquadronCard
                        squadron={squadronShips}
                        shipDef={def}
                        faction={faction}
                        onDuplicateGroup={duplicateGroup}
                        onRemoveGroup={removeGroup}
                      >
                        {/* Squadron weapon selection content */}
                        <Grid container spacing={2}>
                          {/* Begins with weapons section */}
                          {((squadronShips[0]?.beginsWith && squadronShips[0].beginsWith.length > 0) || (def.beginsWith && def.beginsWith.length > 0)) && (
                            <Grid item xs={12}>
                              <BeginsWithSection 
                                beginsWith={squadronShips[0]?.beginsWith || def.beginsWith}
                                squadronRefit={squadronShips[0]?.squadronRefit}
                                getWeaponData={getWeaponData}
                              />
                            </Grid>
                          )}

                          {/* Individual ships in squadron */}
                          {squadronShips.map((squadShip, idx) => (
                            <Grid key={squadShip.id} item xs={12}>
                              <Paper variant="outlined" sx={{ p:1, mb:1 }}>
                                {/* Prow weapons for this ship */}
                                {def.prow.select > 0 && def.prow.options.length > 0 && (
                                  <Box sx={{ mb:1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                      <Box sx={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        border: '2px solid white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                      }}>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontWeight: 700,
                                            fontSize: '0.7rem',
                                            lineHeight: 1
                                          }}
                                        >
                                          {idx + 1}
                                        </Typography>
                                      </Box>
                                      <Typography variant="caption" sx={{ fontWeight:700 }}>Ship</Typography>
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>|</Typography>
                                      <ProwIcon size={14} />
                                      <Typography variant="caption" sx={{ fontWeight:700 }}>Prow — Select {def.prow.select}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                      {getModifiedWeaponOptions(def.prow.options, squadShip, 'prow').map(o=> {
                                        const selected = squadShip.loadout.prow?.name === o.name;
                                        return (
                                          <MuiTooltip key={o.name} title={`Targets: ${getWeaponData(o, [], squadShip).targets||"—"} • Attacks: ${getWeaponData(o, [], squadShip).attacks??"—"} • Range: ${getWeaponData(o, [], squadShip).range||"—"}`} arrow>
                                            <Chip clickable color={selected?"primary":"default"} onClick={()=>pickProw(squadShip.id, o)} label={o.name} />
                                          </MuiTooltip>
                                        );
                                      })}
                                    </Box>
                                  </Box>
                                )}

                                {/* Hull weapons for this ship */}
                                {(() => {
                                  const effectiveSlots = calculateEffectiveHullSlots(squadShip, def);
                                  return effectiveSlots > 0;
                                })() && (
                                  <Box>
                                    {(() => {
                                      const effectiveSlots = calculateEffectiveHullSlots(squadShip, def);
                                      return effectiveSlots > 0;
                                    })() && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <Box sx={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: '50%',
                                          border: '2px solid white',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0
                                        }}>
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              fontWeight: 700,
                                              fontSize: '0.7rem',
                                              lineHeight: 1
                                            }}
                                          >
                                            {idx + 1}
                                          </Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ fontWeight:700 }}>Ship</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>|</Typography>
                                        <HullIcon size={14} />
                                        <Typography variant="caption" sx={{ fontWeight:700 }}>Hull — Select {calculateEffectiveHullSlots(squadShip, def)} (mix allowed)</Typography>
                                      </Box>
                                    )}
                                    {hasUnplannedConstruction(faction, factions) && squadShip.loadout.isRandomized ? (
                                      <Alert severity="info" sx={{ mb: 1 }}>
                                        Weapons randomly assigned at game start. Hull selection disabled.
                                      </Alert>
                                    ) : (
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {/* Show selectable hull options */}
                                        {getModifiedWeaponOptions(def.hull.options, squadShip, 'hull').map(o=> {
                                          const currentCount = (squadShip.loadout.hull||[]).filter(name => name === o.name).length;
                                          const totalEditable = (squadShip.loadout.hull || []).filter(n=>!(def.beginsWith||[]).some(b=>b.name===n)).length;
                                          const effectiveSlots = calculateEffectiveHullSlots(squadShip, def);
                                          const canAdd = totalEditable < effectiveSlots && !o.addedByRefit; // Can't add refit weapons manually
                                          const canRemove = currentCount > 0 && !o.addedByRefit; // Can't remove refit weapons
                                          const isAtLimit = totalEditable >= effectiveSlots;
                                          const hasSelection = currentCount > 0;
                                          const shouldHighlight = isAtLimit && hasSelection;
                                          const isRefitWeapon = o.addedByRefit;
                                          
                                          return (
                                            <MuiTooltip key={o.name} title={`Targets: ${getWeaponData(o, [], squadShip).targets||"—"} • Attacks: ${getWeaponData(o, [], squadShip).attacks??"—"} • Range: ${getWeaponData(o, [], squadShip).range||"—"}`} arrow>
                                              <Chip 
                                                color={isRefitWeapon ? "warning" : (shouldHighlight ? "primary" : "default")}
                                                sx={{ 
                                                  '& .MuiChip-label': { 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: 0.5,
                                                    px: 1
                                                  },
                                                  ...(isRefitWeapon && {
                                                    border: '2px solid #ffc107',
                                                    backgroundColor: 'rgba(255, 193, 7, 0.1)'
                                                  })
                                                }}
                                                label={
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography variant="caption">
                                                      {o.name} {isRefitWeapon && '(Refit)'}
                                                    </Typography>
                                                    {!isRefitWeapon && (
                                                      <>
                                                        <IconButton 
                                                          size="small" 
                                                          disabled={!canRemove}
                                                          onClick={(e)=> {
                                                            e.stopPropagation();
                                                            removeHullByName(squadShip.id, o.name, def);
                                                          }}
                                                          sx={{ p: 0.25, minWidth: 'auto', color: 'inherit' }}
                                                        >
                                                          <RemoveIcon fontSize="small" />
                                                        </IconButton>
                                                        <Typography variant="body2" sx={{ minWidth: 16, textAlign: 'center', fontSize: '0.75rem' }}>
                                                          {currentCount}
                                                        </Typography>
                                                        <IconButton 
                                                          size="small" 
                                                          disabled={!canAdd}
                                                          onClick={(e)=> {
                                                            e.stopPropagation();
                                                            addHull(squadShip.id, o.name, def);
                                                          }}
                                                          sx={{ p: 0.25, minWidth: 'auto', color: 'inherit' }}
                                                        >
                                                          <PlusIcon fontSize="small" />
                                                        </IconButton>
                                                      </>
                                                    )}
                                                    {isRefitWeapon && (
                                                      <Typography variant="body2" sx={{ minWidth: 16, textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                        1
                                                      </Typography>
                                                    )}
                                                  </Box>
                                                }
                                              />
                                            </MuiTooltip>
                                          );
                                        })}
                                      </Box>
                                    )}
                                    {(() => {
                                      const editableCount = (squadShip.loadout.hull||[]).filter(n=>!(def.beginsWith||[]).some(b=>b.name===n)).length;
                                      // Account for hull weapon slots consumed by refits
                                      const refitHullCost = squadShip.refit?.cost?.hull_weapons ? parseInt(squadShip.refit.cost.hull_weapons.replace('-', '')) : 0;
                                      const effectiveSlots = def.hull.select - refitHullCost;
                                      return editableCount < effectiveSlots && <Alert severity="info" sx={{ mt:1 }}>Choose {effectiveSlots - editableCount} more hull weapon(s).</Alert>;
                                    })()}
                                  </Box>
                                )}
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>

                        {/* Squadron Refit Button - only when squadron refits are enabled */}
                        {useRefits && (
                          <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
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
                                    sx={{
                                      minWidth: 'auto',
                                      width: 40,
                                      height: 40
                                    }}
                                  >
                                    {squadronShips[0].squadronRefit ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                                  </Button>
                                  {squadronShips[0].squadronRefit && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      onClick={() => handleClearSquadronRefit(squadronShips[0].groupId)}
                                      sx={{
                                        minWidth: 'auto',
                                        width: 40,
                                        height: 40
                                      }}
                                    >
                                      <CloseIcon fontSize="small" />
                                    </Button>
                                  )}
                                </Stack>
                              </Box>
                            </Paper>
                          </Grid>
                        )}
                      </BuildViewSquadronCard>
                    </Grid>
                  );
                } else if (!def.squadron) {
                  // Handle individual ships (non-squadron)
                  const editableCount = (s.loadout.hull||[]).filter(n=>!(def.beginsWith||[]).some(b=>b.name===n)).length;
                  cards.push(
                    <Grid key={s.id} item xs={12} md={6} lg={4}>
                      <BuildViewCard
                        ship={s}
                        shipDef={def}
                        faction={faction}
                        onRemoveShip={removeShip}
                        onRemoveGroup={removeGroup}
                      >
                        {/* Weapon selection content */}
                        <Grid container spacing={2}>


                        <Grid item xs={12}>
                          {def.prow.select > 0 && def.prow.options.length > 0 && (
                          <Paper variant="outlined" sx={{ p:1, mb:1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <ProwIcon size={16} />
                              <Typography variant="subtitle2" sx={{ fontWeight:800 }}>Prow — Select {def.prow.select}</Typography>
                            </Box>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {getModifiedWeaponOptions(def.prow.options, s, 'prow').map(o=> {
                                const selected = s.loadout.prow?.name === o.name;
                                console.log('TOOLTIP: Ship', s.id, 'has refit:', !!s.appliedCanonicalRefit);
                                const weaponData = getWeaponData(o, [], s);
                                return (
                                  <MuiTooltip key={o.name} title={`Targets: ${weaponData.targets||"—"} • Attacks: ${weaponData.attacks??"—"} • Range: ${weaponData.range||"—"}`} arrow>
                                    <Chip clickable color={selected?"primary":"default"} onClick={()=>pickProw(s.id, o)} label={o.name} />
                                  </MuiTooltip>
                                );
                              })}
                              </Box>
                            {!s.loadout.prow && <Alert severity="info" sx={{ mt:1 }}>Pick {def.prow.select} prow option.</Alert>}
                          </Paper>
                          )}

                          {(() => {
                            const effectiveSlots = calculateEffectiveHullSlots(s, def);
                            return (effectiveSlots > 0 || (def.beginsWith && def.beginsWith.length > 0));
                          })() && (
                          <Paper variant="outlined" sx={{ p:1 }}>
                              {(() => {
                                const effectiveSlots = calculateEffectiveHullSlots(s, def);
                                return effectiveSlots > 0;
                              })() && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <HullIcon size={16} />
                              <Typography variant="subtitle2" sx={{ fontWeight:800 }}>Hull — Select {calculateEffectiveHullSlots(s, def)} (mix allowed)</Typography>
                            </Box>
                              )}
                              {def.randomizeHull && (
                                <Stack direction="row" spacing={1} sx={{ mb: 1, mt: 0.5 }}>
                                  <Alert severity="info" sx={{ py: 0 }}>
                                    Scrap Bots: randomly select {def.hull.select} hull weapon(s).
                                  </Alert>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => randomizeHull(s.id, def)}
                                  >
                                    Randomize
                                  </Button>
                            </Stack>
                              )}
                              {hasUnplannedConstruction(faction, factions) && s.loadout.isRandomized ? (
                                <Alert severity="info" sx={{ mb: 1 }}>
                                  Weapons randomly assigned at game start. Hull selection disabled.
                                </Alert>
                              ) : (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {/* Show beginsWith weapons with selected styling first */}
                                  {(def.beginsWith || []).map(o => {
                                    const currentCount = (s.loadout.hull||[]).filter(name => name === o.name).length;
                                    
                                    return (
                                      <MuiTooltip key={`begins-${o.name}`} title={`Targets: ${getWeaponData(o, [], s).targets||"—"} • Attacks: ${getWeaponData(o, [], s).attacks??"—"} • Range: ${getWeaponData(o, [], s).range||"—"}`} arrow>
                                        <Chip 
                                          color="primary"
                                          sx={{ 
                                            '& .MuiChip-label': { 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: 0.5,
                                              px: 1
                                            } 
                                          }}
                                          label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                              <Typography variant="caption">
                                                {o.name}
                                              </Typography>
                                              {currentCount > 1 && (
                                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                  x{currentCount}
                                                </Typography>
                                              )}
                                            </Box>
                                          }
                                        />
                                      </MuiTooltip>
                                    );
                                  })}
                                  
                                  {/* Show selectable hull options */}
                                  {getModifiedWeaponOptions(def.hull.options, s, 'hull').map((o, index) => {
                                    const currentCount = (s.loadout.hull||[]).filter(name => name === o.name).length;
                                    const totalEditable = (s.loadout.hull || []).filter(n=>!(def.beginsWith||[]).some(b=>b.name===n)).length;
                                    const effectiveSlots = calculateEffectiveHullSlots(s, def);
                                    const canAdd = totalEditable < effectiveSlots && !o.addedByRefit; // Can't add refit weapons manually
                                    const canRemove = currentCount > 0 && !o.addedByRefit; // Can't remove refit weapons
                                    const isAtLimit = totalEditable >= effectiveSlots;
                                    const hasSelection = currentCount > 0;
                                    const shouldHighlight = isAtLimit && hasSelection;
                                    const isRefitWeapon = o.addedByRefit;
                                    
                                return (
                                      <MuiTooltip key={`${o.name}-${weaponOptionsRefreshKey}-${index}`} title={`Targets: ${getWeaponData(o, [], s).targets||"—"} • Attacks: ${getWeaponData(o, [], s).attacks??"—"} • Range: ${getWeaponData(o, [], s).range||"—"}`} arrow>
                                        <Chip 
                                          color={isRefitWeapon ? "warning" : (shouldHighlight ? "primary" : "default")}
                                          sx={{ 
                                            '& .MuiChip-label': { 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: 0.5,
                                              px: 1
                                            },
                                            ...(isRefitWeapon && {
                                              border: '2px solid #ffc107',
                                              backgroundColor: 'rgba(255, 193, 7, 0.1)'
                                            })
                                          }}
                                          label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                              <Typography variant="caption">
                                                {o.name} {isRefitWeapon && '(Refit)'}
                                              </Typography>
                                              {!isRefitWeapon && (
                                                <>
                                                  <IconButton 
                                                    size="small" 
                                                    disabled={!canRemove}
                                                    onClick={(e)=> {
                                                      e.stopPropagation();
                                                      removeHullByName(s.id, o.name, def);
                                                    }}
                                                    sx={{ p: 0.25, minWidth: 'auto', color: 'inherit' }}
                                                  >
                                                    <RemoveIcon fontSize="small" />
                                                  </IconButton>
                                                  <Typography variant="body2" sx={{ minWidth: 16, textAlign: 'center', fontSize: '0.75rem' }}>
                                                    {currentCount}
                                                  </Typography>
                                                  <IconButton 
                                                    size="small" 
                                                    disabled={!canAdd}
                                                    onClick={(e)=> {
                                                      e.stopPropagation();
                                                      addHull(s.id, o.name, def);
                                                    }}
                                                    sx={{ p: 0.25, minWidth: 'auto', color: 'inherit' }}
                                                  >
                                                    <PlusIcon fontSize="small" />
                                                  </IconButton>
                                                </>
                                              )}
                                              {isRefitWeapon && (
                                                <Typography variant="body2" sx={{ minWidth: 16, textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                  1
                                                </Typography>
                                              )}
                                            </Box>
                                          }
                                        />
                                  </MuiTooltip>
                                );
                              })}
                                </Box>
                              )}
                            {(() => {
                              // Use the proper effective hull slots calculation that handles both legacy and canonical refits
                              const effectiveSlots = calculateEffectiveHullSlots(s, def);
                              return editableCount < effectiveSlots && <Alert severity="info" sx={{ mt:1 }}>Choose {effectiveSlots - editableCount} more hull weapon(s).</Alert>;
                            })()}
                          </Paper>
                          )}
                        </Grid>

                        {/* Refit Slot - show weapons added by refits */}
                        {(() => {
                          const refitWeapons = getRefitSlotWeapons(s);
                          return refitWeapons.length > 0 && (
                            <Grid item xs={12}>
                              <Paper variant="outlined" sx={{ p: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  {refitWeapons[0]?.originalSlot === 'turret' ? <HullIcon size={16} /> : <ProwIcon size={16} />}
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                    {refitWeapons[0]?.originalSlot === 'turret' ? 'Hull' : 'Prow'} — Refit
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {refitWeapons.map((weapon, index) => {
                                    const weaponData = getWeaponData(weapon, [], s);
                                    return (
                                      <MuiTooltip 
                                        key={`refit-${weapon.name}-${index}`} 
                                        title={`Targets: ${weaponData.targets||"—"} • Attacks: ${weaponData.attacks??"—"} • Range: ${weaponData.range||"—"}`} 
                                        arrow
                                      >
                                        <Chip color="warning" label={weapon.name} />
                                      </MuiTooltip>
                                    );
                                  })}
                                </Box>
                              </Paper>
                            </Grid>
                          );
                        })()}

                        {/* Refit Button - only for capital ships when refits are enabled */}
                        {useRefits && !def.squadron && (
                          <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    Refit
                                  </Typography>
                                  {s.refit ? (
                                    <Typography variant="caption" color="text.secondary">
                                      {s.refit.name}
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
                                    disabled={!canAddRefit && !s.refit}
                                    onClick={() => {

                                      handleOpenRefitModal(s);
                                    }}
                                    sx={{
                                      minWidth: 'auto',
                                      width: 40,
                                      height: 40
                                    }}
                                  >
                                    {s.refit ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                                  </Button>
                                  {s.refit && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      onClick={() => removeRefit(s.id)}
                                      sx={{
                                        minWidth: 'auto',
                                        width: 40,
                                        height: 40
                                      }}
                                    >
                                      <CloseIcon fontSize="small" />
                                    </Button>
                                  )}
                                </Stack>
                              </Box>
                            </Paper>
                          </Grid>
                        )}
                        </Grid>
                      </BuildViewCard>
                    </Grid>
                  );
                }
              });
              
              return cards;
            })()}
          </Grid>
        </Grid>
      </Grid>
      
      {/* Floating Save Button */}
      {user && fleetName.trim() && roster.length > 0 && (
        <Fab 
          color={saveStatus === 'saved' ? 'success' : 'primary'}
          onClick={saveFleet}
          disabled={saveStatus === 'saving'}
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            zIndex: 1000,
            bgcolor: saveStatus === 'saved' ? '#4caf50' : undefined,
            '&:hover': {
              bgcolor: saveStatus === 'saved' ? '#45a049' : undefined
            }
          }}
        >
          {saveStatus === 'saved' ? <CheckIcon /> : <SaveIcon />}
        </Fab>
      )}

      {/* Refit Modal */}
      <RefitModal
        open={refitModalOpen && !!refitModalShip}
        onClose={handleCloseRefitModal}
        ship={refitModalShip ? roster.find(s => s.id === refitModalShip.id) || refitModalShip : null}
        shipDef={refitModalShip ? ships[refitModalShip.className] : null}
        faction={faction}
        factions={factions}
        onSelectRefit={handleSelectRefit}
        usedRefits={usedRefits}
        maxRefits={maxRefits}
      />

      {/* Squadron Refit Modal */}
      <SquadronRefitModal
        open={squadronRefitModalOpen && !!squadronRefitModalSquadron}
        onClose={handleCloseSquadronRefitModal}
        squadron={useMemo(() => 
          squadronRefitModalSquadron ? {
            groupId: squadronRefitModalSquadron.groupId,
            ships: roster.filter(ship => ship.groupId === squadronRefitModalSquadron.groupId),
            squadronRefit: roster.find(ship => ship.groupId === squadronRefitModalSquadron.groupId)?.squadronRefit
          } : null, 
          [squadronRefitModalSquadron, roster]
        )}
        shipDef={squadronRefitModalSquadron ? ships[roster.find(ship => ship.groupId === squadronRefitModalSquadron.groupId)?.className] : null}
        faction={faction}
        factions={factions}
        onApplyRefit={handleApplySquadronRefit}
        onClearRefit={handleClearSquadronRefit}
      />
    </>
  );
};

export default BuildView;
