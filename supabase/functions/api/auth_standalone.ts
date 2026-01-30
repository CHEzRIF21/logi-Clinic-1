// Handler d'authentification pour Supabase Edge Functions (VERSION STANDALONE)
// SÉCURITÉ: Authentification inline - pas de dépendance sur _shared/auth.ts
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Hash password avec Web Crypto API (Deno)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'logi_clinic_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Fonction d'authentification inline
async function authenticateUser(req: Request): Promise<{ success: boolean; user?: any; error?: Response }> {
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
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);
  
  if (authError || !authUser) {
    // Fallback: token interne (format: internal-<user_id>-<timestamp>)
    const internalMatch = token.match(/^internal-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i);
    
    if (internalMatch) {
      const userId = internalMatch[1];
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, auth_user_id, email, role, clinic_id, actif, status')
        .eq('id', userId)
        .maybeSingle();
      
      if (userError || !userData || !userData.actif || userData.status === 'SUSPENDED' || userData.status === 'REJECTED' || userData.status === 'PENDING') {
        return {
          success: false,
          error: new Response(
            JSON.stringify({ success: false, message: 'Utilisateur non trouvé, inactif ou en attente d\'activation' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          ),
        };
      }
      return { success: true, user: userData };
    }
    
    return {
      success: false,
      error: new Response(
        JSON.stringify({ success: false, message: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, auth_user_id, email, role, clinic_id, actif, status')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (userError || !userData || !userData.actif || userData.status === 'SUSPENDED' || userData.status === 'REJECTED' || userData.status === 'PENDING') {
    return {
      success: false,
      error: new Response(
        JSON.stringify({ success: false, message: 'Profil utilisateur non trouvé, inactif ou en attente d\'activation' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  return { success: true, user: userData };
}

export default async function handler(req: Request, path: string): Promise<Response> {
  const method = req.method;
  const url = new URL(req.url);
  const pathParts = path.split('/').filter(p => p);

  try {
    // POST /api/auth/register-request (public)
    if (method === 'POST' && pathParts[1] === 'register-request') {
      const body = await req.json();
      const { nom, prenom, email, password, passwordConfirm, telephone, adresse, roleSouhaite, specialite, securityQuestions, clinicCode } = body;

      if (!nom || !prenom || !email || !password) {
        return new Response(JSON.stringify({ success: false, message: 'Nom, prénom, email et mot de passe sont requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (password !== passwordConfirm) {
        return new Response(JSON.stringify({ success: false, message: 'Les mots de passe ne correspondent pas' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (password.length < 8) {
        return new Response(JSON.stringify({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      let clinicId: string | null = null;
      if (clinicCode) {
        const { data: clinic } = await supabase.from('clinics').select('id').eq('code', clinicCode.toUpperCase()).maybeSingle();
        if (!clinic) {
          return new Response(JSON.stringify({ success: false, message: 'Code clinique invalide' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        clinicId = clinic.id;
      }

      const { data: existingUser } = await supabase.from('registration_requests').select('id').eq('email', email.toLowerCase()).single();
      if (existingUser) {
        return new Response(JSON.stringify({ success: false, message: 'Une demande avec cet email existe déjà' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const passwordHash = await hashPassword(password);
      const { data, error } = await supabase.from('registration_requests').insert({
        nom, prenom, email: email.toLowerCase(), password_hash: passwordHash, telephone, adresse,
        role_souhaite: roleSouhaite || 'receptionniste', specialite, security_questions: securityQuestions,
        statut: 'pending', clinic_id: clinicId, clinic_code: clinicCode?.toUpperCase() || null,
      }).select().single();

      if (error) {
        return new Response(JSON.stringify({ success: false, message: 'Erreur lors de la création', error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true, message: 'Demande soumise avec succès', data: { id: data.id, email: data.email, statut: data.statut } }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // GET /api/auth/registration-requests (protégé)
    if (method === 'GET' && pathParts[1] === 'registration-requests') {
      const authResult = await authenticateUser(req);
      if (!authResult.success) return authResult.error!;
      
      const user = authResult.user!;
      if (!user.clinic_id) {
        return new Response(JSON.stringify({ success: false, message: 'Contexte de clinique manquant' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const clinicId = user.clinic_id;
      const statut = url.searchParams.get('statut');
      
      let query = supabase.from('registration_requests').select('*').eq('clinic_id', clinicId).order('created_at', { ascending: false });
      if (statut) query = query.eq('statut', statut);

      const { data, error } = await query;
      if (error) {
        return new Response(JSON.stringify({ success: false, message: 'Erreur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const sanitizedData = (data || []).map(({ password_hash, ...rest }) => rest);
      return new Response(JSON.stringify({ success: true, requests: sanitizedData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST /api/auth/approve-registration/:id (protégé)
    if (method === 'POST' && pathParts[1] === 'approve-registration' && pathParts[2]) {
      const id = pathParts[2];
      const authResult = await authenticateUser(req);
      if (!authResult.success) return authResult.error!;
      
      const user = authResult.user!;
      if (!user.clinic_id) {
        return new Response(JSON.stringify({ success: false, message: 'Contexte de clinique manquant' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const clinicId = user.clinic_id;

      const { data: request, error: fetchError } = await supabase.from('registration_requests').select('*').eq('id', id).single();
      if (fetchError || !request) {
        return new Response(JSON.stringify({ success: false, message: 'Demande non trouvée' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (request.clinic_id !== clinicId) {
        return new Response(JSON.stringify({ success: false, message: 'Accès non autorisé' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (request.statut !== 'pending') {
        return new Response(JSON.stringify({ success: false, message: 'Déjà traitée' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const body = await req.json();
      const { error: userError } = await supabase.from('users').insert({
        nom: request.nom, prenom: request.prenom, email: request.email, password_hash: request.password_hash,
        role: body.role || request.role_souhaite, specialite: request.specialite, telephone: request.telephone,
        adresse: request.adresse, actif: false, status: 'PENDING', clinic_id: request.clinic_id,
      });
      if (userError) {
        return new Response(JSON.stringify({ success: false, message: 'Erreur', error: userError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      await supabase.from('registration_requests').update({
        statut: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', id);
      return new Response(JSON.stringify({ success: true, message: 'Approuvée' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST /api/auth/reject-registration/:id (protégé)
    if (method === 'POST' && pathParts[1] === 'reject-registration' && pathParts[2]) {
      const id = pathParts[2];
      const authResult = await authenticateUser(req);
      if (!authResult.success) return authResult.error!;
      
      const user = authResult.user!;
      if (!user.clinic_id) {
        return new Response(JSON.stringify({ success: false, message: 'Contexte de clinique manquant' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const clinicId = user.clinic_id;

      const { data: request } = await supabase.from('registration_requests').select('clinic_id').eq('id', id).single();
      if (!request) {
        return new Response(JSON.stringify({ success: false, message: 'Demande non trouvée' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (request.clinic_id !== clinicId) {
        return new Response(JSON.stringify({ success: false, message: 'Accès non autorisé' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const body = await req.json();
      await supabase.from('registration_requests').update({
        statut: 'rejected', raison_rejet: body.raisonRejet, reviewed_by: user.id,
        reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', id);
      return new Response(JSON.stringify({ success: true, message: 'Rejetée' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST /api/auth/login (public)
    if (method === 'POST' && pathParts[1] === 'login') {
      const body = await req.json();
      if (!body.email || !body.password) {
        return new Response(JSON.stringify({ success: false, message: 'Email et mot de passe requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const passwordHash = await hashPassword(body.password);
      const { data: user } = await supabase.from('users').select('*').eq('email', body.email.toLowerCase()).eq('password_hash', passwordHash).single();
      if (!user || !user.actif) {
        return new Response(JSON.stringify({ success: false, message: 'Identifiants incorrects ou compte désactivé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);
      const token = `internal-${user.id}-${Date.now()}`;
      return new Response(JSON.stringify({
        success: true, message: 'Connexion réussie',
        user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, clinic_id: user.clinic_id },
        token,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: false, message: 'Route non trouvée' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Erreur auth:', error);
    return new Response(JSON.stringify({ success: false, message: error.message || 'Erreur serveur' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}
