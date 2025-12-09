import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, TextField, MenuItem, Paper, Divider, Tabs, Tab, Snackbar, Alert, Select, FormControl, InputLabel } from '@mui/material';
import { Assessment } from '@mui/icons-material';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { StatBadge } from '../components/ui/StatBadge';
import { LaboratoireService, LabPrescription, LabPrelevement, LabAnalyse, LabRapport } from '../services/laboratoireService';
import { PatientService } from '../services/patientService';
import { Patient } from '../services/supabase';
import PatientSelector from '../components/shared/PatientSelector';
import PatientCard from '../components/shared/PatientCard';
import jsPDF from 'jspdf';

const Laboratoire: React.FC = () => {
  const [identifiant, setIdentifiant] = useState('');
  const [patientId, setPatientId] = useState<string>('');
  const [openPatientSelector, setOpenPatientSelector] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<LabPrescription[]>([]);
  const [prelevements, setPrelevements] = useState<LabPrelevement[]>([]);
  const [analysesByPrelevement, setAnalysesByPrelevement] = useState<Record<string, LabAnalyse[]>>({});
  const [analyseForm, setAnalyseForm] = useState<{ prelevement_id?: string; parametre: string; type_resultat: 'qualitatif' | 'quantitatif'; unite?: string; valeur_numerique?: number; valeur_qualitative?: string; bornes_reference?: string; technicien?: string; }>(
    { parametre: '', type_resultat: 'qualitatif' }
  );
  const [rapportsByPrelevement, setRapportsByPrelevement] = useState<Record<string, LabRapport[]>>({});
  const [alerts, setAlerts] = useState<string[]>([]);
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState<{ from?: string; to?: string }>({});
  const [stats, setStats] = useState<{ prescriptionsTotal: number; byService: Record<string, number>; byType: Record<string, number>; avgDelayHours: number; totalConsumptions: number; positivityRate: number; analysesCompleted: number; byTypeAnalyses: Record<string, number> } | null>(null);
  const [formRx, setFormRx] = useState<{ type_examen: string; details?: string; prescripteur?: string; service_prescripteur?: string; origine?: 'consultation' | 'urgence' | 'labo'; date_prescription?: string }>({ type_examen: '', origine: 'consultation' });
  const [formPl, setFormPl] = useState<{ prescription_id?: string; code_unique: string; type_echantillon: string; agent_preleveur?: string; commentaires?: string; date_prelevement?: string }>({ code_unique: '', type_echantillon: '' });
  const [error, setError] = useState<string | null>(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showPrelevementForm, setShowPrelevementForm] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<LabPrescription | null>(null);
  const [codeValidation, setCodeValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const [role, setRole] = useState<'technicien' | 'biologiste' | 'medecin' | 'admin'>('technicien');
  const [autosaveInfo, setAutosaveInfo] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' } | null>(null);

  const load = async (pid: string) => {
    const list = await LaboratoireService.listPrescriptions(pid);
    setPrescriptions(list);
    const allPl: LabPrelevement[] = [];
    for (const rx of list) {
      const pls = await LaboratoireService.listPrelevements(rx.id);
      allPl.push(...pls);
    }
    setPrelevements(allPl);
    const byPl: Record<string, LabAnalyse[]> = {};
    for (const pl of allPl) {
      byPl[pl.id] = await LaboratoireService.listAnalyses(pl.id);
    }
    setAnalysesByPrelevement(byPl);
    const byPlRap: Record<string, LabRapport[]> = {};
    for (const pl of allPl) {
      byPlRap[pl.id] = await LaboratoireService.listRapports(pl.id);
    }
    setRapportsByPrelevement(byPlRap);
    const stockAlerts = await LaboratoireService.getConsumableAlertsForVaccinesAndLab();
    setAlerts(stockAlerts.map(a => `${a.type.toUpperCase()}: ${a.message}`));
  };

  const handleSelectPatient = async (patient: Patient) => {
    setPatientId(patient.id);
    setIdentifiant(patient.identifiant);
    setSelectedPatient(patient);
    await load(patient.id);
  };

  const handleFind = async () => {
    setOpenPatientSelector(true);
  };

  const handleCreatePrescription = async () => {
    setError(null);
    try {
      if (!patientId) { setError('Sélectionnez un patient'); return; }
      if (!formRx.type_examen) { setError('Type d\'examen requis'); return; }
      await LaboratoireService.createPrescription({ patient_id: patientId, ...formRx });
      await load(patientId);
      setFormRx({ type_examen: '', origine: 'consultation' });
      setShowPrescriptionForm(false);
    } catch { setError('Erreur création prescription'); }
  };

  const handleGenerateCode = async () => {
    try {
      const code = await LaboratoireService.generateUniqueCode();
      setFormPl({ ...formPl, code_unique: code });
      setCodeValidation({ isValid: true, message: 'Code généré avec succès' });
    } catch { setError('Erreur génération code'); }
  };

  const handleValidateCode = async () => {
    if (!formPl.code_unique) return;
    try {
      const isValid = await LaboratoireService.validatePrelevementCode(formPl.code_unique);
      setCodeValidation({ 
        isValid, 
        message: isValid ? 'Code disponible' : 'Code déjà utilisé' 
      });
    } catch { setError('Erreur validation code'); }
  };

  const handleSelectPrescription = (prescription: LabPrescription) => {
    setSelectedPrescription(prescription);
    setFormPl({ ...formPl, prescription_id: prescription.id });
    setShowPrelevementForm(true);
  };

  const handleCreatePrelevement = async () => {
    setError(null);
    try {
      if (!formPl.prescription_id) { setError('Sélectionnez une prescription'); return; }
      if (!formPl.code_unique || !formPl.type_echantillon) { setError('Code unique et type d\'échantillon requis'); return; }
      await LaboratoireService.createPrelevement(formPl as any);
      await load(patientId);
      setFormPl({ code_unique: '', type_echantillon: '' });
      setShowPrelevementForm(false);
      setSelectedPrescription(null);
    } catch { setError('Erreur création prélèvement'); }
  };

  const handleCreateAnalyse = async () => {
    setError(null);
    try {
      if (!analyseForm.prelevement_id) { setError('Sélectionnez un prélèvement'); return; }
      if (!analyseForm.parametre) { setError('Paramètre requis'); return; }
      await LaboratoireService.createAnalyse(analyseForm as any);
      if (patientId) await load(patientId);
      setAnalyseForm({ parametre: '', type_resultat: 'qualitatif' });
    } catch { setError('Erreur création analyse'); }
  };

  // --- Autosave local (non-fonctionnelle) pour conformité UX ---
  useEffect(() => {
    const rxDraft = localStorage.getItem('lab_rx_draft');
    const plDraft = localStorage.getItem('lab_pl_draft');
    const anDraft = localStorage.getItem('lab_an_draft');
    if (rxDraft) setFormRx(JSON.parse(rxDraft));
    if (plDraft) setFormPl(JSON.parse(plDraft));
    if (anDraft) setAnalyseForm(JSON.parse(anDraft));
  }, []);

  useEffect(() => {
    localStorage.setItem('lab_rx_draft', JSON.stringify(formRx));
    setAutosaveInfo('Prescription enregistrée automatiquement');
  }, [formRx]);

  useEffect(() => {
    localStorage.setItem('lab_pl_draft', JSON.stringify(formPl));
    setAutosaveInfo('Prélèvement enregistré automatiquement');
  }, [formPl]);

  useEffect(() => {
    localStorage.setItem('lab_an_draft', JSON.stringify(analyseForm));
    setAutosaveInfo('Analyse (brouillon) enregistrée automatiquement');
  }, [analyseForm]);

  // --- Double validation & notifications ---
  const validateByTechnician = async (a: LabAnalyse) => {
    try {
      await LaboratoireService.updateAnalyse(a.id, { statut: 'en_cours', technicien: 'Tech Labo' } as any);
      if (patientId) await load(patientId);
      setSnackbar({ open: true, message: 'Validation technicien enregistrée', severity: 'success' });
    } catch { setSnackbar({ open: true, message: 'Erreur validation technicien', severity: 'error' }); }
  };

  const validateByBiologist = async (a: LabAnalyse) => {
    try {
      await LaboratoireService.updateAnalyse(a.id, { statut: 'termine', valide_par: 'Biologiste', date_validation: new Date().toISOString() } as any);
      if (patientId) await load(patientId);
      setSnackbar({ open: true, message: 'Analyse validée par le biologiste', severity: 'success' });
      notifyMedecin();
    } catch { setSnackbar({ open: true, message: 'Erreur validation biologiste', severity: 'error' }); }
  };

  const notifyMedecin = () => {
    setSnackbar({ open: true, message: 'Notification envoyée au médecin (simulation)', severity: 'info' });
  };

  // --- PDF rapport signé ---
  const downloadRapportPDF = async (pl: LabPrelevement) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Rapport de Laboratoire', 14, 18);
    doc.setFontSize(10);
    doc.text(`Prélèvement: ${pl.code_unique} • ${new Date(pl.date_prelevement).toLocaleString()} • ${pl.type_echantillon}`, 14, 26);
    doc.text(`Patient ID: ${patientId || ''}`, 14, 32);
    doc.line(14, 34, 196, 34);
    const linesStart = 42;
    const list = analysesByPrelevement[pl.id] || [];
    let y = linesStart;
    list.forEach(a => {
      const row = `${a.parametre}  |  ${a.type_resultat === 'qualitatif' ? (a.valeur_qualitative || '-') : (a.valeur_numerique ?? '-')} ${a.unite || ''}  ${a.bornes_reference ? ` • Réf: ${a.bornes_reference}` : ''}`;
      doc.text(row, 14, y);
      y += 6;
    });
    y += 4;
    doc.line(14, y, 196, y);
    y += 8;
    doc.text('Signature électronique: SIGNATURE_HASH_DEMO', 14, y);
    doc.save(`rapport_${pl.code_unique}.pdf`);
    setSnackbar({ open: true, message: 'Rapport PDF généré', severity: 'success' });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête amélioré */}
      <ToolbarBits sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Assessment color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <GradientText variant="h4">Module Laboratoire</GradientText>
            <Typography variant="body2" color="text.secondary">
              Gestion des examens de laboratoire et analyses médicales
            </Typography>
          </Box>
        </Box>
      </ToolbarBits>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Rôle</InputLabel>
          <Select label="Rôle" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <MenuItem value="technicien">Technicien</MenuItem>
            <MenuItem value="biologiste">Biologiste</MenuItem>
            <MenuItem value="medecin">Médecin</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
        {autosaveInfo && (
          <Typography variant="caption" color="text.secondary">{autosaveInfo}</Typography>
        )}
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <GlassCard sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Patient</Typography>
              <Button 
                variant="contained" 
                fullWidth
                onClick={handleFind}
                sx={{ mb: 2 }}
              >
                Sélectionner un patient
              </Button>
              {selectedPatient && (
                <Box sx={{ mt: 2 }}>
                  <PatientCard patient={selectedPatient} compact />
                </Box>
              )}
              {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
              
              <PatientSelector
                open={openPatientSelector}
                onClose={() => setOpenPatientSelector(false)}
                onSelect={handleSelectPatient}
                title="Sélectionner un patient pour le laboratoire"
                allowCreate={true}
                onCreateNew={() => {
                  window.location.href = '/patients?action=create&service=Laboratoire';
                }}
              />
          </GlassCard>

          <GlassCard sx={{ mt: 3, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Prescription d'examen</Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setShowPrescriptionForm(!showPrescriptionForm)}
                  disabled={!patientId}
                >
                  {showPrescriptionForm ? 'Masquer' : 'Nouvelle prescription'}
                </Button>
              </Box>
              
              {showPrescriptionForm && (
                <>
                  <TextField 
                    label="Type d'examen" 
                    value={formRx.type_examen} 
                    onChange={(e) => setFormRx({ ...formRx, type_examen: e.target.value })} 
                    fullWidth 
                    sx={{ mb: 2 }}
                    select
                  >
                    <MenuItem value="Glycémie">Glycémie</MenuItem>
                    <MenuItem value="Hémogramme">Hémogramme</MenuItem>
                    <MenuItem value="VIH">Test VIH</MenuItem>
                    <MenuItem value="Paludisme">Test Paludisme</MenuItem>
                    <MenuItem value="Urine">Analyse d'urine</MenuItem>
                    <MenuItem value="Biochimie">Biochimie</MenuItem>
                    <MenuItem value="Autre">Autre</MenuItem>
                  </TextField>
                  <TextField label="Prescripteur" value={formRx.prescripteur || ''} onChange={(e) => setFormRx({ ...formRx, prescripteur: e.target.value })} fullWidth sx={{ mb: 2 }} />
                  <TextField type="date" label="Date de prescription" InputLabelProps={{ shrink: true }} value={formRx.date_prescription || ''} onChange={(e) => setFormRx({ ...formRx, date_prescription: e.target.value })} fullWidth sx={{ mb: 2 }} />
                  <TextField label="Service" value={formRx.service_prescripteur || ''} onChange={(e) => setFormRx({ ...formRx, service_prescripteur: e.target.value })} fullWidth sx={{ mb: 2 }} />
                  <TextField select label="Origine" value={formRx.origine || 'consultation'} onChange={(e) => setFormRx({ ...formRx, origine: e.target.value as any })} fullWidth sx={{ mb: 2 }}>
                    <MenuItem value="consultation">Consultation</MenuItem>
                    <MenuItem value="urgence">Urgence</MenuItem>
                    <MenuItem value="labo">Laboratoire</MenuItem>
                  </TextField>
                  <TextField label="Détails" value={formRx.details || ''} onChange={(e) => setFormRx({ ...formRx, details: e.target.value })} fullWidth multiline minRows={2} sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" onClick={handleCreatePrescription} disabled={!patientId || !formRx.type_examen}>
                      Créer prescription
                    </Button>
                    <Button variant="outlined" onClick={() => setShowPrescriptionForm(false)}>
                      Annuler
                    </Button>
                  </Box>
                </>
              )}
          </GlassCard>

          <GlassCard sx={{ mt: 3, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Prélèvement</Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setShowPrelevementForm(!showPrelevementForm)}
                  disabled={!patientId || prescriptions.length === 0}
                >
                  {showPrelevementForm ? 'Masquer' : 'Nouveau prélèvement'}
                </Button>
              </Box>
              
              {showPrelevementForm && (
                <>
                  <TextField 
                    select 
                    label="Prescription" 
                    value={formPl.prescription_id || ''} 
                    onChange={(e) => {
                      const prescription = prescriptions.find(p => p.id === e.target.value);
                      setSelectedPrescription(prescription || null);
                      setFormPl({ ...formPl, prescription_id: e.target.value });
                    }} 
                    fullWidth 
                    sx={{ mb: 2 }}
                  >
                    {prescriptions.filter(p => p.statut === 'prescrit').map(p => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.type_examen} - {new Date(p.date_prescription).toLocaleDateString()}
                      </MenuItem>
                    ))}
                  </TextField>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField 
                      label="Code unique" 
                      value={formPl.code_unique} 
                      onChange={(e) => {
                        setFormPl({ ...formPl, code_unique: e.target.value });
                        setCodeValidation(null);
                      }} 
                      fullWidth 
                      error={codeValidation ? !codeValidation.isValid : false}
                      helperText={codeValidation?.message}
                    />
                    <Button variant="outlined" onClick={handleGenerateCode} sx={{ minWidth: 120 }}>
                      Générer
                    </Button>
                    <Button variant="outlined" onClick={handleValidateCode} sx={{ minWidth: 100 }}>
                      Valider
                    </Button>
                  </Box>
                  
                  <TextField 
                    select 
                    label="Type d'échantillon" 
                    value={formPl.type_echantillon} 
                    onChange={(e) => setFormPl({ ...formPl, type_echantillon: e.target.value })} 
                    fullWidth 
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="Sang">Sang</MenuItem>
                    <MenuItem value="Urine">Urine</MenuItem>
                    <MenuItem value="Selles">Selles</MenuItem>
                    <MenuItem value="Salive">Salive</MenuItem>
                    <MenuItem value="Autre">Autre</MenuItem>
                  </TextField>
                  
                  <TextField 
                    label="Agent préleveur" 
                    value={formPl.agent_preleveur || ''} 
                    onChange={(e) => setFormPl({ ...formPl, agent_preleveur: e.target.value })} 
                    fullWidth 
                    sx={{ mb: 2 }} 
                  />
                  <TextField type="datetime-local" label="Date et heure du prélèvement" InputLabelProps={{ shrink: true }} value={formPl.date_prelevement || ''} onChange={(e) => setFormPl({ ...formPl, date_prelevement: e.target.value })} fullWidth sx={{ mb: 2 }} />
                  
                  <TextField 
                    label="Commentaires" 
                    value={formPl.commentaires || ''} 
                    onChange={(e) => setFormPl({ ...formPl, commentaires: e.target.value })} 
                    fullWidth 
                    multiline 
                    minRows={2} 
                    sx={{ mb: 2 }} 
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                      variant="contained" 
                      onClick={handleCreatePrelevement} 
                      disabled={!formPl.prescription_id || !formPl.code_unique || !formPl.type_echantillon}
                    >
                      Créer prélèvement
                    </Button>
                    <Button variant="outlined" onClick={() => setShowPrelevementForm(false)}>
                      Annuler
                    </Button>
                  </Box>
                </>
              )}
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <GlassCard sx={{ p: 2 }}>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label="Prescriptions & Prélèvements" />
              <Tab label="Rapports & Stats" />
            </Tabs>
            {tab === 0 && (
              <>
              <Typography variant="h6" gutterBottom>Prescriptions</Typography>
            <Divider sx={{ mb: 2 }} />
            {prescriptions.map(rx => (
              <Box key={rx.id} sx={{ borderBottom: '1px solid #eee', py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {rx.type_examen}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(rx.date_prescription).toLocaleString()} • 
                      {rx.prescripteur && ` Prescripteur: ${rx.prescripteur}`} • 
                      {rx.service_prescripteur && ` Service: ${rx.service_prescripteur}`}
                    </Typography>
                    {rx.details && (
                      <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                        {rx.details}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1, 
                        backgroundColor: rx.statut === 'prescrit' ? 'warning.light' : 
                                       rx.statut === 'preleve' ? 'success.light' : 'error.light',
                        color: rx.statut === 'prescrit' ? 'warning.contrastText' : 
                               rx.statut === 'preleve' ? 'success.contrastText' : 'error.contrastText'
                      }}
                    >
                      {rx.statut.toUpperCase()}
                    </Typography>
                    {rx.statut === 'prescrit' && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleSelectPrescription(rx)}
                        sx={{ minWidth: 100 }}
                      >
                        Prélever
                      </Button>
                    )}
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={async () => {
                        try {
                          await LaboratoireService.cancelPrescription(rx.id);
                          await load(patientId);
                        } catch (e) {
                          setError('Erreur annulation prescription');
                        }
                      }}
                    >
                      Annuler
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}

            <Typography variant="h6" sx={{ mt: 3 }}>Prélèvements</Typography>
            <Divider sx={{ mb: 2 }} />
            {prelevements.map(pl => (
              <Box key={pl.id} sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                <Typography>{new Date(pl.date_prelevement).toLocaleString()} • {pl.type_echantillon} • {pl.code_unique}</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  <TextField size="small" label="Paramètre" value={analyseForm.prelevement_id === pl.id ? analyseForm.parametre : ''} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, parametre: e.target.value })} />
                  <TextField size="small" select label="Type" value={analyseForm.prelevement_id === pl.id ? analyseForm.type_resultat : 'qualitatif'} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, type_resultat: e.target.value as any })}>
                    <MenuItem value="qualitatif">Qualitatif</MenuItem>
                    <MenuItem value="quantitatif">Quantitatif</MenuItem>
                  </TextField>
                  <TextField size="small" label="Unité" value={analyseForm.prelevement_id === pl.id ? (analyseForm.unite || '') : ''} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, unite: e.target.value })} />
                  <TextField size="small" label="Valeur num." type="number" value={analyseForm.prelevement_id === pl.id ? (analyseForm.valeur_numerique || '') : ''} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, valeur_numerique: parseFloat(e.target.value) })} />
                  <TextField size="small" label="Valeur qual." value={analyseForm.prelevement_id === pl.id ? (analyseForm.valeur_qualitative || '') : ''} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, valeur_qualitative: e.target.value })} />
                  <TextField size="small" label="Bornes réf." value={analyseForm.prelevement_id === pl.id ? (analyseForm.bornes_reference || '') : ''} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, bornes_reference: e.target.value })} />
                  <TextField size="small" label="Technicien" value={analyseForm.prelevement_id === pl.id ? (analyseForm.technicien || '') : ''} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, technicien: e.target.value })} />
                  <Button size="small" variant="outlined" onClick={handleCreateAnalyse}>Ajouter analyse</Button>
                </Box>
                  <Box sx={{ mt: 1 }}>
                  {(analysesByPrelevement[pl.id] || []).map(a => (
                    <Box key={a.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="body2">
                        {a.parametre} • {a.type_resultat === 'qualitatif' ? (a.valeur_qualitative || '-') : (a.valeur_numerique ?? '-')} {a.unite || ''}
                        {a.bornes_reference ? ` • Réf: ${a.bornes_reference}` : ''}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2">{a.statut}{a.technicien ? ` • Tech: ${a.technicien}` : ''}{a.valide_par ? ` • Validé par ${a.valide_par}` : ''}</Typography>
                        {a.statut !== 'termine' && role === 'technicien' && (
                          <Button size="small" variant="outlined" onClick={() => validateByTechnician(a)}>Validation Technicien</Button>
                        )}
                        {a.statut !== 'termine' && (role === 'biologiste' || role === 'admin') && (
                          <Button size="small" variant="contained" onClick={() => validateByBiologist(a)}>Validation Biologiste</Button>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button size="small" variant="outlined" onClick={async () => {
                    await LaboratoireService.generateRapport(pl.id);
                    if (patientId) await load(patientId);
                  }}>Générer rapport</Button>
                    <Button size="small" variant="outlined" onClick={() => downloadRapportPDF(pl)}>Télécharger PDF</Button>
                  {(rapportsByPrelevement[pl.id] || []).map(rp => (
                    <Box key={rp.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="body2">{rp.numero_rapport} • {rp.statut}</Typography>
                      <Button size="small" onClick={async () => {
                        await LaboratoireService.signRapport(rp.id, 'Validateur Labo');
                        if (patientId) await load(patientId);
                      }}>Signer</Button>
                      <Button size="small" onClick={async () => {
                        await LaboratoireService.transmitRapport(rp.id, 'Consultation');
                        if (patientId) await load(patientId);
                          setSnackbar({ open: true, message: 'Rapport transmis (simulation email sécurisé)', severity: 'info' });
                        }}>Transmettre</Button>
                      <Button size="small" onClick={() => window.print()}>Imprimer</Button>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}

            {alerts.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6">Alertes</Typography>
                {alerts.map((m, i) => (
                  <Typography key={i} color="warning.main" variant="body2">• {m}</Typography>
                ))}
              </Box>
            )}
              </>
            )}

            {tab === 1 && (
              <>
                <Typography variant="h6" gutterBottom>Rapports & Tableaux de bord</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <TextField type="date" label="Du" InputLabelProps={{ shrink: true }} size="small" value={period.from || ''} onChange={(e) => setPeriod({ ...period, from: e.target.value })} />
                  <TextField type="date" label="Au" InputLabelProps={{ shrink: true }} size="small" value={period.to || ''} onChange={(e) => setPeriod({ ...period, to: e.target.value })} />
                  <Button variant="outlined" onClick={async () => {
                    const s = await LaboratoireService.getLabStats({ from: period.from, to: period.to });
                    setStats(s);
                  }}>Charger</Button>
                </Box>
                {stats && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <GlassCard sx={{ p: 2 }}>
                        <StatBadge label="Examens prescrits" value={stats.prescriptionsTotal} color="primary" />
                      </GlassCard>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <GlassCard sx={{ p: 2 }}>
                        <StatBadge label="Délai moyen (h)" value={stats.avgDelayHours.toFixed(1)} color="info" />
                      </GlassCard>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <GlassCard sx={{ p: 2 }}>
                        <StatBadge label="Conso. réactifs (unités)" value={stats.totalConsumptions} color="warning" />
                      </GlassCard>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <GlassCard sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Par service</Typography>
                        {Object.entries(stats.byService).map(([svc, count]) => (
                          <Box key={svc} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{svc}</Typography>
                            <Typography variant="body2">{count}</Typography>
                          </Box>
                        ))}
                      </GlassCard>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <GlassCard sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Par type d'examen</Typography>
                        {Object.entries(stats.byType).map(([typ, count]) => (
                          <Box key={typ} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{typ}</Typography>
                            <Typography variant="body2">{count}</Typography>
                          </Box>
                        ))}
                      </GlassCard>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <GlassCard sx={{ p: 2 }}>
                        <StatBadge label="Analyses terminées" value={stats.analysesCompleted} color="success" />
                      </GlassCard>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <GlassCard sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Analyses par type</Typography>
                        {Object.entries(stats.byTypeAnalyses).map(([typ, count]) => (
                          <Box key={typ} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{typ}</Typography>
                            <Typography variant="body2">{count}</Typography>
                          </Box>
                        ))}
                      </GlassCard>
                    </Grid>
                    <Grid item xs={12}>
                      <GlassCard sx={{ p: 2 }}>
                        <StatBadge label="Taux de positivité (VIH/Paludisme)" value={`${stats.positivityRate.toFixed(1)}%`} color="error" />
                      </GlassCard>
                    </Grid>
                  </Grid>
                )}
              </>
            )}
          </GlassCard>
        </Grid>
      </Grid>
    <Snackbar open={!!snackbar?.open} autoHideDuration={4000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert severity={snackbar?.severity || 'info'} onClose={() => setSnackbar(null)} sx={{ width: '100%' }}>
        {snackbar?.message}
      </Alert>
    </Snackbar>
    </Box>
  );
};

export default Laboratoire;


