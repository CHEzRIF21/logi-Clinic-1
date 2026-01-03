import { Request, Response } from 'express';
import MaterniteService from '../services/materniteService';

export class MaterniteController {
  /**
   * GET /api/maternite/dossiers
   * Liste des dossiers obstétricaux
   */
  static async getDossiers(req: Request, res: Response) {
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
        page,
        limit,
      } = req.query;

      const result = await MaterniteService.getDossiers({
        clinic_id: clinicId, // Utiliser depuis req.user
        patient_id: patient_id as string,
        status: status as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: result.dossiers,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des dossiers',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/maternite/dossiers/:id
   * Récupère un dossier par ID
   */
  static async getDossierById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dossier = await MaterniteService.getDossierById(id);

      res.json({
        success: true,
        data: dossier,
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
   * POST /api/maternite/dossiers
   * Crée un dossier obstétrical
   */
  static async createDossier(req: Request, res: Response) {
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
        date_derniere_regles,
        date_prevue_accouchement,
        gestite,
        parite,
        antecedents_obstetricaux,
        conjoint,
        sage_femme_id,
      } = req.body;

      if (!patient_id) {
        return res.status(400).json({
          success: false,
          message: 'Le champ patient_id est requis',
        });
      }

      const dossier = await MaterniteService.createDossier({
        patient_id,
        clinic_id: clinicId, // Utiliser depuis req.user
        date_derniere_regles,
        date_prevue_accouchement,
        gestite,
        parite,
        antecedents_obstetricaux,
        conjoint,
        sage_femme_id,
      });

      res.status(201).json({
        success: true,
        message: 'Dossier créé avec succès',
        data: dossier,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/maternite/dossiers/:id
   * Met à jour un dossier
   */
  static async updateDossier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dossier = await MaterniteService.updateDossier(id, req.body);

      res.json({
        success: true,
        message: 'Dossier mis à jour',
        data: dossier,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/maternite/cpn
   * Liste des consultations prénatales
   */
  static async getCPNs(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const {
        dossier_id,
        patient_id,
        page,
        limit,
      } = req.query;

      const result = await MaterniteService.getCPNs({
        dossier_id: dossier_id as string,
        patient_id: patient_id as string,
        clinic_id: clinicId, // Utiliser depuis req.user
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: result.cpns,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/maternite/cpn/:id
   * Récupère une CPN par ID
   */
  static async getCPNById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cpn = await MaterniteService.getCPNById(id);

      res.json({
        success: true,
        data: cpn,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/maternite/cpn
   * Crée une consultation prénatale
   */
  static async createCPN(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique manquant',
        });
      }

      const {
        dossier_id,
        patient_id,
        numero_cpn,
        trimestre,
        date_cpn,
        poids,
        tension_arterielle,
        hauteur_uterine,
        presentation,
        bruits_coeur_foetal,
        mouvements_actifs,
        examens_demandes,
        vaccinations,
        traitements,
        conseils,
        prochain_rdv,
        sage_femme_id,
      } = req.body;

      if (!dossier_id || !patient_id || !numero_cpn || !sage_femme_id) {
        return res.status(400).json({
          success: false,
          message: 'Les champs dossier_id, patient_id, numero_cpn et sage_femme_id sont requis',
        });
      }

      const cpn = await MaterniteService.createCPN({
        dossier_id,
        patient_id,
        clinic_id: clinicId, // Utiliser depuis req.user
        numero_cpn,
        trimestre: trimestre || Math.ceil(numero_cpn / 3),
        date_cpn: date_cpn || new Date().toISOString(),
        poids,
        tension_arterielle,
        hauteur_uterine,
        presentation,
        bruits_coeur_foetal,
        mouvements_actifs,
        examens_demandes,
        vaccinations,
        traitements,
        conseils,
        prochain_rdv,
        sage_femme_id,
      });

      res.status(201).json({
        success: true,
        message: 'CPN créée',
        data: cpn,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/maternite/cpn/:id
   * Met à jour une CPN
   */
  static async updateCPN(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cpn = await MaterniteService.updateCPN(id, req.body);

      res.json({
        success: true,
        message: 'CPN mise à jour',
        data: cpn,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/maternite/accouchements
   * Liste des accouchements
   */
  static async getAccouchements(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const {
        dossier_id,
        patient_id,
        date_debut,
        date_fin,
        page,
        limit,
      } = req.query;

      const result = await MaterniteService.getAccouchements({
        dossier_id: dossier_id as string,
        patient_id: patient_id as string,
        clinic_id: clinicId, // Utiliser depuis req.user
        date_debut: date_debut as string,
        date_fin: date_fin as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: result.accouchements,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/maternite/accouchements/:id
   * Récupère un accouchement par ID
   */
  static async getAccouchementById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const accouchement = await MaterniteService.getAccouchementById(id);

      res.json({
        success: true,
        data: accouchement,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/maternite/accouchements
   * Enregistre un accouchement
   */
  static async createAccouchement(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique manquant',
        });
      }

      const {
        dossier_id,
        patient_id,
        date_accouchement,
        heure_accouchement,
        mode_accouchement,
        presentation,
        terme,
        duree_travail,
        complications,
        nouveau_ne,
        equipe_medicale,
        notes,
      } = req.body;

      if (!dossier_id || !patient_id || !date_accouchement || !mode_accouchement) {
        return res.status(400).json({
          success: false,
          message: 'Les champs dossier_id, patient_id, date_accouchement et mode_accouchement sont requis',
        });
      }

      const accouchement = await MaterniteService.createAccouchement({
        dossier_id,
        patient_id,
        clinic_id: clinicId, // Utiliser depuis req.user
        date_accouchement,
        heure_accouchement: heure_accouchement || new Date().toTimeString().slice(0, 5),
        mode_accouchement,
        presentation: presentation || 'cephalique',
        terme,
        duree_travail,
        complications,
        nouveau_ne,
        equipe_medicale,
        notes,
      });

      res.status(201).json({
        success: true,
        message: 'Accouchement enregistré',
        data: accouchement,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/maternite/post-partum
   * Liste des suivis post-partum
   */
  static async getSuiviPostPartum(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const { accouchement_id, patient_id } = req.query;

      const suivis = await MaterniteService.getSuiviPostPartum({
        accouchement_id: accouchement_id as string,
        patient_id: patient_id as string,
        clinic_id: clinicId, // Utiliser depuis req.user
      });

      res.json({
        success: true,
        data: suivis,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/maternite/post-partum
   * Crée un suivi post-partum
   */
  static async createSuiviPostPartum(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique manquant',
        });
      }

      const {
        accouchement_id,
        patient_id,
        date_visite,
        jour_post_partum,
        etat_general,
        temperature,
        tension_arterielle,
        involution_uterine,
        lochies,
        cicatrice,
        allaitement,
        complications,
        nouveau_ne_etat,
        conseils,
        prochain_rdv,
        sage_femme_id,
      } = req.body;

      if (!accouchement_id || !patient_id || !sage_femme_id) {
        return res.status(400).json({
          success: false,
          message: 'Les champs accouchement_id, patient_id et sage_femme_id sont requis',
        });
      }

      const suivi = await MaterniteService.createSuiviPostPartum({
        accouchement_id,
        patient_id,
        clinic_id: clinicId, // Utiliser depuis req.user
        date_visite: date_visite || new Date().toISOString(),
        jour_post_partum: jour_post_partum || 1,
        etat_general,
        temperature,
        tension_arterielle,
        involution_uterine,
        lochies,
        cicatrice,
        allaitement,
        complications,
        nouveau_ne_etat,
        conseils,
        prochain_rdv,
        sage_femme_id,
      });

      res.status(201).json({
        success: true,
        message: 'Suivi post-partum créé',
        data: suivi,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/maternite/stats
   * Statistiques de la maternité
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

      const { date_debut, date_fin } = req.query;

      const stats = await MaterniteService.getStats(
        clinicId, // Utiliser depuis req.user
        date_debut as string,
        date_fin as string
      );

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

export default MaterniteController;

