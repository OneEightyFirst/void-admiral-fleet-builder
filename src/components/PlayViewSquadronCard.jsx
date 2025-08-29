import React from 'react';
import {
  Card, CardContent, Typography, Box, Grid
} from '@mui/material';
import { HullIcon, ProwIcon } from './WeaponIcons';
import { getStatDisplayName, formatStatValue, shipCost } from '../utils/gameUtils';
import { getCanonicalWeaponData as getWeaponData } from '../utils/refits/weaponData.js';

const PlayViewSquadronCard = ({ squadron, faction, shipDef }) => {
  if (!squadron || !shipDef) return null;

  // Use squadron ship's statline if it exists (may be modified by refits), otherwise use shipDef
  const firstShip = squadron[0];
  
  // TEMPORARY FIX: Force default stats to debug the issue
  console.log('🔧 DEBUG: firstShip:', firstShip);
  console.log('🔧 DEBUG: shipDef:', shipDef);
  console.log('🔧 DEBUG: firstShip.statline:', firstShip?.statline);
  console.log('🔧 DEBUG: shipDef.statline:', shipDef?.statline);
  
  // For now, always use shipDef.statline as base, then apply refit modifications if they exist
  let statline = { ...shipDef.statline };
  
  // If refit was applied and modified the statline, use those modifications
  if (firstShip?.statline && Object.keys(firstShip.statline).length > 0) {
    console.log('🔧 DEBUG: Using modified statline from refit');
    statline = { ...firstShip.statline };
  }
  
  console.log('🔧 DEBUG: Final statline:', statline);
  
  // Calculate squadron cost and display
  // Check if this is a free squadron (Insectoid Swarm bonus squadrons)
  const isFreeSquadron = firstShip.isFree;
  const squadronCost = isFreeSquadron ? 0 : shipCost(shipDef) * squadron.length;
  const costDisplay = squadronCost === 0 ? 'Free' : `${squadronCost} pts`;

  // Get all weapons from the squadron, showing each ship's weapons separately
  const allWeapons = [];
  squadron.forEach((ship, shipIndex) => {
    // Add prow weapon for this ship
    if (ship.loadout?.prow) {
      const weaponData = getWeaponData(ship.loadout.prow, [], ship);
      allWeapons.push({
        name: ship.loadout.prow.name,
        data: weaponData,
        type: 'prow',
        shipIndex: shipIndex
      });
    }
    
    // Add hull weapons for this ship (grouped if identical)
    if (ship.loadout?.hull && ship.loadout.hull.length > 0) {
      // Count occurrences of each hull weapon type for this ship
      const hullWeaponCounts = ship.loadout.hull.reduce((acc, weaponName) => {
        acc[weaponName] = (acc[weaponName] || 0) + 1;
        return acc;
      }, {});
      
      // Add each unique hull weapon type with count
      Object.entries(hullWeaponCounts).forEach(([weaponName, count]) => {
        const allPossibleWeapons = [...(shipDef.hull?.options || []), ...(shipDef.beginsWith || [])];
        const weaponData = getWeaponData(weaponName, allPossibleWeapons, ship);
        
        allWeapons.push({
          name: weaponName,
          data: weaponData,
          type: 'hull',
          count: count,
          shipIndex: shipIndex
        });
      });
    }
  });

  // Check if any weapons are Fighter Bays (for footnote)
  const hasFighterBays = allWeapons.some(weapon => weapon.name === "Fighter Bays");

  return (
    <Card
      sx={{
        backgroundColor: '#181818',
        color: 'white',
        border: 'none',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header Section */}
      <Box sx={{
        backgroundColor: 'primary.main',
        px: 2,
        py: 1.5
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#1f1f1f',
                letterSpacing: '0.1em',
                lineHeight: 1
              }}
            >
              {faction.toUpperCase()}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                lineHeight: 1,
                my: 0,
                color: '#1f1f1f'
              }}
            >
              {squadron[0].className}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#1f1f1f',
                lineHeight: 1
              }}
            >
              Squadron
            </Typography>
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700
            }}
          >
            {costDisplay}
          </Typography>
        </Box>
      </Box>

      {/* Stats Section */}
      {/* Stat Labels Bar */}
      <Box sx={{
        backgroundColor: '#1f1f1f',
        px: 2,
        py: 1
      }}>
        <Grid container spacing={0}>
          {Object.entries(statline).map(([statName, value]) => (
            <Grid key={statName} item xs={2.4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: 1
                  }}
                >
                  {getStatDisplayName(statName)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Stat Values */}
      <Box sx={{
        backgroundColor: '#181818',
        px: 2,
        py: 1
      }}>
        <Grid container spacing={0}>
          {Object.entries(statline).map(([statName, value]) => (
            <Grid key={`${statName}-value`} item xs={2.4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    lineHeight: 1
                  }}
                >
                  {formatStatValue(statName, value)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Squadron Refit Information Section */}
      {firstShip?.appliedCanonicalRefit && (
        <Box sx={{
          backgroundColor: '#2a2a2a',
          borderTop: '1px solid',
          borderTopColor: 'primary.main',
          px: 2,
          py: 1
        }}>
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 600,
            color: 'primary.main',
            mb: 0.5
          }}>
            Squadron Refit: {firstShip.appliedCanonicalRefit.name}
          </Typography>
          {firstShip.appliedCanonicalRefit.notes && (
            <Box>
              {firstShip.appliedCanonicalRefit.notes.map((note, index) => (
                <Typography key={index} variant="caption" sx={{ 
                  display: 'block',
                  color: 'text.secondary',
                  fontSize: '0.75rem'
                }}>
                  • {note}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Weapons Section */}
      {/* Weapon Headers Bar */}
      <Box sx={{
        backgroundColor: '#1f1f1f',
        borderTop: '1px solid',
        borderTopColor: 'primary.main',
        px: 2,
        py: 1
      }}>
        <Grid container spacing={0}>
          <Grid item xs={6}>
            {/* Empty space for weapon name/icon */}
          </Grid>
          <Grid item xs={2}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.875rem'
              }}
            >
              Target
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.875rem'
              }}
            >
              Attacks
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.875rem'
              }}
            >
              Range
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Weapons Data */}
      <Box sx={{
        backgroundColor: '#181818',
        px: 2,
        py: 2
      }}>
        {allWeapons.map((weapon, index) => {
          // Check if this is the first weapon for this ship
          const isFirstWeaponForShip = index === 0 || weapon.shipIndex !== allWeapons[index - 1].shipIndex;
          
          return (
            <Grid key={`${weapon.name}-${index}`} container spacing={0} sx={{ mb: 1 }}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* Numbered circle */}
                  <Box sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: isFirstWeaponForShip ? '2px solid white' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        lineHeight: 1,
                        opacity: isFirstWeaponForShip ? 1 : 0
                      }}
                    >
                      {weapon.shipIndex + 1}
                    </Typography>
                  </Box>
                  {weapon.type === 'prow' ? (
                    <ProwIcon size={16} />
                  ) : (
                    <HullIcon size={16} />
                  )}
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {weapon.name}
                    {weapon.count && weapon.count > 1 && ` x${weapon.count}`}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  sx={{
                    textAlign: 'center',
                    fontWeight: 600
                  }}
                >
                  {weapon.data.targets || '—'}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  sx={{
                    textAlign: 'center',
                    fontWeight: 600
                  }}
                >
                  {(() => {
                    const attacks = weapon.data.attacks;
                    if (typeof attacks === 'object' && attacks.dice) {
                      return attacks.star ? `${attacks.dice}*` : attacks.dice;
                    }
                    return attacks || '—';
                  })()}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography
                  variant="body1"
                  sx={{
                    textAlign: 'center',
                    fontWeight: 600
                  }}
                >
                  {weapon.data.range || '—'}
                </Typography>
              </Grid>
            </Grid>
          );
        })}

        {/* Fighter Bay Footnote */}
        {hasFighterBays && (
          <Box sx={{ px: 2, pb: 1, pt: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontStyle: 'italic',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.75rem'
              }}
            >
              * Per fighter token
            </Typography>
          </Box>
        )}
      </Box>


    </Card>
  );
};

export default PlayViewSquadronCard;
