import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Stack,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Login as LoginIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';

const FleetsView = ({
  user,
  savedFleets,
  startNewFleet,
  setTab,
  editFleet,
  playFleet,
  deleteFleet,
  signInWithGoogle
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" className="page-title">Fleets</Typography>
        <IconButton 
          color="primary" 
          onClick={() => {
            startNewFleet();
            setTab(0); // Go to Build tab
          }}
          sx={{ 
            bgcolor: 'rgba(25, 118, 210, 0.08)',
            border: '1px solid',
            borderColor: 'primary.main',
            '&:hover': {
              bgcolor: 'rgba(25, 118, 210, 0.16)'
            }
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>
      
      {!user ? (
        <Paper variant="outlined" sx={{ p:3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>Sign In Required</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in with Google to save and access your fleets across all devices.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<LoginIcon/>}
            onClick={signInWithGoogle}
            size="large"
          >
            Sign In with Google
          </Button>
        </Paper>
      ) : savedFleets.length === 0 ? (
        <Paper variant="outlined" sx={{ p:3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>No fleets yet</Typography>
          <Typography variant="body2" color="text.secondary">
            Build a fleet and save it to see it here.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {savedFleets.map(fleet => (
            <Grid key={fleet.id} item xs={12} md={6} lg={4}>
              <Paper variant="outlined" sx={{ p:2, backgroundColor: '#1f1f1f', position: 'relative' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>{fleet.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fleet.faction} • {fleet.points} pts • {fleet.roster.length} ships
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton color="primary" size="small" onClick={()=>editFleet(fleet)}>
                      <EditIcon/>
                    </IconButton>
                    <IconButton color="success" size="small" onClick={()=>playFleet(fleet)}>
                      <PlayIcon/>
                    </IconButton>
                  </Stack>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Saved {new Date(fleet.savedAt).toLocaleDateString()}
                </Typography>
                
                {/* Trash can in bottom right */}
                <IconButton 
                  color="error" 
                  size="small" 
                  onClick={()=>deleteFleet(fleet.id)}
                  sx={{ 
                    position: 'absolute', 
                    bottom: 8, 
                    right: 8 
                  }}
                >
                  <DeleteIcon/>
                </IconButton>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default FleetsView;
