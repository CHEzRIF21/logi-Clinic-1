import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  Divider,
} from '@mui/material';
import {
  History,
  ExpandMore,
  ExpandLess,
  Note,
  Person,
  Schedule,
} from '@mui/icons-material';
import { ConsultationEntry } from '../../services/consultationApiService';
import { format } from 'date-fns';

interface ConsultationHistoryProps {
  consultationId: string;
  onLoadHistory: () => Promise<ConsultationEntry[]>;
}

const SECTION_LABELS: Record<string, string> = {
  constantes: 'Constantes',
  anamnese: 'Anamnèse',
  examens_cliniques: 'Examens cliniques',
  diagnostics: 'Diagnostics',
  protocols: 'Protocoles',
  prescriptions: 'Prescriptions',
  lab_requests: 'Demandes laboratoire',
  imaging_requests: 'Demandes imagerie',
  consultation: 'Consultation',
};

const ACTION_COLORS: Record<string, 'primary' | 'success' | 'error'> = {
  CREATE: 'success',
  UPDATE: 'primary',
  DELETE: 'error',
};

export const ConsultationHistory: React.FC<ConsultationHistoryProps> = ({
  consultationId,
  onLoadHistory,
}) => {
  const [history, setHistory] = useState<ConsultationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ConsultationEntry | null>(null);
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false);
  const [annotation, setAnnotation] = useState('');

  useEffect(() => {
    loadHistory();
  }, [consultationId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const entries = await onLoadHistory();
      setHistory(entries);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnotation = (entry: ConsultationEntry) => {
    setSelectedEntry(entry);
    setAnnotation(entry.annotation || '');
    setAnnotationDialogOpen(true);
  };

  const handleSaveAnnotation = async () => {
    // TODO: Implémenter la sauvegarde de l'annotation
    // await ConsultationService.updateConsultationEntry(selectedEntry.id, { annotation });
    setAnnotationDialogOpen(false);
    loadHistory();
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <History />
            <Typography variant="h6" fontWeight="bold">
              Historique & Versioning
            </Typography>
            <Chip label={history.length} size="small" color="primary" />
          </Box>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          {loading ? (
            <Typography variant="body2" color="text.secondary">
              Chargement de l'historique...
            </Typography>
          ) : history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucun historique disponible
            </Typography>
          ) : (
            <Stepper orientation="vertical">
              {history.map((entry, index) => (
                <Step key={entry.id} active={index === 0} completed={index > 0}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar
                        sx={{
                          bgcolor: ACTION_COLORS[entry.action] === 'success' ? 'success.main' :
                                   ACTION_COLORS[entry.action] === 'primary' ? 'primary.main' :
                                   ACTION_COLORS[entry.action] === 'error' ? 'error.main' : 'grey.400',
                          width: 32,
                          height: 32,
                        }}
                      >
                        {entry.action === 'CREATE' ? '✓' : entry.action === 'UPDATE' ? '↻' : '✗'}
                      </Avatar>
                    )}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={SECTION_LABELS[entry.section] || entry.section}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={entry.action}
                          size="small"
                          color={ACTION_COLORS[entry.action] || 'default'}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}
                      </Typography>
                    </Box>
                  </StepLabel>
                  <StepContent>
                    <Box>
                      <Box display="flex" justifyContent="flex-end" mb={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleAddAnnotation(entry)}
                          title="Ajouter une annotation"
                        >
                          <Note fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box
                        sx={{
                          bgcolor: 'background.default',
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(entry.data, null, 2)}
                        </Typography>
                      </Box>

                      {entry.annotation && (
                        <Box mt={1} sx={{ bgcolor: 'info.light', p: 1, borderRadius: 1 }}>
                          <Typography variant="caption" fontWeight="bold">
                            Annotation:
                          </Typography>
                          <Typography variant="body2">{entry.annotation}</Typography>
                        </Box>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          )}
        </Collapse>
      </CardContent>

      {/* Dialog pour ajouter une annotation */}
      <Dialog open={annotationDialogOpen} onClose={() => setAnnotationDialogOpen(false)}>
        <DialogTitle>Ajouter une annotation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Annotation"
            value={annotation}
            onChange={(e) => setAnnotation(e.target.value)}
            placeholder="Ajouter une note sur cette modification..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnnotationDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveAnnotation}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

