import { supabase } from './supabase';

export interface Assurance {
  id: string;
  nom: string;
  taux_couverture_defaut: number; // pourcentage (0..100)
  plafond?: number | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export class AssuranceService {
  static async getAssurancesActives(): Promise<Assurance[]> {
    const { data, error } = await supabase
      .from('assurances')
      .select('*')
      .eq('actif', true)
      .order('nom', { ascending: true });

    if (error) throw error;
    return (data || []) as Assurance[];
  }
}

