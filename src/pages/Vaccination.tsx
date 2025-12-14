import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, TextField, MenuItem, Paper, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Vaccines, Add } from '@mui/icons-material';
import { VaccinationService, Vaccine, VaccineSchedule, PatientVaccination, VaccinationReminder } from '../services/vaccinationService';
import { PatientService } from '../services/patientService';
import { Patient } from '../services/supabase';
import PatientSelector from '../components/shared/PatientSelector';
import PatientCard from '../components/shared/PatientCard';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { StatBadge } from '../components/ui/StatBadge';

const Vaccination: React.FC = () => {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [schedules, setSchedules] = useState<VaccineSchedule[]>([]);
  const [patientId, setPatientId] = useState<string>('');
  const [patientIdentifiant, setPatientIdentifiant] = useState<string>('');
  const [selectedVaccineId, setSelectedVaccineId] = useState<string>('');
  const [patientCard, setPatientCard] = useState<PatientVaccination[]>([]);
  const [reminders, setReminders] = useState<VaccinationReminder[]>([]);
  const [form, setForm] = useState<{ dose_ordre?: number; date_administration?: string; lieu?: string; numero_lot?: string; date_peremption?: string; vaccinateur?: string; effets_secondaires?: string; } >({});
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [stats, setStats] = useState<{ byVaccine: Record<string, number>; honorés: number; manqués: number; totalDoses: number } | null>(null);
  const [advanced, setAdvanced] = useState<{ byVaccine: Record<string, number>; ageBuckets: Record<string, number>; expiryAlerts: any[] } | null>(null);
  const [period, setPeriod] = useState<{ from?: string; to?: string }>({});
  const [openAddDialog, setOpenAddDialog] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const v = await VaccinationService.listVaccines();
        setVaccines(v);
      } catch (e: any) {
        setError("Erreur chargement vaccins");
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadSchedules = async () => {
      if (!selectedVaccineId) { setSchedules([]); return; }
      try {
        const s = await VaccinationService.getVaccineSchedules(selectedVaccineId);
        setSchedules(s);
      } catch {
        setSchedules([]);
      }
    };
    loadSchedules();
  }, [selectedVaccineId]);

  const loadPatientData = async (pid: string) => {
    const card = await VaccinationService.getPatientCard(pid);
    setPatientCard(card.doses);
    const rem = await VaccinationService.listUpcomingReminders(pid);
    setReminders(rem);
  };

  const [openPatientSelector, setOpenPatientSelector] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const handleSelectPatient = async (patient: any) => {
    setPatientId(patient.id);
    setPatientIdentifiant(patient.identifiant);
    setSelectedPatient(patient);
    await loadPatientData(patient.id);
    setInfo(`Patient: ${patient.prenom || ''} ${patient.nom || ''}`.trim());
  };

  const handleFindPatient = async () => {
    setOpenPatientSelector(true);
  };

  const nextDoseOptions = useMemo(() => {
    if (!selectedVaccineId) return [] as number[];
    const s = schedules.filter(x => x.vaccine_id === selectedVaccineId).sort((a,b) => a.dose_ordre - b.dose_ordre);
    const done = new Set(patientCard.filter(d => d.vaccine_id === selectedVaccineId).map(d => d.dose_ordre));
    return s.map(x => x.dose_ordre).filter(n => !done.has(n));
  }, [selectedVaccineId, schedules, patientCard]);

  const handleRecord = async () => {
    setError(null);
    setInfo(null);
    try {
      if (!patientId) { setError('Sélectionnez un patient'); return; }
      if (!selectedVaccineId) { setError('Sélectionnez un vaccin'); return; }
      if (!form.dose_ordre) { setError('Sélectionnez la dose'); return; }
      if (!form.date_administration) { setError("Date d'administration requise"); return; }
      const schedule = schedules.find(s => s.vaccine_id === selectedVaccineId && s.dose_ordre === form.dose_ordre);
      const dose = await VaccinationService.recordDose({
        patient_id: patientId,
        vaccine_id: selectedVaccineId,
        schedule_id: schedule?.id,
        dose_ordre: form.dose_ordre,
        date_administration: form.date_administration,
        lieu: form.lieu,
        numero_lot: form.numero_lot,
        date_peremption: form.date_peremption,
        vaccinateur: form.vaccinateur,
        effets_secondaires: form.effets_secondaires,
        statut: 'valide',
        created_at: '' as any,
        updated_at: '' as any,
      } as any);
      await loadPatientData(patientId);
      setInfo('Vaccination enregistrée');

      // Planifier rappel si intervalle
      if (schedule?.delai_rappel_jours && schedule.delai_rappel_jours > 0) {
        const planned = new Date(form.date_administration as string);
        planned.setDate(planned.getDate() + schedule.delai_rappel_jours);
        await VaccinationService.scheduleReminder({
          patient_id: patientId,
          vaccine_id: selectedVaccineId,
          schedule_id: schedule.id,
          dose_ordre: form.dose_ordre,
          planned_at: planned.toISOString(),
          channel: 'sms',
          statut: 'planifie',
          details: 'Rappel vaccination automatique'
        } as any);
        const rem = await VaccinationService.listUpcomingReminders(patientId);
        setReminders(rem);
      }
    } catch (e: any) {
      setError('Erreur enregistrement');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête amélioré */}
      <ToolbarBits sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Vaccines color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <GradientText variant="h4">Module Vaccination</GradientText>
            <Typography variant="body2" color="text.secondary">
              Gestion du carnet vaccinal et suivi des vaccinations
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            if (!patientId) {
              setOpenPatientSelector(true);
              setInfo('Veuillez d\'abord sélectionner un patient');
            } else {
              setOpenAddDialog(true);
            }
          }}
          size="medium"
        >
          Ajouter une vaccination
        </Button>
      </ToolbarBits>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <GlassCard sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Recherche Patient</Typography>
              <Button 
                variant="contained" 
                fullWidth
                onClick={handleFindPatient}
                sx={{ mb: 2 }}
              >
                Sélectionner un patient
              </Button>
              {selectedPatient && (
                <Box sx={{ mt: 2 }}>
                  <PatientCard patient={selectedPatient} compact />
                </Box>
              )}
              {info && <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>{info}</Typography>}
              {error && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{error}</Typography>}
              
              <PatientSelector
                open={openPatientSelector}
                onClose={() => setOpenPatientSelector(false)}
                onSelect={handleSelectPatient}
                title="Sélectionner un patient pour la vaccination"
                allowCreate={true}
                onCreateNew={() => {
                  window.location.href = '/patients?action=create&service=Vaccination';
                }}
              />
          </GlassCard>

          <GlassCard sx={{ mt: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>Enregistrement</Typography>
              <TextField
                select
                label="Vaccin"
                fullWidth
                value={selectedVaccineId}
                onChange={(e) => setSelectedVaccineId(e.target.value)}
                sx={{ mb: 2 }}
              >
                {vaccines.map(v => <MenuItem key={v.id} value={v.id}>{v.libelle}</MenuItem>)}
              </TextField>
              <TextField
                select
                label="Dose"
                fullWidth
                value={form.dose_ordre || ''}
                onChange={(e) => setForm({ ...form, dose_ordre: parseInt(e.target.value, 10) })}
                sx={{ mb: 2 }}
                disabled={!selectedVaccineId}
              >
                {nextDoseOptions.map(n => <MenuItem key={n} value={n}>{`Dose ${n}`}</MenuItem>)}
              </TextField>
              <TextField
                type="date"
                label="Date d'administration"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={form.date_administration || ''}
                onChange={(e) => setForm({ ...form, date_administration: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField label="Lieu" fullWidth sx={{ mb: 2 }} value={form.lieu || ''} onChange={(e) => setForm({ ...form, lieu: e.target.value })} />
              <TextField label="N° Lot" fullWidth sx={{ mb: 2 }} value={form.numero_lot || ''} onChange={(e) => setForm({ ...form, numero_lot: e.target.value })} />
              <TextField type="date" label="Péremption" InputLabelProps={{ shrink: true }} fullWidth sx={{ mb: 2 }} value={form.date_peremption || ''} onChange={(e) => setForm({ ...form, date_peremption: e.target.value })} />
              <TextField label="Vaccinateur" fullWidth sx={{ mb: 2 }} value={form.vaccinateur || ''} onChange={(e) => setForm({ ...form, vaccinateur: e.target.value })} />
              <TextField label="Effets secondaires" fullWidth multiline minRows={2} sx={{ mb: 2 }} value={form.effets_secondaires || ''} onChange={(e) => setForm({ ...form, effets_secondaires: e.target.value })} />
              <Button variant="contained" onClick={handleRecord} disabled={!patientId || !selectedVaccineId}>Enregistrer</Button>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <GlassCard sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Carnet vaccinal</Typography>
            <Divider sx={{ mb: 2 }} />
            {patientCard.length === 0 && (
              <Typography variant="body2" color="text.secondary">Aucune dose enregistrée.</Typography>
            )}
            {patientCard.map(d => (
              <Box key={d.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                <Typography>Vaccin: {vaccines.find(v => v.id === d.vaccine_id)?.libelle || d.vaccine_id} • Dose {d.dose_ordre}</Typography>
                <Typography>{new Date(d.date_administration).toLocaleDateString()}</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
              <Button variant="outlined" onClick={() => window.print()}>Imprimer</Button>
              <TextField type="date" label="Du" InputLabelProps={{ shrink: true }} size="small" value={period.from || ''} onChange={(e) => setPeriod({ ...period, from: e.target.value })} />
              <TextField type="date" label="Au" InputLabelProps={{ shrink: true }} size="small" value={period.to || ''} onChange={(e) => setPeriod({ ...period, to: e.target.value })} />
              <Button variant="outlined" onClick={async () => {
                const s = await VaccinationService.getStats({ from: period.from, to: period.to });
                setStats(s);
                const adv = await VaccinationService.getAdvancedReport({ from: period.from, to: period.to });
                setAdvanced(adv);
              }}>Charger rapports</Button>
            </Box>

            {stats && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Statistiques rapides</Typography>
                <Typography variant="body2">Total doses: {stats.totalDoses}</Typography>
                <Typography variant="body2">Honorés vs Manqués: {stats.honorés} / {stats.manqués}</Typography>
                <Divider sx={{ my: 1 }} />
                {Object.entries(stats.byVaccine).map(([vid, count]) => (
                  <Box key={vid} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{vaccines.find(v => v.id === vid)?.libelle || vid}</Typography>
                    <Typography variant="body2">{count}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {advanced && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Couverture par âge</Typography>
                {Object.entries(advanced.ageBuckets).map(([bucket, count]) => (
                  <Box key={bucket} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{bucket}</Typography>
                    <Typography variant="body2">{count}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1">Alertes péremption (30j)</Typography>
                {advanced.expiryAlerts.length === 0 && <Typography variant="body2" color="text.secondary">Aucune alerte</Typography>}
                {advanced.expiryAlerts.map((a, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{a.libelle || a.medicament_id} • Lot {a.numero_lot}</Typography>
                    <Typography variant="body2">Expire le {new Date(a.date_expiration).toLocaleDateString()} (Qté {a.quantite_disponible || 0})</Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Typography variant="h6" sx={{ mt: 3 }}>Rappels à venir</Typography>
            <Divider sx={{ mb: 2 }} />
            {reminders.length === 0 && (
              <Typography variant="body2" color="text.secondary">Aucun rappel programmé.</Typography>
            )}
            {reminders.map(r => (
              <Box key={r.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #eee', gap: 1 }}>
                <Typography sx={{ flex: 1 }}>{vaccines.find(v => v.id === r.vaccine_id)?.libelle || r.vaccine_id} • Dose {r.dose_ordre} • {r.channel.toUpperCase()}</Typography>
                <Typography>{new Date(r.planned_at).toLocaleString()}</Typography>
                <Button size="small" variant="outlined" onClick={async () => {
                  await VaccinationService.notifyReminder(r);
                }}>Notifier</Button>
              </Box>
            ))}
          </GlassCard>
        </Grid>
      </Grid>

      {/* Dialog pour ajouter une vaccination */}
      <Dialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ajouter une vaccination</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              select
              label="Vaccin"
              fullWidth
              value={selectedVaccineId}
              onChange={(e) => setSelectedVaccineId(e.target.value)}
              sx={{ mb: 2 }}
            >
              {vaccines.map(v => <MenuItem key={v.id} value={v.id}>{v.libelle}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Dose"
              fullWidth
              value={form.dose_ordre || ''}
              onChange={(e) => setForm({ ...form, dose_ordre: parseInt(e.target.value, 10) })}
              sx={{ mb: 2 }}
              disabled={!selectedVaccineId}
            >
              {nextDoseOptions.map(n => <MenuItem key={n} value={n}>{`Dose ${n}`}</MenuItem>)}
            </TextField>
            <TextField
              type="date"
              label="Date d'administration"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={form.date_administration || ''}
              onChange={(e) => setForm({ ...form, date_administration: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField 
              label="Lieu" 
              fullWidth 
              sx={{ mb: 2 }} 
              value={form.lieu || ''} 
              onChange={(e) => setForm({ ...form, lieu: e.target.value })} 
            />
            <TextField 
              label="N° Lot" 
              fullWidth 
              sx={{ mb: 2 }} 
              value={form.numero_lot || ''} 
              onChange={(e) => setForm({ ...form, numero_lot: e.target.value })} 
            />
            <TextField 
              type="date" 
              label="Péremption" 
              InputLabelProps={{ shrink: true }} 
              fullWidth 
              sx={{ mb: 2 }} 
              value={form.date_peremption || ''} 
              onChange={(e) => setForm({ ...form, date_peremption: e.target.value })} 
            />
            <TextField 
              label="Vaccinateur" 
              fullWidth 
              sx={{ mb: 2 }} 
              value={form.vaccinateur || ''} 
              onChange={(e) => setForm({ ...form, vaccinateur: e.target.value })} 
            />
            <TextField 
              label="Effets secondaires" 
              fullWidth 
              multiline 
              minRows={2} 
              sx={{ mb: 2 }} 
              value={form.effets_secondaires || ''} 
              onChange={(e) => setForm({ ...form, effets_secondaires: e.target.value })} 
            />
            {error && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{error}</Typography>}
            {info && <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>{info}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenAddDialog(false);
            setForm({});
            setError(null);
            setInfo(null);
          }}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={async () => {
              await handleRecord();
              if (!error) {
                setOpenAddDialog(false);
                setForm({});
              }
            }} 
            disabled={!patientId || !selectedVaccineId || !form.dose_ordre || !form.date_administration}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vaccination;

