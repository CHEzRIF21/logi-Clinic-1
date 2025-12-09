import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Alert, Button } from '@mui/material';
import { Medication, Science, Image, LocalHospital } from '@mui/icons-material';
import { PrescriptionFormModal } from '../PrescriptionFormModal';
import { LabRequestWizard } from '../LabRequestWizard';
import { ImagingRequestWizard } from '../ImagingRequestWizard';
import { ProtocolModal } from '../ProtocolModal';
import { Patient } from '../../../services/supabase';

interface ConsultationWorkflowStep8Props {
  consultationId: string;
  patientId: string;
  onPrescriptionComplete: () => void;
  userId: string;
  patient?: Patient | null;
}

export const ConsultationWorkflowStep8: React.FC<ConsultationWorkflowStep8Props> = ({
  consultationId,
  patientId,
  onPrescriptionComplete,
  userId,
  patient,
}) => {
  const [openPrescription, setOpenPrescription] = useState(false);
  const [openLabRequest, setOpenLabRequest] = useState(false);
  const [openImagingRequest, setOpenImagingRequest] = useState(false);
  const [openProtocol, setOpenProtocol] = useState(false);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Étape 8 — Prescriptions
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          Prescrivez les médicaments, demandez les examens (labo/imagerie), ou créez un protocole d'hospitalisation.
        </Alert>

        <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Medication />}
            onClick={() => setOpenPrescription(true)}
          >
            Prescrire des médicaments
          </Button>
          <Button
            variant="outlined"
            startIcon={<Science />}
            onClick={() => setOpenLabRequest(true)}
          >
            Demande Labo
          </Button>
          <Button
            variant="outlined"
            startIcon={<Image />}
            onClick={() => setOpenImagingRequest(true)}
          >
            Demande Imagerie
          </Button>
          <Button
            variant="outlined"
            startIcon={<LocalHospital />}
            onClick={() => setOpenProtocol(true)}
          >
            Hospitalisation
          </Button>
        </Box>

        <Alert severity="warning">
          <Typography variant="subtitle2" gutterBottom>
            Alertes automatiques:
          </Typography>
          <Typography variant="body2">
            • Rupture de stock • Allergies • Incompatibilités médicamenteuses
          </Typography>
        </Alert>

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

        <LabRequestWizard
          open={openLabRequest}
          onClose={() => setOpenLabRequest(false)}
          onSave={async () => {
            setOpenLabRequest(false);
          }}
          consultationId={consultationId}
          patientId={patientId}
        />

        <ImagingRequestWizard
          open={openImagingRequest}
          onClose={() => setOpenImagingRequest(false)}
          onSave={async () => {
            setOpenImagingRequest(false);
          }}
          consultationId={consultationId}
          patientId={patientId}
        />

        <ProtocolModal
          open={openProtocol}
          onClose={() => setOpenProtocol(false)}
          onSave={async () => {
            setOpenProtocol(false);
          }}
          consultationId={consultationId}
          patientId={patientId}
        />
      </CardContent>
    </Card>
  );
};

