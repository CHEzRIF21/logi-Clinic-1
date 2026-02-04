-- ============================================
-- MIGRATION 82: POLITIQUES RLS COMPLÈTES MULTI-TENANT (SÉCURISÉE)
-- LogiClinic - SaaS Médical Sécurisé
-- Date: 2026-02-04
-- 
-- Objectifs:
-- 1. Isolation stricte par clinic_id sur toutes les tables
-- 2. Super Admin: accès total à toutes les cliniques
-- 3. Admin: gestion de sa propre clinique uniquement
-- 4. Staff: lecture/écriture dans sa clinique uniquement
-- 5. ROBUSTESSE: Vérifie l'existence des tables avant d'appliquer les changements
-- ============================================

-- =============================================
-- SECTION 1: FONCTIONS HELPER SÉCURISÉES
-- Ces fonctions sont appelées par les policies RLS
-- Version sécurisée qui vérifie l'existence de la table users
-- =============================================

-- 1.1 Récupérer le clinic_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
  v_jwt_clinic_id TEXT;
  users_exists BOOLEAN;
BEGIN
  -- Priorité 1: clinic_id dans le JWT (si configuré)
  v_jwt_clinic_id := auth.jwt() ->> 'clinic_id';
  IF v_jwt_clinic_id IS NOT NULL AND v_jwt_clinic_id != '' THEN
    BEGIN
      RETURN v_jwt_clinic_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignorer si invalide
    END;
  END IF;
  
  -- Vérifier si la table users existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO users_exists;
  
  IF NOT users_exists THEN
    RETURN NULL;
  END IF;
  
  -- Priorité 2: Chercher dans la table users via auth_user_id
  SELECT clinic_id INTO v_clinic_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND actif = true
  LIMIT 1;
    
  RETURN v_clinic_id;
END;
$$;

COMMENT ON FUNCTION public.get_my_clinic_id() IS 
'Retourne le clinic_id de l''utilisateur connecté. Utilisé par les policies RLS. Retourne NULL si la table users n''existe pas.';

-- 1.2 Vérifier si l'utilisateur est Super Admin
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
  users_exists BOOLEAN;
BEGIN
  -- Vérifier si la table users existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO users_exists;
  
  IF NOT users_exists THEN
    RETURN false;
  END IF;

  SELECT role INTO v_role
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND actif = true
  LIMIT 1;
  
  RETURN COALESCE(v_role = 'SUPER_ADMIN', false);
END;
$$;

COMMENT ON FUNCTION public.check_is_super_admin() IS 
'Retourne true si l''utilisateur connecté est SUPER_ADMIN. Retourne false si la table users n''existe pas.';

-- 1.3 Vérifier si l'utilisateur est Admin (Clinic Admin ou Super Admin)
CREATE OR REPLACE FUNCTION public.check_is_clinic_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
  users_exists BOOLEAN;
BEGIN
  -- Vérifier si la table users existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO users_exists;
  
  IF NOT users_exists THEN
    RETURN false;
  END IF;

  SELECT role INTO v_role
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND actif = true
  LIMIT 1;
  
  RETURN COALESCE(v_role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'ADMIN', 'admin'), false);
END;
$$;

COMMENT ON FUNCTION public.check_is_clinic_admin() IS 
'Retourne true si l''utilisateur est admin (SUPER_ADMIN, CLINIC_ADMIN, ADMIN).';

-- 1.4 Obtenir le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
  users_exists BOOLEAN;
BEGIN
  -- Vérifier si la table users existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO users_exists;
  
  IF NOT users_exists THEN
    RETURN NULL;
  END IF;

  SELECT role INTO v_role
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND actif = true
  LIMIT 1;
  
  RETURN v_role;
END;
$$;

COMMENT ON FUNCTION public.get_my_role() IS 
'Retourne le rôle de l''utilisateur connecté.';

-- =============================================
-- SECTION 2: TABLE CLINICS
-- Super Admin: tout accès
-- Autres: lecture seule sur cliniques actives
-- Sécurisé via DO block
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinics') THEN
    EXECUTE 'ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "clinics_access" ON public.clinics';
    EXECUTE 'DROP POLICY IF EXISTS "clinics_super_admin_all" ON public.clinics';
    EXECUTE 'DROP POLICY IF EXISTS "clinics_read_active" ON public.clinics';
    EXECUTE 'DROP POLICY IF EXISTS "clinics_public_read" ON public.clinics';
    EXECUTE 'DROP POLICY IF EXISTS "clinics_read_own_or_active" ON public.clinics';
    EXECUTE 'DROP POLICY IF EXISTS "clinics_anon_validate" ON public.clinics';
    
    -- Super Admin: accès complet
    EXECUTE 'CREATE POLICY "clinics_super_admin_all" ON public.clinics FOR ALL TO authenticated USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin())';
    
    -- Utilisateurs authentifiés: lecture des cliniques actives (ou leur propre clinique)
    EXECUTE 'CREATE POLICY "clinics_read_own_or_active" ON public.clinics FOR SELECT TO authenticated USING (active = true OR id = public.get_my_clinic_id())';
    
    -- Accès anonyme pour la validation du code clinique à la connexion
    EXECUTE 'CREATE POLICY "clinics_anon_validate" ON public.clinics FOR SELECT TO anon USING (active = true)';
    
    RAISE NOTICE 'RLS appliqué: clinics';
  ELSE
    RAISE NOTICE 'Table public.clinics introuvable; configuration RLS ignorée.';
  END IF;
END $$;

-- =============================================
-- SECTION 3: TABLE USERS (PROFILES)
-- Super Admin: tout accès
-- Admin clinique: gestion des users de sa clinique
-- Staff: lecture propre profil, lecture collègues
-- Sécurisé via DO block
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "users_admin_or_self_policy" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "users_read_own_profile" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "users_update_own_profile" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "users_clinic_admin_manage" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "users_super_admin_all" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "users_clinic_admin_read" ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS "users_staff_read_colleagues" ON public.users';
    
    -- Super Admin: accès complet à tous les users
    EXECUTE 'CREATE POLICY "users_super_admin_all" ON public.users FOR ALL TO authenticated USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin())';
    
    -- Utilisateur: lire son propre profil
    EXECUTE 'CREATE POLICY "users_read_own_profile" ON public.users FOR SELECT TO authenticated USING (auth_user_id = auth.uid())';
    
    -- Utilisateur: modifier son propre profil (champs limités via application)
    EXECUTE 'CREATE POLICY "users_update_own_profile" ON public.users FOR UPDATE TO authenticated USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid())';
    
    -- Admin clinique: voir tous les users de sa clinique
    EXECUTE 'CREATE POLICY "users_clinic_admin_read" ON public.users FOR SELECT TO authenticated USING (public.check_is_clinic_admin() AND clinic_id = public.get_my_clinic_id())';
    
    -- Admin clinique: créer/modifier/supprimer users de sa clinique
    EXECUTE 'CREATE POLICY "users_clinic_admin_manage" ON public.users FOR ALL TO authenticated USING (public.check_is_clinic_admin() AND clinic_id = public.get_my_clinic_id() AND role NOT IN (''SUPER_ADMIN'')) WITH CHECK (public.check_is_clinic_admin() AND clinic_id = public.get_my_clinic_id() AND role NOT IN (''SUPER_ADMIN''))';
    
    -- Staff: voir les collègues de leur clinique (lecture seule)
    EXECUTE 'CREATE POLICY "users_staff_read_colleagues" ON public.users FOR SELECT TO authenticated USING (clinic_id = public.get_my_clinic_id())';
    
    RAISE NOTICE 'RLS appliqué: users';
  ELSE
    RAISE NOTICE 'Table public.users introuvable; configuration RLS ignorée.';
  END IF;
END $$;

-- =============================================
-- SECTION 4: MACRO POUR TABLES MÉTIER
-- Pattern standard: clinic_id = get_my_clinic_id() OR super_admin
-- =============================================

-- 4.1 PATIENTS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patients') THEN
    ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "patients_clinic_access" ON public.patients;
    DROP POLICY IF EXISTS "patients_super_admin" ON public.patients;
    
    -- Super Admin: tout voir
    CREATE POLICY "patients_super_admin" ON public.patients
    FOR ALL TO authenticated
    USING (public.check_is_super_admin())
    WITH CHECK (public.check_is_super_admin());
    
    -- Staff clinique: accès à leur clinique
    CREATE POLICY "patients_clinic_access" ON public.patients
    FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());
    
    RAISE NOTICE 'RLS appliqué: patients';
  END IF;
END $$;

-- 4.2 CONSULTATIONS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consultations') THEN
    ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "consultations_clinic_access" ON public.consultations;
    DROP POLICY IF EXISTS "consultations_super_admin" ON public.consultations;
    
    CREATE POLICY "consultations_super_admin" ON public.consultations
    FOR ALL TO authenticated
    USING (public.check_is_super_admin())
    WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "consultations_clinic_access" ON public.consultations
    FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());
    
    RAISE NOTICE 'RLS appliqué: consultations';
  END IF;
END $$;

-- 4.3 RENDEZVOUS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rendezvous') THEN
    ALTER TABLE public.rendezvous ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "rendezvous_clinic_access" ON public.rendezvous;
    DROP POLICY IF EXISTS "rendezvous_super_admin" ON public.rendezvous;
    
    CREATE POLICY "rendezvous_super_admin" ON public.rendezvous
    FOR ALL TO authenticated
    USING (public.check_is_super_admin())
    WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "rendezvous_clinic_access" ON public.rendezvous
    FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());
    
    RAISE NOTICE 'RLS appliqué: rendezvous';
  END IF;
END $$;

-- 4.4 FACTURES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'factures') THEN
    ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "factures_clinic_access" ON public.factures;
    DROP POLICY IF EXISTS "factures_super_admin" ON public.factures;
    
    CREATE POLICY "factures_super_admin" ON public.factures
    FOR ALL TO authenticated
    USING (public.check_is_super_admin())
    WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "factures_clinic_access" ON public.factures
    FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());
    
    RAISE NOTICE 'RLS appliqué: factures';
  END IF;
END $$;

-- 4.5 PAIEMENTS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'paiements') THEN
    ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "paiements_clinic_access" ON public.paiements;
    DROP POLICY IF EXISTS "paiements_super_admin" ON public.paiements;
    
    CREATE POLICY "paiements_super_admin" ON public.paiements
    FOR ALL TO authenticated
    USING (public.check_is_super_admin())
    WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "paiements_clinic_access" ON public.paiements
    FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());
    
    RAISE NOTICE 'RLS appliqué: paiements';
  END IF;
END $$;

-- 4.6 MEDICAMENTS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'medicaments') THEN
    ALTER TABLE public.medicaments ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "medicaments_clinic_access" ON public.medicaments;
    DROP POLICY IF EXISTS "medicaments_super_admin" ON public.medicaments;
    
    CREATE POLICY "medicaments_super_admin" ON public.medicaments
    FOR ALL TO authenticated
    USING (public.check_is_super_admin())
    WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "medicaments_clinic_access" ON public.medicaments
    FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());
    
    RAISE NOTICE 'RLS appliqué: medicaments';
  END IF;
END $$;

-- 4.7 STOCKS / LOTS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lots') THEN
    ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "lots_clinic_access" ON public.lots;
    DROP POLICY IF EXISTS "lots_super_admin" ON public.lots;
    
    CREATE POLICY "lots_super_admin" ON public.lots
    FOR ALL TO authenticated
    USING (public.check_is_super_admin())
    WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "lots_clinic_access" ON public.lots
    FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());
    
    RAISE NOTICE 'RLS appliqué: lots';
  END IF;
END $$;

-- 4.8 PRESCRIPTIONS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prescriptions') THEN
    ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "prescriptions_clinic_access" ON public.prescriptions;
    DROP POLICY IF EXISTS "prescriptions_super_admin" ON public.prescriptions;
    
    CREATE POLICY "prescriptions_super_admin" ON public.prescriptions
    FOR ALL TO authenticated
    USING (public.check_is_super_admin())
    WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "prescriptions_clinic_access" ON public.prescriptions
    FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());
    
    RAISE NOTICE 'RLS appliqué: prescriptions';
  END IF;
END $$;

-- 4.9 LAB_DEMANDES / LAB_ANALYSES / LAB_RESULTATS
DO $$
BEGIN
  -- lab_demandes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lab_demandes') THEN
    ALTER TABLE public.lab_demandes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "lab_demandes_clinic_access" ON public.lab_demandes;
    DROP POLICY IF EXISTS "lab_demandes_super_admin" ON public.lab_demandes;
    
    CREATE POLICY "lab_demandes_super_admin" ON public.lab_demandes FOR ALL TO authenticated
    USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "lab_demandes_clinic_access" ON public.lab_demandes FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
    RAISE NOTICE 'RLS appliqué: lab_demandes';
  END IF;
  
  -- lab_analyses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lab_analyses') THEN
    ALTER TABLE public.lab_analyses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "lab_analyses_clinic_access" ON public.lab_analyses;
    DROP POLICY IF EXISTS "lab_analyses_super_admin" ON public.lab_analyses;
    
    CREATE POLICY "lab_analyses_super_admin" ON public.lab_analyses FOR ALL TO authenticated
    USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "lab_analyses_clinic_access" ON public.lab_analyses FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
    RAISE NOTICE 'RLS appliqué: lab_analyses';
  END IF;
  
  -- lab_resultats
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lab_resultats') THEN
    ALTER TABLE public.lab_resultats ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "lab_resultats_clinic_access" ON public.lab_resultats;
    DROP POLICY IF EXISTS "lab_resultats_super_admin" ON public.lab_resultats;
    
    CREATE POLICY "lab_resultats_super_admin" ON public.lab_resultats FOR ALL TO authenticated
    USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "lab_resultats_clinic_access" ON public.lab_resultats FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
    RAISE NOTICE 'RLS appliqué: lab_resultats';
  END IF;
END $$;

-- 4.10 IMAGERIE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'imagerie_demandes') THEN
    ALTER TABLE public.imagerie_demandes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "imagerie_demandes_clinic_access" ON public.imagerie_demandes;
    DROP POLICY IF EXISTS "imagerie_demandes_super_admin" ON public.imagerie_demandes;
    
    CREATE POLICY "imagerie_demandes_super_admin" ON public.imagerie_demandes FOR ALL TO authenticated
    USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "imagerie_demandes_clinic_access" ON public.imagerie_demandes FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
    RAISE NOTICE 'RLS appliqué: imagerie_demandes';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'imaging_requests') THEN
    ALTER TABLE public.imaging_requests ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "imaging_requests_clinic_access" ON public.imaging_requests;
    DROP POLICY IF EXISTS "imaging_requests_super_admin" ON public.imaging_requests;
    
    CREATE POLICY "imaging_requests_super_admin" ON public.imaging_requests FOR ALL TO authenticated
    USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "imaging_requests_clinic_access" ON public.imaging_requests FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
    RAISE NOTICE 'RLS appliqué: imaging_requests';
  END IF;
END $$;

-- 4.11 VACCINATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vaccination_records') THEN
    ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "vaccination_records_clinic_access" ON public.vaccination_records;
    DROP POLICY IF EXISTS "vaccination_records_super_admin" ON public.vaccination_records;
    
    CREATE POLICY "vaccination_records_super_admin" ON public.vaccination_records FOR ALL TO authenticated
    USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "vaccination_records_clinic_access" ON public.vaccination_records FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
    RAISE NOTICE 'RLS appliqué: vaccination_records';
  END IF;
END $$;

-- 4.12 MATERNITÉ (CPN, Accouchements, Post-partum)
DO $$
BEGIN
  -- cpn_consultations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cpn_consultations') THEN
    ALTER TABLE public.cpn_consultations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "cpn_consultations_clinic_access" ON public.cpn_consultations;
    DROP POLICY IF EXISTS "cpn_consultations_super_admin" ON public.cpn_consultations;
    
    CREATE POLICY "cpn_consultations_super_admin" ON public.cpn_consultations FOR ALL TO authenticated
    USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "cpn_consultations_clinic_access" ON public.cpn_consultations FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
    RAISE NOTICE 'RLS appliqué: cpn_consultations';
  END IF;
  
  -- accouchements
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accouchements') THEN
    ALTER TABLE public.accouchements ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "accouchements_clinic_access" ON public.accouchements;
    DROP POLICY IF EXISTS "accouchements_super_admin" ON public.accouchements;
    
    CREATE POLICY "accouchements_super_admin" ON public.accouchements FOR ALL TO authenticated
    USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin());
    
    CREATE POLICY "accouchements_clinic_access" ON public.accouchements FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
    RAISE NOTICE 'RLS appliqué: accouchements';
  END IF;
END $$;

-- 4.13 REGISTRATION_REQUESTS (Inscriptions)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'registration_requests') THEN
    ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "registration_requests_anon_insert" ON public.registration_requests;
    DROP POLICY IF EXISTS "registration_requests_select" ON public.registration_requests;
    DROP POLICY IF EXISTS "registration_requests_manage" ON public.registration_requests;
    DROP POLICY IF EXISTS "registration_requests_super_admin" ON public.registration_requests;
    
    -- Anonyme: créer une demande
    CREATE POLICY "registration_requests_anon_insert" ON public.registration_requests
    FOR INSERT TO anon
    WITH CHECK (true);
    
    -- Super Admin: tout voir
    CREATE POLICY "registration_requests_super_admin" ON public.registration_requests
    FOR ALL TO authenticated
    USING (public.check_is_super_admin())
    WITH CHECK (public.check_is_super_admin());
    
    -- Admin clinique: voir/gérer les demandes de sa clinique
    CREATE POLICY "registration_requests_clinic_admin" ON public.registration_requests
    FOR ALL TO authenticated
    USING (
      public.check_is_clinic_admin() 
      AND clinic_id = public.get_my_clinic_id()
    )
    WITH CHECK (
      public.check_is_clinic_admin() 
      AND clinic_id = public.get_my_clinic_id()
    );
    
    RAISE NOTICE 'RLS appliqué: registration_requests';
  END IF;
END $$;

-- =============================================
-- SECTION 5: TABLES SUPPLÉMENTAIRES
-- Application du même pattern à toutes les tables avec clinic_id
-- =============================================

-- Liste des tables métier à traiter
DO $$
DECLARE
  v_table_name TEXT;
  table_list TEXT[] := ARRAY[
    'tickets', 'ticket_lignes', 'operations_caisse', 'journal_caisse',
    'dispensations', 'lignes_dispensation', 'mouvements_stock',
    'transferts', 'alertes_stock', 'fournisseurs', 'commandes_fournisseur',
    'consultation_constantes', 'consultation_diagnostics', 'consultation_traitements',
    'anamnese_templates', 'dossier_obstetrical', 'nouveaux_nes',
    'lab_prelevements', 'exam_catalog', 'lab_stocks_reactifs',
    'user_permissions', 'account_recovery_requests', 'audit_log',
    'clinic_pricing', 'assurances', 'tiers_payants', 'patient_constantes'
  ];
BEGIN
  FOREACH v_table_name IN ARRAY table_list
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_name = v_table_name
    ) THEN
      -- Vérifier si clinic_id existe
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = v_table_name
          AND c.column_name = 'clinic_id'
      ) THEN
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%I_super_admin" ON public.%I', v_table_name, v_table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%I_clinic_access" ON public.%I', v_table_name, v_table_name);
        
        EXECUTE format('CREATE POLICY "%I_super_admin" ON public.%I FOR ALL TO authenticated USING (public.check_is_super_admin()) WITH CHECK (public.check_is_super_admin())', v_table_name, v_table_name);
        EXECUTE format('CREATE POLICY "%I_clinic_access" ON public.%I FOR ALL TO authenticated USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id())', v_table_name, v_table_name);
        
        RAISE NOTICE 'RLS appliqué: %', v_table_name;
      ELSE
        RAISE NOTICE 'Table % existe mais sans clinic_id - ignorée', v_table_name;
      END IF;
    ELSE
      RAISE NOTICE 'Table % n''existe pas - ignorée', v_table_name;
    END IF;
  END LOOP;
END $$;

-- =============================================
-- SECTION 6: INDEX POUR PERFORMANCE RLS
-- Créer des index sur clinic_id pour accélérer les policies
-- =============================================

DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN 
    SELECT c.table_name 
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
    WHERE c.table_schema = 'public' 
    AND c.column_name = 'clinic_id'
    AND t.table_type = 'BASE TABLE'
  LOOP
    BEGIN
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_clinic_id ON public.%I(clinic_id)', tbl.table_name, tbl.table_name);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Index déjà existant pour %', tbl.table_name;
    END;
  END LOOP;
END $$;

-- =============================================
-- SECTION 7: VÉRIFICATION FINALE
-- Requêtes pour auditer l'état RLS
-- =============================================

-- Afficher toutes les tables avec RLS activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Activé",
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename AND p.schemaname = t.schemaname) as "Nb Policies"
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN ('clinics', 'users', 'patients') -- Vérifier au moins les tables principales si elles existent
ORDER BY tablename;

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================

COMMENT ON SCHEMA public IS 'LogiClinic - Multi-tenant schema avec RLS strict par clinic_id';
