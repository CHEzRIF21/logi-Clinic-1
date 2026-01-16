import { useState, useEffect, useCallback } from 'react';
import { ConsultationBillingService } from '../services/consultationBillingService';
import { supabase } from '../services/supabase';

export interface PaymentStatusInfo {
  isPaid: boolean;
  status: 'paye' | 'en_attente' | 'partiellement_payee' | 'non_facture' | 'exonere' | 'urgence_autorisee';
  factureId?: string;
  montantRestant: number;
  canAccess: boolean;
  message: string;
}

/**
 * Hook pour vérifier et suivre le statut de paiement d'une consultation
 * Met à jour automatiquement en temps réel via Supabase Realtime
 */
export const usePaymentStatus = (consultationId: string | null) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkPaymentStatus = useCallback(async () => {
    if (!consultationId) return;

    try {
      setLoading(true);
      setError(null);

      const status = await ConsultationBillingService.canAccessConsultation(consultationId);
      
      // Déterminer le statut de paiement
      let paymentStatus: PaymentStatusInfo['status'] = 'non_facture';
      if (status.factureId) {
        if (status.canAccess) {
          paymentStatus = status.statutPaiement === 'exonere' ? 'exonere' : 'paye';
        } else if (status.statutPaiement === 'partiellement_payee') {
          paymentStatus = 'partiellement_payee';
        } else {
          paymentStatus = 'en_attente';
        }
      }
      
      setPaymentStatus({
        isPaid: status.canAccess,
        status: paymentStatus,
        factureId: status.factureId,
        montantRestant: status.montantRestant || 0,
        canAccess: status.canAccess,
        message: status.reason,
      });
    } catch (err: any) {
      console.error('Erreur vérification statut paiement:', err);
      setError(err.message || 'Erreur lors de la vérification du paiement');
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  useEffect(() => {
    if (!consultationId) {
      setPaymentStatus(null);
      setLoading(false);
      return;
    }

    checkPaymentStatus();
    
    // S'abonner aux changements de factures liées à cette consultation
    const channel = supabase
      .channel(`payment-status-${consultationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'factures',
          filter: `consultation_id=eq.${consultationId}`,
        },
        () => {
          // Re-vérifier le statut quand une facture est mise à jour
          checkPaymentStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'paiements',
        },
        () => {
          // Re-vérifier le statut quand un paiement est ajouté
          checkPaymentStatus();
        }
      )
      .subscribe();

    return () => {
      // Nettoyer l'abonnement à la déconnexion
      channel.unsubscribe();
    };
  }, [consultationId, checkPaymentStatus]);

  return {
    paymentStatus,
    loading,
    error,
    refresh: checkPaymentStatus,
  };
};
