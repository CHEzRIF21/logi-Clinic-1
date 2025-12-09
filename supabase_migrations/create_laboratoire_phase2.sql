-- Migration: Laboratoire Phase 2 - Analyses, Résultats, Rapports
-- Date: 2025-01-05

-- 1. Analyses (par prélèvement)
CREATE TABLE IF NOT EXISTS lab_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prelevement_id UUID NOT NULL REFERENCES lab_prelevements(id) ON DELETE CASCADE,
  parametre VARCHAR(150) NOT NULL, -- ex: Glycémie, VIH, Paludisme RDT
  type_resultat VARCHAR(20) CHECK (type_resultat IN ('qualitatif','quantitatif')) NOT NULL,
  unite VARCHAR(50),
  valeur_numerique DECIMAL(12,4),
  valeur_qualitative VARCHAR(50), -- Positif/Négatif
  bornes_reference VARCHAR(100), -- ex: 70-110 mg/dL
  statut VARCHAR(20) CHECK (statut IN ('en_attente','en_cours','termine')) DEFAULT 'en_attente',
  technicien VARCHAR(150),
  valide_par VARCHAR(150),
  date_validation TIMESTAMP WITH TIME ZONE,
  commentaires TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Rapports de laboratoire (regroupe analyses par prélèvement)
CREATE TABLE IF NOT EXISTS lab_rapports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prelevement_id UUID NOT NULL REFERENCES lab_prelevements(id) ON DELETE CASCADE,
  numero_rapport VARCHAR(50) UNIQUE NOT NULL,
  statut VARCHAR(20) CHECK (statut IN ('brouillon','signe','transmis')) DEFAULT 'brouillon',
  signe_par VARCHAR(150),
  signature_electronique TEXT, -- hash/empreinte, à implémenter plus tard
  date_generation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_signature TIMESTAMP WITH TIME ZONE,
  date_transmission TIMESTAMP WITH TIME ZONE,
  destinataire VARCHAR(150), -- module Consultation, email, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_analyses_prelevement ON lab_analyses(prelevement_id);
CREATE INDEX IF NOT EXISTS idx_lab_analyses_statut ON lab_analyses(statut);
CREATE INDEX IF NOT EXISTS idx_lab_rapports_prelevement ON lab_rapports(prelevement_id);

-- Trigger update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lab_analyses_updated_at 
  BEFORE UPDATE ON lab_analyses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_rapports_updated_at 
  BEFORE UPDATE ON lab_rapports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE lab_analyses IS 'Analyses et résultats par prélèvement';
COMMENT ON TABLE lab_rapports IS 'Rapports de laboratoire regroupant des analyses';


