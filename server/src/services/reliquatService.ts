import prisma from '../prisma';
import SchemaCacheService from './schemaCacheService';

/**
 * Service pour gérer les reliquats automatiquement
 */
export class ReliquatService {
  /**
   * Met à jour les reliquats pour une facture
   * Crée automatiquement une opération reliquat si nécessaire
   */
  static async updateReliquatForInvoice(invoiceId: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          payments: true,
          patient: true,
        },
      });

      if (!invoice) {
        throw new Error('Facture non trouvée');
      }

      const totalTTC = Number(invoice.totalTTC);
      const totalPaid = invoice.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const remaining = totalTTC - totalPaid;

      // Si reliquat existe (montant payé < total)
      if (remaining > 0 && invoice.status !== 'PAYEE') {
        // Mettre à jour le statut des opérations liées en RESTANT
        await prisma.operation.updateMany({
          where: {
            invoiceId: invoiceId,
            status: {
              not: 'PAYEE',
            },
          },
          data: {
            status: 'RESTANT',
          },
        });

        // Mettre à jour le statut de la facture
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: totalPaid > 0 ? 'PARTIELLE' : 'EN_ATTENTE',
            amountPaid: totalPaid,
          },
        });
      } else if (remaining <= 0) {
        // Facture entièrement payée
        await prisma.operation.updateMany({
          where: {
            invoiceId: invoiceId,
          },
          data: {
            status: 'PAYEE',
          },
        });

        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'PAYEE',
            amountPaid: totalTTC,
          },
        });
      }

      return {
        remaining,
        totalTTC,
        totalPaid,
      };
    });
  }

  /**
   * Récupère tous les reliquats (factures partiellement payées)
   */
  static async getReliquats(filters?: {
    startDate?: Date;
    endDate?: Date;
    patientId?: string;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = {
        status: 'PARTIELLE',
      };

      if (filters?.startDate || filters?.endDate) {
        where.dateEmission = {};
        if (filters.startDate) where.dateEmission.gte = filters.startDate;
        if (filters.endDate) where.dateEmission.lte = filters.endDate;
      }

      if (filters?.patientId) {
        where.patientId = filters.patientId;
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          patient: true,
          payments: true,
        },
        orderBy: {
          dateEmission: 'desc',
        },
      });

      return invoices.map((invoice) => {
        const totalTTC = Number(invoice.totalTTC);
        const totalPaid = invoice.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        const remaining = totalTTC - totalPaid;

        return {
          ...invoice,
          remaining,
        };
      });
    });
  }

  /**
   * Calcule le total des créances (reliquats)
   */
  static async getTotalReceivables(filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = {
        status: {
          in: ['EN_ATTENTE', 'PARTIELLE'],
        },
      };

      if (filters?.startDate || filters?.endDate) {
        where.dateEmission = {};
        if (filters.startDate) where.dateEmission.gte = filters.startDate;
        if (filters.endDate) where.dateEmission.lte = filters.endDate;
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          payments: true,
        },
      });

      const total = invoices.reduce((sum, invoice) => {
        const totalTTC = Number(invoice.totalTTC);
        const totalPaid = invoice.payments.reduce(
          (pSum, p) => pSum + Number(p.amount),
          0
        );
        return sum + (totalTTC - totalPaid);
      }, 0);

      return {
        total,
        count: invoices.length,
      };
    });
  }
}

export default ReliquatService;

