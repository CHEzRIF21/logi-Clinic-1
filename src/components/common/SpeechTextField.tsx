import React, { useEffect, useState } from 'react';
import {
  TextField,
  TextFieldProps,
  InputAdornment,
  IconButton,
  Tooltip,
  Box,
  CircularProgress,
} from '@mui/material';
import { Mic, MicOff, Stop } from '@mui/icons-material';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface SpeechTextFieldProps extends Omit<TextFieldProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  enableSpeech?: boolean;
  language?: string;
}

export const SpeechTextField: React.FC<SpeechTextFieldProps> = ({
  value,
  onChange,
  enableSpeech = true,
  language = 'fr-FR',
  ...textFieldProps
}) => {
  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition(language, true, true);

  const [isProcessing, setIsProcessing] = useState(false);

  // Mettre à jour la valeur avec la transcription
  useEffect(() => {
    if (transcript && isListening) {
      const currentValue = value || '';
      const newValue = currentValue ? `${currentValue} ${transcript.trim()}` : transcript.trim();
      onChange(newValue);
      resetTranscript();
    }
  }, [transcript, isListening, value, onChange, resetTranscript]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      setIsProcessing(false);
    } else {
      resetTranscript();
      startListening();
      setIsProcessing(true);
    }
  };

  const renderEndAdornment = () => {
    if (!enableSpeech || !isSupported) {
      return textFieldProps.InputProps?.endAdornment;
    }

    return (
      <InputAdornment position="end">
        {speechError && (
          <Tooltip title={speechError} arrow>
            <Box sx={{ color: 'error.main', mr: 1 }}>
              <MicOff fontSize="small" />
            </Box>
          </Tooltip>
        )}
        <Tooltip title={isListening ? 'Arrêter la dictée' : 'Démarrer la dictée'} arrow>
          <IconButton
            onClick={handleMicClick}
            color={isListening ? 'error' : 'default'}
            size="small"
            edge="end"
          >
            {isProcessing && !isListening ? (
              <CircularProgress size={20} />
            ) : isListening ? (
              <Stop />
            ) : (
              <Mic />
            )}
          </IconButton>
        </Tooltip>
        {textFieldProps.InputProps?.endAdornment}
      </InputAdornment>
    );
  };

  return (
    <TextField
      {...textFieldProps}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        ...textFieldProps.InputProps,
        endAdornment: renderEndAdornment(),
      }}
      error={!!(textFieldProps.error || speechError)}
      helperText={speechError || textFieldProps.helperText}
    />
  );
};

