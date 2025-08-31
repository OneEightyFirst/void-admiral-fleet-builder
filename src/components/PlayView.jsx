import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  Grid
} from '@mui/material';

import { DiceFace } from './SVGComponents';
import PlayViewCard from './PlayViewCard';
import { getSpecialRules, getCommandAbilities } from '../utils/gameUtils';

const PlayView = ({
  faction,
  roster,
  ships,
  factions
}) => {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb:3 }}>
        <Typography variant="h4" className="page-title">{faction}</Typography>
      </Stack>
      
      {(getSpecialRules(faction, factions).length>0 || getCommandAbilities(faction, factions).length>0) && (
        <Paper variant="outlined" sx={{ p:2, mb:3, backgroundColor: '#1f1f1f' }}>
          {getSpecialRules(faction, factions).length>0 && (
            <>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: 'white' }}>Special Rules</Typography>
              <Box sx={{ mb: getCommandAbilities(faction, factions).length > 0 ? 3 : 0 }}>
                {getSpecialRules(faction, factions).map((r,i)=>(
                  <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1, backgroundColor: '#181818' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}>{r.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'grey.300' }}>{r.description}</Typography>
                  </Paper>
                ))}
              </Box>
            </>
          )}
          
          {getCommandAbilities(faction, factions).length>0 && (
            <>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: 'white' }}>Command Abilities</Typography>
              <Grid container spacing={2}>
                {getCommandAbilities(faction, factions).sort((a,b)=>a.dice-b.dice).map((c,i)=>(
                  <Grid key={i} item xs={12} md={6} lg={4}>
                    <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: '#181818', display: 'flex', alignItems: 'stretch', gap: 1.5, height: '100%' }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        aspectRatio: '1/1', 
                        minWidth: '48px',
                        alignSelf: 'stretch'
                      }}>
                        <Box sx={{ width: '100%', height: '100%', maxWidth: '48px', maxHeight: '48px' }}>
                          <DiceFace value={c.dice} size={48} />
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: 'white' }}>{c.name}</Typography>
                        <Typography variant="body2" sx={{ color: 'grey.300' }}>{c.description}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Paper>
      )}
      
      <Grid container spacing={2}>
        {(() => {
          // Group ships by groupId for squadrons, individual ships get their own entries
          const grouped = {};
          const individuals = [];
          
          roster.forEach(s => {
            if (s.groupId) {
              if (!grouped[s.groupId]) grouped[s.groupId] = [];
              grouped[s.groupId].push(s);
            } else {
              individuals.push(s);
            }
          });
          
          const squadronGroups = Object.values(grouped);
          const allEntries = [...squadronGroups, ...individuals.map(s => [s])];
          
          // Sort by ship size: Large -> Medium -> Small -> Squadron
          const sizeOrder = { Large: 0, Medium: 1, Small: 2, Squadron: 3 };
          allEntries.sort((a, b) => {
            const aSize = ships[a[0].className].size;
            const bSize = ships[b[0].className].size;
            return sizeOrder[aSize] - sizeOrder[bSize];
          });
          
          return allEntries.map((group, groupIndex) => {
            const isSquadron = group.length > 1;
            const firstShip = group[0];
            const def = ships[firstShip.className];
            
            if (isSquadron) {
              // Squadron card - use PlayViewCard component with squadron prop
              return (
                <Grid key={`squadron-${firstShip.groupId}`} item xs={12} md={6} lg={4}>
                  <PlayViewCard
                    squadron={group}
                    faction={faction}
                    shipDef={def}
                  />
                </Grid>
              );
            } else {
              // Individual ship card - use PlayViewCard component
              const s = firstShip;
              
              return (
                <Grid key={s.id} item xs={12} md={6} lg={4}>
                  <PlayViewCard 
                    ship={s} 
                    faction={faction} 
                    shipDef={def}
                  />
                </Grid>
              );
            }
          });
        })()}
      </Grid>
    </Box>
  );
};

export default PlayView;
