// Handler patients pour Supabase Edge Functions
// SÉCURITÉ: Utilise l'authentification sécurisée (clinic_id depuis la DB, pas les headers)
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateRequest, requireClinicContext, getEffectiveClinicId } from '../_shared/auth.ts';

export default async function handler(req: Request, path: string): Promise<Response> {
  const method = req.method;
  const pathParts = path.split('/').filter(p => p);

  try {
    // Authentifier l'utilisateur
    const authResult = await authenticateRequest(req);
    if (!authResult.success || !authResult.user) {
      return authResult.error!;
    }
    
    const user = authResult.user;
    
    // Vérifier le contexte de clinique
    const clinicError = requireClinicContext(user);
    if (clinicError) {
      return clinicError;
    }
    
    // Récupérer le clinic_id effectif (depuis la DB, pas les headers)
    const clinicId = getEffectiveClinicId(user, req);
    
    // Si pas de clinic_id et pas SUPER_ADMIN, refuser
    if (!clinicId && user.role !== 'SUPER_ADMIN') {
      return new Response(
        JSON.stringify({ success: false, message: 'Contexte de clinique requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/patients
    if (method === 'GET' && pathParts.length === 1) {
      const url = new URL(req.url);
      const search = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      let query = supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      // TOUJOURS filtrer par clinic_id (sauf SUPER_ADMIN sans clinic_id pour stats globales)
      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      if (search) {
        query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,telephone.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: 'Erreur lors de la récupération des patients' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data, pagination: { page, limit, total: count || 0 } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/patients
    if (method === 'POST' && pathParts.length === 1) {
      // Pour la création, le clinic_id est OBLIGATOIRE
      if (!clinicId) {
        return new Response(
          JSON.stringify({ success: false, message: 'Contexte de clinique requis pour créer un patient' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const body = await req.json();
      // TOUJOURS forcer le clinic_id (jamais depuis le body)
      body.clinic_id = clinicId;
      
      const { data, error } = await supabase
        .from('patients')
        .insert(body)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: 'Erreur lors de la création du patient', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/patients/:id
    if (method === 'GET' && pathParts.length === 2) {
      let query = supabase
        .from('patients')
        .select('*')
        .eq('id', pathParts[1]);

      // TOUJOURS filtrer par clinic_id
      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ success: false, message: 'Patient non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Route non trouvée' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
