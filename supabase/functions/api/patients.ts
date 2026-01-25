// Handler patients pour Supabase Edge Functions
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';

export default async function handler(req: Request, path: string): Promise<Response> {
  const method = req.method;
  const pathParts = path.split('/').filter(p => p);
  const clinicId = req.headers.get('x-clinic-id');

  try {
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
      const body = await req.json();
      if (clinicId) {
        body.clinic_id = clinicId;
      }
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
