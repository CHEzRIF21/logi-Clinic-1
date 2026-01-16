import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';
import {
  CheckCircle,
  Payment,
  Warning,
  Block,
} from '@mui/icons-material';

export type PaymentStatus = 'paye' | 'en_attente' | 'partiellement_payee' | 'non_facture' | 'exonere' | 'urgence_autorisee';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  montantRestant?: number;
  showAmount?: boolean;
  size?: 'small' | 'medium';
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  montantRestant = 0,
  showAmount = false,
  size = 'medium',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'paye':
        return {
          label: 'Payé',
          color: 'success' as const,
          icon: <CheckCircle fontSize="small" />,
          tooltip: 'Le paiement a été effectué avec succès',
        };
      case 'partiellement_payee':
        return {
          label: showAmount && montantRestant > 0 
            ? `Partiellement payé (${montantRestant.toLocaleString()} XOF restants)`
            : 'Partiellement payé',
          color: 'warning' as const,
          icon: <Payment fontSize="small" />,
          tooltip: `Paiement partiel effectué. Reste à payer: ${montantRestant.toLocaleString()} XOF`,
        };
      case 'en_attente':
        return {
          label: showAmount && montantRestant > 0
            ? `En attente (${montantRestant.toLocaleString()} XOF)`
            : 'Paiement requis',
          color: 'error' as const,
          icon: <Warning fontSize="small" />,
          tooltip: `Paiement en attente. Montant à payer: ${montantRestant.toLocaleString()} XOF`,
        };
      case 'exonere':
        return {
          label: 'Exonéré',
          color: 'info' as const,
          icon: <CheckCircle fontSize="small" />,
          tooltip: 'Le patient est exonéré de paiement',
        };
      case 'urgence_autorisee':
        return {
          label: 'Urgence autorisée',
          color: 'warning' as const,
          icon: <CheckCircle fontSize="small" />,
          tooltip: 'Consultation autorisée en urgence sans paiement préalable',
        };
      case 'non_facture':
      default:
        return {
          label: 'Non facturé',
          color: 'default' as const,
          icon: <Block fontSize="small" />,
          tooltip: 'Aucune facture générée',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip title={config.tooltip} arrow>
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size={size}
        sx={{
          fontWeight: status === 'paye' || status === 'exonere' ? 'bold' : 'normal',
        }}
      />
    </Tooltip>
  );
};
