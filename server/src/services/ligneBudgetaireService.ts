import prisma from '../prisma';
import SchemaCacheService from './schemaCacheService';

export interface CreateLigneBudgetaireInput {
  libelle: string;
  code?: string;
  type: 'DEPENSE' | 'RECETTE';
}

export class LigneBudgetaireService {
  /**
   * Crée une ligne budgétaire
   */
  static async create(input: CreateLigneBudgetaireInput) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Vérifier l'unicité du code si fourni
      if (input.code) {
        const existing = await prisma.ligneBudgetaire.findUnique({
          where: { code: input.code },
        });

        if (existing) {
          throw new Error(`Une ligne budgétaire avec le code ${input.code} existe déjà`);
        }
      }

      const ligne = await prisma.ligneBudgetaire.create({
        data: input,
      });

      return ligne;
    });
  }

  /**
   * Liste toutes les lignes budgétaires
   */
  static async list(filters?: {
    type?: string;
    active?: boolean;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = {};

      if (filters?.type) {
        where.type = filters.type;
      }

      if (filters?.active !== undefined) {
        where.active = filters.active;
      }

      const lignes = await prisma.ligneBudgetaire.findMany({
        where,
        include: {
          _count: {
            select: {
              caisseEntries: true,
            },
          },
        },
        orderBy: {
          libelle: 'asc',
        },
      });

      return lignes;
    });
  }

  /**
   * Met à jour une ligne budgétaire
   */
  static async update(id: string, input: Partial<CreateLigneBudgetaireInput>) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Vérifier l'unicité du code si modifié
      if (input.code) {
        const existing = await prisma.ligneBudgetaire.findUnique({
          where: { code: input.code },
        });

        if (existing && existing.id !== id) {
          throw new Error(`Une ligne budgétaire avec le code ${input.code} existe déjà`);
        }
      }

      const ligne = await prisma.ligneBudgetaire.update({
        where: { id },
        data: input,
      });

      return ligne;
    });
  }

  /**
   * Supprime une ligne budgétaire (soft delete)
   */
  static async delete(id: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Vérifier qu'il n'y a pas d'entrées de caisse liées
      const ligne = await prisma.ligneBudgetaire.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              caisseEntries: true,
            },
          },
        },
      });

      if (!ligne) {
        throw new Error('Ligne budgétaire non trouvée');
      }

      if (ligne._count.caisseEntries > 0) {
        // Soft delete
        return await prisma.ligneBudgetaire.update({
          where: { id },
          data: { active: false },
        });
      }

      // Hard delete si aucune entrée
      await prisma.ligneBudgetaire.delete({
        where: { id },
      });

      return { success: true };
    });
  }
}

export default LigneBudgetaireService;

