import prisma from '../prisma';
import SchemaCacheService from './schemaCacheService';

export class StatsService {
  /**
   * Statistiques financières avec groupement par période
   */
  static async getFinanceStatistics(params: {
    startDate: Date;
    endDate: Date;
    groupBy: 'day' | 'month' | 'year';
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: params.startDate,
            lte: params.endDate,
          },
          status: {
            not: 'ANNULEE',
          },
        },
        select: {
          createdAt: true,
          totalTTC: true,
          amountPaid: true,
          totalHT: true,
          totalTax: true,
          totalDiscount: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Grouper par période
      const grouped: Record<string, {
        date: string;
        totalTTC: number;
        amountPaid: number;
        totalHT: number;
        totalTax: number;
        totalDiscount: number;
        count: number;
      }> = {};

      invoices.forEach(invoice => {
        const date = new Date(invoice.createdAt);
        let key: string;

        if (params.groupBy === 'day') {
          key = date.toISOString().split('T')[0];
        } else if (params.groupBy === 'month') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
          key = String(date.getFullYear());
        }

        if (!grouped[key]) {
          grouped[key] = {
            date: key,
            totalTTC: 0,
            amountPaid: 0,
            totalHT: 0,
            totalTax: 0,
            totalDiscount: 0,
            count: 0,
          };
        }

        grouped[key].totalTTC += Number(invoice.totalTTC);
        grouped[key].amountPaid += Number(invoice.amountPaid);
        grouped[key].totalHT += Number(invoice.totalHT);
        grouped[key].totalTax += Number(invoice.totalTax);
        grouped[key].totalDiscount += Number(invoice.totalDiscount);
        grouped[key].count += 1;
      });

      return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  /**
   * Statistiques pour le tableau de bord
   */
  static async getDashboardStatistics() {
    return await SchemaCacheService.executeWithRetry(async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);

      // Statistiques du jour
      const todayInvoices = await prisma.invoice.aggregate({
        where: {
          createdAt: {
            gte: today,
          },
          status: {
            not: 'ANNULEE',
          },
        },
        _sum: {
          totalTTC: true,
          amountPaid: true,
        },
        _count: {
          id: true,
        },
      });

      // Statistiques du mois
      const monthInvoices = await prisma.invoice.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
          status: {
            not: 'ANNULEE',
          },
        },
        _sum: {
          totalTTC: true,
          amountPaid: true,
        },
        _count: {
          id: true,
        },
      });

      // Statistiques de l'année
      const yearInvoices = await prisma.invoice.aggregate({
        where: {
          createdAt: {
            gte: startOfYear,
          },
          status: {
            not: 'ANNULEE',
          },
        },
        _sum: {
          totalTTC: true,
          amountPaid: true,
        },
        _count: {
          id: true,
        },
      });

      // Factures en attente
      const pendingInvoices = await prisma.invoice.count({
        where: {
          status: 'EN_ATTENTE',
        },
      });

      // Factures partiellement payées
      const partialInvoices = await prisma.invoice.count({
        where: {
          status: 'PARTIELLE',
        },
      });

      // Total des créances (factures non payées)
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          status: {
            in: ['EN_ATTENTE', 'PARTIELLE'],
          },
        },
        select: {
          totalTTC: true,
          amountPaid: true,
        },
      });

      const totalReceivables = unpaidInvoices.reduce((sum, inv) => {
        return sum + (Number(inv.totalTTC) - Number(inv.amountPaid));
      }, 0);

      // Paiements du jour
      const todayPayments = await prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: today,
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      return {
        today: {
          revenue: Number(todayInvoices._sum.totalTTC || 0),
          paid: Number(todayInvoices._sum.amountPaid || 0),
          count: todayInvoices._count.id,
          payments: {
            amount: Number(todayPayments._sum.amount || 0),
            count: todayPayments._count.id,
          },
        },
        month: {
          revenue: Number(monthInvoices._sum.totalTTC || 0),
          paid: Number(monthInvoices._sum.amountPaid || 0),
          count: monthInvoices._count.id,
        },
        year: {
          revenue: Number(yearInvoices._sum.totalTTC || 0),
          paid: Number(yearInvoices._sum.amountPaid || 0),
          count: yearInvoices._count.id,
        },
        pending: {
          invoices: pendingInvoices,
          partial: partialInvoices,
          receivables: totalReceivables,
        },
      };
    });
  }

  /**
   * Statistiques par catégorie de produit
   */
  static async getCategoryStatistics(params: {
    startDate: Date;
    endDate: Date;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const invoiceLines = await prisma.invoiceLine.findMany({
        where: {
          invoice: {
            createdAt: {
              gte: params.startDate,
              lte: params.endDate,
            },
            status: {
              not: 'ANNULEE',
            },
          },
        },
        include: {
          product: {
            select: {
              category: true,
            },
          },
        },
      });

      const grouped: Record<string, {
        category: string;
        total: number;
        count: number;
      }> = {};

      invoiceLines.forEach(line => {
        const category = line.product.category;
        if (!grouped[category]) {
          grouped[category] = {
            category,
            total: 0,
            count: 0,
          };
        }
        grouped[category].total += Number(line.total);
        grouped[category].count += line.qty;
      });

      return Object.values(grouped);
    });
  }
}

export default StatsService;

