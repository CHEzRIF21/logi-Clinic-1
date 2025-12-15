// Handler invoices pour Supabase Edge Functions
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';

export default async function handler(req: Request, path: string): Promise<Response> {
  const method = req.method;
  const pathParts = path.split('/').filter(p => p);

  try {
    // GET /api/invoices
    if (method === 'GET' && pathParts.length === 1) {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      const { data, error, count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: 'Erreur lors de la récupération des factures' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data, pagination: { page, limit, total: count || 0 } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/invoices
    if (method === 'POST' && pathParts.length === 1) {
      const body = await req.json();
      const { data, error } = await supabase
        .from('invoices')
        .insert(body)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: 'Erreur lors de la création de la facture', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
