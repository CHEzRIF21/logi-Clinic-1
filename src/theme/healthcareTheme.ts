import { createTheme, Theme } from '@mui/material/styles';

// Palette de couleurs adaptée au secteur de la santé
const healthcareColors = {
  // Bleu médical professionnel - confiance, professionnalisme
  medicalBlue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  // Vert santé - bien-être, croissance
  healthGreen: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  // Blanc propre - hygiène, propreté
  cleanWhite: '#ffffff',
  // Gris doux - calme, sérénité
  softGray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  // Rouge médical - urgence, alertes
  medicalRed: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  // Orange médical - attention, prévention
  medicalOrange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
};

export const createHealthcareTheme = (mode: 'light' | 'dark' = 'light'): Theme => {
  return createTheme({
    palette: {
      mode,
    primary: {
      main: healthcareColors.medicalBlue[600], // #2563eb - Bleu médical professionnel
      light: healthcareColors.medicalBlue[400],
      dark: healthcareColors.medicalBlue[700],
      contrastText: healthcareColors.cleanWhite,
    },
    secondary: {
      main: healthcareColors.healthGreen[600], // #16a34a - Vert santé
      light: healthcareColors.healthGreen[400],
      dark: healthcareColors.healthGreen[700],
      contrastText: healthcareColors.cleanWhite,
    },
    background: {
      default: mode === 'dark' ? '#0a0e1a' : healthcareColors.softGray[50], // Fond très sombre pour le dark mode
      paper: mode === 'dark' ? '#0f172a' : healthcareColors.cleanWhite,
    },
    text: {
      primary: mode === 'dark' ? '#f8fafc' : healthcareColors.softGray[900], // #0f172a
      secondary: mode === 'dark' ? '#cbd5e1' : healthcareColors.softGray[600], // #475569
    },
    error: {
      main: healthcareColors.medicalRed[600], // #dc2626 - Rouge médical maintenu dans les deux modes
      light: healthcareColors.medicalRed[400], // #f87171
      dark: healthcareColors.medicalRed[600], // #dc2626 - Même couleur en dark mode
    },
    warning: {
      main: healthcareColors.medicalOrange[500], // #f97316 - Orange médical maintenu dans les deux modes
      light: healthcareColors.medicalOrange[400], // #fb923c
      dark: healthcareColors.medicalOrange[500], // #f97316 - Même couleur en dark mode
    },
    info: {
      main: healthcareColors.medicalBlue[500], // #3b82f6 - Bleu médical maintenu dans les deux modes
      light: healthcareColors.medicalBlue[400], // #60a5fa
      dark: healthcareColors.medicalBlue[500], // #3b82f6 - Même couleur en dark mode
    },
    success: {
      main: healthcareColors.healthGreen[600], // #16a34a - Vert santé maintenu dans les deux modes
      light: healthcareColors.healthGreen[400], // #4ade80
      dark: healthcareColors.healthGreen[600], // #16a34a - Même couleur en dark mode
    },
    divider: mode === 'dark' ? '#334155' : healthcareColors.softGray[200], // #e2e8f0
    grey: healthcareColors.softGray,
    action: {
      active: mode === 'dark' ? '#f8fafc' : healthcareColors.softGray[900],
      hover: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      selected: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      disabled: mode === 'dark' ? 'rgba(255, 255, 255, 0.26)' : 'rgba(0, 0, 0, 0.26)',
      disabledBackground: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12, // Coins plus arrondis pour un look moderne
  },
  shadows: [
    'none',
    '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 2px 4px -1px rgba(0, 0, 0, 0.06), 0px 4px 5px 0px rgba(0, 0, 0, 0.1)',
    '0px 3px 5px -1px rgba(0, 0, 0, 0.08), 0px 5px 8px 0px rgba(0, 0, 0, 0.12)',
    '0px 3px 5px -1px rgba(0, 0, 0, 0.09), 0px 6px 10px 0px rgba(0, 0, 0, 0.14)',
    '0px 4px 5px -2px rgba(0, 0, 0, 0.1), 0px 7px 10px 1px rgba(0, 0, 0, 0.14)',
    '0px 5px 5px -3px rgba(0, 0, 0, 0.1), 0px 8px 10px 1px rgba(0, 0, 0, 0.14)',
    '0px 5px 6px -3px rgba(0, 0, 0, 0.1), 0px 9px 12px 1px rgba(0, 0, 0, 0.14)',
    '0px 6px 6px -3px rgba(0, 0, 0, 0.1), 0px 10px 14px 1px rgba(0, 0, 0, 0.14)',
    '0px 6px 7px -4px rgba(0, 0, 0, 0.1), 0px 11px 15px 1px rgba(0, 0, 0, 0.14)',
    '0px 7px 8px -4px rgba(0, 0, 0, 0.1), 0px 12px 17px 2px rgba(0, 0, 0, 0.14)',
    '0px 7px 8px -4px rgba(0, 0, 0, 0.1), 0px 13px 19px 2px rgba(0, 0, 0, 0.14)',
    '0px 7px 9px -4px rgba(0, 0, 0, 0.1), 0px 14px 21px 2px rgba(0, 0, 0, 0.14)',
    '0px 8px 9px -5px rgba(0, 0, 0, 0.1), 0px 15px 22px 2px rgba(0, 0, 0, 0.14)',
    '0px 8px 10px -5px rgba(0, 0, 0, 0.1), 0px 16px 24px 2px rgba(0, 0, 0, 0.14)',
    '0px 8px 11px -5px rgba(0, 0, 0, 0.1), 0px 17px 26px 2px rgba(0, 0, 0, 0.14)',
    '0px 9px 11px -5px rgba(0, 0, 0, 0.1), 0px 18px 28px 2px rgba(0, 0, 0, 0.14)',
    '0px 9px 12px -6px rgba(0, 0, 0, 0.1), 0px 19px 29px 2px rgba(0, 0, 0, 0.14)',
    '0px 10px 13px -6px rgba(0, 0, 0, 0.1), 0px 20px 31px 3px rgba(0, 0, 0, 0.14)',
    '0px 10px 14px -6px rgba(0, 0, 0, 0.1), 0px 21px 33px 3px rgba(0, 0, 0, 0.14)',
  ] as any,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: mode === 'dark' ? '#0f172a' : healthcareColors.cleanWhite,
          color: mode === 'dark' ? '#f8fafc' : healthcareColors.softGray[900],
          boxShadow: mode === 'dark' 
            ? '0px 1px 3px 0px rgba(0, 0, 0, 0.5), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)'
            : '0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)',
          border: `1px solid ${mode === 'dark' ? '#334155' : healthcareColors.softGray[200]}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: mode === 'dark'
              ? '0px 4px 6px -1px rgba(0, 0, 0, 0.6), 0px 2px 4px -1px rgba(0, 0, 0, 0.4)'
              : '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
            backgroundColor: mode === 'dark' ? '#0f172a' : healthcareColors.cleanWhite,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: mode === 'dark' ? '#0f172a' : healthcareColors.cleanWhite,
          color: mode === 'dark' ? '#f8fafc' : healthcareColors.softGray[900],
          boxShadow: mode === 'dark'
            ? '0px 1px 3px 0px rgba(0, 0, 0, 0.5), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)'
            : '0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#0f172a' : healthcareColors.cleanWhite,
          color: mode === 'dark' ? '#f8fafc' : healthcareColors.softGray[900],
          boxShadow: mode === 'dark' 
            ? '0px 1px 3px 0px rgba(0, 0, 0, 0.5), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)'
            : '0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)',
          borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : healthcareColors.softGray[200]}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'dark' ? '#0f172a' : healthcareColors.cleanWhite,
          color: mode === 'dark' ? '#f8fafc' : healthcareColors.softGray[900],
          borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : healthcareColors.softGray[200]}`,
          boxShadow: mode === 'dark' 
            ? '2px 0px 8px rgba(0, 0, 0, 0.5)'
            : '2px 0px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          padding: '10px 16px',
          transition: 'all 0.2s ease-in-out',
          color: mode === 'dark' ? '#cbd5e1' : healthcareColors.softGray[900],
          '&:hover': {
            backgroundColor: mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : healthcareColors.medicalBlue[50],
          },
          '&.Mui-selected': {
            backgroundColor: mode === 'dark' ? 'rgba(22, 163, 74, 0.15)' : healthcareColors.healthGreen[100],
            color: mode === 'dark' ? '#4ade80' : healthcareColors.healthGreen[700],
            fontWeight: 600,
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(22, 163, 74, 0.2)' : healthcareColors.healthGreen[100],
            },
            '& .MuiListItemIcon-root': {
              color: mode === 'dark' ? '#4ade80' : healthcareColors.healthGreen[600],
            },
          },
          '& .MuiListItemIcon-root': {
            color: mode === 'dark' ? '#94a3b8' : 'inherit',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: mode === 'dark' ? '#0f172a' : healthcareColors.softGray[50],
            color: mode === 'dark' ? '#f8fafc' : healthcareColors.softGray[900],
            '& fieldset': {
              borderColor: mode === 'dark' ? '#334155' : healthcareColors.softGray[300],
            },
            '&:hover fieldset': {
              borderColor: mode === 'dark' ? '#475569' : healthcareColors.medicalBlue[400],
            },
            '&.Mui-focused': {
              backgroundColor: mode === 'dark' ? '#0f172a' : healthcareColors.cleanWhite,
              '& fieldset': {
                borderColor: mode === 'dark' ? '#60a5fa' : healthcareColors.medicalBlue[600],
                borderWidth: '2px',
              },
            },
            '& input': {
              color: mode === 'dark' ? '#f8fafc' : healthcareColors.softGray[900],
            },
            '& textarea': {
              color: mode === 'dark' ? '#f8fafc' : healthcareColors.softGray[900],
            },
          },
          '& .MuiInputLabel-root': {
            color: mode === 'dark' ? '#94a3b8' : healthcareColors.softGray[600],
            '&.Mui-focused': {
              color: mode === 'dark' ? '#60a5fa' : healthcareColors.medicalBlue[600],
            },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: mode === 'dark' ? '#334155' : healthcareColors.softGray[200],
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.8125rem',
          backgroundColor: mode === 'dark' ? '#334155' : healthcareColors.softGray[100],
          color: mode === 'dark' ? '#f8fafc' : healthcareColors.softGray[900],
          '&.MuiChip-colorPrimary': {
            backgroundColor: mode === 'dark' ? 'rgba(37, 99, 235, 0.25)' : healthcareColors.medicalBlue[100],
            color: mode === 'dark' ? '#60a5fa' : healthcareColors.medicalBlue[700],
            border: mode === 'dark' ? '1px solid rgba(59, 130, 246, 0.4)' : 'none',
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: mode === 'dark' ? 'rgba(22, 163, 74, 0.25)' : healthcareColors.healthGreen[100],
            color: mode === 'dark' ? '#4ade80' : healthcareColors.healthGreen[700],
            border: mode === 'dark' ? '1px solid rgba(34, 197, 94, 0.4)' : 'none',
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: mode === 'dark' ? 'rgba(249, 115, 22, 0.25)' : healthcareColors.medicalOrange[100],
            color: mode === 'dark' ? '#fb923c' : healthcareColors.medicalOrange[700],
            border: mode === 'dark' ? '1px solid rgba(251, 146, 60, 0.4)' : 'none',
          },
          '&.MuiChip-colorError': {
            backgroundColor: mode === 'dark' ? 'rgba(220, 38, 38, 0.25)' : healthcareColors.medicalRed[100],
            color: mode === 'dark' ? '#f87171' : healthcareColors.medicalRed[700],
            border: mode === 'dark' ? '1px solid rgba(248, 113, 113, 0.4)' : 'none',
          },
          '&.MuiChip-colorInfo': {
            backgroundColor: mode === 'dark' ? 'rgba(59, 130, 246, 0.25)' : healthcareColors.medicalBlue[100],
            color: mode === 'dark' ? '#60a5fa' : healthcareColors.medicalBlue[700],
            border: mode === 'dark' ? '1px solid rgba(96, 165, 250, 0.4)' : 'none',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'dark' ? '#0f172a' : healthcareColors.cleanWhite,
          color: mode === 'dark' ? '#f8fafc' : healthcareColors.softGray[900],
          border: `1px solid ${mode === 'dark' ? '#334155' : healthcareColors.softGray[200]}`,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? '#f8fafc' : healthcareColors.softGray[900],
          '&:hover': {
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : healthcareColors.softGray[50],
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'dark' ? '#334155' : healthcareColors.softGray[800],
          color: mode === 'dark' ? '#f8fafc' : healthcareColors.cleanWhite,
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          '& .MuiStepLabel-root .MuiStepLabel-label': {
            color: mode === 'dark' ? '#cbd5e1' : healthcareColors.softGray[700],
          },
          '& .MuiStepLabel-root.Mui-active .MuiStepLabel-label': {
            color: mode === 'dark' ? '#4ade80' : healthcareColors.healthGreen[600],
            fontWeight: 600,
          },
          '& .MuiStepLabel-root.Mui-completed .MuiStepLabel-label': {
            color: mode === 'dark' ? '#86efac' : healthcareColors.healthGreen[700],
            fontWeight: 500,
          },
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        root: {
          '&.Mui-active': {
            '& .MuiStepConnector-line': {
              borderColor: mode === 'dark' ? '#22c55e' : healthcareColors.healthGreen[500],
            },
          },
          '&.Mui-completed': {
            '& .MuiStepConnector-line': {
              borderColor: mode === 'dark' ? '#16a34a' : healthcareColors.healthGreen[600],
            },
          },
        },
        line: {
          borderColor: mode === 'dark' ? '#334155' : healthcareColors.softGray[300],
          borderTopWidth: 2,
        },
      },
    },
  },
  });
};

// Export du thème par défaut (light mode)
export const healthcareTheme = createHealthcareTheme('light');

export default healthcareTheme;

