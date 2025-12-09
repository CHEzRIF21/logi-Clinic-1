-- Migration: Extension du workflow de consultation en 11 étapes
-- Date: 2025-01-XX
-- Description: Extension des tables consultations et création des nouvelles tables pour le workflow détaillé

-- ============================================
-- 1. EXTENSION DE LA TABLE consultations
-- ============================================

-- Ajout colonne categorie_motif si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' AND column_name = 'categorie_motif'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN categorie_motif VARCHAR(20) CHECK (categorie_motif IN ('Routine', 'Urgence', 'Suivi', 'Certificat'));
  END IF;
END $$;

-- Vérifier si traitement_en_cours existe déjà (déjà présent dans la table)
-- Ajout colonne antecedents_consultation pour stocker les antécédents modifiés pendant la consultation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' AND column_name = 'antecedents_consultation'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN antecedents_consultation JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Ajout colonne pour stocker le type de diagnostic (Suspecté/Confirmé)
-- On va stocker cela dans un JSONB diagnostics_detail au lieu d'une colonne séparée
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' AND column_name = 'diagnostics_detail'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN diagnostics_detail JSONB DEFAULT '[]'::jsonb;
    -- Format: [{"code": "A00.0", "libelle": "...", "type": "Suspecté|Confirmé", "principal": true}]
  END IF;
END $$;

-- Ajout colonne spO2 dans consultation_constantes si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultation_constantes' AND column_name = 'spo2'
  ) THEN
    ALTER TABLE consultation_constantes 
    ADD COLUMN spo2 INTEGER CHECK (spo2 >= 0 AND spo2 <= 100);
  END IF;
END $$;

-- ============================================
-- 2. NOUVELLE TABLE: patient_deparasitage
-- ============================================
CREATE TABLE IF NOT EXISTS patient_deparasitage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  molecule VARCHAR(100) NOT NULL,
  date_administration DATE NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_deparasitage_patient ON patient_deparasitage(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_deparasitage_date ON patient_deparasitage(date_administration);

-- ============================================
-- 3. NOUVELLE TABLE: anamnese_templates
-- ============================================
CREATE TABLE IF NOT EXISTS anamnese_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  contenu TEXT NOT NULL,
  categorie VARCHAR(50),
  actif BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamnese_templates_categorie ON anamnese_templates(categorie);
CREATE INDEX IF NOT EXISTS idx_anamnese_templates_actif ON anamnese_templates(actif);

-- ============================================
-- 4. NOUVELLE TABLE: diagnostic_codes (CIM-10)
-- ============================================
CREATE TABLE IF NOT EXISTS diagnostic_codes (
  code VARCHAR(10) PRIMARY KEY,
  libelle VARCHAR(500) NOT NULL,
  categorie VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_codes_categorie ON diagnostic_codes(categorie);
CREATE INDEX IF NOT EXISTS idx_diagnostic_codes_libelle ON diagnostic_codes USING gin(to_tsvector('french', libelle));

-- ============================================
-- 5. TRIGGERS pour mise à jour automatique
-- ============================================

-- Trigger pour patient_deparasitage
CREATE TRIGGER update_patient_deparasitage_updated_at
BEFORE UPDATE ON patient_deparasitage
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour anamnese_templates
CREATE TRIGGER update_anamnese_templates_updated_at
BEFORE UPDATE ON anamnese_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. DONNÉES INITIALES
-- ============================================

-- Templates d'anamnèse par défaut
INSERT INTO anamnese_templates (nom, contenu, categorie) VALUES
('Douleur abdominale', 'Douleur débutant il y a X jours, localisée à [localisation], de type [type], irradiant vers [irradiation]. Intensité [1-10]. Aggravée par [facteurs], soulagée par [facteurs].', 'Douleur'),
('Fièvre et toux', 'Fièvre depuis X jours, associée à une toux [sèche/grasse]. Température maximale [température]°C. Autres symptômes associés : [symptômes].', 'Fièvre'),
('Céphalées', 'Céphalées depuis X jours, de type [pulsatile/lancinante/pression], localisées à [localisation]. Intensité [1-10]. Aggravées par [facteurs], soulagées par [facteurs].', 'Céphalées'),
('Troubles digestifs', 'Troubles digestifs depuis X jours : [nausées/vomissements/diarrhée/constipation]. Fréquence [fréquence]. Facteurs déclenchants : [facteurs].', 'Digestif')
ON CONFLICT DO NOTHING;

-- Codes CIM-10 de base (exemples)
INSERT INTO diagnostic_codes (code, libelle, categorie) VALUES
('A00.0', 'Choléra dû à Vibrio cholerae 01, biovar cholerae', 'Maladies infectieuses'),
('A00.1', 'Choléra dû à Vibrio cholerae 01, biovar eltor', 'Maladies infectieuses'),
('B20', 'Maladie à VIH, maladie virale caractérisée', 'Maladies infectieuses'),
('E10', 'Diabète sucré insulinodépendant', 'Maladies endocriniennes'),
('E11', 'Diabète sucré non insulinodépendant', 'Maladies endocriniennes'),
('I10', 'Hypertension essentielle (primitive)', 'Maladies cardiovasculaires'),
('I20', 'Angine de poitrine', 'Maladies cardiovasculaires'),
('J00', 'Rhinopharyngite aiguë (rhume)', 'Maladies respiratoires'),
('J06', 'Infections aiguës des voies respiratoires supérieures, sites multiples et non précisés', 'Maladies respiratoires'),
('K25', 'Ulcère gastrique', 'Maladies digestives'),
('M79.3', 'Panniculite, sans précision', 'Maladies ostéo-articulaires'),
('N18', 'Insuffisance rénale chronique', 'Maladies rénales'),
('R50', 'Fièvre d''origine inconnue', 'Symptômes généraux'),
('R51', 'Céphalée', 'Symptômes généraux'),
('R06.0', 'Dyspnée', 'Symptômes respiratoires')
ON CONFLICT (code) DO NOTHING;

-- Commentaires
COMMENT ON TABLE patient_deparasitage IS 'Historique des déparasitages des patients';
COMMENT ON TABLE anamnese_templates IS 'Templates de texte pour faciliter la saisie de l''anamnèse';
COMMENT ON TABLE diagnostic_codes IS 'Codes CIM-10 pour les diagnostics médicaux';
COMMENT ON COLUMN consultations.categorie_motif IS 'Catégorie du motif de consultation (Routine, Urgence, Suivi, Certificat)';
COMMENT ON COLUMN consultations.antecedents_consultation IS 'Antécédents modifiés ou complétés pendant la consultation';
COMMENT ON COLUMN consultations.diagnostics_detail IS 'Détails des diagnostics avec type (Suspecté/Confirmé) et code CIM-10';

