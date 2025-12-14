// Support pour Vite (import.meta.env) et CRA (process.env) pour compatibilité
const API_URL = import.meta.env.VITE_API_URL || 
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  '';

export interface Deparasitage {
  id: string;
  patient_id: string;
  molecule: string;
  date_administration: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DeparasitageFormData {
  patient_id: string;
  molecule: string;
  date_administration: string;
}

export class DeparasitageService {
  /**
   * Récupérer l'historique de déparasitage d'un patient
   */
  static async getPatientDeparasitage(
    patientId: string,
    limit: number = 50
  ): Promise<Deparasitage[]> {
    if (!API_URL) {
      throw new Error('VITE_API_URL n\'est pas configuré. Veuillez configurer la variable d\'environnement VITE_API_URL.');
    }
    const token = localStorage.getItem('token');
    const url = new URL(`${API_URL}/api/deparasitage/patient/${patientId}`);
    url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération du déparasitage');
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Enregistrer un nouveau déparasitage
   */
  static async recordDeparasitage(data: DeparasitageFormData): Promise<Deparasitage> {
    if (!API_URL) {
      throw new Error('VITE_API_URL n\'est pas configuré. Veuillez configurer la variable d\'environnement VITE_API_URL.');
    }
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/deparasitage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'enregistrement du déparasitage');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Mettre à jour un déparasitage
   */
  static async updateDeparasitage(
    id: string,
    data: Partial<DeparasitageFormData>
  ): Promise<Deparasitage> {
    if (!API_URL) {
      throw new Error('VITE_API_URL n\'est pas configuré. Veuillez configurer la variable d\'environnement VITE_API_URL.');
    }
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/deparasitage/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour du déparasitage');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Supprimer un déparasitage
   */
  static async deleteDeparasitage(id: string): Promise<void> {
    if (!API_URL) {
      throw new Error('VITE_API_URL n\'est pas configuré. Veuillez configurer la variable d\'environnement VITE_API_URL.');
    }
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/deparasitage/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la suppression du déparasitage');
    }
  }
}

