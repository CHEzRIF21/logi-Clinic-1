import { Request, Response } from 'express';
import { PricingService } from '../services/pricingService';
import { AuthRequest } from '../middleware/auth';

export class PricingController {
  /**
   * GET /api/clinics/:id/pricing
   * Récupère tous les tarifs d'une clinique
   */
  static async getClinicPricing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pricing = await PricingService.getClinicPricing(id);

      res.json({
        success: true,
        data: pricing,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des tarifs',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/clinics/:id/pricing/summary
   * Récupère un résumé des tarifs d'une clinique (avec tarifs par défaut)
   */
  static async getClinicPricingSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const summary = await PricingService.getClinicPricingSummary(id);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du résumé des tarifs',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/clinics/:id/pricing
   * Crée ou met à jour un tarif pour une clinique
   */
  static async upsertPricing(req: AuthRequest, res: Response) {
    try {
      const { id: clinicId } = req.params;
      const { serviceId, tarifBase, unite, active } = req.body;

      if (!serviceId || tarifBase === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Le serviceId et le tarifBase sont requis',
        });
      }

      if (tarifBase < 0) {
        return res.status(400).json({
          success: false,
          message: 'Le tarif doit être supérieur ou égal à 0',
        });
      }

      const pricing = await PricingService.upsertPricing(
        {
          clinicId,
          serviceId,
          tarifBase,
          unite,
          active,
        },
        req.user?.id
      );

      res.json({
        success: true,
        data: pricing,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la sauvegarde du tarif',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/clinics/:id/pricing/:serviceId
   * Supprime un tarif spécifique à une clinique
   */
  static async deletePricing(req: AuthRequest, res: Response) {
    try {
      const { id: clinicId, serviceId } = req.params;
      await PricingService.deleteClinicPricing(clinicId, serviceId);

      res.json({
        success: true,
        message: 'Tarif supprimé avec succès',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la suppression du tarif',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/clinics/:id/pricing/history
   * Récupère l'historique des tarifs d'une clinique
   */
  static async getPricingHistory(req: Request, res: Response) {
    try {
      const { id: clinicId } = req.params;
      const { serviceId } = req.query;

      const history = await PricingService.getPricingHistory(
        clinicId,
        serviceId as string | undefined
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'historique',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/pricing/default
   * Récupère tous les tarifs par défaut du système
   */
  static async getDefaultPricing(req: Request, res: Response) {
    try {
      const pricing = await PricingService.getDefaultPricing();

      res.json({
        success: true,
        data: pricing,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des tarifs par défaut',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/pricing/default/:serviceId
   * Met à jour un tarif par défaut au niveau système
   */
  static async updateDefaultPricing(req: AuthRequest, res: Response) {
    try {
      const { serviceId } = req.params;
      const { tarifDefaut } = req.body;

      if (tarifDefaut === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Le tarifDefaut est requis',
        });
      }

      if (tarifDefaut < 0) {
        return res.status(400).json({
          success: false,
          message: 'Le tarif doit être supérieur ou égal à 0',
        });
      }

      await PricingService.updateDefaultPricing(serviceId, tarifDefaut);

      res.json({
        success: true,
        message: 'Tarif par défaut mis à jour avec succès',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la mise à jour du tarif par défaut',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/pricing/service/:serviceId
   * Récupère le tarif pour un service et une clinique (utilisé lors de la facturation)
   */
  static async getPricingForService(req: Request, res: Response) {
    try {
      const { serviceId } = req.params;
      const { clinicId } = req.query;

      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Le clinicId est requis',
        });
      }

      const pricing = await PricingService.getPricingForService(
        clinicId as string,
        serviceId
      );

      res.json({
        success: true,
        data: pricing,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du tarif',
        error: error.message,
      });
    }
  }
}

export default PricingController;

