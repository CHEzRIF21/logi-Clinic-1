-- Migration: Corrections et ajouts pour les tables de consultation
-- Date: 2025-01-XX
-- Description: Ajout des colonnes manquantes et corrections de structure

-- ============================================
-- 1. Ajout de consultation_id à rendez_vous
-- ============================================
ALTER TABLE rendez_vous 
ADD COLUMN IF NOT EXISTS consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL;

-- Ajout de praticien_name à rendez_vous (si nécessaire)
ALTER TABLE rendez_vous 
ADD COLUMN IF NOT EXISTS praticien_name VARCHAR(200);

-- Index pour consultation_id dans rendez_vous
CREATE INDEX IF NOT EXISTS idx_rv_consultation ON rendez_vous(consultation_id);

-- ============================================
-- 2. Vérification et création de consultation_roles si nécessaire
-- ============================================
CREATE TABLE IF NOT EXISTS consultation_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_code VARCHAR(50) UNIQUE NOT NULL,
  role_label VARCHAR(200) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{
    "can_validate": false,
    "can_modify_fiche": false,
    "can_see_sensitive": false,
    "can_create": false,
    "can_delete": false
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. Ajout de consultation_id à factures si nécessaire
-- ============================================
ALTER TABLE factures 
ADD COLUMN IF NOT EXISTS consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL;

-- Index pour consultation_id dans factures
CREATE INDEX IF NOT EXISTS idx_factures_consultation ON factures(consultation_id);

-- ============================================
-- 4. Commentaires
-- ============================================
COMMENT ON COLUMN rendez_vous.consultation_id IS 'Référence vers la consultation associée';
COMMENT ON COLUMN rendez_vous.praticien_name IS 'Nom du praticien (si praticien_id non disponible)';
COMMENT ON TABLE consultation_roles IS 'Rôles et permissions pour le module Consultation';

