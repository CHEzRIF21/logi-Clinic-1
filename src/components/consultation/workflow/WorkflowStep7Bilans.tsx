import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Divider
} from '@mui/material';
import { Description, History, Science, Add } from '@mui/icons-material';
import { Patient } from '../../../services/supabase';
import { ConsultationService, LabRequest } from '../../../services/consultationService';
import { LabRequestWizard } from '../LabRequestWizard';
import { LaboratoireIntegrationService } from '../../../services/laboratoireIntegrationService';
import { PatientBilansHistoryDialog } from './PatientBilansHistoryDialog';

interface WorkflowStep7BilansProps {
  patient: Patient;
  consultationId: string;
}

export const WorkflowStep7Bilans: React.FC<WorkflowStep7BilansProps> = ({
  patient,
  consultationId
}) => {
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  useEffect(() => {
    loadLabRequests();
  }, [consultationId]);

  const loadLabRequests = async () => {
    try {
      setLoading(true);
      const requests = await ConsultationService.getLabRequests(consultationId);
      setLabRequests(requests || []);
    } catch (error) {
      console.error('Erreur lors du chargement des bilans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLabRequest = async (request: Partial<LabRequest>) => {
    try {
      // Utiliser le service d'intégration pour créer la prescription de labo
      await LaboratoireIntegrationService.createPrescriptionFromConsultation(
        consultationId,
        patient.id,
        request.type_examen || 'Analyse demandée',
        request.details || ''
      );
      
      await loadLabRequests();
      setWizardOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      throw error;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Description color="primary" />
          <Typography variant="h6">
            Étape 7 — Bilans Antérieurs
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          Visualisez les fichiers et résultats de laboratoire du patient. Consultez l'historique complet si nécessaire.
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Derniers résultats de laboratoire
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setWizardOpen(true)}
                size="small"
              >
                Créer une demande
              </Button>
              <Button
                variant="outlined"
                startIcon={<History />}
                onClick={() => setHistoryDialogOpen(true)}
                size="small"
              >
                Consulter l'historique
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Tests</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {labRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        Aucun bilan disponible
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  labRequests.slice(0, 5).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{request.type_examen || '-'}</TableCell>
                      <TableCell>
                        {Array.isArray(request.tests) ? request.tests.length : 0} test(s)
                      </TableCell>
                      <TableCell>{request.statut || '-'}</TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<Science />}>
                          Voir détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Fichiers joints
          </Typography>
          <Alert severity="info">
            Les fichiers PDF et images sont disponibles dans le dossier patient.
            <Button
              size="small"
              sx={{ ml: 1 }}
              onClick={() => {
                window.open(`/patients/${patient.id}/fichiers`, '_blank');
              }}
            >
              Ouvrir le dossier fichiers
            </Button>
          </Alert>
        </Box>

        <LabRequestWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onSave={handleCreateLabRequest}
          consultationId={consultationId}
          patientId={patient.id}
        />

        <PatientBilansHistoryDialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          patient={patient}
        />
      </CardContent>
    </Card>
  );
};

