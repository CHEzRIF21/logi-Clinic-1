import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  useTheme,
} from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  sx?: SxProps<Theme>;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  subtitle,
  sx,
}) => {
  const theme = useTheme();

  const colorMap = theme.palette.mode === 'dark' ? {
    primary: '#60a5fa',
    secondary: '#4ade80',
    success: '#4ade80',
    warning: '#fb923c',
    error: '#f87171',
    info: '#60a5fa',
  } : {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const bgColorMap = theme.palette.mode === 'dark' ? {
    primary: 'rgba(59, 130, 246, 0.35)',
    secondary: 'rgba(34, 197, 94, 0.35)',
    success: 'rgba(34, 197, 94, 0.35)',
    warning: 'rgba(251, 146, 60, 0.35)',
    error: 'rgba(248, 113, 113, 0.35)',
    info: 'rgba(96, 165, 250, 0.35)',
  } : {
    primary: theme.palette.primary.light + '20',
    secondary: theme.palette.secondary.light + '20',
    success: theme.palette.success.light + '20',
    warning: theme.palette.warning.light + '20',
    error: theme.palette.error.light + '20',
    info: theme.palette.info.light + '20',
  };

  return (
    <Card
      sx={{
        height: '100%',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${bgColorMap[color]} 0%, ${theme.palette.background.paper} 100%)`
          : `linear-gradient(135deg, ${bgColorMap[color]} 0%, ${theme.palette.background.paper} 100%)`,
        border: theme.palette.mode === 'dark'
          ? `2px solid ${colorMap[color]}80`
          : `1px solid ${theme.palette.divider}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          backgroundColor: theme.palette.mode === 'dark'
            ? (() => {
                const hoverBgMap: Record<string, string> = {
                  primary: 'rgba(59, 130, 246, 0.35)',
                  secondary: 'rgba(34, 197, 94, 0.35)',
                  success: 'rgba(34, 197, 94, 0.35)',
                  warning: 'rgba(251, 146, 60, 0.35)',
                  error: 'rgba(248, 113, 113, 0.35)',
                  info: 'rgba(96, 165, 250, 0.35)',
                };
                return `linear-gradient(135deg, ${hoverBgMap[color] || 'rgba(59, 130, 246, 0.35)'} 0%, ${theme.palette.background.paper} 100%)`;
              })()
            : undefined,
          boxShadow: theme.palette.mode === 'dark'
            ? `0 8px 16px ${colorMap[color]}15`
            : theme.shadows[4],
        },
        ...sx,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box flex={1}>
            <Typography
              variant="body2"
              fontWeight={500}
              gutterBottom
              sx={{ 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px', 
                fontSize: '0.75rem',
                color: (theme) => theme.palette.mode === 'dark' 
                  ? `${colorMap[color]}CC`
                  : 'text.secondary',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                color: colorMap[color],
                mb: subtitle ? 0.5 : 1,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                sx={{
                  color: (theme) => theme.palette.mode === 'dark' 
                    ? `${colorMap[color]}AA`
                    : 'text.secondary',
                }}
              >
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                <Typography
                  variant="caption"
                  sx={{
                    color: (theme) => theme.palette.mode === 'dark'
                      ? trend.isPositive 
                        ? '#4ade80' 
                        : '#f87171'
                      : trend.isPositive 
                        ? theme.palette.success.main 
                        : theme.palette.error.main,
                    fontWeight: 600,
                  }}
                >
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    ml: 0.5,
                    color: (theme) => theme.palette.mode === 'dark' 
                      ? '#94a3b8'
                      : 'text.secondary',
                  }}
                >
                  vs mois dernier
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: colorMap[color],
              width: 56,
              height: 56,
              boxShadow: theme.palette.mode === 'dark'
                ? `0 4px 12px ${colorMap[color]}60`
                : `0 4px 12px ${colorMap[color]}40`,
              color: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;

