import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Toolbar,
  IconButton,
  Typography,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Undo,
  Redo,
  Mic,
  Stop,
} from '@mui/icons-material';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface EditorRichTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  minRows?: number;
  maxRows?: number;
  fullWidth?: boolean;
  enableSpeech?: boolean;
}

export const EditorRichText: React.FC<EditorRichTextProps> = ({
  value,
  onChange,
  placeholder = 'Saisir le texte...',
  label,
  minRows = 4,
  maxRows,
  fullWidth = true,
  enableSpeech = true,
}) => {
  const textFieldRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

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

  // Mettre à jour avec la transcription vocale
  useEffect(() => {
    if (transcript && isListening && enableSpeech) {
      const currentValue = value || '';
      const newValue = currentValue ? `${currentValue} ${transcript.trim()}` : transcript.trim();
      onChange(newValue);
      resetTranscript();
    }
  }, [transcript, isListening, value, onChange, resetTranscript, enableSpeech]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    textFieldRef.current?.focus();
    updateHistory();
  };

  const updateHistory = () => {
    if (textFieldRef.current) {
      const newValue = textFieldRef.current.value;
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newValue);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  return (
    <Box>
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      
      <Paper variant="outlined" sx={{ borderRadius: 1 }}>
        {/* Toolbar */}
        <Toolbar
          variant="dense"
          sx={{
            minHeight: 40,
            bgcolor: 'grey.50',
            borderBottom: 1,
            borderColor: 'divider',
            gap: 0.5,
            flexWrap: 'wrap',
          }}
        >
          <IconButton
            size="small"
            onClick={() => executeCommand('bold')}
            title="Gras"
          >
            <FormatBold fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => executeCommand('italic')}
            title="Italique"
          >
            <FormatItalic fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => executeCommand('underline')}
            title="Souligné"
          >
            <FormatUnderlined fontSize="small" />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <IconButton
            size="small"
            onClick={() => executeCommand('insertUnorderedList')}
            title="Liste à puces"
          >
            <FormatListBulleted fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => executeCommand('insertOrderedList')}
            title="Liste numérotée"
          >
            <FormatListNumbered fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => executeCommand('formatBlock', 'blockquote')}
            title="Citation"
          >
            <FormatQuote fontSize="small" />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <IconButton
            size="small"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            title="Annuler"
          >
            <Undo fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            title="Refaire"
          >
            <Redo fontSize="small" />
          </IconButton>

          {enableSpeech && isSupported && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <Tooltip title={isListening ? 'Arrêter la dictée' : 'Démarrer la dictée'}>
                <IconButton
                  size="small"
                  onClick={handleMicClick}
                  color={isListening ? 'error' : 'default'}
                  title={isListening ? 'Arrêter la dictée' : 'Démarrer la dictée'}
                >
                  {isListening ? <Stop fontSize="small" /> : <Mic fontSize="small" />}
                </IconButton>
              </Tooltip>
            </>
          )}
        </Toolbar>

        {/* Textarea */}
        <TextField
          inputRef={textFieldRef}
          fullWidth={fullWidth}
          multiline
          minRows={minRows}
          maxRows={maxRows}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            updateHistory();
          }}
          placeholder={placeholder}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              px: 2,
              py: 1.5,
              '& textarea': {
                resize: 'vertical',
              },
            },
          }}
        />
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {value.length} caractères
      </Typography>
    </Box>
  );
};

