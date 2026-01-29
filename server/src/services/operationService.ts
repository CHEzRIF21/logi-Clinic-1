import prisma from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { generateOperationReference } from '../utils/date';
import SchemaCacheService from './schemaCacheService';

export interface CreateOperationInput {
  patientId: string;
  clinicId?: string; // ✅ AJOUTER - Pour vérification
  lines: Array<{
    productId: string;
    qty: number;
    unitPrice: number;
  }>;
  createdBy?: string;
}

export class OperationService {
  /**
   * Crée une nouvelle opération avec ses lignes
   */
  static async createOperation(input: CreateOperationInput) {
    return await SchemaCacheService.executeWithRetry(async () => {
      return await prisma.$transaction(async (tx) => {
        // Vérifier que le patient existe ET récupérer son clinic_id
        const patient = await tx.patient.findUnique({
          where: { id: input.patientId },
          select: { id: true, clinicId: true }, // ✅ Récupérer clinic_id
        });

        if (!patient) {
          throw new Error('Patient non trouvé');
        }

        // ✅ Vérifier que le clinic_id du patient correspond
        if (input.clinicId && patient.clinicId !== input.clinicId) {
          throw new Error('Le patient n\'appartient pas à cette clinique');
        }

        // Récupérer les produits
        const productIds = input.lines.map(l => l.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });

        if (products.length !== productIds.length) {
          throw new Error('Un ou plusieurs produits sont introuvables');
        }

        // Générer la référence
        const reference = generateOperationReference();

        // Créer les lignes d'opération
        const operationLines = input.lines.map(line => {
          const product = products.find(p => p.id === line.productId)!;
          const total = line.qty * line.unitPrice;

          return {
            productId: line.productId,
            qty: line.qty,
            unitPrice: new Decimal(line.unitPrice),
            total: new Decimal(total),
          };
        });

        // Créer l'opération avec clinic_id
        const operation = await tx.operation.create({
          data: {
            reference,
            patientId: input.patientId,
            clinicId: patient.clinicId, // ✅ AJOUTER - Depuis le patient
            status: 'EN_ATTENTE',
            createdBy: input.createdBy || null,
            lines: {
              create: operationLines,
            },
          },
          include: {
            patient: true,
            lines: {
              include: {
                product: true,
              },
            },
          },
        });

        return operation;
      });
    });
  }

  /**
   * Récupère une opération par son ID
   */
  static async getOperationById(id: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const operation = await prisma.operation.findUnique({
        where: { id },
        include: {
          patient: true,
          lines: {
            include: {
              product: true,
            },
          },
          invoice: {
            include: {
              invoiceLines: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!operation) {
        throw new Error('Opération non trouvée ou accès non autorisé');
      }

      return operation;
    });
  }

  /**
   * Liste les opérations avec filtres
   * ✅ CORRIGÉ: Filtre par clinic_id pour isolation multi-tenant
   */
  static async listOperations(filters: {
    clinicId?: string;        // ✅ AJOUTER
    isSuperAdmin?: boolean;   // ✅ AJOUTER
    patientId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = {};

      // ✅ FILTRER PAR clinic_id SAUF si super admin
      if (!filters.isSuperAdmin && filters.clinicId) {
        where.clinicId = filters.clinicId;
      }

      if (filters.patientId) {
        where.patientId = filters.patientId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          where.date.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.date.lte = filters.endDate;
        }
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
      });

      return operations;
    });
  }

  /**
   * Met à jour le statut d'une opération
   */
  static async updateStatus(id: string, status: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const validStatuses = ['EN_ATTENTE', 'DIFFERE', 'PAYEE', 'RESTANT'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}`);
      }

      const operation = await prisma.operation.update({
        where: { id },
        data: { status },
        include: {
          patient: true,
          lines: {
            include: {
              product: true,
            },
          },
        },
      });

      return operation;
    });
  }
}

export default OperationService;

