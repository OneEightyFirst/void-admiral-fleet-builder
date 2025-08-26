import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

// Theme definitions
const themes = {
  default: {
    name: 'Default Dark',
    palette: {
      mode: 'dark',
      primary: {
        main: '#1976d2',
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
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
        main: '#ca4a3c', // Main red
      },
      secondary: {
        main: '#37277a', // Purple accent (used sparingly)
      },
      background: {
        default: '#343233', // Dark background
        paper: '#3a3839', // Slightly lighter paper
      },
      text: {
        primary: '#e5e2d8', // Cream text
        secondary: 'rgba(229, 226, 216, 0.7)', // Cream with opacity
      },
      divider: 'rgba(229, 226, 216, 0.12)',
      action: {
        hover: 'rgba(202, 74, 60, 0.08)',
        selected: 'rgba(202, 74, 60, 0.12)',
      },
    },
  },
  space: {
    name: 'Space',
    palette: {
      mode: 'dark',
      primary: {
        main: '#64b5f6', // Light blue
      },
      secondary: {
        main: '#ab47bc', // Purple accent
      },
      background: {
        default: 'transparent', // Will show starfield background
        paper: 'rgba(30, 30, 30, 0.85)', // Semi-transparent dark cards
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
      divider: 'rgba(255, 255, 255, 0.12)',
      action: {
        hover: 'rgba(100, 181, 246, 0.08)',
        selected: 'rgba(100, 181, 246, 0.12)',
      },
    },
    customStyles: {
      backgroundImage: 'url(/void-admiral/images/starfield.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      cardShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      cardBackdrop: 'blur(10px)',
    },
  },
};

// Create MUI themes
const muiThemes = Object.fromEntries(
  Object.entries(themes).map(([key, theme]) => [
    key,
    createTheme({
      ...theme,
      shape: { borderRadius: 12 },
      breakpoints: {
        values: {
          xs: 0,
          sm: 600,
          md: 850,  // Custom mobile/desktop breakpoint
          lg: 1200,
          xl: 1536,
        },
      },
    }),
  ])
);

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

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('va_theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage when changed
  useEffect(() => {
    localStorage.setItem('va_theme', currentTheme);
  }, [currentTheme]);

  const switchTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const value = {
    currentTheme,
    themes,
    muiTheme: muiThemes[currentTheme],
    customStyles: themes[currentTheme].customStyles || {},
    switchTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
