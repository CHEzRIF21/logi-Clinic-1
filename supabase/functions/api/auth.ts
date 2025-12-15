// Handler d'authentification pour Supabase Edge Functions
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Hash password avec Web Crypto API (Deno)
async function hashPassword(password: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'logi_clinic_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req: Request, path: string): Promise<Response> {
  const method = req.method;
  const url = new URL(req.url);
  const pathParts = path.split('/').filter(p => p);

  try {
    // POST /api/auth/register-request
    if (method === 'POST' && pathParts[1] === 'register-request') {
      const body = await req.json();
      const { nom, prenom, email, password, passwordConfirm, telephone, adresse, roleSouhaite, specialite, securityQuestions } = body;

      if (!nom || !prenom || !email || !password) {
        return new Response(
          JSON.stringify({ success: false, message: 'Nom, prénom, email et mot de passe sont requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (password !== passwordConfirm) {
        return new Response(
          JSON.stringify({ success: false, message: 'Les mots de passe ne correspondent pas' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (password.length < 8) {
        return new Response(
          JSON.stringify({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier si l'email existe déjà
      const { data: existingUser } = await supabase
        .from('registration_requests')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ success: false, message: 'Une demande avec cet email existe déjà' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: existingUserActive } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUserActive) {
        return new Response(
          JSON.stringify({ success: false, message: 'Un compte avec cet email existe déjà' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const passwordHash = await hashPassword(password);

      const { data, error } = await supabase
        .from('registration_requests')
        .insert({
          nom,
          prenom,
          email: email.toLowerCase(),
          password_hash: passwordHash,
          telephone,
          adresse,
          role_souhaite: roleSouhaite || 'receptionniste',
          specialite,
          security_questions: securityQuestions,
          statut: 'pending',
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: 'Erreur lors de la création de la demande', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Demande d\'inscription soumise avec succès. Un administrateur va examiner votre demande.',
          data: { id: data.id, email: data.email, statut: data.statut },
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/auth/registration-requests
    if (method === 'GET' && pathParts[1] === 'registration-requests') {
      const url = new URL(req.url);
      const statut = url.searchParams.get('statut');

      let query = supabase
        .from('registration_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statut && statut !== '') {
        query = query.eq('statut', statut);
      }

      const { data, error } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: 'Erreur lors de la récupération des demandes' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const sanitizedData = (data || []).map(({ password_hash, ...rest }) => rest);

      return new Response(
        JSON.stringify({ success: true, requests: sanitizedData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/auth/approve-registration/:id
    if (method === 'POST' && pathParts[1] === 'approve-registration' && pathParts[2]) {
      const id = pathParts[2];
      const body = await req.json();
      const { role, permissions, notes } = body;

      const { data: request, error: fetchError } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !request) {
        return new Response(
          JSON.stringify({ success: false, message: 'Demande non trouvée' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (request.statut !== 'pending') {
        return new Response(
          JSON.stringify({ success: false, message: 'Cette demande a déjà été traitée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: userError } = await supabase
        .from('users')
        .insert({
          nom: request.nom,
          prenom: request.prenom,
          email: request.email,
          password_hash: request.password_hash,
          role: role || request.role_souhaite,
          specialite: request.specialite,
          telephone: request.telephone,
          adresse: request.adresse,
          actif: true,
        });

      if (userError) {
        return new Response(
          JSON.stringify({ success: false, message: 'Erreur lors de la création de l\'utilisateur' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase
        .from('registration_requests')
        .update({
          statut: 'approved',
          notes,
          date_approbation: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      return new Response(
        JSON.stringify({ success: true, message: 'Demande approuvée avec succès' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/auth/reject-registration/:id
    if (method === 'POST' && pathParts[1] === 'reject-registration' && pathParts[2]) {
      const id = pathParts[2];
      const body = await req.json();
      const { raisonRejet, notes } = body;

      const { error } = await supabase
        .from('registration_requests')
        .update({
          statut: 'rejected',
          raison_rejet: raisonRejet,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: 'Erreur lors du rejet de la demande' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Demande rejetée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/auth/login
    if (method === 'POST' && pathParts[1] === 'login') {
      const body = await req.json();
      const { email, password } = body;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ success: false, message: 'Email et mot de passe requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const passwordHash = await hashPassword(password);

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('password_hash', passwordHash)
        .single();

      if (error || !user) {
        return new Response(
          JSON.stringify({ success: false, message: 'Email ou mot de passe incorrect' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!user.actif) {
        return new Response(
          JSON.stringify({ success: false, message: 'Ce compte est désactivé' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Générer un token simple
      const token = crypto.randomUUID();

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Connexion réussie',
          user: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
            specialite: user.specialite,
          },
          token,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Route non trouvée' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur auth:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
