import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
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
  ArrowForward,
  ArrowBack,
} from '@mui/icons-material';
import { Consultation } from '../../services/consultationService';
import { Patient } from '../../services/supabase';
import { ConsultationService } from '../../services/consultationService';
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
  { id: 1, label: 'Motif de Consultation', icon: Assignment, required: true },
  { id: 2, label: 'Anamnèse (Histoire de la Maladie)', icon: History, required: false },
  { id: 3, label: 'Traitement en Cours', icon: Medication, required: false },
  { id: 4, label: 'Antécédents (Background)', icon: History, required: false },
  { id: 5, label: 'Prévention (Vaccination & Déparasitage)', icon: Vaccines, required: false },
  { id: 6, label: 'Allergies (Sécurité Critique)', icon: Warning, required: false },
  { id: 7, label: 'Bilans Antérieurs', icon: Description, required: false },
  { id: 8, label: 'Examen Physique', icon: LocalHospital, required: false },
  { id: 9, label: 'Diagnostic', icon: Science, required: false },
  { id: 10, label: 'Traitement (Ordonnance)', icon: Medication, required: false },
  { id: 11, label: 'Rendez-vous (RDV) & Clôture', icon: CheckCircle, required: true },
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
    
    // Étape 6: Allergies
    if (patient.allergies) completed.add(5);
    
    // Étape 8: Examens cliniques
    if (consultation.examens_cliniques && Object.keys(consultation.examens_cliniques).length > 0) completed.add(7);
    
    // Étape 9: Diagnostics
    if (consultation.diagnostics && consultation.diagnostics.length > 0) completed.add(8);
    
    // Étape 11: Clôture
    if (consultation.status === 'CLOTURE') completed.add(10);
    
    setCompletedSteps(completed);
  }, [consultation, patient]);

  const handleNext = async () => {
    const currentStep = STEPS[activeStep];
    const stepNumber = activeStep + 1;

    // Sauvegarder les données de l'étape
    if (stepData[activeStep] || stepNumber === 11) {
      setLoading(true);
      try {
        // Utiliser le service pour sauvegarder l'étape
        await ConsultationService.saveWorkflowStep(consultation.id, stepNumber, stepData[activeStep] || {});
        await onStepComplete(stepNumber, stepData[activeStep] || {});
        setCompletedSteps((prev) => {
          const newSet = new Set(prev);
          newSet.add(activeStep);
          return newSet;
        });
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (activeStep < STEPS.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Permettre de revenir aux étapes précédentes
    if (step <= activeStep || completedSteps.has(step)) {
      setActiveStep(step);
    }
  };

  const getStepComponent = (stepIndex: number) => {
    const step = STEPS[stepIndex];
    const data = stepData[stepIndex] || {};

    // Banner d'alertes allergies persistant (étape 6)
    const allergiesBanner = patient.allergies ? (
      <WorkflowStep6Allergies
        patient={patient}
        onAllergiesChange={() => {}}
      />
    ) : null;

    switch (step.id) {
      case 1:
        return (
          <>
            {allergiesBanner}
            <WorkflowStep1Motif
              consultation={consultation}
              onMotifChange={(motif, categorie) =>
                setStepData({ ...stepData, [stepIndex]: { motif, categorie_motif: categorie } })
              }
              required={true}
            />
          </>
        );
      case 2:
        return (
          <>
            {allergiesBanner}
            <WorkflowStep2Anamnese
              anamnese={consultation.anamnese || {}}
              onAnamneseChange={(anamnese) =>
                setStepData({ ...stepData, [stepIndex]: { anamnese } })
              }
            />
          </>
        );
      case 3:
        return (
          <>
            {allergiesBanner}
            <WorkflowStep3TraitementEnCours
              patient={patient}
              traitementEnCours={consultation.traitement_en_cours || ''}
              onTraitementChange={(traitement) =>
                setStepData({ ...stepData, [stepIndex]: { traitement_en_cours: traitement } })
              }
            />
          </>
        );
      case 4:
        return (
          <>
            {allergiesBanner}
            <WorkflowStep4Antecedents
              patient={patient}
              antecedents={(consultation as any).antecedents_consultation || {}}
              onAntecedentsChange={(antecedents) =>
                setStepData({ ...stepData, [stepIndex]: { antecedents } })
              }
            />
          </>
        );
      case 5:
        return (
          <>
            {allergiesBanner}
            <WorkflowStep5Prevention patient={patient} />
          </>
        );
      case 6:
        return <WorkflowStep6Allergies patient={patient} onAllergiesChange={() => {}} />;
      case 7:
        return (
          <>
            {allergiesBanner}
            <WorkflowStep7Bilans
              patient={patient}
              consultationId={consultation.id}
            />
          </>
        );
      case 8:
        return (
          <>
            {allergiesBanner}
            <WorkflowStep8ExamenPhysique
              consultationId={consultation.id}
              patientId={consultation.patient_id}
              examensCliniques={consultation.examens_cliniques || {}}
              onExamensChange={(examens) =>
                setStepData({ ...stepData, [stepIndex]: { examens_cliniques: examens } })
              }
              userId={userId}
            />
          </>
        );
      case 9:
        return (
          <>
            {allergiesBanner}
            <WorkflowStep9Diagnostic
              diagnostics={consultation.diagnostics || []}
              diagnosticsDetail={(consultation as any).diagnostics_detail || []}
              onDiagnosticsChange={(diagnostics, diagnosticsDetail) =>
                setStepData({ ...stepData, [stepIndex]: { diagnostics, diagnostics_detail: diagnosticsDetail } })
              }
            />
          </>
        );
      case 10:
        return (
          <>
            {allergiesBanner}
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
          </>
        );
      case 11:
        return (
          <>
            {allergiesBanner}
            <WorkflowStep11Cloture
              consultation={consultation}
              onClose={onClose}
              userId={userId}
            />
          </>
        );
      default:
        return null;
    }
  };

  const isStepOptional = (step: number) => {
    return !STEPS[step].required;
  };

  const isStepCompleted = (step: number) => {
    return completedSteps.has(step);
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Workflow de Consultation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Suivez les étapes pour compléter la consultation du patient
          </Typography>
        </CardContent>
      </Card>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isOptional = isStepOptional(index);
            const isCompleted = isStepCompleted(index);

            return (
              <Step key={step.id} completed={isCompleted}>
                <StepLabel
                  optional={
                    isOptional ? (
                      <Typography variant="caption">Optionnel</Typography>
                    ) : (
                      <Typography variant="caption" color="error">
                        Obligatoire
                      </Typography>
                    )
                  }
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isCompleted ? 'success.main' : activeStep === index ? 'primary.main' : 'grey.300',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleStepClick(index)}
                    >
                      <StepIcon />
                    </Box>
                  )}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  {getStepComponent(index)}
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ mt: 1, mr: 1 }}
                      disabled={loading}
                      endIcon={<ArrowForward />}
                    >
                      {index === STEPS.length - 1 ? 'Terminer' : 'Suivant'}
                    </Button>
                    <Button
                      disabled={index === 0 || loading}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                      startIcon={<ArrowBack />}
                    >
                      Retour
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            );
          })}
        </Stepper>
      </Paper>
    </Box>
  );
};

