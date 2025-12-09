import { Request, Response } from 'express';
import LigneBudgetaireService from '../services/ligneBudgetaireService';

export class LigneBudgetaireController {
  /**
   * GET /api/lignes-budgetaires
   * Liste les lignes budgétaires
   */
  static async list(req: Request, res: Response) {
    try {
      const { type, active } = req.query;

      const lignes = await LigneBudgetaireService.list({
        type: type as string,
        active: active === 'true' ? true : active === 'false' ? false : undefined,
      });

      res.json({
        success: true,
        data: lignes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des lignes budgétaires',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/lignes-budgetaires/:id
   * Récupère une ligne budgétaire
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Implémenter getById si nécessaire
      res.json({
        success: true,
        message: 'À implémenter',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/lignes-budgetaires
   * Crée une ligne budgétaire
   */
  static async create(req: Request, res: Response) {
    try {
      const { libelle, code, type } = req.body;

      if (!libelle || !type) {
        return res.status(400).json({
          success: false,
          message: 'Les champs libelle et type sont requis',
        });
      }

      if (type !== 'DEPENSE' && type !== 'RECETTE') {
        return res.status(400).json({
          success: false,
          message: 'Le type doit être DEPENSE ou RECETTE',
        });
      }

      const ligne = await LigneBudgetaireService.create({
        libelle,
        code,
        type,
      });

      res.status(201).json({
        success: true,
        message: 'Ligne budgétaire créée avec succès',
        data: ligne,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('existe déjà') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la création de la ligne budgétaire',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/lignes-budgetaires/:id
   * Met à jour une ligne budgétaire
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const ligne = await LigneBudgetaireService.update(id, updateData);

      res.json({
        success: true,
        message: 'Ligne budgétaire mise à jour avec succès',
        data: ligne,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvée') ||
                        error.message.includes('existe déjà')
        ? 400
        : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/lignes-budgetaires/:id
   * Supprime une ligne budgétaire
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await LigneBudgetaireService.delete(id);

      res.json({
        success: true,
        message: 'Ligne budgétaire supprimée avec succès',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvée') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la suppression',
        error: error.message,
      });
    }
  }
}

export default LigneBudgetaireController;

