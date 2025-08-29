import React from 'react';
import {
  Card, CardContent, Typography, Box, Grid, IconButton, Button, Stack,
  Paper, Chip, Divider, Tooltip as MuiTooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ProwIcon, HullIcon } from './WeaponIcons';
import { getStatDisplayName, formatStatValue } from '../utils/gameUtils';

// Legacy calculateModifiedStats removed - using canonical refit system

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

  // Use canonical refit system - ship.statline should already contain modified stats
  const modifiedStats = ship.statline || shipDef.statline || {};
  const baseStats = shipDef.statline || {};
  
  // Function to check if a stat has been modified (comparing against base ship definition)
  const isStatModified = (statName) => {
    return ship.appliedCanonicalRefit && baseStats[statName] !== modifiedStats[statName];
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
                  {formatStatValue(statName, value)}
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
                      ({formatStatValue(statName, baseStats[statName])})
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Refit and Begins With indicator */}
      {(ship.refit || (shipDef.beginsWith && shipDef.beginsWith.length > 0)) && (
        <Box sx={{ 
          backgroundColor: '#2a2a2a', 
          px: 2, 
          py: 1, 
          borderTop: '1px solid #444' 
        }}>
          {ship.refit && (
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#ffc107', display: 'block', mb: shipDef.beginsWith?.length > 0 ? 0.5 : 0 }}>
              Refit: {ship.refit.selectedOption ? ship.refit.selectedOption.name : ship.refit.name}
            </Typography>
          )}
          {shipDef.beginsWith && shipDef.beginsWith.length > 0 && (
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'white' }}>
              Begins with: {shipDef.beginsWith.map(w => w.name).join(', ')}
            </Typography>
          )}
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
