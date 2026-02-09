-- ============================================
-- Migration 87: Correction Security Definer View (linter Supabase 0010)
-- ============================================
-- Les vues créées sans option explicite héritent de SECURITY DEFINER par défaut
-- (comportement historique PostgreSQL). Elles s'exécutent alors avec les droits
-- du propriétaire de la vue, ce qui contourne le RLS et l'isolation par clinic_id.
--
-- Remédiation: passer en SECURITY INVOKER pour que les vues s'exécutent avec
-- les droits de l'utilisateur qui interroge, en respectant RLS et clinic_id.
-- Référence: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
-- ============================================

ALTER VIEW public.vue_resume_cpn SET (security_invoker = on);
ALTER VIEW public.v_patient_labo_info SET (security_invoker = on);
ALTER VIEW public.vue_resume_accouchements SET (security_invoker = on);
ALTER VIEW public.vue_resume_post_partum SET (security_invoker = on);
ALTER VIEW public.patients_with_age SET (security_invoker = on);
