import { Request, Response } from 'express';
import CaisseService from '../services/caisseService';
import { AuthRequest } from '../middleware/auth';

export class CaisseController {
  /**
   * GET /api/caisse/journal
   * Récupère le journal de caisse
   */
  static async getJournal(req: Request, res: Response) {
    try {
      const { startDate, endDate, type, ligneBudgetId } = req.query;

      const entries = await CaisseService.getJournal({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        type: type as string,
        ligneBudgetId: ligneBudgetId as string,
      });

      res.json({
        success: true,
        data: entries,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du journal de caisse',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/caisse/statistics
   * Récupère les statistiques de caisse
   */
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Les dates de début et de fin sont requises',
        });
      }

      const stats = await CaisseService.getStatistics({
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      });

      return res.json({
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
   * POST /api/caisse/entries
   * Crée une entrée de caisse
   */
  static async createEntry(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, amount, ligneBudgetId, description, date } = req.body;

      if (!type || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Le type et le montant sont requis',
        });
      }

      if (type !== 'DEPENSE' && type !== 'DEPOT') {
        return res.status(400).json({
          success: false,
          message: 'Le type doit être DEPENSE ou DEPOT',
        });
      }

      const entry = await CaisseService.createEntry({
        type,
        amount,
        ligneBudgetId,
        description,
        date: date ? new Date(date) : undefined,
        createdBy: req.user?.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Entrée de caisse créée avec succès',
        data: entry,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la création de l\'entrée',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/caisse/close
   * Ferme la caisse (rapprochement)
   */
  static async closeCaisse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { date } = req.body;

      const result = await CaisseService.closeCaisse(
        date ? new Date(date) : new Date(),
        req.user?.id || 'system'
      );

      return res.json({
        success: true,
        message: 'Caisse fermée avec succès',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la fermeture de la caisse',
        error: error.message,
      });
    }
  }
}

export default CaisseController;

