import { Request, Response } from 'express';
import LaboratoireService from '../services/laboratoireService';

export class LaboratoireController {
  /**
   * GET /api/laboratoire/prescriptions
   * Liste des prescriptions de laboratoire
   */
  static async getPrescriptions(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique manquant',
        });
      }

      const {
        patient_id,
        status,
        date_debut,
        date_fin,
        page,
        limit,
      } = req.query;

      const result = await LaboratoireService.getPrescriptions({
        clinic_id: clinicId, // Utiliser depuis req.user
        patient_id: patient_id as string,
        status: status as string,
        date_debut: date_debut as string,
        date_fin: date_fin as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: result.prescriptions,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des prescriptions',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/laboratoire/prescriptions/:id
   * Récupère une prescription par ID
   */
  static async getPrescriptionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const prescription = await LaboratoireService.getPrescriptionById(id);

      res.json({
        success: true,
        data: prescription,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/laboratoire/prescriptions
   * Crée une prescription de laboratoire
   */
  static async createPrescription(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique manquant',
        });
      }

      const {
        patient_id,
        consultation_id,
        medecin_id,
        analyses,
        priorite,
        notes_cliniques,
      } = req.body;

      if (!patient_id || !medecin_id || !analyses || analyses.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Les champs patient_id, medecin_id et analyses sont requis',
        });
      }

      const prescription = await LaboratoireService.createPrescription({
        patient_id,
        consultation_id,
        medecin_id,
        clinic_id: clinicId, // Utiliser depuis req.user
        analyses,
        priorite,
        notes_cliniques,
      });

      res.status(201).json({
        success: true,
        message: 'Prescription créée avec succès',
        data: prescription,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/laboratoire/prescriptions/:id/status
   * Met à jour le statut d'une prescription
   */
  static async updatePrescriptionStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Le statut est requis',
        });
      }

      const prescription = await LaboratoireService.updatePrescriptionStatus(id, status, notes);

      res.json({
        success: true,
        message: 'Statut mis à jour',
        data: prescription,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/laboratoire/analyses
   * Liste des analyses
   */
  static async getAnalyses(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const { prescription_id, status } = req.query;

      const analyses = await LaboratoireService.getAnalyses({
        prescription_id: prescription_id as string,
        clinic_id: clinicId, // Utiliser depuis req.user
        status: status as string,
      });

      res.json({
        success: true,
        data: analyses,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/laboratoire/analyses
   * Crée une analyse
   */
  static async createAnalyse(req: Request, res: Response) {
    try {
      const {
        prescription_id,
        code_analyse,
        nom_analyse,
        categorie,
        tarif,
      } = req.body;

      if (!prescription_id || !code_analyse || !nom_analyse) {
        return res.status(400).json({
          success: false,
          message: 'Les champs prescription_id, code_analyse et nom_analyse sont requis',
        });
      }

      const analyse = await LaboratoireService.createAnalyse({
        prescription_id,
        code_analyse,
        nom_analyse,
        categorie,
        tarif,
      });

      res.status(201).json({
        success: true,
        message: 'Analyse créée',
        data: analyse,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/laboratoire/resultats
   * Liste des résultats
   */
  static async getResultats(req: Request, res: Response) {
    try {
      const { analyse_id, prescription_id, patient_id } = req.query;

      const resultats = await LaboratoireService.getResultats({
        analyse_id: analyse_id as string,
        prescription_id: prescription_id as string,
        patient_id: patient_id as string,
      });

      res.json({
        success: true,
        data: resultats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/laboratoire/resultats
   * Valide un résultat
   */
  static async validerResultat(req: Request, res: Response) {
    try {
      const {
        analyse_id,
        valeur,
        unite,
        valeur_reference_min,
        valeur_reference_max,
        interpretation,
        validateur_id,
      } = req.body;

      if (!analyse_id || !valeur || !validateur_id) {
        return res.status(400).json({
          success: false,
          message: 'Les champs analyse_id, valeur et validateur_id sont requis',
        });
      }

      const resultat = await LaboratoireService.validerResultat({
        analyse_id,
        valeur,
        unite,
        valeur_reference_min,
        valeur_reference_max,
        interpretation,
        validateur_id,
      });

      res.json({
        success: true,
        message: 'Résultat validé',
        data: resultat,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/laboratoire/integrations
   * Informations d'intégration
   */
  static async getIntegrations(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique manquant',
        });
      }

      const integrations = await LaboratoireService.getIntegrations(clinicId);

      res.json({
        success: true,
        data: integrations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/laboratoire/catalogue
   * Catalogue des analyses
   */
  static async getCatalogue(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const catalogue = await LaboratoireService.getCatalogueAnalyses(clinicId);

      res.json({
        success: true,
        data: catalogue,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default LaboratoireController;

