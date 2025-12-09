import React from 'react';
import { Box, Card, CardContent, Typography, Alert } from '@mui/material';
import { EditorRichText } from '../EditorRichText';

interface ConsultationWorkflowStep9Props {
  traitement: string;
  onTraitementChange: (traitement: string) => void;
}

export const ConsultationWorkflowStep9: React.FC<ConsultationWorkflowStep9Props> = ({
  traitement,
  onTraitementChange,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Étape 9 — Plan de Traitement
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          Incluez les conseils, mesures hygiéno-diététiques, suivi particulier, et restrictions éventuelles.
        </Alert>

        <EditorRichText
          value={traitement}
          onChange={onTraitementChange}
          label="Plan de traitement"
          placeholder="Conseils, mesures hygiéno-diététiques, suivi particulier, restrictions..."
          minRows={6}
          fullWidth
        />
      </CardContent>
    </Card>
  );
};

