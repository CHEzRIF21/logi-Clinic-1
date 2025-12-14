// Support pour Vite (import.meta.env) et CRA (process.env) pour compatibilité
const API_URL = import.meta.env.VITE_API_URL || 
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  '';

export interface DiagnosticCode {
  code: string;
  libelle: string;
  categorie?: string;
  created_at: string;
}

export class DiagnosticService {
  /**
   * Rechercher dans les codes CIM-10
   */
  static async searchCIM10(
    query: string,
    categorie?: string,
    limit: number = 50
  ): Promise<DiagnosticCode[]> {
    const token = localStorage.getItem('token');
    const url = new URL(`${API_URL}/api/diagnostics/cim10`);
    
    if (query) {
      url.searchParams.append('q', query);
    }
    if (categorie) {
      url.searchParams.append('categorie', categorie);
    }
    url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la recherche CIM-10');
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Récupérer un code CIM-10 par code
   */
  static async getDiagnosticByCode(code: string): Promise<DiagnosticCode> {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/diagnostics/cim10/${code}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération du code');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Récupérer toutes les catégories disponibles
   */
  static async getCategories(): Promise<string[]> {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/diagnostics/cim10/categories`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération des catégories');
    }

    const result = await response.json();
    return result.data || [];
  }
}

