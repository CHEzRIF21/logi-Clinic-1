import { supabase, MouvementStockSupabase, MouvementStockFormData } from './stockSupabase';

export class MouvementService {
  // Récupérer tous les mouvements
  static async getAllMouvements(): Promise<MouvementStockSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('mouvements_stock')
        .select(`
          *,
          medicaments(nom, code, categorie),
          lots(numero_lot, date_expiration)
        `)
        .order('date_mouvement', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des mouvements:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getAllMouvements:', error);
      throw error;
    }
  }

  // Récupérer un mouvement par ID
  static async getMouvementById(id: string): Promise<MouvementStockSupabase | null> {
    try {
      const { data, error } = await supabase
        .from('mouvements_stock')
        .select(`
          *,
          medicaments(nom, code, categorie),
          lots(numero_lot, date_expiration)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du mouvement:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans getMouvementById:', error);
      throw error;
    }
  }

  // Récupérer les mouvements par médicament
  static async getMouvementsByMedicament(medicamentId: string): Promise<MouvementStockSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('mouvements_stock')
        .select(`
          *,
          medicaments(nom, code, categorie),
          lots(numero_lot, date_expiration)
        `)
        .eq('medicament_id', medicamentId)
        .order('date_mouvement', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des mouvements par médicament:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getMouvementsByMedicament:', error);
      throw error;
    }
  }

  // Récupérer les mouvements par lot
  static async getMouvementsByLot(lotId: string): Promise<MouvementStockSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('mouvements_stock')
        .select(`
          *,
          medicaments(nom, code, categorie),
          lots(numero_lot, date_expiration)
        `)
        .eq('lot_id', lotId)
        .order('date_mouvement', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des mouvements par lot:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getMouvementsByLot:', error);
      throw error;
    }
  }

  // Récupérer les mouvements par type
  static async getMouvementsByType(type: string): Promise<MouvementStockSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('mouvements_stock')
        .select(`
          *,
          medicaments(nom, code, categorie),
          lots(numero_lot, date_expiration)
        `)
        .eq('type', type)
        .order('date_mouvement', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des mouvements par type:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getMouvementsByType:', error);
      throw error;
    }
  }

  // Récupérer les mouvements par période
  static async getMouvementsByPeriode(debut: string, fin: string): Promise<MouvementStockSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('mouvements_stock')
        .select(`
          *,
          medicaments(nom, code, categorie),
          lots(numero_lot, date_expiration)
        `)
        .gte('date_mouvement', debut)
        .lte('date_mouvement', fin)
        .order('date_mouvement', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des mouvements par période:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getMouvementsByPeriode:', error);
      throw error;
    }
  }

  // Rechercher des mouvements
  static async searchMouvements(query: string): Promise<MouvementStockSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('mouvements_stock')
        .select(`
          *,
          medicaments(nom, code, categorie),
          lots(numero_lot, date_expiration)
        `)
        .or(`motif.ilike.%${query}%,medicaments.nom.ilike.%${query}%,medicaments.code.ilike.%${query}%`)
        .order('date_mouvement', { ascending: false });

      if (error) {
        console.error('Erreur lors de la recherche des mouvements:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans searchMouvements:', error);
      throw error;
    }
  }

  // Créer un nouveau mouvement
  static async createMouvement(mouvementData: MouvementStockFormData): Promise<MouvementStockSupabase> {
    try {
      const { data, error } = await supabase
        .from('mouvements_stock')
        .insert([mouvementData])
        .select(`
          *,
          medicaments(nom, code, categorie),
          lots(numero_lot, date_expiration)
        `)
        .single();

      if (error) {
        console.error('Erreur lors de la création du mouvement:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans createMouvement:', error);
      throw error;
    }
  }

  // Mettre à jour un mouvement
  static async updateMouvement(id: string, mouvementData: Partial<MouvementStockFormData>): Promise<MouvementStockSupabase> {
    try {
      const { data, error } = await supabase
        .from('mouvements_stock')
        .update(mouvementData)
        .eq('id', id)
        .select(`
          *,
          medicaments(nom, code, categorie),
          lots(numero_lot, date_expiration)
        `)
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du mouvement:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans updateMouvement:', error);
      throw error;
    }
  }

  // Supprimer un mouvement
  static async deleteMouvement(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('mouvements_stock')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du mouvement:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur dans deleteMouvement:', error);
      throw error;
    }
  }

  // Compter le nombre total de mouvements
  static async getMouvementsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('mouvements_stock')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Erreur lors du comptage des mouvements:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Erreur dans getMouvementsCount:', error);
      throw error;
    }
  }

  // Récupérer les statistiques des mouvements
  static async getMouvementStats() {
    try {
      const { data, error } = await supabase
        .from('mouvements_stock')
        .select('type, quantite, date_mouvement');

      if (error) {
        throw error;
      }

      const aujourdhui = new Date();
      const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);
      const finMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, 0);

      const mouvementsMois = data?.filter(m => {
        const dateMouvement = new Date(m.date_mouvement);
        return dateMouvement >= debutMois && dateMouvement <= finMois;
      }) || [];

      const stats = {
        total: data?.length || 0,
        ce_mois: mouvementsMois.length,
        parType: data?.reduce((acc: any, mouvement) => {
          acc[mouvement.type] = (acc[mouvement.type] || 0) + 1;
          return acc;
        }, {}) || {},
        quantites: {
          total_entrees: data?.filter(m => ['reception', 'retour'].includes(m.type))
            .reduce((total, m) => total + m.quantite, 0) || 0,
          total_sorties: data?.filter(m => ['dispensation', 'perte'].includes(m.type))
            .reduce((total, m) => total + m.quantite, 0) || 0,
          total_transferts: data?.filter(m => m.type === 'transfert')
            .reduce((total, m) => total + m.quantite, 0) || 0,
        },
        ce_mois_quantites: {
          entrees: mouvementsMois.filter(m => ['reception', 'retour'].includes(m.type))
            .reduce((total, m) => total + m.quantite, 0),
          sorties: mouvementsMois.filter(m => ['dispensation', 'perte'].includes(m.type))
            .reduce((total, m) => total + m.quantite, 0),
          transferts: mouvementsMois.filter(m => m.type === 'transfert')
            .reduce((total, m) => total + m.quantite, 0),
        },
      };

      return stats;
    } catch (error) {
      console.error('Erreur dans getMouvementStats:', error);
      throw error;
    }
  }
}
