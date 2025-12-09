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
  Divider
} from '@mui/material';
import { History, InsertDriveFile } from '@mui/icons-material';
import { EditorRichText } from '../EditorRichText';
import { AnamneseTemplateService } from '../../../services/anamneseTemplateService';

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

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    onAnamneseChange({ texte: anamneseText, updated_at: new Date().toISOString() });
  }, [anamneseText, onAnamneseChange]);

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
          <EditorRichText
            value={anamneseText}
            onChange={setAnamneseText}
            label="Anamnèse"
            placeholder="Décrivez l'histoire de la maladie, les symptômes, l'évolution..."
            minRows={8}
            fullWidth
          />
        </Box>
      </CardContent>
    </Card>
  );
};

