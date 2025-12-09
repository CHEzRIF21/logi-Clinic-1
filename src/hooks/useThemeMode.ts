import { useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'logi-clinic-theme-mode';

export const useThemeMode = () => {
  // Récupérer le thème depuis localStorage ou préférences système
  const getInitialTheme = (): ThemeMode => {
    // Vérifier localStorage d'abord
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    // Sinon, vérifier les préférences système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  };

  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);

  // Appliquer le thème au document
  const applyTheme = useCallback((mode: ThemeMode) => {
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
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    applyTheme(newMode);
  }, [themeMode, applyTheme]);

  // Initialiser le thème au montage
  useEffect(() => {
    applyTheme(themeMode);

    // Écouter les changements de préférences système (seulement si pas de préférence sauvegardée)
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const newMode: ThemeMode = e.matches ? 'dark' : 'light';
        setThemeMode(newMode);
        applyTheme(newMode);
      };

      // Support moderne et ancien
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        mediaQuery.addListener(handleChange);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else {
          mediaQuery.removeListener(handleChange);
        }
      };
    }
  }, [themeMode, applyTheme]);

  return {
    themeMode,
    toggleTheme,
    isDark: themeMode === 'dark',
    isLight: themeMode === 'light',
  };
};

