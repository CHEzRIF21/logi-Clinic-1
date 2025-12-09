import { Request, Response } from 'express';
import ReportingService from '../services/reportingService';

export class ReportingController {
  /**
   * GET /api/reports/sales-by-category
   * Ventes par catégorie
   */
  static async getSalesByCategory(req: Request, res: Response) {
    try {
      const { startDate, endDate, category } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Les dates de début et de fin sont requises',
        });
      }

      const data = await ReportingService.getSalesByCategory({
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        category: category as string,
      });

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du rapport',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reports/unpaid-operations
   * Opérations non payées
   */
  static async getUnpaidOperations(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const data = await ReportingService.getUnpaidOperations({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des opérations non payées',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reports/receivables
   * Créances
   */
  static async getReceivables(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const data = await ReportingService.getReceivables({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      const totalReceivables = data.reduce((sum, inv) => sum + inv.remaining, 0);

      res.json({
        success: true,
        data,
        total: totalReceivables,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des créances',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reports/top-products
   * Top produits
   */
  static async getTopProducts(req: Request, res: Response) {
    try {
      const { startDate, endDate, limit } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Les dates de début et de fin sont requises',
        });
      }

      const data = await ReportingService.getTopProducts({
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        limit: limit ? parseInt(limit as string) : 10,
      });

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du top produits',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reports/entries-exits
   * Entrées/Sorties
   */
  static async getEntriesExits(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Les dates de début et de fin sont requises',
        });
      }

      const data = await ReportingService.getEntriesExits({
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      });

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des entrées/sorties',
        error: error.message,
      });
    }
  }
}

export default ReportingController;

