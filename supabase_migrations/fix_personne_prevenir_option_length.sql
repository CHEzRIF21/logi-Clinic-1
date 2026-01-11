-- Migration: Correction de la longueur du champ personne_prevenir_option
-- Date: 2025-01-XX
-- Description: Augmente la taille de VARCHAR(20) à VARCHAR(30) pour accepter "identique_accompagnant" (24 caractères)
-- 
-- PROBLÈME: Le champ personne_prevenir_option est défini comme VARCHAR(20) mais la valeur "identique_accompagnant" fait 24 caractères
-- SOLUTION: Augmenter la taille à VARCHAR(30) pour permettre cette valeur

DO $$
BEGIN
  -- Supprimer la contrainte CHECK existante si elle existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'patients_personne_prevenir_option_check'
    AND conrelid = 'patients'::regclass
  ) THEN
    ALTER TABLE patients DROP CONSTRAINT patients_personne_prevenir_option_check;
    RAISE NOTICE 'Contrainte CHECK supprimée';
  END IF;

  -- Modifier la colonne pour augmenter la taille à VARCHAR(30)
  ALTER TABLE patients
  ALTER COLUMN personne_prevenir_option TYPE VARCHAR(30);

  RAISE NOTICE 'Colonne personne_prevenir_option modifiée en VARCHAR(30)';

  -- Recréer la contrainte CHECK avec la nouvelle taille
  ALTER TABLE patients
  ADD CONSTRAINT patients_personne_prevenir_option_check 
  CHECK (personne_prevenir_option IN ('identique_accompagnant', 'autre'));

  RAISE NOTICE 'Contrainte CHECK recréée';

  -- Commentaire mis à jour
  COMMENT ON COLUMN patients.personne_prevenir_option IS 'Option: identique à l''accompagnant ou autre (VARCHAR(30) pour accepter "identique_accompagnant")';

  RAISE NOTICE '✅ Migration terminée avec succès';
END $$;
