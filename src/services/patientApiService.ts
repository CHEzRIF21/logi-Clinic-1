/**
 * Service API pour la gestion des patients
 * Utilise apiClient pour les appels au backend au lieu de Supabase directement
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

// Types
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  sex: string;
  dob: string;
  age?: number;
  phones?: string[];
  address?: string;
  assuranceId?: string;
  ifu?: string;
  createdAt: string;
  updatedAt?: string;
  assurance?: Assurance;
  _count?: {
    operations: number;
    invoices: number;
  };
}

export interface PatientInput {
  firstName: string;
  lastName: string;
  sex: string;
  dob: string;
  phones?: string[];
  address?: string;
  assuranceId?: string;
  ifu?: string;
}

export interface Assurance {
  id: string;
  name: string;
  code?: string;
  active?: boolean;
}

export interface PatientSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PatientHistoryFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
}

// Service API
export class PatientApiService {
  private static BASE_URL = '/patients';

  /**
   * Recherche de patients
   */
  static async search(params: PatientSearchParams = {}): Promise<{
    patients: Patient[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await apiGet<{
      data: Patient[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`${this.BASE_URL}${query}`);
    
    return {
      patients: response.data || response as any,
      pagination: response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }

  /**
   * Récupère un patient par ID avec son historique
   */
  static async getById(id: string, filters: PatientHistoryFilters = {}): Promise<Patient> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiGet<Patient>(`${this.BASE_URL}/${id}${query}`);
  }

  /**
   * Crée un nouveau patient
   */
  static async create(input: PatientInput): Promise<Patient> {
    return apiPost<Patient>(this.BASE_URL, input);
  }

  /**
   * Met à jour un patient
   */
  static async update(id: string, input: Partial<PatientInput>): Promise<Patient> {
    return apiPut<Patient>(`${this.BASE_URL}/${id}`, input);
  }

  /**
   * Supprime un patient
   */
  static async delete(id: string): Promise<{ success: boolean }> {
    return apiDelete<{ success: boolean }>(`${this.BASE_URL}/${id}`);
  }

  // ============================================
  // MÉTHODES DE COMPATIBILITÉ
  // ============================================

  /**
   * Alias pour search (compatibilité avec l'ancien service)
   */
  static async searchPatients(params: PatientSearchParams = {}): Promise<Patient[]> {
    const result = await this.search(params);
    return result.patients;
  }

  /**
   * Alias pour getById (compatibilité)
   */
  static async getPatient(id: string): Promise<Patient> {
    return this.getById(id);
  }

  /**
   * Alias pour create (compatibilité)
   */
  static async createPatient(input: PatientInput): Promise<Patient> {
    return this.create(input);
  }

  /**
   * Alias pour update (compatibilité)
   */
  static async updatePatient(id: string, input: Partial<PatientInput>): Promise<Patient> {
    return this.update(id, input);
  }

  /**
   * Récupère tous les patients (paginés)
   */
  static async getAll(page: number = 1, limit: number = 50): Promise<Patient[]> {
    const result = await this.search({ page, limit });
    return result.patients;
  }

  /**
   * Recherche par nom
   */
  static async searchByName(name: string): Promise<Patient[]> {
    const result = await this.search({ search: name });
    return result.patients;
  }
}

export default PatientApiService;

