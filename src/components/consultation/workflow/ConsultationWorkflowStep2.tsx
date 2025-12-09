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
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import { Consultation, ConsultationTemplate } from '../../../services/consultationApiService';
import { ConsultationApiService } from '../../../services/consultationApiService';

interface ConsultationWorkflowStep2Props {
  consultation: Consultation;
  onTemplateSelect: (templateId: string) => void;
}

export const ConsultationWorkflowStep2: React.FC<ConsultationWorkflowStep2Props> = ({
  consultation,
  onTemplateSelect,
}) => {
  const [templates, setTemplates] = useState<ConsultationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(consultation.template_id || '');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await ConsultationApiService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    onTemplateSelect(templateId);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Étape 2 — Démarrage d'une Nouvelle Consultation
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          Consultation ouverte le {new Date(consultation.started_at).toLocaleString('fr-FR')}
        </Alert>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Type de consultation / Fiche</InputLabel>
          <Select
            value={consultation.type}
            label="Type de consultation / Fiche"
            disabled
          >
            <MenuItem value={consultation.type}>{consultation.type}</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Template de fiche (optionnel)</InputLabel>
          <Select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            label="Template de fiche (optionnel)"
          >
            <MenuItem value="">Aucun template</MenuItem>
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.nom} ({template.specialite})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedTemplate && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Fiches disponibles:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip label="Fiche Standard" color="primary" />
              <Chip label="Gynéco" />
              <Chip label="CPN" />
              <Chip label="Pédiatrie" />
              <Chip label="Dermatologie" />
              <Chip label="Ophtalmologie" />
              <Chip label="Urologie" />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

