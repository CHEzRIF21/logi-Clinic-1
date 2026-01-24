import { supabase } from './supabase';

export interface MedicamentSafetyInfo {
  id: string;
  code?: string;
  nom: string;
  dosage?: string;
  unite?: string;
  categorie?: string;
  prescription_requise?: boolean;
  seuil_alerte?: number;
  seuil_rupture?: number;
  stock_total: number;
  stock_detail: number;
  stock_gros: number;
  molecules: string[];
}

export interface PrescriptionSafetyAlert {
  type: 'stock' | 'allergy' | 'incompatibility';
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface IncompatibilityAlert {
  id: string;
  medicament_1_id: string;
  medicament_2_id: string;
  niveau: 'contre_indication' | 'precaution' | 'interaction';
  description: string;
}

type SupabaseMedicamentRow = {
  id: string;
  code?: string;
  nom: string;
  dosage?: string;
  unite?: string;
  categorie?: string;
  prescription_requise?: boolean;
  seuil_alerte?: number;
  seuil_rupture?: number;
  lots?: {
    quantite_disponible: number;
    magasin: 'gros' | 'detail';
  }[];
  medicament_molecules?: {
    molecule: string | null;
  }[];
};

export class PrescriptionSafetyService {
  static parseAllergies(allergies?: string | null): string[] {
    if (!allergies) return [];
    return allergies
      .split(/[,;\n]/g)
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => this.normalizeText(value));
  }

  static normalizeText(value?: string | null): string {
    return (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  static mapMedicamentRow(row: SupabaseMedicamentRow): MedicamentSafetyInfo {
    // Filtrer uniquement les lots actifs avec quantité disponible > 0
    const lotsActifs = row.lots?.filter(
      (lot) => lot.quantite_disponible > 0
    ) || [];
    
    const stockDetail =
      lotsActifs
        .filter((lot) => lot.magasin === 'detail')
        .reduce((sum, lot) => sum + (lot.quantite_disponible || 0), 0);
    
    const stockGros =
      lotsActifs
        .filter((lot) => lot.magasin === 'gros')
        .reduce((sum, lot) => sum + (lot.quantite_disponible || 0), 0);
    
    // La table medicament_molecules n'existe pas, donc on retourne un tableau vide
    const molecules: string[] = [];

    const result = {
      id: row.id,
      code: row.code,
      nom: row.nom,
      dosage: row.dosage,
      unite: row.unite,
      categorie: row.categorie,
      prescription_requise: row.prescription_requise,
      seuil_alerte: row.seuil_alerte,
      seuil_rupture: row.seuil_rupture,
      stock_detail: stockDetail,
      stock_gros: stockGros,
      stock_total: stockDetail + stockGros,
      molecules,
    };
    
    return result;
  }

  static async searchMedicaments(query: string): Promise<MedicamentSafetyInfo[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Récupérer tous les médicaments correspondant à la recherche
    // La table medicament_molecules n'existe pas, donc on ne l'inclut pas dans la requête
    // On récupère les lots séparément pour pouvoir filtrer par statut='actif' et quantite_disponible > 0
    const { data: medicamentsData, error: medicamentsError } = await supabase
      .from('medicaments')
      .select(
        `
        id,
        code,
        nom,
        dosage,
        unite,
        categorie,
        prescription_requise,
        seuil_alerte,
        seuil_rupture
      `
      )
      .or(`nom.ilike.%${query}%,code.ilike.%${query}%`)
      .order('nom', { ascending: true })
      .limit(20);

    if (medicamentsError) {
      throw medicamentsError;
    }

    // Récupérer les lots séparément pour chaque médicament avec filtres appropriés
    let data = medicamentsData || [];
    let error = null;
    
    if (data.length > 0) {
      const medicamentIds = data.map(m => m.id);
      const { data: lotsData, error: lotsError } = await supabase
        .from('lots')
        .select('medicament_id, quantite_disponible, magasin, statut')
        .in('medicament_id', medicamentIds)
        .eq('statut', 'actif')
        .gt('quantite_disponible', 0);
      
      if (lotsError) {
        error = lotsError;
      } else {
        // Associer les lots aux médicaments
        data = data.map(med => {
          const medLots = (lotsData || []).filter(lot => lot.medicament_id === med.id).map(lot => ({
            quantite_disponible: lot.quantite_disponible,
            magasin: lot.magasin,
            statut: lot.statut
          }));
          
          return {
            ...med,
            lots: medLots
          };
        });
      }
    }

    if (error) {
      console.error('Erreur lors de la recherche de médicaments:', error);
      throw error;
    }

    // Filtrer et mapper les résultats (le filtrage des lots actifs se fait dans mapMedicamentRow)
    const mapped = (data || []).map((row) => this.mapMedicamentRow(row as SupabaseMedicamentRow));
    
    return mapped;
  }

  /**
   * Récupère les stocks en temps réel pour un médicament spécifique
   */
  static async getMedicamentStock(medicamentId: string): Promise<{ stock_detail: number; stock_gros: number; stock_total: number }> {
    const { data, error } = await supabase
      .from('lots')
      .select('quantite_disponible, magasin, statut')
      .eq('medicament_id', medicamentId)
      .eq('statut', 'actif')
      .gt('quantite_disponible', 0);

    if (error) {
      console.error('Erreur lors de la récupération du stock:', error);
      return { stock_detail: 0, stock_gros: 0, stock_total: 0 };
    }

    const lots = data || [];
    const stockDetail = lots
      .filter((lot) => lot.magasin === 'detail')
      .reduce((sum, lot) => sum + (lot.quantite_disponible || 0), 0);
    
    const stockGros = lots
      .filter((lot) => lot.magasin === 'gros')
      .reduce((sum, lot) => sum + (lot.quantite_disponible || 0), 0);

    return {
      stock_detail: stockDetail,
      stock_gros: stockGros,
      stock_total: stockDetail + stockGros,
    };
  }

  static getStockAlert(medicament: MedicamentSafetyInfo): PrescriptionSafetyAlert | null {
    if (medicament.stock_total <= 0) {
      return {
        type: 'stock',
        severity: 'error',
        message: `Rupture de stock pour ${medicament.nom}`,
      };
    }

    if (medicament.seuil_alerte && medicament.stock_total <= medicament.seuil_alerte) {
      return {
        type: 'stock',
        severity: 'warning',
        message: `Stock faible pour ${medicament.nom} (${medicament.stock_total} unités)`,
      };
    }

    return null;
  }

  static getAllergyAlerts(
    patientAllergies: string[],
    medicament: MedicamentSafetyInfo
  ): PrescriptionSafetyAlert[] {
    if (!patientAllergies.length) return [];

    const normalizedName = this.normalizeText(medicament.nom);
    const normalizedMolecules = medicament.molecules.map((mol) => this.normalizeText(mol));
    const alerts: PrescriptionSafetyAlert[] = [];

    const moleculeConflicts = patientAllergies.filter((allergy) =>
      normalizedMolecules.some(
        (molecule) => molecule.includes(allergy) || allergy.includes(molecule)
      )
    );

    if (moleculeConflicts.length > 0) {
      alerts.push({
        type: 'allergy',
        severity: 'error',
        message: `Allergie potentielle détectée (${moleculeConflicts.join(', ')})`,
      });
    } else {
      const nameConflict = patientAllergies.find((allergy) => normalizedName.includes(allergy));
      if (nameConflict) {
        alerts.push({
          type: 'allergy',
          severity: 'warning',
          message: `Vérifier l'allergie pour ${medicament.nom}`,
        });
      }
    }

    return alerts;
  }

  static async getIncompatibilities(medicamentIds: string[]): Promise<IncompatibilityAlert[]> {
    if (!medicamentIds || medicamentIds.length < 2) {
      return [];
    }

    const uniqueIds = Array.from(new Set(medicamentIds));

    const { data, error } = await supabase
      .from('incompatibilites_medicamenteuses')
      .select('*')
      .in('medicament_1_id', uniqueIds)
      .in('medicament_2_id', uniqueIds);

    if (error) {
      if (error.code === 'PGRST116') {
        return [];
      }
      console.error('Erreur lors de la récupération des incompatibilités:', error);
      throw error;
    }

    return (data || []) as IncompatibilityAlert[];
  }
}

