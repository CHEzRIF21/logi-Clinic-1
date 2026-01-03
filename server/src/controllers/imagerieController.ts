import { Request, Response } from 'express';
import ImagerieService from '../services/imagerieService';

export class ImagerieController {
  /**
   * GET /api/imagerie/requests
   * Liste des demandes d'imagerie
   */
  static async getDemandes(req: Request, res: Response) {
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

      const result = await ImagerieService.getDemandes({
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
        data: result.demandes,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des demandes',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/imagerie/requests/:id
   * Récupère une demande par ID
   */
  static async getDemandeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const demande = await ImagerieService.getDemandeById(id);

      res.json({
        success: true,
        data: demande,
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
   * POST /api/imagerie/requests
   * Crée une demande d'imagerie
   */
  static async createDemande(req: Request, res: Response) {
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
        type,
        examens,
        priorite,
        indication_clinique,
        notes,
      } = req.body;

      if (!patient_id || !medecin_id || !examens || examens.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Les champs patient_id, medecin_id et examens sont requis',
        });
      }

      const demande = await ImagerieService.createDemande({
        patient_id,
        consultation_id,
        medecin_id,
        clinic_id: clinicId, // Utiliser depuis req.user
        type: type || 'INTERNE',
        examens,
        priorite,
        indication_clinique,
        notes,
      });

      res.status(201).json({
        success: true,
        message: 'Demande créée avec succès',
        data: demande,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/imagerie/requests/:id/status
   * Met à jour le statut d'une demande
   */
  static async updateDemandeStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Le statut est requis',
        });
      }

      const demande = await ImagerieService.updateDemandeStatus(id, status, notes);

      res.json({
        success: true,
        message: 'Statut mis à jour',
        data: demande,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/imagerie/examens
   * Liste des examens
   */
  static async getExamens(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const { demande_id, status } = req.query;

      const examens = await ImagerieService.getExamens({
        demande_id: demande_id as string,
        clinic_id: clinicId, // Utiliser depuis req.user
        status: status as string,
      });

      res.json({
        success: true,
        data: examens,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/imagerie/examens/:id
   * Récupère un examen par ID
   */
  static async getExamenById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const examen = await ImagerieService.getExamenById(id);

      res.json({
        success: true,
        data: examen,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/imagerie/examens
   * Crée un examen
   */
  static async createExamen(req: Request, res: Response) {
    try {
      const {
        demande_id,
        type_examen,
        modalite,
        region_anatomique,
        technicien_id,
      } = req.body;

      if (!demande_id || !type_examen || !modalite) {
        return res.status(400).json({
          success: false,
          message: 'Les champs demande_id, type_examen et modalite sont requis',
        });
      }

      const examen = await ImagerieService.createExamen({
        demande_id,
        type_examen,
        modalite,
        region_anatomique,
        technicien_id,
      });

      res.status(201).json({
        success: true,
        message: 'Examen créé',
        data: examen,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/imagerie/examens/:id/images
   * Récupère les images d'un examen
   */
  static async getImages(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const images = await ImagerieService.getImages(id);

      res.json({
        success: true,
        data: images,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/imagerie/examens/:id/images
   * Ajoute une image à un examen
   */
  static async addImage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { url, nom_fichier, type_fichier, taille, annotations } = req.body;

      if (!url || !nom_fichier || !type_fichier) {
        return res.status(400).json({
          success: false,
          message: 'Les champs url, nom_fichier et type_fichier sont requis',
        });
      }

      const image = await ImagerieService.addImage(id, {
        url,
        nom_fichier,
        type_fichier,
        taille,
        annotations,
      });

      res.status(201).json({
        success: true,
        message: 'Image ajoutée',
        data: image,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/imagerie/examens/:id/rapport
   * Crée un rapport d'interprétation
   */
  static async createRapport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { contenu, conclusion, radiologue_id } = req.body;

      if (!contenu || !conclusion || !radiologue_id) {
        return res.status(400).json({
          success: false,
          message: 'Les champs contenu, conclusion et radiologue_id sont requis',
        });
      }

      const rapport = await ImagerieService.createRapport({
        examen_id: id,
        contenu,
        conclusion,
        radiologue_id,
      });

      res.status(201).json({
        success: true,
        message: 'Rapport créé',
        data: rapport,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/imagerie/catalogue
   * Catalogue des examens d'imagerie
   */
  static async getCatalogue(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const catalogue = await ImagerieService.getCatalogueExamens(clinicId);

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

  /**
   * GET /api/imagerie/stats
   * Statistiques d'imagerie
   */
  static async getStats(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique manquant',
        });
      }

      const stats = await ImagerieService.getStats(clinicId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default ImagerieController;

