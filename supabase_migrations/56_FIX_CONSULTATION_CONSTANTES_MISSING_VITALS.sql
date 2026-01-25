-- =========================================================
-- FIX: consultation_constantes - colonnes manquantes (PGRST204)
-- Contexte:
--  - L'app upsert sur /rest/v1/consultation_constantes
--  - Erreur: "Could not find the 'frequence_respiratoire' column ..."
-- Objectif:
--  - Ajouter frequence_respiratoire / saturation_o2 / glycemie_mg_dl
--  - Garantir une contrainte UNIQUE(consultation_id) pour on_conflict
--  - Forcer le reload du schema cache PostgREST (pgrst)
-- =========================================================

ALTER TABLE public.consultation_constantes
  ADD COLUMN IF NOT EXISTS frequence_respiratoire INTEGER,
  ADD COLUMN IF NOT EXISTS saturation_o2 INTEGER,
  ADD COLUMN IF NOT EXISTS glycemie_mg_dl NUMERIC(6,2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'consultation_constantes'
      AND c.conname = 'consultation_constantes_unique_consultation_id'
  ) THEN
    ALTER TABLE public.consultation_constantes
      ADD CONSTRAINT consultation_constantes_unique_consultation_id
      UNIQUE (consultation_id);
  END IF;
END $$;

-- Forcer le rechargement du cache PostgREST
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN others THEN
  NULL;
END $$;

