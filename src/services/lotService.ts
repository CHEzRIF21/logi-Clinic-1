import { supabase, LotSupabase, LotFormData } from './stockSupabase';

export class LotService {
  // Récupérer tous les lots
  static async getAllLots(): Promise<LotSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          medicaments!inner(nom, code, categorie)
        `)
        .order('date_reception', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des lots:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getAllLots:', error);
      throw error;
    }
  }

  // Récupérer un lot par ID
  static async getLotById(id: string): Promise<LotSupabase | null> {
    try {
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          medicaments!inner(nom, code, categorie)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du lot:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans getLotById:', error);
      throw error;
    }
  }

  // Récupérer les lots par médicament
  static async getLotsByMedicament(medicamentId: string): Promise<LotSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          medicaments!inner(nom, code, categorie)
        `)
        .eq('medicament_id', medicamentId)
        .order('date_reception', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des lots par médicament:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getLotsByMedicament:', error);
      throw error;
    }
  }

  // Récupérer les lots par magasin
  static async getLotsByMagasin(magasin: 'gros' | 'detail'): Promise<LotSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          medicaments!inner(nom, code, categorie)
        `)
        .eq('magasin', magasin)
        .order('date_reception', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des lots par magasin:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getLotsByMagasin:', error);
      throw error;
    }
  }

  // Récupérer les lots expirés
  static async getLotsExpires(): Promise<LotSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          medicaments!inner(nom, code, categorie)
        `)
        .lt('date_expiration', new Date().toISOString().split('T')[0])
        .order('date_expiration', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des lots expirés:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getLotsExpires:', error);
      throw error;
    }
  }

  // Récupérer les lots expirant dans les 30 prochains jours
  static async getLotsExpirant30Jours(): Promise<LotSupabase[]> {
    try {
      const dateLimite = new Date();
      dateLimite.setDate(dateLimite.getDate() + 30);
      
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          medicaments!inner(nom, code, categorie)
        `)
        .gte('date_expiration', new Date().toISOString().split('T')[0])
        .lte('date_expiration', dateLimite.toISOString().split('T')[0])
        .order('date_expiration', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des lots expirant dans 30 jours:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getLotsExpirant30Jours:', error);
      throw error;
    }
  }

  // Rechercher des lots
  static async searchLots(query: string): Promise<LotSupabase[]> {
    try {
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          medicaments!inner(nom, code, categorie)
        `)
        .or(`numero_lot.ilike.%${query}%,medicaments.nom.ilike.%${query}%,medicaments.code.ilike.%${query}%`)
        .order('date_reception', { ascending: false });

      if (error) {
        console.error('Erreur lors de la recherche des lots:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans searchLots:', error);
      throw error;
    }
  }

  // Créer un nouveau lot
  static async createLot(lotData: LotFormData): Promise<LotSupabase> {
    try {
      const { data, error } = await supabase
        .from('lots')
        .insert([lotData])
        .select(`
          *,
          medicaments!inner(nom, code, categorie)
        `)
        .single();

      if (error) {
        console.error('Erreur lors de la création du lot:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans createLot:', error);
      throw error;
    }
  }

  // Mettre à jour un lot
  static async updateLot(id: string, lotData: Partial<LotFormData>): Promise<LotSupabase> {
    try {
      const { data, error } = await supabase
        .from('lots')
        .update(lotData)
        .eq('id', id)
        .select(`
          *,
          medicaments!inner(nom, code, categorie)
        `)
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du lot:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans updateLot:', error);
      throw error;
    }
  }

  // Supprimer un lot
  static async deleteLot(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lots')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du lot:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur dans deleteLot:', error);
      throw error;
    }
  }

  // Mettre à jour la quantité disponible d'un lot
  static async updateQuantiteDisponible(id: string, nouvelleQuantite: number): Promise<LotSupabase> {
    try {
      const { data, error } = await supabase
        .from('lots')
        .update({ quantite_disponible: nouvelleQuantite })
        .eq('id', id)
        .select(`
          *,
          medicaments!inner(nom, code, categorie)
        `)
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour de la quantité:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans updateQuantiteDisponible:', error);
      throw error;
    }
  }

  // Mettre à jour le statut d'un lot
  static async updateStatutLot(id: string, statut: 'actif' | 'expire' | 'epuise'): Promise<LotSupabase> {
    try {
      const { data, error } = await supabase
        .from('lots')
        .update({ statut })
        .eq('id', id)
        .select(`
          *,
          medicaments!inner(nom, code, categorie)
        `)
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans updateStatutLot:', error);
      throw error;
    }
  }

  // Compter le nombre total de lots
  static async getLotsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('lots')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Erreur lors du comptage des lots:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Erreur dans getLotsCount:', error);
      throw error;
    }
  }

  // Récupérer les statistiques des lots
  static async getLotStats() {
    try {
      const { data, error } = await supabase
        .from('lots')
        .select('statut, magasin, quantite_disponible, prix_achat, date_expiration');

      if (error) {
        throw error;
      }

      const aujourdhui = new Date();
      const dans30Jours = new Date();
      dans30Jours.setDate(aujourdhui.getDate() + 30);

      const stats = {
        total: data?.length || 0,
        parStatut: {
          actif: data?.filter(l => l.statut === 'actif').length || 0,
          expire: data?.filter(l => l.statut === 'expire').length || 0,
          epuise: data?.filter(l => l.statut === 'epuise').length || 0,
        },
        parMagasin: {
          gros: data?.filter(l => l.magasin === 'gros').length || 0,
          detail: data?.filter(l => l.magasin === 'detail').length || 0,
        },
        expirant: {
          deja_expires: data?.filter(l => new Date(l.date_expiration) < aujourdhui).length || 0,
          dans_30_jours: data?.filter(l => {
            const dateExp = new Date(l.date_expiration);
            return dateExp >= aujourdhui && dateExp <= dans30Jours;
          }).length || 0,
        },
        valeur_totale: data?.reduce((total, lot) => total + (lot.quantite_disponible * lot.prix_achat), 0) || 0,
      };

      return stats;
    } catch (error) {
      console.error('Erreur dans getLotStats:', error);
      throw error;
    }
  }
}
