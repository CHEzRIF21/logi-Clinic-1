import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { createHealthcareTheme } from '../../theme/healthcareTheme';

type ThemeMode = 'light' | 'dark';

interface ThemeModeContextType {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
}

interface ThemeContextType {
  theme: Theme;
}

const THEME_STORAGE_KEY = 'logi-clinic-theme-mode';

// Contexte pour le mode du thème (partagé entre tous les composants)
const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined);

// Contexte pour le thème Material-UI
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook pour accéder au mode du thème
export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return context;
};

// Hook pour accéder au thème Material-UI
export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Récupérer le thème initial depuis localStorage ou préférences système
  const getInitialTheme = (): ThemeMode => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    // Vérifier les préférences système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  };

  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [theme, setTheme] = useState<Theme>(createHealthcareTheme(themeMode));

  // Appliquer le thème au document (classe CSS)
  const applyThemeToDocument = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    const body = document.body;

    if (mode === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }

    // Sauvegarder dans localStorage
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  // Toggle le thème
  const toggleTheme = useCallback(() => {
    setThemeMode((prevMode) => {
      const newMode: ThemeMode = prevMode === 'light' ? 'dark' : 'light';
      applyThemeToDocument(newMode);
      return newMode;
    });
  }, [applyThemeToDocument]);

  // Initialiser le thème au montage (une seule fois)
  useEffect(() => {
    applyThemeToDocument(themeMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre à jour le thème Material-UI quand le mode change
  useEffect(() => {
    setTheme(createHealthcareTheme(themeMode));
  }, [themeMode]);

  // Valeur du contexte pour le mode du thème
  const themeModeContextValue: ThemeModeContextType = {
    themeMode,
    toggleTheme,
    isDark: themeMode === 'dark',
    isLight: themeMode === 'light',
  };

  // Valeur du contexte pour le thème Material-UI
  const themeContextValue: ThemeContextType = {
    theme,
  };

  return (
    <ThemeModeContext.Provider value={themeModeContextValue}>
      <ThemeContext.Provider value={themeContextValue}>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </ThemeContext.Provider>
    </ThemeModeContext.Provider>
  );
};

