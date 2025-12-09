import React from 'react';
import { Card, CardProps } from '@mui/material';

type Props = CardProps & {
  blur?: number;
  borderOpacity?: number;
};

export const GlassCard: React.FC<Props> = ({
  children,
  blur = 10,
  borderOpacity = 0.12,
  sx,
  ...rest
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        backdropFilter: `saturate(1.2) blur(${blur}px)`,
        background: (theme) => theme.palette.mode === 'dark'
          ? 'rgba(15, 23, 42, 0.8)'
          : 'rgba(255,255,255,0.65)',
        border: (theme) => theme.palette.mode === 'dark'
          ? `1px solid rgba(51, 65, 85, 0.5)`
          : `1px solid ${theme.palette.divider}`,
        boxShadow: (theme) => theme.palette.mode === 'dark'
          ? '0 10px 30px rgba(0,0,0,0.5)'
          : '0 10px 25px rgba(0,0,0,0.08)',
        borderColor: (theme) => theme.palette.mode === 'dark'
          ? `rgba(51, 65, 85, 0.5)`
          : `rgba(0,0,0,${borderOpacity})`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Card>
  );
};

export default GlassCard;


