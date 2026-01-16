import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { PaymentStatusBadge, PaymentStatus } from './PaymentStatusBadge';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';

interface PaymentStatusCellProps {
  consultationId: string | null;
  showAmount?: boolean;
  size?: 'small' | 'medium';
  compact?: boolean;
}

/**
 * Composant pour afficher le statut de paiement dans un tableau
 * Utilise le hook usePaymentStatus pour récupérer le statut en temps réel
 */
export const PaymentStatusCell: React.FC<PaymentStatusCellProps> = ({
  consultationId,
  showAmount = false,
  size = 'small',
  compact = false,
}) => {
  const { paymentStatus, loading } = usePaymentStatus(consultationId);

  if (!consultationId) {
    return <Box>-</Box>;
  }

  if (loading) {
    return <Box>-</Box>;
  }

  if (!paymentStatus) {
    return <Box>-</Box>;
  }

  return (
    <Box>
      <PaymentStatusBadge
        status={paymentStatus.status}
        montantRestant={paymentStatus.montantRestant}
        showAmount={showAmount && paymentStatus.montantRestant > 0}
        size={size}
      />
    </Box>
  );
};
