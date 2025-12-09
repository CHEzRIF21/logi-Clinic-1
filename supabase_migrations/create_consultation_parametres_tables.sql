-- Migration: Création des tables de paramétrage pour le module Consultation
-- Date: 2025-01-XX
-- Description: Tables pour paramétrer les fiches, médicaments, examens, diagnostics CIM-10, rôles, etc.

-- ============================================
-- A. PARAMÉTRAGE DES FICHES DE CONSULTATION
-- ============================================

-- Table pour les champs personnalisés des fiches
CREATE TABLE IF NOT EXISTS consultation_template_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES consultation_templates(id) ON DELETE CASCADE,
  section VARCHAR(100) NOT NULL, -- "constantes", "anamnese", "examens_cliniques", etc.
  field_key VARCHAR(100) NOT NULL, -- Clé du champ
  field_type VARCHAR(50) NOT NULL, -- "text", "number", "select", "checkbox", "textarea", "date"
  label VARCHAR(200) NOT NULL,
  placeholder TEXT,
  required BOOLEAN DEFAULT false,
  default_value TEXT,
  options JSONB, -- Pour les champs select: [{value: "...", label: "..."}]
  validation_rules JSONB DEFAULT '{}'::jsonb, -- {min, max, pattern, etc.}
  order_index INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, section, field_key)
);

-- Table pour les motifs prédéfinis par fiche
CREATE TABLE IF NOT EXISTS consultation_template_motifs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES consultation_templates(id) ON DELETE CASCADE,
  motif_id UUID REFERENCES motifs(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- B. PARAMÉTRAGE MÉDICAMENTS
-- ============================================

-- Table pour les groupes thérapeutiques
CREATE TABLE IF NOT EXISTS groupes_therapeutiques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les posologies standard (templates)
CREATE TABLE IF NOT EXISTS posologies_standard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medicament_id UUID, -- Référence vers produit/médicament
  nom_template VARCHAR(200) NOT NULL,
  dose VARCHAR(100) NOT NULL, -- "500mg", "1 comprimé", etc.
  frequence VARCHAR(100) NOT NULL, -- "2x/jour", "matin et soir", etc.
  duree_jours INTEGER, -- Durée standard en jours
  mode_administration VARCHAR(100), -- "orale", "injection", etc.
  instructions TEXT,
  indication TEXT, -- Pour quelle indication cette posologie est recommandée
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour le mapping médicament ↔ molécule (pour alertes allergies)
CREATE TABLE IF NOT EXISTS medicament_molecules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medicament_id UUID NOT NULL, -- Référence vers produit/médicament
  molecule VARCHAR(200) NOT NULL, -- Nom de la molécule active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(medicament_id, molecule)
);

-- Table pour les incompatibilités médicamenteuses
CREATE TABLE IF NOT EXISTS incompatibilites_medicamenteuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medicament_1_id UUID NOT NULL,
  medicament_2_id UUID NOT NULL,
  molecule_1 VARCHAR(200),
  molecule_2 VARCHAR(200),
  niveau VARCHAR(50) CHECK (niveau IN ('contre_indication', 'precaution', 'interaction')) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (medicament_1_id != medicament_2_id)
);

-- ============================================
-- C. PARAMÉTRAGE EXAMENS (LABO / IMAGERIE)
-- ============================================

-- Table pour les paramètres d'examens (délais, disponibilité, etc.)
CREATE TABLE IF NOT EXISTS examens_parametres (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  examen_code VARCHAR(100) NOT NULL, -- Code de l'examen (référence vers exam_catalog ou autre)
  examen_type VARCHAR(50) CHECK (examen_type IN ('LABO', 'IMAGERIE')) NOT NULL,
  delai_obtention_heures INTEGER, -- Délai moyen d'obtention en heures
  service_concerné VARCHAR(100), -- Service responsable
  critere_disponibilite JSONB, -- {equipement: "...", horaire: "...", etc.}
  prix DECIMAL(10, 2),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(examen_code, examen_type)
);

-- ============================================
-- D. PARAMÉTRAGE DES DIAGNOSTICS
-- ============================================

-- Table pour la base CIM-10 (codes de diagnostic)
CREATE TABLE IF NOT EXISTS diagnostics_cim10 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL, -- Code CIM-10 (ex: "A00.0")
  libelle VARCHAR(500) NOT NULL,
  chapitre VARCHAR(100), -- Chapitre CIM-10
  sous_chapitre VARCHAR(100),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les diagnostics favoris par utilisateur
CREATE TABLE IF NOT EXISTS diagnostics_favoris (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  diagnostic_id UUID REFERENCES diagnostics(id) ON DELETE CASCADE,
  cim10_code VARCHAR(20) REFERENCES diagnostics_cim10(code) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, COALESCE(diagnostic_id::text, ''), COALESCE(cim10_code, ''))
);

-- Table pour les diagnostics interdits (masqués)
CREATE TABLE IF NOT EXISTS diagnostics_interdits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostic_id UUID REFERENCES diagnostics(id) ON DELETE CASCADE,
  cim10_code VARCHAR(20) REFERENCES diagnostics_cim10(code) ON DELETE CASCADE,
  raison TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- E. PARAMÉTRAGE UTILISATEURS & RÔLES
-- ============================================

-- Table pour les rôles personnalisés (extension des rôles système)
CREATE TABLE IF NOT EXISTS consultation_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_code VARCHAR(50) UNIQUE NOT NULL, -- "medecin", "infirmier", "sage_femme", etc.
  role_label VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}'::jsonb, -- {can_validate: true, can_modify_fiche: true, can_see_sensitive: true}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les permissions par rôle et fiche
CREATE TABLE IF NOT EXISTS consultation_role_template_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES consultation_roles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES consultation_templates(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_modify BOOLEAN DEFAULT false,
  can_validate BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, template_id)
);

-- ============================================
-- F. PARAMÉTRAGE INTÉGRATIONS
-- ============================================

-- Table pour les configurations d'intégration
CREATE TABLE IF NOT EXISTS consultation_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_type VARCHAR(50) NOT NULL, -- "LABO", "PHARMACIE", "CAISSE", "SMS", "WHATSAPP", "PDF"
  config_key VARCHAR(100) NOT NULL,
  config_value TEXT,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integration_type, config_key)
);

-- Table pour les modèles PDF d'impression
CREATE TABLE IF NOT EXISTS consultation_pdf_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- "consultation", "prescription", "ordonnance", "bilan"
  template_content TEXT NOT NULL, -- Contenu HTML/Template
  variables JSONB DEFAULT '{}'::jsonb, -- Variables disponibles dans le template
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- G. PARAMÉTRAGE CONSULTATION
-- ============================================

-- Table pour les paramètres généraux de consultation
CREATE TABLE IF NOT EXISTS consultation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string', -- "string", "boolean", "number", "json"
  description TEXT,
  category VARCHAR(50), -- "general", "workflow", "facturation", "notifications"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_template_fields_template ON consultation_template_fields(template_id);
CREATE INDEX IF NOT EXISTS idx_template_fields_section ON consultation_template_fields(section);
CREATE INDEX IF NOT EXISTS idx_template_motifs_template ON consultation_template_motifs(template_id);
CREATE INDEX IF NOT EXISTS idx_posologies_medicament ON posologies_standard(medicament_id);
CREATE INDEX IF NOT EXISTS idx_medicament_molecules_medicament ON medicament_molecules(medicament_id);
CREATE INDEX IF NOT EXISTS idx_incompatibilites_med1 ON incompatibilites_medicamenteuses(medicament_1_id);
CREATE INDEX IF NOT EXISTS idx_incompatibilites_med2 ON incompatibilites_medicamenteuses(medicament_2_id);
CREATE INDEX IF NOT EXISTS idx_examens_parametres_code ON examens_parametres(examen_code);
CREATE INDEX IF NOT EXISTS idx_diagnostics_cim10_code ON diagnostics_cim10(code);
CREATE INDEX IF NOT EXISTS idx_diagnostics_favoris_user ON diagnostics_favoris(user_id);
CREATE INDEX IF NOT EXISTS idx_role_template_permissions_role ON consultation_role_template_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_template_permissions_template ON consultation_role_template_permissions(template_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON consultation_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_type ON consultation_pdf_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_settings_key ON consultation_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON consultation_settings(category);

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Rôles par défaut
INSERT INTO consultation_roles (role_code, role_label, description, permissions) VALUES
('medecin', 'Médecin', 'Médecin avec accès complet', '{"can_validate": true, "can_modify_fiche": true, "can_see_sensitive": true, "can_create": true, "can_delete": true}'::jsonb),
('infirmier', 'Infirmier', 'Infirmier avec accès limité', '{"can_validate": false, "can_modify_fiche": false, "can_see_sensitive": true, "can_create": false, "can_delete": false}'::jsonb),
('sage_femme', 'Sage-femme', 'Sage-femme avec accès spécialisé', '{"can_validate": true, "can_modify_fiche": true, "can_see_sensitive": true, "can_create": true, "can_delete": false}'::jsonb),
('laborantin', 'Laborantin', 'Laborantin pour examens', '{"can_validate": false, "can_modify_fiche": false, "can_see_sensitive": false, "can_create": false, "can_delete": false}'::jsonb),
('pharmacien', 'Pharmacien', 'Pharmacien pour dispensation', '{"can_validate": false, "can_modify_fiche": false, "can_see_sensitive": false, "can_create": false, "can_delete": false}'::jsonb),
('administrateur', 'Administrateur', 'Administrateur avec tous les droits', '{"can_validate": true, "can_modify_fiche": true, "can_see_sensitive": true, "can_create": true, "can_delete": true}'::jsonb)
ON CONFLICT (role_code) DO NOTHING;

-- Paramètres par défaut
INSERT INTO consultation_settings (setting_key, setting_value, setting_type, description, category) VALUES
('dictee_vocale_active', 'false', 'boolean', 'Activer la dictée vocale', 'general'),
('rdv_automatique_active', 'true', 'boolean', 'Activer la proposition automatique de rendez-vous', 'workflow'),
('alerte_stock_pharmacie', 'true', 'boolean', 'Alerter en cas de rupture de stock', 'notifications'),
('alerte_examen_indisponible', 'true', 'boolean', 'Alerter si examen indisponible', 'notifications'),
('calcul_imc_actif', 'true', 'boolean', 'Calculer automatiquement l''IMC', 'general'),
('champs_obligatoires_motif', 'true', 'boolean', 'Rendre le motif obligatoire', 'workflow'),
('duree_max_consultation_minutes', '60', 'number', 'Durée maximale de consultation en minutes', 'workflow')
ON CONFLICT (setting_key) DO NOTHING;

-- Triggers pour updated_at
CREATE TRIGGER update_template_fields_updated_at
BEFORE UPDATE ON consultation_template_fields
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groupes_therapeutiques_updated_at
BEFORE UPDATE ON groupes_therapeutiques
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posologies_standard_updated_at
BEFORE UPDATE ON posologies_standard
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_examens_parametres_updated_at
BEFORE UPDATE ON examens_parametres
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnostics_cim10_updated_at
BEFORE UPDATE ON diagnostics_cim10
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_roles_updated_at
BEFORE UPDATE ON consultation_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_integrations_updated_at
BEFORE UPDATE ON consultation_integrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_pdf_templates_updated_at
BEFORE UPDATE ON consultation_pdf_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_settings_updated_at
BEFORE UPDATE ON consultation_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE consultation_template_fields IS 'Champs personnalisés pour les fiches de consultation';
COMMENT ON TABLE consultation_template_motifs IS 'Motifs prédéfinis par fiche';
COMMENT ON TABLE groupes_therapeutiques IS 'Groupes thérapeutiques pour classer les médicaments';
COMMENT ON TABLE posologies_standard IS 'Templates de posologies pour médicaments';
COMMENT ON TABLE medicament_molecules IS 'Mapping médicament ↔ molécule pour alertes allergies';
COMMENT ON TABLE incompatibilites_medicamenteuses IS 'Incompatibilités entre médicaments';
COMMENT ON TABLE examens_parametres IS 'Paramètres des examens (délais, disponibilité, prix)';
COMMENT ON TABLE diagnostics_cim10 IS 'Base de codes CIM-10';
COMMENT ON TABLE diagnostics_favoris IS 'Diagnostics favoris par utilisateur';
COMMENT ON TABLE diagnostics_interdits IS 'Diagnostics masqués/interdits';
COMMENT ON TABLE consultation_roles IS 'Rôles personnalisés pour le module consultation';
COMMENT ON TABLE consultation_role_template_permissions IS 'Permissions par rôle et fiche';
COMMENT ON TABLE consultation_integrations IS 'Configurations d''intégration (Labo, Pharmacie, Caisse, SMS, etc.)';
COMMENT ON TABLE consultation_pdf_templates IS 'Modèles PDF pour impression';
COMMENT ON TABLE consultation_settings IS 'Paramètres généraux du module consultation';

