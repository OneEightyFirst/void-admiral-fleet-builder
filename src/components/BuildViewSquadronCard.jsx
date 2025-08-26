import React from 'react';
import {
  Card, CardContent, Typography, Box, Grid, IconButton, Button, Stack,
  Paper, Chip, Alert, Tooltip as MuiTooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { ProwIcon, HullIcon } from './WeaponIcons';
import { getStatDisplayName } from '../utils/gameUtils';

// Helper function to calculate modified stats with squadron refit effects
const calculateModifiedSquadronStats = (baseStats, squadronRefit) => {
  if (!squadronRefit) return baseStats;
  
  const modifiedStats = { ...baseStats };
  
  // Apply squadron refit effects
  if (squadronRefit.selectedEffects) {
    Object.entries(squadronRefit.selectedEffects).forEach(([stat, change]) => {
      if (typeof change === 'string') {
        if (change.startsWith('-')) {
          const reduction = parseInt(change.substring(1));
          const currentValue = typeof modifiedStats[stat] === 'string' ? 
            parseInt(modifiedStats[stat]) : modifiedStats[stat];
          modifiedStats[stat] = Math.max(0, currentValue - reduction);
        } else if (change.startsWith('+')) {
          const increase = parseInt(change.substring(1));
          const currentValue = typeof modifiedStats[stat] === 'string' ? 
            parseInt(modifiedStats[stat]) : modifiedStats[stat];
          modifiedStats[stat] = currentValue + increase;
        }
      }
    });
  }
  
  return modifiedStats;
};

const BuildViewSquadronCard = ({ 
  squadron, 
  shipDef, 
  faction,
  onDuplicateGroup,
  onRemoveGroup,
  children // For weapon selection UI that comes from the parent
}) => {
  if (!squadron || !shipDef || squadron.length === 0) return null;

  const firstShip = squadron[0];
  const baseStats = shipDef.statline || {};
  const modifiedStats = calculateModifiedSquadronStats(baseStats, firstShip.squadronRefit);
  
  // Function to check if a stat has been modified
  const isStatModified = (statName) => {
    return firstShip.squadronRefit && baseStats[statName] !== modifiedStats[statName];
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
              {firstShip.className}
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
          <Stack direction="row" spacing={1} alignItems="center">
            {firstShip.isFree && (
              <Chip size="small" label="Free" color="success" />
            )}
            {!firstShip.isFree && (
              <MuiTooltip title="Duplicate Squadron" arrow>
                <IconButton 
                  color="primary" 
                  onClick={() => onDuplicateGroup(firstShip.groupId)}
                  sx={{ color: 'white' }}
                >
                  <ContentCopyIcon />
                </IconButton>
              </MuiTooltip>
            )}
            <MuiTooltip title="Remove Squadron" arrow>
              <IconButton 
                color="error" 
                onClick={() => onRemoveGroup(firstShip.groupId)}
                sx={{ color: 'white' }}
              >
                <DeleteIcon />
              </IconButton>
            </MuiTooltip>
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
          {Object.entries(modifiedStats).map(([statName, value]) => (
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
          {Object.entries(modifiedStats).map(([statName, value]) => (
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

      {/* Squadron Refit indicator */}
      {firstShip.squadronRefit && (
        <Box sx={{ 
          backgroundColor: '#2a2a2a', 
          px: 2, 
          py: 1, 
          borderTop: '1px solid #444' 
        }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffc107' }}>
            Squadron Refit: {firstShip.squadronRefit.selectedOption ? firstShip.squadronRefit.selectedOption : firstShip.squadronRefit.name}
          </Typography>
        </Box>
      )}

      {/* Build-specific content (weapon selection for each ship) */}
      <Box sx={{ p: 2 }}>
        {children}
      </Box>
    </Card>
  );
};

export default BuildViewSquadronCard;
