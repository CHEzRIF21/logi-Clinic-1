import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import {
  Medication,
  Science,
  LocalHospital,
  Add,
} from '@mui/icons-material';
import { PrescriptionFormModal } from './PrescriptionFormModal';
import { LabRequestWizard } from './LabRequestWizard';
import { ImagingRequestWizard } from './ImagingRequestWizard';

import { Patient } from '../../services/supabase';

interface PrescriptionsCompleteManagerProps {
  consultationId: string;
  patientId: string;
  userId: string;
  patient?: Patient | null;
  onPrescriptionMedicamenteuseSave: (lines: any[]) => Promise<void>;
  onLabRequestSave: (request: any) => Promise<void>;
  onImagingRequestSave: (request: any) => Promise<void>;
  onHospitalisationSave: (data: any) => Promise<void>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const PrescriptionsCompleteManager: React.FC<PrescriptionsCompleteManagerProps> = ({
  consultationId,
  patientId,
  userId,
  patient,
  onPrescriptionMedicamenteuseSave,
  onLabRequestSave,
  onImagingRequestSave,
  onHospitalisationSave,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [labWizardOpen, setLabWizardOpen] = useState(false);
  const [imagingWizardOpen, setImagingWizardOpen] = useState(false);
  const [hospitalisationDialogOpen, setHospitalisationDialogOpen] = useState(false);

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Medication color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" gutterBottom>
              Prescriptions Médicales
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Prescriptions médicamenteuses, examens et hospitalisation
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Les prescriptions sont automatiquement envoyées aux modules concernés (Pharmacie, Laboratoire, Imagerie) pour traitement et facturation.
        </Alert>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Médicaments" icon={<Medication />} iconPosition="start" />
          <Tab label="Examens" icon={<Science />} iconPosition="start" />
          <Tab label="Hospitalisation" icon={<LocalHospital />} iconPosition="start" />
        </Tabs>

        {/* Prescription Médicamenteuse */}
        <TabPanel value={activeTab} index={0}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Prescription Médicamenteuse
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Recherche des médicaments disponibles en stock, posologie, quantité calculée automatiquement.
              Envoi automatique vers la Pharmacie - Détail pour facturation + délivrance.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setPrescriptionModalOpen(true)}
            >
              Ajouter une prescription médicamenteuse
            </Button>
          </Box>
        </TabPanel>

        {/* Prescription d'Examens */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Examens de Laboratoire
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Liste des examens disponibles avec prix affiché. Envoi automatique vers le Labo.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setLabWizardOpen(true)}
                  fullWidth
                >
                  Demander des examens de laboratoire
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Examens d'Imagerie
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Liste des examens disponibles avec prix et disponibilité de l'appareil.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setImagingWizardOpen(true)}
                  fullWidth
                >
                  Demander des examens d'imagerie
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Hospitalisation */}
        <TabPanel value={activeTab} index={2}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Prescription d'Hospitalisation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Chambre demandée, durée prévisionnelle, type de prise en charge, actes infirmiers associés.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setHospitalisationDialogOpen(true)}
            >
              Prescrire une hospitalisation
            </Button>
          </Box>
        </TabPanel>
      </CardContent>

      {/* Modals */}
      <PrescriptionFormModal
        open={prescriptionModalOpen}
        onClose={() => setPrescriptionModalOpen(false)}
        onSave={onPrescriptionMedicamenteuseSave}
        consultationId={consultationId}
        patientId={patientId}
        patient={patient}
        medecin={{
          nom: 'Médecin',
          prenom: 'Dr.',
          // TODO: Récupérer depuis le contexte utilisateur
        }}
      />

      {labWizardOpen && (
        <LabRequestWizard
          open={labWizardOpen}
          onClose={() => setLabWizardOpen(false)}
          consultationId={consultationId}
          patientId={patientId}
          onSave={onLabRequestSave}
        />
      )}

      {imagingWizardOpen && (
        <ImagingRequestWizard
          open={imagingWizardOpen}
          onClose={() => setImagingWizardOpen(false)}
          consultationId={consultationId}
          patientId={patientId}
          onSave={onImagingRequestSave}
        />
      )}
    </Card>
  );
};

