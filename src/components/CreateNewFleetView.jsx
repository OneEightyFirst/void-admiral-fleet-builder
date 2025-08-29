import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const CreateNewFleetView = ({
  fleetName,
  setFleetName,
  faction,
  setFaction,
  factions,
  onSubmit
}) => {
  const handleSubmit = () => {
    if (fleetName.trim()) {
      onSubmit();
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      textAlign: 'center'
    }}>
      <Typography variant="h4" sx={{ mb: 1, color: 'white' }}>
        Create New Fleet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Give your fleet a name to start building
      </Typography>
      
      <Box sx={{ width: '100%', maxWidth: '400px' }}>
        <TextField 
          fullWidth
          value={fleetName} 
          onChange={e => setFleetName(e.target.value)}
          placeholder="Enter fleet name..."
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          variant="standard"
          sx={{ 
            mb: 3,
            '& .MuiInputBase-root': { 
              fontSize: '1.2rem',
              textAlign: 'center',
              '&:before': {
                borderBottomColor: 'rgba(255, 255, 255, 0.42)',
              },
              '&:hover:not(.Mui-disabled):before': {
                borderBottomColor: 'rgba(255, 255, 255, 0.87)',
              },
              '&.Mui-focused:after': {
                borderBottomColor: 'primary.main',
              }
            },
            '& .MuiInputBase-input': {
              padding: '8px 0',
              textAlign: 'center'
            }
          }}
          autoFocus
        />
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Faction</InputLabel>
          <Select 
            value={faction} 
            onChange={e => setFaction(e.target.value)}
            label="Faction"
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '1.1rem',
                padding: '16px 20px',
                textAlign: 'center'
              }
            }}
          >
            {factions ? Object.keys(factions).filter(f => f !== 'Universal').map(f => (
              <MenuItem key={f} value={f}>{f}</MenuItem>
            )) : []}
          </Select>
        </FormControl>
        
        <Button 
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={!fleetName.trim()}
          sx={{ 
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600
          }}
        >
          Start Building
        </Button>
      </Box>
    </Box>
  );
};

export default CreateNewFleetView;
