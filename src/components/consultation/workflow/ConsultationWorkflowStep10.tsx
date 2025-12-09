import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import {
  CalendarToday,
  Notifications,
  Science,
  LocalHospital,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { Patient } from '../../../services/supabase';
import {
  FollowUpSuggestion,
  RendezVousService,
} from '../../../services/rendezVousService';

interface ConsultationWorkflowStep10Props {
  consultationId: string;
  patientId: string;
  onRdvCreated: () => void;
  userId: string;
  consultationType: string;
  motifs?: string[];
  patient?: Patient | null;
  examensPrescrits?: Array<{
    type: 'labo' | 'imagerie';
    nom: string;
    delai_jours?: number;
  }>;
}

export const ConsultationWorkflowStep10: React.FC<ConsultationWorkflowStep10Props> = ({
  consultationId,
  patientId,
  onRdvCreated,
  userId,
  consultationType,
  motifs,
  patient,
  examensPrescrits = [],
}) => {
  const [rdvDate, setRdvDate] = useState<Date | null>(null);
  const [rdvTime, setRdvTime] = useState<Date | null>(null);
  const [rdvMotif, setRdvMotif] = useState('');
  const [suggestions, setSuggestions] = useState<FollowUpSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<FollowUpSuggestion | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [notifyChannel, setNotifyChannel] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [creatingRdv, setCreatingRdv] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [examRendezVous, setExamRendezVous] = useState<Array<{ examen: string; date: Date | null; time: Date | null }>>([]);
  const [reminderTimes, setReminderTimes] = useState<number[]>([24, 2]); // Heures avant le RDV

  useEffect(() => {
    // Générer automatiquement des rendez-vous pour les examens prescrits
    if (examensPrescrits.length > 0) {
      const examRdv = examensPrescrits.map((examen) => {
        const delai = examen.delai_jours || (examen.type === 'labo' ? 1 : 3);
        const date = new Date();
        date.setDate(date.getDate() + delai);
        return {
          examen: examen.nom,
          date: date,
          time: new Date(date.setHours(9, 0, 0, 0)),
        };
      });
      setExamRendezVous(examRdv);
    }
  }, [examensPrescrits]);

  const handleCreateRdv = async () => {
    if (!rdvDate || !rdvTime) {
      alert('Veuillez sélectionner une date et une heure');
      return;
    }

    setCreatingRdv(true);
    try {
      const start = new Date(rdvDate);
      start.setHours(rdvTime.getHours(), rdvTime.getMinutes(), 0, 0);
      const end = selectedSuggestion ? new Date(selectedSuggestion.end) : new Date(start.getTime() + 20 * 60000);

      const motifValue = rdvMotif || `Suivi ${consultationType}`;

      await RendezVousService.createRendezVous({
        patient_id: patientId,
        consultation_id: consultationId,
        service: consultationType || 'Consultation générale',
        praticien_name: selectedSuggestion?.praticienName || null,
        motif: motifValue,
        date_debut: start.toISOString(),
        date_fin: end.toISOString(),
        priorite: selectedSuggestion?.priority || 'normal',
        notes: selectedSuggestion?.reason || null,
      });

      // Créer les rendez-vous pour les examens prescrits
      for (const examRdv of examRendezVous.filter((er) => er.date && er.time)) {
        const examStart = new Date(examRdv.date!);
        examStart.setHours(examRdv.time!.getHours(), examRdv.time!.getMinutes(), 0, 0);
        const examEnd = new Date(examStart.getTime() + 30 * 60000); // 30 minutes

        await RendezVousService.createRendezVous({
          patient_id: patientId,
          consultation_id: consultationId,
          service: examRdv.examen.includes('Labo') ? 'Laboratoire' : 'Imagerie',
          motif: `Examen: ${examRdv.examen}`,
          date_debut: examStart.toISOString(),
          date_fin: examEnd.toISOString(),
          priorite: 'normal',
        });
      }

      if (notifyPatient) {
        const timeStr = rdvTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        await RendezVousService.notifyPatient(
          patientId,
          consultationId,
          notifyChannel,
          `Bonjour ${patient?.prenom || ''}, votre rendez-vous de suivi est programmé le ${start.toLocaleDateString(
            'fr-FR'
          )} à ${timeStr}.`
        );
      }

      onRdvCreated();
      alert('Rendez-vous créé avec succès');
    } catch (error) {
      console.error('Erreur lors de la création du RDV:', error);
      alert('Erreur lors de la création du rendez-vous');
    } finally {
      setCreatingRdv(false);
    }
  };

  const primaryMotif = useMemo(() => (motifs && motifs.length > 0 ? motifs[0] : 'Suivi consultation'), [motifs]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const result = await RendezVousService.suggestFollowUp({
          service: consultationType || 'Médecine générale',
          motif: primaryMotif,
        });
        setSuggestions(result);
        if (result.length > 0) {
          applySuggestion(result[0]);
        }
      } catch (error) {
        console.error('Erreur lors du calcul des suggestions de RDV:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions().catch(console.error);
  }, [consultationType, primaryMotif]);

  const applySuggestion = (suggestion: FollowUpSuggestion) => {
    const date = new Date(suggestion.start);
    setRdvDate(date);
    setRdvTime(date);
    setSelectedSuggestion(suggestion);
    if (!rdvMotif) {
      setRdvMotif(`Suivi ${consultationType}`);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <CalendarToday color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" gutterBottom>
              Rendez-vous de Suivi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Programmation automatique selon la pathologie, disponibilité du médecin et du service
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Le système propose automatiquement une date selon la spécialité ({consultationType}), le motif et la priorité clinique.
        </Alert>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
          <Tab label="Consultation de Suivi" icon={<Schedule />} iconPosition="start" />
          {examensPrescrits.length > 0 && (
            <Tab
              label={`Examens Prescrits (${examensPrescrits.length})`}
              icon={<Science />}
              iconPosition="start"
            />
          )}
        </Tabs>

        {/* Onglet Consultation de Suivi */}
        <Box hidden={activeTab !== 0}>

        {loadingSuggestions ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Calcul des suggestions en cours...
          </Alert>
        ) : (
          suggestions.length > 0 && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
              {suggestions.map((suggestion, index) => (
                <Card
                  key={`${suggestion.start}-${index}`}
                  variant={selectedSuggestion === suggestion ? 'outlined' : undefined}
                  sx={{
                    flex: 1,
                    borderColor: selectedSuggestion === suggestion ? 'primary.main' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => applySuggestion(suggestion)}
                >
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {suggestion.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {suggestion.reason}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Priorité: {suggestion.priority === 'urgent' ? 'Urgente' : 'Normale'}
                    </Typography>
                    {suggestion.praticienName && (
                      <Typography variant="body2" color="text.secondary">
                        Praticien: {suggestion.praticienName}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )
        )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date du rendez-vous *"
                  value={rdvDate}
                  onChange={(date) => {
                    setSelectedSuggestion(null);
                    setRdvDate(date);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <TimePicker
                  label="Heure *"
                  value={rdvTime}
                  onChange={(time) => setRdvTime(time)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motif du rendez-vous"
                value={rdvMotif}
                onChange={(e) => setRdvMotif(e.target.value)}
                placeholder="Suivi consultation, Contrôle..."
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom>
            Notifications et Rappels
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={notifyPatient}
                    onChange={(e) => setNotifyPatient(e.target.checked)}
                  />
                }
                label="Notifier le patient automatiquement"
              />
            </Grid>

            {notifyPatient && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Canal de notification</InputLabel>
                    <Select
                      value={notifyChannel}
                      label="Canal de notification"
                      onChange={(e) => setNotifyChannel(e.target.value as any)}
                    >
                      <MenuItem value="sms">SMS</MenuItem>
                      <MenuItem value="whatsapp">WhatsApp</MenuItem>
                      <MenuItem value="email">Email</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rappels (heures avant)"
                    value={reminderTimes.join(', ')}
                    onChange={(e) => {
                      const times = e.target.value
                        .split(',')
                        .map((t) => parseInt(t.trim()))
                        .filter((t) => !isNaN(t));
                      setReminderTimes(times);
                    }}
                    placeholder="24, 2"
                    helperText="Ex: 24 (24h avant), 2 (2h avant)"
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={handleCreateRdv}
              disabled={!rdvDate || !rdvTime || creatingRdv}
            >
              {creatingRdv ? 'Création...' : 'Créer le rendez-vous'}
            </Button>
          </Box>
        </Box>

        {/* Onglet Examens Prescrits */}
        {examensPrescrits.length > 0 && (
          <Box hidden={activeTab !== 1}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Rendez-vous automatiques générés pour les examens prescrits. Vous pouvez modifier les dates si nécessaire.
            </Alert>
            <List>
              {examRendezVous.map((examRdv, index) => (
                <ListItem key={index}>
                  <Paper sx={{ width: '100%', p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {examensPrescrits[index]?.type === 'labo' ? (
                            <Science color="primary" />
                          ) : (
                            <LocalHospital color="secondary" />
                          )}
                          <Typography variant="subtitle1">{examRdv.examen}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                          <DatePicker
                            label="Date"
                            value={examRdv.date}
                            onChange={(date) => {
                              const updated = [...examRendezVous];
                              updated[index].date = date;
                              setExamRendezVous(updated);
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                size: 'small',
                              },
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                          <TimePicker
                            label="Heure"
                            value={examRdv.time}
                            onChange={(time) => {
                              const updated = [...examRendezVous];
                              updated[index].time = time;
                              setExamRendezVous(updated);
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                size: 'small',
                              },
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>
                    </Grid>
                  </Paper>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Alert severity="success" sx={{ mt: 2 }}>
          {notifyPatient && (
            <>
              Un message sera envoyé automatiquement au patient via {notifyChannel.toUpperCase()}.
              {reminderTimes.length > 0 && ` Rappels programmés: ${reminderTimes.join('h, ')}h avant.`}
            </>
          )}
          {!notifyPatient && 'Les rendez-vous seront créés sans notification automatique.'}
        </Alert>
      </CardContent>
    </Card>
  );
};

