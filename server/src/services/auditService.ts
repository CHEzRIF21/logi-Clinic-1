import prisma from '../prisma';
import SchemaCacheService from './schemaCacheService';

export interface CreateAuditLogInput {
  userId: string;
  entity: string;
  entityId: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  invoiceId?: string;
}

export class AuditService {
  /**
   * Crée un log d'audit
   */
  static async createLog(input: CreateAuditLogInput) {
    return await SchemaCacheService.executeWithRetry(async () => {
      try {
        const log = await prisma.auditLog.create({
          data: {
            userId: input.userId,
            entity: input.entity,
            entityId: input.entityId,
            action: input.action,
            oldValue: input.oldValue ? JSON.parse(JSON.stringify(input.oldValue)) : null,
            newValue: input.newValue ? JSON.parse(JSON.stringify(input.newValue)) : null,
            invoiceId: input.invoiceId || null,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        });

        return log;
      } catch (error) {
        // Ne pas faire échouer l'opération principale si l'audit échoue
        console.error('Erreur lors de la création du log d\'audit:', error);
        return null;
      }
    });
  }

  /**
   * Récupère les logs d'audit avec filtres
   */
  static async getLogs(filters: {
    userId?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.entity) where.entity = filters.entity;
      if (filters.entityId) where.entityId = filters.entityId;
      if (filters.action) where.action = filters.action;

      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            invoice: {
              select: {
                id: true,
                number: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }
}

export default AuditService;

