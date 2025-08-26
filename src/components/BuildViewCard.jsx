import React from 'react';
import {
  Card, CardContent, Typography, Box, Grid, IconButton, Button, Stack,
  Paper, Chip, Divider, Tooltip as MuiTooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ProwIcon, HullIcon } from './WeaponIcons';
import { getStatDisplayName } from '../utils/gameUtils';

// Helper function to calculate modified stats with refit effects
const calculateModifiedStats = (baseStats, refit) => {
  if (!refit) return baseStats;
  
  const modifiedStats = { ...baseStats };
  
  // Apply refit cost (what the ship loses)
  if (refit.cost) {
    Object.entries(refit.cost).forEach(([stat, change]) => {
      // Skip hull_weapons as it's not a display stat
      if (stat === 'hull_weapons') return;
      
      if (typeof change === 'string' && change.startsWith('-')) {
        const reduction = parseInt(change.substring(1));
        const currentValue = typeof modifiedStats[stat] === 'string' ? 
          parseInt(modifiedStats[stat]) : modifiedStats[stat];
        modifiedStats[stat] = Math.max(0, currentValue - reduction);
      }
    });
  }
  
  // Apply refit gains (what the ship gets)
  if (refit.gains) {
    Object.entries(refit.gains).forEach(([stat, change]) => {
      // Skip hull_weapons as it's not a display stat
      if (stat === 'hull_weapons') return;
      
      if (typeof change === 'string' && change.startsWith('+')) {
        const increase = parseInt(change.substring(1));
        const currentValue = typeof modifiedStats[stat] === 'string' ? 
          parseInt(modifiedStats[stat]) : modifiedStats[stat];
        modifiedStats[stat] = currentValue + increase;
      }
    });
  }
  
  // Apply selected option effects if this refit has options
  if (refit.selectedOption) {
    if (refit.selectedOption.cost) {
      Object.entries(refit.selectedOption.cost).forEach(([stat, change]) => {
        // Skip hull_weapons as it's not a display stat
        if (stat === 'hull_weapons') return;
        
        if (typeof change === 'string' && change.startsWith('-')) {
          const reduction = parseInt(change.substring(1));
          const currentValue = typeof modifiedStats[stat] === 'string' ? 
            parseInt(modifiedStats[stat]) : modifiedStats[stat];
          modifiedStats[stat] = Math.max(0, currentValue - reduction);
        }
      });
    }
    
    if (refit.selectedOption.gains) {
      Object.entries(refit.selectedOption.gains).forEach(([stat, change]) => {
        // Skip hull_weapons as it's not a display stat
        if (stat === 'hull_weapons') return;
        
        if (typeof change === 'string' && change.startsWith('+')) {
          const increase = parseInt(change.substring(1));
          const currentValue = typeof modifiedStats[stat] === 'string' ? 
            parseInt(modifiedStats[stat]) : modifiedStats[stat];
          modifiedStats[stat] = currentValue + increase;
        }
      });
    }
  }
  
  return modifiedStats;
};

const BuildViewCard = ({ 
  ship, 
  shipDef, 
  faction,
  onRemoveShip, 
  onRemoveGroup, 
  onPickProw,
  onPickHull,
  onAddHull,
  onRemoveHull,
  children // For weapon selection UI that comes from the parent
}) => {
  if (!ship || !shipDef) return null;

  const baseStats = shipDef.statline || {};
  const modifiedStats = calculateModifiedStats(baseStats, ship.refit);
  
  // Function to check if a stat has been modified
  const isStatModified = (statName) => {
    return ship.refit && baseStats[statName] !== modifiedStats[statName];
  };

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
          <Stack direction="row" spacing={1} alignItems="center">
            {ship.isFree && (
              <Chip size="small" label="Free" color="success" />
            )}
            {ship.groupId && (
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => onRemoveGroup(ship.groupId)}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Remove Group
              </Button>
            )}
            <IconButton 
              color="error" 
              onClick={() => onRemoveShip(ship.id)}
              sx={{ color: 'white' }}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
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
          {Object.entries(modifiedStats).filter(([statName]) => statName !== 'hull_weapons').map(([statName, value]) => (
            <Grid key={statName} item xs={2.4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: isStatModified(statName) ? '#ffc107' : 'rgba(255, 255, 255, 0.9)',
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
          {Object.entries(modifiedStats).filter(([statName]) => statName !== 'hull_weapons').map(([statName, value]) => (
            <Grid key={`${statName}-value`} item xs={2.4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    lineHeight: 1,
                    color: isStatModified(statName) ? '#ffc107' : 'inherit'
                  }}
                >
                  {value}
                  {isStatModified(statName) && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        ml: 0.5,
                        fontSize: '0.7rem',
                        opacity: 0.7,
                        textDecoration: 'line-through'
                      }}
                    >
                      ({baseStats[statName]})
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Refit indicator */}
      {ship.refit && (
        <Box sx={{ 
          backgroundColor: '#2a2a2a', 
          px: 2, 
          py: 1, 
          borderTop: '1px solid #444' 
        }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffc107' }}>
            Refit: {ship.refit.selectedOption ? ship.refit.selectedOption.name : ship.refit.name}
          </Typography>
        </Box>
      )}

      {/* Build-specific content (weapon selection, etc.) */}
      <Box sx={{ p: 2 }}>
        {children}
      </Box>
    </Card>
  );
};

export default BuildViewCard;
