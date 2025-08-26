import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { ProwIcon, HullIcon } from '../WeaponIcons';

/**
 * Shared component for displaying weapon statistics in a grid layout
 * Used in both PlayViewCard and PlayViewSquadronCard
 */
const WeaponStatsGrid = ({
  weapons = [],
  headerColor = 'primary.main',
  showFootnote = false
}) => {
  return (
    <>
      {/* Weapon Headers Bar */}
      <Box sx={{
        backgroundColor: '#1f1f1f',
        borderTop: '1px solid',
        borderTopColor: headerColor,
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
        {weapons.map((weapon, index) => (
          <Grid key={`${weapon.name}-${index}`} container spacing={0} sx={{ mb: index < weapons.length - 1 ? 1 : 0 }}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Optional numbered circle for squadrons */}
                {weapon.number && (
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
                      {weapon.number}
                    </Typography>
                  </Box>
                )}
                
                {/* Weapon type icon */}
                {weapon.type === 'prow' ? (
                  <ProwIcon size={16} />
                ) : weapon.type === 'hull' ? (
                  <HullIcon size={16} />
                ) : null}
                
                {/* Weapon name with optional count */}
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
                {weapon.data?.targets || '—'}
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
                {weapon.data?.attacks || '—'}
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
                {weapon.data?.range || '—'}
              </Typography>
            </Grid>
          </Grid>
        ))}

        {/* Fighter Bay Footnote */}
        {showFootnote && (
          <Box sx={{ px: 0, pb: 0, pt: 1 }}>
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
    </>
  );
};

export default WeaponStatsGrid;
