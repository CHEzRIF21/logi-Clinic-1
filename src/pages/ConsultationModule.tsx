import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  CardContent,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Grid,
  Snackbar,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Assignment,
  LocalHospital,
  Science,
  Medication,
  CalendarToday,
  Receipt,
  CheckCircle,
  ArrowForward,
  ArrowBack,
  MedicalServices,
  MonitorHeart,
  Edit,
  Refresh,
} from '@mui/icons-material';
import { PatientSearchAdvanced } from '../components/consultation/PatientSearchAdvanced';
import { AnamneseEditor } from '../components/consultation/AnamneseEditor';
import { SignesVitauxSection } from '../components/consultation/SignesVitauxSection';
import { ExamenPhysiqueForm } from '../components/consultation/ExamenPhysiqueForm';
import { DiagnosticsDetailedForm } from '../components/consultation/DiagnosticsDetailedForm';
import { PrescriptionsCompleteManager } from '../components/consultation/PrescriptionsCompleteManager';
import { PlanTraitementForm } from '../components/consultation/PlanTraitementForm';
import { ConsultationWorkflowStep10 } from '../components/consultation/workflow/ConsultationWorkflowStep10';
import { ConsultationWorkflowStep11 } from '../components/consultation/workflow/ConsultationWorkflowStep11';
import { ConsultationWorkflowStep12 } from '../components/consultation/workflow/ConsultationWorkflowStep12';
import { Patient } from '../services/supabase';
import { ConsultationApiService, Consultation, ConsultationConstantes } from '../services/consultationApiService';
import { ConsultationService } from '../services/consultationService';
import { PatientService } from '../services/patientService';
import { supabase } from '../services/supabase';
import { GradientText } from '../components/ui/GradientText';
import { GlassCard } from '../components/ui/GlassCard';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { ConsultationIntegrationService } from '../services/consultationIntegrationService';
import { AuditService } from '../services/auditService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';

const STEPS = [
  { id: 1, label: 'Sélection Patient', icon: Person, description: 'Recherche et identification du patient' },
  { id: 2, label: 'Anamnèse', icon: LocalHospital, description: 'Description détaillée avec dictée vocale' },
  { id: 3, label: 'Examen Clinique', icon: MonitorHeart, description: 'Signes vitaux et examen physique' },
  { id: 4, label: 'Diagnostics', icon: Science, description: 'Diagnostics probables, différentiels et tests' },
  { id: 5, label: 'Prescriptions', icon: Medication, description: 'Médicaments, examens et hospitalisation' },
  { id: 6, label: 'Plan de Traitement', icon: Assignment, description: 'Conseils et mesures hygiéno-diététiques' },
  { id: 7, label: 'Rendez-vous', icon: CalendarToday, description: 'Rendez-vous de suivi automatique' },
  { id: 8, label: 'Facturation', icon: Receipt, description: 'Facturation automatique et envoi aux modules' },
  { id: 9, label: 'Clôture', icon: CheckCircle, description: 'Signature numérique et archivage' },
];

export const ConsultationModule: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Données des étapes
  const [motifsData, setMotifsData] = useState<{ motif_principal: string; symptomes_associes: string[]; duree_symptomes: string } | null>(null);
  const [examenPhysiqueData, setExamenPhysiqueData] = useState<any>({});
  const [diagnosticsProbables, setDiagnosticsProbables] = useState<string[]>([]);
  const [diagnosticsDifferentiels, setDiagnosticsDifferentiels] = useState<string[]>([]);
  const [testsComplementaires, setTestsComplementaires] = useState<string[]>([]);
  const [planTraitementData, setPlanTraitementData] = useState<any>({});
  const [examensPrescrits, setExamensPrescrits] = useState<Array<{ type: 'labo' | 'imagerie'; nom: string; delai_jours?: number }>>([]);
  const [patientConsultations, setPatientConsultations] = useState<Consultation[]>([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);

  // Récupérer l'userId et le rôle depuis Supabase Auth ou localStorage
  const [userId, setUserId] = useState<string>('');
  const [userIdLoading, setUserIdLoading] = useState(true);

  // Récupérer l'utilisateur authentifié depuis Supabase
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        // Essayer d'abord de récupérer depuis Supabase Auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (!authError && authUser) {
          console.log('Utilisateur authentifié trouvé:', authUser.id);
          setUserId(authUser.id);
          setUserIdLoading(false);
          return;
        }

        // Fallback: récupérer depuis localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            // Vérifier si c'est un UUID valide
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (user.id && uuidRegex.test(user.id)) {
              console.log('Utilisateur trouvé dans localStorage:', user.id);
              setUserId(user.id);
              setUserIdLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Erreur lors du parsing de userData:', e);
          }
        }

        // Si aucun utilisateur trouvé, créer un UUID temporaire ou utiliser un utilisateur système
        // Pour l'instant, on génère un UUID temporaire
        // En production, il faudrait forcer l'authentification
        console.warn('Aucun utilisateur authentifié trouvé, utilisation d\'un UUID temporaire');
        const tempUserId = '00000000-0000-0000-0000-000000000001'; // UUID temporaire pour développement
        setUserId(tempUserId);
        setUserIdLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        // UUID temporaire en cas d'erreur
        setUserId('00000000-0000-0000-0000-000000000001');
        setUserIdLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  const [userRole] = useState<string>(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.role || 'medecin';
      } catch {
        return 'medecin';
      }
    }
    return 'medecin';
  });

  // S'assurer que la consultation est bien chargée quand on change d'étape
  useEffect(() => {
    // Si on est à une étape > 0 et qu'il n'y a pas de consultation, revenir à l'étape 0
    if (activeStep > 0 && !consultation && !loading) {
      console.warn('Consultation manquante, retour à l\'étape 0');
      setActiveStep(0);
    }
  }, [activeStep, consultation, loading]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handlePatientSelect = async (selectedPatient: Patient) => {
    // Vérifier que userId est disponible
    if (!userId || userIdLoading) {
      showSnackbar('Veuillez patienter, chargement de votre session...', 'info');
      return;
    }

    setPatient(selectedPatient);
    setConsultation(null); // Réinitialiser la consultation pour permettre le choix
    showSnackbar(`Patient sélectionné: ${selectedPatient.prenom} ${selectedPatient.nom}`, 'success');
    
    // Charger les consultations EN_COURS du patient
    loadPatientConsultations(selectedPatient.id);
  };

  const loadPatientConsultations = async (patientId: string) => {
    setLoadingConsultations(true);
    try {
      const consultations = await ConsultationService.getConsultationsByPatient(patientId);
      const consultationsEnCours = consultations.filter((c) => c.status === 'EN_COURS');
      setPatientConsultations(consultationsEnCours);
    } catch (error) {
      console.error('Erreur lors du chargement des consultations:', error);
      setPatientConsultations([]);
    } finally {
      setLoadingConsultations(false);
    }
  };

  const handleResumeConsultation = async (selectedConsultation: Consultation) => {
    try {
      // Charger la consultation complète
      const fullConsultation = await ConsultationService.getConsultationById(selectedConsultation.id);
      if (fullConsultation) {
        setConsultation(fullConsultation);
        showSnackbar(`Consultation reprise: ${selectedConsultation.type || 'Médecine générale'}`, 'success');
        
        // Traçabilité : Reprise de consultation
        try {
          await AuditService.logAction({
            consult_id: fullConsultation.id,
            actor_id: userId,
            actor_role: userRole,
            action: 'resume_consultation',
            details: {
              consultation_id: fullConsultation.id,
              consultation_type: fullConsultation.type || 'Médecine générale',
              patient_id: fullConsultation.patient_id,
            },
          });
        } catch (auditError) {
          console.warn('Erreur lors de l\'enregistrement de l\'audit (non bloquant):', auditError);
        }
      } else {
        showSnackbar('Consultation introuvable', 'error');
      }
    } catch (error: any) {
      console.error('Erreur lors de la reprise de la consultation:', error);
      showSnackbar(`Erreur: ${error?.message || 'Erreur lors de la reprise'}`, 'error');
    }
  };

  // Fonctions conservées pour utilisation future si nécessaire
  // Elles peuvent être utilisées si on ajoute une étape de saisie des motifs/antécédents
  const handleSaveMotifs = async (motifs: { motif_principal: string; symptomes_associes: string[]; duree_symptomes: string }) => {
    if (!motifs || !motifs.motif_principal.trim() || !motifs.duree_symptomes.trim()) {
      showSnackbar('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    if (!consultation || !patient) {
      showSnackbar('Veuillez d\'abord sélectionner un patient', 'error');
      return;
    }

    setLoading(true);
    try {
      const motifsArray = [
        motifs.motif_principal,
        ...motifs.symptomes_associes,
        `Durée: ${motifs.duree_symptomes}`,
      ];
      await ConsultationService.updateConsultation(
        consultation.id,
        { motifs: motifsArray },
        userId,
        'motifs'
      );
      const updated = await ConsultationService.getConsultationById(consultation.id);
      setConsultation(updated);
      
      // Traçabilité : Enregistrement des motifs
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: userRole,
        action: 'save_motifs',
        details: {
          motif_principal: motifs.motif_principal,
          symptomes_count: motifs.symptomes_associes.length,
          duree: motifs.duree_symptomes,
        },
      });

      showSnackbar('Motifs enregistrés avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des motifs:', error);
      showSnackbar('Erreur lors de la sauvegarde des motifs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAntecedents = async (updates: Partial<Patient>) => {
    if (!patient || !consultation) return;

    setLoading(true);
    try {
      await PatientService.updatePatient(patient.id, updates);
      const updatedPatient = await PatientService.getPatientById(patient.id);
      setPatient(updatedPatient);
      
      // Traçabilité : Mise à jour des antécédents
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: userRole,
        action: 'update_antecedents',
        details: {
          patient_id: patient.id,
          fields_updated: Object.keys(updates),
        },
      });

      showSnackbar('Antécédents mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showSnackbar('Erreur lors de la mise à jour des antécédents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnamnese = async (anamnese: string) => {
    if (!consultation) return;

    setLoading(true);
    try {
      await ConsultationService.updateConsultation(
        consultation.id,
        { anamnese: anamnese as any },
        userId,
        'anamnese'
      );
      const updated = await ConsultationService.getConsultationById(consultation.id);
      setConsultation(updated);
      
      // Traçabilité : Sauvegarde de l'anamnèse
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: userRole,
        action: 'fill_anamnesis',
        details: {
          anamnese_length: anamnese.length,
          has_content: anamnese.trim().length > 0,
        },
      });

      showSnackbar('Anamnèse enregistrée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'anamnèse:', error);
      showSnackbar('Erreur lors de la sauvegarde de l\'anamnèse', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConstantes = async (constantes: Partial<ConsultationConstantes>, syncToPatient: boolean) => {
    if (!consultation) return;

    setLoading(true);
    try {
      await ConsultationService.saveConstantes(consultation.id, consultation.patient_id || (patient ? patient.id : ''), constantes, userId, syncToPatient);
      if (syncToPatient && patient) {
        await PatientService.updatePatient(patient.id, {
          taille_cm: constantes.taille_cm,
          poids_kg: constantes.poids_kg,
        } as any);
      }
      
      // Traçabilité : Enregistrement des signes vitaux
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: userRole,
        action: 'record_vitals',
        details: {
          temperature: constantes.temperature_c,
          tension: `${constantes.ta_bras_gauche_systolique}/${constantes.ta_bras_gauche_diastolique}`,
          pouls: constantes.pouls_bpm,
          poids: constantes.poids_kg,
          taille: constantes.taille_cm,
          imc: constantes.imc,
          synced_to_patient: syncToPatient,
        },
      });

      showSnackbar('Constantes enregistrées avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des constantes:', error);
      showSnackbar('Erreur lors de la sauvegarde des constantes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExamenPhysique = async () => {
    if (!consultation) return;

    setLoading(true);
    try {
      await ConsultationService.updateConsultation(
        consultation.id,
        { examens_cliniques: { ...consultation.examens_cliniques, examen_physique: examenPhysiqueData } } as any,
        userId,
        'examen_physique'
      );
      const updated = await ConsultationService.getConsultationById(consultation.id);
      setConsultation(updated);
      
      // Traçabilité : Enregistrement de l'examen physique
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: userRole,
        action: 'record_physical_exam',
        details: {
          zones_examinees: Object.keys(examenPhysiqueData).length,
          has_findings: Object.values(examenPhysiqueData).some(v => v && String(v).trim().length > 0),
        },
      });

      showSnackbar('Examen physique enregistré avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'examen physique:', error);
      showSnackbar('Erreur lors de la sauvegarde de l\'examen physique', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiagnostics = async () => {
    if (!consultation) return;

    setLoading(true);
    try {
      const allDiagnostics = [
        ...diagnosticsProbables.map((d) => `PROBABLE: ${d}`),
        ...diagnosticsDifferentiels.map((d) => `DIFFERENTIEL: ${d}`),
        ...testsComplementaires.map((t) => `TEST: ${t}`),
      ];
      await ConsultationService.updateConsultation(
        consultation.id,
        { diagnostics: allDiagnostics },
        userId,
        'diagnostics'
      );
      const updated = await ConsultationService.getConsultationById(consultation.id);
      setConsultation(updated);
      
      // Traçabilité : Ajout de diagnostics
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: userRole,
        action: 'add_diagnosis',
        details: {
          diagnostics_probables_count: diagnosticsProbables.length,
          diagnostics_differentiels_count: diagnosticsDifferentiels.length,
          tests_complementaires_count: testsComplementaires.length,
          total: allDiagnostics.length,
        },
      });

      showSnackbar('Diagnostics enregistrés avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des diagnostics:', error);
      showSnackbar('Erreur lors de la sauvegarde des diagnostics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrescriptionMedicamenteuse = async (lines: any[]) => {
    if (!consultation) return;

    setLoading(true);
    try {
      const prescription = await ConsultationApiService.createPrescription(
        consultation.id,
        consultation.patient_id,
        lines,
        userId
      );
      
      // Traçabilité : Création de prescription
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: userRole,
        action: 'create_prescription',
        details: {
          prescription_id: prescription.id,
          lines_count: lines.length,
          medicaments: lines.map(l => l.nom_medicament || l.medicament_nom),
        },
      });

      showSnackbar('Prescription médicamenteuse créée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la création de la prescription:', error);
      showSnackbar('Erreur lors de la création de la prescription', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLabRequest = async (request: any) => {
    if (!consultation) return;

    setLoading(true);
    try {
      const labRequest = await ConsultationApiService.createLabRequest(consultation.id, consultation.patient_id, request, userId);
      
      // Ajouter aux examens prescrits pour génération automatique de RDV
      if (request.tests && request.tests.length > 0) {
        const newExamens = request.tests.map((test: any) => ({
          type: 'labo' as const,
          nom: test.nom || test.libelle || 'Examen de laboratoire',
          delai_jours: 1,
        }));
        setExamensPrescrits((prev) => [...prev, ...newExamens]);
      }
      
      // Traçabilité : Création de demande labo
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: userRole,
        action: 'create_lab_request',
        details: {
          request_id: labRequest.id,
          tests_count: request.tests?.length || 0,
        },
      });

      showSnackbar('Demande d\'examens de laboratoire créée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la création de la demande labo:', error);
      showSnackbar('Erreur lors de la création de la demande labo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImagingRequest = async (request: any) => {
    if (!consultation) return;

    setLoading(true);
    try {
      const imagingRequest = await ConsultationApiService.createImagingRequest(consultation.id, consultation.patient_id, request, userId);
      
      // Ajouter aux examens prescrits pour génération automatique de RDV
      if (request.examens && request.examens.length > 0) {
        const newExamens = request.examens.map((examen: any) => ({
          type: 'imagerie' as const,
          nom: examen.nom || examen.libelle || 'Examen d\'imagerie',
          delai_jours: 3,
        }));
        setExamensPrescrits((prev) => [...prev, ...newExamens]);
      }
      
      // Traçabilité : Création de demande imagerie
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: userRole,
        action: 'create_imaging_request',
        details: {
          request_id: imagingRequest.id,
          examens_count: request.examens?.length || 0,
        },
      });

      showSnackbar('Demande d\'examens d\'imagerie créée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la création de la demande imagerie:', error);
      showSnackbar('Erreur lors de la création de la demande imagerie', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHospitalisation = async (data: any) => {
    if (!consultation) return;

    setLoading(true);
    try {
      await ConsultationService.updateConsultation(
        consultation.id,
        { notes: JSON.stringify({ ...JSON.parse(consultation.notes || '{}'), hospitalisation: data }) } as any,
        userId,
        'hospitalisation'
      );
      
      // Traçabilité : Prescription d'hospitalisation
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: userRole,
        action: 'prescribe_hospitalization',
        details: {
          chambre: data.chambre_demandee,
          duree: data.duree_previsionnelle,
          type_prise_en_charge: data.type_prise_en_charge,
        },
      });

      showSnackbar('Hospitalisation enregistrée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'hospitalisation:', error);
      showSnackbar('Erreur lors de la sauvegarde de l\'hospitalisation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlanTraitement = async () => {
    if (!consultation) return;

    setLoading(true);
    try {
      await ConsultationService.updateConsultation(
        consultation.id,
        { traitement_en_cours: JSON.stringify(planTraitementData) } as any,
        userId,
        'plan_traitement'
      );
      const updated = await ConsultationService.getConsultationById(consultation.id);
      setConsultation(updated);
      
      // Traçabilité : Ajout du plan de traitement
      await AuditService.logAction({
        consult_id: consultation.id,
        actor_id: userId,
        actor_role: userRole,
        action: 'add_care_plan',
        details: {
          has_conseils: !!planTraitementData.conseils,
          has_mesures_hygieno: !!planTraitementData.mesures_hygieno_dietetiques,
          has_suivi: !!planTraitementData.suivi_particulier,
        },
      });

      showSnackbar('Plan de traitement enregistré avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du plan de traitement:', error);
      showSnackbar('Erreur lors de la sauvegarde du plan de traitement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    // Validation avant de passer à l'étape suivante
    if (activeStep === 0 && !patient) {
      showSnackbar('Veuillez sélectionner un patient', 'error');
      return;
    }

    // À l'étape 0, créer une nouvelle consultation si aucune n'est sélectionnée
    if (activeStep === 0 && patient && !consultation) {
      setLoading(true);
      try {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(patient.id)) {
          throw new Error('ID patient invalide.');
        }
        if (!uuidRegex.test(userId)) {
          throw new Error('Session utilisateur invalide.');
        }

        const consultationData = await ConsultationService.createConsultation(
          {
            patient_id: patient.id,
            type: 'Médecine générale',
          },
          userId
        );
        
        if (!consultationData.patient_id) {
          consultationData.patient_id = patient.id;
        }
        
        setConsultation(consultationData);
        
        // Traçabilité : Sélection du patient
        try {
          await AuditService.logAction({
            consult_id: consultationData.id,
            actor_id: userId,
            actor_role: userRole,
            action: 'select_patient',
            details: {
              patient_id: patient.id,
              patient_name: `${patient.prenom} ${patient.nom}`,
              patient_ipp: patient.identifiant,
              mode: 'recherche',
            },
          });
        } catch (auditError) {
          console.warn('Erreur lors de l\'enregistrement de l\'audit (non bloquant):', auditError);
        }

        // Traçabilité : Création de la consultation
        try {
          await AuditService.logAction({
            consult_id: consultationData.id,
            actor_id: userId,
            actor_role: userRole,
            action: 'create_consultation',
            details: {
              type: 'Médecine générale',
              patient_id: patient.id,
            },
          });
        } catch (auditError) {
          console.warn('Erreur lors de l\'enregistrement de l\'audit (non bloquant):', auditError);
        }

        showSnackbar('Nouvelle consultation créée', 'success');
      } catch (error: any) {
        console.error('Erreur lors de la création de la consultation:', error);
        showSnackbar(`Erreur: ${error?.message || 'Erreur lors de la création'}`, 'error');
        return; // Ne pas passer à l'étape suivante en cas d'erreur
      } finally {
        setLoading(false);
      }
    }

    // Vérifier que la consultation existe pour les étapes après la sélection du patient
    if (activeStep > 0 && !consultation) {
      showSnackbar('Veuillez d\'abord sélectionner un patient pour démarrer la consultation', 'error');
      return;
    }

    if (activeStep < STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Permettre de revenir aux étapes précédentes
    if (step <= activeStep) {
      setActiveStep(step);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <GlassCard sx={{ mb: 2 }}>
              <CardContent>
                <PatientSearchAdvanced
                  onPatientSelect={handlePatientSelect}
                  selectedPatient={patient}
                />
              </CardContent>
            </GlassCard>

            {patient && (
              <GlassCard>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <LocalHospital color="primary" fontSize="large" />
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        Consultations en cours
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reprendre une consultation existante ou créer une nouvelle consultation
                      </Typography>
                    </Box>
                    <Button
                      startIcon={<Refresh />}
                      onClick={() => loadPatientConsultations(patient.id)}
                      disabled={loadingConsultations}
                      size="small"
                    >
                      Actualiser
                    </Button>
                  </Box>

                  {loadingConsultations ? (
                    <Box display="flex" justifyContent="center" p={3}>
                      <CircularProgress />
                    </Box>
                  ) : patientConsultations.length === 0 ? (
                    <Alert severity="info">
                      Aucune consultation en cours pour ce patient. Cliquez sur "Suivant" pour créer une nouvelle consultation.
                    </Alert>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Date de début</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {patientConsultations.map((consultationItem) => (
                            <TableRow key={consultationItem.id} hover>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <LocalHospital fontSize="small" color="primary" />
                                  {consultationItem.type || 'Médecine générale'}
                                </Box>
                              </TableCell>
                              <TableCell>
                                {consultationItem.started_at
                                  ? format(new Date(consultationItem.started_at), 'dd/MM/yyyy HH:mm', {
                                      locale: fr,
                                    })
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label="EN_COURS"
                                  color="primary"
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<Edit />}
                                  onClick={() => handleResumeConsultation(consultationItem)}
                                  color="primary"
                                >
                                  Reprendre
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {consultation && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Consultation sélectionnée: {consultation.type || 'Médecine générale'} - 
                      {consultation.started_at
                        ? format(new Date(consultation.started_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                        : 'N/A'}
                    </Alert>
                  )}
                </CardContent>
              </GlassCard>
            )}
          </Box>
        );

      case 1:
        if (loading) {
          return (
            <GlassCard>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={4}>
                  <CircularProgress />
                  <Typography>Création de la consultation en cours...</Typography>
                </Box>
              </CardContent>
            </GlassCard>
          );
        }
        if (!consultation || !patient) {
          return (
            <GlassCard>
              <CardContent>
                <Alert severity="warning">
                  Veuillez d'abord sélectionner un patient pour démarrer la consultation.
                </Alert>
              </CardContent>
            </GlassCard>
          );
        }
        return (
          <GlassCard>
            <CardContent>
              <AnamneseEditor
                value={
                  typeof consultation.anamnese === 'string'
                    ? consultation.anamnese
                    : JSON.stringify(consultation.anamnese || {})
                }
                onChange={(newValue) => {
                  // Mettre à jour la consultation en temps réel si nécessaire
                }}
                onSave={() => handleSaveAnamnese(
                  typeof consultation.anamnese === 'string'
                    ? consultation.anamnese
                    : JSON.stringify(consultation.anamnese || {})
                )}
                patient={{
                  sexe: patient.sexe,
                  date_naissance: patient.date_naissance,
                }}
              />
            </CardContent>
          </GlassCard>
        );

      case 2:
        if (!consultation || !patient) {
          return (
            <GlassCard>
              <CardContent>
                <Alert severity="warning">
                  Veuillez d'abord sélectionner un patient pour démarrer la consultation.
                </Alert>
              </CardContent>
            </GlassCard>
          );
        }
        return (
          <GlassCard>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <SignesVitauxSection
                    consultationId={consultation.id}
                    patientId={consultation.patient_id || patient.id}
                    userId={userId}
                    onSave={handleSaveConstantes}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }} />
                  <ExamenPhysiqueForm
                    value={examenPhysiqueData}
                    onChange={setExamenPhysiqueData}
                    isFemale={patient.sexe === 'Féminin'}
                  />
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button variant="contained" onClick={handleSaveExamenPhysique}>
                      Enregistrer l'examen physique
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>
        );

      case 3:
        if (!consultation) {
          return (
            <GlassCard>
              <CardContent>
                <Alert severity="warning">
                  Veuillez d'abord sélectionner un patient pour démarrer la consultation.
                </Alert>
              </CardContent>
            </GlassCard>
          );
        }
        return (
          <GlassCard>
            <CardContent>
              <DiagnosticsDetailedForm
                diagnosticsProbables={diagnosticsProbables}
                diagnosticsDifferentiels={diagnosticsDifferentiels}
                testsComplementaires={testsComplementaires}
                onDiagnosticsProbablesChange={setDiagnosticsProbables}
                onDiagnosticsDifferentielsChange={setDiagnosticsDifferentiels}
                onTestsComplementairesChange={setTestsComplementaires}
                onSave={handleSaveDiagnostics}
              />
            </CardContent>
          </GlassCard>
        );

      case 4:
        if (!consultation || !patient) {
          return (
            <GlassCard>
              <CardContent>
                <Alert severity="warning">
                  Veuillez d'abord sélectionner un patient pour démarrer la consultation.
                </Alert>
              </CardContent>
            </GlassCard>
          );
        }
        return (
          <GlassCard>
            <CardContent>
              <PrescriptionsCompleteManager
                consultationId={consultation.id}
                patientId={consultation.patient_id || patient.id}
                userId={userId}
                patient={patient}
                onPrescriptionMedicamenteuseSave={handleSavePrescriptionMedicamenteuse}
                onLabRequestSave={handleSaveLabRequest}
                onImagingRequestSave={handleSaveImagingRequest}
                onHospitalisationSave={handleSaveHospitalisation}
              />
            </CardContent>
          </GlassCard>
        );

      case 5:
        if (!consultation) {
          return (
            <GlassCard>
              <CardContent>
                <Alert severity="warning">
                  Veuillez d'abord sélectionner un patient pour démarrer la consultation.
                </Alert>
              </CardContent>
            </GlassCard>
          );
        }
        return (
          <GlassCard>
            <CardContent>
              <PlanTraitementForm
                value={planTraitementData}
                onChange={setPlanTraitementData}
                onSave={handleSavePlanTraitement}
              />
            </CardContent>
          </GlassCard>
        );

      case 6:
        if (!consultation || !patient) {
          return (
            <GlassCard>
              <CardContent>
                <Alert severity="warning">
                  Veuillez d'abord sélectionner un patient pour démarrer la consultation.
                </Alert>
              </CardContent>
            </GlassCard>
          );
        }
        return (
          <GlassCard>
            <CardContent>
              <ConsultationWorkflowStep10
                consultationId={consultation.id}
                patientId={consultation.patient_id || patient.id}
                onRdvCreated={() => {
                  showSnackbar('Rendez-vous créé avec succès', 'success');
                }}
                userId={userId}
                consultationType={consultation.type || 'Médecine générale'}
                motifs={consultation.motifs || []}
                patient={patient}
                examensPrescrits={examensPrescrits}
              />
            </CardContent>
          </GlassCard>
        );

      case 7:
        if (!consultation) {
          return (
            <GlassCard>
              <CardContent>
                <Alert severity="warning">
                  Veuillez d'abord sélectionner un patient pour démarrer la consultation.
                </Alert>
              </CardContent>
            </GlassCard>
          );
        }
        return (
          <GlassCard>
            <CardContent>
              <ConsultationWorkflowStep11
                consultation={consultation}
                patientId={consultation.patient_id || (patient ? patient.id : '')}
                userId={userId}
                onComplete={async () => {
                  const updated = await ConsultationService.getConsultationById(consultation.id);
                  setConsultation(updated);
                  showSnackbar('Facturation générée avec succès', 'success');
                }}
              />
            </CardContent>
          </GlassCard>
        );

      case 8:
        if (!consultation || !patient) {
          return (
            <GlassCard>
              <CardContent>
                <Alert severity="warning">
                  Veuillez d'abord sélectionner un patient pour démarrer la consultation.
                </Alert>
              </CardContent>
            </GlassCard>
          );
        }
        return (
          <GlassCard>
            <CardContent>
              <ConsultationWorkflowStep12
                consultation={consultation}
                onClose={async () => {
                  // Clôture complète avec intégrations
                  const result = await ConsultationIntegrationService.closeConsultationWithIntegrations(
                    consultation.id,
                    consultation.patient_id || patient.id,
                    userId
                  );
                  if (result.success) {
                    showSnackbar('Consultation clôturée avec succès', 'success');
                    // Réinitialiser pour une nouvelle consultation
                    setTimeout(() => {
                      setActiveStep(0);
                      setPatient(null);
                      setConsultation(null);
                      setMotifsData(null);
                      setExamenPhysiqueData({});
                      setDiagnosticsProbables([]);
                      setDiagnosticsDifferentiels([]);
                      setTestsComplementaires([]);
                      setPlanTraitementData({});
                    }, 2000);
                  } else {
                    showSnackbar('Erreur lors de la clôture', 'error');
                  }
                }}
                userId={userId}
              />
            </CardContent>
          </GlassCard>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <ToolbarBits>
          <Box display="flex" alignItems="center" gap={2}>
            <MedicalServices sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <GradientText variant="h4" fontWeight="bold">
                Nouvelle Consultation
              </GradientText>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Workflow guidé en 9 étapes pour une consultation complète
              </Typography>
            </Box>
          </Box>
        </ToolbarBits>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Stepper */}
      <GlassCard sx={{ mb: 4 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < activeStep;
              const isActive = index === activeStep;
              return (
                <Step
                  key={step.id}
                  completed={isCompleted}
                  onClick={() => handleStepClick(index)}
                  sx={{ cursor: index <= activeStep ? 'pointer' : 'default' }}
                >
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: (theme) => {
                            if (isCompleted) {
                              return theme.palette.mode === 'dark' ? '#16a34a' : 'success.main';
                            }
                            if (isActive) {
                              return theme.palette.mode === 'dark' ? '#22c55e' : 'success.main';
                            }
                            return theme.palette.mode === 'dark' ? '#334155' : 'grey.300';
                          },
                          color: 'white',
                          border: (theme) => {
                            if (isActive) {
                              return theme.palette.mode === 'dark' 
                                ? '2px solid #4ade80' 
                                : '2px solid #22c55e';
                            }
                            return 'none';
                          },
                          boxShadow: (theme) => {
                            if (isActive || isCompleted) {
                              return theme.palette.mode === 'dark'
                                ? '0 4px 12px rgba(34, 197, 94, 0.3)'
                                : '0 4px 12px rgba(22, 163, 74, 0.3)';
                            }
                            return 'none';
                          },
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: index <= activeStep ? 'scale(1.05)' : 'none',
                            boxShadow: (theme) => {
                              if (index <= activeStep) {
                                return theme.palette.mode === 'dark'
                                  ? '0 6px 16px rgba(34, 197, 94, 0.15)'
                                  : '0 6px 16px rgba(22, 163, 74, 0.3)';
                              }
                              return 'none';
                            },
                            opacity: index <= activeStep ? 0.9 : 1,
                          },
                        }}
                      >
                        <StepIcon />
                      </Box>
                    )}
                  >
                    <Typography 
                      variant="subtitle2"
                      sx={{
                        color: (theme) => {
                          if (isActive) {
                            return theme.palette.mode === 'dark' ? '#4ade80' : 'success.main';
                          }
                          if (isCompleted) {
                            return theme.palette.mode === 'dark' ? '#86efac' : 'success.main';
                          }
                          return 'text.secondary';
                        },
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </CardContent>
      </GlassCard>

      {/* Step Content */}
      <Box sx={{ mb: 4 }}>
        {renderStepContent()}
      </Box>

      {/* Navigation */}
      <ToolbarBits>
        <Button
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
          startIcon={<ArrowBack />}
          variant="outlined"
        >
          Retour
        </Button>
        <Box display="flex" gap={2}>
          {activeStep < STEPS.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              endIcon={<ArrowForward />}
            >
              Suivant
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              disabled={!consultation || loading}
              startIcon={<CheckCircle />}
            >
              Consultation terminée
            </Button>
          )}
        </Box>
      </ToolbarBits>

      {/* Snackbar */}
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
    </Container>
  );
};

export default ConsultationModule;
