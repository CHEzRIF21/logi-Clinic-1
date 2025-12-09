import { Response } from 'express';
import PaymentService from '../services/paymentService';
import { AuthRequest } from '../middleware/auth';

export class PaymentController {
  /**
   * POST /api/invoices/:id/payments
   * Ajoute un paiement à une facture
   */
  static async create(req: AuthRequest, res: Response): Promise<void> {
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

      const validMethods = ['ESPECE', 'CARTE', 'MOBILE', 'ASSURANCE', 'VIREMENT'];
      if (!validMethods.includes(method)) {
        return res.status(400).json({
          success: false,
          message: `Mode de paiement invalide. Valeurs acceptées: ${validMethods.join(', ')}`,
        });
      }

      const payment = await PaymentService.addPayment({
        invoiceId,
        amount,
        method,
        reference,
        createdBy: createdBy || req.user?.id,
      });

      res.status(201).json({
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

      res.status(statusCode).json({
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
  static async listByInvoice(req: Request, res: Response) {
    try {
      const invoiceId = req.params.invoiceId || req.params.id;

      const payments = await PaymentService.getPaymentsByInvoice(invoiceId);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paiements',
        error: error.message,
      });
    }
  }
}

export default PaymentController;

