/**
 * Service de gestion des configurations système
 * Gère les paramètres de facturation et autres configurations par clinique
 */

import { supabase } from './supabase';
import { getMyClinicId } from './clinicService';

export interface BillingConfiguration {
  id?: string;
  clinic_id: string;
  paiement_obligatoire_avant_consultation: boolean;
  blocage_automatique_impaye: boolean;
  paiement_plusieurs_temps: boolean;
  exception_urgence_medecin: boolean;
  actes_defaut_consultation: string[]; // Liste des codes d'actes
  actes_defaut_dossier: boolean;
  actes_defaut_urgence: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface BillingConfigurationUpdate {
  paiement_obligatoire_avant_consultation?: boolean;
  blocage_automatique_impaye?: boolean;
  paiement_plusieurs_temps?: boolean;
  exception_urgence_medecin?: boolean;
  actes_defaut_consultation?: string[];
  actes_defaut_dossier?: boolean;
  actes_defaut_urgence?: boolean;
}

export class ConfigurationService {
  /**
   * Récupère la configuration de facturation de la clinique actuelle
   */
  static async getBillingConfiguration(): Promise<BillingConfiguration | null> {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) {
        throw new Error('Clinic ID non trouvé');
      }

      const { data, error } = await supabase
        .from('configurations_facturation')
        .select('*')
        .eq('clinic_id', clinicId)
        .maybeSingle();

      if (error) {
        console.error('Erreur récupération configuration facturation:', error);
        throw error;
      }

      // Si pas de configuration, retourner null (sera créée à la première mise à jour)
      if (!data) {
        return null;
      }

      // Convertir actes_defaut_consultation de JSONB en array
      const config: BillingConfiguration = {
        ...data,
        actes_defaut_consultation: Array.isArray(data.actes_defaut_consultation)
          ? data.actes_defaut_consultation
          : [],
      };

      return config;
    } catch (error) {
      console.error('Erreur dans getBillingConfiguration:', error);
      throw error;
    }
  }

  /**
   * Met à jour ou crée la configuration de facturation
   */
  static async updateBillingConfiguration(
    config: BillingConfigurationUpdate
  ): Promise<BillingConfiguration> {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) {
        throw new Error('Clinic ID non trouvé');
      }

      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Vérifier si une configuration existe déjà
      const existing = await this.getBillingConfiguration();

      const configData: any = {
        clinic_id: clinicId,
        ...config,
        updated_at: new Date().toISOString(),
      };

      // Convertir actes_defaut_consultation en JSONB si fourni
      if (config.actes_defaut_consultation !== undefined) {
        configData.actes_defaut_consultation = config.actes_defaut_consultation;
      }

      let result;
      if (existing) {
        // Mettre à jour
        const { data, error } = await supabase
          .from('configurations_facturation')
          .update(configData)
          .eq('clinic_id', clinicId)
          .select()
          .single();

        if (error) {
          console.error('Erreur mise à jour configuration:', error);
          throw error;
        }
        result = data;
      } else {
        // Créer
        configData.created_by = user.id;
        const { data, error } = await supabase
          .from('configurations_facturation')
          .insert(configData)
          .select()
          .single();

        if (error) {
          console.error('Erreur création configuration:', error);
          throw error;
        }
        result = data;
      }

      return {
        ...result,
        actes_defaut_consultation: Array.isArray(result.actes_defaut_consultation)
          ? result.actes_defaut_consultation
          : [],
      };
    } catch (error) {
      console.error('Erreur dans updateBillingConfiguration:', error);
      throw error;
    }
  }

  /**
   * Vérifie si le paiement est obligatoire avant consultation pour la clinique actuelle
   */
  static async isPaymentRequiredBeforeConsultation(): Promise<boolean> {
    try {
      const config = await this.getBillingConfiguration();
      return config?.paiement_obligatoire_avant_consultation ?? false;
    } catch (error) {
      console.error('Erreur vérification paiement obligatoire:', error);
      // En cas d'erreur, retourner false pour ne pas bloquer
      return false;
    }
  }

  /**
   * Récupère les actes par défaut configurés pour une consultation
   */
  static async getDefaultBillingActs(
    typeConsultation: 'generale' | 'specialisee' | 'urgence',
    isUrgent: boolean = false
  ): Promise<string[]> {
    try {
      const config = await this.getBillingConfiguration();
      if (!config) {
        return [];
      }

      const acts: string[] = [];

      // Ajouter l'acte de consultation selon le type
      switch (typeConsultation) {
        case 'generale':
          acts.push('CONS-GEN');
          break;
        case 'specialisee':
          acts.push('CONS-SPEC');
          break;
        case 'urgence':
          acts.push('CONS-URG');
          break;
      }

      // Ajouter les actes configurés par défaut
      if (config.actes_defaut_consultation) {
        acts.push(...config.actes_defaut_consultation);
      }

      // Ajouter dossier si configuré
      if (config.actes_defaut_dossier) {
        acts.push('DOSSIER');
      }

      // Ajouter urgence si configuré et que c'est une urgence
      if (config.actes_defaut_urgence && isUrgent) {
        acts.push('CONS-URG');
      }

      // Retirer les doublons
      return [...new Set(acts)];
    } catch (error) {
      console.error('Erreur récupération actes par défaut:', error);
      return [];
    }
  }

  /**
   * Récupère la configuration complète avec valeurs par défaut si non configurée
   */
  static async getBillingConfigurationWithDefaults(): Promise<BillingConfiguration> {
    const config = await this.getBillingConfiguration();
    
    if (config) {
      return config;
    }

    // Retourner une configuration par défaut
    const clinicId = await getMyClinicId();
    if (!clinicId) {
      throw new Error('Clinic ID non trouvé');
    }

    return {
      clinic_id: clinicId,
      paiement_obligatoire_avant_consultation: false,
      blocage_automatique_impaye: true,
      paiement_plusieurs_temps: true,
      exception_urgence_medecin: true,
      actes_defaut_consultation: [],
      actes_defaut_dossier: false,
      actes_defaut_urgence: true,
    };
  }
}

