/**
 * Client API pour les appels au backend
 * Gère l'authentification et les erreurs de manière centralisée
 * 
 * AMÉLIORATIONS:
 * - Retry logic avec backoff exponentiel
 * - Gestion intelligente des erreurs 5xx
 * - Pas de retry pour les erreurs 4xx (erreurs client)
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
 * Configuration du retry
 */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  // Retry uniquement sur les erreurs serveur temporaires et les timeouts
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Calcule le délai avec backoff exponentiel et jitter
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  // Backoff exponentiel: baseDelay * 2^attempt
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  // Ajouter un jitter aléatoire (±25%)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  const delay = Math.min(exponentialDelay + jitter, config.maxDelayMs);
  return Math.round(delay);
}

/**
 * Vérifie si l'erreur est retryable
 */
function isRetryableError(status: number, config: RetryConfig): boolean {
  return config.retryableStatusCodes.includes(status);
}

/**
 * Vérifie si c'est une erreur réseau
 */
function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && 
    (error.message.includes('fetch') || error.message.includes('network'));
}

/**
 * Pause l'exécution pendant un certain temps
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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

/**
 * Effectue une requête HTTP avec retry automatique
 * 
 * @param endpoint - L'endpoint de l'API
 * @param options - Options de la requête fetch
 * @param retryConfig - Configuration du retry (optionnel)
 */
export async function apiRequestWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<T> {
  const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Tenter la requête
      const result = await apiRequest<T>(endpoint, options);
      
      // Si on a réussi après des retries, logger
      if (attempt > 0 && import.meta.env.DEV) {
        console.log(`[API Retry] ${endpoint} - Succès après ${attempt} tentative(s)`);
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Extraire le status code de l'erreur si possible
      const statusMatch = lastError.message.match(/HTTP (\d+)/);
      const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 0;
      
      // Vérifier si on doit réessayer
      const shouldRetry = 
        attempt < config.maxRetries && 
        (isNetworkError(error) || isRetryableError(statusCode, config));
      
      if (!shouldRetry) {
        throw lastError;
      }
      
      // Calculer et appliquer le délai
      const delay = calculateBackoffDelay(attempt, config);
      
      if (import.meta.env.DEV) {
        console.warn(
          `[API Retry] ${endpoint} - Tentative ${attempt + 1}/${config.maxRetries} échouée. ` +
          `Retry dans ${delay}ms... (${lastError.message})`
        );
      }
      
      await sleep(delay);
    }
  }
  
  // Si on arrive ici, toutes les tentatives ont échoué
  throw lastError || new Error('Toutes les tentatives ont échoué');
}

/**
 * GET request avec retry
 */
export async function apiGetWithRetry<T>(
  endpoint: string, 
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  return apiRequestWithRetry<T>(endpoint, { method: 'GET' }, retryConfig);
}

/**
 * POST request avec retry
 */
export async function apiPostWithRetry<T>(
  endpoint: string, 
  body?: any,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  return apiRequestWithRetry<T>(
    endpoint, 
    {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    },
    retryConfig
  );
}

/**
 * PUT request avec retry
 */
export async function apiPutWithRetry<T>(
  endpoint: string, 
  body?: any,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  return apiRequestWithRetry<T>(
    endpoint,
    {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    },
    retryConfig
  );
}

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  patch: apiPatch,
  upload: apiUpload,
  // Versions avec retry
  getWithRetry: apiGetWithRetry,
  postWithRetry: apiPostWithRetry,
  putWithRetry: apiPutWithRetry,
  requestWithRetry: apiRequestWithRetry,
};
