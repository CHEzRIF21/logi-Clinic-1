import { Request, Response } from 'express';
import ConsultationService from '../services/consultationService';
import { supabaseAdmin } from '../config/supabase';

export class ConsultationController {
  /**
   * GET /api/consultations
   * Liste des consultations avec filtres
   */
  static async list(req: Request, res: Response): Promise<Response> {
    try {
      // Récupérer clinic_id depuis req.user (ajouté par middleware)
      const clinicId = (req as any).user?.clinic_id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique manquant',
        });
      }

      const {
        patient_id,
        medecin_id,
        status,
        date_debut,
        date_fin,
        page,
        limit,
      } = req.query;

      const result = await ConsultationService.getConsultations({
        clinic_id: clinicId, // Utiliser depuis req.user pour sécurité multi-tenant
        patient_id: patient_id as string,
        medecin_id: medecin_id as string,
        status: status as string,
        date_debut: date_debut as string,
        date_fin: date_fin as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.json({
        success: true,
        data: result.consultations,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des consultations',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/consultations/:id
   * Récupère une consultation par ID
   */
  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const { id } = req.params;
      
      const consultation = await ConsultationService.getConsultationById(id);
      
      // Vérifier que la consultation appartient à la clinique de l'utilisateur
      if (consultation.clinic_id !== clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette consultation',
        });
      }

      return res.json({
        success: true,
        data: consultation,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/consultations
   * Crée une nouvelle consultation
   */
  static async create(req: Request, res: Response): Promise<Response> {
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
        medecin_id,
        motif,
        type_consultation,
        rendez_vous_id,
        urgence,
      } = req.body;

      if (!patient_id || !medecin_id) {
        return res.status(400).json({
          success: false,
          message: 'Les champs patient_id et medecin_id sont requis',
        });
      }

      // Déterminer le type de consultation
      const typeConsultation = type_consultation || (urgence ? 'urgence' : 'generale');
      
      const consultation = await ConsultationService.createConsultation({
        patient_id,
        medecin_id,
        clinic_id: clinicId, // Utiliser depuis req.user pour sécurité
        motif,
        type_consultation: typeConsultation,
        rendez_vous_id,
        urgence,
      });

      // Vérifier si le paiement est obligatoire et créer la facture initiale si nécessaire
      if (supabaseAdmin) {
        try {
          const { data: config } = await supabaseAdmin
            .from('configurations_facturation')
            .select('paiement_obligatoire_avant_consultation')
            .eq('clinic_id', clinicId)
            .maybeSingle();

          if (config?.paiement_obligatoire_avant_consultation) {
            // Créer la facture initiale via la fonction SQL
            const { data: factureId, error: factureError } = await supabaseAdmin.rpc(
              'create_initial_invoice_for_consultation',
              {
                p_consultation_id: consultation.id,
                p_patient_id: patient_id,
                p_clinic_id: clinicId,
                p_type_consultation: typeConsultation,
                p_is_urgent: !!urgence,
              }
            );

            if (factureError) {
              console.error('Erreur création facture initiale:', factureError);
              // Ne pas échouer la création de consultation si la facture échoue
            } else if (factureId) {
              // Mettre à jour la consultation avec l'ID de la facture
              await ConsultationService.updateConsultation(consultation.id, {
                facture_initial_id: factureId,
                statut_paiement: 'en_attente',
              } as any);
            }
          }
        } catch (billingError) {
          console.error('Erreur lors de la création de la facture initiale:', billingError);
          // Ne pas échouer la création de consultation
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Consultation créée avec succès',
        data: consultation,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/consultations/:id
   * Met à jour une consultation
   */
  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const { id } = req.params;
      
      // Vérifier que la consultation appartient à la clinique
      const existing = await ConsultationService.getConsultationById(id);
      if (existing.clinic_id !== clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette consultation',
        });
      }
      
      const consultation = await ConsultationService.updateConsultation(id, req.body);

      return res.json({
        success: true,
        message: 'Consultation mise à jour',
        data: consultation,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/consultations/:id/close
   * Clôture une consultation
   */
  static async close(req: Request, res: Response): Promise<Response> {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const { id } = req.params;
      const { conclusion } = req.body;
      
      // Vérifier que la consultation appartient à la clinique
      const existing = await ConsultationService.getConsultationById(id);
      if (existing.clinic_id !== clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette consultation',
        });
      }

      const consultation = await ConsultationService.closeConsultation(id, conclusion);

      return res.json({
        success: true,
        message: 'Consultation clôturée',
        data: consultation,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/consultations/:id/constantes
   * Récupère les constantes
   */
  static async getConstantes(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const constantes = await ConsultationService.getConstantes(id);

      res.json({
        success: true,
        data: constantes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/consultations/:id/constantes
   * Sauvegarde les constantes
   */
  static async saveConstantes(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const constantes = await ConsultationService.saveConstantes({
        consultation_id: id,
        ...req.body,
      });

      res.json({
        success: true,
        message: 'Constantes sauvegardées',
        data: constantes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/consultations/:id/entries
   * Récupère l'historique
   */
  static async getEntries(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const entries = await ConsultationService.getEntries(id);

      res.json({
        success: true,
        data: entries,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/consultations/:id/entries
   * Ajoute une entrée à l'historique
   */
  static async addEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const entry = await ConsultationService.addEntry(id, req.body);

      res.status(201).json({
        success: true,
        data: entry,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/consultations/:id/protocols
   * Récupère les protocoles
   */
  static async getProtocols(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const protocols = await ConsultationService.getProtocols(id);

      res.json({
        success: true,
        data: protocols,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/consultations/protocols/:protocolId
   * Récupère un protocole par ID
   */
  static async getProtocolById(req: Request, res: Response) {
    try {
      const { protocolId } = req.params;
      const protocol = await ConsultationService.getProtocolById(protocolId);

      res.json({
        success: true,
        data: protocol,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/consultations/:id/protocols
   * Crée un protocole
   */
  static async createProtocol(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const protocol = await ConsultationService.createProtocol({
        consultation_id: id,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Protocole créé',
        data: protocol,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/consultations/prescriptions
   * Liste des prescriptions
   */
  static async getPrescriptions(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const { consultation_id, patient_id } = req.query;

      const prescriptions = await ConsultationService.getPrescriptions({
        consultation_id: consultation_id as string,
        patient_id: patient_id as string,
        clinic_id: clinicId, // Utiliser depuis req.user
      });

      res.json({
        success: true,
        data: prescriptions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/consultations/prescriptions/:prescriptionId
   * Récupère une prescription par ID
   */
  static async getPrescriptionById(req: Request, res: Response) {
    try {
      const { prescriptionId } = req.params;
      const prescription = await ConsultationService.getPrescriptionById(prescriptionId);

      res.json({
        success: true,
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
   * POST /api/consultations/:id/prescriptions
   * Crée une prescription
   */
  static async createPrescription(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const { id } = req.params;
      
      const prescription = await ConsultationService.createPrescription({
        consultation_id: id,
        clinic_id: clinicId, // Utiliser depuis req.user
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Prescription créée',
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
   * GET /api/consultations/lab-requests
   * Liste des demandes de laboratoire
   */
  static async getLabRequests(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const { consultation_id, patient_id } = req.query;

      const requests = await ConsultationService.getLabRequests({
        consultation_id: consultation_id as string,
        patient_id: patient_id as string,
        clinic_id: clinicId, // Utiliser depuis req.user
      });

      res.json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/consultations/:id/lab-requests
   * Crée une demande de laboratoire
   */
  static async createLabRequest(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const { id } = req.params;
      
      const request = await ConsultationService.createLabRequest({
        consultation_id: id,
        clinic_id: clinicId, // Utiliser depuis req.user
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Demande de laboratoire créée',
        data: request,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/consultations/imaging-requests
   * Liste des demandes d'imagerie
   */
  static async getImagingRequests(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const { consultation_id, patient_id } = req.query;

      const requests = await ConsultationService.getImagingRequests({
        consultation_id: consultation_id as string,
        patient_id: patient_id as string,
        clinic_id: clinicId, // Utiliser depuis req.user
      });

      res.json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/consultations/:id/imaging-requests
   * Crée une demande d'imagerie
   */
  static async createImagingRequest(req: Request, res: Response) {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const { id } = req.params;
      
      const request = await ConsultationService.createImagingRequest({
        consultation_id: id,
        clinic_id: clinicId, // Utiliser depuis req.user
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Demande d\'imagerie créée',
        data: request,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/consultations/:id/payment-status
   * Vérifie le statut de paiement d'une consultation
   */
  static async checkPaymentStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      if (!supabaseAdmin) {
        return res.status(500).json({
          success: false,
          message: 'Service Supabase non configuré',
        });
      }
      
      const { data, error } = await supabaseAdmin.rpc('check_consultation_payment_status', {
        p_consultation_id: id,
      });

      if (error) {
        console.error('Erreur vérification statut paiement:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la vérification du statut de paiement',
          error: error.message,
        });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Consultation introuvable',
        });
      }

      const result = data[0];
      return res.json({
        success: true,
        data: {
          statutPaiement: result.statut_paiement,
          peutConsulter: result.peut_consulter,
          message: result.message,
          factureId: result.facture_id,
          montantRestant: result.montant_restant ? parseFloat(result.montant_restant) : 0,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du statut de paiement',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/consultations/:id/authorize-emergency
   * Autorise une consultation d'urgence sans paiement préalable
   */
  static async authorizeEmergencyConsultation(req: Request, res: Response): Promise<Response> {
    try {
      const clinicId = (req as any).user?.clinic_id;
      const userId = (req as any).user?.id;
      const { id } = req.params;
      
      if (!clinicId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique ou utilisateur manquant',
        });
      }

      // Vérifier que la consultation appartient à la clinique
      const existing = await ConsultationService.getConsultationById(id);
      if (existing.clinic_id !== clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette consultation',
        });
      }

      // Vérifier que l'utilisateur est médecin ou admin
      const userRole = (req as any).user?.role;
      if (!['medecin', 'admin', 'super_admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Seuls les médecins et administrateurs peuvent autoriser les consultations d\'urgence',
        });
      }

      // Vérifier la configuration
      if (!supabaseAdmin) {
        return res.status(500).json({
          success: false,
          message: 'Service Supabase non configuré',
        });
      }

      const { data: config } = await supabaseAdmin
        .from('configurations_facturation')
        .select('exception_urgence_medecin')
        .eq('clinic_id', clinicId)
        .maybeSingle();

      if (!config?.exception_urgence_medecin) {
        return res.status(400).json({
          success: false,
          message: 'Les exceptions d\'urgence ne sont pas activées pour cette clinique',
        });
      }

      // Mettre à jour le statut de la consultation
      const consultation = await ConsultationService.updateConsultation(id, {
        statut_paiement: 'urgence_autorisee',
      } as any);

      return res.json({
        success: true,
        message: 'Consultation d\'urgence autorisée',
        data: consultation,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'autorisation de la consultation d\'urgence',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/consultations/stats
   * Statistiques des consultations
   */
  static async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const clinicId = (req as any).user?.clinic_id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique manquant',
        });
      }

      const { date_debut, date_fin } = req.query;

      const stats = await ConsultationService.getStats(
        clinicId, // Utiliser depuis req.user
        date_debut as string,
        date_fin as string
      );

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default ConsultationController;

