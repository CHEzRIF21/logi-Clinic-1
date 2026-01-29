import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ClinicContextRequest } from '../middleware/clinicContext';
import OperationService from '../services/operationService';

export class OperationController {
  /**
   * GET /api/operations
   * Liste les opérations avec filtres
   * ✅ CORRIGÉ: Filtre par clinic_id pour isolation multi-tenant
   */
  static async list(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      const { patientId, month, status } = req.query;

      const filters: any = {
        clinicId: clinicReq.clinicId,        // ✅ AJOUTER
        isSuperAdmin: clinicReq.isSuperAdmin, // ✅ AJOUTER
      };
      
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
   * ✅ CORRIGÉ: Vérifie que le patient appartient à la clinique et assigne clinic_id
   */
  static async create(req: AuthRequest, res: Response): Promise<Response | void> {
    try {
      const clinicReq = req as ClinicContextRequest;
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
        createdBy: createdBy || clinicReq.user?.id,
        clinicId: clinicReq.clinicId, // ✅ AJOUTER - Vérification dans le service
      });

      return res.status(201).json({
        success: true,
        message: 'Opération créée avec succès',
        data: operation,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ||
                        error.message.includes('n\'appartient pas') ||
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
   * ✅ CORRIGÉ: Vérifie que l'opération appartient à la clinique
   */
  static async getById(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      const { id } = req.params;

      const operation = await OperationService.getOperationById(id, {
        clinicId: clinicReq.clinicId,
        isSuperAdmin: clinicReq.isSuperAdmin,
      });

      res.json({
        success: true,
        data: operation,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvée') || 
                        error.message.includes('non autorisé') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération de l\'opération',
        error: error.message,
      });
    }
  }
}

export default OperationController;

