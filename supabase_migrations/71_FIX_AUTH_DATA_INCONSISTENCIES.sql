-- ============================================
-- MIGRATION 71: CORRECTION DES INCOHÉRENCES AUTH
-- ============================================
-- Problèmes corrigés:
-- 1. Utilisateurs avec status='PENDING' mais actif=true (peuvent se connecter alors qu'ils ne devraient pas)
-- 2. Identification des utilisateurs sans clinic_id (nécessite intervention manuelle)
-- 3. Vérification des utilisateurs avec auth_user_id mais profil invalide
-- ============================================

BEGIN;

-- ============================================
-- 1. CORRIGER LES UTILISATEURS PENDING MAIS ACTIFS
-- ============================================
-- Ces utilisateurs peuvent se connecter alors qu'ils ne devraient pas
-- (workflow: PENDING → APPROVED → ACTIVE)
UPDATE users
SET actif = false
WHERE status = 'PENDING' AND actif = true;

-- Log des corrections
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM users
  WHERE status = 'PENDING' AND actif = false;
  
  RAISE NOTICE '✅ Utilisateurs PENDING corrigés: % utilisateurs maintenant inactifs', v_count;
END $$;

-- ============================================
-- 2. IDENTIFIER LES UTILISATEURS SANS clinic_id
-- ============================================
-- Ces utilisateurs nécessitent une intervention manuelle pour déterminer leur clinic_id
-- Ne pas corriger automatiquement car cela nécessite une décision métier
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM users
  WHERE clinic_id IS NULL;
  
  IF v_count > 0 THEN
    RAISE WARNING '⚠️ % utilisateur(s) sans clinic_id détecté(s). Vérification manuelle requise.', v_count;
    
    -- Afficher les détails (pour log)
    PERFORM * FROM users
    WHERE clinic_id IS NULL;
  ELSE
    RAISE NOTICE '✅ Aucun utilisateur sans clinic_id';
  END IF;
END $$;

-- ============================================
-- 3. VÉRIFIER LES UTILISATEURS AVEC auth_user_id MAIS PROFIL INVALIDE
-- ============================================
-- Ces utilisateurs ont un compte Supabase Auth mais leur profil métier est inactif/suspendu
DO $$
DECLARE
  v_inactif INTEGER;
  v_suspendu INTEGER;
  v_rejete INTEGER;
  v_pending INTEGER;
BEGIN
  -- Compter les utilisateurs inactifs avec auth_user_id
  SELECT COUNT(*) INTO v_inactif
  FROM users
  WHERE auth_user_id IS NOT NULL AND actif = false;
  
  -- Compter les utilisateurs suspendus avec auth_user_id
  SELECT COUNT(*) INTO v_suspendu
  FROM users
  WHERE auth_user_id IS NOT NULL AND status = 'SUSPENDED';
  
  -- Compter les utilisateurs rejetés avec auth_user_id
  SELECT COUNT(*) INTO v_rejete
  FROM users
  WHERE auth_user_id IS NOT NULL AND status = 'REJECTED';
  
  -- Compter les utilisateurs en attente avec auth_user_id
  SELECT COUNT(*) INTO v_pending
  FROM users
  WHERE auth_user_id IS NOT NULL AND status = 'PENDING';
  
  RAISE NOTICE '📊 Statistiques utilisateurs avec auth_user_id:';
  RAISE NOTICE '   - Inactifs: %', v_inactif;
  RAISE NOTICE '   - Suspendus: %', v_suspendu;
  RAISE NOTICE '   - Rejetés: %', v_rejete;
  RAISE NOTICE '   - En attente: %', v_pending;
END $$;

-- ============================================
-- 4. VÉRIFIER LES INCOHÉRENCES Auth ↔ Profil
-- ============================================
-- Détecter les cas où un compte Supabase Auth existe mais pas de profil users
-- (nécessite vérification manuelle via dashboard Supabase)
DO $$
DECLARE
  v_message TEXT;
BEGIN
  v_message := '⚠️ Pour vérifier les comptes Auth sans profil users, exécutez dans le dashboard Supabase:';
  v_message := v_message || E'\n' || 'SELECT id, email FROM auth.users WHERE id NOT IN (SELECT auth_user_id FROM public.users WHERE auth_user_id IS NOT NULL);';
  RAISE NOTICE '%', v_message;
END $$;

COMMIT;

-- ============================================
-- COMMENTAIRES
-- ============================================
COMMENT ON TABLE users IS 
  'Table des utilisateurs métier. Chaque utilisateur DOIT avoir un clinic_id (sauf cas exceptionnels nécessitant intervention manuelle).';
