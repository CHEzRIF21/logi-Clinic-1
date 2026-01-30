// Helper d'authentification partagé pour toutes les Edge Functions
// SÉCURITÉ: Récupère le clinic_id depuis la base de données, PAS depuis les headers
import { supabase } from './supabase.ts';
import { corsHeaders } from './cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface AuthenticatedUser {
  id: string;
  auth_user_id: string;
  email: string;
  role: string;
  clinic_id: string | null;
  actif: boolean;
  status: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: Response;
}

/**
 * Authentifie l'utilisateur à partir du token JWT Supabase
 * SÉCURITÉ: Le clinic_id est TOUJOURS récupéré depuis la base de données
 * et JAMAIS depuis les headers (qui peuvent être manipulés)
 */
export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return {
      success: false,
      error: new Response(
        JSON.stringify({ success: false, message: 'Authentification requise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Créer un client Supabase avec le token pour récupérer l'utilisateur
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  // Récupérer l'utilisateur authentifié via Supabase Auth
  const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);
  
  if (authError || !authUser) {
    // Fallback: essayer avec un token interne (format: internal-<user_id>-<timestamp>)
    const internalMatch = token.match(/^internal-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i);
    
    if (internalMatch) {
      const userId = internalMatch[1];
      
      // Récupérer le profil utilisateur depuis la table users avec l'ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, auth_user_id, email, role, clinic_id, actif, status')
        .eq('id', userId)
        .maybeSingle();
      
      if (userError || !userData) {
        return {
          success: false,
          error: new Response(
            JSON.stringify({ success: false, message: 'Utilisateur non trouvé' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          ),
        };
      }
      
      if (!userData.actif || userData.status === 'SUSPENDED' || userData.status === 'REJECTED' || userData.status === 'PENDING') {
        return {
          success: false,
          error: new Response(
            JSON.stringify({ success: false, message: 'Compte non activé, inactif ou suspendu' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          ),
        };
      }
      
      return {
        success: true,
        user: userData as AuthenticatedUser,
      };
    }
    
    return {
      success: false,
      error: new Response(
        JSON.stringify({ success: false, message: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  // Récupérer le profil utilisateur depuis la table users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, auth_user_id, email, role, clinic_id, actif, status')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (userError || !userData) {
    return {
      success: false,
      error: new Response(
        JSON.stringify({ success: false, message: 'Profil utilisateur non trouvé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  if (!userData.actif || userData.status === 'SUSPENDED' || userData.status === 'REJECTED' || userData.status === 'PENDING') {
    return {
      success: false,
      error: new Response(
        JSON.stringify({ success: false, message: 'Compte inactif, en attente d\'activation ou suspendu' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  return {
    success: true,
    user: userData as AuthenticatedUser,
  };
}

/**
 * Vérifie que l'utilisateur a un clinic_id valide.
 * Isolation stricte: TOUS les utilisateurs (y compris SUPER_ADMIN) doivent avoir un clinic_id.
 */
export function requireClinicContext(user: AuthenticatedUser): Response | null {
  if (!user.clinic_id) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Contexte de clinique manquant. Veuillez vous reconnecter.',
        code: 'MISSING_CLINIC_CONTEXT',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  return null;
}

/**
 * Retourne le clinic_id effectif pour le filtrage des données.
 * SÉCURITÉ: Toujours depuis la base (user.clinic_id), JAMAIS depuis les headers.
 */
export function getEffectiveClinicId(user: AuthenticatedUser, _req: Request): string | null {
  return user.clinic_id;
}
