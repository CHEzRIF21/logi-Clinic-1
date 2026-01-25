-- ============================================
-- MIGRATION : Fix colonnes workflow consultations
-- VERSION: 53
-- DATE: 2026-01-25
-- ============================================
-- Objectif:
-- Corriger l'erreur PGRST204 "Could not find the 'diagnostics_detail' column of 'consultations'"
-- en ajoutant (si manquantes) les colonnes utilisées par le workflow consultation.
--
-- Colonnes concernées (utilisées dans src/services/consultationService.ts#saveWorkflowStep):
-- - motifs (JSONB)
-- - categorie_motif (VARCHAR)
-- - anamnese (TEXT)
-- - antecedents_consultation (JSONB)
-- - examens_cliniques (JSONB)
-- - diagnostics (JSONB)
-- - diagnostics_detail (JSONB)
-- ============================================

DO $$
BEGIN
  -- motifs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='consultations' AND column_name='motifs'
  ) THEN
    ALTER TABLE public.consultations
      ADD COLUMN motifs JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Colonne consultations.motifs ajoutée';
  END IF;

  -- categorie_motif
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='consultations' AND column_name='categorie_motif'
  ) THEN
    ALTER TABLE public.consultations
      ADD COLUMN categorie_motif VARCHAR(100);
    RAISE NOTICE '✅ Colonne consultations.categorie_motif ajoutée';
  END IF;

  -- anamnese
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='consultations' AND column_name='anamnese'
  ) THEN
    ALTER TABLE public.consultations
      ADD COLUMN anamnese TEXT;
    RAISE NOTICE '✅ Colonne consultations.anamnese ajoutée';
  END IF;

  -- antecedents_consultation (stockage JSON pour le workflow)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='consultations' AND column_name='antecedents_consultation'
  ) THEN
    ALTER TABLE public.consultations
      ADD COLUMN antecedents_consultation JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Colonne consultations.antecedents_consultation ajoutée';
  END IF;

  -- examens_cliniques
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='consultations' AND column_name='examens_cliniques'
  ) THEN
    ALTER TABLE public.consultations
      ADD COLUMN examens_cliniques JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Colonne consultations.examens_cliniques ajoutée';
  END IF;

  -- diagnostics
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='consultations' AND column_name='diagnostics'
  ) THEN
    ALTER TABLE public.consultations
      ADD COLUMN diagnostics JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Colonne consultations.diagnostics ajoutée';
  END IF;

  -- diagnostics_detail
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='consultations' AND column_name='diagnostics_detail'
  ) THEN
    ALTER TABLE public.consultations
      ADD COLUMN diagnostics_detail JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Colonne consultations.diagnostics_detail ajoutée';
  END IF;
END $$;

-- Rafraîchir le cache PostgREST (peut résoudre PGRST204 si cache périmé)
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  RAISE NOTICE 'ℹ️ pg_notify(pgrst, reload schema) envoyé';
END $$;

