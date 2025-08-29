import React from 'react';
import {
  Card, CardContent, Typography, Box, Grid
} from '@mui/material';
import { ProwIcon, HullIcon } from './WeaponIcons';
import { getStatDisplayName, formatStatValue, shipCost } from '../utils/gameUtils';
import { getCanonicalWeaponData as getWeaponData, getRefitSlotWeapons } from '../utils/refits/weaponData.js';

const PlayViewCard = ({ ship, faction, shipDef }) => {
  if (!ship || !shipDef) return null;

  const cost = shipCost(shipDef);
  // Use ship's statline if it exists (may be modified by refits), otherwise use shipDef
  const statline = ship.statline || shipDef.statline || {};
  
    // Get weapons - prow and hull
  const prowWeapon = ship.loadout?.prow;
  const hullWeapons = ship.loadout?.hull || [];

  // Group hull weapons by name
  const groupedHullWeapons = hullWeapons.reduce((acc, weaponName) => {
    acc[weaponName] = (acc[weaponName] || 0) + 1;
    return acc;
  }, {});

  // Check if any weapons are Fighter Bays (for footnote)
  const hasFighterBays = (prowWeapon?.name === "Fighter Bays") || 
                        hullWeapons.some(weapon => weapon === "Fighter Bays");

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
              {ship.className}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#1f1f1f',
                lineHeight: 1
              }}
            >
              {shipDef.size}
            </Typography>
          </Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700
            }}
          >
            {cost} pts
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

                  {/* Prow Weapon */}
          {prowWeapon && (
            <Grid container spacing={0} sx={{ mb: 1 }}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ProwIcon size={16} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {prowWeapon.name}
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
                  {(() => {
                    const weaponData = getWeaponData(prowWeapon, [], ship);
                    return weaponData.targets || '—';
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
                  {(() => {
                    const weaponData = getWeaponData(prowWeapon, [], ship);
                    const attacks = weaponData.attacks;
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
                  {(() => {
                    const weaponData = getWeaponData(prowWeapon, [], ship);
                    return weaponData.range || '—';
                  })()}
                </Typography>
              </Grid>
            </Grid>
          )}

                {/* Hull Weapons */}
        {Object.entries(groupedHullWeapons).map(([weaponName, count]) => {
          // Get weapon data with Fighter Bay handling
          const allWeapons = [...(shipDef.hull?.options || []), ...(shipDef.beginsWith || [])];
          const weaponData = getWeaponData(weaponName, allWeapons);

          const displayName = count > 1 ? `${weaponName} x${count}` : weaponName;

          return (
            <Grid key={weaponName} container spacing={0} sx={{ mb: 1 }}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HullIcon size={16} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {displayName}
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
                  {weaponData.targets || '—'}
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
                    const attacks = weaponData.attacks;
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
                  {weaponData.range || '—'}
                </Typography>
              </Grid>
            </Grid>
          );
        })}

        {/* Refit Slot Weapons */}
        {(() => {
          const refitWeapons = getRefitSlotWeapons(ship);
          return refitWeapons.map((weapon, index) => {
            const weaponData = getWeaponData(weapon, []);
            const slotLabel = weapon.originalSlot === 'turret' ? 'Hull' : 'Prow';
            
            return (
              <Grid key={`refit-${weapon.name}-${index}`} container spacing={0} sx={{ mb: 1 }}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {weapon.originalSlot === 'turret' ? <HullIcon size={16} /> : <ProwIcon size={16} />}
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: '#ffc107' // Warning color for refit weapons
                      }}
                    >
                      {weapon.name} (Refit)
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
                    {weaponData.targets || '—'}
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
                      const attacks = weaponData.attacks;
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
                    {weaponData.range || '—'}
                  </Typography>
                </Grid>
              </Grid>
            );
          });
        })()}

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

      {/* Refit Notes */}
      {ship.appliedCanonicalRefit?.notes && ship.appliedCanonicalRefit.notes.length > 0 && (
        <Box sx={{ 
          backgroundColor: '#2a2a2a', 
          px: 2, 
          py: 1, 
          borderTop: '1px solid #444' 
        }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffc107', display: 'block', mb: 0.5 }}>
            Refit: {ship.appliedCanonicalRefit.name}
          </Typography>
          {ship.appliedCanonicalRefit.notes.map((note, index) => (
            <Typography
              key={index}
              variant="caption"
              sx={{
                display: 'block',
                fontStyle: 'italic',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.75rem',
                lineHeight: 1.2
              }}
            >
              • {note}
            </Typography>
          ))}
        </Box>
      )}
    </Card>
  );
};

export default PlayViewCard;
