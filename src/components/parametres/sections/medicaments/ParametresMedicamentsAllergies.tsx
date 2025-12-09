import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

export const ParametresMedicamentsAllergies: React.FC = () => {
  return (
    <Box>
      <Alert severity="info">
        Cette section permettra de gérer le mapping médicament ↔ molécule pour les alertes d'allergies.
        (À implémenter)
      </Alert>
    </Box>
  );
};

