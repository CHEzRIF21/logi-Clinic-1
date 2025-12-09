-- Migration: Création des tables du module Facturation
-- Date: 2024-12-20
-- Description: Module complet de facturation avec gestion des factures, paiements, crédits, remises et journal de caisse

-- ============================================
-- 1. TABLE: services_facturables
-- ============================================
-- Catalogue des services et actes facturables
CREATE TABLE IF NOT EXISTS services_facturables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(200) NOT NULL,
  type_service VARCHAR(50) CHECK (type_service IN ('consultation', 'pharmacie', 'laboratoire', 'maternite', 'vaccination', 'imagerie', 'autre')) NOT NULL,
  tarif_base DECIMAL(12, 2) NOT NULL DEFAULT 0,
  unite VARCHAR(20) DEFAULT 'unité',
  description TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TABLE: factures
-- ============================================
-- Table principale des factures
CREATE TABLE IF NOT EXISTS factures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_facture VARCHAR(50) UNIQUE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  date_facture TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  date_echeance TIMESTAMP WITH TIME ZONE,
  
  -- Montants
  montant_ht DECIMAL(12, 2) NOT NULL DEFAULT 0,
  montant_tva DECIMAL(12, 2) DEFAULT 0,
  montant_remise DECIMAL(12, 2) DEFAULT 0,
  montant_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  montant_paye DECIMAL(12, 2) DEFAULT 0,
  montant_restant DECIMAL(12, 2) NOT NULL DEFAULT 0,
  
  -- Statut et type
  statut VARCHAR(20) CHECK (statut IN ('brouillon', 'en_attente', 'payee', 'partiellement_payee', 'en_credit', 'annulee', 'exoneree')) DEFAULT 'brouillon',
  type_facture VARCHAR(20) CHECK (type_facture IN ('normale', 'credit', 'avoir')) DEFAULT 'normale',
  
  -- Informations fiscales (pour conformité DGI)
  numero_fiscal VARCHAR(50),
  qr_code TEXT,
  identifiant_contribuable VARCHAR(50),
  
  -- Références
  consultation_id UUID,
  service_origine VARCHAR(50), -- consultation, pharmacie, laboratoire, etc.
  reference_externe VARCHAR(100),
  
  -- Métadonnées
  caissier_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TABLE: lignes_facture
-- ============================================
-- Lignes détaillées de chaque facture
CREATE TABLE IF NOT EXISTS lignes_facture (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID REFERENCES factures(id) ON DELETE CASCADE NOT NULL,
  service_facturable_id UUID REFERENCES services_facturables(id),
  code_service VARCHAR(50),
  libelle VARCHAR(200) NOT NULL,
  quantite DECIMAL(10, 2) DEFAULT 1,
  prix_unitaire DECIMAL(12, 2) NOT NULL,
  remise_ligne DECIMAL(12, 2) DEFAULT 0,
  montant_ligne DECIMAL(12, 2) NOT NULL,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. TABLE: paiements
-- ============================================
-- Enregistrement des paiements
CREATE TABLE IF NOT EXISTS paiements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID REFERENCES factures(id) ON DELETE CASCADE NOT NULL,
  numero_paiement VARCHAR(50) UNIQUE NOT NULL,
  date_paiement TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  montant DECIMAL(12, 2) NOT NULL,
  mode_paiement VARCHAR(30) CHECK (mode_paiement IN ('especes', 'mobile_money', 'carte_bancaire', 'virement', 'cheque', 'prise_en_charge')) NOT NULL,
  
  -- Détails selon le mode de paiement
  numero_transaction VARCHAR(100), -- Pour mobile money, virement, etc.
  banque VARCHAR(100), -- Pour virement, chèque
  numero_cheque VARCHAR(50), -- Pour chèque
  reference_prise_en_charge VARCHAR(100), -- Pour prise en charge
  
  -- Métadonnées
  caissier_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. TABLE: remises_exonerations
-- ============================================
-- Gestion des remises et exonérations
CREATE TABLE IF NOT EXISTS remises_exonerations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID REFERENCES factures(id) ON DELETE CASCADE,
  type_remise VARCHAR(30) CHECK (type_remise IN ('pourcentage', 'montant_fixe', 'exoneration_totale')) NOT NULL,
  valeur DECIMAL(12, 2) NOT NULL, -- Pourcentage ou montant
  motif VARCHAR(200) NOT NULL,
  categorie_beneficiaire VARCHAR(50), -- etudiant, personnel, promotion, etc.
  autorise_par UUID, -- ID de l'utilisateur qui a autorisé
  date_application TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. TABLE: credits_facturation
-- ============================================
-- Gestion des factures à crédit
CREATE TABLE IF NOT EXISTS credits_facturation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID REFERENCES factures(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id),
  partenaire_id UUID, -- Entreprise, assurance, etc.
  type_partenaire VARCHAR(50), -- entreprise, assurance, autre
  nom_partenaire VARCHAR(200),
  montant_credit DECIMAL(12, 2) NOT NULL,
  date_echeance TIMESTAMP WITH TIME ZONE,
  statut VARCHAR(20) CHECK (statut IN ('en_attente', 'partiellement_paye', 'paye', 'impaye')) DEFAULT 'en_attente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. TABLE: journal_caisse
-- ============================================
-- Journal de caisse pour suivi quotidien
CREATE TABLE IF NOT EXISTS journal_caisse (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date_journal DATE NOT NULL,
  caissier_id UUID NOT NULL,
  
  -- Recettes
  recettes_especes DECIMAL(12, 2) DEFAULT 0,
  recettes_mobile_money DECIMAL(12, 2) DEFAULT 0,
  recettes_carte DECIMAL(12, 2) DEFAULT 0,
  recettes_virement DECIMAL(12, 2) DEFAULT 0,
  recettes_autres DECIMAL(12, 2) DEFAULT 0,
  total_recettes DECIMAL(12, 2) DEFAULT 0,
  
  -- Dépenses
  depenses_especes DECIMAL(12, 2) DEFAULT 0,
  depenses_autres DECIMAL(12, 2) DEFAULT 0,
  total_depenses DECIMAL(12, 2) DEFAULT 0,
  
  -- Soldes
  solde_ouverture DECIMAL(12, 2) DEFAULT 0,
  solde_fermeture DECIMAL(12, 2) DEFAULT 0,
  
  -- Métadonnées
  statut VARCHAR(20) CHECK (statut IN ('ouvert', 'ferme', 'cloture')) DEFAULT 'ouvert',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(date_journal, caissier_id)
);

-- ============================================
-- 8. TABLE: tickets_facturation
-- ============================================
-- Tickets générés automatiquement depuis les actes médicaux
CREATE TABLE IF NOT EXISTS tickets_facturation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  service_origine VARCHAR(50) NOT NULL, -- consultation, pharmacie, laboratoire, etc.
  reference_origine UUID, -- ID de la consultation, prescription, etc.
  type_acte VARCHAR(100) NOT NULL,
  montant DECIMAL(12, 2) NOT NULL,
  statut VARCHAR(20) CHECK (statut IN ('en_attente', 'facture', 'annule')) DEFAULT 'en_attente',
  facture_id UUID REFERENCES factures(id) ON DELETE SET NULL,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_facturation TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES pour améliorer les performances
-- ============================================
CREATE INDEX IF NOT EXISTS idx_factures_patient ON factures(patient_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_date ON factures(date_facture);
CREATE INDEX IF NOT EXISTS idx_factures_numero ON factures(numero_facture);
CREATE INDEX IF NOT EXISTS idx_lignes_facture_facture ON lignes_facture(facture_id);
CREATE INDEX IF NOT EXISTS idx_paiements_facture ON paiements(facture_id);
CREATE INDEX IF NOT EXISTS idx_paiements_date ON paiements(date_paiement);
CREATE INDEX IF NOT EXISTS idx_credits_facture ON credits_facturation(facture_id);
CREATE INDEX IF NOT EXISTS idx_credits_patient ON credits_facturation(patient_id);
CREATE INDEX IF NOT EXISTS idx_journal_caisse_date ON journal_caisse(date_journal);
CREATE INDEX IF NOT EXISTS idx_tickets_patient ON tickets_facturation(patient_id);
CREATE INDEX IF NOT EXISTS idx_tickets_statut ON tickets_facturation(statut);
CREATE INDEX IF NOT EXISTS idx_services_type ON services_facturables(type_service);

-- ============================================
-- FONCTIONS SQL pour automatisation
-- ============================================

-- Fonction pour générer automatiquement le numéro de facture
CREATE OR REPLACE FUNCTION generer_numero_facture()
RETURNS TRIGGER AS $$
DECLARE
  annee INTEGER;
  numero_seq INTEGER;
  nouveau_numero VARCHAR(50);
BEGIN
  annee := EXTRACT(YEAR FROM NOW());
  
  -- Récupérer le dernier numéro de la série annuelle
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_facture FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO numero_seq
  FROM factures
  WHERE numero_facture LIKE 'FAC-' || annee || '-%';
  
  nouveau_numero := 'FAC-' || annee || '-' || LPAD(numero_seq::TEXT, 6, '0');
  NEW.numero_facture := nouveau_numero;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le numéro de facture
CREATE TRIGGER trigger_generer_numero_facture
BEFORE INSERT ON factures
FOR EACH ROW
WHEN (NEW.numero_facture IS NULL OR NEW.numero_facture = '')
EXECUTE FUNCTION generer_numero_facture();

-- Fonction pour calculer automatiquement le montant total d'une facture
CREATE OR REPLACE FUNCTION calculer_montant_facture()
RETURNS TRIGGER AS $$
DECLARE
  total_lignes DECIMAL(12, 2);
  total_remises DECIMAL(12, 2);
  montant_ht DECIMAL(12, 2);
BEGIN
  -- Calculer le total des lignes
  SELECT COALESCE(SUM(montant_ligne), 0)
  INTO total_lignes
  FROM lignes_facture
  WHERE facture_id = NEW.id;
  
  -- Calculer le total des remises
  SELECT COALESCE(SUM(
    CASE 
      WHEN type_remise = 'pourcentage' THEN (total_lignes * valeur / 100)
      WHEN type_remise = 'montant_fixe' THEN valeur
      WHEN type_remise = 'exoneration_totale' THEN total_lignes
      ELSE 0
    END
  ), 0)
  INTO total_remises
  FROM remises_exonerations
  WHERE facture_id = NEW.id;
  
  montant_ht := GREATEST(0, total_lignes - total_remises);
  
  -- Mettre à jour la facture
  UPDATE factures
  SET 
    montant_ht = montant_ht,
    montant_remise = total_remises,
    montant_total = montant_ht + COALESCE(montant_tva, 0),
    montant_restant = (montant_ht + COALESCE(montant_tva, 0)) - COALESCE(montant_paye, 0),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour recalculer le montant après modification des lignes
CREATE TRIGGER trigger_calculer_montant_facture
AFTER INSERT OR UPDATE OR DELETE ON lignes_facture
FOR EACH ROW
EXECUTE FUNCTION calculer_montant_facture();

-- Fonction pour mettre à jour le statut de la facture selon les paiements
CREATE OR REPLACE FUNCTION mettre_a_jour_statut_facture()
RETURNS TRIGGER AS $$
DECLARE
  total_paye DECIMAL(12, 2);
  montant_total_facture DECIMAL(12, 2);
  nouveau_statut VARCHAR(20);
BEGIN
  -- Calculer le total payé
  SELECT COALESCE(SUM(montant), 0)
  INTO total_paye
  FROM paiements
  WHERE facture_id = NEW.facture_id;
  
  -- Récupérer le montant total de la facture
  SELECT montant_total
  INTO montant_total_facture
  FROM factures
  WHERE id = NEW.facture_id;
  
  -- Déterminer le nouveau statut
  IF total_paye >= montant_total_facture THEN
    nouveau_statut := 'payee';
  ELSIF total_paye > 0 THEN
    nouveau_statut := 'partiellement_payee';
  ELSE
    nouveau_statut := 'en_attente';
  END IF;
  
  -- Mettre à jour la facture
  UPDATE factures
  SET 
    montant_paye = total_paye,
    montant_restant = montant_total_facture - total_paye,
    statut = nouveau_statut,
    updated_at = NOW()
  WHERE id = NEW.facture_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le statut après paiement
CREATE TRIGGER trigger_mettre_a_jour_statut_facture
AFTER INSERT OR UPDATE OR DELETE ON paiements
FOR EACH ROW
EXECUTE FUNCTION mettre_a_jour_statut_facture();

-- Fonction pour mettre à jour le journal de caisse
CREATE OR REPLACE FUNCTION mettre_a_jour_journal_caisse()
RETURNS TRIGGER AS $$
DECLARE
  date_jour DATE;
  caissier_uuid UUID;
BEGIN
  date_jour := CURRENT_DATE;
  caissier_uuid := NEW.caissier_id;
  
  -- Créer ou mettre à jour le journal du jour
  INSERT INTO journal_caisse (
    date_journal,
    caissier_id,
    recettes_especes,
    recettes_mobile_money,
    recettes_carte,
    recettes_virement,
    total_recettes
  )
  VALUES (
    date_jour,
    caissier_uuid,
    CASE WHEN NEW.mode_paiement = 'especes' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'mobile_money' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'carte_bancaire' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'virement' THEN NEW.montant ELSE 0 END,
    NEW.montant
  )
  ON CONFLICT (date_journal, caissier_id)
  DO UPDATE SET
    recettes_especes = journal_caisse.recettes_especes + CASE WHEN NEW.mode_paiement = 'especes' THEN NEW.montant ELSE 0 END,
    recettes_mobile_money = journal_caisse.recettes_mobile_money + CASE WHEN NEW.mode_paiement = 'mobile_money' THEN NEW.montant ELSE 0 END,
    recettes_carte = journal_caisse.recettes_carte + CASE WHEN NEW.mode_paiement = 'carte_bancaire' THEN NEW.montant ELSE 0 END,
    recettes_virement = journal_caisse.recettes_virement + CASE WHEN NEW.mode_paiement = 'virement' THEN NEW.montant ELSE 0 END,
    total_recettes = journal_caisse.total_recettes + NEW.montant,
    solde_fermeture = journal_caisse.solde_ouverture + journal_caisse.total_recettes + NEW.montant - journal_caisse.total_depenses,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le journal de caisse après paiement
CREATE TRIGGER trigger_mettre_a_jour_journal_caisse
AFTER INSERT ON paiements
FOR EACH ROW
WHEN (NEW.mode_paiement != 'prise_en_charge')
EXECUTE FUNCTION mettre_a_jour_journal_caisse();

-- Fonction pour générer automatiquement un ticket de facturation
CREATE OR REPLACE FUNCTION creer_ticket_facturation(
  p_patient_id UUID,
  p_service_origine VARCHAR(50),
  p_reference_origine UUID,
  p_type_acte VARCHAR(100),
  p_montant DECIMAL(12, 2)
)
RETURNS UUID AS $$
DECLARE
  ticket_id UUID;
BEGIN
  INSERT INTO tickets_facturation (
    patient_id,
    service_origine,
    reference_origine,
    type_acte,
    montant
  )
  VALUES (
    p_patient_id,
    p_service_origine,
    p_reference_origine,
    p_type_acte,
    p_montant
  )
  RETURNING id INTO ticket_id;
  
  RETURN ticket_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VUES pour faciliter les requêtes
-- ============================================

-- Vue récapitulative des factures
CREATE OR REPLACE VIEW vue_factures_recap AS
SELECT 
  f.id,
  f.numero_facture,
  f.date_facture,
  p.nom || ' ' || p.prenom AS patient_nom,
  p.telephone AS patient_telephone,
  f.montant_total,
  f.montant_paye,
  f.montant_restant,
  f.statut,
  f.type_facture,
  COUNT(DISTINCT lf.id) AS nombre_lignes,
  COUNT(DISTINCT p.id) AS nombre_paiements
FROM factures f
LEFT JOIN patients p ON f.patient_id = p.id
LEFT JOIN lignes_facture lf ON f.id = lf.facture_id
LEFT JOIN paiements p ON f.id = p.facture_id
GROUP BY f.id, f.numero_facture, f.date_facture, p.nom, p.prenom, p.telephone, 
         f.montant_total, f.montant_paye, f.montant_restant, f.statut, f.type_facture;

-- Vue des tickets en attente de facturation
CREATE OR REPLACE VIEW vue_tickets_en_attente AS
SELECT 
  t.id,
  t.patient_id,
  p.nom || ' ' || p.prenom AS patient_nom,
  t.service_origine,
  t.type_acte,
  t.montant,
  t.date_creation,
  t.reference_origine
FROM tickets_facturation t
LEFT JOIN patients p ON t.patient_id = p.id
WHERE t.statut = 'en_attente'
ORDER BY t.date_creation DESC;

-- Vue récapitulative du journal de caisse
CREATE OR REPLACE VIEW vue_journal_caisse_recap AS
SELECT 
  jc.date_journal,
  jc.caissier_id,
  jc.total_recettes,
  jc.total_depenses,
  jc.solde_ouverture,
  jc.solde_fermeture,
  COUNT(DISTINCT p.id) AS nombre_paiements,
  COUNT(DISTINCT f.id) AS nombre_factures
FROM journal_caisse jc
LEFT JOIN paiements p ON DATE(p.date_paiement) = jc.date_journal AND p.caissier_id = jc.caissier_id
LEFT JOIN factures f ON DATE(f.date_facture) = jc.date_journal AND f.caissier_id = jc.caissier_id
GROUP BY jc.id, jc.date_journal, jc.caissier_id, jc.total_recettes, 
         jc.total_depenses, jc.solde_ouverture, jc.solde_fermeture;

-- ============================================
-- Données initiales : Services facturables
-- ============================================
INSERT INTO services_facturables (code, nom, type_service, tarif_base, description) VALUES
('CONS-GEN', 'Consultation Générale', 'consultation', 2000, 'Consultation médicale générale'),
('CONS-SPEC', 'Consultation Spécialisée', 'consultation', 5000, 'Consultation avec spécialiste'),
('PHAR-MED', 'Médicament', 'pharmacie', 0, 'Médicament délivré (prix variable)'),
('LAB-NFS', 'Numération Formule Sanguine', 'laboratoire', 3000, 'Analyse NFS complète'),
('LAB-GLY', 'Glycémie', 'laboratoire', 1500, 'Dosage de la glycémie'),
('LAB-CREA', 'Créatinine', 'laboratoire', 2000, 'Dosage de la créatinine'),
('MAT-CPN', 'Consultation Prénatale', 'maternite', 1500, 'Suivi de grossesse'),
('MAT-ACCO', 'Accouchement', 'maternite', 25000, 'Prestation d''accouchement'),
('VAC-BCG', 'Vaccin BCG', 'vaccination', 1000, 'Vaccin contre la tuberculose'),
('VAC-DTP', 'Vaccin DTP', 'vaccination', 1500, 'Vaccin diphtérie-tétanos-coqueluche')
ON CONFLICT (code) DO NOTHING;

