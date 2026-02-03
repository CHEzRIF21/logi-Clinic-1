// Utilitaires CORS pour les Edge Functions
// IMPORTANT: x-clinic-code doit être dans Allow-Headers pour que le frontend puisse l'envoyer
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-clinic-code',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
};

/**
 * Répond aux requêtes OPTIONS (preflight CORS) avec status 200 et body "ok".
 * Sans cette réponse, le navigateur bloque la requête réelle (x-clinic-code non autorisé).
 */
export function handleCors(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  return null;
}
