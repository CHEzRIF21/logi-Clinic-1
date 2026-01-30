// Handler pharmacy pour Supabase Edge Functions
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

    // GET /api/pharmacy/products
    if (method === 'GET' && pathParts[1] === 'products') {
      let query = supabase
        .from('medicaments')
        .select('*')
        .order('nom', { ascending: true });

      // TOUJOURS filtrer par clinic_id
      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data, error } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: 'Erreur lors de la récupération des produits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
