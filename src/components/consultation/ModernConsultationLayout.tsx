import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Fade,
  Slide,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';

interface Step {
  id: number;
  label: string;
  icon: React.ElementType;
  required: boolean;
}

interface ModernConsultationLayoutProps {
  steps: Step[];
  activeStep: number;
  completedSteps: Set<number>;
  onStepClick: (step: number) => void;
  onNext: () => void;
  onBack: () => void;
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
  canGoNext,
  loading = false,
  children,
}) => {
  const progress = ((activeStep + 1) / steps.length) * 100;
  const isLastStep = activeStep === steps.length - 1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', gap: 2 }}>
      {/* Horizontal Stepper */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Workflow de Consultation
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Étape {activeStep + 1} / {steps.length}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
              },
            }}
          />
        </Box>

        <Box
          sx={{
            overflowX: 'auto',
            overflowY: 'hidden',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'grey.100',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'grey.400',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: 'grey.500',
              },
            },
          }}
        >
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel
            sx={{
              minWidth: Math.max(800, steps.length * 150),
              pb: 2,
            }}
          >
            {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = completedSteps.has(index);
            const isActive = activeStep === index;
            const isClickable = index <= activeStep || isCompleted;

            return (
              <Step
                key={step.id}
                completed={isCompleted}
                onClick={() => isClickable && onStepClick(index)}
                sx={{ 
                  cursor: isClickable ? 'pointer' : 'default',
                  '& .MuiStepLabel-root': {
                    cursor: isClickable ? 'pointer' : 'default',
                  },
                }}
              >
                <StepLabel
                  optional={
                    <Chip
                      label={step.required ? 'Obligatoire' : 'Optionnel'}
                      size="small"
                      color={step.required ? 'error' : 'default'}
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        mt: 0.5,
                      }}
                    />
                  }
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
                            return theme.palette.mode === 'dark' ? '#3b82f6' : 'primary.main';
                          }
                          return theme.palette.mode === 'dark' ? '#334155' : 'grey.300';
                        },
                        color: 'white',
                        border: (theme) => {
                          if (isActive) {
                            return theme.palette.mode === 'dark' 
                              ? '2px solid #60a5fa' 
                              : '2px solid #3b82f6';
                          }
                          return 'none';
                        },
                        boxShadow: (theme) => {
                          if (isActive) {
                            return theme.palette.mode === 'dark'
                              ? '0 0 0 4px rgba(59, 130, 246, 0.2)'
                              : '0 0 0 4px rgba(59, 130, 246, 0.1)';
                          }
                          return 'none';
                        },
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: isClickable ? 'scale(1.1)' : 'none',
                        },
                      }}
                    >
                      <StepIcon />
                    </Box>
                  )}
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: (theme) => {
                        if (isActive) {
                          return theme.palette.mode === 'dark' ? '#60a5fa' : 'primary.main';
                        }
                        if (isCompleted) {
                          return theme.palette.mode === 'dark' ? '#86efac' : 'success.main';
                        }
                        return 'text.secondary';
                      },
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.875rem',
                    },
                  }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            );
          })}
          </Stepper>
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Paper
        sx={{
          flex: 1,
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Step Content with Animation */}
        <Box sx={{ flex: 1, overflow: 'auto', mb: 3 }}>
          <Fade in={true} timeout={300}>
            <Box>
              <Slide direction="left" in={true} mountOnEnter unmountOnExit timeout={300}>
                <Box>{children}</Box>
              </Slide>
            </Box>
          </Fade>
        </Box>

        {/* Navigation Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={activeStep === 0 || loading}
            startIcon={<ArrowBack />}
            sx={{ minWidth: 120 }}
          >
            Retour
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={onNext}
              disabled={!canGoNext || loading}
              endIcon={<ArrowForward />}
              sx={{ minWidth: 150 }}
            >
              {loading ? 'Enregistrement...' : isLastStep ? 'Terminer' : 'Suivant'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

