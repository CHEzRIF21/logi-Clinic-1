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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Vaccines, BugReport, Add, Warning } from '@mui/icons-material';
import { Patient } from '../../../services/supabase';
import { VaccinationService, PatientVaccination, Vaccine, VaccineSchedule } from '../../../services/vaccinationService';
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
  
  // États pour le dialogue de vaccination
  const [vaccinationDialogOpen, setVaccinationDialogOpen] = useState(false);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [allSchedules, setAllSchedules] = useState<VaccineSchedule[]>([]); // Tous les schedules pour l'affichage
  const [newVaccination, setNewVaccination] = useState({
    vaccine_libelle: '', // Nom du vaccin (saisie libre)
    dose_ordre: 1,
    date_administration: new Date().toISOString().split('T')[0],
    date_rappel: '', // Date de rappel
    statut: 'valide' as 'valide' | 'annule',
    lieu: '',
    numero_lot: '',
    vaccinateur: ''
  });

  useEffect(() => {
    loadData();
    loadVaccines();
  }, [patient.id]);

  const loadVaccines = async () => {
    try {
      const vaccinesList = await VaccinationService.listVaccines();
      setVaccines(vaccinesList);
      
      // Charger tous les schedules de tous les vaccins pour l'affichage
      const allSchedulesPromises = vaccinesList.map(vaccine => 
        VaccinationService.getVaccineSchedules(vaccine.id)
      );
      const allSchedulesResults = await Promise.all(allSchedulesPromises);
      const flattenedSchedules = allSchedulesResults.flat();
      setAllSchedules(flattenedSchedules);
    } catch (error) {
      console.error('Erreur lors du chargement des vaccins:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les vaccinations et déparasitages indépendamment pour éviter qu'une erreur bloque l'autre
      const loadVaccinations = async () => {
        try {
          const vaccData = await VaccinationService.getPatientCard(patient.id);
          setVaccinations(vaccData.doses || []);
        } catch (error) {
          console.error('Erreur lors du chargement des vaccinations:', error);
          setVaccinations([]);
        }
      };

      const loadDeparasitages = async () => {
        try {
          const deparasitageData = await DeparasitageService.getPatientDeparasitage(patient.id);
          setDeparasitages(deparasitageData || []);
        } catch (error) {
          console.error('Erreur lors du chargement des déparasitages:', error);
          // Ne pas bloquer l'application si le service de déparasitage n'est pas disponible
          setDeparasitages([]);
        }
      };

      // Charger les deux services en parallèle mais indépendamment
      await Promise.allSettled([loadVaccinations(), loadDeparasitages()]);
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

  const handleAddVaccination = async () => {
    if (!newVaccination.vaccine_libelle || !newVaccination.date_administration) {
      alert('Veuillez saisir le nom du vaccin et la date d\'administration');
      return;
    }

    setLoading(true);
    try {
      // Trouver ou créer le vaccin à partir du libellé
      const vaccine = await VaccinationService.findOrCreateVaccine(newVaccination.vaccine_libelle);
      
      // Recharger la liste des vaccins pour l'affichage
      await loadVaccines();
      
      // Enregistrer la vaccination
      const vaccinationRecorded = await VaccinationService.recordDose({
        patient_id: patient.id,
        vaccine_id: vaccine.id,
        schedule_id: null, // Pas de schedule pour les enregistrements directs
        dose_ordre: newVaccination.dose_ordre,
        date_administration: newVaccination.date_administration,
        lieu: newVaccination.lieu || undefined,
        numero_lot: newVaccination.numero_lot || undefined,
        vaccinateur: newVaccination.vaccinateur || undefined,
        statut: newVaccination.statut
      } as any);

      // Planifier un rappel si une date de rappel est fournie
      if (newVaccination.date_rappel) {
        try {
          await VaccinationService.scheduleReminder({
            patient_id: patient.id,
            vaccine_id: vaccine.id,
            schedule_id: null,
            dose_ordre: newVaccination.dose_ordre + 1,
            planned_at: new Date(newVaccination.date_rappel).toISOString(),
            channel: 'sms',
            statut: 'planifie',
            details: 'Rappel vaccination'
          } as any);
        } catch (reminderError) {
          console.warn('Erreur lors de la planification du rappel:', reminderError);
          // Ne pas bloquer le processus si le rappel échoue
        }
      }

      // Recharger les données et fermer le dialog
      await loadData();
      
      // Réinitialiser le formulaire
      setNewVaccination({
        vaccine_libelle: '',
        dose_ordre: 1,
        date_administration: new Date().toISOString().split('T')[0],
        date_rappel: '',
        statut: 'valide',
        lieu: '',
        numero_lot: '',
        vaccinateur: ''
      });
      
      // Fermer le dialog
      setVaccinationDialogOpen(false);
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement de la vaccination:', error);
      const errorMessage = error?.message || 'Erreur lors de l\'enregistrement de la vaccination. Veuillez réessayer.';
      alert(errorMessage);
    } finally {
      setLoading(false);
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
            <Button
              variant="outlined"
              size="small"
              startIcon={<Add />}
              onClick={() => {
                // Réinitialiser le formulaire avant d'ouvrir le dialog
                setNewVaccination({
                  vaccine_libelle: '',
                  dose_ordre: 1,
                  date_administration: new Date().toISOString().split('T')[0],
                  date_rappel: '',
                  statut: 'valide',
                  lieu: '',
                  numero_lot: '',
                  vaccinateur: ''
                });
                setVaccinationDialogOpen(true);
              }}
              disabled={loading}
            >
              Ajouter
            </Button>
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
                  vaccinations.map((vacc) => {
                    const vaccine = vaccines.find(v => v.id === vacc.vaccine_id);
                    const schedule = allSchedules.find(s => s.id === vacc.schedule_id);
                    return (
                      <TableRow key={vacc.id}>
                        <TableCell>{vaccine?.libelle || vacc.vaccine_id}</TableCell>
                        <TableCell>Dose {vacc.dose_ordre}{schedule ? ` - ${schedule.libelle_dose}` : ''}</TableCell>
                        <TableCell>
                          {format(new Date(vacc.date_administration), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {schedule?.delai_rappel_jours ? (
                            format(
                              new Date(new Date(vacc.date_administration).getTime() + (schedule.delai_rappel_jours || 0) * 24 * 60 * 60 * 1000),
                              'dd/MM/yyyy',
                              { locale: fr }
                            )
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {vacc.statut === 'annule' ? (
                            <Chip label="Annulé" color="default" size="small" />
                          ) : isVaccinEnRetard(vacc) ? (
                            <Chip
                              icon={<Warning />}
                              label="En retard"
                              color="error"
                              size="small"
                            />
                          ) : (
                            <Chip label="Valide" color="success" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
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

        <Dialog 
          open={vaccinationDialogOpen} 
          onClose={() => {
            if (!loading) {
              setVaccinationDialogOpen(false);
            }
          }} 
          maxWidth="sm" 
          fullWidth
          disableEscapeKeyDown={loading}
        >
          <DialogTitle>Ajouter une vaccination</DialogTitle>
          <DialogContent sx={{ flex: 1, overflow: 'auto', minHeight: '300px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                fullWidth
                label="Vaccin"
                value={newVaccination.vaccine_libelle}
                onChange={(e) => setNewVaccination({ ...newVaccination, vaccine_libelle: e.target.value })}
                placeholder="Ex: BCG, Pentavalent, Polio..."
                required
                helperText="Saisissez le nom du vaccin administré"
              />

              <FormControl fullWidth required>
                <InputLabel id="dose-select-label">Dose</InputLabel>
                <Select
                  labelId="dose-select-label"
                  value={newVaccination.dose_ordre}
                  label="Dose"
                  onChange={(e) => setNewVaccination({ ...newVaccination, dose_ordre: parseInt(e.target.value as string, 10) })}
                >
                  {[1, 2, 3, 4, 5, 6].map((dose) => (
                    <MenuItem key={dose} value={dose}>
                      Dose {dose}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="date"
                label="Date d'administration"
                value={newVaccination.date_administration}
                onChange={(e) => setNewVaccination({ ...newVaccination, date_administration: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />

              <TextField
                fullWidth
                type="date"
                label="Date de rappel (optionnel)"
                value={newVaccination.date_rappel}
                onChange={(e) => setNewVaccination({ ...newVaccination, date_rappel: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText="Date prévue pour le rappel de vaccination"
              />

              <FormControl fullWidth required>
                <InputLabel id="statut-select-label">Statut</InputLabel>
                <Select
                  labelId="statut-select-label"
                  value={newVaccination.statut}
                  label="Statut"
                  onChange={(e) => setNewVaccination({ ...newVaccination, statut: e.target.value as 'valide' | 'annule' })}
                >
                  <MenuItem value="valide">Valide</MenuItem>
                  <MenuItem value="annule">Annulé</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Lieu d'injection (optionnel)"
                value={newVaccination.lieu}
                onChange={(e) => setNewVaccination({ ...newVaccination, lieu: e.target.value })}
                placeholder="Ex: Bras gauche, Cuisse..."
              />

              <TextField
                fullWidth
                label="Numéro de lot (optionnel)"
                value={newVaccination.numero_lot}
                onChange={(e) => setNewVaccination({ ...newVaccination, numero_lot: e.target.value })}
              />

              <TextField
                fullWidth
                label="Vaccinateur (optionnel)"
                value={newVaccination.vaccinateur}
                onChange={(e) => setNewVaccination({ ...newVaccination, vaccinateur: e.target.value })}
                placeholder="Nom du professionnel ayant administré le vaccin"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button 
              onClick={() => {
                if (!loading) {
                  setVaccinationDialogOpen(false);
                }
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddVaccination}
              variant="contained"
              disabled={!newVaccination.vaccine_libelle || !newVaccination.date_administration || loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

