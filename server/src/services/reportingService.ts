import prisma from '../prisma';
import SchemaCacheService from './schemaCacheService';

export class ReportingService {
  /**
   * Ventes par période et catégorie
   */
  static async getSalesByCategory(params: {
    startDate: Date;
    endDate: Date;
    category?: string;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = {
        invoice: {
          dateEmission: {
            gte: params.startDate,
            lte: params.endDate,
          },
          status: {
            not: 'ANNULEE',
          },
        },
      };

      if (params.category) {
        where.product = {
          category: params.category,
        };
      }

      const lines = await prisma.invoiceLine.findMany({
        where,
        include: {
          product: {
            select: {
              category: true,
              subCategory: true,
              label: true,
            },
          },
          invoice: {
            select: {
              dateEmission: true,
              status: true,
            },
          },
        },
      });

      // Grouper par catégorie
      const grouped: Record<string, {
        category: string;
        total: number;
        count: number;
        lines: typeof lines;
      }> = {};

      lines.forEach((line) => {
        const category = line.product.category;
        if (!grouped[category]) {
          grouped[category] = {
            category,
            total: 0,
            count: 0,
            lines: [],
          };
        }
        grouped[category].total += Number(line.total);
        grouped[category].count += line.qty;
        grouped[category].lines.push(line);
      });

      return Object.values(grouped);
    });
  }

  /**
   * Opérations non payées
   */
  static async getUnpaidOperations(params?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = {
        status: {
          in: ['EN_ATTENTE', 'DIFFERE', 'RESTANT'],
        },
      };

      if (params?.startDate || params?.endDate) {
        where.date = {};
        if (params.startDate) where.date.gte = params.startDate;
        if (params.endDate) where.date.lte = params.endDate;
      }

      const operations = await prisma.operation.findMany({
        where,
        include: {
          patient: true,
          lines: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      return operations;
    });
  }

  /**
   * Créances (factures non payées)
   */
  static async getReceivables(params?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = {
        status: {
          in: ['EN_ATTENTE', 'PARTIELLE'],
        },
      };

      if (params?.startDate || params?.endDate) {
        where.dateEmission = {};
        if (params.startDate) where.dateEmission.gte = params.startDate;
        if (params.endDate) where.dateEmission.lte = params.endDate;
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

      const receivables = invoices.map((invoice) => {
        const totalTTC = Number(invoice.totalTTC);
        const amountPaid = Number(invoice.amountPaid);
        const remaining = totalTTC - amountPaid;

        return {
          ...invoice,
          remaining,
        };
      });

      return receivables;
    });
  }

  /**
   * Top produits
   */
  static async getTopProducts(params: {
    startDate: Date;
    endDate: Date;
    limit?: number;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const lines = await prisma.invoiceLine.findMany({
        where: {
          invoice: {
            dateEmission: {
              gte: params.startDate,
              lte: params.endDate,
            },
            status: {
              not: 'ANNULEE',
            },
          },
        },
        include: {
          product: true,
        },
      });

      // Grouper par produit
      const grouped: Record<string, {
        product: any;
        total: number;
        qty: number;
        count: number;
      }> = {};

      lines.forEach((line) => {
        const productId = line.productId;
        if (!grouped[productId]) {
          grouped[productId] = {
            product: line.product,
            total: 0,
            qty: 0,
            count: 0,
          };
        }
        grouped[productId].total += Number(line.total);
        grouped[productId].qty += line.qty;
        grouped[productId].count += 1;
      });

      const topProducts = Object.values(grouped)
        .sort((a, b) => b.total - a.total)
        .slice(0, params.limit || 10);

      return topProducts;
    });
  }

  /**
   * Entrées/Sorties
   */
  static async getEntriesExits(params: {
    startDate: Date;
    endDate: Date;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Entrées (paiements)
      const payments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: params.startDate,
            lte: params.endDate,
          },
        },
        include: {
          invoice: {
            select: {
              number: true,
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      // Sorties (dépenses caisse)
      const depenses = await prisma.caisseEntry.findMany({
        where: {
          type: 'DEPENSE',
          date: {
            gte: params.startDate,
            lte: params.endDate,
          },
        },
        include: {
          ligneBudgetaire: true,
        },
      });

      return {
        entries: payments,
        exits: depenses,
        totalEntries: payments.reduce((sum, p) => sum + Number(p.amount), 0),
        totalExits: depenses.reduce((sum, d) => sum + Number(d.amount), 0),
      };
    });
  }
}

export default ReportingService;

