import React from 'react';
import { Box, Card, CardContent, Typography, Alert } from '@mui/material';
import { ConstantesSection } from '../ConstantesSection';
import { ModalExamensCliniques } from '../ModalExamensCliniques';

interface ConsultationWorkflowStep6Props {
  consultationId: string;
  patientId: string;
  examensCliniques: any;
  onExamensChange: (examens: any) => void;
  userId: string;
}

export const ConsultationWorkflowStep6: React.FC<ConsultationWorkflowStep6Props> = ({
  consultationId,
  patientId,
  examensCliniques,
  onExamensChange,
  userId,
}) => {
  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Étape 6 — Examen Clinique
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              6.1 Signes vitaux
            </Typography>
            Température, Tension artérielle, Poids, Taille, IMC (calcul automatique), Saturation O₂, FC, FR
          </Alert>
        </CardContent>
      </Card>

      <ConstantesSection
        consultationId={consultationId}
        patientId={patientId}
        initialConstantes={null}
        patientConstantes={undefined}
        onSave={async () => {}}
        userId={userId}
      />

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              6.2 Examen physique par appareil
            </Typography>
            Respiratoire, Digestif, Cardio-vasculaire, Système nerveux, Appareil locomoteur, Examen général
          </Alert>

          <ModalExamensCliniques
            open={false}
            onClose={() => {}}
            onSave={onExamensChange}
            initialExamens={typeof examensCliniques === 'string' ? examensCliniques : JSON.stringify(examensCliniques || {})}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

