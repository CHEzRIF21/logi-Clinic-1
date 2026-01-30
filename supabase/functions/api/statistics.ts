// Handler statistics pour Supabase Edge Functions
// SÉCURITÉ: Utilise l'authentification sécurisée (clinic_id depuis la DB, pas les headers)
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateRequest, requireClinicContext, getEffectiveClinicId } from '../_shared/auth.ts';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function handler(req: Request, path: string): Promise<Response> {
  const method = req.method;
  const pathParts = path.split('/').filter((p) => p);

  try {
    // GET /api/statistics/dashboard
    if (method === 'GET' && pathParts[1] === 'dashboard') {
      // Authentifier l'utilisateur avec le helper sécurisé
      const authResult = await authenticateRequest(req);
      if (!authResult.success || !authResult.user) {
        return authResult.error!;
      }
      
      const user = authResult.user;
      
      // Vérifier le contexte de clinique (sauf SUPER_ADMIN)
      const clinicError = requireClinicContext(user);
      if (clinicError) {
        return clinicError;
      }
      
      // Récupérer le clinic_id effectif (depuis la DB, pas les headers)
      // Pour SUPER_ADMIN: peut voir stats globales ou d'une clinique spécifique
      const clinicId = getEffectiveClinicId(user, req);

      const now = new Date();
      const todayStart = startOfDay(now);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const monthStart = startOfMonth(now);

      // Paiements du jour
      let paymentsTodayQuery = supabase
        .from('paiements')
        .select('montant')
        .gte('date_paiement', todayStart.toISOString())
        .lt('date_paiement', tomorrowStart.toISOString());
      if (clinicId) paymentsTodayQuery = paymentsTodayQuery.eq('clinic_id', clinicId);

      const { data: paymentsToday, error: payTodayErr } = await paymentsTodayQuery;
      if (payTodayErr) {
        return json({ success: false, message: 'Erreur récupération paiements (jour)', error: payTodayErr.message }, 500);
      }

      const todayRevenue = (paymentsToday || []).reduce((sum, p: any) => sum + Number(p?.montant || 0), 0);

      // Paiements du mois
      let paymentsMonthQuery = supabase
        .from('paiements')
        .select('montant')
        .gte('date_paiement', monthStart.toISOString())
        .lt('date_paiement', now.toISOString());
      if (clinicId) paymentsMonthQuery = paymentsMonthQuery.eq('clinic_id', clinicId);

      const { data: paymentsMonth, error: payMonthErr } = await paymentsMonthQuery;
      if (payMonthErr) {
        return json({ success: false, message: 'Erreur récupération paiements (mois)', error: payMonthErr.message }, 500);
      }

      const monthRevenue = (paymentsMonth || []).reduce((sum, p: any) => sum + Number(p?.montant || 0), 0);

      // Factures en attente
      let pendingQuery = supabase
        .from('factures')
        .select('id', { count: 'exact', head: true })
        .eq('statut', 'en_attente');
      if (clinicId) pendingQuery = pendingQuery.eq('clinic_id', clinicId);

      const { count: pendingInvoices, error: pendingErr } = await pendingQuery;
      if (pendingErr) {
        return json({ success: false, message: 'Erreur récupération factures en attente', error: pendingErr.message }, 500);
      }

      return json({
        success: true,
        data: {
          todayRevenue,
          monthRevenue,
          pendingInvoices: pendingInvoices || 0,
        },
      });
    }

    return json({ success: false, message: 'Route non trouvée' }, 404);
  } catch (error: any) {
    console.error('Erreur statistics:', error);
    return json({ success: false, message: error?.message || 'Erreur serveur' }, 500);
  }
}
