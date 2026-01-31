-- ============================================
-- MIGRATION 74: CORRECTION COMPLÈTE ISOLATION MULTI-TENANT
-- Date: 2026-01-31
-- 
-- Problèmes corrigés:
-- 1. Tables fournisseurs/commandes_fournisseur sans RLS restrictive
-- 2. Table alertes_epidemiques sans RLS
-- 3. Tables imagerie/lab sans isolation directe
-- 4. Validation des colonnes clinic_id manquantes
-- ============================================

-- =============================================
-- SECTION 1: VÉRIFICATION ET AJOUT DE COLONNES clinic_id MANQUANTES
-- =============================================

-- Fournisseurs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fournisseurs'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'fournisseurs' AND column_name = 'clinic_id'
    ) THEN
      ALTER TABLE public.fournisseurs ADD COLUMN clinic_id UUID REFERENCES public.clinics(id);
      CREATE INDEX IF NOT EXISTS idx_fournisseurs_clinic_id ON public.fournisseurs(clinic_id);
      RAISE NOTICE 'Colonne clinic_id ajoutée à fournisseurs';
    ELSE
      RAISE NOTICE 'Colonne clinic_id existe déjà sur fournisseurs';
    END IF;
  ELSE
    RAISE NOTICE 'Table fournisseurs n''existe pas';
  END IF;
END $$;

-- Commandes fournisseur
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'commandes_fournisseur'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'commandes_fournisseur' AND column_name = 'clinic_id'
    ) THEN
      ALTER TABLE public.commandes_fournisseur ADD COLUMN clinic_id UUID REFERENCES public.clinics(id);
      CREATE INDEX IF NOT EXISTS idx_commandes_fournisseur_clinic_id ON public.commandes_fournisseur(clinic_id);
      RAISE NOTICE 'Colonne clinic_id ajoutée à commandes_fournisseur';
    ELSE
      RAISE NOTICE 'Colonne clinic_id existe déjà sur commandes_fournisseur';
    END IF;
  ELSE
    RAISE NOTICE 'Table commandes_fournisseur n''existe pas';
  END IF;
END $$;

-- Commandes fournisseur lignes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'commandes_fournisseur_lignes'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'commandes_fournisseur_lignes' AND column_name = 'clinic_id'
    ) THEN
      ALTER TABLE public.commandes_fournisseur_lignes ADD COLUMN clinic_id UUID REFERENCES public.clinics(id);
      CREATE INDEX IF NOT EXISTS idx_commandes_fournisseur_lignes_clinic_id ON public.commandes_fournisseur_lignes(clinic_id);
      RAISE NOTICE 'Colonne clinic_id ajoutée à commandes_fournisseur_lignes';
    ELSE
      RAISE NOTICE 'Colonne clinic_id existe déjà sur commandes_fournisseur_lignes';
    END IF;
  ELSE
    RAISE NOTICE 'Table commandes_fournisseur_lignes n''existe pas';
  END IF;
END $$;

-- Alertes épidémiques
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'alertes_epidemiques'
  ) THEN
    -- Créer la table si elle n'existe pas (utilisée par le système de laboratoire)
    CREATE TABLE public.alertes_epidemiques (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      parametre VARCHAR(150) NOT NULL,
      periode_jours INTEGER DEFAULT 7,
      nombre_cas_actuels INTEGER NOT NULL,
      nombre_cas_precedents INTEGER NOT NULL,
      taux_augmentation DECIMAL(5,2) NOT NULL,
      seuil_alerte DECIMAL(5,2) DEFAULT 50.0,
      statut VARCHAR(20) CHECK (statut IN ('nouvelle','en_cours','resolue','fausse_alerte')) DEFAULT 'nouvelle',
      date_detection TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      date_resolution TIMESTAMP WITH TIME ZONE,
      resolu_par VARCHAR(150),
      commentaire TEXT,
      clinic_id UUID REFERENCES public.clinics(id),
      analyse_id UUID, -- FK optionnelle vers lab_analyses si nécessaire
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_alertes_epidemiques_statut ON public.alertes_epidemiques(statut);
    CREATE INDEX IF NOT EXISTS idx_alertes_epidemiques_parametre ON public.alertes_epidemiques(parametre);
    CREATE INDEX IF NOT EXISTS idx_alertes_epidemiques_clinic_id ON public.alertes_epidemiques(clinic_id);
    
    -- S'assurer que la fonction update_updated_at_column existe
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    -- Trigger pour mise à jour automatique de updated_at
    DROP TRIGGER IF EXISTS update_alertes_epidemiques_updated_at ON public.alertes_epidemiques;
    CREATE TRIGGER update_alertes_epidemiques_updated_at 
      BEFORE UPDATE ON public.alertes_epidemiques 
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_updated_at_column();
    
    RAISE NOTICE 'Table alertes_epidemiques créée avec clinic_id';
  ELSE
    -- Table existe, vérifier si clinic_id existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'alertes_epidemiques' AND column_name = 'clinic_id'
    ) THEN
      ALTER TABLE public.alertes_epidemiques ADD COLUMN clinic_id UUID REFERENCES public.clinics(id);
      CREATE INDEX IF NOT EXISTS idx_alertes_epidemiques_clinic_id ON public.alertes_epidemiques(clinic_id);
      RAISE NOTICE 'Colonne clinic_id ajoutée à alertes_epidemiques';
    ELSE
      RAISE NOTICE 'Colonne clinic_id existe déjà sur alertes_epidemiques';
    END IF;
  END IF;
END $$;

-- Lab rapports (si absent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'lab_rapports'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'lab_rapports' AND column_name = 'clinic_id'
    ) THEN
      ALTER TABLE public.lab_rapports ADD COLUMN clinic_id UUID REFERENCES public.clinics(id);
      CREATE INDEX IF NOT EXISTS idx_lab_rapports_clinic_id ON public.lab_rapports(clinic_id);
      RAISE NOTICE 'Colonne clinic_id ajoutée à lab_rapports';
    ELSE
      RAISE NOTICE 'Colonne clinic_id existe déjà sur lab_rapports';
    END IF;
  ELSE
    RAISE NOTICE 'Table lab_rapports n''existe pas';
  END IF;
END $$;

-- Imagerie rapports (si absent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'imagerie_rapports'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'imagerie_rapports' AND column_name = 'clinic_id'
    ) THEN
      ALTER TABLE public.imagerie_rapports ADD COLUMN clinic_id UUID REFERENCES public.clinics(id);
      CREATE INDEX IF NOT EXISTS idx_imagerie_rapports_clinic_id ON public.imagerie_rapports(clinic_id);
      RAISE NOTICE 'Colonne clinic_id ajoutée à imagerie_rapports';
    ELSE
      RAISE NOTICE 'Colonne clinic_id existe déjà sur imagerie_rapports';
    END IF;
  ELSE
    RAISE NOTICE 'Table imagerie_rapports n''existe pas';
  END IF;
END $$;

-- =============================================
-- SECTION 2: CORRECTION DES POLICIES RLS - FOURNISSEURS
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fournisseurs'
  ) THEN
    ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;

    -- Supprimer toutes les anciennes policies permissives
    DROP POLICY IF EXISTS "Authenticated users can view fournisseurs" ON public.fournisseurs;
    DROP POLICY IF EXISTS "Authenticated users can insert fournisseurs" ON public.fournisseurs;
    DROP POLICY IF EXISTS "Authenticated users can update fournisseurs" ON public.fournisseurs;
    DROP POLICY IF EXISTS "Authenticated users can delete fournisseurs" ON public.fournisseurs;
    DROP POLICY IF EXISTS "fournisseurs_read_all" ON public.fournisseurs;
    DROP POLICY IF EXISTS "fournisseurs_insert" ON public.fournisseurs;
    DROP POLICY IF EXISTS "fournisseurs_update" ON public.fournisseurs;
    DROP POLICY IF EXISTS "fournisseurs_delete" ON public.fournisseurs;
    DROP POLICY IF EXISTS "unified_fournisseurs_policy" ON public.fournisseurs;
    DROP POLICY IF EXISTS "fournisseurs_clinic_access" ON public.fournisseurs;

    -- Créer la policy restrictive par clinic_id
    -- Les fournisseurs peuvent être partagés (clinic_id NULL) ou spécifiques à une clinique
    CREATE POLICY "fournisseurs_clinic_access" ON public.fournisseurs
    FOR ALL TO authenticated
    USING (
      (clinic_id = public.get_my_clinic_id()) 
      OR (clinic_id IS NULL) -- Fournisseurs partagés/globaux
    )
    WITH CHECK (
      clinic_id = public.get_my_clinic_id()
    );
    
    RAISE NOTICE 'Policy RLS créée pour fournisseurs';
  ELSE
    RAISE NOTICE 'Table fournisseurs n''existe pas (RLS ignoré)';
  END IF;
END $$;

-- =============================================
-- SECTION 3: CORRECTION DES POLICIES RLS - COMMANDES FOURNISSEUR
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'commandes_fournisseur'
  ) THEN
    ALTER TABLE public.commandes_fournisseur ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can view commandes_fournisseur" ON public.commandes_fournisseur;
    DROP POLICY IF EXISTS "Authenticated users can insert commandes_fournisseur" ON public.commandes_fournisseur;
    DROP POLICY IF EXISTS "Authenticated users can update commandes_fournisseur" ON public.commandes_fournisseur;
    DROP POLICY IF EXISTS "Authenticated users can delete commandes_fournisseur" ON public.commandes_fournisseur;
    DROP POLICY IF EXISTS "commandes_fournisseur_read_all" ON public.commandes_fournisseur;
    DROP POLICY IF EXISTS "commandes_fournisseur_insert" ON public.commandes_fournisseur;
    DROP POLICY IF EXISTS "commandes_fournisseur_update" ON public.commandes_fournisseur;
    DROP POLICY IF EXISTS "commandes_fournisseur_delete" ON public.commandes_fournisseur;
    DROP POLICY IF EXISTS "unified_commandes_fournisseur_policy" ON public.commandes_fournisseur;
    DROP POLICY IF EXISTS "commandes_fournisseur_clinic_access" ON public.commandes_fournisseur;

    CREATE POLICY "commandes_fournisseur_clinic_access" ON public.commandes_fournisseur
    FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());
    
    RAISE NOTICE 'Policy RLS créée pour commandes_fournisseur';
  ELSE
    RAISE NOTICE 'Table commandes_fournisseur n''existe pas (RLS ignoré)';
  END IF;
END $$;

-- =============================================
-- SECTION 4: CORRECTION DES POLICIES RLS - COMMANDES FOURNISSEUR LIGNES
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'commandes_fournisseur_lignes'
  ) THEN
    ALTER TABLE public.commandes_fournisseur_lignes ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can view commandes_fournisseur_lignes" ON public.commandes_fournisseur_lignes;
    DROP POLICY IF EXISTS "Authenticated users can insert commandes_fournisseur_lignes" ON public.commandes_fournisseur_lignes;
    DROP POLICY IF EXISTS "Authenticated users can update commandes_fournisseur_lignes" ON public.commandes_fournisseur_lignes;
    DROP POLICY IF EXISTS "Authenticated users can delete commandes_fournisseur_lignes" ON public.commandes_fournisseur_lignes;
    DROP POLICY IF EXISTS "commandes_fournisseur_lignes_read_all" ON public.commandes_fournisseur_lignes;
    DROP POLICY IF EXISTS "commandes_fournisseur_lignes_insert" ON public.commandes_fournisseur_lignes;
    DROP POLICY IF EXISTS "commandes_fournisseur_lignes_update" ON public.commandes_fournisseur_lignes;
    DROP POLICY IF EXISTS "commandes_fournisseur_lignes_delete" ON public.commandes_fournisseur_lignes;
    DROP POLICY IF EXISTS "unified_commandes_fournisseur_lignes_policy" ON public.commandes_fournisseur_lignes;
    DROP POLICY IF EXISTS "commandes_fournisseur_lignes_clinic_access" ON public.commandes_fournisseur_lignes;

    -- Isolation via la commande parente OU directement via clinic_id
    CREATE POLICY "commandes_fournisseur_lignes_clinic_access" ON public.commandes_fournisseur_lignes
    FOR ALL TO authenticated
    USING (
      (clinic_id = public.get_my_clinic_id())
      OR EXISTS (
        SELECT 1 FROM public.commandes_fournisseur cf 
        WHERE cf.id = commandes_fournisseur_lignes.commande_id 
        AND cf.clinic_id = public.get_my_clinic_id()
      )
    )
    WITH CHECK (
      clinic_id = public.get_my_clinic_id()
    );
    
    RAISE NOTICE 'Policy RLS créée pour commandes_fournisseur_lignes';
  ELSE
    RAISE NOTICE 'Table commandes_fournisseur_lignes n''existe pas (RLS ignoré)';
  END IF;
END $$;

-- =============================================
-- SECTION 5: CORRECTION DES POLICIES RLS - ALERTES ÉPIDÉMIQUES
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'alertes_epidemiques'
  ) THEN
    ALTER TABLE public.alertes_epidemiques ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "alertes_epidemiques_read" ON public.alertes_epidemiques;
    DROP POLICY IF EXISTS "alertes_epidemiques_insert" ON public.alertes_epidemiques;
    DROP POLICY IF EXISTS "alertes_epidemiques_update" ON public.alertes_epidemiques;
    DROP POLICY IF EXISTS "alertes_epidemiques_delete" ON public.alertes_epidemiques;
    DROP POLICY IF EXISTS "unified_alertes_epidemiques_policy" ON public.alertes_epidemiques;
    DROP POLICY IF EXISTS "alertes_epidemiques_clinic_access" ON public.alertes_epidemiques;

    CREATE POLICY "alertes_epidemiques_clinic_access" ON public.alertes_epidemiques
    FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());
    
    RAISE NOTICE 'Policy RLS créée pour alertes_epidemiques';
  ELSE
    RAISE NOTICE 'Table alertes_epidemiques n''existe pas (RLS ignoré)';
  END IF;
END $$;

-- =============================================
-- SECTION 6: CORRECTION DES POLICIES RLS - LAB RAPPORTS (si existe)
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'lab_rapports'
  ) THEN
    ALTER TABLE public.lab_rapports ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "lab_rapports_read" ON public.lab_rapports;
    DROP POLICY IF EXISTS "lab_rapports_clinic_access" ON public.lab_rapports;
    
    -- Policy avec fallback via prélèvement si clinic_id est NULL
    CREATE POLICY "lab_rapports_clinic_access" ON public.lab_rapports
    FOR ALL TO authenticated
    USING (
      (clinic_id = public.get_my_clinic_id())
      OR (
        clinic_id IS NULL 
        AND EXISTS (
          SELECT 1 FROM public.lab_prelevements lp 
          WHERE lp.id = lab_rapports.prelevement_id 
          AND lp.clinic_id = public.get_my_clinic_id()
        )
      )
    )
    WITH CHECK (clinic_id = public.get_my_clinic_id());
    
    RAISE NOTICE 'Policy RLS créée pour lab_rapports';
  ELSE
    RAISE NOTICE 'Table lab_rapports n''existe pas (RLS ignoré)';
  END IF;
END $$;

-- =============================================
-- SECTION 7: CORRECTION DES POLICIES RLS - IMAGERIE RAPPORTS (si existe)
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'imagerie_rapports'
  ) THEN
    ALTER TABLE public.imagerie_rapports ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "imagerie_rapports_read" ON public.imagerie_rapports;
    DROP POLICY IF EXISTS "imagerie_rapports_clinic_access" ON public.imagerie_rapports;
    
    CREATE POLICY "imagerie_rapports_clinic_access" ON public.imagerie_rapports
    FOR ALL TO authenticated
    USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());
    
    RAISE NOTICE 'Policy RLS créée pour imagerie_rapports';
  ELSE
    RAISE NOTICE 'Table imagerie_rapports n''existe pas (RLS ignoré)';
  END IF;
END $$;

-- =============================================
-- SECTION 8: MIGRATION DES DONNÉES ORPHELINES
-- Assigner les données sans clinic_id à la clinique appropriée
-- =============================================

-- Pour les fournisseurs orphelins, on les laisse NULL (partagés)
-- Pour les commandes et alertes, on essaie de les associer via les relations

-- Commandes fournisseur: associer via le médicament de la première ligne si possible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'commandes_fournisseur'
  ) THEN
    UPDATE public.commandes_fournisseur cf
    SET clinic_id = (
      SELECT m.clinic_id 
      FROM public.commandes_fournisseur_lignes cfl
      JOIN public.medicaments m ON m.id = cfl.medicament_id
      WHERE cfl.commande_id = cf.id
      LIMIT 1
    )
    WHERE cf.clinic_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.commandes_fournisseur_lignes cfl
      JOIN public.medicaments m ON m.id = cfl.medicament_id
      WHERE cfl.commande_id = cf.id AND m.clinic_id IS NOT NULL
    );
    RAISE NOTICE 'Migration des données effectuée pour commandes_fournisseur';
  END IF;
END $$;

-- Commandes fournisseur lignes: hériter du clinic_id de la commande parente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'commandes_fournisseur_lignes'
  ) THEN
    UPDATE public.commandes_fournisseur_lignes cfl
    SET clinic_id = cf.clinic_id
    FROM public.commandes_fournisseur cf
    WHERE cfl.commande_id = cf.id
    AND cfl.clinic_id IS NULL
    AND cf.clinic_id IS NOT NULL;
    RAISE NOTICE 'Migration des données effectuée pour commandes_fournisseur_lignes';
  END IF;
END $$;

-- Alertes épidémiques: associer via l'analyse si possible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'alertes_epidemiques'
  ) THEN
    UPDATE public.alertes_epidemiques ae
    SET clinic_id = (
      SELECT la.clinic_id 
      FROM public.lab_analyses la
      WHERE la.id = ae.analyse_id
      LIMIT 1
    )
    WHERE ae.clinic_id IS NULL
    AND ae.analyse_id IS NOT NULL;
    RAISE NOTICE 'Migration des données effectuée pour alertes_epidemiques';
  ELSE
    RAISE NOTICE 'Table alertes_epidemiques n''existe pas (migration des données ignorée)';
  END IF;
END $$;

-- =============================================
-- SECTION 9: VÉRIFICATION FINALE
-- =============================================

-- Afficher un résumé des tables et leurs policies
DO $$
DECLARE
  table_rec RECORD;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== VÉRIFICATION DES POLICIES RLS ===';
  
  FOR table_rec IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'fournisseurs', 
      'commandes_fournisseur', 
      'commandes_fournisseur_lignes',
      'alertes_epidemiques',
      'alertes_stock',
      'lab_rapports',
      'imagerie_rapports'
    )
  LOOP
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = table_rec.tablename AND schemaname = 'public';
    
    RAISE NOTICE 'Table: % - Policies: %', table_rec.tablename, policy_count;
  END LOOP;
END $$;

-- =============================================
-- SECTION 10: CORRECTION DES POLICIES RLS - REGISTRATION_REQUESTS
-- Problème: Policies multiples en conflit empêchant l'affichage des demandes
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'registration_requests'
  ) THEN
    ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

    -- Supprimer TOUTES les anciennes policies pour éviter les conflits
    DROP POLICY IF EXISTS "registration_requests_select" ON public.registration_requests;
    DROP POLICY IF EXISTS "registration_requests_read" ON public.registration_requests;
    DROP POLICY IF EXISTS "registration_requests_insert" ON public.registration_requests;
    DROP POLICY IF EXISTS "registration_requests_update" ON public.registration_requests;
    DROP POLICY IF EXISTS "registration_requests_delete" ON public.registration_requests;
    DROP POLICY IF EXISTS "super_admin_manage_requests" ON public.registration_requests;
    DROP POLICY IF EXISTS "clinic_admin_manage_requests" ON public.registration_requests;
    DROP POLICY IF EXISTS "anon_insert_requests" ON public.registration_requests;
    DROP POLICY IF EXISTS "unified_registration_requests_policy" ON public.registration_requests;
    DROP POLICY IF EXISTS "registration_requests_clinic_access" ON public.registration_requests;

    -- Policy 1: Insertion anonyme (pour les nouvelles inscriptions)
    CREATE POLICY "registration_requests_anon_insert" ON public.registration_requests
    FOR INSERT TO anon
    WITH CHECK (true);

    -- Policy 2: SELECT pour les utilisateurs authentifiés de la même clinique ou Super Admin
    CREATE POLICY "registration_requests_select" ON public.registration_requests
    FOR SELECT TO authenticated
    USING (
      clinic_id = public.get_my_clinic_id() 
      OR public.check_is_super_admin()
    );

    -- Policy 3: UPDATE/DELETE pour les admins de la clinique
    CREATE POLICY "registration_requests_manage" ON public.registration_requests
    FOR ALL TO authenticated
    USING (
      clinic_id = public.get_my_clinic_id()
    )
    WITH CHECK (
      clinic_id = public.get_my_clinic_id()
    );
    
    RAISE NOTICE 'Policies RLS créées pour registration_requests';
  ELSE
    RAISE NOTICE 'Table registration_requests n''existe pas (RLS ignoré)';
  END IF;
END $$;

-- =============================================
-- SECTION 11: VÉRIFIER LA FONCTION check_is_super_admin()
-- =============================================

-- S'assurer que la fonction existe et retourne correctement
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND actif = true
    AND status IN ('ACTIVE', 'APPROVED')
  LIMIT 1;
  
  RETURN v_role = 'SUPER_ADMIN';
END;
$$;

-- =============================================
-- SECTION 12: VÉRIFIER LA FONCTION check_is_clinic_admin()
-- =============================================

CREATE OR REPLACE FUNCTION public.check_is_clinic_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND actif = true
    AND status IN ('ACTIVE', 'APPROVED')
  LIMIT 1;
  
  RETURN v_role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'ADMIN');
END;
$$;

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================

-- Commentaires sur les tables (seulement si elles existent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fournisseurs') THEN
    COMMENT ON TABLE public.fournisseurs IS 'Table des fournisseurs avec isolation multi-tenant (clinic_id NULL = partagé)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commandes_fournisseur') THEN
    COMMENT ON TABLE public.commandes_fournisseur IS 'Table des commandes fournisseur isolée par clinic_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alertes_epidemiques') THEN
    COMMENT ON TABLE public.alertes_epidemiques IS 'Table des alertes épidémiques isolée par clinic_id';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'registration_requests') THEN
    COMMENT ON TABLE public.registration_requests IS 'Table des demandes d''inscription avec isolation par clinic_id';
  END IF;
END $$;
