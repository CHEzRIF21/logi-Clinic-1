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
  Chip,
  Alert,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Vaccines, BugReport, Add, Warning } from '@mui/icons-material';
import { Patient } from '../../../services/supabase';
import { VaccinationService, PatientVaccination } from '../../../services/vaccinationService';
import { DeparasitageService, Deparasitage } from '../../../services/deparasitageService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WorkflowStep5PreventionProps {
  patient: Patient;
}

export const WorkflowStep5Prevention: React.FC<WorkflowStep5PreventionProps> = ({
  patient
}) => {
  const [vaccinations, setVaccinations] = useState<PatientVaccination[]>([]);
  const [deparasitages, setDeparasitages] = useState<Deparasitage[]>([]);
  const [loading, setLoading] = useState(false);
  const [deparasitageDialogOpen, setDeparasitageDialogOpen] = useState(false);
  const [newDeparasitage, setNewDeparasitage] = useState({ molecule: '', date_administration: '' });

  useEffect(() => {
    loadData();
  }, [patient.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vaccData, deparasitageData] = await Promise.all([
        VaccinationService.getPatientCard(patient.id),
        DeparasitageService.getPatientDeparasitage(patient.id)
      ]);
      setVaccinations(vaccData.doses || []);
      setDeparasitages(deparasitageData || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeparasitage = async () => {
    if (!newDeparasitage.molecule || !newDeparasitage.date_administration) return;

    try {
      await DeparasitageService.recordDeparasitage({
        patient_id: patient.id,
        molecule: newDeparasitage.molecule,
        date_administration: newDeparasitage.date_administration
      });
      await loadData();
      setDeparasitageDialogOpen(false);
      setNewDeparasitage({ molecule: '', date_administration: '' });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
    }
  };

  const isVaccinEnRetard = (vaccination: PatientVaccination) => {
    // Logique simplifiée pour détecter les vaccins en retard
    // À adapter selon les règles métier
    return false;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Vaccines color="primary" />
          <Typography variant="h6">
            Étape 5 — Prévention (Vaccination & Déparasitage)
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          Suivi des vaccinations et déparasitages. Les alertes visuelles indiquent les vaccins en retard.
        </Alert>

        <Box sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Vaccinations
            </Typography>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vaccin</TableCell>
                  <TableCell>Dose</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Rappel</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vaccinations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        Aucune vaccination enregistrée
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  vaccinations.map((vacc) => (
                    <TableRow key={vacc.id}>
                      <TableCell>{vacc.vaccine_id}</TableCell>
                      <TableCell>Dose {vacc.dose_ordre}</TableCell>
                      <TableCell>
                        {format(new Date(vacc.date_administration), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        {isVaccinEnRetard(vacc) ? (
                          <Chip
                            icon={<Warning />}
                            label="En retard"
                            color="error"
                            size="small"
                          />
                        ) : (
                          <Chip label="À jour" color="success" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Déparasitage
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Add />}
              onClick={() => setDeparasitageDialogOpen(true)}
            >
              Ajouter
            </Button>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Molécule</TableCell>
                  <TableCell>Date d'administration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deparasitages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      <Typography color="text.secondary">
                        Aucun déparasitage enregistré
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  deparasitages.map((dep) => (
                    <TableRow key={dep.id}>
                      <TableCell>{dep.molecule}</TableCell>
                      <TableCell>
                        {format(new Date(dep.date_administration), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Dialog open={deparasitageDialogOpen} onClose={() => setDeparasitageDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Ajouter un déparasitage</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                fullWidth
                label="Molécule"
                value={newDeparasitage.molecule}
                onChange={(e) => setNewDeparasitage({ ...newDeparasitage, molecule: e.target.value })}
                required
              />
              <TextField
                fullWidth
                type="date"
                label="Date d'administration"
                value={newDeparasitage.date_administration}
                onChange={(e) => setNewDeparasitage({ ...newDeparasitage, date_administration: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeparasitageDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleAddDeparasitage}
              variant="contained"
              disabled={!newDeparasitage.molecule || !newDeparasitage.date_administration}
            >
              Ajouter
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

