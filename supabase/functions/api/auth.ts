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

  const token = authHeader.replace(/^\s*Bearer\s+/i, '').trim();
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[auth] SUPABASE_URL or SUPABASE_ANON_KEY manquant (Edge Function config)');
    return {
      success: false,
      error: new Response(
        JSON.stringify({ success: false, message: 'Configuration serveur incomplète' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  // Client avec en-tête Authorization pour que getUser() utilise le JWT de la requête
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Valider le JWT avec auth.getUser(token) ; try/catch pour éviter les crash en production
  let authUser: { id: string } | null = null;
  let authError: { message: string } | null = null;
  try {
    const result = await supabaseClient.auth.getUser(token);
    authUser = result.data?.user ?? null;
    authError = result.error ?? null;
  } catch (e) {
    authError = { message: e instanceof Error ? e.message : String(e) };
  }

  if (authError) {
    console.error('[auth] JWT validation failed:', authError.message, { hasToken: !!token, tokenLen: token?.length });
  }
  if (!authUser && !authError) {
    console.warn('[auth] getUser returned no user and no error');
  }

  if (authError || !authUser) {
    // Fallback: token interne (format: internal-<user_id>-<timestamp> ou token-<user_id>-<timestamp>)
    const internalMatch = token.match(/^(?:internal|token)-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-|$)/i);
    
    if (internalMatch) {
      const userId = internalMatch[1];
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, auth_user_id, email, role, clinic_id, actif, status')
        .eq('id', userId)
        .maybeSingle();
      
      if (
        userError ||
        !userData ||
        !userData.actif ||
        userData.status === 'SUSPENDED' ||
        userData.status === 'REJECTED' ||
        userData.status === 'PENDING' ||
        userData.status === 'PENDING_APPROVAL'
      ) {
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

  if (userError) {
    console.error('[auth] users table lookup failed:', userError.message, { authUserId: authUser.id });
  }
  if (!userData && !userError) {
    console.warn('[auth] No user row for auth_user_id:', authUser.id);
  }

  const statusUpper = (userData?.status ?? '').toString().toUpperCase();
  const isBlockedStatus = ['SUSPENDED', 'REJECTED', 'PENDING', 'PENDING_APPROVAL'].includes(statusUpper);
  const isActive = userData?.actif === true;

  if (userError || !userData || !isActive || isBlockedStatus) {
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

      // IMPORTANT:
      // Pour permettre au membre de se connecter avec le mot de passe saisi à l'inscription,
      // on crée le compte Supabase Auth dès la soumission.
      // L'accès reste bloqué jusqu'à approbation via public.users (actif=false, status=PENDING_APPROVAL).

      if (!clinicCode || String(clinicCode).trim() === '') {
        return new Response(JSON.stringify({ success: false, message: 'Le code clinique est requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const clinicCodeUpper = String(clinicCode).toUpperCase().trim();
      console.log('📝 Inscription - Code clinique saisi:', clinicCodeUpper);
      
      const { data: clinic, error: clinicErr } = await supabase
        .from('clinics')
        .select('id, name, code, active')
        .eq('code', clinicCodeUpper)
        .maybeSingle();

      console.log('🏥 Clinique trouvée:', clinic ? { id: clinic.id, name: clinic.name, code: clinic.code, active: clinic.active } : 'AUCUNE');
      
      if (clinicErr || !clinic || !clinic.active) {
        console.error('❌ Code clinique invalide:', clinicCodeUpper, clinicErr?.message || 'Clinique non trouvée ou inactive');
        return new Response(JSON.stringify({ success: false, message: 'Code clinique invalide ou clinique inactive' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const clinicId = clinic.id as string;
      console.log('✅ clinic_id pour la demande:', clinicId);
      const emailLower = String(email).toLowerCase().trim();

      const { data: existingRequest } = await supabase
        .from('registration_requests')
        .select('id')
        .eq('email', emailLower)
        .eq('clinic_id', clinicId)
        .maybeSingle();

      if (existingRequest) {
        return new Response(JSON.stringify({ success: false, message: 'Une demande avec cet email existe déjà pour cette clinique' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('email', emailLower)
        .maybeSingle();

      if (existingProfile) {
        return new Response(JSON.stringify({ success: false, message: 'Un compte avec cet email existe déjà' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 1) Créer utilisateur Supabase Auth (service role)
      const { data: authRes, error: authErr } = await supabase.auth.admin.createUser({
        email: emailLower,
        password,
        email_confirm: true,
        user_metadata: {
          nom,
          prenom,
          clinic_id: clinicId,
          pending_approval: true,
        },
      });

      if (authErr || !authRes?.user) {
        return new Response(JSON.stringify({ success: false, message: authErr?.message || 'Erreur création compte Auth' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const authUserId = authRes.user.id;

      // 2) Créer profil users en attente
      const { error: profileErr } = await supabase.from('users').insert({
        nom,
        prenom,
        email: emailLower,
        role: roleSouhaite || 'receptionniste',
        specialite: specialite || null,
        telephone: telephone || null,
        adresse: adresse || null,
        actif: false,
        status: 'PENDING_APPROVAL',
        clinic_id: clinicId,
        auth_user_id: authUserId,
      });

      if (profileErr) {
        await supabase.auth.admin.deleteUser(authUserId);
        return new Response(JSON.stringify({ success: false, message: 'Erreur création profil utilisateur', error: profileErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 3) Créer demande d'inscription (sans password_hash)
      let { data, error } = await supabase.from('registration_requests').insert({
        nom,
        prenom,
        email: emailLower,
        password_hash: null,
        telephone,
        adresse,
        role_souhaite: roleSouhaite || 'receptionniste',
        specialite,
        security_questions: securityQuestions,
        statut: 'pending',
        clinic_id: clinicId,
        clinic_code: clinicCodeUpper,
        auth_user_id: authUserId,
      }).select().single();

      // Compat: si la migration ajoutant auth_user_id n'est pas appliquée, réessayer sans la colonne
      if (error && (error as any)?.code === '42703' && String((error as any)?.message || '').includes('auth_user_id')) {
        const retry = await supabase.from('registration_requests').insert({
          nom,
          prenom,
          email: emailLower,
          password_hash: null,
          telephone,
          adresse,
          role_souhaite: roleSouhaite || 'receptionniste',
          specialite,
          security_questions: securityQuestions,
          statut: 'pending',
          clinic_id: clinicId,
          clinic_code: clinicCodeUpper,
        }).select().single();
        data = retry.data as any;
        error = retry.error as any;
      }

      if (error) {
        await supabase.auth.admin.deleteUser(authUserId);
        await supabase.from('users').delete().eq('auth_user_id', authUserId);
        return new Response(JSON.stringify({ success: false, message: 'Erreur lors de la création', error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Demande soumise avec succès. En attente d’approbation par l’administrateur.',
        data: { id: data.id, email: data.email, statut: data.statut, clinicCode: clinicCodeUpper },
      }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // GET /api/auth/registration-requests (protégé)
    if (method === 'GET' && pathParts[1] === 'registration-requests') {
      const authResult = await authenticateUser(req);
      if (!authResult.success) return authResult.error!;
      
      const user = authResult.user!;
      console.log('📋 GET registration-requests - User:', {
        id: user.id,
        email: user.email,
        role: user.role,
        clinic_id: user.clinic_id,
      });
      
      let clinicId = user.clinic_id;
      if (!clinicId) {
        const clinicCodeHeader = req.headers.get('X-Clinic-Code')?.trim();
        if (clinicCodeHeader) {
          const { data: clinicRow, error: clinicErr } = await supabase
            .from('clinics')
            .select('id')
            .ilike('code', clinicCodeHeader)
            .limit(1)
            .maybeSingle();
          if (!clinicErr && clinicRow?.id) {
            clinicId = clinicRow.id;
            console.log('📋 GET registration-requests - clinic_id résolu via X-Clinic-Code:', clinicCodeHeader, '→', clinicId);
          }
        }
      }
      if (!clinicId) {
        console.error('❌ Contexte de clinique manquant pour user:', user.id, '(pas de clinic_id ni X-Clinic-Code valide)');
        return new Response(JSON.stringify({ success: false, message: 'Contexte de clinique manquant' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const statut = url.searchParams.get('statut');
      
      console.log('🔍 Recherche demandes pour clinic_id:', clinicId, 'statut:', statut || 'tous');
      
      let query = supabase.from('registration_requests').select('*').eq('clinic_id', clinicId).order('created_at', { ascending: false });
      if (statut) query = query.eq('statut', statut);

      const { data, error } = await query;
      
      console.log('📊 Résultat requête:', {
        count: data?.length || 0,
        error: error?.message || null,
        clinicId,
      });
      
      if (error) {
        console.error('❌ Erreur Supabase:', error);
        return new Response(JSON.stringify({ success: false, message: 'Erreur', details: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Mapper snake_case vers camelCase pour le frontend
      const sanitizedData = (data || []).map(({ password_hash, role_souhaite, created_at, updated_at, reviewed_by, reviewed_at, raison_rejet, clinic_id, clinic_code, security_questions, ...rest }) => ({
        ...rest,
        _id: rest.id,
        roleSouhaite: role_souhaite || 'receptionniste',
        createdAt: created_at,
        updatedAt: updated_at,
        reviewedBy: reviewed_by,
        reviewedAt: reviewed_at,
        raisonRejet: raison_rejet,
        clinicId: clinic_id,
        clinicCode: clinic_code,
        securityQuestions: security_questions,
      }));
      
      return new Response(JSON.stringify({ success: true, requests: sanitizedData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST /api/auth/registration-requests/:id/approve (protégé)
    // Support aussi l'ancienne route: /api/auth/approve-registration/:id
    if (method === 'POST' && (
      (pathParts[1] === 'registration-requests' && pathParts[3] === 'approve') ||
      (pathParts[1] === 'approve-registration' && pathParts[2])
    )) {
      const id = pathParts[1] === 'registration-requests' ? pathParts[2] : pathParts[2];
      const authResult = await authenticateUser(req);
      if (!authResult.success) return authResult.error!;
      
      const user = authResult.user!;
      const clinicId = user.role === 'SUPER_ADMIN' ? (req.headers.get('x-clinic-id') || user.clinic_id) : user.clinic_id;

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
      // Workflow 2 étapes: créer user inactif (PENDING, actif=false), activation séparée
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

    // POST /api/auth/registration-requests/:id/reject (protégé)
    // Support aussi l'ancienne route: /api/auth/reject-registration/:id
    if (method === 'POST' && (
      (pathParts[1] === 'registration-requests' && pathParts[3] === 'reject') ||
      (pathParts[1] === 'reject-registration' && pathParts[2])
    )) {
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
