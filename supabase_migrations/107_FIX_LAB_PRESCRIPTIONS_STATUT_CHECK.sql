-- Migration 107: Corriger la contrainte lab_prescriptions_statut_check
-- Problème: L'enregistrement des bilans antérieurs échouait car "termine" n'était pas accepté
-- La contrainte n'autorisait que: prescrit, preleve, annule
-- Solution: Ajouter "termine" pour les bilans antérieurs déjà complétés

DO $$
BEGIN
  -- Supprimer l'ancienne contrainte (nom auto-généré par PostgreSQL pour CHECK inline)
  ALTER TABLE lab_prescriptions DROP CONSTRAINT IF EXISTS lab_prescriptions_statut_check;

  -- Ajouter la nouvelle contrainte avec 'termine' inclus
  ALTER TABLE lab_prescriptions 
  ADD CONSTRAINT lab_prescriptions_statut_check 
  CHECK (statut IN ('prescrit', 'preleve', 'termine', 'annule'));

  RAISE NOTICE '✅ Contrainte lab_prescriptions_statut_check mise à jour: prescrit, preleve, termine, annule';
END $$;
