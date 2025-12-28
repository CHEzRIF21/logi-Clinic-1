import { Consultation, ConsultationConstantes } from './consultationService';
import { supabase } from './supabase';

export interface ConsultationEntry {
  id: string;
  consult_id: string;
  section: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data_before?: any;
  data_after?: any;
  annotation?: string;
  utilisateur_id: string;
  created_at: string;
}

export interface ConsultationTemplate {
  id: string;
  nom: string;
  specialite: string;
  actif: boolean;
  structure?: any;
}

export const ConsultationApiService = {
  /**
   * Récupérer les templates de consultation
   */
  async getTemplates(): Promise<ConsultationTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('consultation_templates')
        .select('*')
        .eq('actif', true);

      if (error) {
        console.error('Erreur récupération templates:', error);
        // Retourner un tableau vide si la table n'existe pas encore
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Table consultation_templates n\'existe pas encore, retour d\'un tableau vide');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (err: any) {
      console.error('Erreur lors de la récupération des templates:', err);
      // Retourner un tableau vide en cas d'erreur pour ne pas bloquer l'interface
      return [];
    }
  },

  /**
   * Récupérer les dernières consultations d'un patient
   */
  async getPatientConsultations(patientId: string): Promise<Consultation[]> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupérer l'historique d'une consultation
   */
  async getConsultationHistory(consultationId: string): Promise<ConsultationEntry[]> {
    const { data, error } = await supabase
      .from('consultation_entries')
      .select('*')
      .eq('consult_id', consultationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

export interface PrescriptionLine {
  id?: string;
  prescription_id?: string;
  medicament_id?: string;
  nom_medicament: string;
  posologie: string;
  quantite_totale: number;
  duree_jours?: number;
  mode_administration?: string;
  instructions?: string;
}

export interface ImagingRequest {
  id: string;
  consultation_id: string;
  patient_id: string;
  type_examen: string;
  details?: string;
  statut: 'en_attente' | 'preleve' | 'termine' | 'annule';
  created_at: string;
}

// Re-export types for compatibility
export type { Consultation, ConsultationConstantes };

