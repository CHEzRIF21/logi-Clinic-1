import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  useTheme,
  Divider,
} from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface ModernCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  sx?: SxProps<Theme>;
}

const ModernCard: React.FC<ModernCardProps> = ({
  title,
  subtitle,
  children,
  action,
  variant = 'default',
  sx,
}) => {
  const theme = useTheme();

  const variantStyles = {
    default: {
      boxShadow: '0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)',
      border: `1px solid ${theme.palette.divider}`,
    },
    elevated: {
      boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: 'none',
    },
    outlined: {
      boxShadow: 'none',
      border: `2px solid ${theme.palette.divider}`,
    },
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        ...variantStyles[variant],
        ...sx,
      }}
    >
      {(title || action) && (
        <>
          <CardHeader
            title={
              title && (
                <Typography variant="h6" fontWeight={600}>
                  {title}
                </Typography>
              )
            }
            subheader={subtitle}
            action={action}
            sx={{
              pb: subtitle ? 1 : 2,
              '& .MuiCardHeader-action': {
                m: 0,
              },
            }}
          />
          <Divider />
        </>
      )}
      <CardContent sx={{ p: 3 }}>{children}</CardContent>
    </Card>
  );
};

export default ModernCard;

