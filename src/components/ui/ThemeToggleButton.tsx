import React from 'react';
import { IconButton, Tooltip, alpha } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useThemeMode } from '../providers/ThemeProvider';

interface ThemeToggleButtonProps {
  /**
   * Style discret pour la landing page
   */
  discreet?: boolean;
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ discreet = false }) => {
  const { toggleTheme, isDark } = useThemeMode();

  return (
    <Tooltip title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        sx={{
          mr: discreet ? 0 : 1,
          transition: 'all 0.3s ease',
          ...(discreet && {
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
            border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
              transform: 'scale(1.05)',
              boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`,
            },
          }),
          ...(!discreet && {
            '&:hover': {
              transform: 'rotate(15deg) scale(1.1)',
              backgroundColor: 'action.hover',
            },
          }),
        }}
        aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      >
        {isDark ? (
          <LightMode sx={{ fontSize: discreet ? 20 : 24 }} />
        ) : (
          <DarkMode sx={{ fontSize: discreet ? 20 : 24 }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;

