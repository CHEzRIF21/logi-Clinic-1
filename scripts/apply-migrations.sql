-- Script pour appliquer toutes les migrations du module Maternité
-- À exécuter dans Supabase SQL Editor

-- ============================================
-- MIGRATION 1: DOSSIER OBSTÉTRICAL
-- ============================================

-- Vérifier si la table patients existe (pré-requis)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'patients') THEN
    RAISE NOTICE 'ATTENTION: La table patients n''existe pas. Veuillez créer la table patients d''abord.';
  END IF;
END $$;

-- Appliquer la migration du dossier obstétrical
-- Copiez le contenu de supabase_migrations/create_dossier_obstetrical_table.sql ici

-- ============================================
-- MIGRATION 2: CPN
-- ============================================

-- Appliquer la migration CPN
-- Copiez le contenu de supabase_migrations/create_cpn_tables.sql ici

-- ============================================
-- MIGRATION 3: ACCOUCHEMENT
-- ============================================

-- Appliquer la migration Accouchement
-- Copiez le contenu de supabase_migrations/create_accouchement_tables.sql ici

-- ============================================
-- MIGRATION 4: POST-PARTUM
-- ============================================

-- Appliquer la migration Post-Partum
-- Copiez le contenu de supabase_migrations/create_post_partum_tables.sql ici

-- ============================================
-- VÉRIFICATION DES TABLES CRÉÉES
-- ============================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND (
  table_name LIKE '%obstetrical%' OR 
  table_name LIKE '%cpn%' OR 
  table_name LIKE '%accouchement%' OR 
  table_name LIKE '%post_partum%' OR
  table_name LIKE '%grossesses%' OR
  table_name LIKE '%vaccination%' OR
  table_name LIKE '%nouveau_ne%' OR
  table_name LIKE '%delivrance%' OR
  table_name LIKE '%placenta%' OR
  table_name LIKE '%surveillance%'
)
ORDER BY table_name;

-- Vérifier les fonctions créées
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (
  routine_name LIKE '%dpa%' OR 
  routine_name LIKE '%apgar%' OR 
  routine_name LIKE '%cpn%' OR 
  routine_name LIKE '%post_partum%' OR
  routine_name LIKE '%trimestre%'
)
ORDER BY routine_name;

-- Vérifier les vues créées
SELECT 
  table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
AND (
  table_name LIKE '%resume%' OR
  table_name LIKE '%vue%'
)
ORDER BY table_name;

