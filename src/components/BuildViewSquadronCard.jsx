import React from 'react';
import {
  Card, CardContent, Typography, Box, Grid, IconButton, Button, Stack,
  Paper, Chip, Alert, Tooltip as MuiTooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { ProwIcon, HullIcon } from './WeaponIcons';
import { getStatDisplayName, formatStatValue } from '../utils/gameUtils';

// Legacy calculateModifiedSquadronStats removed - using canonical refit system

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
  // Use canonical refit system - firstShip.statline should already contain modified stats
  const modifiedStats = firstShip.statline || shipDef.statline || {};
  const baseStats = shipDef.statline || {};
  
  // Debug logging for stat display (can be removed after testing)
  // console.log('🎯 SQUADRON CARD: firstShip.appliedCanonicalRefit:', firstShip.appliedCanonicalRefit);
  // console.log('🎯 SQUADRON CARD: firstShip.squadronRefit:', firstShip.squadronRefit);
  // console.log('🎯 SQUADRON CARD: baseStats:', baseStats);
  // console.log('🎯 SQUADRON CARD: modifiedStats:', modifiedStats);
  // console.log('🎯 SQUADRON CARD: firstShip.statline:', firstShip.statline);
  
  // Function to check if a stat has been modified (comparing against base ship definition)
  const isStatModified = (statName) => {
    return firstShip.appliedCanonicalRefit && baseStats[statName] !== modifiedStats[statName];
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
          {Object.entries(modifiedStats).filter(([statName]) => 
            !['ArmouredProws', 'hull_weapons'].includes(statName)
          ).map(([statName, value]) => (
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
          {Object.entries(modifiedStats).filter(([statName]) => 
            !['ArmouredProws', 'hull_weapons'].includes(statName)
          ).map(([statName, value]) => (
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

      {/* Build-specific content (weapon selection for each ship) */}
      <Box sx={{ p: 2 }}>
        {children}
      </Box>

      {/* Squadron Refit indicator */}
      {(firstShip.squadronRefit || firstShip.appliedCanonicalRefit) && (
        <Box sx={{ 
          backgroundColor: '#1a1a1a', 
          px: 2, 
          py: 1, 
          borderTop: '1px solid #333' 
        }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#d4af37', display: 'block', mb: 0.5 }}>
            Squadron Refit: {firstShip.appliedCanonicalRefit?.name || (firstShip.squadronRefit?.selectedOption ? firstShip.squadronRefit.selectedOption.name : firstShip.squadronRefit?.name)}
          </Typography>
          {(firstShip.appliedCanonicalRefit?.notes || firstShip.squadronRefit?.notes) && (
            <Box sx={{ ml: 0 }}>
              {(firstShip.appliedCanonicalRefit?.notes || firstShip.squadronRefit?.notes || []).map((note, index) => (
                <Typography 
                  key={index} 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    mb: index < (firstShip.appliedCanonicalRefit?.notes || firstShip.squadronRefit?.notes || []).length - 1 ? 0.25 : 0
                  }}
                >
                  • {note}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Card>
  );
};

export default BuildViewSquadronCard;
