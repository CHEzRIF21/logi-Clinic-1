/**
 * Service API pour le module Maternité
 * Utilise apiClient pour les appels au backend au lieu de Supabase directement
 */

import { apiGet, apiPost, apiPut } from './apiClient';

// Types
export interface DossierObstetrical {
  id: string;
  numero: string;
  patient_id: string;
  clinic_id: string;
  status: string;
  date_derniere_regles?: string;
  date_prevue_accouchement?: string;
  gestite?: number;
  parite?: number;
  antecedents_obstetricaux?: any;
  conjoint?: any;
  sage_femme_id?: string;
  created_at: string;
  updated_at?: string;
  patient?: {
    id: string;
    nom: string;
    prenoms: string;
    date_naissance: string;
    telephone?: string;
    numero_dossier: string;
    adresse?: string;
  };
  consultations_prenatales?: ConsultationPrenatale[];
  accouchements?: Accouchement[];
}

export interface ConsultationPrenatale {
  id: string;
  dossier_id: string;
  patient_id: string;
  clinic_id: string;
  numero_cpn: number;
  trimestre: number;
  date_cpn: string;
  poids?: number;
  tension_arterielle?: string;
  hauteur_uterine?: number;
  presentation?: string;
  bruits_coeur_foetal?: string;
  mouvements_actifs?: boolean;
  examens_demandes?: string[];
  vaccinations?: any;
  traitements?: any;
  conseils?: string[];
  prochain_rdv?: string;
  sage_femme_id: string;
  created_at: string;
  updated_at?: string;
  dossier?: DossierObstetrical;
}

export interface Accouchement {
  id: string;
  numero: string;
  dossier_id: string;
  patient_id: string;
  clinic_id: string;
  date_accouchement: string;
  heure_accouchement: string;
  mode_accouchement: string;
  presentation: string;
  terme?: number;
  duree_travail?: string;
  complications?: string[];
  nouveau_ne?: any;
  equipe_medicale?: any;
  notes?: string;
  created_at: string;
  dossier?: DossierObstetrical;
  nouveau_nes?: NouveauNe[];
  suivi_post_partum?: SuiviPostPartum[];
}

export interface NouveauNe {
  id: string;
  accouchement_id: string;
  sexe: string;
  poids: number;
  taille?: number;
  apgar_1min?: number;
  apgar_5min?: number;
  etat_sante: string;
  anomalies?: string[];
  created_at: string;
}

export interface SuiviPostPartum {
  id: string;
  accouchement_id: string;
  patient_id: string;
  clinic_id: string;
  date_visite: string;
  jour_post_partum: number;
  etat_general?: string;
  temperature?: number;
  tension_arterielle?: string;
  involution_uterine?: string;
  lochies?: string;
  cicatrice?: string;
  allaitement?: string;
  complications?: string[];
  nouveau_ne_etat?: any;
  conseils?: string[];
  prochain_rdv?: string;
  sage_femme_id: string;
  created_at: string;
}

export interface CreateDossierInput {
  patient_id: string;
  clinic_id: string;
  date_derniere_regles?: string;
  date_prevue_accouchement?: string;
  gestite?: number;
  parite?: number;
  antecedents_obstetricaux?: any;
  conjoint?: any;
  sage_femme_id?: string;
}

export interface CreateCPNInput {
  dossier_id: string;
  patient_id: string;
  clinic_id: string;
  numero_cpn: number;
  trimestre?: number;
  date_cpn?: string;
  poids?: number;
  tension_arterielle?: string;
  hauteur_uterine?: number;
  presentation?: string;
  bruits_coeur_foetal?: string;
  mouvements_actifs?: boolean;
  examens_demandes?: string[];
  vaccinations?: any;
  traitements?: any;
  conseils?: string[];
  prochain_rdv?: string;
  sage_femme_id: string;
}

export interface CreateAccouchementInput {
  dossier_id: string;
  patient_id: string;
  clinic_id: string;
  date_accouchement: string;
  heure_accouchement?: string;
  mode_accouchement: string;
  presentation?: string;
  terme?: number;
  duree_travail?: string;
  complications?: string[];
  nouveau_ne?: any;
  equipe_medicale?: any;
  notes?: string;
}

export interface CreateSuiviPostPartumInput {
  accouchement_id: string;
  patient_id: string;
  clinic_id: string;
  date_visite?: string;
  jour_post_partum?: number;
  etat_general?: string;
  temperature?: number;
  tension_arterielle?: string;
  involution_uterine?: string;
  lochies?: string;
  cicatrice?: string;
  allaitement?: string;
  complications?: string[];
  nouveau_ne_etat?: any;
  conseils?: string[];
  prochain_rdv?: string;
  sage_femme_id: string;
}

// Service API
export class MaterniteApiService {
  private static BASE_URL = '/maternite';

  // ============================================
  // DOSSIERS OBSTÉTRICAUX
  // ============================================

  /**
   * Récupère la liste des dossiers obstétricaux
   */
  static async getDossiers(filters: {
    clinic_id?: string;
    patient_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ dossiers: DossierObstetrical[]; pagination: any }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiGet<{ data: DossierObstetrical[]; pagination: any }>(
      `${this.BASE_URL}/dossiers${query}`
    );
    
    return {
      dossiers: response.data || response as any,
      pagination: response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }

  /**
   * Récupère un dossier par ID
   */
  static async getDossierById(id: string): Promise<DossierObstetrical> {
    return apiGet<DossierObstetrical>(`${this.BASE_URL}/dossiers/${id}`);
  }

  /**
   * Crée un dossier obstétrical
   */
  static async createDossier(input: CreateDossierInput): Promise<DossierObstetrical> {
    return apiPost<DossierObstetrical>(`${this.BASE_URL}/dossiers`, input);
  }

  /**
   * Met à jour un dossier
   */
  static async updateDossier(id: string, input: Partial<CreateDossierInput>): Promise<DossierObstetrical> {
    return apiPut<DossierObstetrical>(`${this.BASE_URL}/dossiers/${id}`, input);
  }

  // ============================================
  // CONSULTATIONS PRÉNATALES (CPN)
  // ============================================

  /**
   * Récupère la liste des CPN
   */
  static async getCPNs(filters: {
    dossier_id?: string;
    patient_id?: string;
    clinic_id?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ cpns: ConsultationPrenatale[]; pagination: any }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiGet<{ data: ConsultationPrenatale[]; pagination: any }>(
      `${this.BASE_URL}/cpn${query}`
    );
    
    return {
      cpns: response.data || response as any,
      pagination: response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }

  /**
   * Récupère une CPN par ID
   */
  static async getCPNById(id: string): Promise<ConsultationPrenatale> {
    return apiGet<ConsultationPrenatale>(`${this.BASE_URL}/cpn/${id}`);
  }

  /**
   * Crée une CPN
   */
  static async createCPN(input: CreateCPNInput): Promise<ConsultationPrenatale> {
    return apiPost<ConsultationPrenatale>(`${this.BASE_URL}/cpn`, input);
  }

  /**
   * Met à jour une CPN
   */
  static async updateCPN(id: string, input: Partial<CreateCPNInput>): Promise<ConsultationPrenatale> {
    return apiPut<ConsultationPrenatale>(`${this.BASE_URL}/cpn/${id}`, input);
  }

  // ============================================
  // ACCOUCHEMENTS
  // ============================================

  /**
   * Récupère la liste des accouchements
   */
  static async getAccouchements(filters: {
    dossier_id?: string;
    patient_id?: string;
    clinic_id?: string;
    date_debut?: string;
    date_fin?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ accouchements: Accouchement[]; pagination: any }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiGet<{ data: Accouchement[]; pagination: any }>(
      `${this.BASE_URL}/accouchements${query}`
    );
    
    return {
      accouchements: response.data || response as any,
      pagination: response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }

  /**
   * Récupère un accouchement par ID
   */
  static async getAccouchementById(id: string): Promise<Accouchement> {
    return apiGet<Accouchement>(`${this.BASE_URL}/accouchements/${id}`);
  }

  /**
   * Enregistre un accouchement
   */
  static async createAccouchement(input: CreateAccouchementInput): Promise<Accouchement> {
    return apiPost<Accouchement>(`${this.BASE_URL}/accouchements`, input);
  }

  // ============================================
  // SUIVI POST-PARTUM
  // ============================================

  /**
   * Récupère les suivis post-partum
   */
  static async getSuiviPostPartum(filters: {
    accouchement_id?: string;
    patient_id?: string;
    clinic_id?: string;
  } = {}): Promise<SuiviPostPartum[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiGet<SuiviPostPartum[]>(`${this.BASE_URL}/post-partum${query}`);
  }

  /**
   * Crée un suivi post-partum
   */
  static async createSuiviPostPartum(input: CreateSuiviPostPartumInput): Promise<SuiviPostPartum> {
    return apiPost<SuiviPostPartum>(`${this.BASE_URL}/post-partum`, input);
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  /**
   * Récupère les statistiques de la maternité
   */
  static async getStats(clinicId: string, dateDebut?: string, dateFin?: string): Promise<{
    dossiers_en_cours: number;
    accouchements_mois: number;
    cpns_mois: number;
  }> {
    const params = new URLSearchParams({ clinic_id: clinicId });
    if (dateDebut) params.append('date_debut', dateDebut);
    if (dateFin) params.append('date_fin', dateFin);
    
    return apiGet(`${this.BASE_URL}/stats?${params.toString()}`);
  }

  // ============================================
  // MÉTHODES DE COMPATIBILITÉ
  // ============================================

  /**
   * Alias pour createDossier (compatibilité)
   */
  static async creerDossier(input: CreateDossierInput): Promise<DossierObstetrical> {
    return this.createDossier(input);
  }

  /**
   * Alias pour createCPN (compatibilité)
   */
  static async creerCPN(input: CreateCPNInput): Promise<ConsultationPrenatale> {
    return this.createCPN(input);
  }

  /**
   * Alias pour createAccouchement (compatibilité)
   */
  static async enregistrerAccouchement(input: CreateAccouchementInput): Promise<Accouchement> {
    return this.createAccouchement(input);
  }

  /**
   * Récupère les dossiers en cours
   */
  static async getDossiersEnCours(clinicId: string): Promise<DossierObstetrical[]> {
    const result = await this.getDossiers({ clinic_id: clinicId, status: 'en_cours' });
    return result.dossiers;
  }

  /**
   * Récupère le dossier d'une patiente
   */
  static async getDossierByPatient(patientId: string): Promise<DossierObstetrical | null> {
    const result = await this.getDossiers({ patient_id: patientId });
    return result.dossiers.length > 0 ? result.dossiers[0] : null;
  }
}

export default MaterniteApiService;

