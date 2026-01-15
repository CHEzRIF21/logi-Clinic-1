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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeProvider.tsx:49',message:'ThemeProvider mounted',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  // Récupérer le thème initial depuis localStorage ou préférences système
  const getInitialTheme = (): ThemeMode => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }

      // Vérifier les préférences système
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }

      return 'light';
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeProvider.tsx:63',message:'ERROR: getInitialTheme failed',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return 'light';
    }
  };

  let initialTheme: ThemeMode;
  try {
    initialTheme = getInitialTheme();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeProvider.tsx:72',message:'Initial theme determined',data:{theme:initialTheme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeProvider.tsx:76',message:'ERROR: Failed to get initial theme',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    initialTheme = 'light';
  }

  let themeInstance: Theme;
  try {
    themeInstance = createHealthcareTheme(initialTheme);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeProvider.tsx:84',message:'Theme created successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeProvider.tsx:88',message:'ERROR: Failed to create theme',data:{error:error?.message,stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    throw error;
  }

  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme);
  const [theme, setTheme] = useState<Theme>(themeInstance);

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

