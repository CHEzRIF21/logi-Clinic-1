import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export class ConfigurationController {
  /**
   * GET /api/configurations/billing
   * Récupère la configuration de facturation de la clinique
   */
  static async getBillingSettings(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const clinicId = req.user?.clinic_id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique manquant',
        });
      }

      if (!supabaseAdmin) {
        return res.status(500).json({
          success: false,
          message: 'Service Supabase non configuré',
        });
      }

      const { data, error } = await supabaseAdmin
        .from('configurations_facturation')
        .select('*')
        .eq('clinic_id', clinicId)
        .maybeSingle();

      if (error) {
        console.error('Erreur récupération configuration:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération de la configuration',
          error: error.message,
        });
      }

      // Si pas de configuration, retourner valeurs par défaut
      if (!data) {
        return res.json({
          success: true,
          data: {
            clinic_id: clinicId,
            paiement_obligatoire_avant_consultation: false,
            blocage_automatique_impaye: true,
            paiement_plusieurs_temps: true,
            exception_urgence_medecin: true,
            actes_defaut_consultation: [],
            actes_defaut_dossier: false,
            actes_defaut_urgence: true,
          },
        });
      }

      return res.json({
        success: true,
        data: {
          ...data,
          actes_defaut_consultation: Array.isArray(data.actes_defaut_consultation)
            ? data.actes_defaut_consultation
            : [],
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la configuration',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/configurations/billing
   * Met à jour la configuration de facturation
   */
  static async updateBillingSettings(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const clinicId = req.user?.clinic_id;
      const userId = req.user?.id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Contexte de clinique manquant',
        });
      }

      if (!supabaseAdmin) {
        return res.status(500).json({
          success: false,
          message: 'Service Supabase non configuré',
        });
      }

      const {
        paiement_obligatoire_avant_consultation,
        blocage_automatique_impaye,
        paiement_plusieurs_temps,
        exception_urgence_medecin,
        actes_defaut_consultation,
        actes_defaut_dossier,
        actes_defaut_urgence,
      } = req.body;

      // Vérifier si une configuration existe déjà
      const { data: existing } = await supabaseAdmin
        .from('configurations_facturation')
        .select('id')
        .eq('clinic_id', clinicId)
        .maybeSingle();

      const configData: any = {
        clinic_id: clinicId,
        paiement_obligatoire_avant_consultation: paiement_obligatoire_avant_consultation ?? false,
        blocage_automatique_impaye: blocage_automatique_impaye ?? true,
        paiement_plusieurs_temps: paiement_plusieurs_temps ?? true,
        exception_urgence_medecin: exception_urgence_medecin ?? true,
        actes_defaut_consultation: actes_defaut_consultation || [],
        actes_defaut_dossier: actes_defaut_dossier ?? false,
        actes_defaut_urgence: actes_defaut_urgence ?? true,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existing) {
        // Mettre à jour
        const { data, error } = await supabaseAdmin
          .from('configurations_facturation')
          .update(configData)
          .eq('clinic_id', clinicId)
          .select()
          .single();

        if (error) {
          console.error('Erreur mise à jour configuration:', error);
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la configuration',
            error: error.message,
          });
        }
        result = data;
      } else {
        // Créer
        configData.created_by = userId;
        const { data, error } = await supabaseAdmin
          .from('configurations_facturation')
          .insert(configData)
          .select()
          .single();

        if (error) {
          console.error('Erreur création configuration:', error);
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la configuration',
            error: error.message,
          });
        }
        result = data;
      }

      return res.json({
        success: true,
        message: 'Configuration mise à jour avec succès',
        data: {
          ...result,
          actes_defaut_consultation: Array.isArray(result.actes_defaut_consultation)
            ? result.actes_defaut_consultation
            : [],
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la configuration',
        error: error.message,
      });
    }
  }
}

export default ConfigurationController;

