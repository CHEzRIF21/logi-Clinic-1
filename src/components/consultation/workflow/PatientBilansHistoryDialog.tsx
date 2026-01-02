import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import { Close, Science, Description, Download } from '@mui/icons-material';
import { Patient } from '../../../services/supabase';
import { supabase } from '../../../services/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LabPrescription {
  id: string;
  patient_id: string;
  type_examen: string;
  details?: string;
  date_prescription: string;
  statut: string;
  prescripteur?: string;
  service_prescripteur?: string;
  montant_total?: number;
  consultation_id?: string;
}

interface LabRapport {
  id: string;
  prelevement_id: string;
  numero_rapport: string;
  statut: string;
  date_generation: string;
  signe_par?: string;
}

interface PatientBilansHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  patient: Patient;
}

export const PatientBilansHistoryDialog: React.FC<PatientBilansHistoryDialogProps> = ({
  open,
  onClose,
  patient,
}) => {
  const [prescriptions, setPrescriptions] = useState<LabPrescription[]>([]);
  const [rapports, setRapports] = useState<LabRapport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && patient?.id) {
      loadBilansHistory();
    }
  }, [open, patient?.id]);

  const loadBilansHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les prescriptions de laboratoire
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('lab_prescriptions')
        .select('*')
        .eq('patient_id', patient.id)
        .order('date_prescription', { ascending: false })
        .limit(50);

      if (prescriptionsError) {
        throw prescriptionsError;
      }

      setPrescriptions(prescriptionsData || []);

      // Charger les rapports de laboratoire
      if (prescriptionsData && prescriptionsData.length > 0) {
        const prescriptionIds = prescriptionsData.map(p => p.id);
        
        // Récupérer les prélèvements liés
        const { data: prelevementsData } = await supabase
          .from('lab_prelevements')
          .select('id, prescription_id')
          .in('prescription_id', prescriptionIds);

        if (prelevementsData && prelevementsData.length > 0) {
          const prelevementIds = prelevementsData.map(p => p.id);
          
          const { data: rapportsData, error: rapportsError } = await supabase
            .from('lab_rapports')
            .select('*')
            .in('prelevement_id', prelevementIds)
            .order('date_generation', { ascending: false });

          if (!rapportsError && rapportsData) {
            setRapports(rapportsData);
          }
        }
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement de l\'historique:', err);
      setError(err.message || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'termine':
      case 'signe':
        return 'success';
      case 'preleve':
      case 'en_cours':
        return 'warning';
      case 'annule':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'prescrit':
        return 'Prescrit';
      case 'preleve':
        return 'Prélevé';
      case 'termine':
        return 'Terminé';
      case 'signe':
        return 'Signé';
      case 'annule':
        return 'Annulé';
      default:
        return statut;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Science color="primary" />
            <Typography variant="h6">
              Historique des Bilans - {patient.prenom} {patient.nom}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Prescriptions de Laboratoire ({prescriptions.length})
            </Typography>

            {prescriptions.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Aucune prescription de laboratoire trouvée pour ce patient.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type d'examen</TableCell>
                      <TableCell>Prescripteur</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Montant</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prescriptions.map((prescription) => (
                      <TableRow key={prescription.id} hover>
                        <TableCell>
                          {format(new Date(prescription.date_prescription), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {prescription.type_examen}
                          </Typography>
                          {prescription.details && (
                            <Typography variant="caption" color="text.secondary">
                              {prescription.details.substring(0, 50)}...
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {prescription.prescripteur || '-'}
                          {prescription.service_prescripteur && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {prescription.service_prescripteur}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(prescription.statut)}
                            color={getStatusColor(prescription.statut) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {prescription.montant_total
                            ? `${prescription.montant_total.toLocaleString('fr-FR')} XOF`
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Rapports Disponibles ({rapports.length})
            </Typography>

            {rapports.length === 0 ? (
              <Alert severity="info">
                Aucun rapport de laboratoire disponible pour ce patient.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Numéro de rapport</TableCell>
                      <TableCell>Date de génération</TableCell>
                      <TableCell>Signé par</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rapports.map((rapport) => (
                      <TableRow key={rapport.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {rapport.numero_rapport}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {format(new Date(rapport.date_generation), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell>{rapport.signe_par || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(rapport.statut)}
                            color={getStatusColor(rapport.statut) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

