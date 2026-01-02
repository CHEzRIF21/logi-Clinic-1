import { Request, Response } from 'express';
import AnamneseTemplateService from '../services/anamneseTemplateService';

export class AnamneseTemplateController {
  /**
   * GET /api/anamnese-templates
   * Récupère tous les templates d'anamnèse
   */
  static async getAll(req: Request, res: Response) {
    try {
      const { categorie } = req.query;
      // Récupérer clinic_id depuis les headers ou le token si disponible
      const clinicId = (req as any).clinicId || req.headers['x-clinic-id'] as string | undefined;

      const templates = await AnamneseTemplateService.getTemplates(
        categorie as string | undefined,
        clinicId
      );

      res.json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des templates',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/anamnese-templates/:id
   * Récupère un template par ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await AnamneseTemplateService.getTemplateById(id);

      res.json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération du template',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/anamnese-templates
   * Crée un nouveau template
   */
  static async create(req: Request, res: Response) {
    try {
      const { nom, contenu, categorie, actif, clinic_id } = req.body;
      
      // Récupérer userId depuis le token si disponible
      const userId = (req as any).userId || (req as any).user?.id;

      if (!nom || !contenu) {
        return res.status(400).json({
          success: false,
          message: 'Le nom et le contenu sont requis',
        });
      }

      const template = await AnamneseTemplateService.createTemplate(
        {
          nom,
          contenu,
          categorie,
          actif,
          clinic_id: clinic_id || (req as any).clinicId || req.headers['x-clinic-id'] as string | undefined,
        },
        userId
      );

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du template',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/anamnese-templates/:id
   * Met à jour un template
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nom, contenu, categorie, actif, clinic_id } = req.body;

      const template = await AnamneseTemplateService.updateTemplate(id, {
        nom,
        contenu,
        categorie,
        actif,
        clinic_id,
      });

      res.json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du template',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/anamnese-templates/:id
   * Supprime un template (soft delete)
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await AnamneseTemplateService.deleteTemplate(id);

      res.json({
        success: true,
        message: 'Template supprimé avec succès',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la suppression du template',
        error: error.message,
      });
    }
  }
}

export default AnamneseTemplateController;

