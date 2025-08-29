import React from 'react';
import { Card, Box, Typography, Grid } from '@mui/material';
import { getStatDisplayName, formatStatValue } from '../../utils/gameUtils';

/**
 * Base card component with consistent header styling for both build and play views
 */
const BaseCard = ({
  faction,
  shipName,
  shipType,
  cost,
  showCost = true,
  statline = {},
  headerColor = 'primary.main',
  headerActions,
  children,
  ...cardProps
}) => {
  return (
    <Card
      sx={{
        backgroundColor: '#181818',
        color: 'white',
        border: 'none',
        borderRadius: 2,
        overflow: 'hidden'
      }}
      {...cardProps}
    >
      {/* Header Section */}
      <Box sx={{
        backgroundColor: headerColor,
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
              {shipName}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#1f1f1f',
                lineHeight: 1
              }}
            >
              {shipType}
            </Typography>
          </Box>
          
          {/* Header Actions (cost display, buttons, etc.) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {headerActions}
            {showCost && cost !== undefined && (
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700
                }}
              >
                {cost}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Stats Section - only show if statline exists */}
      {Object.keys(statline).length > 0 && (
        <>
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
        </>
      )}

      {/* Main content area */}
      {children}
    </Card>
  );
};

export default BaseCard;
