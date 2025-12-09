-- Migration: Création des tables du module Laboratoire (Phase 1)
-- Date: 2025-01-05

-- 1. Prescriptions d'examens
CREATE TABLE IF NOT EXISTS lab_prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  prescripteur VARCHAR(150),
  service_prescripteur VARCHAR(100),
  type_examen VARCHAR(150) NOT NULL,
  details TEXT,
  date_prescription TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  origine VARCHAR(20) CHECK (origine IN ('consultation','urgence','labo')) DEFAULT 'consultation',
  statut VARCHAR(20) CHECK (statut IN ('prescrit','preleve','annule')) DEFAULT 'prescrit',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Prélèvements
CREATE TABLE IF NOT EXISTS lab_prelevements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES lab_prescriptions(id) ON DELETE CASCADE,
  code_unique VARCHAR(100) UNIQUE NOT NULL,
  type_echantillon VARCHAR(100) NOT NULL,
  date_prelevement TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  agent_preleveur VARCHAR(150),
  commentaires TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_lab_prescriptions_patient ON lab_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_prescriptions_type ON lab_prescriptions(type_examen);
CREATE INDEX IF NOT EXISTS idx_lab_prelevements_prescription ON lab_prelevements(prescription_id);

-- Trigger update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lab_prescriptions_updated_at 
  BEFORE UPDATE ON lab_prescriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_prelevements_updated_at 
  BEFORE UPDATE ON lab_prelevements 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE lab_prescriptions IS 'Prescriptions d\'examens de laboratoire';
COMMENT ON TABLE lab_prelevements IS 'Prélèvements liés aux prescriptions';


