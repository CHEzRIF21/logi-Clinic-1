import React from 'react';
import { Typography, TypographyProps } from '@mui/material';

type Props = TypographyProps & {
  gradient?: string;
};

export const GradientText: React.FC<Props> = ({
  children,
  gradient = 'linear-gradient(90deg, #7C3AED 0%, #06B6D4 100%)',
  sx,
  ...rest
}) => {
  return (
    <Typography
      sx={{
        background: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Typography>
  );
};

export default GradientText;


