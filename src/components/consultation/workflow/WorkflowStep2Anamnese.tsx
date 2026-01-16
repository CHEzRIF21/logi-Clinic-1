import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { History, Mic, Stop } from '@mui/icons-material';
import { EditorRichText } from '../EditorRichText';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';

interface WorkflowStep2AnamneseProps {
  anamnese: any;
  onAnamneseChange: (anamnese: any) => void;
}

export const WorkflowStep2Anamnese: React.FC<WorkflowStep2AnamneseProps> = ({
  anamnese,
  onAnamneseChange
}) => {
  const [anamneseText, setAnamneseText] = useState<string>(
    typeof anamnese === 'string' ? anamnese : anamnese?.texte || ''
  );

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

  useEffect(() => {
    onAnamneseChange({ texte: anamneseText, updated_at: new Date().toISOString() });
  }, [anamneseText, onAnamneseChange]);

  // Mettre à jour avec la transcription vocale
  useEffect(() => {
    if (transcript && isListening) {
      const currentValue = anamneseText || '';
      const newValue = currentValue ? `${currentValue} ${transcript.trim()}` : transcript.trim();
      setAnamneseText(newValue);
      resetTranscript();
    }
  }, [transcript, isListening, anamneseText, resetTranscript]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <History color="primary" />
          <Typography variant="h6">
            Étape 2 — Anamnèse (Histoire de la Maladie)
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          Décrivez l'histoire narrative de la maladie.
        </Alert>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Anamnèse
            </Typography>
            {isSupported && (
              <Tooltip title={isListening ? 'Arrêter la dictée' : 'Démarrer la dictée'}>
                <IconButton
                  onClick={handleMicClick}
                  color={isListening ? 'error' : 'primary'}
                  size="small"
                >
                  {isListening ? <Stop /> : <Mic />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {speechError && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {speechError}
            </Alert>
          )}
          <EditorRichText
            value={anamneseText}
            onChange={setAnamneseText}
            placeholder="Décrivez l'histoire de la maladie, les symptômes, l'évolution..."
            minRows={8}
            fullWidth
          />
        </Box>
      </CardContent>
    </Card>
  );
};

