/**
 * Service API pour le module Laboratoire
 * Utilise apiClient pour les appels au backend au lieu de Supabase directement
 */

import { apiGet, apiPost, apiPut } from './apiClient';

// Types
export interface PrescriptionLabo {
  id: string;
  numero: string;
  patient_id: string;
  consultation_id?: string;
  medecin_id: string;
  clinic_id: string;
  status: string;
  priorite: 'normale' | 'urgente' | 'critique';
  notes_cliniques?: string;
  date_prelevement?: string;
  date_validation?: string;
  statut_paiement?: string;
  montant_total?: number;
  created_at: string;
  updated_at?: string;
  patient?: {
    id: string;
    nom: string;
    prenoms: string;
    date_naissance: string;
    sexe: string;
    numero_dossier: string;
  };
  medecin?: {
    id: string;
    nom: string;
    prenom: string;
  };
  analyses?: AnalyseLabo[];
}

export interface AnalyseLabo {
  id: string;
  prescription_id: string;
  code_analyse: string;
  nom_analyse: string;
  categorie?: string;
  status: string;
  valeur?: string;
  unite?: string;
  valeur_reference_min?: number;
  valeur_reference_max?: number;
  interpretation?: string;
  validateur_id?: string;
  date_validation?: string;
  tarif?: number;
  created_at: string;
}

export interface ResultatLabo {
  id: string;
  analyse_id: string;
  prescription_id?: string;
  patient_id?: string;
  valeur: string;
  unite?: string;
  interpretation?: string;
  created_at: string;
}

export interface CatalogueAnalyse {
  code: string;
  nom: string;
  categorie: string;
  tarif: number;
}

export interface CreatePrescriptionInput {
  patient_id: string;
  consultation_id?: string;
  medecin_id: string;
  clinic_id: string;
  analyses: string[];
  priorite?: 'normale' | 'urgente' | 'critique';
  notes_cliniques?: string;
}

export interface ValiderResultatInput {
  analyse_id: string;
  valeur: string;
  unite?: string;
  valeur_reference_min?: number;
  valeur_reference_max?: number;
  interpretation?: string;
  validateur_id: string;
}

// Service API
export class LaboratoireApiService {
  private static BASE_URL = '/laboratoire';

  /**
   * Récupère la liste des prescriptions avec filtres
   */
  static async getPrescriptions(filters: {
    clinic_id?: string;
    patient_id?: string;
    status?: string;
    date_debut?: string;
    date_fin?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ prescriptions: PrescriptionLabo[]; pagination: any }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiGet<{ data: PrescriptionLabo[]; pagination: any }>(
      `${this.BASE_URL}/prescriptions${query}`
    );
    
    return {
      prescriptions: response.data || response as any,
      pagination: response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }

  /**
   * Récupère une prescription par ID
   */
  static async getPrescriptionById(id: string): Promise<PrescriptionLabo> {
    return apiGet<PrescriptionLabo>(`${this.BASE_URL}/prescriptions/${id}`);
  }

  /**
   * Crée une prescription de laboratoire
   */
  static async createPrescription(input: CreatePrescriptionInput): Promise<PrescriptionLabo> {
    return apiPost<PrescriptionLabo>(`${this.BASE_URL}/prescriptions`, input);
  }

  /**
   * Met à jour le statut d'une prescription
   */
  static async updatePrescriptionStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<PrescriptionLabo> {
    return apiPut<PrescriptionLabo>(`${this.BASE_URL}/prescriptions/${id}/status`, { status, notes });
  }

  /**
   * Récupère les analyses
   */
  static async getAnalyses(filters: {
    prescription_id?: string;
    clinic_id?: string;
    status?: string;
  } = {}): Promise<AnalyseLabo[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiGet<AnalyseLabo[]>(`${this.BASE_URL}/analyses${query}`);
  }

  /**
   * Crée une analyse
   */
  static async createAnalyse(input: {
    prescription_id: string;
    code_analyse: string;
    nom_analyse: string;
    categorie?: string;
    tarif?: number;
  }): Promise<AnalyseLabo> {
    return apiPost<AnalyseLabo>(`${this.BASE_URL}/analyses`, input);
  }

  /**
   * Récupère les résultats
   */
  static async getResultats(filters: {
    analyse_id?: string;
    prescription_id?: string;
    patient_id?: string;
  } = {}): Promise<ResultatLabo[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiGet<ResultatLabo[]>(`${this.BASE_URL}/resultats${query}`);
  }

  /**
   * Valide un résultat d'analyse
   */
  static async validerResultat(input: ValiderResultatInput): Promise<AnalyseLabo> {
    return apiPost<AnalyseLabo>(`${this.BASE_URL}/resultats`, input);
  }

  /**
   * Récupère les informations d'intégration
   */
  static async getIntegrations(clinicId: string): Promise<{
    prescriptions_jour: number;
    prescriptions_en_attente: number;
    analyses_validees: number;
    connexions: Array<{ module: string; status: string; description: string }>;
  }> {
    return apiGet(`${this.BASE_URL}/integrations?clinic_id=${clinicId}`);
  }

  /**
   * Récupère le catalogue des analyses
   */
  static async getCatalogue(clinicId?: string): Promise<CatalogueAnalyse[]> {
    const query = clinicId ? `?clinic_id=${clinicId}` : '';
    return apiGet<CatalogueAnalyse[]>(`${this.BASE_URL}/catalogue${query}`);
  }

  // Méthodes de compatibilité avec l'ancien service

  /**
   * Alias pour createPrescription (compatibilité)
   */
  static async creerPrescription(input: CreatePrescriptionInput): Promise<PrescriptionLabo> {
    return this.createPrescription(input);
  }

  /**
   * Récupère les prescriptions en attente
   */
  static async getPrescriptionsEnAttente(clinicId: string): Promise<PrescriptionLabo[]> {
    const result = await this.getPrescriptions({ clinic_id: clinicId, status: 'en_attente' });
    return result.prescriptions;
  }

  /**
   * Marquer comme prélevé
   */
  static async marquerPreleve(prescriptionId: string): Promise<PrescriptionLabo> {
    return this.updatePrescriptionStatus(prescriptionId, 'prelevement_effectue');
  }

  /**
   * Marquer comme validé
   */
  static async validerPrescription(prescriptionId: string): Promise<PrescriptionLabo> {
    return this.updatePrescriptionStatus(prescriptionId, 'validee');
  }
}

export default LaboratoireApiService;

