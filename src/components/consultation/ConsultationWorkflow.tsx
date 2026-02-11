import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import {
  Assignment,
  History,
  Vaccines,
  Warning,
  Description,
  LocalHospital,
  Science,
  Medication,
  CheckCircle,
} from '@mui/icons-material';
import { Consultation } from '../../services/consultationService';
import { Patient, supabase } from '../../services/supabase';
import { ConsultationService } from '../../services/consultationService';
import { ModernConsultationLayout } from './ModernConsultationLayout';
import { WorkflowStep1Motif } from './workflow/WorkflowStep1Motif';
import { WorkflowStep2Anamnese } from './workflow/WorkflowStep2Anamnese';
import { WorkflowStep3TraitementEnCours } from './workflow/WorkflowStep3TraitementEnCours';
import { WorkflowStep4Antecedents } from './workflow/WorkflowStep4Antecedents';
import { WorkflowStep5Prevention } from './workflow/WorkflowStep5Prevention';
import { WorkflowStep6Allergies } from './workflow/WorkflowStep6Allergies';
import { WorkflowStep7Bilans } from './workflow/WorkflowStep7Bilans';
import { WorkflowStep8ExamenPhysique } from './workflow/WorkflowStep8ExamenPhysique';
import { WorkflowStep9Diagnostic } from './workflow/WorkflowStep9Diagnostic';
import { WorkflowStep10Ordonnance } from './workflow/WorkflowStep10Ordonnance';
import { WorkflowStep11Cloture } from './workflow/WorkflowStep11Cloture';

interface ConsultationWorkflowProps {
  consultation: Consultation;
  patient: Patient;
  onStepComplete: (step: number, data: any) => Promise<void>;
  onClose: () => Promise<void>;
  userId: string;
}

const STEPS = [
  { id: 1, label: 'Motif de Consultation', icon: Assignment, required: true, description: 'Raison principale de la consultation' },
  { id: 2, label: 'Anamnèse (Histoire de la Maladie)', icon: History, required: false, description: 'Description détaillée avec dictée vocale' },
  { id: 3, label: 'Traitement en Cours', icon: Medication, required: false, description: 'Médicaments actuellement pris par le patient' },
  { id: 4, label: 'Antécédents (Background)', icon: History, required: false, description: 'Antécédents médicaux et familiaux' },
  { id: 5, label: 'Prévention (Vaccination & Déparasitage)', icon: Vaccines, required: false, description: 'Historique vaccinal et déparasitage' },
  { id: 6, label: 'Allergies (Sécurité Critique)', icon: Warning, required: false, description: 'Allergies connues et réactions' },
  { id: 7, label: 'Bilans Antérieurs', icon: Description, required: false, description: 'Examens et bilans précédents' },
  { id: 8, label: 'Examen Physique', icon: LocalHospital, required: false, description: 'Signes vitaux et examen physique' },
  { id: 9, label: 'Diagnostic', icon: Science, required: false, description: 'Diagnostics probables et différentiels' },
  { id: 10, label: 'Traitement (Ordonnance)', icon: Medication, required: false, description: 'Médicaments, examens et hospitalisation' },
  { id: 11, label: 'Rendez-vous (RDV) & Clôture', icon: CheckCircle, required: true, description: 'Rendez-vous de suivi et clôture' },
];

export const ConsultationWorkflow: React.FC<ConsultationWorkflowProps> = ({
  consultation,
  patient,
  onStepComplete,
  onClose,
  userId,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepData, setStepData] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);

  // Initialiser stepData depuis consultation au montage
  useEffect(() => {
    const loadStepData = async () => {
      const initialData: Record<number, any> = {};
      
      // Charger les données depuis consultation_steps
      const { data: stepsData } = await supabase
        .from('consultation_steps')
        .select('step_number, data')
        .eq('consult_id', consultation.id);
      
      // Mapper les données des étapes
      if (stepsData) {
        stepsData.forEach((step: any) => {
          initialData[step.step_number - 1] = step.data;
        });
      }
      
      // Étape 1: Motifs
      if (consultation.motifs && consultation.motifs.length > 0) {
        initialData[0] = initialData[0] || {
          motif: consultation.motifs[0],
          categorie_motif: (consultation as any).categorie_motif || '',
        };
      }
      
      // Étape 2: Anamnèse
      if (consultation.anamnese) {
        initialData[1] = initialData[1] || { anamnese: consultation.anamnese };
      }
      
      // Étape 3: Traitement en cours
      if (consultation.traitement_en_cours) {
        initialData[2] = initialData[2] || { traitement_en_cours: consultation.traitement_en_cours };
      }
      
      // Étape 4: Antécédents
      if ((consultation as any).antecedents_consultation) {
        initialData[3] = initialData[3] || { antecedents: (consultation as any).antecedents_consultation };
      }
      
      // Étape 5: Prévention - Initialiser depuis stepData si disponible, sinon vide
      if (!initialData[4]) {
        initialData[4] = { prevention: { vaccinations: [], deparasitages: [] } };
      }
      
      // Étape 6: Allergies - Initialiser depuis patient
      if (!initialData[5] && patient.allergies) {
        initialData[5] = { allergies: patient.allergies };
      }
      
      // Étape 7: Bilans - Initialiser depuis stepData si disponible, sinon charger depuis consultation
      if (!initialData[6]) {
        try {
          const labRequests = await ConsultationService.getLabRequests(consultation.id);
          initialData[6] = {
            bilans: {
              labRequests: labRequests || [],
              bilansAntérieurs: []
            }
          };
        } catch (error) {
          console.error('Erreur chargement bilans:', error);
          initialData[6] = { bilans: { labRequests: [], bilansAntérieurs: [] } };
        }
      }
      
      // Étape 8: Examens cliniques
      if (consultation.examens_cliniques) {
        initialData[7] = initialData[7] || { examens_cliniques: consultation.examens_cliniques };
      }
      
      // Étape 9: Diagnostics
      if (consultation.diagnostics) {
        initialData[8] = initialData[8] || {
          diagnostics: consultation.diagnostics,
          diagnostics_detail: (consultation as any).diagnostics_detail || [],
        };
      }
      
      setStepData(initialData);
    };
    
    loadStepData();
  }, [consultation, patient]);

  // Vérifier quelles étapes sont complètes
  useEffect(() => {
    const completed = new Set<number>();
    
    // Étape 1: Motifs obligatoires
    if (consultation.motifs && consultation.motifs.length > 0) completed.add(0);
    
    // Étape 2: Anamnèse
    if (consultation.anamnese) completed.add(1);
    
    // Étape 3: Traitement en cours
    if (consultation.traitement_en_cours) completed.add(2);
    
    // Étape 4: Antécédents (vérifier si modifiés)
    if ((consultation as any).antecedents_consultation) completed.add(3);
    
    // Étape 5: Prévention (vérifier dans stepData ou consultation_steps)
    if (stepData[4]?.prevention) {
      const prevention = stepData[4].prevention;
      if ((prevention.vaccinations && prevention.vaccinations.length > 0) || 
          (prevention.deparasitages && prevention.deparasitages.length > 0)) {
        completed.add(4);
      }
    }
    
    // Étape 6: Allergies
    if (patient.allergies || stepData[5]?.allergies) completed.add(5);
    
    // Étape 7: Bilans (vérifier dans stepData ou consultation_steps)
    if (stepData[6]?.bilans) {
      const bilans = stepData[6].bilans;
      if ((bilans.labRequests && bilans.labRequests.length > 0) || 
          (bilans.bilansAntérieurs && bilans.bilansAntérieurs.length > 0)) {
        completed.add(6);
      }
    }
    
    // Étape 8: Examens cliniques
    if (consultation.examens_cliniques && Object.keys(consultation.examens_cliniques).length > 0) completed.add(7);
    
    // Étape 9: Diagnostics
    if (consultation.diagnostics && consultation.diagnostics.length > 0) completed.add(8);
    
    // Étape 11: Clôture
    if (consultation.status === 'CLOTURE') completed.add(10);
    
    setCompletedSteps(completed);
  }, [consultation, patient, stepData]);

  const handleNext = async () => {
    const currentStep = STEPS[activeStep];
    const stepNumber = activeStep + 1;

    // Validation pour les étapes obligatoires - bloquer la navigation si non complétée
    if (currentStep.required) {
      const currentData = stepData[activeStep];
      if (activeStep === 0) {
        // Étape 1: Vérifier motif
        if (!currentData?.motif && !consultation.motifs?.length) {
          console.warn('Étape obligatoire non complétée: Le motif de consultation est requis');
          return;
        }
      }
      if (activeStep === 10) {
        // Étape 11: Vérifier clôture
        if (consultation.status !== 'CLOTURE') {
          console.warn('La consultation doit être clôturée avant de terminer');
          return;
        }
      }
    }

    // Sauvegarder les données de l'étape si disponibles (en arrière-plan, ne bloque pas la navigation)
    const dataToSave = stepData[activeStep] || {};
    if (Object.keys(dataToSave).length > 0 || stepNumber === 11) {
      setLoading(true);
      try {
        // Utiliser le service pour sauvegarder l'étape avec userId
        await ConsultationService.saveWorkflowStep(consultation.id, stepNumber, dataToSave, userId);
        await onStepComplete(stepNumber, dataToSave);
        setCompletedSteps((prev) => {
          const newSet = new Set(prev);
          newSet.add(activeStep);
          return newSet;
        });
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        // Ne pas bloquer la navigation même en cas d'erreur de sauvegarde
        // L'utilisateur peut toujours naviguer et réessayer plus tard
      } finally {
        setLoading(false);
      }
    } else {
      // Même sans données à sauvegarder, marquer l'étape comme complétée si elle est optionnelle
      if (!currentStep.required) {
        setCompletedSteps((prev) => {
          const newSet = new Set(prev);
          newSet.add(activeStep);
          return newSet;
        });
      }
    }

    // Navigation vers l'étape suivante
    if (activeStep < STEPS.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const canGoNext = () => {
    const currentStep = STEPS[activeStep];
    if (!currentStep.required) return true;
    
    const currentData = stepData[activeStep];
    if (activeStep === 0) {
      // Étape 1: Vérifier motif
      return currentData?.motif || consultation.motifs?.length > 0;
    }
    if (activeStep === 10) {
      // Étape 11: Vérifier clôture
      return consultation.status === 'CLOTURE';
    }
    return true;
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleSaveStep = async () => {
    const stepNumber = activeStep + 1;
    const dataToSave = stepData[activeStep] || {};

    // Ne rien faire s'il n'y a aucune donnée à sauvegarder (sauf étape 11)
    if (Object.keys(dataToSave).length === 0 && stepNumber !== 11) {
      return;
    }

    setLoading(true);
    try {
      await ConsultationService.saveWorkflowStep(consultation.id, stepNumber, dataToSave, userId);
      await onStepComplete(stepNumber, dataToSave);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l’étape:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = (step: number) => {
    // Permettre de revenir aux étapes précédentes ou complétées
    if (step <= activeStep || completedSteps.has(step)) {
      setActiveStep(step);
    }
  };

  const updateStepData = (stepIndex: number, data: any) => {
    setStepData((prev) => ({
      ...prev,
      [stepIndex]: { ...prev[stepIndex], ...data },
    }));
  };

  const getStepComponent = (stepIndex: number) => {
    const step = STEPS[stepIndex];
    const data = stepData[stepIndex] || {};

    switch (step.id) {
      case 1:
        return (
          <WorkflowStep1Motif
            consultation={consultation}
            onMotifChange={(motif, categorie) =>
              updateStepData(stepIndex, { motif, categorie_motif: categorie })
            }
            required={true}
          />
        );
      case 2:
        return (
          <WorkflowStep2Anamnese
            anamnese={data.anamnese || consultation.anamnese || {}}
            onAnamneseChange={(anamnese) =>
              updateStepData(stepIndex, { anamnese })
            }
          />
        );
      case 3:
        return (
          <WorkflowStep3TraitementEnCours
            patient={patient}
            traitementEnCours={data.traitement_en_cours || consultation.traitement_en_cours || ''}
            onTraitementChange={(traitement) =>
              updateStepData(stepIndex, { traitement_en_cours: traitement })
            }
          />
        );
      case 4:
        return (
          <WorkflowStep4Antecedents
            patient={patient}
            antecedents={data.antecedents || (consultation as any).antecedents_consultation || {}}
            onAntecedentsChange={(antecedents) =>
              updateStepData(stepIndex, { antecedents })
            }
          />
        );
      case 5:
        return (
          <WorkflowStep5Prevention
            patient={patient}
            onPreventionChange={(prevention) =>
              updateStepData(stepIndex, { prevention })
            }
          />
        );
      case 6:
        return (
          <WorkflowStep6Allergies
            patient={patient}
            onAllergiesChange={(allergies) =>
              updateStepData(stepIndex, { allergies })
            }
          />
        );
      case 7:
        return (
          <WorkflowStep7Bilans
            patient={patient}
            consultationId={consultation.id}
            onBilansChange={(bilans) =>
              updateStepData(stepIndex, { bilans })
            }
          />
        );
      case 8:
        return (
          <WorkflowStep8ExamenPhysique
            consultationId={consultation.id}
            patientId={consultation.patient_id}
            examensCliniques={data.examens_cliniques || consultation.examens_cliniques || {}}
            onExamensChange={(examens) =>
              updateStepData(stepIndex, { examens_cliniques: examens })
            }
            userId={userId}
          />
        );
      case 9:
        return (
          <WorkflowStep9Diagnostic
            diagnostics={data.diagnostics || consultation.diagnostics || []}
            diagnosticsDetail={data.diagnostics_detail || (consultation as any).diagnostics_detail || []}
            onDiagnosticsChange={(diagnostics, diagnosticsDetail) =>
              updateStepData(stepIndex, { diagnostics, diagnostics_detail: diagnosticsDetail })
            }
          />
        );
      case 10:
        return (
          <WorkflowStep10Ordonnance
            consultationId={consultation.id}
            patientId={consultation.patient_id}
            patient={patient}
            onPrescriptionComplete={() => {
              setCompletedSteps((prev) => {
                const newSet = new Set(prev);
                newSet.add(stepIndex);
                return newSet;
              });
            }}
            userId={userId}
          />
        );
      case 11:
        return (
          <WorkflowStep11Cloture
            consultation={consultation}
            onClose={onClose}
            userId={userId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: '100%' }}>
      <ModernConsultationLayout
        steps={STEPS}
        activeStep={activeStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
        onNext={handleNext}
        onBack={handleBack}
        onSaveStep={handleSaveStep}
        canSaveStep={Boolean(stepData[activeStep] && Object.keys(stepData[activeStep]).length > 0)}
        canGoNext={canGoNext()}
        loading={loading}
      >
        {getStepComponent(activeStep)}
      </ModernConsultationLayout>
    </Box>
  );
};

