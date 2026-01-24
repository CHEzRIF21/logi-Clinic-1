-- ============================================
-- MIGRATION : Fix de la contrainte CHECK pour mode_paiement dans paiements
-- VERSION: 52
-- DATE: 2026-01-24
-- ============================================
-- Ce script :
-- 1. Supprime l'ancienne contrainte CHECK si elle existe
-- 2. Recrée la contrainte avec toutes les valeurs de mode de paiement autorisées
-- ============================================

-- Supprimer l'ancienne contrainte si elle existe
DO $$
BEGIN
  -- Supprimer la contrainte par nom si elle existe
  ALTER TABLE paiements 
    DROP CONSTRAINT IF EXISTS paiements_mode_paiement_check;
  
  RAISE NOTICE '✅ Ancienne contrainte paiements_mode_paiement_check supprimée (si elle existait)';
END $$;

-- Recréer la contrainte avec toutes les valeurs autorisées
ALTER TABLE paiements 
  ADD CONSTRAINT paiements_mode_paiement_check 
  CHECK (mode_paiement IN (
    'especes', 
    'orange_money', 
    'mtn_mobile_money', 
    'moov_money', 
    'wave', 
    'flooz', 
    't_money', 
    'carte_bancaire', 
    'virement', 
    'cheque', 
    'prise_en_charge'
  ));

-- Vérifier que la contrainte a été créée
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'paiements_mode_paiement_check'
    AND check_clause LIKE '%mtn_mobile_money%'
  ) THEN
    RAISE NOTICE '✅ Contrainte paiements_mode_paiement_check créée avec succès (inclut mtn_mobile_money)';
  ELSE
    RAISE WARNING '⚠️ La contrainte paiements_mode_paiement_check pourrait ne pas être correcte';
  END IF;
END $$;
