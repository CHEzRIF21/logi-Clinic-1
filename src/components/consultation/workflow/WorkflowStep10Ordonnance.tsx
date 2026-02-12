import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Alert, 
  Divider, 
  Button,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Medication, Science, LocalHospital } from '@mui/icons-material';
import { PrescriptionFormModal } from '../PrescriptionFormModal';
import { LabRequestWizard } from '../LabRequestWizard';
import { HospitalisationForm } from '../HospitalisationForm';
import { Patient } from '../../../services/supabase';
import { ConsultationService, LabRequest } from '../../../services/consultationService';
import { LaboratoireIntegrationService } from '../../../services/laboratoireIntegrationService';
import { supabase } from '../../../services/supabase';

interface WorkflowStep10OrdonnanceProps {
  consultationId: string;
  patientId: string;
  patient: Patient;
  onPrescriptionComplete: () => void;
  userId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prescription-tabpanel-${index}`}
      aria-labelledby={`prescription-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const WorkflowStep10Ordonnance: React.FC<WorkflowStep10OrdonnanceProps> = ({
  consultationId,
  patientId,
  patient,
  onPrescriptionComplete,
  userId
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [openPrescription, setOpenPrescription] = useState(false);
  const [openLabRequest, setOpenLabRequest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);

  const [savedMedPrescription, setSavedMedPrescription] = useState<{
    id: string;
    numero_prescription?: string | null;
    date_prescription?: string | null;
    statut?: string | null;
    created_at?: string | null;
    facture?: { id: string; numero_facture?: string | null; statut?: string | null; montant_restant?: number | null } | null;
    lines: Array<{
      id: string;
      nom_medicament: string;
      posologie?: string | null;
      quantite_totale?: number | null;
      duree_jours?: number | null;
      mode_administration?: string | null;
      instructions?: string | null;
    }>;
  } | null>(null);

  const [savedLabPrescription, setSavedLabPrescription] = useState<{
    id: string;
    type_examen?: string | null;
    details?: string | null;
    service_prescripteur?: string | null;
    prescripteur?: string | null;
    date_prescription?: string | null;
    statut?: string | null;
    montant_total?: number | null;
    analyses: Array<{
      id?: string;
      numero_analyse?: string | null;
      nom_analyse?: string | null;
      code_analyse?: string | null;
      prix?: number | null;
      tube_requis?: string | null;
    }>;
  } | null>(null);

  const [savedHospitalisation, setSavedHospitalisation] = useState<{
    chambre_demandee?: string;
    duree_previsionnelle?: string;
    type_prise_en_charge?: string;
    actes_infirmiers?: string;
    completed_at?: string | null;
  } | null>(null);

  const loadSavedData = useCallback(async () => {
    if (!consultationId) return;
    setLoadingSaved(true);
    setSavedError(null);
    try {
      // 1) Ordonnance médicamenteuse (dernière)
      const { data: presc, error: prescError } = await supabase
        .from('prescriptions')
        .select(
          `
          id,
          numero_prescription,
          date_prescription,
          statut,
          created_at,
          facture_id,
          prescription_lines (
            id,
            nom_medicament,
            posologie,
            quantite_totale,
            duree_jours,
            mode_administration,
            instructions
          )
        `
        )
        .eq('consultation_id', consultationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prescError) throw prescError;

      let facture: any = null;
      if ((presc as any)?.facture_id) {
        const { data: f, error: fErr } = await supabase
          .from('factures')
          .select('id, numero_facture, statut, montant_restant')
          .eq('id', (presc as any).facture_id)
          .maybeSingle();
        if (fErr) throw fErr;
        facture = f || null;
      }

      const lines = ((presc as any)?.prescription_lines || []) as any[];
      setSavedMedPrescription(
        presc
          ? {
              id: (presc as any).id,
              numero_prescription: (presc as any).numero_prescription,
              date_prescription: (presc as any).date_prescription,
              statut: (presc as any).statut,
              created_at: (presc as any).created_at,
              facture,
              lines: lines.map((l: any) => ({
                id: l.id,
                nom_medicament: l.nom_medicament,
                posologie: l.posologie,
                quantite_totale: l.quantite_totale,
                duree_jours: l.duree_jours,
                mode_administration: l.mode_administration,
                instructions: l.instructions,
              })),
            }
          : null
      );

      // 2) Prescription labo (dernière)
      const { data: lab, error: labError } = await supabase
        .from('lab_prescriptions')
        .select('id, type_examen, details, service_prescripteur, prescripteur, date_prescription, statut, montant_total')
        .eq('consultation_id', consultationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (labError) throw labError;

      let analyses: any[] = [];
      if (lab?.id) {
        const { data: a, error: aErr } = await supabase
          .from('lab_prescriptions_analyses')
          .select('id, numero_analyse, nom_analyse, code_analyse, prix, tube_requis')
          .eq('prescription_id', lab.id)
          .order('numero_analyse', { ascending: true });
        if (aErr) throw aErr;
        analyses = a || [];
      }

      setSavedLabPrescription(
        lab
          ? {
              id: lab.id,
              type_examen: (lab as any).type_examen,
              details: (lab as any).details,
              service_prescripteur: (lab as any).service_prescripteur,
              prescripteur: (lab as any).prescripteur,
              date_prescription: (lab as any).date_prescription,
              statut: (lab as any).statut,
              montant_total: (lab as any).montant_total,
              analyses: analyses.map((x: any) => ({
                id: x.id,
                numero_analyse: x.numero_analyse,
                nom_analyse: x.nom_analyse,
                code_analyse: x.code_analyse,
                prix: x.prix,
                tube_requis: x.tube_requis,
              })),
            }
          : null
      );

      // 3) Hospitalisation (consultation_steps step 10)
      const { data: step10, error: stepError } = await supabase
        .from('consultation_steps')
        .select('data, completed_at')
        .eq('consult_id', consultationId)
        .eq('step_number', 10)
        .maybeSingle();
      if (stepError) throw stepError;

      const hosp = (step10 as any)?.data?.hospitalisation as any | undefined;
      setSavedHospitalisation(
        hosp
          ? {
              chambre_demandee: hosp.chambre_demandee,
              duree_previsionnelle: hosp.duree_previsionnelle,
              type_prise_en_charge: hosp.type_prise_en_charge,
              actes_infirmiers: hosp.actes_infirmiers,
              completed_at: (step10 as any)?.completed_at ?? null,
            }
          : null
      );
    } catch (e: any) {
      console.error('Erreur chargement résumé étape 10:', e);
      setSavedError(e?.message ? String(e.message) : 'Erreur lors du chargement des données enregistrées');
    } finally {
      setLoadingSaved(false);
    }
  }, [consultationId]);

  useEffect(() => {
    loadSavedData();
    const channel = supabase
      .channel('consultation-step10-summary')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, () => loadSavedData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescription_lines' }, () => loadSavedData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'factures' }, () => loadSavedData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_prescriptions' }, () => loadSavedData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_prescriptions_analyses' }, () => loadSavedData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultation_steps' }, () => loadSavedData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSavedData]);

  const medPaymentChip = useMemo(() => {
    const f = savedMedPrescription?.facture;
    if (!f) return null;
    const restant = Number(f.montant_restant ?? 0);
    const paid = f.statut === 'payee' && restant <= 0;
    return (
      <Chip
        size="small"
        color={paid ? 'success' : 'warning'}
        label={
          paid
            ? 'Paiement OK'
            : `Paiement requis (reste ${restant.toLocaleString('fr-FR')} XOF)`
        }
      />
    );
  }, [savedMedPrescription?.facture]);

  const handleSavePrescription = async (lines: any[]) => {
    setLoading(true);
    try {
      await ConsultationService.createPrescription(consultationId, patientId, userId, lines);
      await loadSavedData();
      onPrescriptionComplete();
      setOpenPrescription(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la prescription:', error);
      alert('Erreur lors de la sauvegarde de la prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLabRequest = async (request: Partial<LabRequest>) => {
    setLoading(true);
    try {
      // Transformer les données du LabRequestWizard pour createPrescriptionFromConsultation
      const tests = Array.isArray(request.tests) ? request.tests : [];
      const analyses = tests.map((test: any) => ({
        numero: test.code || test.nom?.substring(0, 10) || 'ANALYSE',
        nom: test.nom || test.code || 'Analyse',
        code: test.code || test.nom?.toUpperCase().replace(/\s+/g, '_'),
        prix: test.tarif_base || 0,
        tube: 'Tube standard' // Par défaut, peut être personnalisé
      }));

      // Créer le type d'examen à partir des tests sélectionnés
      const typeExamen = tests.length > 0 
        ? tests.map((t: any) => t.nom || t.code).join(', ')
        : 'Analyse demandée';

      // Utiliser le service d'intégration pour créer la prescription de labo
      await LaboratoireIntegrationService.createPrescriptionFromConsultation(
        consultationId,
        patientId,
        typeExamen,
        request.clinical_info || request.details || '',
        undefined, // prescripteur
        undefined, // servicePrescripteur
        analyses.reduce((sum, a) => sum + a.prix, 0), // montant
        analyses.length > 0 ? analyses : undefined
      );
      setOpenLabRequest(false);
      await loadSavedData();
      onPrescriptionComplete();
    } catch (error) {
      console.error('Erreur lors de la création de la demande d\'analyse:', error);
      alert('Erreur lors de la création de la demande d\'analyse');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHospitalisation = async (data: {
    chambre_demandee?: string;
    duree_previsionnelle?: string;
    type_prise_en_charge?: string;
    actes_infirmiers?: string;
  }) => {
    setLoading(true);
    try {
      // Enregistrer l'hospitalisation dans les données de la consultation
      // On peut stocker cela dans consultation_steps ou dans un champ dédié
      await ConsultationService.saveWorkflowStep(
        consultationId,
        10,
        {
          hospitalisation: data
        },
        userId
      );
      await loadSavedData();
      onPrescriptionComplete();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'hospitalisation:', error);
      alert('Erreur lors de la sauvegarde de l\'hospitalisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Medication color="primary" />
          <Typography variant="h6">
            Étape 10 — Traitement (Ordonnance)
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          Prescription complète : Médicaments, Analyses biologiques et Hospitalisation. 
          Un PDF imprimable sera généré pour chaque prescription.
        </Alert>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab 
              icon={<Medication />} 
              iconPosition="start"
              label="Ordonnance Médicamenteuse" 
            />
            <Tab 
              icon={<Science />} 
              iconPosition="start"
              label="Prescription d'Analyse" 
            />
            <Tab 
              icon={<LocalHospital />} 
              iconPosition="start"
              label="Hospitalisation" 
            />
          </Tabs>
        </Box>

        {/* Tab 1: Ordonnance Médicamenteuse */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Medication />}
              onClick={(e) => {
                // Empêche le warning Chrome "Blocked aria-hidden..." :
                // on retire le focus du bouton avant l'ouverture du Dialog (MUI appliquera aria-hidden au background)
                (e.currentTarget as HTMLButtonElement).blur();
                setOpenPrescription(true);
              }}
              sx={{ alignSelf: 'flex-start' }}
              disabled={loading}
            >
              Créer une ordonnance
            </Button>

            {savedError && (
              <Alert severity="error">{savedError}</Alert>
            )}

            {loadingSaved ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Chargement de l’ordonnance enregistrée…
                </Typography>
              </Box>
            ) : savedMedPrescription && savedMedPrescription.lines.length > 0 ? (
              <Card variant="outlined" sx={{ overflow: 'hidden' }}>
                <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Médicaments prescrits
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {savedMedPrescription.numero_prescription || savedMedPrescription.id}
                        {savedMedPrescription.created_at
                          ? ` • ${new Date(savedMedPrescription.created_at).toLocaleString('fr-FR')}`
                          : ''}
                        {savedMedPrescription.statut ? ` • Statut: ${savedMedPrescription.statut}` : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {savedMedPrescription.facture?.numero_facture && (
                        <Chip size="small" label={`Facture: ${savedMedPrescription.facture.numero_facture}`} />
                      )}
                      {medPaymentChip}
                    </Box>
                  </Box>

                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell><strong>Médicament</strong></TableCell>
                          <TableCell><strong>Posologie</strong></TableCell>
                          <TableCell align="right"><strong>Quantité</strong></TableCell>
                          <TableCell align="right"><strong>Durée</strong></TableCell>
                          <TableCell><strong>Mode</strong></TableCell>
                          <TableCell><strong>Instructions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {savedMedPrescription.lines.map((l) => (
                          <TableRow key={l.id} hover>
                            <TableCell>{l.nom_medicament}</TableCell>
                            <TableCell>{l.posologie || '-'}</TableCell>
                            <TableCell align="right">{typeof l.quantite_totale === 'number' ? l.quantite_totale : '-'}</TableCell>
                            <TableCell align="right">{typeof l.duree_jours === 'number' ? `${l.duree_jours} j` : '-'}</TableCell>
                            <TableCell>{l.mode_administration || '-'}</TableCell>
                            <TableCell sx={{ maxWidth: 180 }}>{l.instructions || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="warning">
                <Typography variant="subtitle2" gutterBottom>
                  Vérifications automatiques :
                </Typography>
                <Typography variant="body2">
                  • Allergies du patient • Interactions médicamenteuses • Disponibilité en stock
                </Typography>
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Tab 2: Prescription d'Analyse */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Science />}
              onClick={(e) => {
                (e.currentTarget as HTMLButtonElement).blur();
                setOpenLabRequest(true);
              }}
              sx={{ alignSelf: 'flex-start' }}
              disabled={loading}
            >
              Prescrire des analyses biologiques
            </Button>

            {savedError && (
              <Alert severity="error">{savedError}</Alert>
            )}

            {loadingSaved ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Chargement de la prescription d’analyses…
                </Typography>
              </Box>
            ) : savedLabPrescription ? (
              <Card variant="outlined" sx={{ overflow: 'hidden' }}>
                <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Analyses prescrites
                  </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {savedLabPrescription.type_examen || 'Analyse'}
                  {savedLabPrescription.date_prescription
                    ? ` • ${new Date(savedLabPrescription.date_prescription).toLocaleString('fr-FR')}`
                    : ''}
                  {savedLabPrescription.statut ? ` • Statut: ${savedLabPrescription.statut}` : ''}
                  {typeof savedLabPrescription.montant_total === 'number'
                    ? ` • Montant: ${savedLabPrescription.montant_total.toLocaleString('fr-FR')} XOF`
                    : ''}
                </Typography>

                {savedLabPrescription.details ? (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Contexte clinique:</strong> {savedLabPrescription.details}
                  </Typography>
                ) : null}
                  </Box>

                {savedLabPrescription.analyses.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell><strong>Analyse</strong></TableCell>
                          <TableCell><strong>Code</strong></TableCell>
                          <TableCell align="right"><strong>Prix (XOF)</strong></TableCell>
                          <TableCell><strong>Tube requis</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {savedLabPrescription.analyses.map((a, idx) => (
                          <TableRow key={a.id || `${a.code_analyse}-${idx}`} hover>
                            <TableCell>{a.nom_analyse || a.code_analyse || 'Analyse'}</TableCell>
                            <TableCell>{a.code_analyse || '-'}</TableCell>
                            <TableCell align="right">{a.prix != null ? Number(a.prix).toLocaleString('fr-FR') : '-'}</TableCell>
                            <TableCell>{a.tube_requis || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Les examens ont été transmis au module Laboratoire.
                  </Typography>
                )}
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Prescription d'analyses :
                </Typography>
                <Typography variant="body2">
                  • Sélectionnez les examens dans le catalogue • Précisez le contexte clinique • 
                  Les analyses seront transmises au module Laboratoire
                </Typography>
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Tab 3: Hospitalisation */}
        <TabPanel value={activeTab} index={2}>
          {savedHospitalisation ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Hospitalisation enregistrée
              </Typography>
              <Box component="ul" sx={{ pl: 3, m: 0 }}>
                {savedHospitalisation.chambre_demandee ? (
                  <li>
                    <Typography variant="body2">
                      <strong>Chambre:</strong> {savedHospitalisation.chambre_demandee}
                    </Typography>
                  </li>
                ) : null}
                {savedHospitalisation.duree_previsionnelle ? (
                  <li>
                    <Typography variant="body2">
                      <strong>Durée:</strong> {savedHospitalisation.duree_previsionnelle}
                    </Typography>
                  </li>
                ) : null}
                {savedHospitalisation.type_prise_en_charge ? (
                  <li>
                    <Typography variant="body2">
                      <strong>Prise en charge:</strong> {savedHospitalisation.type_prise_en_charge}
                    </Typography>
                  </li>
                ) : null}
                {savedHospitalisation.actes_infirmiers ? (
                  <li>
                    <Typography variant="body2">
                      <strong>Actes infirmiers:</strong> {savedHospitalisation.actes_infirmiers}
                    </Typography>
                  </li>
                ) : null}
              </Box>
            </Alert>
          ) : null}

          <HospitalisationForm
            consultationId={consultationId}
            patientId={patientId}
            onSave={handleSaveHospitalisation}
            initialData={
              savedHospitalisation
                ? {
                    chambre_demandee: savedHospitalisation.chambre_demandee,
                    duree_previsionnelle: savedHospitalisation.duree_previsionnelle,
                    type_prise_en_charge: savedHospitalisation.type_prise_en_charge,
                    actes_infirmiers: savedHospitalisation.actes_infirmiers,
                  }
                : undefined
            }
          />
        </TabPanel>

        {/* Modals */}
        <PrescriptionFormModal
          open={openPrescription}
          onClose={() => setOpenPrescription(false)}
          onSave={handleSavePrescription}
          consultationId={consultationId}
          patientId={patientId}
          patient={patient}
        />

        <LabRequestWizard
          open={openLabRequest}
          onClose={() => setOpenLabRequest(false)}
          onSave={handleSaveLabRequest}
          consultationId={consultationId}
          patientId={patientId}
        />
      </CardContent>
    </Card>
  );
};

