import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        loadUserTheme(user.uid);
      } else {
        loadLocalTheme();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load theme from localStorage (for non-authenticated users)
  const loadLocalTheme = () => {
    const savedTheme = localStorage.getItem('va_theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  };

  // Load theme from Firebase (for authenticated users)
  const loadUserTheme = async (userId) => {
    try {
      const userPrefsRef = doc(db, 'userPreferences', userId);
      const userPrefsSnap = await getDoc(userPrefsRef);
      
      if (userPrefsSnap.exists()) {
        const prefs = userPrefsSnap.data();
        if (prefs.theme && themes[prefs.theme]) {
          setCurrentTheme(prefs.theme);
          return;
        }
      }
      
      // If no Firebase theme found, check localStorage as fallback
      loadLocalTheme();
    } catch (error) {
      console.error('Failed to load user theme:', error);
      loadLocalTheme();
    }
  };

  // Save theme to Firebase (for authenticated users) or localStorage
  const saveTheme = async (themeName) => {
    if (user) {
      try {
        const userPrefsRef = doc(db, 'userPreferences', user.uid);
        await setDoc(userPrefsRef, { theme: themeName }, { merge: true });
      } catch (error) {
        console.error('Failed to save theme to Firebase:', error);
        // Fallback to localStorage if Firebase fails
        localStorage.setItem('va_theme', themeName);
      }
    } else {
      // Save to localStorage for non-authenticated users
      localStorage.setItem('va_theme', themeName);
    }
  };

  const switchTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      saveTheme(themeName);
    }
  };

  const value = {
    currentTheme,
    themes,
    muiTheme: muiThemes[currentTheme],
    customStyles: themes[currentTheme].customStyles || {},
    switchTheme,
    isLoading,
    user,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
