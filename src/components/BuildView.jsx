import React from 'react';
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
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Remove as RemoveIcon,
  Add as PlusIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import DiceFace from './DiceFace';
import { ProwIcon, HullIcon } from './WeaponIcons';
import BuildViewCard from './BuildViewCard';
import BuildViewSquadronCard from './BuildViewSquadronCard';
import {
  getFluff,
  getSpecialRules,
  getCommandAbilities,
  getShipCost,
  getStatDisplayName,
  getWeaponData,
  hasUnplannedConstruction
} from '../utils/gameUtils';

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
  
  // Functions
  addShip,
  removeShip,
  removeGroup,
  duplicateGroup,
  pickProw,
  addHull,
  removeHullByName,
  randomizeHull,
  saveFleet,
  startNewFleet,
  signInWithGoogle
}) => {
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
                {factions ? Object.keys(factions).map(f=> <MenuItem key={f} value={f}>{f}</MenuItem>) : []}
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
            {uniqueClash && <Alert severity="warning" sx={{ mt:1 }}>Unique rule: two non‑squadron ships are armed identically. Change a prow or hull mix.</Alert>}
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
                          {/* Begins with */}
                          {(def.beginsWith||[]).length>0 && (
                            <Grid item xs={12}>
                              <Paper variant="outlined" sx={{ p:1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight:800, mb:0.5 }}>Begins with</Typography>
                                <Stack direction="row" spacing={0.5} sx={{ flexWrap:"wrap" }}>
                                  {def.beginsWith.map(o=> {
                                    const weaponData = getWeaponData(o);
                                    return (
                                    <MuiTooltip key={o.name} title={`Targets: ${weaponData.targets||"—"} • Attacks: ${weaponData.attacks??"—"} • Range: ${weaponData.range||"—"}`} arrow>
                                      <Chip size="small" label={o.name} />
                                    </MuiTooltip>
                                    );
                                  })}
                                </Stack>
                              </Paper>
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
                                      {def.prow.options.map(o=> {
                                        const selected = squadShip.loadout.prow?.name === o.name;
                                        return (
                                          <MuiTooltip key={o.name} title={`Targets: ${getWeaponData(o).targets||"—"} • Attacks: ${getWeaponData(o).attacks??"—"} • Range: ${getWeaponData(o).range||"—"}`} arrow>
                                            <Chip clickable color={selected?"primary":"default"} onClick={()=>pickProw(squadShip.id, o)} label={o.name} />
                                          </MuiTooltip>
                                        );
                                      })}
                                    </Box>
                                  </Box>
                                )}

                                {/* Hull weapons for this ship */}
                                {(def.hull.select > 0 || (def.beginsWith && def.beginsWith.length > 0)) && (
                                  <Box>
                                    {def.hull.select > 0 && (
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
                                        <Typography variant="caption" sx={{ fontWeight:700 }}>Hull — Select {def.hull.select} (mix allowed)</Typography>
                                      </Box>
                                    )}
                                    {hasUnplannedConstruction(faction, factions) && squadShip.loadout.isRandomized ? (
                                      <Alert severity="info" sx={{ mb: 1 }}>
                                        Weapons randomly assigned at game start. Hull selection disabled.
                                      </Alert>
                                    ) : (
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {def.hull.options.map(o=> {
                                          const currentCount = (squadShip.loadout.hull||[]).filter(name => name === o.name).length;
                                          const totalEditable = (squadShip.loadout.hull || []).filter(n=>!(def.beginsWith||[]).some(b=>b.name===n)).length;
                                          const canAdd = totalEditable < def.hull.select;
                                          const canRemove = currentCount > 0;
                                          const isAtLimit = totalEditable >= def.hull.select;
                                          const hasSelection = currentCount > 0;
                                          const shouldHighlight = isAtLimit && hasSelection;
                                          
                                          return (
                                            <MuiTooltip key={o.name} title={`Targets: ${getWeaponData(o).targets||"—"} • Attacks: ${getWeaponData(o).attacks??"—"} • Range: ${getWeaponData(o).range||"—"}`} arrow>
                                              <Chip 
                                                color={shouldHighlight ? "primary" : "default"}
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
                                      return editableCount < def.hull.select && <Alert severity="info" sx={{ mt:1 }}>Choose {def.hull.select - editableCount} more hull weapon(s).</Alert>;
                                    })()}
                                  </Box>
                                )}
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
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
                          {(def.beginsWith||[]).length>0 && (
                          <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p:1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight:800, mb:0.5 }}>Begins with</Typography>
                              <Stack direction="row" spacing={0.5} sx={{ flexWrap:"wrap" }}>
                                {def.beginsWith.map(o=> {
                                  const weaponData = getWeaponData(o);
                                  return (
                                  <MuiTooltip key={o.name} title={`Targets: ${weaponData.targets||"—"} • Attacks: ${weaponData.attacks??"—"} • Range: ${weaponData.range||"—"}`} arrow>
                                    <Chip size="small" label={o.name} />
                                  </MuiTooltip>
                                  );
                                })}
                              </Stack>
                            </Paper>
                        </Grid>
                        )}

                        <Grid item xs={12}>
                          {def.prow.select > 0 && def.prow.options.length > 0 && (
                          <Paper variant="outlined" sx={{ p:1, mb:1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <ProwIcon size={16} />
                              <Typography variant="subtitle2" sx={{ fontWeight:800 }}>Prow — Select {def.prow.select}</Typography>
                            </Box>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {def.prow.options.map(o=> {
                                const selected = s.loadout.prow?.name === o.name;
                                return (
                                  <MuiTooltip key={o.name} title={`Targets: ${getWeaponData(o).targets||"—"} • Attacks: ${getWeaponData(o).attacks??"—"} • Range: ${getWeaponData(o).range||"—"}`} arrow>
                                    <Chip clickable color={selected?"primary":"default"} onClick={()=>pickProw(s.id, o)} label={o.name} />
                                  </MuiTooltip>
                                );
                              })}
                              </Box>
                            {!s.loadout.prow && <Alert severity="info" sx={{ mt:1 }}>Pick {def.prow.select} prow option.</Alert>}
                          </Paper>
                          )}

                          {(def.hull.select > 0 || (def.beginsWith && def.beginsWith.length > 0)) && (
                          <Paper variant="outlined" sx={{ p:1 }}>
                              {def.hull.select > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <HullIcon size={16} />
                              <Typography variant="subtitle2" sx={{ fontWeight:800 }}>Hull — Select {def.hull.select} (mix allowed)</Typography>
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
                                  {def.hull.options.map(o=> {
                                    const currentCount = (s.loadout.hull||[]).filter(name => name === o.name).length;
                                    const totalEditable = (s.loadout.hull || []).filter(n=>!(def.beginsWith||[]).some(b=>b.name===n)).length;
                                    const canAdd = totalEditable < def.hull.select;
                                    const canRemove = currentCount > 0;
                                    const isAtLimit = totalEditable >= def.hull.select;
                                    const hasSelection = currentCount > 0;
                                    const shouldHighlight = isAtLimit && hasSelection;
                                    
                                return (
                                      <MuiTooltip key={o.name} title={`Targets: ${getWeaponData(o).targets||"—"} • Attacks: ${getWeaponData(o).attacks??"—"} • Range: ${getWeaponData(o).range||"—"}`} arrow>
                                        <Chip 
                                          color={shouldHighlight ? "primary" : "default"}
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
                                            </Box>
                                          }
                                        />
                                  </MuiTooltip>
                                );
                              })}
                                </Box>
                              )}
                            {editableCount < def.hull.select && <Alert severity="info" sx={{ mt:1 }}>Choose {def.hull.select - editableCount} more hull weapon(s).</Alert>}
                          </Paper>
                          )}
                        </Grid>
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
            bottom: 24, 
            right: 24,
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
    </>
  );
};

export default BuildView;
