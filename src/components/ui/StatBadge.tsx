import React from 'react';
import { Box, Typography, BoxProps } from '@mui/material';

type Props = BoxProps & {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'info' | 'error' | 'secondary';
};

export const StatBadge: React.FC<Props> = ({ label, value, icon, color = 'primary', sx, ...rest }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 2,
        background: (theme) => {
          if (theme.palette.mode === 'dark') {
            // Couleurs plus vives et visibles en dark mode
            const opacityMap: Record<string, string> = {
              primary: 'rgba(59, 130, 246, 0.35)',
              success: 'rgba(34, 197, 94, 0.35)',
              warning: 'rgba(251, 146, 60, 0.35)',
              info: 'rgba(96, 165, 250, 0.35)',
              error: 'rgba(248, 113, 113, 0.35)',
              secondary: 'rgba(34, 197, 94, 0.35)',
            };
            return opacityMap[color] || `rgba(59, 130, 246, 0.35)`;
          }
          return theme.palette[color].main + '11';
        },
        border: (theme) => {
          if (theme.palette.mode === 'dark') {
            const borderMap: Record<string, string> = {
              primary: 'rgba(59, 130, 246, 0.7)',
              success: 'rgba(34, 197, 94, 0.7)',
              warning: 'rgba(251, 146, 60, 0.7)',
              info: 'rgba(96, 165, 250, 0.7)',
              error: 'rgba(248, 113, 113, 0.7)',
              secondary: 'rgba(34, 197, 94, 0.7)',
            };
            return `2px solid ${borderMap[color] || 'rgba(59, 130, 246, 0.7)'}`;
          }
          return `1px solid ${theme.palette.divider}`;
        },
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          backgroundColor: (theme) => {
            if (theme.palette.mode === 'dark') {
              // Hover avec faible opacité en dark mode
              const hoverMap: Record<string, string> = {
                primary: 'rgba(37, 99, 235, 0.15)',
                success: 'rgba(22, 163, 74, 0.15)',
                warning: 'rgba(249, 115, 22, 0.15)',
                info: 'rgba(59, 130, 246, 0.15)',
                error: 'rgba(220, 38, 38, 0.15)',
                secondary: 'rgba(22, 163, 74, 0.15)',
              };
              return hoverMap[color] || 'rgba(37, 99, 235, 0.15)';
            }
            return theme.palette[color].main + '15';
          },
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? `0 4px 12px ${theme.palette[color].main}15`
            : `0 4px 12px ${theme.palette[color].main}20`,
        },
        ...sx,
      }}
      {...rest}
    >
      <Box 
        sx={{ 
          color: (theme) => {
            // Couleurs vives même en dark mode
            if (theme.palette.mode === 'dark') {
              const colorMap: Record<string, string> = {
                primary: '#60a5fa',
                success: '#4ade80',
                warning: '#fb923c',
                info: '#60a5fa',
                error: '#f87171',
                secondary: '#4ade80',
              };
              return colorMap[color] || '#60a5fa';
            }
            return theme.palette[color].main;
          }, 
          display: 'grid', 
          placeItems: 'center',
          fontSize: '2rem',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography 
          variant="h5" 
          sx={{ 
            lineHeight: 1.1,
            fontWeight: 700,
            color: (theme) => {
              if (theme.palette.mode === 'dark') {
                const textColorMap: Record<string, string> = {
                  primary: '#93c5fd',
                  success: '#86efac',
                  warning: '#fdba74',
                  info: '#93c5fd',
                  error: '#fca5a5',
                  secondary: '#86efac',
                };
                return textColorMap[color] || '#93c5fd';
              }
              return theme.palette[color].main;
            },
          }}
        >
          {value}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{
            color: (theme) => {
              if (theme.palette.mode === 'dark') {
                const labelColorMap: Record<string, string> = {
                  primary: '#93c5fd',
                  success: '#86efac',
                  warning: '#fdba74',
                  info: '#93c5fd',
                  error: '#fca5a5',
                  secondary: '#86efac',
                };
                return labelColorMap[color] || '#cbd5e1';
              }
              return 'text.secondary';
            },
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatBadge;


