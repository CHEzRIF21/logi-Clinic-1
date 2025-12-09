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
  Tabs,
  Tab,
  InputAdornment,
  Alert,
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
} from '@mui/icons-material';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { StatBadge } from '../components/ui/StatBadge';
import jsPDF from 'jspdf';
import { PatientService } from '../services/patientService';
import { Patient } from '../services/supabase';
import PatientSelector from '../components/shared/PatientSelector';
import PatientCard from '../components/shared/PatientCard';

interface PrescriptionItem {
  medicament: string;
  dosage: string;
  duree: string;
  voie: string;
}

interface ExamenItem {
  type: 'Laboratoire' | 'Imagerie';
  nom: string;
  notes?: string;
}

interface Consultation {
  id: string;
  patientId: string;
  patient?: Patient;
  medecin: string;
  date: string;
  heure: string;
  typeConsultation: 'Première fois' | 'Contrôle' | 'Référence';
  motif: string;
  antecedentsAuto?: string;
  allergiesAuto?: string;
  notesAntecedents?: string;
  temperature?: number;
  tensionSystolique?: number;
  tensionDiastolique?: number;
  frequenceCardiaque?: number;
  frequenceRespiratoire?: number;
  poidsKg?: number;
  tailleCm?: number;
  imc?: number;
  examenClinique?: string;
  diagnostics?: string;
  prescriptions?: PrescriptionItem[];
  examens?: ExamenItem[];
  statut: 'terminee' | 'en_cours' | 'annulee';
}

const Consultations: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPatientSelector, setOpenPatientSelector] = useState(false);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Partial<Consultation>>({
    medecin: '',
    date: new Date().toISOString().slice(0, 10),
    heure: '08:00',
    typeConsultation: 'Première fois',
    motif: '',
    statut: 'en_cours',
    prescriptions: [],
    examens: [],
  });

  // Charger les consultations depuis Supabase (à implémenter)
  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      // TODO: Implémenter la récupération depuis Supabase
      // Pour l'instant, utiliser localStorage comme fallback
      const stored = localStorage.getItem('consultations');
      if (stored) {
        const parsed = JSON.parse(stored) as Consultation[];
        // Charger les données patient pour chaque consultation
        const consultationsWithPatients = await Promise.all(
          parsed.map(async (c) => {
            if (c.patientId) {
              try {
                const patient = await PatientService.getPatientById(c.patientId);
                return { ...c, patient };
              } catch {
                return c;
              }
            }
            return c;
          })
        );
        setConsultations(consultationsWithPatients);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des consultations:', error);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setForm({
      ...form,
      patientId: patient.id,
      antecedentsAuto: patient.antecedents_medicaux || '',
      allergiesAuto: patient.allergies || '',
    });
  };

  const handleCreateConsultation = () => {
    if (!selectedPatient) {
      setOpenPatientSelector(true);
      return;
    }
    setOpenDialog(true);
  };

  const handleSaveConsultation = () => {
    if (!selectedPatient) return;

    const newConsultation: Consultation = {
      id: Date.now().toString(),
      patientId: selectedPatient.id,
      patient: selectedPatient,
      ...form,
    } as Consultation;

    const updated = [...consultations, newConsultation];
    setConsultations(updated);
    localStorage.setItem('consultations', JSON.stringify(updated));
    setOpenDialog(false);
    setForm({
      medecin: '',
      date: new Date().toISOString().slice(0, 10),
      heure: '08:00',
      typeConsultation: 'Première fois',
      motif: '',
      statut: 'en_cours',
      prescriptions: [],
      examens: [],
    });
    setSelectedPatient(null);
  };

  const filteredConsultations = useMemo(() => {
    if (!search) return consultations;
    return consultations.filter(
      (c) =>
        c.patient?.nom.toLowerCase().includes(search.toLowerCase()) ||
        c.patient?.prenom.toLowerCase().includes(search.toLowerCase()) ||
        c.patient?.identifiant.toLowerCase().includes(search.toLowerCase()) ||
        c.motif.toLowerCase().includes(search.toLowerCase())
    );
  }, [consultations, search]);

  // Calcul des statistiques
  const stats = useMemo(() => {
    const total = consultations.length;
    const terminees = consultations.filter(c => c.statut === 'terminee').length;
    const enCours = consultations.filter(c => c.statut === 'en_cours').length;
    const annulees = consultations.filter(c => c.statut === 'annulee').length;
    return { total, terminees, enCours, annulees };
  }, [consultations]);

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête amélioré */}
      <ToolbarBits sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <MedicalServices color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <GradientText variant="h4">Gestion des Consultations</GradientText>
            <Typography variant="body2" color="text.secondary">
              Gérez les consultations médicales et leurs prescriptions
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateConsultation}
          size="medium"
        >
          Nouvelle Consultation
        </Button>
      </ToolbarBits>

      {/* Statistiques synthétiques */}
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

      {/* Sélection de patient */}
      {selectedPatient && (
        <Box sx={{ mb: 3 }}>
          <PatientCard patient={selectedPatient} compact />
        </Box>
      )}

      {/* Barre de recherche */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher une consultation..."
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

      {/* Liste des consultations */}
      <GlassCard sx={{ p: 2 }}>
        <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Médecin</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Motif</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredConsultations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Aucune consultation trouvée
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredConsultations.map((consultation) => (
                <TableRow key={consultation.id}>
                  <TableCell>
                    {new Date(consultation.date).toLocaleDateString('fr-FR')} {consultation.heure}
                  </TableCell>
                  <TableCell>
                    {consultation.patient
                      ? `${consultation.patient.prenom} ${consultation.patient.nom}`
                      : consultation.patientId}
                  </TableCell>
                  <TableCell>{consultation.medecin}</TableCell>
                  <TableCell>
                    <Chip label={consultation.typeConsultation} size="small" />
                  </TableCell>
                  <TableCell>{consultation.motif}</TableCell>
                  <TableCell>
                    <Chip
                      label={consultation.statut}
                      color={
                        consultation.statut === 'terminee'
                          ? 'success'
                          : consultation.statut === 'en_cours'
                          ? 'warning'
                          : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete />
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
          window.location.href = '/patients?action=create&service=Médecine générale';
        }}
      />

      {/* Dialog de création de consultation */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nouvelle Consultation</DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Patient: {selectedPatient.prenom} {selectedPatient.nom} ({selectedPatient.identifiant})
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Médecin"
                value={form.medecin}
                onChange={(e) => setForm({ ...form, medecin: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Heure"
                type="time"
                value={form.heure}
                onChange={(e) => setForm({ ...form, heure: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type de consultation</InputLabel>
                <Select
                  value={form.typeConsultation}
                  onChange={(e) =>
                    setForm({ ...form, typeConsultation: e.target.value as any })
                  }
                >
                  <MenuItem value="Première fois">Première fois</MenuItem>
                  <MenuItem value="Contrôle">Contrôle</MenuItem>
                  <MenuItem value="Référence">Référence</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motif"
                multiline
                rows={3}
                value={form.motif}
                onChange={(e) => setForm({ ...form, motif: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSaveConsultation}
            disabled={!selectedPatient || !form.medecin || !form.motif}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Consultations;
