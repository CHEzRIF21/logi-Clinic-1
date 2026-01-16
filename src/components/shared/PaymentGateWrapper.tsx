import React, { useState, useEffect } from 'react';
import { Box, Alert, Button, CircularProgress } from '@mui/material';
import { Payment, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PaymentNotification } from './PaymentNotification';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';
import { ConsultationBillingService } from '../../services/consultationBillingService';

interface PaymentGateWrapperProps {
  consultationId: string | null;
  patientId?: string;
  moduleName: string;
  children: React.ReactNode;
  showNotification?: boolean;
  onPaymentConfirmed?: () => void;
}

/**
 * Composant wrapper qui bloque l'accès à un module si le paiement n'est pas effectué
 * Affiche des notifications claires et permet la redirection vers la Caisse
 */
export const PaymentGateWrapper: React.FC<PaymentGateWrapperProps> = ({
  consultationId,
  patientId,
  moduleName,
  children,
  showNotification = true,
  onPaymentConfirmed,
}) => {
  const navigate = useNavigate();
  const { paymentStatus, loading } = usePaymentStatus(consultationId);
  const [showBlockingMessage, setShowBlockingMessage] = useState(false);

  useEffect(() => {
    if (paymentStatus && !paymentStatus.canAccess && !paymentStatus.isPaid) {
      setShowBlockingMessage(true);
    } else {
      setShowBlockingMessage(false);
    }
  }, [paymentStatus]);

  if (!consultationId) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (!paymentStatus) {
    return <>{children}</>;
  }

  // Si le paiement est effectué, afficher le contenu normalement
  if (paymentStatus.canAccess && paymentStatus.isPaid) {
    return (
      <>
        {showNotification && (
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
            <PaymentNotification
              consultationId={consultationId}
              patientId={patientId}
              onPaymentConfirmed={onPaymentConfirmed}
              showNotification={false}
            />
          </Box>
        )}
        {children}
      </>
    );
  }

  // Si le paiement n'est pas effectué, bloquer l'accès
  return (
    <Box sx={{ p: 3 }}>
      <Alert
        severity="warning"
        icon={<Payment />}
        sx={{ mb: 2 }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => navigate('/caisse', { state: { consultationId, factureId: paymentStatus.factureId } })}
          >
            Aller à la Caisse
          </Button>
        }
      >
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <strong>Paiement requis pour accéder au module {moduleName}</strong>
            <PaymentStatusBadge
              status={paymentStatus.status}
              montantRestant={paymentStatus.montantRestant}
              showAmount={true}
            />
          </Box>
          <Box component="p" sx={{ m: 0, mt: 1 }}>
            {paymentStatus.message}
            {paymentStatus.montantRestant > 0 && (
              <> Montant restant à payer : <strong>{paymentStatus.montantRestant.toLocaleString()} XOF</strong></>
            )}
          </Box>
        </Box>
      </Alert>

      {showNotification && (
        <Box sx={{ mt: 2 }}>
          <PaymentNotification
            consultationId={consultationId}
            patientId={patientId}
            onPaymentConfirmed={() => {
              setShowBlockingMessage(false);
              onPaymentConfirmed?.();
            }}
            showNotification={true}
          />
        </Box>
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        <Box>
          <strong>Instructions :</strong>
          <ol style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
            <li>Le patient doit effectuer le paiement à la Caisse</li>
            <li>Une fois le paiement confirmé, cette page se mettra à jour automatiquement</li>
            <li>Vous pourrez alors accéder au module {moduleName}</li>
          </ol>
        </Box>
      </Alert>
    </Box>
  );
};
