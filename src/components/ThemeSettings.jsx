import React from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  FormControlLabel,
  RadioGroup,
  Radio,
  Paper,
  Stack
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSettings = () => {
  const { currentTheme, switchTheme, themes } = useTheme();

  const handleThemeChange = (event) => {
    switchTheme(event.target.value);
  };

  // Define theme color swatches
  const themeSwatches = {
    default: {
      primary: '#3874cb',
      background: '#181818',
      surface: '#1f1f1f',
      text: '#ffffff'
    },
    vintage: {
      primary: '#ca4a3c',
      background: '#3a3839',
      surface: '#444243',
      text: '#f5f5dc'
    }
  };

  const ColorSwatch = ({ colors }) => (
    <Stack direction="row" spacing={0.5} sx={{ ml: 4, mt: 0.5 }}>
      {Object.entries(colors).map(([name, color]) => (
        <Box
          key={name}
          sx={{
            width: 20,
            height: 20,
            backgroundColor: color,
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
          }}
          title={`${name}: ${color}`}
        />
      ))}
    </Stack>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Theme Settings
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <FormControl component="fieldset">
          <Typography variant="h6" gutterBottom>
            Choose Theme
          </Typography>
          <RadioGroup
            value={currentTheme}
            onChange={handleThemeChange}
            name="theme-selection"
          >
            {Object.entries(themes).map(([key, theme]) => (
              <Box key={key}>
                <FormControlLabel
                  value={key}
                  control={<Radio />}
                  label={theme.name}
                />
                {themeSwatches[key] && (
                  <ColorSwatch colors={themeSwatches[key]} />
                )}
              </Box>
            ))}
          </RadioGroup>
        </FormControl>
        
        <Typography variant="body2" sx={{ mt: 2, opacity: 0.7 }}>
          Choose your preferred theme. Changes are applied immediately and saved automatically.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ThemeSettings;
