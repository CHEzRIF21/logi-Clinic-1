import React from 'react';
import { Box, Card, CardContent, Typography, Alert, Divider } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import { ConstantesSection } from '../ConstantesSection';
import { ModalExamensCliniques } from '../ModalExamensCliniques';

interface WorkflowStep8ExamenPhysiqueProps {
  consultationId: string;
  patientId: string;
  examensCliniques: any;
  onExamensChange: (examens: any) => void;
  userId: string;
}

export const WorkflowStep8ExamenPhysique: React.FC<WorkflowStep8ExamenPhysiqueProps> = ({
  consultationId,
  patientId,
  examensCliniques,
  onExamensChange,
  userId
}) => {
  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <LocalHospital color="primary" />
            <Typography variant="h6">
              Étape 8 — Examen Physique
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            Constantes Vitales : Poids (kg), Taille (cm), Température (°C), Tension Artérielle (mmHg), Pouls, SpO2.
            L'IMC est calculé automatiquement.
          </Alert>

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
                Examen Systémique : Cœur, Poumons, Abdomen, ORL, etc.
              </Alert>

              <ModalExamensCliniques
                open={false}
                onClose={() => {}}
                onSave={onExamensChange}
                initialExamens={typeof examensCliniques === 'string' ? examensCliniques : JSON.stringify(examensCliniques || {})}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </Box>
  );
};

