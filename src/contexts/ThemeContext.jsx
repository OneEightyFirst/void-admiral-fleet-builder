import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

// Define themes
const themes = {
  default: {
    name: 'Default',
    palette: {
      mode: 'dark',
      primary: {
        main: '#3874cb', // Updated primary blue
      },
      secondary: {
        main: '#f50057',
      },
      background: {
        default: '#181818', // Gray-darker
        paper: '#181818', // Gray-darker
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
    },
  },
  vintage: {
    name: 'Vintage',
    palette: {
      mode: 'dark',
      primary: {
        main: '#ca4a3c', // Vintage red
      },
      secondary: {
        main: '#37277a',
      },
      background: {
        default: '#3a3839', // Vintage gray-darker
        paper: '#3a3839', // Vintage gray-darker
      },
      text: {
        primary: '#e4e2d9', // Cream
        secondary: 'rgba(228, 226, 217, 0.7)', // Cream with opacity
      },
    },
  },
  blinding: {
    name: 'Blinding',
    palette: {
      mode: 'light',
      primary: {
        main: '#3874cb', // Same blue but for light mode
      },
      secondary: {
        main: '#f50057',
      },
      background: {
        default: '#ffffff', // Pure white (reverse of #181818)
        paper: '#ffffff', // Pure white (reverse of #181818)
      },
      text: {
        primary: '#000000', // Pure black (reverse of #ffffff)
        secondary: 'rgba(0, 0, 0, 0.7)', // Black with opacity (reverse of white)
      },
    },
  },
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');

  const switchTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      localStorage.setItem('selectedTheme', themeName);
    }
  };

  // Function to set theme without saving to localStorage (for Firebase sync)
  const setThemeFromPreferences = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Create MUI theme based on current theme
  const muiTheme = createTheme(themes[currentTheme]);

  const value = {
    currentTheme,
    themes,
    switchTheme,
    setThemeFromPreferences,
    muiTheme,
    user: null, // Simplified since theme settings are removed
    isLoading: false,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};