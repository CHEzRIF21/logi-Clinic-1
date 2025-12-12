import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar
} from '@mui/material';
import { CheckCircle, CalendarToday } from '@mui/icons-material';
import { Consultation, ConsultationService } from '../../../services/consultationService';
import { ConsultationIntegrationService } from '../../../services/consultationIntegrationService';

interface WorkflowStep11ClotureProps {
  consultation: Consultation;
  onClose: () => Promise<void>;
  userId: string;
}

export const WorkflowStep11Cloture: React.FC<WorkflowStep11ClotureProps> = ({
  consultation,
  onClose,
  userId
}) => {
  const [prochaineConsultation, setProchaineConsultation] = useState<string>('');
  const [motifSuivi, setMotifSuivi] = useState<string>('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCloture = async () => {
    try {
      setLoading(true);
      
      // Mettre à jour la consultation avec la date de prochaine consultation si fournie
      if (prochaineConsultation) {
        await ConsultationService.updateConsultation(
          consultation.id,
          { prochaine_consultation: prochaineConsultation } as any,
          userId,
          'prochaine_consultation'
        );
      }

      // Utiliser le service d'intégration pour clôturer avec toutes les intégrations
      const result = await ConsultationIntegrationService.closeConsultationWithIntegrations(
        consultation.id,
        consultation.patient_id,
        userId
      );

      if (result.success) {
        setSnackbar({
          open: true,
          message: `Consultation clôturée avec succès. ${result.messages.join(', ')}`,
          severity: 'success'
        });
        
        // Attendre un peu avant de fermer pour que l'utilisateur voie le message
        setTimeout(async () => {
          await onClose();
        }, 2000);
      } else {
        setSnackbar({
          open: true,
          message: result.messages.join(', ') || 'Erreur lors de la clôture',
          severity: 'error'
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la clôture:', error);
      setSnackbar({
        open: true,
        message: error?.message || 'Erreur lors de la clôture de la consultation',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CheckCircle color="primary" />
          <Typography variant="h6">
            Étape 11 — Rendez-vous (RDV) & Clôture
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          Planifiez le rendez-vous de suivi et clôturez la consultation. Une fois clôturée, la fiche sera verrouillée et envoyée à l'historique.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Date de retour souhaitée"
            value={prochaineConsultation}
            onChange={(e) => setProchaineConsultation(e.target.value)}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Motif du suivi"
            value={motifSuivi}
            onChange={(e) => setMotifSuivi(e.target.value)}
            placeholder="Décrivez le motif du rendez-vous de suivi..."
          />

          <Alert severity="warning">
            Une fois la consultation clôturée, elle ne pourra plus être modifiée.
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => onClose()}>
              Annuler
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircle />}
              onClick={() => setConfirmDialogOpen(true)}
              disabled={loading}
            >
              Clôturer la consultation
            </Button>
          </Box>
        </Box>

        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
          <DialogTitle>Confirmer la clôture</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Êtes-vous sûr de vouloir clôturer cette consultation ? Cette action est irréversible.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCloture} variant="contained" color="primary" disabled={loading}>
              Confirmer
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

