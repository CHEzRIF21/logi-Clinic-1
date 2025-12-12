-- Script d'application de toutes les migrations du module Laboratoire avec tarification
-- Date: 2025-01-XX
-- Description: Applique toutes les migrations nécessaires pour le module Laboratoire

-- 1. Appliquer les migrations de base du laboratoire
\i create_laboratoire_tables.sql
\i create_laboratoire_phase2.sql
\i create_laboratoire_phase3_ameliorations.sql
\i create_laboratoire_integrations.sql

-- 2. Appliquer la migration de tarification
\i create_laboratoire_tarification.sql

-- 3. Vérifier que toutes les tables existent
DO $$
BEGIN
  -- Vérifier les tables principales
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_prescriptions') THEN
    RAISE EXCEPTION 'Table lab_prescriptions manquante';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_prelevements') THEN
    RAISE EXCEPTION 'Table lab_prelevements manquante';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_analyses') THEN
    RAISE EXCEPTION 'Table lab_analyses manquante';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_prescriptions_analyses') THEN
    RAISE EXCEPTION 'Table lab_prescriptions_analyses manquante';
  END IF;
  
  -- Vérifier les colonnes de tarification
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_prescriptions' AND column_name = 'montant_total'
  ) THEN
    RAISE EXCEPTION 'Colonne montant_total manquante dans lab_prescriptions';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_prescriptions' AND column_name = 'statut_paiement'
  ) THEN
    RAISE EXCEPTION 'Colonne statut_paiement manquante dans lab_prescriptions';
  END IF;
  
  RAISE NOTICE 'Toutes les migrations ont été appliquées avec succès';
END $$;

