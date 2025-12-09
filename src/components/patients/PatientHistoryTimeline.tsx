import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { History, PictureAsPdf } from '@mui/icons-material';
import { Patient } from '../../services/supabase';
import {
  PatientConsultationHistoryEntry,
  PatientHistoryService,
} from '../../services/patientHistoryService';

interface PatientHistoryTimelineProps {
  patient: Patient;
}

export const PatientHistoryTimeline: React.FC<PatientHistoryTimelineProps> = ({ patient }) => {
  const [history, setHistory] = useState<PatientConsultationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory().catch(console.error);
  }, [patient.id]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PatientHistoryService.getConsultationHistory(patient.id);
      setHistory(data);
    } catch (err: any) {
      console.error('Erreur chargement historique patient:', err);
      setError(err?.message || 'Impossible de charger l’historique');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    try {
      const html = PatientHistoryService.buildPrintableHtml(patient, history);
      const printWindow = window.open('', '_blank', 'width=1024,height=768');
      if (!printWindow) {
        alert('Veuillez autoriser les pop-ups pour exporter en PDF.');
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Impossible de générer le PDF');
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <History color="primary" />
            <Typography variant="h6">Historique des consultations</Typography>
            <Chip label={history.length} size="small" />
          </Box>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={handleExportPdf}
            disabled={history.length === 0}
          >
            Exporter PDF
          </Button>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && history.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Aucune consultation enregistrée pour ce patient.
          </Typography>
        )}

        {!loading &&
          !error &&
          history.map((entry, index) => {
            const consultationDate = new Date(entry.consultation.started_at);
            return (
              <Box key={entry.consultation.id} mb={index === history.length - 1 ? 0 : 2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {consultationDate.toLocaleDateString('fr-FR')} —{' '}
                      {consultationDate.toLocaleTimeString('fr-FR')}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {entry.consultation.type}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                      {(entry.consultation.motifs || []).map((motif, idx) => (
                        <Chip key={`${entry.consultation.id}-motif-${idx}`} label={motif} size="small" />
                      ))}
                      {(entry.consultation.diagnostics || []).map((diag, idx) => (
                        <Chip
                          key={`${entry.consultation.id}-diag-${idx}`}
                          label={diag}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle2">Prescriptions</Typography>
                    {entry.prescriptions.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Aucune prescription
                      </Typography>
                    ) : (
                      entry.prescriptions.map((prescription) => (
                        <Typography key={prescription.id} variant="body2">
                          {prescription.lines?.map((line) => line.nom_medicament).join(', ') || '-'}
                        </Typography>
                      ))
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2">Examens</Typography>
                    {entry.labRequests.length === 0 && entry.imagingRequests.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Aucun examen
                      </Typography>
                    ) : (
                      <>
                        {entry.labRequests.map((req) => (
                          <Typography key={req.id} variant="body2">
                            Labo: {(req.tests || []).map((test: any) => test?.nom || test?.code).join(', ')}
                          </Typography>
                        ))}
                        {entry.imagingRequests.map((req) => (
                          <Typography key={req.id} variant="body2">
                            Imagerie: {(req.examens || []).map((exam: any) => exam?.nom || exam?.code).join(', ')}
                          </Typography>
                        ))}
                      </>
                    )}
                  </Box>
                </Stack>
                {index < history.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            );
          })}
      </CardContent>
    </Card>
  );
};

export default PatientHistoryTimeline;

