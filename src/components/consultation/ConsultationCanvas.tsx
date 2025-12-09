import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
} from '@mui/material';
import { ConsultationTemplate } from '../../services/consultationApiService';
import { TagList, Tag } from './TagList';
import { EditorRichText } from './EditorRichText';

interface ConsultationCanvasProps {
  template: ConsultationTemplate | null;
  data: {
    motifs?: string[];
    anamnese?: string;
    examens_cliniques?: any;
    diagnostics?: string[];
    traitement_en_cours?: string;
    notes?: string;
  };
  onDataChange: (section: string, value: any) => void;
  readOnly?: boolean;
}

export const ConsultationCanvas: React.FC<ConsultationCanvasProps> = ({
  template,
  data,
  onDataChange,
  readOnly = false,
}) => {
  // Convertir les motifs en Tags
  const motifsTags: Tag[] = (data.motifs || []).map((motif, idx) => ({
    id: `motif-${idx}`,
    label: motif,
    color: 'primary',
  }));

  const diagnosticsTags: Tag[] = (data.diagnostics || []).map((diag, idx) => ({
    id: `diag-${idx}`,
    label: diag,
    color: 'success',
  }));

  const handleMotifsChange = (tags: Tag[]) => {
    onDataChange('motifs', tags.map((t) => t.label));
  };

  const handleDiagnosticsChange = (tags: Tag[]) => {
    onDataChange('diagnostics', tags.map((t) => t.label));
  };

  // Rendre les sections selon le template
  const renderSection = (sectionName: string) => {
    switch (sectionName.toLowerCase()) {
      case 'motifs':
        return (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <TagList
                tags={motifsTags}
                onTagsChange={handleMotifsChange}
                label="Motifs de consultation"
                placeholder="Ajouter un motif..."
                allowCreate={!readOnly}
                editable={!readOnly}
                color="primary"
              />
            </CardContent>
          </Card>
        );

      case 'anamnese':
        return (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <EditorRichText
                value={data.anamnese || ''}
                onChange={(value) => onDataChange('anamnese', value)}
                label="Anamnèse"
                placeholder="Décrire l'anamnèse du patient..."
                minRows={6}
                fullWidth
              />
            </CardContent>
          </Card>
        );

      case 'examens_cliniques':
        return (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Examens cliniques
              </Typography>
              <EditorRichText
                value={
                  typeof data.examens_cliniques === 'string'
                    ? data.examens_cliniques
                    : JSON.stringify(data.examens_cliniques || {}, null, 2)
                }
                onChange={(value) => onDataChange('examens_cliniques', value)}
                placeholder="Décrire les examens cliniques..."
                minRows={4}
                fullWidth
              />
            </CardContent>
          </Card>
        );

      case 'diagnostics':
        return (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <TagList
                tags={diagnosticsTags}
                onTagsChange={handleDiagnosticsChange}
                label="Diagnostics"
                placeholder="Ajouter un diagnostic..."
                allowCreate={!readOnly}
                editable={!readOnly}
                color="success"
              />
            </CardContent>
          </Card>
        );

      case 'traitement':
      case 'traitement_en_cours':
        return (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <EditorRichText
                value={data.traitement_en_cours || ''}
                onChange={(value) => onDataChange('traitement_en_cours', value)}
                label="Traitement en cours"
                placeholder="Décrire le traitement en cours..."
                minRows={3}
                fullWidth
              />
            </CardContent>
          </Card>
        );

      case 'notes':
        return (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <EditorRichText
                value={data.notes || ''}
                onChange={(value) => onDataChange('notes', value)}
                label="Notes et plan de prise en charge"
                placeholder="Ajouter des notes ou un plan de prise en charge..."
                minRows={4}
                fullWidth
              />
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // Si pas de template, afficher les sections par défaut
  const sectionsToRender = template?.sections || [
    'motifs',
    'anamnese',
    'examens_cliniques',
    'diagnostics',
    'traitement_en_cours',
    'notes',
  ];

  return (
    <Box>
      {template && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Template: {template.nom}
          </Typography>
          {template.description && (
            <Typography variant="body2" color="text.secondary">
              {template.description}
            </Typography>
          )}
          <Divider sx={{ my: 2 }} />
        </Box>
      )}

      {sectionsToRender.map((section, index) => (
        <Box key={section || index}>
          {renderSection(section)}
        </Box>
      ))}
    </Box>
  );
};

