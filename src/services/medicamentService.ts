import { supabase, MedicamentSupabase, MedicamentFormData } from './stockSupabase';
import { MedicamentIdGenerator } from '../utils/medicamentIdGenerator';
import { getMyClinicId } from './clinicService';

export class MedicamentService {
  // Récupérer tous les médicaments (globaux + spécifiques à la clinique)
  static async getAllMedicaments(): Promise<MedicamentSupabase[]> {
    try {
      const clinicId = await getMyClinicId();
      
      // Récupérer les médicaments globaux (clinic_id IS NULL) ET les médicaments de la clinique
      let query = supabase
        .from('medicaments')
        .select('*');
      
      if (clinicId) {
        // Inclure les médicaments globaux (clinic_id IS NULL) ET les médicaments de la clinique
        query = query.or(`clinic_id.is.null,clinic_id.eq.${clinicId}`);
      } else {
        // Si pas de clinic_id, récupérer uniquement les médicaments globaux
        query = query.is('clinic_id', null);
      }
      
      const { data, error } = await query.order('nom', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des médicaments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getAllMedicaments:', error);
      throw error;
    }
  }

  // Récupérer un médicament par ID
  static async getMedicamentById(id: string): Promise<MedicamentSupabase | null> {
    try {
      const { data, error } = await supabase
        .from('medicaments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du médicament:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans getMedicamentById:', error);
      throw error;
    }
  }

  // Récupérer un médicament par code
  static async getMedicamentByCode(code: string): Promise<MedicamentSupabase | null> {
    try {
      const { data, error } = await supabase
        .from('medicaments')
        .select('*')
        .eq('code', code)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du médicament:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans getMedicamentByCode:', error);
      throw error;
    }
  }

  // Rechercher des médicaments (globaux + spécifiques à la clinique)
  static async searchMedicaments(query: string): Promise<MedicamentSupabase[]> {
    try {
      const clinicId = await getMyClinicId();
      
      // Rechercher dans les médicaments globaux (clinic_id IS NULL) ET les médicaments de la clinique
      let searchQuery = supabase
        .from('medicaments')
        .select('*')
        .or(`nom.ilike.%${query}%,code.ilike.%${query}%,categorie.ilike.%${query}%`);
      
      if (clinicId) {
        // Inclure les médicaments globaux (clinic_id IS NULL) ET les médicaments de la clinique
        searchQuery = searchQuery.or(`clinic_id.is.null,clinic_id.eq.${clinicId}`);
      } else {
        // Si pas de clinic_id, rechercher uniquement dans les médicaments globaux
        searchQuery = searchQuery.is('clinic_id', null);
      }
      
      const { data, error } = await searchQuery.order('nom', { ascending: true });

      if (error) {
        console.error('Erreur lors de la recherche des médicaments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans searchMedicaments:', error);
      throw error;
    }
  }

  // Créer un nouveau médicament
  static async createMedicament(medicamentData: MedicamentFormData): Promise<MedicamentSupabase> {
    try {
      // Générer automatiquement un ID unique si non fourni
      if (!medicamentData.code || medicamentData.code.trim() === '') {
        const existingIds = await this.getAllMedicamentCodes();
        medicamentData.code = MedicamentIdGenerator.generateId(existingIds);
      }

      const { data, error } = await supabase
        .from('medicaments')
        .insert([medicamentData])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création du médicament:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans createMedicament:', error);
      throw error;
    }
  }

  // Mettre à jour un médicament
  static async updateMedicament(id: string, medicamentData: Partial<MedicamentFormData>): Promise<MedicamentSupabase> {
    try {
      const { data, error } = await supabase
        .from('medicaments')
        .update(medicamentData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du médicament:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans updateMedicament:', error);
      throw error;
    }
  }

  // Supprimer un médicament
  static async deleteMedicament(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('medicaments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du médicament:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur dans deleteMedicament:', error);
      throw error;
    }
  }

  // Récupérer les médicaments par catégorie
  static async getMedicamentsByCategorie(categorie: string): Promise<MedicamentSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('medicaments')
        .select('*')
        .eq('categorie', categorie)
        .order('nom', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des médicaments par catégorie:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getMedicamentsByCategorie:', error);
      throw error;
    }
  }

  // Récupérer les médicaments en rupture de stock
  static async getMedicamentsRupture(): Promise<MedicamentSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('medicaments')
        .select(`
          *,
          lots!inner(quantite_disponible)
        `)
        .eq('lots.quantite_disponible', 0)
        .order('nom', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des médicaments en rupture:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getMedicamentsRupture:', error);
      throw error;
    }
  }

  // Récupérer les médicaments avec stock faible
  static async getMedicamentsStockFaible(): Promise<MedicamentSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('medicaments')
        .select(`
          *,
          lots!inner(quantite_disponible)
        `)
        .lte('lots.quantite_disponible', 'medicaments.seuil_alerte')
        .order('nom', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des médicaments avec stock faible:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getMedicamentsStockFaible:', error);
      throw error;
    }
  }

  // Compter le nombre total de médicaments
  static async getMedicamentsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('medicaments')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Erreur lors du comptage des médicaments:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Erreur dans getMedicamentsCount:', error);
      throw error;
    }
  }

  // Récupérer tous les codes de médicaments existants
  static async getAllMedicamentCodes(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('medicaments')
        .select('code')
        .order('code', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des codes:', error);
        throw error;
      }

      return data?.map(med => med.code) || [];
    } catch (error) {
      console.error('Erreur dans getAllMedicamentCodes:', error);
      throw error;
    }
  }

  // Récupérer les statistiques des médicaments
  static async getMedicamentStats() {
    try {
      const { data: medicaments, error: medicamentsError } = await supabase
        .from('medicaments')
        .select('categorie, prescription_requise');

      if (medicamentsError) {
        throw medicamentsError;
      }

      const { data: lots, error: lotsError } = await supabase
        .from('lots')
        .select('quantite_disponible, prix_achat, statut, date_expiration');

      if (lotsError) {
        throw lotsError;
      }

      const { data: alertes, error: alertesError } = await supabase
        .from('alertes_stock')
        .select('statut, type');

      if (alertesError) {
        throw alertesError;
      }

      const stats = {
        total: medicaments?.length || 0,
        parCategorie: medicaments?.reduce((acc: any, med) => {
          acc[med.categorie] = (acc[med.categorie] || 0) + 1;
          return acc;
        }, {}) || {},
        parPrescription: {
          avec_prescription: medicaments?.filter(m => m.prescription_requise).length || 0,
          sans_prescription: medicaments?.filter(m => !m.prescription_requise).length || 0,
        },
        parStatutLot: {
          actif: lots?.filter(l => l.statut === 'actif').length || 0,
          expire: lots?.filter(l => l.statut === 'expire').length || 0,
          epuise: lots?.filter(l => l.statut === 'epuise').length || 0,
        },
        alertes: {
          actives: alertes?.filter(a => a.statut === 'active').length || 0,
          resolues: alertes?.filter(a => a.statut === 'resolue').length || 0,
          parType: alertes?.reduce((acc: any, alerte) => {
            acc[alerte.type] = (acc[alerte.type] || 0) + 1;
            return acc;
          }, {}) || {},
        },
        valeurStock: lots?.reduce((total, lot) => total + (lot.quantite_disponible * lot.prix_achat), 0) || 0,
      };

      return stats;
    } catch (error) {
      console.error('Erreur dans getMedicamentStats:', error);
      throw error;
    }
  }
}
