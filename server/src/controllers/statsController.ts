import { Response } from 'express';
import StatsService from '../services/statsService';
import { AuthRequest } from '../middleware/auth';

export class StatsController {
  /**
   * GET /api/statistics/finance
   * Statistiques financières avec groupement par période
   */
  static async getFinanceStats(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, group = 'month' } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Les dates de début et de fin sont requises',
        });
      }

      const stats = await StatsService.getFinanceStatistics({
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        groupBy: group as 'day' | 'month' | 'year',
        clinicId: req.user?.clinic_id,
        role: req.user?.role,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/statistics/dashboard
   * Statistiques pour le tableau de bord
   */
  static async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      // SUPER_ADMIN: autorisé sans clinic_id (stats globales)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise',
        });
      }

      if (req.user.role !== 'SUPER_ADMIN' && !req.user.clinic_id) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique manquant.',
          code: 'MISSING_CLINIC_CONTEXT',
        });
      }

      const stats = await StatsService.getDashboardStatistics({
        clinicId: req.user.clinic_id,
        role: req.user.role,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques du tableau de bord',
        error: error.message,
      });
    }
  }
}

export default StatsController;

