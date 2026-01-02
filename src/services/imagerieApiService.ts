/**
 * Service API pour le module Imagerie
 * Utilise apiClient pour les appels au backend au lieu de Supabase directement
 */

import { apiGet, apiPost, apiPut } from './apiClient';

// Types
export interface DemandeImagerie {
  id: string;
  numero: string;
  patient_id: string;
  consultation_id?: string;
  medecin_id: string;
  clinic_id: string;
  type: 'INTERNE' | 'EXTERNE';
  examens: string[];
  status: string;
  priorite: 'normale' | 'urgente' | 'critique';
  indication_clinique?: string;
  notes?: string;
  date_realisation?: string;
  date_interpretation?: string;
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
}

export interface ExamenImagerie {
  id: string;
  demande_id: string;
  type_examen: string;
  modalite: string;
  region_anatomique?: string;
  technicien_id?: string;
  status: string;
  date_realisation: string;
  created_at: string;
  demande?: DemandeImagerie;
  images?: ImageImagerie[];
  rapport?: RapportImagerie;
}

export interface ImageImagerie {
  id: string;
  examen_id: string;
  url: string;
  nom_fichier: string;
  type_fichier: string;
  taille?: number;
  annotations?: any;
  created_at: string;
}

export interface RapportImagerie {
  id: string;
  examen_id: string;
  contenu: string;
  conclusion: string;
  radiologue_id: string;
  date_interpretation: string;
  created_at: string;
}

export interface CatalogueExamen {
  code: string;
  nom: string;
  modalite: string;
  tarif: number;
}

export interface CreateDemandeInput {
  patient_id: string;
  consultation_id?: string;
  medecin_id: string;
  clinic_id: string;
  type?: 'INTERNE' | 'EXTERNE';
  examens: string[];
  priorite?: 'normale' | 'urgente' | 'critique';
  indication_clinique?: string;
  notes?: string;
}

export interface CreateExamenInput {
  demande_id: string;
  type_examen: string;
  modalite: string;
  region_anatomique?: string;
  technicien_id?: string;
}

export interface CreateRapportInput {
  contenu: string;
  conclusion: string;
  radiologue_id: string;
}

// Service API
export class ImagerieApiService {
  private static BASE_URL = '/imagerie';

  /**
   * Récupère la liste des demandes avec filtres
   */
  static async getDemandes(filters: {
    clinic_id?: string;
    patient_id?: string;
    status?: string;
    date_debut?: string;
    date_fin?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ demandes: DemandeImagerie[]; pagination: any }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiGet<{ data: DemandeImagerie[]; pagination: any }>(
      `${this.BASE_URL}/requests${query}`
    );
    
    return {
      demandes: response.data || response as any,
      pagination: response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }

  /**
   * Récupère une demande par ID
   */
  static async getDemandeById(id: string): Promise<DemandeImagerie> {
    return apiGet<DemandeImagerie>(`${this.BASE_URL}/requests/${id}`);
  }

  /**
   * Crée une demande d'imagerie
   */
  static async createDemande(input: CreateDemandeInput): Promise<DemandeImagerie> {
    return apiPost<DemandeImagerie>(`${this.BASE_URL}/requests`, input);
  }

  /**
   * Met à jour le statut d'une demande
   */
  static async updateDemandeStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<DemandeImagerie> {
    return apiPut<DemandeImagerie>(`${this.BASE_URL}/requests/${id}/status`, { status, notes });
  }

  /**
   * Récupère les examens
   */
  static async getExamens(filters: {
    demande_id?: string;
    clinic_id?: string;
    status?: string;
  } = {}): Promise<ExamenImagerie[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiGet<ExamenImagerie[]>(`${this.BASE_URL}/examens${query}`);
  }

  /**
   * Récupère un examen par ID
   */
  static async getExamenById(id: string): Promise<ExamenImagerie> {
    return apiGet<ExamenImagerie>(`${this.BASE_URL}/examens/${id}`);
  }

  /**
   * Crée un examen
   */
  static async createExamen(input: CreateExamenInput): Promise<ExamenImagerie> {
    return apiPost<ExamenImagerie>(`${this.BASE_URL}/examens`, input);
  }

  /**
   * Récupère les images d'un examen
   */
  static async getImages(examenId: string): Promise<ImageImagerie[]> {
    return apiGet<ImageImagerie[]>(`${this.BASE_URL}/examens/${examenId}/images`);
  }

  /**
   * Ajoute une image à un examen
   */
  static async addImage(examenId: string, input: {
    url: string;
    nom_fichier: string;
    type_fichier: string;
    taille?: number;
    annotations?: any;
  }): Promise<ImageImagerie> {
    return apiPost<ImageImagerie>(`${this.BASE_URL}/examens/${examenId}/images`, input);
  }

  /**
   * Crée un rapport d'interprétation
   */
  static async createRapport(examenId: string, input: CreateRapportInput): Promise<RapportImagerie> {
    return apiPost<RapportImagerie>(`${this.BASE_URL}/examens/${examenId}/rapport`, input);
  }

  /**
   * Récupère le catalogue des examens
   */
  static async getCatalogue(clinicId?: string): Promise<CatalogueExamen[]> {
    const query = clinicId ? `?clinic_id=${clinicId}` : '';
    return apiGet<CatalogueExamen[]>(`${this.BASE_URL}/catalogue${query}`);
  }

  /**
   * Récupère les statistiques
   */
  static async getStats(clinicId: string): Promise<{
    demandes_jour: number;
    demandes_en_attente: number;
    examens_realises: number;
  }> {
    return apiGet(`${this.BASE_URL}/stats?clinic_id=${clinicId}`);
  }

  // Méthodes de compatibilité avec l'ancien service

  /**
   * Alias pour createDemande (compatibilité)
   */
  static async creerDemande(input: CreateDemandeInput): Promise<DemandeImagerie> {
    return this.createDemande(input);
  }

  /**
   * Alias pour createExamen (compatibilité)
   */
  static async creerExamen(input: CreateExamenInput): Promise<ExamenImagerie> {
    return this.createExamen(input);
  }

  /**
   * Récupère les demandes en attente
   */
  static async getDemandesEnAttente(clinicId: string): Promise<DemandeImagerie[]> {
    const result = await this.getDemandes({ clinic_id: clinicId, status: 'en_attente' });
    return result.demandes;
  }
}

export default ImagerieApiService;

