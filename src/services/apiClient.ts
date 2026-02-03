/**
 * Client API pour les appels au backend
 * Gère l'authentification et les erreurs de manière centralisée
 * 
 * AMÉLIORATIONS:
 * - Retry logic avec backoff exponentiel
 * - Gestion intelligente des erreurs 5xx
 * - Pas de retry pour les erreurs 4xx (erreurs client)
 */

// URL de production par défaut (Supabase Edge Functions)
const PRODUCTION_API_URL = 'https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api';

/**
 * Source unique de vérité pour l'URL API.
 *
 * - Si `VITE_API_URL` est défini → on l'utilise (dev/prod)
 * - Sinon en DEV → base URL relative (''), pour pointer vers le même origin (proxy / serveur local)
 * - Sinon en PROD → fallback Supabase Edge Functions
 */
const ENV_API_URL =
  (import.meta.env.VITE_API_URL ?? null) ||
  ((typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) ?? null);

const API_BASE_URL = ENV_API_URL !== null
  ? ENV_API_URL
  : (import.meta.env.DEV ? '' : PRODUCTION_API_URL);

// Log pour debug (uniquement en développement)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  console.log('🔗 API URL configurée (source unique):', API_BASE_URL || '(relative)');
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
 * Vérifie si un token est un JWT valide (format: xxx.yyy.zzz)
 */
function isValidJWT(token: string | null): boolean {
  if (!token) return false;
  // Un JWT a 3 parties séparées par des points
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Récupère le token JWT depuis le localStorage
 * IMPORTANT:
 * - On accepte les JWT (xxx.yyy.zzz)
 * - On accepte aussi les tokens internes `internal-...` (utilisés par nos Edge Functions)
 * - On refuse les autres formats non-JWT
 */
function getAuthToken(): string | null {
  // #region agent log
  console.log('🔍 getAuthToken called');
  fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.ts:103',message:'getAuthToken entry',data:{hasToken:!!localStorage.getItem('token'),hasAuthToken:!!localStorage.getItem('authToken')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  
  if (!token) {
    // #region agent log
    console.log('🔍 getAuthToken: no token found');
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.ts:107',message:'getAuthToken no token',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return null;
  }

  // JWT Supabase classique
  if (isValidJWT(token)) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.ts:112',message:'getAuthToken JWT valid',data:{tokenLength:token.length,tokenPrefix:token.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return token;
  }

  // Token interne supporté côté backend (Edge Functions /api/auth/*)
  if (token.startsWith('internal-')) {
    // #region agent log
    console.log('🔍 getAuthToken: internal token found', { tokenPrefix: token.substring(0, 30) });
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.ts:118',message:'getAuthToken internal token',data:{tokenLength:token.length,tokenPrefix:token.substring(0,30)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return token;
  }

  // Autres formats: ne pas les envoyer pour éviter des erreurs côté auth
  console.warn('⚠️ Token non supporté détecté dans localStorage. Ignoré pour les appels API.');
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.ts:125',message:'getAuthToken unsupported format',data:{tokenLength:token.length,tokenPrefix:token.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  return null;
  
  // unreachable
}

/**
 * Nettoie les données d'authentification et redirige vers la page de login
 */
function handleAuthError(): void {
  // #region agent log
  console.error('🔍 handleAuthError called', {
    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
  });
  fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'apiClient.ts:124',
      message: 'handleAuthError called',
      data: { currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown' },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A',
    }),
  }).catch(() => {});
  // #endregion

  // Nettoyer uniquement le stockage local.
  // On NE force PLUS de redirection globale ici pour éviter les aller-retours
  // vers la landing page /login en plein milieu d'une navigation.
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('clinic_id');

  // #region agent log
  console.error('🔍 handleAuthError: localStorage cleared (aucune redirection forcée)');
  fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'apiClient.ts:132',
      message: 'handleAuthError storage cleared',
      data: { currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown' },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A',
    }),
  }).catch(() => {});
  // #endregion

  // La redirection éventuelle est désormais gérée au niveau des composants UI
  // (ex: messages "Session expirée" + bouton "Se reconnecter"),
  // au lieu de forcer un window.location.href ici.
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
  // API_BASE_URL peut être '' (relative) en développement: c'est valide
  if (API_BASE_URL === null || API_BASE_URL === undefined) {
    throw new Error('URL API non configurée. Veuillez configurer VITE_API_URL (ou REACT_APP_API_URL).');
  }

  const token = getAuthToken();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.ts:157',message:'apiRequest before fetch',data:{endpoint,hasToken:!!token,tokenType:token?token.startsWith('internal-')?'internal':'jwt':'none',apiBaseUrl:API_BASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.ts:165',message:'Authorization header set',data:{endpoint,authorizationPrefix:headers['Authorization']?.substring(0,30)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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
  // API_BASE_URL peut être '' (relative) en développement: c'est valide
  if (API_BASE_URL === null || API_BASE_URL === undefined) {
    throw new Error('URL API non configurée. Veuillez configurer VITE_API_URL (ou REACT_APP_API_URL).');
  }

  const token = getAuthToken();
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
