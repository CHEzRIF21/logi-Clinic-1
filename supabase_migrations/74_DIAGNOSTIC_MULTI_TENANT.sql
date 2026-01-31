-- ============================================
-- SCRIPT DE DIAGNOSTIC: ISOLATION MULTI-TENANT
-- Date: 2026-01-31
-- 
-- Ce script permet de diagnostiquer les problèmes d'isolation
-- Exécuter AVANT la migration 74_FIX_MULTI_TENANT_ISOLATION_COMPLETE.sql
-- ============================================

-- =============================================
-- DIAGNOSTIC 1: Vérifier les tables sans clinic_id
-- =============================================
DO $$
DECLARE
  table_rec RECORD;
  has_clinic_id BOOLEAN;
BEGIN
  RAISE NOTICE '=== TABLES SANS COLONNE clinic_id ===';
  
  FOR table_rec IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('schema_migrations', 'pg_stat_statements')
    ORDER BY tablename
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = table_rec.tablename AND column_name = 'clinic_id'
    ) INTO has_clinic_id;
    
    IF NOT has_clinic_id THEN
      RAISE NOTICE '❌ %', table_rec.tablename;
    END IF;
  END LOOP;
END $$;

-- =============================================
-- DIAGNOSTIC 2: Vérifier les alertes_stock par clinique
-- =============================================
SELECT 
  'alertes_stock' as table_name,
  c.name as clinic_name,
  COUNT(*) as total_alertes,
  SUM(CASE WHEN a.statut = 'active' THEN 1 ELSE 0 END) as alertes_actives
FROM alertes_stock a
LEFT JOIN clinics c ON c.id = a.clinic_id
GROUP BY c.name
ORDER BY c.name;

-- =============================================
-- DIAGNOSTIC 3: Vérifier les registration_requests par clinique
-- =============================================
SELECT 
  'registration_requests' as table_name,
  c.name as clinic_name,
  COUNT(*) as total_demandes,
  SUM(CASE WHEN r.statut = 'pending' THEN 1 ELSE 0 END) as demandes_pending,
  SUM(CASE WHEN r.statut = 'approved' THEN 1 ELSE 0 END) as demandes_approved,
  SUM(CASE WHEN r.statut = 'rejected' THEN 1 ELSE 0 END) as demandes_rejected
FROM registration_requests r
LEFT JOIN clinics c ON c.id = r.clinic_id
GROUP BY c.name
ORDER BY c.name;

-- =============================================
-- DIAGNOSTIC 4: Vérifier les utilisateurs avec incohérences status/actif
-- =============================================
SELECT 
  'users avec incohérences status/actif' as diagnostic,
  u.id,
  u.email,
  u.role,
  u.status,
  u.actif,
  c.name as clinic_name
FROM users u
LEFT JOIN clinics c ON c.id = u.clinic_id
WHERE 
  (u.status = 'PENDING' AND u.actif = true)
  OR (u.status = 'ACTIVE' AND u.actif = false)
  OR (u.status = 'APPROVED' AND u.actif = false)
ORDER BY c.name, u.email;

-- =============================================
-- DIAGNOSTIC 5: Vérifier les policies RLS existantes
-- =============================================
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN qual LIKE '%get_my_clinic_id%' THEN '✅ Filtré par clinic_id'
    WHEN qual LIKE '%true%' OR qual IS NULL THEN '⚠️ Potentiellement permissif'
    ELSE '⚠️ À vérifier'
  END as isolation_status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'alertes_stock',
  'registration_requests',
  'fournisseurs',
  'commandes_fournisseur',
  'commandes_fournisseur_lignes',
  'alertes_epidemiques',
  'medicaments',
  'lots',
  'dispensations'
)
ORDER BY tablename, policyname;

-- =============================================
-- DIAGNOSTIC 6: Vérifier les données orphelines (sans clinic_id)
-- =============================================
SELECT 'alertes_stock sans clinic_id' as diagnostic, COUNT(*) as count
FROM alertes_stock WHERE clinic_id IS NULL
UNION ALL
SELECT 'registration_requests sans clinic_id', COUNT(*)
FROM registration_requests WHERE clinic_id IS NULL
UNION ALL
SELECT 'medicaments sans clinic_id', COUNT(*)
FROM medicaments WHERE clinic_id IS NULL
UNION ALL
SELECT 'fournisseurs sans clinic_id', COUNT(*)
FROM fournisseurs WHERE clinic_id IS NULL
UNION ALL
SELECT 'commandes_fournisseur sans clinic_id', COUNT(*)
FROM commandes_fournisseur WHERE clinic_id IS NULL;

-- =============================================
-- DIAGNOSTIC 7: Tester la fonction get_my_clinic_id()
-- =============================================
-- Note: Ce test ne fonctionne que si vous êtes connecté via Supabase Auth
SELECT 
  'Test get_my_clinic_id()' as diagnostic,
  public.get_my_clinic_id() as result,
  CASE 
    WHEN public.get_my_clinic_id() IS NOT NULL THEN '✅ Fonction retourne un clinic_id'
    ELSE '⚠️ Fonction retourne NULL (utilisateur inactif ou non authentifié)'
  END as status;

-- =============================================
-- DIAGNOSTIC 8: Lister les cliniques et leurs utilisateurs actifs
-- =============================================
SELECT 
  c.name as clinic_name,
  c.code as clinic_code,
  c.active as clinic_active,
  COUNT(DISTINCT u.id) FILTER (WHERE u.actif = true AND u.status = 'ACTIVE') as users_actifs,
  COUNT(DISTINCT u.id) FILTER (WHERE u.role IN ('ADMIN', 'CLINIC_ADMIN')) as admins_count
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id
GROUP BY c.id, c.name, c.code, c.active
ORDER BY c.name;

-- =============================================
-- FIN DU DIAGNOSTIC
-- =============================================
