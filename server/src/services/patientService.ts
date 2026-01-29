import prisma from '../prisma';
import SchemaCacheService from './schemaCacheService';
import { differenceInYears } from 'date-fns';

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  sex: string;
  dob: Date;
  phones?: string[];
  address?: string;
  assuranceId?: string;
  ifu?: string;
}

export interface UpdatePatientInput extends Partial<CreatePatientInput> {}

export class PatientService {
  /**
   * Crée un nouveau patient
   * ✅ CORRIGÉ: Assigne automatiquement clinic_id
   */
  static async createPatient(input: CreatePatientInput & { clinicId?: string }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const age = differenceInYears(new Date(), input.dob);

      const patient = await prisma.patient.create({
        data: {
          ...input,
          clinicId: input.clinicId, // ✅ AJOUTER
          age,
          phones: input.phones || [],
        },
        include: {
          assurance: true,
        },
      });

      return patient;
    });
  }

  /**
   * Met à jour un patient
   */
  static async updatePatient(id: string, input: UpdatePatientInput) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const updateData: any = { ...input };

      if (input.dob) {
        updateData.age = differenceInYears(new Date(), input.dob);
      }

      const patient = await prisma.patient.update({
        where: { id },
        data: updateData,
        include: {
          assurance: true,
          operations: {
            include: {
              lines: {
                include: {
                  product: true,
                },
              },
            },
            orderBy: {
              date: 'desc',
            },
          },
          invoices: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      return patient;
    });
  }

  /**
   * Récupère un patient par son ID avec historique
   * ✅ CORRIGÉ: Vérifie que le patient appartient à la clinique
   */
  static async getPatientById(id: string, filters?: {
    clinicId?: string;        // ✅ AJOUTER
    isSuperAdmin?: boolean;   // ✅ AJOUTER
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = { patientId: id };

      if (filters?.startDate || filters?.endDate) {
        where.date = {};
        if (filters.startDate) where.date.gte = filters.startDate;
        if (filters.endDate) where.date.lte = filters.endDate;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      const patientWhere: any = { id };
      
      // ✅ VÉRIFIER clinic_id SAUF si super admin
      if (!filters?.isSuperAdmin && filters?.clinicId) {
        patientWhere.clinicId = filters.clinicId;
      }

      const patient = await prisma.patient.findFirst({
        where: patientWhere, // ✅ Utiliser findFirst avec where au lieu de findUnique
        include: {
          assurance: true,
          operations: {
            where,
            include: {
              lines: {
                include: {
                  product: true,
                },
              },
              invoice: {
                select: {
                  id: true,
                  number: true,
                  status: true,
                },
              },
            },
            orderBy: {
              date: 'desc',
            },
          },
          invoices: {
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              invoiceLines: {
                include: {
                  product: true,
                },
              },
              payments: true,
            },
          },
        },
      });

      if (!patient) {
        throw new Error('Patient non trouvé ou accès non autorisé');
      }

      return patient;
    });
  }

  /**
   * Recherche intelligente de patients
   * ✅ CORRIGÉ: Filtre par clinic_id pour isolation multi-tenant
   */
  static async searchPatients(params: {
    clinicId?: string;        // ✅ AJOUTER
    isSuperAdmin?: boolean;   // ✅ AJOUTER
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      // ✅ FILTRER PAR clinic_id SAUF si super admin
      if (!params.isSuperAdmin && params.clinicId) {
        where.clinicId = params.clinicId;
      }

      if (params.search) {
        const searchLower = params.search.toLowerCase();
        where.OR = [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { phones: { has: params.search } },
          { ifu: { contains: params.search, mode: 'insensitive' } },
        ];
      }

      const orderBy: any = {};
      if (params.sortBy) {
        orderBy[params.sortBy] = params.sortOrder || 'asc';
      } else {
        orderBy.createdAt = 'desc';
      }

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where,
          include: {
            assurance: true,
            _count: {
              select: {
                operations: true,
                invoices: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.patient.count({ where }),
      ]);

      return {
        patients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  /**
   * Supprime un patient
   */
  static async deletePatient(id: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Vérifier qu'il n'y a pas d'opérations ou factures liées
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              operations: true,
              invoices: true,
            },
          },
        },
      });

      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      if (patient._count.operations > 0 || patient._count.invoices > 0) {
        throw new Error('Impossible de supprimer un patient avec des opérations ou factures');
      }

      await prisma.patient.delete({
        where: { id },
      });

      return { success: true };
    });
  }
}

export default PatientService;

