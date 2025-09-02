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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4" className="page-title">Fleets</Typography>
        <button 
          className="build-view__icon-button"
          onClick={() => {
            startNewFleet();
            setTab(0); // Go to Build tab
          }}
          title="New Fleet"
        >
          <AddIcon fontSize="small" />
        </button>
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
                {/* Delete button in upper right - white */}
                <IconButton 
                  size="small" 
                  onClick={()=>deleteFleet(fleet.id)}
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <DeleteIcon/>
                </IconButton>

                {/* Fleet info - no buttons in header now */}
                <Box sx={{ mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', pr: 5 }}>{fleet.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fleet.faction} • {fleet.points} pts • {fleet.roster.length} ships
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Saved {new Date(fleet.savedAt).toLocaleDateString()}
                </Typography>
                
                {/* Edit and Play buttons in bottom right */}
                <Stack 
                  direction="row" 
                  spacing={0.5}
                  sx={{ 
                    position: 'absolute', 
                    bottom: 8, 
                    right: 8 
                  }}
                >
                  <IconButton color="primary" size="small" onClick={()=>editFleet(fleet)}>
                    <EditIcon/>
                  </IconButton>
                  <IconButton color="success" size="small" onClick={()=>playFleet(fleet)}>
                    <PlayIcon/>
                  </IconButton>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default FleetsView;
