-- Script d'application des migrations pour le module Consultation
-- À exécuter dans l'ordre dans Supabase SQL Editor

-- ============================================
-- 1. Corrections des tables existantes
-- ============================================
\i fix_consultation_tables.sql

-- ============================================
-- 2. Création des templates spécialisés
-- ============================================
\i create_specialized_consultation_templates.sql

-- Note: Si vous utilisez Supabase Dashboard, exécutez chaque fichier séparément dans l'ordre :
-- 1. fix_consultation_tables.sql
-- 2. create_specialized_consultation_templates.sql

