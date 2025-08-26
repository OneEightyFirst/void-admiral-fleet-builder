import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
  Stack,
  Paper,
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSettings = () => {
  const { currentTheme, themes, switchTheme } = useTheme();

  const handleThemeChange = (event) => {
    switchTheme(event.target.value);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
        Theme Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Choose your preferred color theme for the application
      </Typography>

      <FormControl component="fieldset">
        <FormLabel component="legend" sx={{ mb: 2, color: 'text.primary', fontWeight: 600 }}>
          Available Themes
        </FormLabel>
        <RadioGroup
          value={currentTheme}
          onChange={handleThemeChange}
        >
          {Object.entries(themes).map(([key, theme]) => (
            <Paper
              key={key}
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                border: currentTheme === key ? 2 : 1,
                borderColor: currentTheme === key ? 'primary.main' : 'divider',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <FormControlLabel
                value={key}
                control={<Radio />}
                label={
                  <Box sx={{ ml: 1, width: '100%' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {theme.name}
                    </Typography>
                    
                    {/* Theme Preview */}
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      {/* Primary Color */}
                      <Box
                        sx={{
                          width: 40,
                          height: 20,
                          backgroundColor: theme.palette.primary.main,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                      {/* Background Color or special pattern for space theme */}
                      <Box
                        sx={{
                          width: 40,
                          height: 20,
                          backgroundColor: key === 'space' ? '#0f1419' : theme.palette.background.default,
                          backgroundImage: key === 'space' ? 'radial-gradient(circle at 20% 50%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 50%, #64b5f6 1px, transparent 1px), radial-gradient(circle at 40% 80%, #ab47bc 1px, transparent 1px)' : 'none',
                          backgroundSize: key === 'space' ? '20px 20px, 15px 15px, 25px 25px' : 'auto',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                      {/* Text Color */}
                      <Box
                        sx={{
                          width: 40,
                          height: 20,
                          backgroundColor: theme.palette.text.primary,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />
                      {/* Secondary Color (if exists) */}
                      {theme.palette.secondary && (
                        <Box
                          sx={{
                            width: 40,
                            height: 20,
                            backgroundColor: theme.palette.secondary.main,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                      )}
                    </Stack>

                    {/* Color Labels */}
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={`Primary: ${theme.palette.primary.main}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Background: ${theme.palette.background.default}`}
                        size="small"
                        variant="outlined"
                      />
                      {theme.palette.secondary && (
                        <Chip
                          label={`Accent: ${theme.palette.secondary.main}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                }
                sx={{ width: '100%', alignItems: 'flex-start' }}
              />
            </Paper>
          ))}
        </RadioGroup>
      </FormControl>

      {/* Current Theme Info */}
      <Paper variant="outlined" sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Current Theme: {themes[currentTheme].name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Theme settings are automatically saved and will persist across sessions.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ThemeSettings;
