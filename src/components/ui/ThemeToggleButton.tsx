import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useThemeMode } from '../providers/ThemeProvider';

const ThemeToggleButton: React.FC = () => {
  const { toggleTheme, isDark } = useThemeMode();

  return (
    <Tooltip title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        sx={{
          mr: 1,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'rotate(15deg) scale(1.1)',
            backgroundColor: 'action.hover',
          },
        }}
        aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      >
        {isDark ? (
          <LightMode sx={{ fontSize: 24 }} />
        ) : (
          <DarkMode sx={{ fontSize: 24 }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;

