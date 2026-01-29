import prisma from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';
import InvoiceService from './invoiceService';
import SchemaCacheService from './schemaCacheService';

export interface CreatePaymentInput {
  invoiceId: string;
  clinicId?: string; // ✅ AJOUTER - Pour vérification
  amount: number;
  method: string;
  reference?: string;
  createdBy?: string;
}

export class PaymentService {
  /**
   * Ajoute un paiement à une facture
   * Met à jour automatiquement le statut de la facture
   */
  static async addPayment(input: CreatePaymentInput) {
    return await SchemaCacheService.executeWithRetry(async () => {
      return await prisma.$transaction(async (tx) => {
        // Vérifier que la facture existe ET récupérer son clinic_id
        const invoice = await tx.invoice.findUnique({
          where: { id: input.invoiceId },
          select: { 
            id: true, 
            clinicId: true, // ✅ Récupérer clinic_id
            status: true,
            totalTTC: true,
            payments: {
              select: { amount: true },
            },
          },
        });

        if (!invoice) {
          throw new Error('Facture non trouvée');
        }

        // ✅ Vérifier que le clinic_id de la facture correspond
        if (input.clinicId && invoice.clinicId !== input.clinicId) {
          throw new Error('La facture n\'appartient pas à cette clinique');
        }

        if (invoice.status === 'ANNULEE') {
          throw new Error('Impossible d\'ajouter un paiement à une facture annulée');
        }

        // Récupérer tous les paiements pour calculer le solde
        const allPayments = await tx.payment.findMany({
          where: { invoiceId: input.invoiceId },
        });

        const totalTTC = Number(invoice.totalTTC);
        const currentPaid = allPayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        const remaining = totalTTC - currentPaid;

        // Vérifier que le montant ne dépasse pas le solde restant
        if (input.amount > remaining) {
          throw new Error(
            `Le montant du paiement (${input.amount} FCFA) dépasse le solde restant (${remaining} FCFA)`
          );
        }

        // Créer le paiement avec clinic_id
        const payment = await tx.payment.create({
          data: {
            invoiceId: input.invoiceId,
            clinicId: invoice.clinicId, // ✅ AJOUTER - Depuis la facture
            amount: new Decimal(input.amount),
            method: input.method,
            reference: input.reference || null,
            createdBy: input.createdBy || null,
          },
        });

        // Mettre à jour le statut de la facture
        await InvoiceService.updateInvoiceStatus(input.invoiceId);

        // Récupérer la facture mise à jour
        const updatedInvoice = await InvoiceService.getInvoiceById(input.invoiceId);

        return {
          payment,
          invoice: updatedInvoice,
        };
      });
    });
  }

  /**
   * Récupère tous les paiements d'une facture
   * ✅ CORRIGÉ: Vérifie que la facture appartient à la clinique
   */
  static async getPaymentsByInvoice(invoiceId: string, filters?: {
    clinicId?: string;        // ✅ AJOUTER
    isSuperAdmin?: boolean;   // ✅ AJOUTER
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // ✅ D'abord vérifier que la facture appartient à la clinique
      if (!filters?.isSuperAdmin && filters?.clinicId) {
        const invoice = await prisma.invoice.findFirst({
          where: { 
            id: invoiceId,
            clinicId: filters.clinicId,
          },
          select: { id: true },
        });

        if (!invoice) {
          throw new Error('Facture non trouvée ou accès non autorisé');
        }
      }

      const payments = await prisma.payment.findMany({
        where: { invoiceId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return payments;
    });
  }

  /**
   * Supprime un paiement (avec mise à jour du statut de la facture)
   */
  static async deletePayment(paymentId: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      return await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: {
            invoice: true,
          },
        });

        if (!payment) {
          throw new Error('Paiement non trouvé');
        }

        const invoiceId = payment.invoiceId;

        // Supprimer le paiement
        await tx.payment.delete({
          where: { id: paymentId },
        });

        // Mettre à jour le statut de la facture
        await InvoiceService.updateInvoiceStatus(invoiceId);

        return { success: true };
      });
    });
  }
}

export default PaymentService;

