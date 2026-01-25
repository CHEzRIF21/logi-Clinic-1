// Handler statistics pour Supabase Edge Functions
// Implémente: GET /api/statistics/dashboard
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseBearerToken(req: Request): string | null {
  const h = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

function parseLegacyToken(token: string): string | null {
  // Format généré côté frontend: token-<public.users.id>-<timestamp>
  const m = token.match(/^token-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i);
  return m?.[1] || null;
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
      const token = parseBearerToken(req);
      if (!token) {
        return json({ success: false, message: 'Authentification requise' }, 401);
      }

      // 1) Essayer d'authentifier via Supabase Auth (JWT access_token)
      let profile: any = null;
      let profileErr: any = null;

      const {
        data: { user: authUser },
        error: authErr,
      } = await supabase.auth.getUser(token);

      if (!authErr && authUser?.id) {
        const profRes = await supabase
          .from('users')
          .select('id, role, status, actif, clinic_id')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();
        profile = profRes.data;
        profileErr = profRes.error;
      } else {
        // 2) Fallback: token interne (legacy) utilisé par le frontend quand pas de session Supabase
        const legacyUserId = parseLegacyToken(token);
        if (!legacyUserId) {
          return json({ success: false, message: 'Token invalide' }, 401);
        }

        const profRes = await supabase
          .from('users')
          .select('id, role, status, actif, clinic_id')
          .eq('id', legacyUserId)
          .maybeSingle();
        profile = profRes.data;
        profileErr = profRes.error;
      }

      if (profileErr || !profile) {
        return json({ success: false, message: 'Profil utilisateur introuvable' }, 403);
      }
      if (!profile.actif || profile.status === 'SUSPENDED' || profile.status === 'REJECTED') {
        return json({ success: false, message: 'Compte inactif' }, 403);
      }

      const role = String(profile.role || '').toUpperCase();
      const clinicHeader = req.headers.get('x-clinic-id');

      // Déterminer le contexte clinique
      let clinicId: string | null = null;
      if (role === 'SUPER_ADMIN') {
        // Super admin: stats globales si pas de header, sinon stats de la clinique demandée
        clinicId = clinicHeader || null;
      } else {
        // Autres rôles: doivent avoir une clinique
        clinicId = profile.clinic_id || null;
        if (!clinicId) {
          return json(
            { success: false, message: 'Contexte de clinique manquant.', code: 'MISSING_CLINIC_CONTEXT' },
            400,
          );
        }
        if (clinicHeader && clinicHeader !== clinicId) {
          return json({ success: false, message: 'Contexte clinique invalide.' }, 403);
        }
      }

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
