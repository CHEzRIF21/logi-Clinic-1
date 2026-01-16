import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card as MuiCard, CardContent as MuiCardContent, Button, TextField, MenuItem, Paper, Divider, Tabs, Tab, Snackbar, Alert as MuiAlert, Select, FormControl, InputLabel, Autocomplete, Chip } from '@mui/material';
import { Assessment, Search, AttachMoney } from '@mui/icons-material';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { StatBadge } from '../components/ui/StatBadge';
import { LaboratoireService, LabPrescription, LabPrelevement, LabAnalyse, LabRapport } from '../services/laboratoireService';
import LaboratoireApiService from '../services/laboratoireApiService';
import { PatientService } from '../services/patientService';
import PatientApiService from '../services/patientApiService';
import { Patient } from '../services/supabase';
import PatientSelector from '../components/shared/PatientSelector';
import PatientCard from '../components/shared/PatientCard';
import { PaymentNotification } from '../components/shared/PaymentNotification';
import { PaymentStatusCell } from '../components/shared/PaymentStatusCell';
import { PaymentGateWrapper } from '../components/shared/PaymentGateWrapper';
import LabDashboard from '../components/laboratoire/LabDashboard';
import LabDashboardModern from '../components/laboratoire/LabDashboardModern';
import PaillasseNumerique from '../components/laboratoire/PaillasseNumerique';
import PaillasseNumeriqueModern from '../components/laboratoire/PaillasseNumeriqueModern';
import GestionStocksReactifs from '../components/laboratoire/GestionStocksReactifs';
import IntegrationsPanel from '../components/laboratoire/IntegrationsPanel';
import IntegrationsPanelModern from '../components/laboratoire/IntegrationsPanelModern';
import { LaboratoireTarificationService, AnalyseTarif } from '../services/laboratoireTarificationService';
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
  const [formRx, setFormRx] = useState<{ type_examen: string; details?: string; prescripteur?: string; service_prescripteur?: string; origine?: 'consultation' | 'urgence' | 'labo'; date_prescription?: string; analyses_selectionnees?: AnalyseTarif[]; montant_total?: number }>({ type_examen: '', origine: 'consultation', analyses_selectionnees: [], montant_total: 0 });
  const [rechercheAnalyse, setRechercheAnalyse] = useState('');
  const [analysesDisponibles, setAnalysesDisponibles] = useState<AnalyseTarif[]>([]);
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
      if (!formRx.type_examen && (!formRx.analyses_selectionnees || formRx.analyses_selectionnees.length === 0)) { 
        setError('Sélectionnez au moins un examen ou une analyse'); 
        return; 
      }
      
      // Si des analyses sont sélectionnées, utiliser le nom de la première comme type_examen
      const typeExamen = formRx.type_examen || 
        (formRx.analyses_selectionnees && formRx.analyses_selectionnees.length > 0 
          ? formRx.analyses_selectionnees.map(a => a.nom).join(', ')
          : '');
      
      const details = formRx.details || 
        (formRx.analyses_selectionnees && formRx.analyses_selectionnees.length > 0
          ? `Analyses: ${formRx.analyses_selectionnees.map(a => `${a.nom} (${LaboratoireTarificationService.formaterPrix(a.prix)})`).join(', ')}`
          : '');
      
      await LaboratoireService.createPrescription({ 
        patient_id: patientId, 
        ...formRx, 
        type_examen: typeExamen,
        details: details,
        analyses_selectionnees: formRx.analyses_selectionnees,
        montant_total: formRx.montant_total
      });
      await load(patientId);
      setFormRx({ type_examen: '', origine: 'consultation', analyses_selectionnees: [], montant_total: 0 });
      setShowPrescriptionForm(false);
      setSnackbar({ open: true, message: 'Prescription créée avec succès', severity: 'success' });
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

  // Charger les analyses disponibles au démarrage
  useEffect(() => {
    setAnalysesDisponibles(LaboratoireTarificationService.getAllTarifs());
  }, []);

  // Mettre à jour le montant total quand les analyses changent
  useEffect(() => {
    if (formRx.analyses_selectionnees && formRx.analyses_selectionnees.length > 0) {
      const total = formRx.analyses_selectionnees.reduce((sum, a) => sum + a.prix, 0);
      setFormRx({ ...formRx, montant_total: total });
    } else {
      setFormRx({ ...formRx, montant_total: 0 });
    }
  }, [formRx.analyses_selectionnees]);

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

  // --- PDF rapport signé amélioré ---
  const downloadRapportPDF = async (pl: LabPrelevement) => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('RAPPORT DE LABORATOIRE', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.line(14, 20, 196, 20);
    
    // Informations patient
    if (selectedPatient) {
      doc.setFont(undefined, 'bold');
      doc.text('PATIENT:', 14, 28);
      doc.setFont(undefined, 'normal');
      doc.text(`${selectedPatient.nom} ${selectedPatient.prenom}`, 50, 28);
      doc.text(`ID: ${selectedPatient.identifiant}`, 14, 34);
      doc.text(`Âge: ${selectedPatient.age} ans • Sexe: ${selectedPatient.sexe}`, 14, 40);
    }
    
    // Informations prélèvement
    doc.setFont(undefined, 'bold');
    doc.text('PRÉLÈVEMENT:', 14, 48);
    doc.setFont(undefined, 'normal');
    doc.text(`Code: ${pl.code_unique}`, 60, 48);
    doc.text(`Type: ${pl.type_echantillon}`, 14, 54);
    doc.text(`Date: ${new Date(pl.date_prelevement).toLocaleString('fr-FR')}`, 14, 60);
    if (pl.agent_preleveur) {
      doc.text(`Prélevé par: ${pl.agent_preleveur}`, 14, 66);
    }
    
    doc.line(14, 72, 196, 72);
    
    // Résultats
    doc.setFont(undefined, 'bold');
    doc.text('RÉSULTATS:', 14, 80);
    doc.setFont(undefined, 'normal');
    
    let y = 88;
    const list = analysesByPrelevement[pl.id] || [];
    
    list.forEach(a => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      const valeur = a.type_resultat === 'qualitatif' 
        ? (a.valeur_qualitative || '-')
        : `${a.valeur_numerique ?? '-'} ${a.unite || ''}`.trim();
      
      // Paramètre et valeur (en rouge si pathologique)
      doc.setFont(undefined, a.est_pathologique ? 'bold' : 'normal');
      doc.setTextColor(a.est_pathologique ? 255 : 0, a.est_pathologique ? 0 : 0, a.est_pathologique ? 0 : 0);
      doc.text(`${a.parametre}:`, 14, y);
      doc.text(valeur, 80, y);
      
      // Valeurs de référence
      if (a.valeur_min_reference !== undefined && a.valeur_max_reference !== undefined) {
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Réf: ${a.valeur_min_reference} - ${a.valeur_max_reference} ${a.unite || ''}`, 120, y);
      } else if (a.bornes_reference) {
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Réf: ${a.bornes_reference}`, 120, y);
      }
      
      // Delta Check
      if (a.valeur_precedente_numerique !== undefined) {
        doc.setFont(undefined, 'italic');
        doc.setTextColor(0, 100, 200);
        y += 5;
        doc.text(`Précédent: ${a.valeur_precedente_numerique} ${a.unite || ''} (${new Date(a.date_resultat_precedent || '').toLocaleDateString('fr-FR')})`, 14, y);
        if (a.evolution) {
          doc.text(`Évolution: ${a.evolution === 'amelioration' ? 'Amélioration' : a.evolution === 'aggravation' ? 'Aggravation' : a.evolution === 'stabilite' ? 'Stabilité' : 'Nouveau'}`, 14, y + 5);
          y += 5;
        }
      }
      
      doc.setTextColor(0, 0, 0);
      y += 8;
    });
    
    // Signature
    y = Math.max(y + 10, 250);
    doc.line(14, y, 196, y);
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Signature électronique:', 14, y);
    doc.setFont(undefined, 'normal');
    doc.text('SIGNATURE_HASH_DEMO', 14, y + 6);
    
    const rapport = rapportsByPrelevement[pl.id]?.[0];
    if (rapport?.signe_par) {
      doc.text(`Signé par: ${rapport.signe_par}`, 14, y + 12);
      doc.text(`Date: ${new Date(rapport.date_signature || '').toLocaleString('fr-FR')}`, 14, y + 18);
    }
    
    // Code-barres (simulation)
    doc.setFontSize(8);
    doc.text(`Code-barres: ${LaboratoireService.generateBarcodeData(patientId, pl.id)}`, 14, y + 24);
    
    doc.save(`rapport_${pl.code_unique}_${new Date().toISOString().split('T')[0]}.pdf`);
    setSnackbar({ open: true, message: 'Rapport PDF généré avec succès', severity: 'success' });
  };

  const analysesFiltrees = rechercheAnalyse 
    ? LaboratoireTarificationService.rechercherAnalyses(rechercheAnalyse)
    : analysesDisponibles;

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 }, 
      maxWidth: '100%', 
      overflowX: 'hidden',
      width: '100%'
    }}>
      {/* En-tête amélioré */}
      <ToolbarBits sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <Assessment color="primary" sx={{ fontSize: { xs: 30, sm: 40 } }} />
          <Box>
            <GradientText variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>Module Laboratoire</GradientText>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Gestion des examens de laboratoire et analyses médicales
            </Typography>
          </Box>
        </Box>
      </ToolbarBits>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 2,
        flexWrap: 'wrap'
      }}>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
          <InputLabel>Rôle</InputLabel>
          <Select label="Rôle" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <MenuItem value="technicien">Technicien</MenuItem>
            <MenuItem value="biologiste">Biologiste</MenuItem>
            <MenuItem value="medecin">Médecin</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
        {autosaveInfo && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
            {autosaveInfo}
          </Typography>
        )}
      </Box>

      {/* Layout vertical responsive - plus de Grid horizontal */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        {/* Section Patient */}
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
              {/* Notification de statut de paiement si consultation_id existe */}
              {prescriptions.length > 0 && prescriptions[0].consultation_id && (
                <Box sx={{ mt: 2 }}>
                  <PaymentNotification
                    consultationId={prescriptions[0].consultation_id}
                    patientId={selectedPatient.id}
                    showNotification={true}
                  />
                </Box>
              )}
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

        {/* Section Prescription avec sélection d'analyses */}
        <GlassCard sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Recherche et sélection d'analyses */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                  Sélectionner les analyses
                </Typography>
                <TextField
                  fullWidth
                  label="Rechercher une analyse"
                  value={rechercheAnalyse}
                  onChange={(e) => setRechercheAnalyse(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
                
                {/* Liste des analyses disponibles avec tarifs */}
                <Paper sx={{ maxHeight: 300, overflow: 'auto', p: 1, mb: 2 }}>
                  {analysesFiltrees.map((analyse) => {
                    const isSelected = formRx.analyses_selectionnees?.some(a => a.code === analyse.code);
                    return (
                      <Box
                        key={analyse.code}
                        onClick={() => {
                          if (isSelected) {
                            setFormRx({
                              ...formRx,
                              analyses_selectionnees: formRx.analyses_selectionnees?.filter(a => a.code !== analyse.code) || []
                            });
                          } else {
                            setFormRx({
                              ...formRx,
                              analyses_selectionnees: [...(formRx.analyses_selectionnees || []), analyse]
                            });
                          }
                        }}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          cursor: 'pointer',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          backgroundColor: isSelected ? 'primary.light' : 'background.paper',
                          '&:hover': {
                            backgroundColor: isSelected ? 'primary.light' : 'action.hover'
                          },
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 1
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 200 }}>
                          <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                            {analyse.numero}. {analyse.nom}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {analyse.tube}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {LaboratoireTarificationService.formaterPrix(analyse.prix)}
                          </Typography>
                          {isSelected && <Chip label="Sélectionné" size="small" color="primary" />}
                        </Box>
                      </Box>
                    );
                  })}
                </Paper>

                {/* Analyses sélectionnées */}
                {formRx.analyses_selectionnees && formRx.analyses_selectionnees.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Analyses sélectionnées ({formRx.analyses_selectionnees.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formRx.analyses_selectionnees.map((analyse) => (
                        <Chip
                          key={analyse.code}
                          label={`${analyse.nom} - ${LaboratoireTarificationService.formaterPrix(analyse.prix)}`}
                          onDelete={() => {
                            setFormRx({
                              ...formRx,
                              analyses_selectionnees: formRx.analyses_selectionnees?.filter(a => a.code !== analyse.code) || []
                            });
                          }}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                      <Typography variant="h6" color="primary">
                        Total: {LaboratoireTarificationService.formaterPrix(formRx.montant_total || 0)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              <Divider />

              {/* Champs de prescription classiques */}
              <TextField 
                label="Type d'examen (optionnel si analyses sélectionnées)" 
                value={formRx.type_examen} 
                onChange={(e) => setFormRx({ ...formRx, type_examen: e.target.value })} 
                fullWidth 
                sx={{ mb: 2 }}
                helperText="Laissez vide si vous avez sélectionné des analyses ci-dessus"
              />
              <TextField label="Prescripteur" value={formRx.prescripteur || ''} onChange={(e) => setFormRx({ ...formRx, prescripteur: e.target.value })} fullWidth sx={{ mb: 2 }} />
              <TextField type="date" label="Date de prescription" InputLabelProps={{ shrink: true }} value={formRx.date_prescription || ''} onChange={(e) => setFormRx({ ...formRx, date_prescription: e.target.value })} fullWidth sx={{ mb: 2 }} />
              <TextField label="Service" value={formRx.service_prescripteur || ''} onChange={(e) => setFormRx({ ...formRx, service_prescripteur: e.target.value })} fullWidth sx={{ mb: 2 }} />
              <TextField select label="Origine" value={formRx.origine || 'consultation'} onChange={(e) => setFormRx({ ...formRx, origine: e.target.value as any })} fullWidth sx={{ mb: 2 }}>
                <MenuItem value="consultation">Consultation</MenuItem>
                <MenuItem value="urgence">Urgence</MenuItem>
                <MenuItem value="labo">Laboratoire</MenuItem>
              </TextField>
              <TextField label="Détails" value={formRx.details || ''} onChange={(e) => setFormRx({ ...formRx, details: e.target.value })} fullWidth multiline minRows={2} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  onClick={handleCreatePrescription} 
                  disabled={!patientId || (!formRx.type_examen && (!formRx.analyses_selectionnees || formRx.analyses_selectionnees.length === 0))}
                  startIcon={<AttachMoney />}
                >
                  Créer prescription
                </Button>
                <Button variant="outlined" onClick={() => setShowPrescriptionForm(false)}>
                  Annuler
                </Button>
              </Box>
            </Box>
          )}
        </GlassCard>

        {/* Section Prélèvement */}
        <GlassCard sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField 
                  label="Code unique" 
                  value={formPl.code_unique} 
                  onChange={(e) => {
                    setFormPl({ ...formPl, code_unique: e.target.value });
                    setCodeValidation(null);
                  }} 
                  fullWidth
                  sx={{ flex: 1, minWidth: 200 }}
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
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
            </Box>
          )}
        </GlassCard>

        {/* Section principale avec onglets */}
        <GlassCard sx={{ p: 2, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <Tabs 
              value={tab} 
              onChange={(e, v) => setTab(v)} 
              sx={{ mb: 2 }}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab label="Dashboard" />
              <Tab label="Prescriptions & Prélèvements" />
              <Tab label="Paillasse Numérique" />
              <Tab label="Stocks Réactifs" />
              <Tab label="Intégrations" />
              <Tab label="Rapports & Stats" />
            </Tabs>
            {tab === 0 && (
              <LabDashboardModern
                onSelectPrelevement={(prelevement) => {
                  // Charger les données du patient pour ce prélèvement
                  const prescription = prescriptions.find(p => p.id === prelevement.prescription_id);
                  if (prescription) {
                    setPatientId(prescription.patient_id);
                    load(prescription.patient_id);
                    setTab(2); // Aller à l'onglet Paillasse Numérique
                  }
                }}
                onSelectAnalyse={(analyse) => {
                  // Trouver le prélèvement et charger les données
                  const prelevement = prelevements.find(p => p.id === analyse.prelevement_id);
                  if (prelevement) {
                    const prescription = prescriptions.find(p => p.id === prelevement.prescription_id);
                    if (prescription) {
                      setPatientId(prescription.patient_id);
                      load(prescription.patient_id);
                      setTab(2);
                    }
                  }
                }}
              />
            )}

            {tab === 1 && (
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
                    {/* Badge de statut de paiement */}
                    {rx.consultation_id && (
                      <PaymentStatusCell consultationId={rx.consultation_id} size="small" />
                    )}
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
              <Box key={pl.id} sx={{ borderBottom: '1px solid #eee', py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {pl.code_unique} • {pl.type_echantillon}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(pl.date_prelevement).toLocaleString('fr-FR')}
                      {pl.agent_preleveur && ` • Prélevé par: ${pl.agent_preleveur}`}
                    </Typography>
                    {pl.statut_echantillon === 'rejete' && (
                      <MuiAlert severity="error" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          <strong>Échantillon rejeté</strong>
                          {pl.motif_rejet && ` • Motif: ${pl.motif_rejet}`}
                          {pl.date_rejet && ` • Date: ${new Date(pl.date_rejet).toLocaleString('fr-FR')}`}
                        </Typography>
                      </MuiAlert>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {pl.statut_echantillon !== 'rejete' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={async () => {
                          const motif = prompt('Motif du rejet:');
                          if (motif) {
                            try {
                              await LaboratoireService.rejeterEchantillon(pl.id, motif, 'Technicien actuel');
                              if (patientId) await load(patientId);
                              setSnackbar({ open: true, message: 'Échantillon rejeté', severity: 'success' });
                            } catch (e) {
                              setSnackbar({ open: true, message: 'Erreur rejet échantillon', severity: 'error' });
                            }
                          }
                        }}
                      >
                        Rejeter
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        // Générer code-barres pour impression
                        const barcodeData = LaboratoireService.generateBarcodeData(patientId, pl.id);
                        // Ici, on pourrait ouvrir une fenêtre d'impression ou utiliser une bibliothèque de code-barres
                        window.print();
                        setSnackbar({ open: true, message: 'Code-barres généré pour impression', severity: 'info' });
                      }}
                    >
                      Imprimer étiquette
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField size="small" label="Paramètre" fullWidth value={analyseForm.prelevement_id === pl.id ? analyseForm.parametre : ''} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, parametre: e.target.value })} />
                    <TextField size="small" select label="Type" fullWidth value={analyseForm.prelevement_id === pl.id ? analyseForm.type_resultat : 'qualitatif'} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, type_resultat: e.target.value as any })}>
                      <MenuItem value="qualitatif">Qualitatif</MenuItem>
                      <MenuItem value="quantitatif">Quantitatif</MenuItem>
                    </TextField>
                    <TextField size="small" label="Unité" fullWidth value={analyseForm.prelevement_id === pl.id ? (analyseForm.unite || '') : ''} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, unite: e.target.value })} />
                    <TextField size="small" label="Valeur num." type="number" fullWidth value={analyseForm.prelevement_id === pl.id ? (analyseForm.valeur_numerique || '') : ''} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, valeur_numerique: parseFloat(e.target.value) })} />
                    <TextField size="small" label="Valeur qual." fullWidth value={analyseForm.prelevement_id === pl.id ? (analyseForm.valeur_qualitative || '') : ''} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, valeur_qualitative: e.target.value })} />
                    <TextField size="small" label="Bornes réf." fullWidth value={analyseForm.prelevement_id === pl.id ? (analyseForm.bornes_reference || '') : ''} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, bornes_reference: e.target.value })} />
                    <TextField size="small" label="Technicien" fullWidth value={analyseForm.prelevement_id === pl.id ? (analyseForm.technicien || '') : ''} onChange={(e) => setAnalyseForm({ ...analyseForm, prelevement_id: pl.id, technicien: e.target.value })} />
                  </Box>
                  <Button size="small" variant="outlined" onClick={handleCreateAnalyse} sx={{ alignSelf: 'flex-start' }}>Ajouter analyse</Button>
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

            {tab === 2 && selectedPatient && prelevements.length > 0 && (
              <PaillasseNumeriqueModern
                prelevement={prelevements[0]}
                patient={selectedPatient}
                onAnalyseCreated={() => {
                  if (patientId) load(patientId);
                }}
              />
            )}

            {tab === 2 && (!selectedPatient || prelevements.length === 0) && (
              <MuiAlert severity="info">
                Sélectionnez un patient avec des prélèvements pour accéder à la paillasse numérique.
              </MuiAlert>
            )}

            {tab === 3 && (
              <GestionStocksReactifs />
            )}

            {tab === 4 && (
              <IntegrationsPanelModern 
                prescriptionId={selectedPrescription?.id}
                patientId={patientId}
              />
            )}

            {tab === 5 && (
              <>
                <Typography variant="h6" gutterBottom>Rapports & Tableaux de bord</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <TextField type="date" label="Du" InputLabelProps={{ shrink: true }} size="small" value={period.from || ''} onChange={(e) => setPeriod({ ...period, from: e.target.value })} />
                  <TextField type="date" label="Au" InputLabelProps={{ shrink: true }} size="small" value={period.to || ''} onChange={(e) => setPeriod({ ...period, to: e.target.value })} />
                  <Button variant="outlined" onClick={async () => {
                    const s = await LaboratoireService.getLabStats({ from: period.from, to: period.to });
                    setStats(s);
                  }}>Charger</Button>
                </Box>
                {stats && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      <GlassCard sx={{ p: 2, flex: 1 }}>
                        <StatBadge label="Examens prescrits" value={stats.prescriptionsTotal} color="primary" />
                      </GlassCard>
                      <GlassCard sx={{ p: 2, flex: 1 }}>
                        <StatBadge label="Délai moyen (h)" value={stats.avgDelayHours.toFixed(1)} color="info" />
                      </GlassCard>
                      <GlassCard sx={{ p: 2, flex: 1 }}>
                        <StatBadge label="Conso. réactifs (unités)" value={stats.totalConsumptions} color="warning" />
                      </GlassCard>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      <GlassCard sx={{ p: 2, flex: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>Par service</Typography>
                        {Object.entries(stats.byService).map(([svc, count]) => (
                          <Box key={svc} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{svc}</Typography>
                            <Typography variant="body2">{count}</Typography>
                          </Box>
                        ))}
                      </GlassCard>
                      <GlassCard sx={{ p: 2, flex: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>Par type d'examen</Typography>
                        {Object.entries(stats.byType).map(([typ, count]) => (
                          <Box key={typ} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{typ}</Typography>
                            <Typography variant="body2">{count}</Typography>
                          </Box>
                        ))}
                      </GlassCard>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                      <GlassCard sx={{ p: 2, flex: 1 }}>
                        <StatBadge label="Analyses terminées" value={stats.analysesCompleted} color="success" />
                      </GlassCard>
                      <GlassCard sx={{ p: 2, flex: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>Analyses par type</Typography>
                        {Object.entries(stats.byTypeAnalyses).map(([typ, count]) => (
                          <Box key={typ} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{typ}</Typography>
                            <Typography variant="body2">{count}</Typography>
                          </Box>
                        ))}
                      </GlassCard>
                    </Box>
                    <GlassCard sx={{ p: 2 }}>
                      <StatBadge label="Taux de positivité (VIH/Paludisme)" value={`${stats.positivityRate.toFixed(1)}%`} color="error" />
                    </GlassCard>
                  </Box>
                )}
              </>
            )}
          </GlassCard>
        </Box>
    <Snackbar open={!!snackbar?.open} autoHideDuration={4000} onClose={() => setSnackbar(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <MuiAlert severity={snackbar?.severity || 'info'} onClose={() => setSnackbar(null)} sx={{ width: '100%' }}>
        {snackbar?.message}
      </MuiAlert>
    </Snackbar>
    </Box>
  );
};

export default Laboratoire;


