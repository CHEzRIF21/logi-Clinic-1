import React from 'react';
import { Box, Card, CardContent, Typography, Alert, Divider, Button } from '@mui/material';
import { Medication, PictureAsPdf } from '@mui/icons-material';
import { PrescriptionFormModal } from '../PrescriptionFormModal';
import { Patient } from '../../../services/supabase';

interface WorkflowStep10OrdonnanceProps {
  consultationId: string;
  patientId: string;
  patient: Patient;
  onPrescriptionComplete: () => void;
  userId: string;
}

export const WorkflowStep10Ordonnance: React.FC<WorkflowStep10OrdonnanceProps> = ({
  consultationId,
  patientId,
  patient,
  onPrescriptionComplete,
  userId
}) => {
  const [openPrescription, setOpenPrescription] = React.useState(false);

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Medication color="primary" />
          <Typography variant="h6">
            Étape 10 — Traitement (Ordonnance)
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          Génération de l'ordonnance : Recherche médicament → Sélection → Saisie Posologie (Matin/Midi/Soir) → Durée.
          Un PDF imprimable sera généré.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Medication />}
            onClick={() => setOpenPrescription(true)}
            sx={{ alignSelf: 'flex-start' }}
          >
            Créer une ordonnance
          </Button>

          <Alert severity="warning">
            <Typography variant="subtitle2" gutterBottom>
              Vérifications automatiques :
            </Typography>
            <Typography variant="body2">
              • Allergies du patient • Interactions médicamenteuses • Disponibilité en stock
            </Typography>
          </Alert>
        </Box>

        <PrescriptionFormModal
          open={openPrescription}
          onClose={() => setOpenPrescription(false)}
          onSave={async () => {
            onPrescriptionComplete();
            setOpenPrescription(false);
          }}
          consultationId={consultationId}
          patientId={patientId}
          patient={patient}
        />
      </CardContent>
    </Card>
  );
};

