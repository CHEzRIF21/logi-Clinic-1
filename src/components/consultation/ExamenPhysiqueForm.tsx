import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import { LocalHospital, Mic, MicOff, Stop } from '@mui/icons-material';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface ExamenPhysiqueData {
  appareil_respiratoire?: string;
  appareil_digestif?: string;
  appareil_cardiovasculaire?: string;
  systeme_nerveux?: string;
  appareil_locomoteur?: string;
  examen_general?: string;
  examen_gynecologique?: string;
  autres_observations?: string;
}

interface ExamenPhysiqueFormProps {
  value: ExamenPhysiqueData;
  onChange: (data: ExamenPhysiqueData) => void;
  isFemale?: boolean;
}

export const ExamenPhysiqueForm: React.FC<ExamenPhysiqueFormProps> = ({
  value,
  onChange,
  isFemale = false,
}) => {
  const [data, setData] = useState<ExamenPhysiqueData>(value || {});
  const [activeField, setActiveField] = useState<keyof ExamenPhysiqueData | null>(null);
  
  // Hook de reconnaissance vocale
  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition('fr-FR', true, true);

  // Mettre à jour le champ actif avec la transcription
  React.useEffect(() => {
    if (transcript && activeField) {
      const currentValue = data[activeField] || '';
      const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
      const updated = { ...data, [activeField]: newValue };
      setData(updated);
      onChange(updated);
      resetTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, activeField]);

  const handleChange = (field: keyof ExamenPhysiqueData, val: string) => {
    const updated = { ...data, [field]: val };
    setData(updated);
    onChange(updated);
  };

  const handleStartDictation = (field: keyof ExamenPhysiqueData) => {
    if (isListening && activeField === field) {
      // Arrêter la dictée pour ce champ
      stopListening();
      setActiveField(null);
      resetTranscript();
    } else {
      // Arrêter toute dictée en cours
      if (isListening) {
        stopListening();
        resetTranscript();
      }
      // Démarrer la dictée pour le nouveau champ
      setActiveField(field);
      startListening();
    }
  };

  const zones = [
    {
      key: 'appareil_respiratoire' as keyof ExamenPhysiqueData,
      label: 'Appareil Respiratoire',
      placeholder: 'Auscultation pulmonaire, fréquence respiratoire, signes de détresse...',
    },
    {
      key: 'appareil_digestif' as keyof ExamenPhysiqueData,
      label: 'Appareil Digestif',
      placeholder: 'Abdomen, palpation, percussion, signes de défense...',
    },
    {
      key: 'appareil_cardiovasculaire' as keyof ExamenPhysiqueData,
      label: 'Appareil Cardio-Vasculaire',
      placeholder: 'Auscultation cardiaque, pouls, signes d\'insuffisance cardiaque...',
    },
    {
      key: 'systeme_nerveux' as keyof ExamenPhysiqueData,
      label: 'Système Nerveux',
      placeholder: 'État de conscience, réflexes, signes méningés, examen neurologique...',
    },
    {
      key: 'appareil_locomoteur' as keyof ExamenPhysiqueData,
      label: 'Appareil Locomoteur',
      placeholder: 'Mobilité articulaire, déformations, signes inflammatoires...',
    },
    {
      key: 'examen_general' as keyof ExamenPhysiqueData,
      label: 'Examen Général',
      placeholder: 'État général, faciès, signes vitaux généraux...',
    },
    ...(isFemale
      ? [
          {
            key: 'examen_gynecologique' as keyof ExamenPhysiqueData,
            label: 'Examen Gynécologique',
            placeholder: 'Examen pelvien, col utérin, annexes...',
          },
        ]
      : []),
    {
      key: 'autres_observations' as keyof ExamenPhysiqueData,
      label: 'Autres Observations',
      placeholder: 'Observations complémentaires...',
    },
  ];

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <LocalHospital color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" gutterBottom>
              Examen Physique
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Renseignez les différentes zones d'examen
            </Typography>
          </Box>
        </Box>

        {!isSupported && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            La dictée vocale n'est pas supportée par votre navigateur. Veuillez utiliser Chrome, Edge ou Safari.
          </Alert>
        )}

        {speechError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
            {speechError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {zones.map((zone) => {
            const isFieldActive = activeField === zone.key && isListening;
            return (
              <Grid item xs={12} md={6} key={zone.key}>
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label={zone.label}
                    value={data[zone.key] || ''}
                    onChange={(e) => handleChange(zone.key, e.target.value)}
                    placeholder={zone.placeholder}
                    InputProps={{
                      endAdornment: isSupported && (
                        <Tooltip
                          title={
                            isFieldActive
                              ? 'Arrêter la dictée vocale'
                              : 'Démarrer la dictée vocale pour ce champ'
                          }
                        >
                          <IconButton
                            onClick={() => handleStartDictation(zone.key)}
                            color={isFieldActive ? 'error' : 'primary'}
                            size="small"
                            sx={{ position: 'absolute', right: 8, top: 8 }}
                          >
                            {isFieldActive ? <Stop /> : <Mic />}
                          </IconButton>
                        </Tooltip>
                      ),
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        paddingRight: isSupported ? '50px' : 1,
                      },
                    }}
                  />
                  {isFieldActive && (
                    <Chip
                      label="Dictée en cours..."
                      color="error"
                      size="small"
                      icon={<MicOff />}
                      sx={{ mt: 1 }}
                      onDelete={() => {
                        stopListening();
                        setActiveField(null);
                        resetTranscript();
                      }}
                    />
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

