import React from 'react';
import {
  Card, CardContent, Typography, Box, Grid
} from '@mui/material';
import { HullIcon, ProwIcon } from './WeaponIcons';
import { getStatDisplayName, shipCost, getWeaponData } from '../utils/gameUtils';

const PlayViewSquadronCard = ({ squadron, faction, shipDef }) => {
  if (!squadron || !shipDef) return null;

  const statline = shipDef.statline || {};
  
  // Calculate squadron cost and display
  // Check if this is a free squadron (Insectoid Swarm bonus squadrons)
  const firstShip = squadron[0];
  const isFreeSquadron = firstShip.isFree;
  const squadronCost = isFreeSquadron ? 0 : shipCost(shipDef) * squadron.length;
  const costDisplay = squadronCost === 0 ? 'Free' : `${squadronCost} pts`;

  // Get all weapons from the squadron (each weapon separately, not grouped)
  const allWeapons = [];
  squadron.forEach(ship => {
    // Add prow weapons
    if (ship.loadout?.prow) {
      const weaponData = getWeaponData(ship.loadout.prow);
      allWeapons.push({
        name: ship.loadout.prow.name,
        data: weaponData,
        type: 'prow'
      });
    }
    
    // Add hull weapons
    if (ship.loadout?.hull) {
      ship.loadout.hull.forEach(weaponName => {
        // Get weapon data with Fighter Bay handling
        const allPossibleWeapons = [...(shipDef.hull?.options || []), ...(shipDef.beginsWith || [])];
        const weaponData = getWeaponData(weaponName, allPossibleWeapons);
        
        allWeapons.push({
          name: weaponName,
          data: weaponData,
          type: 'hull'
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
                  {value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

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
          return (
            <Grid key={`${weapon.name}-${index}`} container spacing={0} sx={{ mb: 1 }}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* Numbered circle */}
                  <Box sx={{
                    width: 24,
                    height: 24,
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
                        fontSize: '0.75rem',
                        lineHeight: 1
                      }}
                    >
                      {index + 1}
                    </Typography>
                  </Box>
                  {weapon.type === 'prow' ? (
                    <ProwIcon size={16} />
                  ) : (
                    <HullIcon size={16} />
                  )}
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {weapon.name}
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
                  {weapon.data.attacks || '—'}
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
