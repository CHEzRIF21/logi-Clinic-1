import React from 'react';
import { Box, Card, CardContent, Typography, Alert } from '@mui/material';
import { EditorRichText } from '../EditorRichText';

interface ConsultationWorkflowStep5Props {
  anamnese: string;
  onAnamneseChange: (anamnese: string) => void;
}

export const ConsultationWorkflowStep5: React.FC<ConsultationWorkflowStep5Props> = ({
  anamnese,
  onAnamneseChange,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Étape 5 — Anamnèse Complète
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          Décrivez l'histoire du motif, les signes associés, les signes négatifs, les traitements antérieurs et l'évolution.
        </Alert>

        <Box sx={{ mb: 2 }}>
          <EditorRichText
            value={anamnese}
            onChange={onAnamneseChange}
            label="Anamnèse"
            placeholder="Historique du motif, signes associés, signes négatifs, traitements antérieurs, évolution..."
            minRows={8}
            fullWidth
          />
        </Box>
      </CardContent>
    </Card>
  );
};

