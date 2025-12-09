import { Request, Response } from 'express';
import AuditService from '../services/auditService';

export class AuditController {
  /**
   * GET /api/audit
   * Récupère les logs d'audit
   */
  static async getLogs(req: Request, res: Response) {
    try {
      const {
        userId,
        entity,
        entityId,
        action,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;

      const result = await AuditService.getLogs({
        userId: userId as string,
        entity: entity as string,
        entityId: entityId as string,
        action: action as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des logs d\'audit',
        error: error.message,
      });
    }
  }
}

export default AuditController;

