import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  CardContent,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  MedicalServices,
} from '@mui/icons-material';
import { GradientText } from '../ui/GradientText';
import { GlassCard } from '../ui/GlassCard';
import { ToolbarBits } from '../ui/ToolbarBits';

interface Step {
  id: number;
  label: string;
  icon: React.ElementType;
  required: boolean;
  description?: string;
}

interface ModernConsultationLayoutProps {
  steps: Step[];
  activeStep: number;
  completedSteps: Set<number>;
  onStepClick: (step: number) => void;
  onNext: () => void;
  onBack: () => void;
  /** Sauvegarde explicite de l'étape courante sans changer d'étape */
  onSaveStep?: () => void;
  /** Indique si la sauvegarde est possible (par ex. données modifiées) */
  canSaveStep?: boolean;
  canGoNext: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const ModernConsultationLayout: React.FC<ModernConsultationLayoutProps> = ({
  steps,
  activeStep,
  completedSteps,
  onStepClick,
  onNext,
  onBack,
  onSaveStep,
  canSaveStep = true,
  canGoNext,
  loading = false,
  children,
}) => {
  const isLastStep = activeStep === steps.length - 1;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <ToolbarBits>
          <Box display="flex" alignItems="center" gap={2}>
            <MedicalServices sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <GradientText variant="h4" fontWeight="bold">
                Workflow de Consultation
              </GradientText>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Workflow guidé en {steps.length} étapes pour une consultation complète
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
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = completedSteps.has(index);
              const isActive = activeStep === index;
              return (
                <Step
                  key={step.id}
                  completed={isCompleted}
                  onClick={() => onStepClick(index)}
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
                    {step.description && (
                      <Typography variant="caption" color="text.secondary">
                        {step.description}
                      </Typography>
                    )}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </CardContent>
      </GlassCard>

      {/* Step Content */}
      <Box sx={{ mb: 4 }}>
        <GlassCard>
          <CardContent>
            {children}
          </CardContent>
        </GlassCard>
      </Box>

      {/* Navigation */}
      <ToolbarBits>
        <Button
          disabled={activeStep === 0 || loading}
          onClick={onBack}
          startIcon={<ArrowBack />}
          variant="outlined"
        >
          Retour
        </Button>
        <Box display="flex" gap={2}>
          {onSaveStep && (
            <Button
              variant="outlined"
              color="primary"
              onClick={onSaveStep}
              disabled={loading || !canSaveStep}
            >
              Sauvegarder
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={onNext}
              disabled={!canGoNext || loading}
              endIcon={<ArrowForward />}
            >
              Suivant
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              disabled={!canGoNext || loading}
              startIcon={<CheckCircle />}
            >
              Consultation terminée
            </Button>
          )}
        </Box>
      </ToolbarBits>
    </Container>
  );
};

