-- ============================================
-- MIGRATION 60: ARCHIVAGE DES DONNÉES ORPHELINES (MOVE VERS ARCHIVE)
-- ============================================
-- Conforme au plan: déplacer les enregistrements ambiguës/indéterminables
-- vers le schéma archive (INSERT INTO archive.* ; DELETE FROM public.*)
-- avec traçabilité (archived_at, archived_reason, archived_run_id, data_cleanup_log).
-- À exécuter après 59_SAFE_LEGACY_DATA_CLEANUP.sql.
-- ============================================

DO $$
DECLARE
  v_orphan_clinic_id UUID;
  v_run_id UUID := gen_random_uuid();
  v_count INTEGER;
  v_table_name TEXT;
BEGIN
  SELECT id INTO v_orphan_clinic_id FROM clinics WHERE code = 'ORPHANED';
  IF v_orphan_clinic_id IS NULL THEN
    RAISE NOTICE 'Aucune clinique ORPHANED trouvée. Rien à archiver.';
    RETURN;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'ARCHIVAGE DES DONNÉES ORPHELINES';
  RAISE NOTICE 'Run ID: %', v_run_id;
  RAISE NOTICE '========================================';

  -- Créer le schéma archive
  CREATE SCHEMA IF NOT EXISTS archive;

  -- ============================================
  -- PAIEMENTS (enfant de factures, traiter en premier pour les deletes)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'paiements') THEN
    CREATE TABLE IF NOT EXISTS archive.paiements (
      LIKE public.paiements INCLUDING DEFAULTS
    );
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'archive' AND table_name = 'paiements' AND column_name = 'archived_at') THEN
      ALTER TABLE archive.paiements ADD COLUMN archived_at timestamptz DEFAULT now();
      ALTER TABLE archive.paiements ADD COLUMN archived_reason text;
      ALTER TABLE archive.paiements ADD COLUMN archived_run_id uuid;
    END IF;

    INSERT INTO archive.paiements
    SELECT p.*, now(), 'ORPHANED_MOVED', v_run_id
    FROM public.paiements p
    WHERE p.clinic_id = v_orphan_clinic_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN
      INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
      VALUES ('paiements', 'ARCHIVED_ORPHANS', v_orphan_clinic_id, format('%s paiements déplacés vers archive', v_count));
      DELETE FROM public.paiements WHERE clinic_id = v_orphan_clinic_id;
      RAISE NOTICE '   ✅ % paiements archivés et supprimés de public', v_count;
    END IF;
  END IF;

  -- ============================================
  -- FACTURES
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'factures') THEN
    CREATE TABLE IF NOT EXISTS archive.factures (
      LIKE public.factures INCLUDING DEFAULTS
    );
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'archive' AND table_name = 'factures' AND column_name = 'archived_at') THEN
      ALTER TABLE archive.factures ADD COLUMN archived_at timestamptz DEFAULT now();
      ALTER TABLE archive.factures ADD COLUMN archived_reason text;
      ALTER TABLE archive.factures ADD COLUMN archived_run_id uuid;
    END IF;

    INSERT INTO archive.factures
    SELECT f.*, now(), 'ORPHANED_MOVED', v_run_id
    FROM public.factures f
    WHERE f.clinic_id = v_orphan_clinic_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN
      INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
      VALUES ('factures', 'ARCHIVED_ORPHANS', v_orphan_clinic_id, format('%s factures déplacées vers archive', v_count));
      DELETE FROM public.factures WHERE clinic_id = v_orphan_clinic_id;
      RAISE NOTICE '   ✅ % factures archivées et supprimées de public', v_count;
    END IF;
  END IF;

  -- ============================================
  -- CONSULTATIONS
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consultations') THEN
    CREATE TABLE IF NOT EXISTS archive.consultations (
      LIKE public.consultations INCLUDING DEFAULTS
    );
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'archive' AND table_name = 'consultations' AND column_name = 'archived_at') THEN
      ALTER TABLE archive.consultations ADD COLUMN archived_at timestamptz DEFAULT now();
      ALTER TABLE archive.consultations ADD COLUMN archived_reason text;
      ALTER TABLE archive.consultations ADD COLUMN archived_run_id uuid;
    END IF;

    INSERT INTO archive.consultations
    SELECT c.*, now(), 'ORPHANED_MOVED', v_run_id
    FROM public.consultations c
    WHERE c.clinic_id = v_orphan_clinic_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN
      INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
      VALUES ('consultations', 'ARCHIVED_ORPHANS', v_orphan_clinic_id, format('%s consultations déplacées vers archive', v_count));
      DELETE FROM public.consultations WHERE clinic_id = v_orphan_clinic_id;
      RAISE NOTICE '   ✅ % consultations archivées et supprimées de public', v_count;
    END IF;
  END IF;

  -- ============================================
  -- PATIENTS
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patients') THEN
    CREATE TABLE IF NOT EXISTS archive.patients (
      LIKE public.patients INCLUDING DEFAULTS
    );
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'archive' AND table_name = 'patients' AND column_name = 'archived_at') THEN
      ALTER TABLE archive.patients ADD COLUMN archived_at timestamptz DEFAULT now();
      ALTER TABLE archive.patients ADD COLUMN archived_reason text;
      ALTER TABLE archive.patients ADD COLUMN archived_run_id uuid;
    END IF;

    INSERT INTO archive.patients
    SELECT p.*, now(), 'ORPHANED_MOVED', v_run_id
    FROM public.patients p
    WHERE p.clinic_id = v_orphan_clinic_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN
      INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
      VALUES ('patients', 'ARCHIVED_ORPHANS', v_orphan_clinic_id, format('%s patients déplacés vers archive', v_count));
      DELETE FROM public.patients WHERE clinic_id = v_orphan_clinic_id;
      RAISE NOTICE '   ✅ % patients archivés et supprimés de public', v_count;
    END IF;
  END IF;

  -- ============================================
  -- IMAGING_REQUESTS (si existe)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'imaging_requests') THEN
    CREATE TABLE IF NOT EXISTS archive.imaging_requests (
      LIKE public.imaging_requests INCLUDING DEFAULTS
    );
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'archive' AND table_name = 'imaging_requests' AND column_name = 'archived_at') THEN
      ALTER TABLE archive.imaging_requests ADD COLUMN archived_at timestamptz DEFAULT now();
      ALTER TABLE archive.imaging_requests ADD COLUMN archived_reason text;
      ALTER TABLE archive.imaging_requests ADD COLUMN archived_run_id uuid;
    END IF;

    INSERT INTO archive.imaging_requests
    SELECT ir.*, now(), 'ORPHANED_MOVED', v_run_id
    FROM public.imaging_requests ir
    WHERE ir.clinic_id = v_orphan_clinic_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN
      INSERT INTO data_cleanup_log (table_name, action, new_clinic_id, reason)
      VALUES ('imaging_requests', 'ARCHIVED_ORPHANS', v_orphan_clinic_id, format('%s imaging_requests déplacés vers archive', v_count));
      DELETE FROM public.imaging_requests WHERE clinic_id = v_orphan_clinic_id;
      RAISE NOTICE '   ✅ % imaging_requests archivés et supprimés de public', v_count;
    END IF;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'ARCHIVAGE TERMINÉ. Run ID: %', v_run_id;
  RAISE NOTICE 'Consultez data_cleanup_log et archive.* pour la traçabilité.';
  RAISE NOTICE '========================================';

END $$;
