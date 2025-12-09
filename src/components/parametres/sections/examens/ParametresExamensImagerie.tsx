import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

export const ParametresExamensImagerie: React.FC = () => {
  return (
    <Box>
      <Alert severity="info">
        Cette section permettra de paramétrer les examens d'imagerie : prix, délais, disponibilité équipement, etc.
        (À implémenter - intégration avec le module Imagerie)
      </Alert>
    </Box>
  );
};

