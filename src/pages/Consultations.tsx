import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  Snackbar,
  Backdrop,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MedicalServices,
  Event,
  Person,
  Assignment,
  Search,
  Print,
  Visibility,
  Close,
} from '@mui/icons-material';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { StatBadge } from '../components/ui/StatBadge';
import { PatientService } from '../services/patientService';
import { Patient } from '../services/supabase';
import { Consultation, ConsultationService } from '../services/consultationService';
import PatientSelector from '../components/shared/PatientSelector';
import PatientCard from '../components/shared/PatientCard';
import { ConsultationStartDialog } from '../components/consultation/ConsultationStartDialog';
import { ConsultationWorkflow } from '../components/consultation/ConsultationWorkflow';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Consultations: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [openPatientSelector, setOpenPatientSelector] = useState(false);
  const [openStartDialog, setOpenStartDialog] = useState(false);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Charger l'ID utilisateur au montage
  useEffect(() => {
    loadUserId();
    loadConsultations();
  }, []);

  const loadUserId = async () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.auth_user_id) {
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.auth_user_id)
            .single();
          if (data) {
            setUserId(data.id);
            return;
          }
        }
        if (user.id) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Erreur chargement userId:', error);
      }
    }
  };

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const data = await ConsultationService.getAllConsultations();
      
      // Charger les informations patient pour chaque consultation
      const consultationsWithPatients = await Promise.all(
        (data || []).map(async (c) => {
          try {
            const patient = await PatientService.getPatientById(c.patient_id);
            return { ...c, patient };
          } catch {
            return c;
          }
        })
      );
      
      setConsultations(consultationsWithPatients as any);
    } catch (error) {
      console.error('Erreur lors du chargement des consultations:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des consultations',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setOpenPatientSelector(false);
    setOpenStartDialog(true);
  };

  const handleStartConsultation = async (templateId: string, type: string) => {
    if (!selectedPatient) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un patient',
        severity: 'error'
      });
      return;
    }

    if (!userId) {
      setSnackbar({
        open: true,
        message: 'Utilisateur non connecté',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const consultation = await ConsultationService.createConsultation(
        selectedPatient.id,
        userId
      );

      if (type) {
        await ConsultationService.updateConsultation(
          consultation.id,
          { categorie_motif: type } as any,
          userId,
          'categorie_motif'
        );
      }

      setCurrentConsultation(consultation);
      setOpenStartDialog(false);
      setSnackbar({
        open: true,
        message: 'Consultation créée avec succès',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Erreur lors de la création de la consultation:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erreur lors de la création de la consultation',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (step: number, data: any) => {
    // La sauvegarde est gérée dans ConsultationWorkflow
    console.log(`Étape ${step} complétée`);
  };

  const handleCloseConsultation = async () => {
    // Recharger la consultation pour avoir les dernières données
    if (currentConsultation) {
      try {
        const updated = await ConsultationService.getConsultationById(currentConsultation.id);
        if (updated) {
          setCurrentConsultation(updated);
        }
      } catch (error) {
        console.error('Erreur lors du rechargement:', error);
      }
    }

    // Recharger la liste des consultations
    await loadConsultations();
    
    setCurrentConsultation(null);
    setSelectedPatient(null);
    setSnackbar({
      open: true,
      message: 'Consultation fermée',
      severity: 'info'
    });
  };

  const handleNewConsultation = () => {
    if (currentConsultation && currentConsultation.status !== 'CLOTURE') {
      if (window.confirm('Une consultation est en cours. Voulez-vous vraiment en créer une nouvelle ?')) {
        setCurrentConsultation(null);
        setSelectedPatient(null);
        setOpenPatientSelector(true);
      } else {
        return;
      }
    } else {
      setOpenPatientSelector(true);
    }
  };

  const handleResumeConsultation = async (consultation: Consultation) => {
    try {
      // Charger le patient
      const patient = await PatientService.getPatientById(consultation.patient_id);
      setSelectedPatient(patient);
      setCurrentConsultation(consultation);
    } catch (error) {
      console.error('Erreur lors de la reprise:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la reprise de la consultation',
        severity: 'error'
      });
    }
  };

  const filteredConsultations = useMemo(() => {
    if (!search) return consultations;
    return consultations.filter(
      (c) => {
        const patient = (c as any).patient;
        const patientMatch = patient
          ? `${patient.prenom} ${patient.nom} ${patient.identifiant}`.toLowerCase().includes(search.toLowerCase())
          : c.patient_id?.toLowerCase().includes(search.toLowerCase());
        
        const motifMatch = c.motifs?.some(m => m.toLowerCase().includes(search.toLowerCase()));
        const diagnosticMatch = c.diagnostics?.some(d => d.toLowerCase().includes(search.toLowerCase()));
        
        return patientMatch || motifMatch || diagnosticMatch;
      }
    );
  }, [consultations, search]);

  // Calcul des statistiques
  const stats = useMemo(() => {
    const total = consultations.length;
    const terminees = consultations.filter(c => c.status === 'CLOTURE').length;
    const enCours = consultations.filter(c => c.status === 'EN_COURS').length;
    const annulees = consultations.filter(c => c.status === 'ANNULEE').length;
    return { total, terminees, enCours, annulees };
  }, [consultations]);

  // Si une consultation est en cours, afficher le workflow
  if (currentConsultation && selectedPatient) {
    return (
      <Box sx={{ height: '100vh', overflow: 'hidden' }}>
        <ConsultationWorkflow
          consultation={currentConsultation}
          patient={selectedPatient}
          onStepComplete={handleStepComplete}
          onClose={handleCloseConsultation}
          userId={userId}
        />
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  // Page principale : Liste des consultations
  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <ToolbarBits sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <MedicalServices color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <GradientText variant="h4">Consultations</GradientText>
            <Typography variant="body2" color="text.secondary">
              Gestion des consultations médicales et workflow complet
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleNewConsultation}
          size="medium"
        >
          Nouvelle Consultation
        </Button>
      </ToolbarBits>

      {/* Statistiques */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={2} mb={3}>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Total consultations" value={stats.total} icon={<Assignment />} color="primary" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Terminées" value={stats.terminees} icon={<Event />} color="success" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="En cours" value={stats.enCours} icon={<MedicalServices />} color="warning" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Annulées" value={stats.annulees} icon={<Person />} color="error" />
        </GlassCard>
      </Box>

      {/* Patient sélectionné */}
      {selectedPatient && !currentConsultation && (
        <Box sx={{ mb: 3 }}>
          <PatientCard patient={selectedPatient} compact />
        </Box>
      )}

      {/* Barre de recherche */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher une consultation par patient, motif ou diagnostic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Tabs pour filtrer */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab label="Toutes" />
          <Tab label="En cours" />
          <Tab label="Terminées" />
          <Tab label="Annulées" />
        </Tabs>
      </Box>

      {/* Liste des consultations */}
      <GlassCard sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Motif</TableCell>
                <TableCell>Diagnostic</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredConsultations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Aucune consultation trouvée
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredConsultations
                  .filter(c => {
                    if (tab === 1) return c.status === 'EN_COURS';
                    if (tab === 2) return c.status === 'CLOTURE';
                    if (tab === 3) return c.status === 'ANNULEE';
                    return true;
                  })
                  .map((consultation) => (
                    <TableRow key={consultation.id} hover>
                      <TableCell>
                        {new Date(consultation.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        {(consultation as any).patient ? (
                          <Box>
                            <Typography variant="body2">
                              {(consultation as any).patient.prenom} {(consultation as any).patient.nom}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(consultation as any).patient.identifiant}
                            </Typography>
                          </Box>
                        ) : consultation.patient_id ? (
                          <Chip label={consultation.patient_id.substring(0, 8)} size="small" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {consultation.motifs && consultation.motifs.length > 0
                          ? consultation.motifs[0]
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {consultation.diagnostics && consultation.diagnostics.length > 0
                          ? consultation.diagnostics[0]
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={consultation.status}
                          color={
                            consultation.status === 'CLOTURE'
                              ? 'success'
                              : consultation.status === 'EN_COURS'
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {consultation.status === 'EN_COURS' ? (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleResumeConsultation(consultation)}
                            title="Reprendre la consultation"
                          >
                            <Edit />
                          </IconButton>
                        ) : (
                          <IconButton size="small" color="primary" title="Voir les détails">
                            <Visibility />
                          </IconButton>
                        )}
                        <IconButton size="small" color="default" title="Imprimer">
                          <Print />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      {/* Dialog de sélection de patient */}
      <PatientSelector
        open={openPatientSelector}
        onClose={() => setOpenPatientSelector(false)}
        onSelect={handleSelectPatient}
        title="Sélectionner un patient pour la consultation"
        allowCreate={true}
        onCreateNew={() => {
          navigate('/patients?action=create&service=Médecine générale');
        }}
      />

      {/* Dialog de démarrage de consultation */}
      <ConsultationStartDialog
        open={openStartDialog}
        onClose={() => {
          setOpenStartDialog(false);
          if (!currentConsultation) {
            setSelectedPatient(null);
          }
        }}
        onStart={handleStartConsultation}
        patient={selectedPatient}
      />

      {/* Backdrop de chargement */}
      <Backdrop open={loading} sx={{ zIndex: 9999 }}>
        <CircularProgress color="primary" />
      </Backdrop>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Consultations;
