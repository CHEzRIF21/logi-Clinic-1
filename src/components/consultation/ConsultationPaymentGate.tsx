import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Lock,
  Payment,
  LocalHospital,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ConsultationBillingService } from '../../services/consultationBillingService';
import { ConfigurationService } from '../../services/configurationService';
import { apiPost } from '../../services/apiClient';

interface ConsultationPaymentGateProps {
  consultationId: string;
  onAuthorized?: () => void;
  onBlocked?: () => void;
}

interface PaymentStatus {
  canAccess: boolean;
  reason: string;
  statutPaiement?: string;
  factureId?: string;
  montantRestant?: number;
}

export const ConsultationPaymentGate: React.FC<ConsultationPaymentGateProps> = ({
  consultationId,
  onAuthorized,
  onBlocked,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [requestingEmergency, setRequestingEmergency] = useState(false);

  useEffect(() => {
    checkPaymentStatus();
  }, [consultationId]);

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      
      // Vérifier d'abord si le paiement est obligatoire pour cette clinique
      const paymentRequired = await ConfigurationService.isPaymentRequiredBeforeConsultation();
      
      if (!paymentRequired) {
        // Si paiement non obligatoire, autoriser directement l'accès
        setPaymentStatus({
          canAccess: true,
          reason: 'Paiement non obligatoire pour cette clinique',
        });
        onAuthorized?.();
        return;
      }

      // Si paiement obligatoire, vérifier le statut
      const status = await ConsultationBillingService.canAccessConsultation(consultationId);
      setPaymentStatus(status);

      if (status.canAccess) {
        onAuthorized?.();
      } else {
        onBlocked?.();
      }
    } catch (error) {
      console.error('Erreur vérification statut paiement:', error);
      // En cas d'erreur, vérifier si le paiement est obligatoire
      try {
        const paymentRequired = await ConfigurationService.isPaymentRequiredBeforeConsultation();
        if (!paymentRequired) {
          // Si paiement non obligatoire, autoriser l'accès
          setPaymentStatus({
            canAccess: true,
            reason: 'Paiement non obligatoire pour cette clinique',
          });
          onAuthorized?.();
        } else {
          // Si paiement obligatoire mais erreur, bloquer par sécurité
          setPaymentStatus({
            canAccess: false,
            reason: 'Erreur lors de la vérification du paiement - Accès bloqué par sécurité',
          });
          onBlocked?.();
        }
      } catch (checkError) {
        // En cas d'erreur totale, autoriser l'accès pour ne pas bloquer
        setPaymentStatus({
          canAccess: true,
          reason: 'Erreur lors de la vérification - Accès autorisé',
        });
        onAuthorized?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToCashier = () => {
    navigate('/caisse', { state: { consultationId, factureId: paymentStatus?.factureId } });
  };

  const handleRequestEmergency = async () => {
    if (!emergencyReason.trim()) {
      alert('Veuillez indiquer la raison de l\'urgence');
      return;
    }

    try {
      setRequestingEmergency(true);
      await apiPost(`/consultations/${consultationId}/authorize-emergency`, {
        reason: emergencyReason,
      });

      // Re-vérifier le statut
      await checkPaymentStatus();
      setEmergencyDialogOpen(false);
      setEmergencyReason('');
    } catch (error: any) {
      console.error('Erreur autorisation urgence:', error);
      alert(error.message || 'Erreur lors de la demande d\'autorisation d\'urgence');
    } finally {
      setRequestingEmergency(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!paymentStatus) {
    return null;
  }

  // Si l'accès est autorisé, ne rien afficher
  if (paymentStatus.canAccess) {
    return null;
  }

  // Afficher le blocage
  return (
    <>
      <Card sx={{ mb: 3, border: '2px solid', borderColor: 'error.main' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Lock color="error" sx={{ fontSize: 40 }} />
            <Typography variant="h5" color="error">
              Consultation Bloquée
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              {paymentStatus.reason}
            </Typography>
            {paymentStatus.montantRestant && paymentStatus.montantRestant > 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Montant restant à payer: {paymentStatus.montantRestant.toLocaleString('fr-FR')} FCFA
              </Typography>
            )}
          </Alert>

          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              startIcon={<Payment />}
              onClick={handleGoToCashier}
              size="large"
            >
              Aller à la Caisse
            </Button>

            {paymentStatus.statutPaiement === 'en_attente' && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<LocalHospital />}
                onClick={() => setEmergencyDialogOpen(true)}
                size="large"
              >
                Demander Autorisation Urgence
              </Button>
            )}
          </Box>

          <Box mt={3}>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> Le paiement de la consultation est obligatoire avant d'accéder au dossier médical.
              En cas d'urgence médicale, vous pouvez demander une autorisation exceptionnelle.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog pour demande d'autorisation urgence */}
      <Dialog
        open={emergencyDialogOpen}
        onClose={() => !requestingEmergency && setEmergencyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <LocalHospital color="warning" />
            Demande d'Autorisation Urgence
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Veuillez indiquer la raison médicale justifiant l'autorisation d'accès sans paiement préalable.
            Cette demande sera soumise à validation.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Raison de l'urgence"
            value={emergencyReason}
            onChange={(e) => setEmergencyReason(e.target.value)}
            placeholder="Ex: Patient en détresse respiratoire, nécessite prise en charge immédiate..."
            disabled={requestingEmergency}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEmergencyDialogOpen(false)}
            disabled={requestingEmergency}
          >
            Annuler
          </Button>
          <Button
            onClick={handleRequestEmergency}
            variant="contained"
            color="warning"
            disabled={requestingEmergency || !emergencyReason.trim()}
            startIcon={requestingEmergency ? <CircularProgress size={20} /> : <LocalHospital />}
          >
            {requestingEmergency ? 'Envoi...' : 'Envoyer la Demande'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

