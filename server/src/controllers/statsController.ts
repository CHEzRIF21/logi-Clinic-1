import { Request, Response } from 'express';
import StatsService from '../services/statsService';

export class StatsController {
  /**
   * GET /api/statistics/finance
   * Statistiques financières avec groupement par période
   */
  static async getFinanceStats(req: Request, res: Response) {
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
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await StatsService.getDashboardStatistics();

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

