import React from 'react';
import { Box, BoxProps } from '@mui/material';

type Props = BoxProps & {
  withBorder?: boolean;
};

export const ToolbarBits: React.FC<Props> = ({ children, withBorder = true, sx, ...rest }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        p: 2,
        borderRadius: 2,
        background: (theme) => theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.04)'
          : 'rgba(0,0,0,0.03)',
        border: withBorder ? (theme) => `1px solid ${theme.palette.divider}` : 'none',
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};

export default ToolbarBits;


