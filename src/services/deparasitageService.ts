import { supabase } from './supabase';
import { getMyClinicId } from './clinicService';

export interface Deparasitage {
  id: string;
  patient_id: string;
  clinic_id: string;
  molecule: string;
  date_administration: string;
  dose?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DeparasitageFormData {
  patient_id: string;
  molecule: string;
  date_administration: string;
  dose?: string;
}

export class DeparasitageService {
  /**
   * Récupérer l'historique de déparasitage d'un patient
   */
  static async getPatientDeparasitage(
    patientId: string,
    limit: number = 50
  ): Promise<Deparasitage[]> {
    const { data, error } = await supabase
      .from('patient_deparasitage')
      .select('*')
      .eq('patient_id', patientId)
      .order('date_administration', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur lors de la récupération du déparasitage:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Enregistrer un nouveau déparasitage
   */
  static async recordDeparasitage(data: DeparasitageFormData): Promise<Deparasitage> {
    const clinicId = await getMyClinicId();
    
    const { data: result, error } = await supabase
      .from('patient_deparasitage')
      .insert({
        ...data,
        clinic_id: clinicId,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'enregistrement du déparasitage:', error);
      throw error;
    }

    return result;
  }

  /**
   * Mettre à jour un déparasitage
   */
  static async updateDeparasitage(
    id: string,
    data: Partial<DeparasitageFormData>
  ): Promise<Deparasitage> {
    const { data: result, error } = await supabase
      .from('patient_deparasitage')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du déparasitage:', error);
      throw error;
    }

    return result;
  }

  /**
   * Supprimer un déparasitage
   */
  static async deleteDeparasitage(id: string): Promise<void> {
    const { error } = await supabase
      .from('patient_deparasitage')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression du déparasitage:', error);
      throw error;
    }
  }
}
