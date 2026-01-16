import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Alert, 
  Divider, 
  Button,
  Tabs,
  Tab
} from '@mui/material';
import { Medication, Science, LocalHospital } from '@mui/icons-material';
import { PrescriptionFormModal } from '../PrescriptionFormModal';
import { LabRequestWizard } from '../LabRequestWizard';
import { HospitalisationForm } from '../HospitalisationForm';
import { Patient } from '../../../services/supabase';
import { ConsultationService, LabRequest } from '../../../services/consultationService';
import { LaboratoireIntegrationService } from '../../../services/laboratoireIntegrationService';

interface WorkflowStep10OrdonnanceProps {
  consultationId: string;
  patientId: string;
  patient: Patient;
  onPrescriptionComplete: () => void;
  userId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prescription-tabpanel-${index}`}
      aria-labelledby={`prescription-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const WorkflowStep10Ordonnance: React.FC<WorkflowStep10OrdonnanceProps> = ({
  consultationId,
  patientId,
  patient,
  onPrescriptionComplete,
  userId
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [openPrescription, setOpenPrescription] = useState(false);
  const [openLabRequest, setOpenLabRequest] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSavePrescription = async (lines: any[]) => {
    setLoading(true);
    try {
      await ConsultationService.createPrescription(consultationId, patientId, userId, lines);
      onPrescriptionComplete();
      setOpenPrescription(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la prescription:', error);
      alert('Erreur lors de la sauvegarde de la prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLabRequest = async (request: Partial<LabRequest>) => {
    setLoading(true);
    try {
      // Transformer les données du LabRequestWizard pour createPrescriptionFromConsultation
      const tests = Array.isArray(request.tests) ? request.tests : [];
      const analyses = tests.map((test: any) => ({
        numero: test.code || test.nom?.substring(0, 10) || 'ANALYSE',
        nom: test.nom || test.code || 'Analyse',
        code: test.code || test.nom?.toUpperCase().replace(/\s+/g, '_'),
        prix: test.tarif_base || 0,
        tube: 'Tube standard' // Par défaut, peut être personnalisé
      }));

      // Créer le type d'examen à partir des tests sélectionnés
      const typeExamen = tests.length > 0 
        ? tests.map((t: any) => t.nom || t.code).join(', ')
        : 'Analyse demandée';

      // Utiliser le service d'intégration pour créer la prescription de labo
      await LaboratoireIntegrationService.createPrescriptionFromConsultation(
        consultationId,
        patientId,
        typeExamen,
        request.clinical_info || request.details || '',
        undefined, // prescripteur
        undefined, // servicePrescripteur
        analyses.reduce((sum, a) => sum + a.prix, 0), // montant
        analyses.length > 0 ? analyses : undefined
      );
      setOpenLabRequest(false);
      onPrescriptionComplete();
    } catch (error) {
      console.error('Erreur lors de la création de la demande d\'analyse:', error);
      alert('Erreur lors de la création de la demande d\'analyse');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHospitalisation = async (data: {
    chambre_demandee?: string;
    duree_previsionnelle?: string;
    type_prise_en_charge?: string;
    actes_infirmiers?: string;
  }) => {
    setLoading(true);
    try {
      // Enregistrer l'hospitalisation dans les données de la consultation
      // On peut stocker cela dans consultation_steps ou dans un champ dédié
      await ConsultationService.saveWorkflowStep(
        consultationId,
        10,
        {
          hospitalisation: data
        },
        userId
      );
      onPrescriptionComplete();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'hospitalisation:', error);
      alert('Erreur lors de la sauvegarde de l\'hospitalisation');
    } finally {
      setLoading(false);
    }
  };

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
          Prescription complète : Médicaments, Analyses biologiques et Hospitalisation. 
          Un PDF imprimable sera généré pour chaque prescription.
        </Alert>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab 
              icon={<Medication />} 
              iconPosition="start"
              label="Ordonnance Médicamenteuse" 
            />
            <Tab 
              icon={<Science />} 
              iconPosition="start"
              label="Prescription d'Analyse" 
            />
            <Tab 
              icon={<LocalHospital />} 
              iconPosition="start"
              label="Hospitalisation" 
            />
          </Tabs>
        </Box>

        {/* Tab 1: Ordonnance Médicamenteuse */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Medication />}
              onClick={() => setOpenPrescription(true)}
              sx={{ alignSelf: 'flex-start' }}
              disabled={loading}
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
        </TabPanel>

        {/* Tab 2: Prescription d'Analyse */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Science />}
              onClick={() => setOpenLabRequest(true)}
              sx={{ alignSelf: 'flex-start' }}
              disabled={loading}
            >
              Prescrire des analyses biologiques
            </Button>

            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>
                Prescription d'analyses :
              </Typography>
              <Typography variant="body2">
                • Sélectionnez les examens dans le catalogue • Précisez le contexte clinique • 
                Les analyses seront transmises au module Laboratoire
              </Typography>
            </Alert>
          </Box>
        </TabPanel>

        {/* Tab 3: Hospitalisation */}
        <TabPanel value={activeTab} index={2}>
          <HospitalisationForm
            consultationId={consultationId}
            patientId={patientId}
            onSave={handleSaveHospitalisation}
          />
        </TabPanel>

        {/* Modals */}
        <PrescriptionFormModal
          open={openPrescription}
          onClose={() => setOpenPrescription(false)}
          onSave={handleSavePrescription}
          consultationId={consultationId}
          patientId={patientId}
          patient={patient}
        />

        <LabRequestWizard
          open={openLabRequest}
          onClose={() => setOpenLabRequest(false)}
          onSave={handleSaveLabRequest}
          consultationId={consultationId}
          patientId={patientId}
        />
      </CardContent>
    </Card>
  );
};

