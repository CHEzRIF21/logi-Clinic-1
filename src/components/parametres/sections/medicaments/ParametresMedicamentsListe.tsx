import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

export const ParametresMedicamentsListe: React.FC = () => {
  return (
    <Box>
      <Alert severity="info">
        Cette section permettra de gérer la liste complète des médicaments, leurs groupes thérapeutiques, stock min/max, etc.
        (À implémenter - intégration avec le module Stock/Pharmacie)
      </Alert>
    </Box>
  );
};

