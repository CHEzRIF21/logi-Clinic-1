/**
 * Client API pour les appels au backend
 * Gère l'authentification et les erreurs de manière centralisée
 */

// Support pour Vite (import.meta.env) et CRA (process.env) pour compatibilité
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  '';

// Vérification de la configuration au chargement du module
if (!API_BASE_URL && typeof window !== 'undefined') {
  console.error('⚠️ VITE_API_URL non configuré !');
  console.error('Créez un fichier .env avec:');
  console.error('VITE_API_URL=http://localhost:3000/api');
}

/**
 * Récupère le token JWT depuis le localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
}

/**
 * Nettoie les données d'authentification et redirige vers la page de login
 */
function handleAuthError(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('clinic_id');
  
  // Rediriger vers la page de login si on n'y est pas déjà
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

/**
 * Logger les erreurs pour debugging (en développement uniquement)
 */
function logError(endpoint: string, status: number, message: string): void {
  if (import.meta.env.DEV) {
    console.error(`[API Error] ${endpoint} - Status: ${status} - ${message}`);
  }
}

/**
 * Effectue une requête HTTP avec authentification
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_URL n\'est pas configuré. Veuillez configurer la variable d\'environnement VITE_API_URL.');
  }

  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ajouter le clinic_id dans les headers si disponible
  const clinicId = localStorage.getItem('clinic_id');
  if (clinicId) {
    headers['x-clinic-id'] = clinicId;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Gérer les erreurs HTTP
    if (!response.ok) {
      // Gérer l'erreur 401 - Non authentifié
      if (response.status === 401) {
        logError(endpoint, 401, 'Session expirée ou token invalide');
        handleAuthError();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      // Gérer l'erreur 403 - Non autorisé
      if (response.status === 403) {
        logError(endpoint, 403, 'Permission refusée');
        throw new Error('Vous n\'avez pas les permissions nécessaires pour effectuer cette action.');
      }
      
      // Gérer les erreurs serveur (500+)
      if (response.status >= 500) {
        logError(endpoint, response.status, 'Erreur serveur');
        throw new Error('Erreur de connexion au serveur. Veuillez réessayer plus tard.');
      }
      
      // Gérer l'erreur 404 - Non trouvé
      if (response.status === 404) {
        logError(endpoint, 404, 'Ressource non trouvée');
        throw new Error('La ressource demandée n\'existe pas.');
      }
      
      // Gérer l'erreur 400 - Mauvaise requête
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({
          message: 'Données invalides',
        }));
        logError(endpoint, 400, errorData.message);
        throw new Error(errorData.message || 'Les données envoyées sont invalides.');
      }
      
      // Gérer l'erreur 409 - Conflit
      if (response.status === 409) {
        const errorData = await response.json().catch(() => ({
          message: 'Conflit de données',
        }));
        logError(endpoint, 409, errorData.message);
        throw new Error(errorData.message || 'Cette donnée existe déjà ou est en conflit.');
      }

      // Autres erreurs HTTP
      const errorData = await response.json().catch(() => ({
        message: `Erreur HTTP ${response.status}: ${response.statusText}`,
      }));
      
      logError(endpoint, response.status, errorData.message);
      throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Si la réponse contient un champ 'data', le retourner directement
    if (data.success && data.data !== undefined) {
      return data.data as T;
    }
    
    return data as T;
  } catch (error) {
    // Gérer les erreurs réseau (pas de connexion, timeout, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logError(endpoint, 0, 'Erreur réseau - Impossible de contacter le serveur');
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erreur réseau inconnue');
  }
}

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T>(endpoint: string, body?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T>(endpoint: string, body?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * PATCH request
 */
export async function apiPatch<T>(endpoint: string, body?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Upload de fichier avec authentification
 */
export async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_URL n\'est pas configuré.');
  }

  const token = getAuthToken();
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const clinicId = localStorage.getItem('clinic_id');
  if (clinicId) {
    headers['x-clinic-id'] = clinicId;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleAuthError();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      if (response.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires.');
      }
      if (response.status >= 500) {
        throw new Error('Erreur de connexion au serveur.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data !== undefined ? data.data : data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erreur lors de l\'upload');
  }
}

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  patch: apiPatch,
  upload: apiUpload,
};
