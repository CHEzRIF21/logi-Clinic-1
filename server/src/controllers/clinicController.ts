import { Request, Response } from 'express';
import { ClinicService } from '../services/clinicService';
import { AuthRequest } from '../middleware/auth';

export class ClinicController {
  /**
   * GET /api/clinics
   * Liste toutes les cliniques
   */
  static async list(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const clinics = await ClinicService.getAllClinics(includeInactive);

      res.json({
        success: true,
        data: clinics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des cliniques',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/clinics
   * Crée une nouvelle clinique
   */
  static async create(req: AuthRequest, res: Response) {
    try {
      const { code, name, address, phone, email, active } = req.body;

      if (!code || !name) {
        return res.status(400).json({
          success: false,
          message: 'Le code et le nom de la clinique sont requis',
        });
      }

      const clinic = await ClinicService.createClinic({
        code,
        name,
        address,
        phone,
        email,
        active,
      });

      res.status(201).json({
        success: true,
        data: clinic,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la création de la clinique',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/clinics/:id
   * Récupère une clinique par son ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clinic = await ClinicService.getClinicById(id);

      res.json({
        success: true,
        data: clinic,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/clinics/:id
   * Met à jour une clinique
   */
  static async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, address, phone, email, active } = req.body;

      const clinic = await ClinicService.updateClinic(id, {
        name,
        address,
        phone,
        email,
        active,
      });

      res.json({
        success: true,
        data: clinic,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la clinique',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/clinics/:id
   * Supprime une clinique
   */
  static async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await ClinicService.deleteClinic(id);

      res.json({
        success: true,
        message: 'Clinique supprimée avec succès',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la suppression de la clinique',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/clinics/:id/activate
   * Réactive une clinique
   */
  static async activate(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const clinic = await ClinicService.activateClinic(id);

      res.json({
        success: true,
        data: clinic,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de l\'activation de la clinique',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/clinics/:id/deactivate
   * Désactive une clinique
   */
  static async deactivate(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const clinic = await ClinicService.deactivateClinic(id);

      res.json({
        success: true,
        data: clinic,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la désactivation de la clinique',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/clinics/:id/stats
   * Récupère les statistiques d'une clinique
   */
  static async getStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stats = await ClinicService.getClinicStats(id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default ClinicController;

