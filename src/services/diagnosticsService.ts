import { supabase } from './supabase';

export interface DiagnosticCIM10 {
  id: string;
  code: string;
  libelle: string;
  chapitre?: string;
  favori?: boolean;
  interdit?: boolean;
}

/**
 * Service pour la recherche et gestion des diagnostics CIM-10
 */
export class DiagnosticsService {
  /**
   * Recherche de diagnostics CIM-10 par code ou libellé
   */
  static async searchDiagnostics(query: string, limit: number = 20): Promise<DiagnosticCIM10[]> {
    try {
      const { data, error } = await supabase
        .from('diagnostics_cim10')
        .select('*')
        .or(`code.ilike.%${query}%,libelle.ilike.%${query}%`)
        .eq('actif', true)
        .order('libelle', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Erreur lors de la recherche de diagnostics:', error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        code: item.code,
        libelle: item.libelle,
        chapitre: item.chapitre,
        favori: false,
        interdit: false,
      }));
    } catch (error) {
      console.error('Erreur dans DiagnosticsService.searchDiagnostics:', error);
      return [];
    }
  }

  /**
   * Récupère les diagnostics favoris
   */
  static async getFavoris(): Promise<DiagnosticCIM10[]> {
    try {
      // Pour les favoris, on récupère depuis diagnostics_favoris ou on peut utiliser une logique différente
      // Pour l'instant, on retourne les diagnostics les plus utilisés ou une liste vide
      const { data, error } = await supabase
        .from('diagnostics_cim10')
        .select('*')
        .eq('actif', true)
        .order('libelle', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Erreur lors de la récupération des favoris:', error);
        throw error;
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        code: item.code,
        libelle: item.libelle,
        chapitre: item.chapitre,
        favori: true,
      }));
    } catch (error) {
      console.error('Erreur dans DiagnosticsService.getFavoris:', error);
      return [];
    }
  }

  /**
   * Récupère un diagnostic par code CIM-10
   */
  static async getDiagnosticByCode(code: string): Promise<DiagnosticCIM10 | null> {
    try {
      const { data, error } = await supabase
        .from('diagnostics_cim10')
        .select('*')
        .eq('code', code)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Aucun résultat
        }
        console.error('Erreur lors de la récupération du diagnostic:', error);
        throw error;
      }

      return {
        id: data.id,
        code: data.code,
        libelle: data.libelle,
        chapitre: data.chapitre,
        favori: false, // À implémenter avec diagnostics_favoris si nécessaire
        interdit: false,
      };
    } catch (error) {
      console.error('Erreur dans DiagnosticsService.getDiagnosticByCode:', error);
      return null;
    }
  }
}

