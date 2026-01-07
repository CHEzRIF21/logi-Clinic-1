import { Request, Response } from 'express';
import PaymentService from '../services/paymentService';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

export class PaymentController {
  /**
   * POST /api/invoices/:id/payments
   * Ajoute un paiement à une facture
   */
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const invoiceId = req.params.invoiceId || req.params.id;
      const { amount, method, reference, createdBy } = req.body;

      // Validation
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Le montant doit être supérieur à 0',
        });
      }

      if (!method) {
        return res.status(400).json({
          success: false,
          message: 'Le mode de paiement est requis',
        });
      }

      // Moyens de paiement spécifiques à l'Afrique de l'Ouest (XOF)
      const validMethods = [
        'especes',
        'orange_money',
        'mtn_mobile_money',
        'moov_money',
        'wave',
        'flooz',
        't_money',
        'carte_bancaire',
        'virement',
        'cheque',
        'prise_en_charge',
        // Rétro-compatibilité avec les anciens codes
        'ESPECE',
        'CARTE',
        'MOBILE',
        'ASSURANCE',
        'VIREMENT',
      ];
      const methodLower = method.toLowerCase();
      if (!validMethods.map(m => m.toLowerCase()).includes(methodLower)) {
        return res.status(400).json({
          success: false,
          message: `Mode de paiement invalide. Valeurs acceptées: especes, orange_money, mtn_mobile_money, moov_money, wave, flooz, t_money, carte_bancaire, virement, cheque, prise_en_charge`,
        });
      }

      const payment = await PaymentService.addPayment({
        invoiceId,
        amount,
        method,
        reference,
        createdBy: createdBy || req.user?.id,
      });

      // Mettre à jour le statut de paiement de la consultation si la facture est liée
      if (supabaseAdmin) {
        try {
          const { data: facture } = await supabaseAdmin
            .from('factures')
            .select('consultation_id, statut, montant_restant')
            .eq('id', invoiceId)
            .single();

          if (facture?.consultation_id) {
            // Le trigger SQL devrait déjà mettre à jour, mais on le fait explicitement aussi
            if (facture.statut === 'payee' && facture.montant_restant <= 0) {
              await supabaseAdmin
                .from('consultations')
                .update({
                  statut_paiement: 'paye',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', facture.consultation_id);
            } else if (facture.statut === 'partiellement_payee' || facture.statut === 'en_attente') {
              await supabaseAdmin
                .from('consultations')
                .update({
                  statut_paiement: 'en_attente',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', facture.consultation_id);
            }
          }
        } catch (updateError) {
          console.error('Erreur mise à jour statut consultation après paiement:', updateError);
          // Ne pas échouer le paiement si la mise à jour échoue
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Paiement enregistré avec succès',
        data: payment,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvée') ||
                        error.message.includes('requis') ||
                        error.message.includes('supérieur')
        ? 400
        : 500;

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de l\'enregistrement du paiement',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/invoices/:id/payments
   * Liste les paiements d'une facture
   */
  static async listByInvoice(req: Request, res: Response): Promise<Response> {
    try {
      const invoiceId = req.params.invoiceId || req.params.id;

      const payments = await PaymentService.getPaymentsByInvoice(invoiceId);

      return res.json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paiements',
        error: error.message,
      });
    }
  }
}

export default PaymentController;
