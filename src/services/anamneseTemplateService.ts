// Support pour Vite (import.meta.env) et CRA (process.env) pour compatibilité
const API_URL = import.meta.env.VITE_API_URL || 
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  '';

export interface AnamneseTemplate {
  id: string;
  nom: string;
  contenu: string;
  categorie?: string;
  actif: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export class AnamneseTemplateService {
  /**
   * Récupérer tous les templates d'anamnèse
   */
  static async getTemplates(categorie?: string): Promise<AnamneseTemplate[]> {
    if (!API_URL) {
      throw new Error('VITE_API_URL n\'est pas configuré. Veuillez configurer la variable d\'environnement VITE_API_URL.');
    }
    const token = localStorage.getItem('token');
    // `VITE_API_URL` pointe déjà sur la base API (souvent `http://localhost:3000/api`)
    // donc on évite de rajouter un second `/api`.
    const url = new URL(`${API_URL}/anamnese-templates`);
    
    if (categorie) {
      url.searchParams.append('categorie', categorie);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération des templates');
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Récupérer un template par ID
   */
  static async getTemplateById(id: string): Promise<AnamneseTemplate> {
    if (!API_URL) {
      throw new Error('VITE_API_URL n\'est pas configuré. Veuillez configurer la variable d\'environnement VITE_API_URL.');
    }
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/anamnese-templates/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération du template');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Créer un nouveau template
   */
  static async createTemplate(template: Partial<AnamneseTemplate>): Promise<AnamneseTemplate> {
    if (!API_URL) {
      throw new Error('VITE_API_URL n\'est pas configuré. Veuillez configurer la variable d\'environnement VITE_API_URL.');
    }
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/anamnese-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(template)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création du template');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Mettre à jour un template
   */
  static async updateTemplate(
    id: string,
    template: Partial<AnamneseTemplate>
  ): Promise<AnamneseTemplate> {
    if (!API_URL) {
      throw new Error('VITE_API_URL n\'est pas configuré. Veuillez configurer la variable d\'environnement VITE_API_URL.');
    }
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/anamnese-templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(template)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour du template');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Supprimer un template (soft delete)
   */
  static async deleteTemplate(id: string): Promise<void> {
    if (!API_URL) {
      throw new Error('VITE_API_URL n\'est pas configuré. Veuillez configurer la variable d\'environnement VITE_API_URL.');
    }
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/anamnese-templates/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la suppression du template');
    }
  }
}

