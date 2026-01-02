-- ============================================
-- MIGRATION 36: CORRECTION INDEX DUPLIQUÉ
-- ============================================
-- Cette migration supprime l'index dupliqué sur exam_catalog.code
-- ============================================

-- Supprimer l'index dupliqué (garder la contrainte unique)
DROP INDEX IF EXISTS idx_exam_catalog_code;

-- Vérifier que la contrainte unique existe toujours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'exam_catalog_code_key' 
    AND conrelid = 'exam_catalog'::regclass
  ) THEN
    ALTER TABLE exam_catalog ADD CONSTRAINT exam_catalog_code_key UNIQUE (code);
  END IF;
END $$;

COMMENT ON CONSTRAINT exam_catalog_code_key ON exam_catalog IS 'Contrainte unique conservée, index dupliqué supprimé';

