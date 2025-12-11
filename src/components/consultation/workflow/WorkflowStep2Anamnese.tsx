import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { History, InsertDriveFile, Mic, Stop } from '@mui/icons-material';
import { EditorRichText } from '../EditorRichText';
import { AnamneseTemplateService } from '../../../services/anamneseTemplateService';
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
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(false);

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
    loadTemplates();
  }, []);

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

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await AnamneseTemplateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    if (!templateId) return;
    
    try {
      const template = await AnamneseTemplateService.getTemplateById(templateId);
      setAnamneseText(template.contenu);
      setSelectedTemplateId(templateId);
    } catch (error) {
      console.error('Erreur lors du chargement du template:', error);
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
          Décrivez l'histoire narrative de la maladie. Vous pouvez utiliser des modèles de texte pour accélérer la saisie.
        </Alert>

        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Modèles de texte</InputLabel>
            <Select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              label="Modèles de texte"
              startAdornment={<InsertDriveFile />}
            >
              <MenuItem value="">
                <em>Aucun modèle</em>
              </MenuItem>
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.nom} {template.categorie && `(${template.categorie})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

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

