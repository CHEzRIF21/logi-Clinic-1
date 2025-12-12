-- Migration: Tables d'intégration pour le module Laboratoire
-- Date: 2025-01-XX
-- Description: Tables pour les connexions avec Consultation, Facturation, Hospitalisation, Pharmacie et Statistiques

-- 1. Table pour les notifications d'hospitalisation
CREATE TABLE IF NOT EXISTS notifications_hospitalisation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospitalisation_id UUID,
  chambre VARCHAR(50),
  analyse_id UUID REFERENCES lab_analyses(id),
  parametre VARCHAR(150),
  valeur TEXT,
  est_pathologique BOOLEAN DEFAULT false,
  priorite VARCHAR(20) CHECK (priorite IN ('faible','moyenne','haute','critique')) DEFAULT 'moyenne',
  message TEXT NOT NULL,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_lecture TIMESTAMP WITH TIME ZONE,
  lu_par VARCHAR(150),
  statut VARCHAR(20) CHECK (statut IN ('nouvelle','lue','resolue','ignoree')) DEFAULT 'nouvelle',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table pour les commandes d'achats de réactifs
CREATE TABLE IF NOT EXISTS commandes_achats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('reactif_laboratoire','medicament','materiel','autre')),
  service_demandeur VARCHAR(100) NOT NULL,
  medicament_id UUID REFERENCES medicaments(id),
  code_reactif VARCHAR(100),
  libelle VARCHAR(200) NOT NULL,
  quantite_demandee DECIMAL(12,4) NOT NULL,
  quantite_livree DECIMAL(12,4) DEFAULT 0,
  unite VARCHAR(50) NOT NULL,
  raison TEXT,
  priorite VARCHAR(20) CHECK (priorite IN ('basse','normale','haute','urgente')) DEFAULT 'normale',
  statut VARCHAR(20) CHECK (statut IN ('en_attente','approuvee','en_commande','livree','annulee')) DEFAULT 'en_attente',
  date_commande TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_livraison TIMESTAMP WITH TIME ZONE,
  numero_lot VARCHAR(100),
  date_peremption TIMESTAMP WITH TIME ZONE,
  fournisseur VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table pour les liens prescriptions-consultations (amélioration)
-- Ajout d'une colonne consultation_id directement dans lab_prescriptions si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_prescriptions' AND column_name = 'consultation_id'
  ) THEN
    ALTER TABLE lab_prescriptions 
    ADD COLUMN consultation_id UUID REFERENCES consultations(id);
  END IF;
END $$;

-- 4. Table pour les alertes épidémiques
CREATE TABLE IF NOT EXISTS alertes_epidemiques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parametre VARCHAR(150) NOT NULL,
  periode_jours INTEGER DEFAULT 7,
  nombre_cas_actuels INTEGER NOT NULL,
  nombre_cas_precedents INTEGER NOT NULL,
  taux_augmentation DECIMAL(5,2) NOT NULL,
  seuil_alerte DECIMAL(5,2) DEFAULT 50.0,
  statut VARCHAR(20) CHECK (statut IN ('nouvelle','en_cours','resolue','fausse_alerte')) DEFAULT 'nouvelle',
  date_detection TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_resolution TIMESTAMP WITH TIME ZONE,
  resolu_par VARCHAR(150),
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table pour les configurations du module Laboratoire
CREATE TABLE IF NOT EXISTS configurations_laboratoire (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cle VARCHAR(100) UNIQUE NOT NULL,
  valeur TEXT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('boolean','number','string','json')) DEFAULT 'string',
  description TEXT,
  modifiable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_hospitalisation_patient ON notifications_hospitalisation(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_hospitalisation_statut ON notifications_hospitalisation(statut);
CREATE INDEX IF NOT EXISTS idx_notifications_hospitalisation_type ON notifications_hospitalisation(type);
CREATE INDEX IF NOT EXISTS idx_commandes_achats_type ON commandes_achats(type);
CREATE INDEX IF NOT EXISTS idx_commandes_achats_statut ON commandes_achats(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_achats_service ON commandes_achats(service_demandeur);
CREATE INDEX IF NOT EXISTS idx_lab_prescriptions_consultation ON lab_prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_alertes_epidemiques_statut ON alertes_epidemiques(statut);
CREATE INDEX IF NOT EXISTS idx_alertes_epidemiques_parametre ON alertes_epidemiques(parametre);

-- S'assurer que la fonction update_updated_at_column existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mise à jour automatique
CREATE TRIGGER update_notifications_hospitalisation_updated_at 
  BEFORE UPDATE ON notifications_hospitalisation 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commandes_achats_updated_at 
  BEFORE UPDATE ON commandes_achats 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alertes_epidemiques_updated_at 
  BEFORE UPDATE ON alertes_epidemiques 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configurations_laboratoire_updated_at 
  BEFORE UPDATE ON configurations_laboratoire 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Données de configuration par défaut
INSERT INTO configurations_laboratoire (cle, valeur, type, description) VALUES
('labo_paiement_obligatoire', 'false', 'boolean', 'Exige le paiement avant prélèvement'),
('labo_notification_urgente', 'true', 'boolean', 'Active les notifications pour résultats urgents'),
('labo_detection_epidemie', 'true', 'boolean', 'Active la détection automatique d''épidémies'),
('labo_seuil_epidemie', '50', 'number', 'Seuil d''augmentation (%) pour alerte épidémique'),
('labo_delai_notification', '30', 'number', 'Délai en minutes avant notification résultat urgent')
ON CONFLICT (cle) DO NOTHING;

-- Vue pour les statistiques d'intégration (corrigée)
CREATE OR REPLACE VIEW v_laboratoire_integrations_stats AS
SELECT 
  (SELECT COUNT(*) FROM lab_prescriptions) as total_prescriptions,
  (SELECT COUNT(*) FROM lab_prescriptions WHERE consultation_id IS NOT NULL) as prescriptions_avec_consultation,
  CASE 
    WHEN (SELECT COUNT(*) FROM lab_prescriptions) > 0 
    THEN (SELECT COUNT(*) FROM lab_prescriptions WHERE consultation_id IS NOT NULL) * 100.0 / (SELECT COUNT(*) FROM lab_prescriptions)
    ELSE 0 
  END as taux_integration_consultation,
  (SELECT COUNT(*) FROM notifications_hospitalisation) as total_notifications_hospitalisation,
  (SELECT COUNT(*) FROM notifications_hospitalisation WHERE statut = 'nouvelle') as notifications_en_attente,
  (SELECT COUNT(*) FROM commandes_achats WHERE type = 'reactif_laboratoire') as total_commandes_reactifs,
  (SELECT COUNT(*) FROM commandes_achats WHERE type = 'reactif_laboratoire' AND statut = 'en_attente') as commandes_en_attente,
  (SELECT COUNT(*) FROM alertes_epidemiques) as total_alertes_epidemiques,
  (SELECT COUNT(*) FROM alertes_epidemiques WHERE statut IN ('nouvelle', 'en_cours')) as alertes_epidemiques_actives;

COMMENT ON TABLE notifications_hospitalisation IS 'Notifications pour les résultats urgents aux patients hospitalisés';
COMMENT ON TABLE commandes_achats IS 'Commandes de réactifs et consommables pour le laboratoire';
COMMENT ON TABLE alertes_epidemiques IS 'Alertes de détection d''épidémies potentielles';
COMMENT ON TABLE configurations_laboratoire IS 'Configurations du module Laboratoire';
COMMENT ON VIEW v_laboratoire_integrations_stats IS 'Statistiques des intégrations du module Laboratoire';

