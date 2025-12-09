import prisma from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';
import SchemaCacheService from './schemaCacheService';
import { formatDate } from '../utils/date';

export interface CreateCaisseEntryInput {
  type: 'DEPENSE' | 'DEPOT';
  amount: number;
  ligneBudgetId?: string;
  description?: string;
  date?: Date;
  createdBy?: string;
}

export class CaisseService {
  /**
   * Crée une entrée de caisse
   */
  static async createEntry(input: CreateCaisseEntryInput) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const entry = await prisma.caisseEntry.create({
        data: {
          type: input.type,
          amount: new Decimal(input.amount),
          ligneBudgetId: input.ligneBudgetId || null,
          description: input.description || null,
          date: input.date || new Date(),
          createdBy: input.createdBy || null,
        },
        include: {
          ligneBudgetaire: true,
        },
      });

      return entry;
    });
  }

  /**
   * Récupère le journal de caisse pour une période
   */
  static async getJournal(filters: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
    ligneBudgetId?: string;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = {};

      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          where.date.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.date.lte = filters.endDate;
        }
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.ligneBudgetId) {
        where.ligneBudgetId = filters.ligneBudgetId;
      }

      const entries = await prisma.caisseEntry.findMany({
        where,
        include: {
          ligneBudgetaire: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      return entries;
    });
  }

  /**
   * Récupère les statistiques de caisse pour une période
   */
  static async getStatistics(filters: {
    startDate: Date;
    endDate: Date;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Récupérer les paiements (recettes)
      const payments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        },
      });

      const totalRecettes = payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      // Récupérer les entrées de caisse
      const entries = await prisma.caisseEntry.findMany({
        where: {
          date: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        },
      });

      const depots = entries
        .filter((e) => e.type === 'DEPOT')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const depenses = entries
        .filter((e) => e.type === 'DEPENSE')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      // Calculer les versements (dépôts en banque)
      const versements = depots;

      // Calculer le solde
      const solde = totalRecettes + depots - depenses;

      return {
        recettes: totalRecettes,
        depenses: depenses,
        versements: versements,
        solde: solde,
        entries: entries.length,
      };
    });
  }

  /**
   * Fermeture de caisse (rapprochement)
   */
  static async closeCaisse(date: Date, createdBy: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const stats = await this.getStatistics({
        startDate: startOfDay,
        endDate: endOfDay,
      });

      // Créer un log d'audit pour la fermeture
      // Note: Vous devrez créer un service d'audit si ce n'est pas déjà fait

      return {
        date: formatDate(date),
        ...stats,
        closedBy: createdBy,
        closedAt: new Date(),
      };
    });
  }
}

export default CaisseService;

