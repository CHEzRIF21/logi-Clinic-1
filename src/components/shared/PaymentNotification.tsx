import React, { useEffect } from 'react';
import { Alert, Snackbar, Box, Typography, Button } from '@mui/material';
import { CheckCircle, Payment, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';
import { PaymentStatusBadge } from './PaymentStatusBadge';

interface PaymentNotificationProps {
  consultationId: string | null;
  patientId?: string;
  onPaymentConfirmed?: () => void;
  showNotification?: boolean;
}

/**
 * Composant de notification qui affiche le statut de paiement
 * et notifie l'utilisateur quand le paiement est effectué
 */
export const PaymentNotification: React.FC<PaymentNotificationProps> = ({
  consultationId,
  patientId,
  onPaymentConfirmed,
  showNotification = true,
}) => {
  const navigate = useNavigate();
  const { paymentStatus, loading } = usePaymentStatus(consultationId);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [previousStatus, setPreviousStatus] = React.useState<string | null>(null);

  useEffect(() => {
    if (!paymentStatus) return;

    // Détecter quand le statut passe de "en_attente" à "paye"
    if (
      previousStatus === 'en_attente' &&
      paymentStatus.status === 'paye' &&
      paymentStatus.isPaid
    ) {
      // Afficher la notification de succès
      if (showNotification) {
        setSnackbarOpen(true);
      }
      
      // Appeler le callback
      onPaymentConfirmed?.();
    }

    setPreviousStatus(paymentStatus.status);
  }, [paymentStatus?.status, previousStatus, showNotification, onPaymentConfirmed]);

  if (!consultationId || loading || !paymentStatus) {
    return null;
  }

  const handleGoToConsultation = () => {
    navigate(`/consultations/${consultationId}`);
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Alert
          severity={paymentStatus.isPaid ? 'success' : 'warning'}
          icon={paymentStatus.isPaid ? <CheckCircle /> : <Payment />}
          action={
            paymentStatus.isPaid ? (
              <Button
                color="inherit"
                size="small"
                endIcon={<ArrowForward />}
                onClick={handleGoToConsultation}
              >
                Accéder à la consultation
              </Button>
            ) : (
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate('/caisse', { state: { consultationId, factureId: paymentStatus.factureId } })}
              >
                Aller à la Caisse
              </Button>
            )
          }
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">
              <strong>Statut de paiement:</strong>
            </Typography>
            <PaymentStatusBadge
              status={paymentStatus.status}
              montantRestant={paymentStatus.montantRestant}
              showAmount={!paymentStatus.isPaid}
            />
            {paymentStatus.isPaid && (
              <Typography variant="body2" color="success.main" fontWeight="bold">
                ✓ Accès autorisé
              </Typography>
            )}
          </Box>
        </Alert>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
          icon={<CheckCircle />}
        >
          <Typography variant="h6" gutterBottom>
            Paiement confirmé !
          </Typography>
          <Typography variant="body2">
            Le paiement a été effectué avec succès. Vous pouvez maintenant accéder à la consultation.
          </Typography>
          <Button
            variant="contained"
            size="small"
            sx={{ mt: 1 }}
            onClick={() => {
              setSnackbarOpen(false);
              handleGoToConsultation();
            }}
          >
            Accéder à la consultation
          </Button>
        </Alert>
      </Snackbar>
    </>
  );
};
