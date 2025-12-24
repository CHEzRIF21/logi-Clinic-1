// Edge Function: Bootstrap/link Clinic Admin to Supabase Auth (for existing public.users row)
// Usage: POST /functions/v1/bootstrap-clinic-admin-auth
// Headers: Authorization: Bearer <SUPER_ADMIN_ACCESS_TOKEN>
// Body: { clinicCode: string, adminEmail: string, adminPassword: string }
//
// Notes:
// - Creates the Supabase Auth user if missing (email_confirm=true)
// - Links public.users.auth_user_id to the created Auth user
// - If the Auth user already exists, returns a recovery link so the admin can reset password

/// <reference path="./deno.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// TYPES ET INTERFACES
// ============================================

/**
 * Interface pour le corps de la requête HTTP
 * Définit la structure des données attendues dans le body JSON
 */
interface RequestBody {
  clinicCode: string;
  adminEmail: string;
  adminPassword: string;
}

/**
 * Interface pour la réponse de succès
 */
interface SuccessResponse {
  success: true;
  message: string;
  clinic: {
    id: string;
    code: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
    auth_user_id?: string;
    role?: string;
    status?: string;
  };
  recoveryLink?: string | null;
  note?: string;
}

/**
 * Interface pour la réponse d'erreur
 */
interface ErrorResponse {
  success: false;
  error: string;
  details?: string | null;
  recoveryLink?: string | null;
  next?: string;
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Fonction serve qui gère les requêtes HTTP
 * @param req - Objet Request de l'API Fetch standard
 * @returns Response - Réponse HTTP avec JSON
 */
serve(async (req: Request): Promise<Response> => {
  // Gestion CORS pour les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ============================================
    // 1. VÉRIFICATION DE L'AUTHENTIFICATION
    // ============================================
    
    // Récupérer le header Authorization (Bearer token)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Authorization header required',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 2. CRÉATION DES CLIENTS SUPABASE
    // ============================================
    
    // Client avec Service Role Key (permissions admin complètes)
    // Utilisé pour créer des utilisateurs Auth et modifier la base de données
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Client avec Anon Key + token utilisateur (pour vérifier l'identité)
    // Utilisé pour vérifier que l'utilisateur qui appelle la fonction est authentifié
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // ============================================
    // 3. VÉRIFICATION DE L'IDENTITÉ DE L'UTILISATEUR
    // ============================================
    
    // Récupérer l'utilisateur authentifié depuis le token
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Unauthorized',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 4. VÉRIFICATION DU RÔLE SUPER_ADMIN
    // ============================================
    
    // Vérifier que l'utilisateur authentifié est un SUPER_ADMIN actif
    // On utilise supabaseAdmin pour contourner les RLS policies
    const { data: superAdminRow, error: superAdminErr } = await supabaseAdmin
      .from('users')
      .select('id, role, status')
      .eq('auth_user_id', auth.user.id)
      .single();

    if (superAdminErr || !superAdminRow || superAdminRow.role !== 'SUPER_ADMIN' || superAdminRow.status !== 'ACTIVE') {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Only SUPER_ADMIN can bootstrap auth users',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 5. PARSING DU BODY DE LA REQUÊTE
    // ============================================
    
    // Convertir le body JSON en objet TypeScript typé
    const body: RequestBody = await req.json();
    // Normaliser les données d'entrée
    const clinicCode = (body.clinicCode || '').toUpperCase().trim();
    const adminEmail = (body.adminEmail || '').toLowerCase().trim();
    const adminPassword = body.adminPassword || '';

    // Validation des champs requis
    if (!clinicCode || !adminEmail || !adminPassword) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'clinicCode, adminEmail, adminPassword are required',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 6. CHARGEMENT DE LA CLINIQUE
    // ============================================
    
    // Récupérer la clinique par son code
    // maybeSingle() retourne null si aucune ligne trouvée (au lieu de lever une erreur)
    const { data: clinic, error: clinicErr } = await supabaseAdmin
      .from('clinics')
      .select('id, code, name, active')
      .eq('code', clinicCode)
      .maybeSingle();

    if (clinicErr || !clinic) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: `Clinic ${clinicCode} not found`,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Vérifier que la clinique est active
    if (!clinic.active) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: `Clinic ${clinicCode} is inactive`,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 7. CHARGEMENT DE L'UTILISATEUR ADMIN
    // ============================================
    
    // Récupérer l'utilisateur admin dans public.users
    // On cherche par email ET clinic_id pour s'assurer qu'il appartient à la bonne clinique
    const { data: adminUserRow, error: adminUserErr } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status, clinic_id, auth_user_id, nom, prenom')
      .eq('email', adminEmail)
      .eq('clinic_id', clinic.id)
      .maybeSingle();

    if (adminUserErr || !adminUserRow) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Admin row not found in public.users for this clinic',
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 8. CAS : UTILISATEUR DÉJÀ LIÉ
    // ============================================
    
    // Si l'utilisateur a déjà un auth_user_id, il est déjà lié à Supabase Auth
    // On retourne juste les infos + un lien de récupération si besoin
    if (adminUserRow.auth_user_id) {
      // Générer un lien de récupération de mot de passe
      const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: adminEmail,
      });

      const successResponse: SuccessResponse = {
        success: true,
        message: 'User already linked to Supabase Auth. Use recovery link if password needs reset.',
        clinic: { id: clinic.id, code: clinic.code, name: clinic.name },
        user: {
          id: adminUserRow.id,
          email: adminEmail,
          role: adminUserRow.role,
          status: adminUserRow.status,
        },
        recoveryLink: link?.properties?.action_link ?? null,
        note: linkErr ? 'Failed to generate recovery link' : undefined,
      };

      return new Response(JSON.stringify(successResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 9. CRÉATION DE L'UTILISATEUR AUTH
    // ============================================
    
    // Créer l'utilisateur dans Supabase Auth
    // email_confirm: true = l'email est automatiquement confirmé (pas besoin de vérification)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'CLINIC_ADMIN',
        clinic_id: clinic.id,
        clinic_code: clinic.code,
        nom: adminUserRow.nom ?? null,
        prenom: adminUserRow.prenom ?? null,
      },
    });

    // Gestion des erreurs de création
    if (createErr || !created?.user) {
      // Si l'utilisateur existe déjà ou autre erreur, générer un lien de récupération
      const { data: link } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: adminEmail,
      });

      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Failed to create Auth user (user may already exist).',
        details: createErr?.message ?? null,
        recoveryLink: link?.properties?.action_link ?? null,
        next: 'If the Auth user already exists, reset password via recovery link, then link auth_user_id using supabase_migrations/03_VERIFIER_LIEN_AUTH_USERS.sql',
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 10. LIEN DE L'UTILISATEUR PUBLIC.USERS
    // ============================================
    
    // Mettre à jour public.users pour lier auth_user_id
    // On normalise aussi le rôle et le statut
    const { error: linkRowErr } = await supabaseAdmin
      .from('users')
      .update({
        auth_user_id: created.user.id,
        role: 'CLINIC_ADMIN',
        status: adminUserRow.status ?? 'PENDING',
        actif: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminUserRow.id);

    // Si le lien échoue, on fait un rollback (supprimer l'utilisateur Auth créé)
    if (linkRowErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Auth user created but failed to link public.users',
        details: linkRowErr.message,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 11. RÉPONSE DE SUCCÈS
    // ============================================
    
    const successResponse: SuccessResponse = {
      success: true,
      message: 'Clinic admin Auth user created and linked successfully.',
      clinic: { id: clinic.id, code: clinic.code, name: clinic.name },
      user: {
        id: adminUserRow.id,
        email: adminEmail,
        auth_user_id: created.user.id,
      },
    };

    return new Response(JSON.stringify(successResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    // ============================================
    // 12. GESTION DES ERREURS GLOBALES
    // ============================================
    
    // Capturer toutes les erreurs non gérées
    const errorMessage = e instanceof Error ? e.message : String(e);
    
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'Internal server error',
      details: errorMessage,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});



