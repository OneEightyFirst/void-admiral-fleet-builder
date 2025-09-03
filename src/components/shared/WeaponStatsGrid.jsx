import React from 'react';
import { Box, Grid, Typography, Button } from '@mui/material';

const WeaponStatsGrid = ({ 
  weapons = [], 
  showActions = false, 
  onWeaponAction = null,
  getActionProps = null 
}) => {
  if (!weapons || weapons.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 1, mx: -2 }}>
      {/* Weapon Headers */}
      <Box sx={{
        backgroundColor: '#1f1f1f',
        px: 2,
        py: 1
      }}>
        <Grid container spacing={0}>
          <Grid item xs={4}>
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem'
              }}
            >
              Weapon
            </Typography>
          </Grid>
          <Grid item xs={2.5}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.75rem'
                }}
              >
                Target
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={2.5}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.75rem'
                }}
              >
                Attacks
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={showActions ? 2 : 3}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.75rem'
                }}
              >
                Range
              </Typography>
            </Box>
          </Grid>
          {showActions && (
            <Grid item xs={1}>
              {/* Space for action button */}
            </Grid>
          )}
        </Grid>
      </Box>
      
      {/* Weapon Data Rows */}
      {weapons.map((weapon, weaponIdx) => (
        <Box key={weaponIdx} sx={{ px: 2, py: 0.5, backgroundColor: '#181818' }}>
          <Grid container spacing={0} alignItems="center">
            <Grid item xs={4}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.75rem'
                }}
              >
                {weapon.name}
              </Typography>
            </Grid>
            <Grid item xs={2.5}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  {weapon.targets}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={2.5}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  {weapon.attacks}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={showActions ? 2 : 3}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  {weapon.range}
                </Typography>
              </Box>
            </Grid>
            {showActions && (
              <Grid item xs={1}>
                {(() => {
                  const actionProps = getActionProps ? getActionProps(weapon, weaponIdx) : {};
                  return (
                    <Button
                      size="small"
                      disabled={actionProps.disabled}
                      onClick={() => onWeaponAction && onWeaponAction(weapon, weaponIdx)}
                      sx={actionProps.sx || {
                        minWidth: 24,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark'
                        }
                      }}
                      aria-label={actionProps.ariaLabel || `Add ${weapon.name} weapon`}
                    >
                      {actionProps.label || '+'}
                    </Button>
                  );
                })()}
              </Grid>
            )}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default WeaponStatsGrid;