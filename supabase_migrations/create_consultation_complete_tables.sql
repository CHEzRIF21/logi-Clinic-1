-- Migration: Création des tables du module Consultation complet
-- Date: 2025-01-XX
-- Description: Module complet de consultation avec templates, constantes, protocoles, prescriptions, demandes labo/imagerie, historique

-- ============================================
-- 1. TABLE: consultation_templates
-- ============================================
-- Templates de fiches de consultation par spécialité
CREATE TABLE IF NOT EXISTS consultation_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  specialite VARCHAR(100) NOT NULL,
  description TEXT,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb, -- Structure des sections (constantes, anamnese, examens, etc.)
  champs JSONB NOT NULL DEFAULT '[]'::jsonb, -- Champs personnalisés avec validations
  validations JSONB DEFAULT '{}'::jsonb, -- Règles de validation
  actif BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TABLE: consultations
-- ============================================
-- Table principale des consultations
CREATE TABLE IF NOT EXISTS consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES consultation_templates(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- "Médecine générale", "Spécialisée", etc.
  status VARCHAR(20) CHECK (status IN ('EN_COURS', 'CLOTURE', 'ARCHIVE')) DEFAULT 'EN_COURS',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Données de consultation (JSON flexible)
  motifs TEXT[],
  anamnese JSONB DEFAULT '{}'::jsonb,
  examens_cliniques JSONB DEFAULT '{}'::jsonb,
  diagnostics TEXT[],
  traitement_en_cours TEXT,
  
  -- Métadonnées
  notes TEXT,
  prochaine_consultation TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 3. TABLE: consultation_entries
-- ============================================
-- Historique et versioning de chaque modification
CREATE TABLE IF NOT EXISTS consultation_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  section VARCHAR(100) NOT NULL, -- "constantes", "anamnese", "examens_cliniques", "diagnostics", etc.
  data JSONB NOT NULL, -- Données modifiées
  action VARCHAR(50) DEFAULT 'UPDATE', -- CREATE, UPDATE, DELETE
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  annotation TEXT -- Note optionnelle sur la modification
);

-- ============================================
-- 4. TABLE: consultation_constantes
-- ============================================
-- Constantes médicales avec historique
CREATE TABLE IF NOT EXISTS consultation_constantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Constantes vitales
  taille_cm DECIMAL(5, 2), -- Taille en cm
  poids_kg DECIMAL(5, 2), -- Poids en kg
  imc DECIMAL(4, 1), -- IMC calculé automatiquement
  temperature_c DECIMAL(4, 1), -- Température en °C
  pouls_bpm INTEGER, -- Pouls en BPM
  ta_bras_gauche_systolique INTEGER, -- Tension artérielle systolique bras gauche
  ta_bras_gauche_diastolique INTEGER, -- Tension artérielle diastolique bras gauche
  ta_bras_droit_systolique INTEGER, -- Tension artérielle systolique bras droit
  ta_bras_droit_diastolique INTEGER, -- Tension artérielle diastolique bras droit
  hauteur_uterine DECIMAL(5, 2), -- Hauteur utérine (pour maternité)
  
  -- Métadonnées
  synced_to_patient BOOLEAN DEFAULT false, -- Si synchronisé au dossier patient
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. TABLE: protocols
-- ============================================
-- Protocoles de soins (médicaments, consommables, actes)
CREATE TABLE IF NOT EXISTS protocols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  admission_type VARCHAR(50) NOT NULL, -- "SOINS_DOMICILE", "AMBULATOIRE", "OBSERVATION", "HOSPITALISATION"
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{type: "medicament|consommable|acte", produit_id, qty, mode_admin, pharmacie_source, etc.}]
  instructions TEXT, -- Instructions de suivi
  horaires JSONB DEFAULT '[]'::jsonb, -- [{heure: "08:00", dosage, repetition}]
  
  -- Facturation
  facturable BOOLEAN DEFAULT false,
  operation_id UUID, -- Lien vers operation facturable si créée
  
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. TABLE: prescriptions
-- ============================================
-- Prescriptions médicales
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  numero_prescription VARCHAR(50) UNIQUE,
  date_prescription TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Statut de dispensation
  statut VARCHAR(20) CHECK (statut IN ('PRESCRIT', 'PARTIELLEMENT_DISPENSE', 'DISPENSE', 'ANNULE')) DEFAULT 'PRESCRIT',
  date_dispensation TIMESTAMP WITH TIME ZONE,
  pharmacien_id UUID,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. TABLE: prescription_lines
-- ============================================
-- Lignes de prescription (médicaments)
CREATE TABLE IF NOT EXISTS prescription_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  
  medicament_id UUID, -- Référence vers produit/médicament
  nom_medicament VARCHAR(200) NOT NULL,
  posologie TEXT NOT NULL,
  quantite_totale INTEGER NOT NULL,
  duree_jours INTEGER,
  mode_administration VARCHAR(100), -- "orale", "injection", etc.
  instructions TEXT,
  
  -- Dispensation
  quantite_dispensee INTEGER DEFAULT 0,
  date_dispensation TIMESTAMP WITH TIME ZONE,
  
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. TABLE: lab_requests
-- ============================================
-- Demandes d'analyses biologiques
CREATE TABLE IF NOT EXISTS lab_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  type VARCHAR(20) CHECK (type IN ('INTERNE', 'EXTERNE')) NOT NULL,
  clinical_info TEXT NOT NULL, -- Renseignement clinique obligatoire
  tests JSONB NOT NULL DEFAULT '[]'::jsonb, -- Liste des examens demandés
  
  status VARCHAR(20) CHECK (status IN ('EN_ATTENTE', 'EN_COURS', 'RENDU', 'ANNULE')) DEFAULT 'EN_ATTENTE',
  date_prelevement TIMESTAMP WITH TIME ZONE,
  date_rendu TIMESTAMP WITH TIME ZONE,
  
  -- Facturation
  facturable BOOLEAN DEFAULT false,
  operation_id UUID,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. TABLE: imaging_requests
-- ============================================
-- Demandes d'examens d'imagerie
CREATE TABLE IF NOT EXISTS imaging_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  type VARCHAR(20) CHECK (type IN ('INTERNE', 'EXTERNE')) NOT NULL,
  clinical_info TEXT NOT NULL, -- Renseignement clinique obligatoire
  examens JSONB NOT NULL DEFAULT '[]'::jsonb, -- Liste des examens d'imagerie
  
  status VARCHAR(20) CHECK (status IN ('EN_ATTENTE', 'EN_COURS', 'RENDU', 'ANNULE')) DEFAULT 'EN_ATTENTE',
  date_examen TIMESTAMP WITH TIME ZONE,
  date_rendu TIMESTAMP WITH TIME ZONE,
  
  -- Facturation
  facturable BOOLEAN DEFAULT false,
  operation_id UUID,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES pour améliorer les performances
-- ============================================
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_started_at ON consultations(started_at);
CREATE INDEX IF NOT EXISTS idx_consultations_template ON consultations(template_id);
CREATE INDEX IF NOT EXISTS idx_consultations_created_by ON consultations(created_by);

CREATE INDEX IF NOT EXISTS idx_consultation_entries_consultation ON consultation_entries(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_entries_section ON consultation_entries(section);
CREATE INDEX IF NOT EXISTS idx_consultation_entries_created_at ON consultation_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_consultation_constantes_consultation ON consultation_constantes(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_constantes_patient ON consultation_constantes(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_constantes_created_at ON consultation_constantes(created_at);

CREATE INDEX IF NOT EXISTS idx_protocols_consultation ON protocols(consultation_id);
CREATE INDEX IF NOT EXISTS idx_protocols_patient ON protocols(patient_id);

CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_statut ON prescriptions(statut);
CREATE INDEX IF NOT EXISTS idx_prescriptions_numero ON prescriptions(numero_prescription);

CREATE INDEX IF NOT EXISTS idx_prescription_lines_prescription ON prescription_lines(prescription_id);

CREATE INDEX IF NOT EXISTS idx_lab_requests_consultation ON lab_requests(consultation_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_patient ON lab_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_status ON lab_requests(status);

CREATE INDEX IF NOT EXISTS idx_imaging_requests_consultation ON imaging_requests(consultation_id);
CREATE INDEX IF NOT EXISTS idx_imaging_requests_patient ON imaging_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_imaging_requests_status ON imaging_requests(status);

CREATE INDEX IF NOT EXISTS idx_consultation_templates_specialite ON consultation_templates(specialite);
CREATE INDEX IF NOT EXISTS idx_consultation_templates_actif ON consultation_templates(actif);

-- ============================================
-- FONCTIONS SQL pour automatisation
-- ============================================

-- Fonction pour calculer automatiquement l'IMC
CREATE OR REPLACE FUNCTION calculer_imc()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.taille_cm IS NOT NULL AND NEW.poids_kg IS NOT NULL AND NEW.taille_cm > 0 THEN
    NEW.imc := ROUND((NEW.poids_kg / POWER(NEW.taille_cm / 100, 2))::numeric, 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer l'IMC automatiquement
CREATE TRIGGER trigger_calculer_imc
BEFORE INSERT OR UPDATE ON consultation_constantes
FOR EACH ROW
EXECUTE FUNCTION calculer_imc();

-- Fonction pour générer le numéro de prescription
CREATE OR REPLACE FUNCTION generer_numero_prescription()
RETURNS TRIGGER AS $$
DECLARE
  annee INTEGER;
  numero_seq INTEGER;
  nouveau_numero VARCHAR(50);
BEGIN
  annee := EXTRACT(YEAR FROM NOW());
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_prescription FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO numero_seq
  FROM prescriptions
  WHERE numero_prescription LIKE 'PRES-' || annee || '-%';
  
  nouveau_numero := 'PRES-' || annee || '-' || LPAD(numero_seq::TEXT, 6, '0');
  NEW.numero_prescription := nouveau_numero;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le numéro de prescription
CREATE TRIGGER trigger_generer_numero_prescription
BEFORE INSERT ON prescriptions
FOR EACH ROW
WHEN (NEW.numero_prescription IS NULL OR NEW.numero_prescription = '')
EXECUTE FUNCTION generer_numero_prescription();

-- Fonction pour créer une entrée d'historique lors de modification
CREATE OR REPLACE FUNCTION creer_consultation_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Cette fonction sera appelée manuellement depuis l'application
  -- pour créer des entrées d'historique lors des modifications
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_consultations_updated_at
BEFORE UPDATE ON consultations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_constantes_updated_at
BEFORE UPDATE ON consultation_constantes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protocols_updated_at
BEFORE UPDATE ON protocols
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_requests_updated_at
BEFORE UPDATE ON lab_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imaging_requests_updated_at
BEFORE UPDATE ON imaging_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_templates_updated_at
BEFORE UPDATE ON consultation_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Données initiales : Templates de consultation
-- ============================================
INSERT INTO consultation_templates (nom, specialite, description, sections, champs) VALUES
(
  'Consultation Médecine Générale',
  'Médecine générale',
  'Template standard pour consultation de médecine générale',
  '["constantes", "motifs", "anamnese", "examens_cliniques", "diagnostics", "traitement"]'::jsonb,
  '[
    {"section": "constantes", "champs": ["taille", "poids", "temperature", "pouls", "ta"]},
    {"section": "motifs", "type": "array"},
    {"section": "anamnese", "champs": ["histoire_maladie", "antecedents"]},
    {"section": "examens_cliniques", "champs": ["examen_general", "examen_physique"]},
    {"section": "diagnostics", "type": "array"},
    {"section": "traitement", "type": "text"}
  ]'::jsonb
),
(
  'Consultation Maternité',
  'Maternité',
  'Template pour consultation prénatale et suivi de grossesse',
  '["constantes", "motifs", "anamnese", "examens_cliniques", "diagnostics", "traitement"]'::jsonb,
  '[
    {"section": "constantes", "champs": ["taille", "poids", "temperature", "pouls", "ta", "hauteur_uterine"]},
    {"section": "motifs", "type": "array"},
    {"section": "anamnese", "champs": ["histoire_maladie", "antecedents_obstetricaux"]},
    {"section": "examens_cliniques", "champs": ["examen_general", "examen_obstetrical"]},
    {"section": "diagnostics", "type": "array"},
    {"section": "traitement", "type": "text"}
  ]'::jsonb
),
(
  'Consultation Pédiatrie',
  'Pédiatrie',
  'Template pour consultation pédiatrique',
  '["constantes", "motifs", "anamnese", "examens_cliniques", "diagnostics", "traitement"]'::jsonb,
  '[
    {"section": "constantes", "champs": ["taille", "poids", "temperature", "pouls", "ta"]},
    {"section": "motifs", "type": "array"},
    {"section": "anamnese", "champs": ["histoire_maladie", "antecedents_familiaux", "developpement"]},
    {"section": "examens_cliniques", "champs": ["examen_general", "examen_pediatrique"]},
    {"section": "diagnostics", "type": "array"},
    {"section": "traitement", "type": "text"}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 11. TABLE: motifs
-- ============================================
-- Motifs de consultation réutilisables
CREATE TABLE IF NOT EXISTS motifs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label VARCHAR(200) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. TABLE: diagnostics
-- ============================================
-- Diagnostics réutilisables avec codes optionnels
CREATE TABLE IF NOT EXISTS diagnostics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label VARCHAR(200) NOT NULL UNIQUE,
  code VARCHAR(50), -- Code CIM-10 ou autre classification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_motifs_label ON motifs(label);
CREATE INDEX IF NOT EXISTS idx_diagnostics_label ON diagnostics(label);
CREATE INDEX IF NOT EXISTS idx_diagnostics_code ON diagnostics(code);

-- Commentaires sur les tables
COMMENT ON TABLE consultations IS 'Table principale des consultations médicales';
COMMENT ON TABLE consultation_entries IS 'Historique et versioning des modifications de consultation';
COMMENT ON TABLE consultation_constantes IS 'Constantes médicales mesurées pendant la consultation';
COMMENT ON TABLE protocols IS 'Protocoles de soins (médicaments, consommables, actes)';
COMMENT ON TABLE prescriptions IS 'Prescriptions médicales';
COMMENT ON TABLE prescription_lines IS 'Lignes détaillées des prescriptions';
COMMENT ON TABLE lab_requests IS 'Demandes d''analyses biologiques';
COMMENT ON TABLE imaging_requests IS 'Demandes d''examens d''imagerie';
COMMENT ON TABLE consultation_templates IS 'Templates de fiches de consultation par spécialité';
COMMENT ON TABLE motifs IS 'Motifs de consultation réutilisables';
COMMENT ON TABLE diagnostics IS 'Diagnostics réutilisables avec codes optionnels';

