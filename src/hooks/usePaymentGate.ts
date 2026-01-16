import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConsultationBillingService } from '../services/consultationBillingService';
import { ConfigurationService } from '../services/configurationService';

interface PaymentGateResult {
  canAccess: boolean;
  factureId?: string;
  redirectToCaisse: () => void;
  loading: boolean;
  reason?: string;
}

/**
 * Hook React pour vérifier le statut de paiement d'une consultation
 * Bloque l'accès si le paiement n'est pas effectué
 */
export const usePaymentGate = (consultationId: string | null): PaymentGateResult => {
  const navigate = useNavigate();
  const [canAccess, setCanAccess] = useState(false);
  const [factureId, setFactureId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string | undefined>();

  useEffect(() => {
    if (!consultationId) {
      setCanAccess(false);
      setLoading(false);
      return;
    }

    checkPaymentStatus();
  }, [consultationId]);

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);

      // Vérifier d'abord si le paiement est obligatoire pour cette clinique
      const paymentRequired = await ConfigurationService.isPaymentRequiredBeforeConsultation();

      if (!paymentRequired) {
        // Si paiement non obligatoire, autoriser directement l'accès
        setCanAccess(true);
        setReason('Paiement non obligatoire pour cette clinique');
        setLoading(false);
        return;
      }

      // Si paiement obligatoire, vérifier le statut
      const status = await ConsultationBillingService.canAccessConsultation(consultationId!);
      setCanAccess(status.canAccess);
      setFactureId(status.factureId);
      setReason(status.reason);

      // Si l'accès est bloqué, rediriger automatiquement après 3 secondes
      if (!status.canAccess && status.factureId) {
        setTimeout(() => {
          redirectToCaisse(status.factureId);
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur vérification paiement:', error);
      // En cas d'erreur, bloquer par sécurité
      setCanAccess(false);
      setReason('Erreur lors de la vérification du paiement - Accès bloqué par sécurité');
    } finally {
      setLoading(false);
    }
  };

  const redirectToCaisse = (factureIdParam?: string) => {
    navigate('/caisse', {
      state: {
        factureId: factureIdParam || factureId,
        consultationId,
        message: 'Paiement requis avant d\'accéder à la consultation',
      },
    });
  };

  return {
    canAccess,
    factureId,
    redirectToCaisse: () => redirectToCaisse(),
    loading,
    reason,
  };
};
