import prisma from '../prisma';
import SchemaCacheService from './schemaCacheService';

export interface CreateClinicInput {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  active?: boolean;
}

export interface UpdateClinicInput {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  active?: boolean;
}

export class ClinicService {
  /**
   * Crée une nouvelle clinique
   */
  static async createClinic(input: CreateClinicInput) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Vérifier que le code est unique
      const existing = await prisma.clinic.findUnique({
        where: { code: input.code },
      });

      if (existing) {
        throw new Error(`Une clinique avec le code ${input.code} existe déjà`);
      }

      return await prisma.clinic.create({
        data: {
          code: input.code.toUpperCase(),
          name: input.name,
          address: input.address,
          phone: input.phone,
          email: input.email,
          active: input.active ?? true,
        },
      });
    });
  }

  /**
   * Récupère toutes les cliniques
   */
  static async getAllClinics(includeInactive: boolean = false) {
    return await SchemaCacheService.executeWithRetry(async () => {
      return await prisma.clinic.findMany({
        where: includeInactive ? undefined : { active: true },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              users: true,
              pricing: true,
            },
          },
        },
      });
    });
  }

  /**
   * Récupère une clinique par son ID
   */
  static async getClinicById(id: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const clinic = await prisma.clinic.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              users: true,
              pricing: true,
            },
          },
        },
      });

      if (!clinic) {
        throw new Error('Clinique non trouvée');
      }

      return clinic;
    });
  }

  /**
   * Récupère une clinique par son code
   */
  static async getClinicByCode(code: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const clinic = await prisma.clinic.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          _count: {
            select: {
              users: true,
              pricing: true,
            },
          },
        },
      });

      if (!clinic) {
        throw new Error('Clinique non trouvée');
      }

      return clinic;
    });
  }

  /**
   * Met à jour une clinique
   */
  static async updateClinic(id: string, input: UpdateClinicInput) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Vérifier que la clinique existe
      const existing = await prisma.clinic.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Clinique non trouvée');
      }

      return await prisma.clinic.update({
        where: { id },
        data: {
          name: input.name,
          address: input.address,
          phone: input.phone,
          email: input.email,
          active: input.active,
        },
      });
    });
  }

  /**
   * Désactive une clinique (soft delete)
   */
  static async deactivateClinic(id: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      return await prisma.clinic.update({
        where: { id },
        data: { active: false },
      });
    });
  }

  /**
   * Réactive une clinique
   */
  static async activateClinic(id: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      return await prisma.clinic.update({
        where: { id },
        data: { active: true },
      });
    });
  }

  /**
   * Supprime une clinique (hard delete - à utiliser avec précaution)
   */
  static async deleteClinic(id: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Vérifier qu'il n'y a pas d'utilisateurs associés
      const clinic = await prisma.clinic.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!clinic) {
        throw new Error('Clinique non trouvée');
      }

      if (clinic._count.users > 0) {
        throw new Error('Impossible de supprimer une clinique avec des utilisateurs associés');
      }

      return await prisma.clinic.delete({
        where: { id },
      });
    });
  }

  /**
   * Récupère les statistiques d'une clinique
   */
  static async getClinicStats(id: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const clinic = await prisma.clinic.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              pricing: true,
            },
          },
        },
      });

      if (!clinic) {
        throw new Error('Clinique non trouvée');
      }

      return {
        id: clinic.id,
        code: clinic.code,
        name: clinic.name,
        active: clinic.active,
        totalUsers: clinic._count.users,
        totalPricing: clinic._count.pricing,
        createdAt: clinic.createdAt,
        updatedAt: clinic.updatedAt,
      };
    });
  }
}

