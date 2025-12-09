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
    const stockDetail =
      row.lots?.filter((lot) => lot.magasin === 'detail').reduce((sum, lot) => sum + (lot.quantite_disponible || 0), 0) ||
      0;
    const stockGros =
      row.lots?.filter((lot) => lot.magasin === 'gros').reduce((sum, lot) => sum + (lot.quantite_disponible || 0), 0) ||
      0;
    const molecules =
      row.medicament_molecules?.map((mol) => mol.molecule).filter((mol): mol is string => Boolean(mol)) || [];

    return {
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
  }

  static async searchMedicaments(query: string): Promise<MedicamentSafetyInfo[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const { data, error } = await supabase
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
        seuil_rupture,
        medicament_molecules ( molecule ),
        lots ( quantite_disponible, magasin )
      `
      )
      .or(`nom.ilike.%${query}%,code.ilike.%${query}%`)
      .order('nom', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Erreur lors de la recherche de médicaments:', error);
      throw error;
    }

    return (data || []).map((row) => this.mapMedicamentRow(row as SupabaseMedicamentRow));
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

