import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';
import { supabase } from './supabase';

export type ExamModule =
  | 'LABORATOIRE'
  | 'IMAGERIE'
  | 'GYNECO'
  | 'CARDIO'
  | 'PEDIATRIE'
  | 'ACTE';

export interface ExamCatalogEntry {
  id: string;
  code: string;
  nom: string;
  categorie: string;
  sous_categorie?: string | null;
  module_cible: ExamModule;
  type_acte: string;
  description?: string | null;
  tarif_base: number;
  unite?: string | null;
  facturable: boolean;
  actif: boolean;
  service_facturable_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamCatalogPayload
  extends Partial<
    Omit<ExamCatalogEntry, 'id' | 'created_at' | 'updated_at' | 'actif' | 'facturable'>
  > {
  facturable?: boolean;
  actif?: boolean;
}

export interface ExamCatalogFilters {
  module?: ExamModule;
  categorie?: string;
  search?: string;
  actif?: boolean;
}

const buildQuery = (filters?: ExamCatalogFilters) => {
  const params = new URLSearchParams();
  if (filters?.module) params.append('module', filters.module);
  if (filters?.categorie) params.append('categorie', filters.categorie);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.actif !== undefined) params.append('actif', String(filters.actif));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const ExamCatalogService = {
  async list(filters?: ExamCatalogFilters): Promise<ExamCatalogEntry[]> {
    try {
      // Essayer d'abord d'utiliser directement Supabase
      let query = supabase
        .from('exam_catalog')
        .select('*')
        .order('categorie', { ascending: true })
        .order('nom', { ascending: true });

      if (filters?.module) {
        query = query.eq('module_cible', filters.module);
      }

      if (filters?.categorie) {
        query = query.eq('categorie', filters.categorie);
      }

      if (filters?.actif !== undefined) {
        query = query.eq('actif', filters.actif);
      }

      if (filters?.search) {
        query = query.or(`nom.ilike.%${filters.search}%,code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as ExamCatalogEntry[];
    } catch (error: any) {
      console.error('Erreur lors du chargement du catalogue d\'examens depuis Supabase:', error);
      
      // Fallback : essayer l'API si Supabase échoue
      try {
        return await apiGet(`/exams${buildQuery(filters)}`);
      } catch (apiError: any) {
        console.error('Erreur lors du chargement du catalogue d\'examens depuis l\'API:', apiError);
        // Si l'API n'est pas disponible non plus, retourner un tableau vide
        // Le composant utilisera alors la liste de fallback
        return [];
      }
    }
  },

  async getById(id: string): Promise<ExamCatalogEntry> {
    return apiGet(`/exams/${id}`);
  },

  async create(payload: ExamCatalogPayload): Promise<ExamCatalogEntry> {
    return apiPost('/exams', payload);
  },

  async update(id: string, payload: ExamCatalogPayload): Promise<ExamCatalogEntry> {
    return apiPut(`/exams/${id}`, payload);
  },

  async archive(id: string): Promise<ExamCatalogEntry> {
    return apiDelete(`/exams/${id}`);
  },
};

export default ExamCatalogService;

