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
  Divider,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Description, History, Science, Add, Upload, Visibility } from '@mui/icons-material';
import { Patient } from '../../../services/supabase';
import { ConsultationService, LabRequest } from '../../../services/consultationService';
import { LaboratoireIntegrationService } from '../../../services/laboratoireIntegrationService';
import { PatientBilansHistoryDialog } from './PatientBilansHistoryDialog';
import { EnregistrerBilanAntérieurDialog } from './EnregistrerBilanAntérieurDialog';
import { supabase } from '../../../services/supabase';

interface WorkflowStep7BilansProps {
  patient: Patient;
  consultationId: string;
}

interface BilanAntérieur {
  id: string;
  date_bilan: string;
  type_examen: string;
  tests: string;
  statut: string;
  fichier_url?: string;
}

export const WorkflowStep7Bilans: React.FC<WorkflowStep7BilansProps> = ({
  patient,
  consultationId
}) => {
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [bilansAntérieurs, setBilansAntérieurs] = useState<BilanAntérieur[]>([]);
  const [loading, setLoading] = useState(false);
  const [bilanDialogOpen, setBilanDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  useEffect(() => {
    loadLabRequests();
    loadBilansAntérieurs();
  }, [consultationId, patient.id]);

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

  const loadBilansAntérieurs = async () => {
    try {
      // Charger les prescriptions de laboratoire du patient (bilans antérieurs)
      const { data, error } = await supabase
        .from('lab_prescriptions')
        .select('*')
        .eq('patient_id', patient.id)
        .order('date_prescription', { ascending: false })
        .limit(20);

      if (error) throw error;

      const bilans: BilanAntérieur[] = (data || []).map((prescription: any) => ({
        id: prescription.id,
        date_bilan: prescription.date_prescription,
        type_examen: prescription.type_examen,
        tests: prescription.details || '',
        statut: prescription.statut,
        fichier_url: prescription.details?.includes('Fichier joint:') 
          ? prescription.details.split('Fichier joint:')[1]?.trim()
          : undefined
      }));

      setBilansAntérieurs(bilans);
    } catch (error) {
      console.error('Erreur lors du chargement des bilans antérieurs:', error);
    }
  };

  const handleBilanSaved = () => {
    loadBilansAntérieurs();
    loadLabRequests();
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
                onClick={() => setBilanDialogOpen(true)}
                size="small"
              >
                Enregistrer un bilan antérieur
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
                {bilansAntérieurs.length === 0 && labRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        Aucun bilan disponible
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* Afficher les bilans antérieurs enregistrés */}
                    {bilansAntérieurs.map((bilan) => (
                      <TableRow key={bilan.id}>
                        <TableCell>
                          {new Date(bilan.date_bilan).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{bilan.type_examen}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {bilan.tests}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={bilan.statut}
                            size="small"
                            color={
                              bilan.statut === 'termine' || bilan.statut === 'annule' ? 'success' :
                              bilan.statut === 'preleve' ? 'info' :
                              bilan.statut === 'prescrit' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            {bilan.fichier_url && (
                              <Tooltip title="Voir le fichier">
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(bilan.fichier_url, '_blank')}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Button size="small" startIcon={<Science />}>
                              Détails
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Afficher les demandes de laboratoire de la consultation actuelle */}
                    {labRequests.slice(0, 5).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {new Date(request.created_at || '').toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{request.type_examen || '-'}</TableCell>
                        <TableCell>
                          {Array.isArray(request.tests) ? request.tests.length : 0} test(s)
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.statut || '-'}
                            size="small"
                            color={
                              request.statut === 'termine' ? 'success' :
                              request.statut === 'preleve' ? 'info' :
                              request.statut === 'en_attente' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="small" startIcon={<Science />}>
                            Voir détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
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

        <EnregistrerBilanAntérieurDialog
          open={bilanDialogOpen}
          onClose={() => setBilanDialogOpen(false)}
          patientId={patient.id}
          onSave={handleBilanSaved}
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

