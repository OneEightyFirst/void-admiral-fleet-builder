import React from 'react';
import { Paper, Typography, Box, Chip, Tooltip as MuiTooltip } from '@mui/material';

const BeginsWithSection = ({ 
  beginsWith, 
  squadronRefit = null,
  getWeaponData = null,
  shipDef = null
}) => {
  if (!beginsWith || beginsWith.length === 0) {
    return null;
  }

  return (
    <Paper variant="outlined" sx={{ p: 1, mb: 1, backgroundColor: 'rgb(58, 56, 57)' }}>
      <Typography variant="caption" sx={{ fontWeight: 700, mb: 1.5, display: 'block', fontSize: '0.875rem' }}>
        Begins with
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {beginsWith.map((weapon, idx) => {
          // Check if this weapon has been replaced by a squadron refit
          const effectiveWeapon = (() => {
            if (squadronRefit?.weaponModifications) {
              for (const modification of squadronRefit.weaponModifications) {
                if (modification.effects?.replaceWith && modification.conditions) {
                  for (const condition of modification.conditions) {
                    if (condition.type === 'weaponName' && 
                        condition.values?.includes(weapon.name)) {
                      return modification.effects.replaceWith;
                    }
                  }
                }
              }
            }
            return weapon;
          })();

          // Generate tooltip content
          const tooltipTitle = getWeaponData 
            ? `Targets: ${getWeaponData(effectiveWeapon, shipDef, 'hull', { squadronRefit }).targets || "—"} • Attacks: ${getWeaponData(effectiveWeapon, shipDef, 'hull', { squadronRefit }).attacks ?? "—"} • Range: ${getWeaponData(effectiveWeapon, shipDef, 'hull', { squadronRefit }).range || "—"}`
            : `Targets: ${effectiveWeapon.targets || "—"} • Attacks: ${effectiveWeapon.attacks ?? "—"} • Range: ${effectiveWeapon.range || "—"}`;

          return (
            <MuiTooltip 
              key={`begins-${idx}`} 
              title={tooltipTitle} 
              arrow
            >
              <Chip 
                color="primary"
                label={effectiveWeapon.name}
                sx={{ 
                  '& .MuiChip-label': { 
                    fontWeight: 600 
                  } 
                }}
              />
            </MuiTooltip>
          );
        })}
      </Box>
    </Paper>
  );
};

export default BeginsWithSection;
