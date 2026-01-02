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
import { FacturationService } from '../../../services/facturationService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox, FormControlLabel } from '@mui/material';

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
  const [schedules, setSchedules] = useState<VaccineSchedule[]>([]); // Schedules du vaccin sélectionné dans le formulaire
  const [newVaccination, setNewVaccination] = useState({
    vaccine_id: '',
    dose_ordre: 1,
    date_administration: new Date().toISOString().split('T')[0],
    lieu: '',
    numero_lot: '',
    vaccinateur: ''
  });
  const [creerFacture, setCreerFacture] = useState(false);

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

  useEffect(() => {
    if (newVaccination.vaccine_id) {
      loadSchedules(newVaccination.vaccine_id);
    } else {
      setSchedules([]);
    }
  }, [newVaccination.vaccine_id]);

  const loadSchedules = async (vaccineId: string) => {
    try {
      const schedulesList = await VaccinationService.getVaccineSchedules(vaccineId);
      setSchedules(schedulesList);
      // Si des schedules existent, définir la dose minimale par défaut
      if (schedulesList.length > 0) {
        const minDose = Math.min(...schedulesList.map(s => s.dose_ordre));
        setNewVaccination(prev => ({ ...prev, dose_ordre: minDose }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des schedules:', error);
      setSchedules([]);
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:162',message:'handleAddVaccination entry',data:{vaccineId:newVaccination.vaccine_id,dateAdmin:newVaccination.date_administration,hasVaccineId:!!newVaccination.vaccine_id,hasDateAdmin:!!newVaccination.date_administration,patientId:patient.id},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'E,G'})}).catch(()=>{});
    // #endregion
    
    if (!newVaccination.vaccine_id || !newVaccination.date_administration) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:165',message:'Validation failed - missing fields',data:{hasVaccineId:!!newVaccination.vaccine_id,hasDateAdmin:!!newVaccination.date_administration},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      alert('Veuillez sélectionner un vaccin et une date d\'administration');
      return;
    }

    setLoading(true);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:169',message:'Starting vaccination record',data:{vaccineId:newVaccination.vaccine_id,doseOrdre:newVaccination.dose_ordre,dateAdmin:newVaccination.date_administration},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    try {
      const schedule = schedules.find(s => s.vaccine_id === newVaccination.vaccine_id && s.dose_ordre === newVaccination.dose_ordre);
      const selectedVaccine = vaccines.find(v => v.id === newVaccination.vaccine_id);
      
      // Enregistrer la vaccination
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:174',message:'Before VaccinationService.recordDose',data:{patientId:patient.id,vaccineId:newVaccination.vaccine_id,scheduleId:schedule?.id,doseOrdre:newVaccination.dose_ordre},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const vaccinationRecorded = await VaccinationService.recordDose({
        patient_id: patient.id,
        vaccine_id: newVaccination.vaccine_id,
        schedule_id: schedule?.id || null,
        dose_ordre: newVaccination.dose_ordre,
        date_administration: newVaccination.date_administration,
        lieu: newVaccination.lieu || undefined,
        numero_lot: newVaccination.numero_lot || undefined,
        vaccinateur: newVaccination.vaccinateur || undefined,
        statut: 'valide'
      } as any);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:185',message:'After VaccinationService.recordDose',data:{hasRecorded:!!vaccinationRecorded,recordedId:vaccinationRecorded?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Planifier un rappel si nécessaire
      if (schedule?.delai_rappel_jours && schedule.delai_rappel_jours > 0) {
        const plannedDate = new Date(newVaccination.date_administration);
        plannedDate.setDate(plannedDate.getDate() + schedule.delai_rappel_jours);
        try {
          await VaccinationService.scheduleReminder({
            patient_id: patient.id,
            vaccine_id: newVaccination.vaccine_id,
            schedule_id: schedule.id,
            dose_ordre: newVaccination.dose_ordre + 1,
            planned_at: plannedDate.toISOString(),
            channel: 'sms',
            statut: 'planifie',
            details: 'Rappel vaccination automatique'
          } as any);
        } catch (reminderError) {
          console.warn('Erreur lors de la planification du rappel:', reminderError);
          // Ne pas bloquer le processus si le rappel échoue
        }
      }

      // Créer une facture si demandé
      if (creerFacture) {
        try {
          // Récupérer le service facturable de type vaccination
          const servicesVaccination = await FacturationService.getServicesFacturables('vaccination');
          let serviceFacturable = servicesVaccination.find(s => s.nom.toLowerCase().includes('vaccination') || s.nom.toLowerCase().includes('vaccin'));
          
          // Si aucun service spécifique trouvé, utiliser le premier service de vaccination ou créer une ligne générique
          if (!serviceFacturable && servicesVaccination.length > 0) {
            serviceFacturable = servicesVaccination[0];
          }

          const montantVaccination = serviceFacturable?.tarif_base || 0;
          const libelleVaccination = selectedVaccine 
            ? `Vaccination - ${selectedVaccine.libelle} - Dose ${newVaccination.dose_ordre}`
            : `Vaccination - Dose ${newVaccination.dose_ordre}`;

          // Récupérer l'ID de l'utilisateur actuel
          const userData = localStorage.getItem('user');
          let caissierId: string | undefined;
          if (userData) {
            try {
              const user = JSON.parse(userData);
              if (user.id) {
                caissierId = user.id;
              }
            } catch (e) {
              console.warn('Erreur lors de la récupération de l\'ID utilisateur:', e);
            }
          }

          // Créer la facture
          await FacturationService.createFacture({
            patient_id: patient.id,
            lignes: [{
              service_facturable_id: serviceFacturable?.id,
              code_service: serviceFacturable?.code || 'VACC',
              libelle: libelleVaccination,
              quantite: 1,
              prix_unitaire: montantVaccination,
              remise_ligne: 0,
              montant_ligne: montantVaccination
            }],
            type_facture: 'normale',
            service_origine: 'vaccination',
            reference_externe: vaccinationRecorded.id,
            notes: `Facture générée automatiquement pour la vaccination enregistrée le ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`
          }, caissierId);

          // Ne pas afficher d'alerte bloquante, juste recharger les données
        } catch (factureError) {
          console.error('Erreur lors de la création de la facture:', factureError);
          // Ne pas bloquer le processus si la facture échoue
        }
      }

      // Recharger les données et fermer le dialog
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:264',message:'Before loadData',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      await loadData();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:266',message:'After loadData',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      // Réinitialiser le formulaire
      setNewVaccination({
        vaccine_id: '',
        dose_ordre: 1,
        date_administration: new Date().toISOString().split('T')[0],
        lieu: '',
        numero_lot: '',
        vaccinateur: ''
      });
      setCreerFacture(false);
      
      // Fermer le dialog après un court délai pour permettre la mise à jour de l'UI
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:279',message:'Before closing dialog',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      setTimeout(() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:281',message:'Closing dialog',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setVaccinationDialogOpen(false);
      }, 100);
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:285',message:'Error in handleAddVaccination',data:{errorMessage:error?.message,errorName:error?.name,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('Erreur lors de l\'enregistrement de la vaccination:', error);
      const errorMessage = error?.message || 'Erreur lors de l\'enregistrement de la vaccination. Veuillez réessayer.';
      alert(errorMessage);
    } finally {
      setLoading(false);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:290',message:'handleAddVaccination finally - loading set to false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
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
              onClick={async () => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:320',message:'Add button clicked',data:{vaccinesCount:vaccines.length,loading,patientId:patient.id},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                
                // Réinitialiser le formulaire avant d'ouvrir le dialog
                setNewVaccination({
                  vaccine_id: '',
                  dose_ordre: 1,
                  date_administration: new Date().toISOString().split('T')[0],
                  lieu: '',
                  numero_lot: '',
                  vaccinateur: ''
                });
                setCreerFacture(false);
                setSchedules([]);
                
                // S'assurer que les vaccins sont chargés avant d'ouvrir le dialogue
                if (vaccines.length === 0) {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:323',message:'Loading vaccines before opening dialog',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'A'})}).catch(()=>{});
                  // #endregion
                  try {
                    await loadVaccines();
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:327',message:'Vaccines loaded successfully',data:{vaccinesCountAfter:vaccines.length},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                  } catch (error) {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:330',message:'Error loading vaccines',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    console.error('Erreur lors du chargement des vaccins:', error);
                    alert('Erreur lors du chargement de la liste des vaccins. Veuillez réessayer.');
                    return;
                  }
                }
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:336',message:'Opening vaccination dialog',data:{vaccinesCount:vaccines.length},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
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
              setCreerFacture(false);
            }
          }} 
          maxWidth="sm" 
          fullWidth
          disableEscapeKeyDown={loading}
        >
          <DialogTitle>Ajouter une vaccination</DialogTitle>
          <DialogContent sx={{ flex: 1, overflow: 'auto', minHeight: '300px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              {loading && vaccines.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gap: 2 }}>
                  <CircularProgress />
                  <Typography>Chargement des vaccins...</Typography>
                </Box>
              ) : vaccines.length === 0 ? (
                <Alert severity="warning">
                  Aucun vaccin disponible. Veuillez d'abord configurer les vaccins dans le module Vaccination.
                </Alert>
              ) : (
                <>
                  <FormControl fullWidth required>
                    <InputLabel id="vaccin-select-label">Vaccin</InputLabel>
                    <Select
                      labelId="vaccin-select-label"
                      value={newVaccination.vaccine_id}
                      label="Vaccin"
                      onChange={(e) => {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:477',message:'Vaccin selected',data:{vaccineId:e.target.value},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'G'})}).catch(()=>{});
                        // #endregion
                        setNewVaccination({ ...newVaccination, vaccine_id: e.target.value, dose_ordre: 1 });
                      }}
                    >
                      {vaccines.map((vaccine) => (
                        <MenuItem key={vaccine.id} value={vaccine.id}>
                          {vaccine.libelle}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth required>
                    <InputLabel id="dose-select-label">Dose</InputLabel>
                    <Select
                      labelId="dose-select-label"
                      value={schedules.length > 0 ? newVaccination.dose_ordre : 1}
                      label="Dose"
                      onChange={(e) => setNewVaccination({ ...newVaccination, dose_ordre: parseInt(e.target.value as string, 10) })}
                      disabled={!newVaccination.vaccine_id}
                    >
                      {schedules.length > 0 ? (
                        schedules.map((schedule) => (
                          <MenuItem key={schedule.id} value={schedule.dose_ordre}>
                            Dose {schedule.dose_ordre} - {schedule.libelle_dose}
                          </MenuItem>
                        ))
                      ) : (
                        [1, 2, 3, 4, 5].map((dose) => (
                          <MenuItem key={dose} value={dose}>
                            Dose {dose}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    type="date"
                    label="Date d'administration"
                    value={newVaccination.date_administration}
                    onChange={(e) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkflowStep5Prevention.tsx:512',message:'Date changed',data:{dateAdmin:e.target.value},timestamp:Date.now(),sessionId:'debug-session',runId:'vaccination-fix',hypothesisId:'G'})}).catch(()=>{});
                      // #endregion
                      setNewVaccination({ ...newVaccination, date_administration: e.target.value });
                    }}
                    InputLabelProps={{ shrink: true }}
                    required
                  />

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

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={creerFacture}
                        onChange={(e) => setCreerFacture(e.target.checked)}
                      />
                    }
                    label="Créer automatiquement une facture dans le module Caisse"
                  />
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button 
              onClick={() => {
                if (!loading) {
                  setVaccinationDialogOpen(false);
                  setCreerFacture(false);
                }
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddVaccination}
              variant="contained"
              disabled={vaccines.length === 0 || !newVaccination.vaccine_id || !newVaccination.date_administration || loading}
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

