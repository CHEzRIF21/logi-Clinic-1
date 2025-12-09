import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

export const ParametresExamensLabo: React.FC = () => {
  return (
    <Box>
      <Alert severity="info">
        Cette section permettra de paramétrer les examens de laboratoire : prix, délais, service concerné, critères de disponibilité.
        (À implémenter - intégration avec le module Laboratoire)
      </Alert>
    </Box>
  );
};

