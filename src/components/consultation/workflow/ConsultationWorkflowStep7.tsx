import React from 'react';
import { Box, Card, CardContent, Typography, Alert, TextField } from '@mui/material';
import { ModalDiagnostics } from '../ModalDiagnostics';

interface ConsultationWorkflowStep7Props {
  diagnostics: string[];
  onDiagnosticsChange: (diagnostics: string[]) => void;
}

export const ConsultationWorkflowStep7: React.FC<ConsultationWorkflowStep7Props> = ({
  diagnostics,
  onDiagnosticsChange,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Étape 7 — Hypothèses Diagnostiques
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          Indiquez le(s) diagnostic(s) probable(s), les diagnostics différentiels, et les examens complémentaires à demander.
        </Alert>

        <Box sx={{ mb: 2 }}>
          <ModalDiagnostics
            open={false}
            onClose={() => {}}
            onSave={onDiagnosticsChange}
            initialDiagnostics={diagnostics}
            suggestions={[]}
          />
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Examens complémentaires à demander"
          placeholder="Listez les examens complémentaires nécessaires..."
          helperText="Ces examens seront demandés dans les étapes suivantes"
        />
      </CardContent>
    </Card>
  );
};

