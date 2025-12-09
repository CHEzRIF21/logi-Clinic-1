-- Migration: Création de la table rendez_vous dans Supabase
-- Description: Structure compatible avec le modèle Mongoose backend

-- Extension requise pour gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table rendez_vous
CREATE TABLE IF NOT EXISTS rendez_vous (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN (
    'Consultation générale','Maternité','Vaccination','Laboratoire','Pédiatrie','Autres'
  )),
  praticien_id UUID NULL,
  motif TEXT NOT NULL,
  date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
  date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  duree_minutes INTEGER CHECK (duree_minutes IS NULL OR duree_minutes >= 5),
  statut TEXT NOT NULL DEFAULT 'programmé' CHECK (statut IN ('programmé','confirmé','annulé','terminé','manqué')),
  priorite TEXT NOT NULL DEFAULT 'normal' CHECK (priorite IN ('normal','urgent')),
  notes TEXT,
  rappel_sms BOOLEAN NOT NULL DEFAULT false,
  rappel_email BOOLEAN NOT NULL DEFAULT false,
  rappel_envoye_le TIMESTAMP WITH TIME ZONE,
  confirme_par_patient BOOLEAN NOT NULL DEFAULT false,
  confirme_le TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_dates_valide CHECK (date_fin > date_debut)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_rv_date ON rendez_vous(date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_rv_patient ON rendez_vous(patient_id, date_debut);
CREATE INDEX IF NOT EXISTS idx_rv_service ON rendez_vous(service, date_debut);
CREATE INDEX IF NOT EXISTS idx_rv_statut ON rendez_vous(statut);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_rv_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rv_updated_at ON rendez_vous;
CREATE TRIGGER trg_rv_updated_at
  BEFORE UPDATE ON rendez_vous
  FOR EACH ROW EXECUTE FUNCTION set_rv_updated_at();

-- Commentaires
COMMENT ON TABLE rendez_vous IS 'Rendez-vous patients (migré depuis MongoDB)';
COMMENT ON COLUMN rendez_vous.patient_id IS 'FK patients.id';
COMMENT ON COLUMN rendez_vous.praticien_id IS 'Optionnel: référence vers table users si existante';


