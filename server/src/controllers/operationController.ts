import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import OperationService from '../services/operationService';

export class OperationController {
  /**
   * GET /api/operations
   * Liste les opérations avec filtres
   */
  static async list(req: Request, res: Response) {
    try {
      const { patientId, month, status } = req.query;

      const filters: any = {};
      if (patientId) filters.patientId = patientId as string;
      if (status) filters.status = status as string;
      if (month) {
        const [year, monthNum] = (month as string).split('-');
        filters.startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        filters.endDate = new Date(parseInt(year), parseInt(monthNum), 0);
      }

      const operations = await OperationService.listOperations(filters);

      res.json({
        success: true,
        data: operations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des opérations',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/operations
   * Crée une nouvelle opération
   */
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { patientId, lines, createdBy } = req.body;

      // Validation
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'L\'ID du patient est requis',
        });
      }

      if (!lines || !Array.isArray(lines) || lines.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Au moins une ligne d\'opération est requise',
        });
      }

      const operation = await OperationService.createOperation({
        patientId,
        lines,
        createdBy: createdBy || req.user?.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Opération créée avec succès',
        data: operation,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ||
                        error.message.includes('requis')
        ? 400
        : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la création de l\'opération',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/operations/:id
   * Récupère une opération par son ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const operation = await OperationService.getOperationById(id);

      res.json({
        success: true,
        data: operation,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvée') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération de l\'opération',
        error: error.message,
      });
    }
  }
}

export default OperationController;

