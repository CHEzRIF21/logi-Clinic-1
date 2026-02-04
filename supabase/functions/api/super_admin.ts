// Handler Super Admin : cliniques et utilisateurs (réservé SUPER_ADMIN)
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateUser, hashPassword } from './auth.ts';

function requireSuperAdmin(req: Request): Promise<{ success: boolean; user?: any; error?: Response }> {
  return authenticateUser(req);
}

function ensureSuperAdmin(authResult: { success: boolean; user?: any; error?: Response }): Response | null {
  if (!authResult.success || !authResult.user) return authResult.error ?? new Response(
    JSON.stringify({ success: false, message: 'Authentification requise' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
  const roleUpper = (authResult.user.role ?? '').toString().toUpperCase();
  if (roleUpper !== 'SUPER_ADMIN') {
    return new Response(
      JSON.stringify({ success: false, message: 'Accès réservé au Super Admin' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  return null;
}

// Map frontend role (admin, medecin, ...) to DB role (CLINIC_ADMIN, MEDECIN, ...)
function toDbRole(role: string): string {
  const r = (role || '').trim().toLowerCase();
  if (r === 'admin') return 'CLINIC_ADMIN';
  return (role || '').trim().toUpperCase().replace(/-/g, '_');
}

export default async function handler(req: Request, path: string): Promise<Response> {
  const method = req.method;
  const pathParts = path.split('/').filter(p => p);
  // path = 'super-admin' | 'super-admin/clinics' | 'super-admin/clinics/:id' | 'super-admin/clinics/:clinicId/users' | 'super-admin/users/:id'

  const authResult = await requireSuperAdmin(req);
  const errResp = ensureSuperAdmin(authResult);
  if (errResp) return errResp;
  const superAdminUser = authResult.user!;

  try {
    // GET /api/super-admin/clinics
    if (method === 'GET' && pathParts[1] === 'clinics' && pathParts.length === 2) {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, code, name, address, phone, email, active, is_demo, created_at, updated_at')
        .order('name', { ascending: true });
      if (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true, clinics: data ?? [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST /api/super-admin/clinics
    if (method === 'POST' && pathParts[1] === 'clinics' && pathParts.length === 2) {
      const body = await req.json();
      const code = body.code ? String(body.code).trim().toUpperCase() : '';
      const name = body.name ? String(body.name).trim() : '';
      if (!code || !name) {
        return new Response(JSON.stringify({ success: false, message: 'Code et nom de clinique requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: existing } = await supabase.from('clinics').select('id').eq('code', code).maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ success: false, message: 'Une clinique avec ce code existe déjà' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: clinic, error } = await supabase
        .from('clinics')
        .insert({
          code,
          name,
          address: body.address ? String(body.address).trim() : null,
          phone: body.phone ? String(body.phone).trim() : null,
          email: body.email ? String(body.email).trim().toLowerCase() : null,
          active: body.active !== false,
          is_demo: false,
          is_temporary_code: false,
          requires_code_change: false,
          created_by_super_admin: superAdminUser.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true, clinic }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // PATCH /api/super-admin/clinics/:id
    if (method === 'PATCH' && pathParts[1] === 'clinics' && pathParts.length === 3) {
      const id = pathParts[2];
      const body = await req.json();
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.code !== undefined) updates.code = String(body.code).trim().toUpperCase();
      if (body.name !== undefined) updates.name = String(body.name).trim();
      if (body.address !== undefined) updates.address = body.address ? String(body.address).trim() : null;
      if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).trim() : null;
      if (body.email !== undefined) updates.email = body.email ? String(body.email).trim().toLowerCase() : null;
      if (body.active !== undefined) updates.active = !!body.active;
      const { data: clinic, error } = await supabase.from('clinics').update(updates).eq('id', id).select().single();
      if (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!clinic) {
        return new Response(JSON.stringify({ success: false, message: 'Clinique non trouvée' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true, clinic }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // GET /api/super-admin/clinics/:clinicId/users
    if (method === 'GET' && pathParts[1] === 'clinics' && pathParts.length === 4 && pathParts[3] === 'users') {
      const clinicId = pathParts[2];
      const { data, error } = await supabase
        .from('users')
        .select('id, email, nom, prenom, role, status, actif, created_at, last_login')
        .eq('clinic_id', clinicId)
        .order('nom', { ascending: true });
      if (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true, users: data ?? [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST /api/super-admin/clinics/:clinicId/users
    if (method === 'POST' && pathParts[1] === 'clinics' && pathParts.length === 4 && pathParts[3] === 'users') {
      const clinicId = pathParts[2];
      const body = await req.json();
      const email = body.email ? String(body.email).trim().toLowerCase() : '';
      const password = body.password;
      const nom = body.nom ? String(body.nom).trim() : '';
      const prenom = body.prenom ? String(body.prenom).trim() : '';
      const role = toDbRole(body.role ?? 'receptionniste');
      if (!email || !password) {
        return new Response(JSON.stringify({ success: false, message: 'Email et mot de passe requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (password.length < 8) {
        return new Response(JSON.stringify({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: existingClinic } = await supabase.from('clinics').select('id').eq('id', clinicId).maybeSingle();
      if (!existingClinic) {
        return new Response(JSON.stringify({ success: false, message: 'Clinique non trouvée' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
      if (existingUser) {
        return new Response(JSON.stringify({ success: false, message: 'Un utilisateur avec cet email existe déjà' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const passwordHash = await hashPassword(password);
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: passwordHash,
          nom: nom || null,
          prenom: prenom || null,
          role,
          clinic_id: clinicId,
          status: 'ACTIVE',
          actif: true,
          created_by: superAdminUser.id,
          updated_at: new Date().toISOString(),
        })
        .select('id, email, nom, prenom, role, status, actif, created_at')
        .single();
      if (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true, user }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // PATCH /api/super-admin/users/:id
    if (method === 'PATCH' && pathParts[1] === 'users' && pathParts.length === 3) {
      const userId = pathParts[2];
      const body = await req.json();
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.nom !== undefined) updates.nom = body.nom ? String(body.nom).trim() : null;
      if (body.prenom !== undefined) updates.prenom = body.prenom ? String(body.prenom).trim() : null;
      if (body.email !== undefined) updates.email = body.email ? String(body.email).trim().toLowerCase() : undefined;
      if (body.role !== undefined) updates.role = toDbRole(body.role);
      if (body.actif !== undefined) updates.actif = !!body.actif;
      if (body.password !== undefined && body.password !== '') {
        if (body.password.length < 8) {
          return new Response(JSON.stringify({ success: false, message: 'Le mot de passe doit contenir au moins 8 caractères' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        updates.password_hash = await hashPassword(body.password);
      }
      const { data: user, error } = await supabase.from('users').update(updates).eq('id', userId).select().single();
      if (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!user) {
        return new Response(JSON.stringify({ success: false, message: 'Utilisateur non trouvé' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ success: true, user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: false, message: 'Route non trouvée' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('super_admin:', e);
    return new Response(
      JSON.stringify({ success: false, message: e instanceof Error ? e.message : 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
