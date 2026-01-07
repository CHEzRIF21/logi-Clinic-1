-- ============================================
-- Migration 38: Processus de Paiement Obligatoire Avant Consultation
-- Date: 2024-12-20
-- Description: Intégration du processus de paiement obligatoire avec facturation initiale automatique
-- ============================================

-- ============================================
-- 1. TABLE: configurations_facturation
-- ============================================
-- Configuration des paramètres de facturation par clinique
CREATE TABLE IF NOT EXISTS configurations_facturation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Paramètres principaux
  paiement_obligatoire_avant_consultation BOOLEAN DEFAULT false,
  blocage_automatique_impaye BOOLEAN DEFAULT true,
  paiement_plusieurs_temps BOOLEAN DEFAULT true,
  exception_urgence_medecin BOOLEAN DEFAULT true,
  
  -- Actes par défaut (JSONB pour flexibilité)
  actes_defaut_consultation JSONB DEFAULT '[]'::jsonb, -- Liste des codes d'actes par défaut
  actes_defaut_dossier BOOLEAN DEFAULT false, -- Inclure dossier/fiche par défaut
  actes_defaut_urgence BOOLEAN DEFAULT true, -- Inclure urgence si cochée
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(clinic_id)
);

CREATE INDEX IF NOT EXISTS idx_config_facturation_clinic ON configurations_facturation(clinic_id);

-- ============================================
-- 2. MODIFICATION TABLE: consultations
-- ============================================
-- Ajout des colonnes pour gestion du paiement

-- Colonne statut_paiement
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' AND column_name = 'statut_paiement'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN statut_paiement VARCHAR(20) CHECK (statut_paiement IN ('non_facture', 'en_attente', 'paye', 'exonere', 'urgence_autorisee')) 
    DEFAULT 'non_facture';
  END IF;
END $$;

-- Colonne facture_initial_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' AND column_name = 'facture_initial_id'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN facture_initial_id UUID REFERENCES factures(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Colonne type_consultation (si n'existe pas déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' AND column_name = 'type_consultation'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN type_consultation VARCHAR(50) CHECK (type_consultation IN ('generale', 'specialisee', 'urgence'));
  END IF;
END $$;

-- Colonne service_consulte
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consultations' AND column_name = 'service_consulte'
  ) THEN
    ALTER TABLE consultations 
    ADD COLUMN service_consulte VARCHAR(100);
  END IF;
END $$;

-- Index sur statut_paiement
CREATE INDEX IF NOT EXISTS idx_consultations_statut_paiement ON consultations(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_consultations_facture_initial ON consultations(facture_initial_id);

-- ============================================
-- 3. MODIFICATION TABLE: factures
-- ============================================
-- Ajout des colonnes pour distinguer factures initiales et complémentaires

-- Colonne type_facture_detail (initiale/complementaire)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'factures' AND column_name = 'type_facture_detail'
  ) THEN
    ALTER TABLE factures 
    ADD COLUMN type_facture_detail VARCHAR(20) CHECK (type_facture_detail IN ('initiale', 'complementaire'));
  END IF;
END $$;

-- Colonne bloque_consultation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'factures' AND column_name = 'bloque_consultation'
  ) THEN
    ALTER TABLE factures 
    ADD COLUMN bloque_consultation BOOLEAN DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_factures_type_detail ON factures(type_facture_detail);
CREATE INDEX IF NOT EXISTS idx_factures_bloque_consultation ON factures(bloque_consultation);

-- ============================================
-- 4. FONCTION: Vérification Statut Paiement Consultation
-- ============================================
CREATE OR REPLACE FUNCTION check_consultation_payment_status(p_consultation_id UUID)
RETURNS TABLE (
  statut_paiement VARCHAR(20),
  peut_consulter BOOLEAN,
  message TEXT,
  facture_id UUID,
  montant_restant DECIMAL(12,2)
) AS $$
DECLARE
  v_statut VARCHAR(20);
  v_facture_id UUID;
  v_config_obligatoire BOOLEAN;
  v_clinic_id UUID;
  v_montant_restant DECIMAL(12,2);
BEGIN
  -- Récupérer le statut et la facture de la consultation
  SELECT c.statut_paiement, c.facture_initial_id, c.clinic_id
  INTO v_statut, v_facture_id, v_clinic_id
  FROM consultations c
  WHERE c.id = p_consultation_id;
  
  IF v_statut IS NULL THEN
    RETURN QUERY SELECT 
      'non_facture'::VARCHAR(20),
      true::BOOLEAN,
      'Consultation introuvable'::TEXT,
      NULL::UUID,
      0::DECIMAL(12,2);
    RETURN;
  END IF;
  
  -- Récupérer la configuration de la clinique
  SELECT paiement_obligatoire_avant_consultation
  INTO v_config_obligatoire
  FROM configurations_facturation
  WHERE clinic_id = v_clinic_id;
  
  -- Si paiement non obligatoire, tout est autorisé
  IF v_config_obligatoire IS FALSE OR v_config_obligatoire IS NULL THEN
    RETURN QUERY SELECT 
      v_statut,
      true::BOOLEAN,
      'Paiement non obligatoire pour cette clinique'::TEXT,
      v_facture_id,
      0::DECIMAL(12,2);
    RETURN;
  END IF;
  
  -- Calculer le montant restant si facture existe
  IF v_facture_id IS NOT NULL THEN
    SELECT montant_restant INTO v_montant_restant
    FROM factures
    WHERE id = v_facture_id;
  ELSE
    v_montant_restant := 0;
  END IF;
  
  -- Vérifier le statut
  CASE v_statut
    WHEN 'paye' THEN
      RETURN QUERY SELECT 
        v_statut,
        true::BOOLEAN,
        'Consultation payée - Accès autorisé'::TEXT,
        v_facture_id,
        v_montant_restant;
    WHEN 'exonere' THEN
      RETURN QUERY SELECT 
        v_statut,
        true::BOOLEAN,
        'Consultation exonérée - Accès autorisé'::TEXT,
        v_facture_id,
        v_montant_restant;
    WHEN 'urgence_autorisee' THEN
      RETURN QUERY SELECT 
        v_statut,
        true::BOOLEAN,
        'Consultation urgence autorisée par médecin'::TEXT,
        v_facture_id,
        v_montant_restant;
    WHEN 'en_attente' THEN
      RETURN QUERY SELECT 
        v_statut,
        false::BOOLEAN,
        'Paiement en attente - Consultation bloquée'::TEXT,
        v_facture_id,
        v_montant_restant;
    ELSE -- 'non_facture'
      RETURN QUERY SELECT 
        v_statut,
        false::BOOLEAN,
        'Facture non générée ou paiement requis'::TEXT,
        v_facture_id,
        v_montant_restant;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. TRIGGER: Mise à jour statut consultation après paiement
-- ============================================
CREATE OR REPLACE FUNCTION update_consultation_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_facture_id UUID;
  v_statut_facture VARCHAR(20);
  v_montant_restant DECIMAL(12,2);
  v_consultation_id UUID;
BEGIN
  -- Récupérer l'ID de la facture
  v_facture_id := NEW.facture_id;
  
  -- Récupérer le statut et montant restant de la facture
  SELECT statut, montant_restant, consultation_id
  INTO v_statut_facture, v_montant_restant, v_consultation_id
  FROM factures
  WHERE id = v_facture_id;
  
  -- Si la facture est liée à une consultation et bloque la consultation
  IF v_consultation_id IS NOT NULL THEN
    -- Mettre à jour le statut de paiement de la consultation
    IF v_statut_facture = 'payee' AND v_montant_restant <= 0 THEN
      UPDATE consultations
      SET statut_paiement = 'paye',
          updated_at = NOW()
      WHERE id = v_consultation_id;
    ELSIF v_statut_facture = 'partiellement_payee' OR v_statut_facture = 'en_attente' THEN
      UPDATE consultations
      SET statut_paiement = 'en_attente',
          updated_at = NOW()
      WHERE id = v_consultation_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger si n'existe pas déjà
DROP TRIGGER IF EXISTS trigger_update_consultation_payment_status ON paiements;
CREATE TRIGGER trigger_update_consultation_payment_status
AFTER INSERT OR UPDATE ON paiements
FOR EACH ROW
EXECUTE FUNCTION update_consultation_payment_status();

-- Trigger également sur mise à jour de facture
CREATE OR REPLACE FUNCTION update_consultation_from_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_consultation_id UUID;
BEGIN
  -- Si la facture est liée à une consultation
  IF NEW.consultation_id IS NOT NULL THEN
    v_consultation_id := NEW.consultation_id;
    
    -- Mettre à jour le statut selon le statut de la facture
    IF NEW.statut = 'payee' AND NEW.montant_restant <= 0 THEN
      UPDATE consultations
      SET statut_paiement = 'paye',
          updated_at = NOW()
      WHERE id = v_consultation_id;
    ELSIF NEW.statut IN ('partiellement_payee', 'en_attente') THEN
      UPDATE consultations
      SET statut_paiement = 'en_attente',
          updated_at = NOW()
      WHERE id = v_consultation_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_consultation_from_invoice ON factures;
CREATE TRIGGER trigger_update_consultation_from_invoice
AFTER UPDATE OF statut, montant_restant ON factures
FOR EACH ROW
WHEN (NEW.consultation_id IS NOT NULL)
EXECUTE FUNCTION update_consultation_from_invoice();

-- ============================================
-- 6. FONCTION: Créer facture initiale automatique
-- ============================================
CREATE OR REPLACE FUNCTION create_initial_invoice_for_consultation(
  p_consultation_id UUID,
  p_patient_id UUID,
  p_clinic_id UUID,
  p_type_consultation VARCHAR(50),
  p_is_urgent BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_facture_id UUID;
  v_config configurations_facturation%ROWTYPE;
  v_service_code VARCHAR(50);
  v_service_tarif DECIMAL(12,2);
  v_montant_total DECIMAL(12,2) := 0;
  v_numero_facture VARCHAR(50);
  v_acte_record RECORD;
BEGIN
  -- Récupérer la configuration de la clinique
  SELECT * INTO v_config
  FROM configurations_facturation
  WHERE clinic_id = p_clinic_id;
  
  -- Si pas de configuration ou paiement non obligatoire, retourner NULL
  IF v_config.id IS NULL OR v_config.paiement_obligatoire_avant_consultation = false THEN
    RETURN NULL;
  END IF;
  
  -- Générer le numéro de facture
  SELECT 'FAC-' || EXTRACT(YEAR FROM NOW()) || '-' || 
         LPAD((COALESCE(MAX(CAST(SUBSTRING(numero_facture FROM '[0-9]+$') AS INTEGER)), 0) + 1)::TEXT, 6, '0')
  INTO v_numero_facture
  FROM factures
  WHERE numero_facture LIKE 'FAC-' || EXTRACT(YEAR FROM NOW()) || '-%';
  
  -- Calculer le montant selon le type de consultation
  CASE p_type_consultation
    WHEN 'generale' THEN
      SELECT code, tarif_base INTO v_service_code, v_service_tarif
      FROM services_facturables
      WHERE code = 'CONS-GEN' AND actif = true
      LIMIT 1;
    WHEN 'specialisee' THEN
      SELECT code, tarif_base INTO v_service_code, v_service_tarif
      FROM services_facturables
      WHERE code = 'CONS-SPEC' AND actif = true
      LIMIT 1;
    WHEN 'urgence' THEN
      SELECT code, tarif_base INTO v_service_code, v_service_tarif
      FROM services_facturables
      WHERE code = 'CONS-URG' AND actif = true
      LIMIT 1;
    ELSE
      SELECT code, tarif_base INTO v_service_code, v_service_tarif
      FROM services_facturables
      WHERE code = 'CONS-GEN' AND actif = true
      LIMIT 1;
  END CASE;
  
  -- Si service trouvé, ajouter au total
  IF v_service_tarif IS NOT NULL THEN
    v_montant_total := v_montant_total + v_service_tarif;
  END IF;
  
  -- Ajouter actes supplémentaires depuis configuration
  FOR v_acte_record IN 
    SELECT jsonb_array_elements_text(v_config.actes_defaut_consultation) AS code_acte
  LOOP
    SELECT tarif_base INTO v_service_tarif
    FROM services_facturables
    WHERE code = v_acte_record.code_acte AND actif = true;
    
    IF v_service_tarif IS NOT NULL THEN
      v_montant_total := v_montant_total + v_service_tarif;
    END IF;
  END LOOP;
  
  -- Créer la facture
  INSERT INTO factures (
    numero_facture,
    patient_id,
    consultation_id,
    montant_total,
    montant_restant,
    statut,
    type_facture_detail,
    bloque_consultation,
    service_origine,
    created_at
  ) VALUES (
    v_numero_facture,
    p_patient_id,
    p_consultation_id,
    v_montant_total,
    v_montant_total,
    'en_attente',
    'initiale',
    true,
    'consultation',
    NOW()
  ) RETURNING id INTO v_facture_id;
  
  -- Créer la ligne de facture pour la consultation
  IF v_service_code IS NOT NULL THEN
    INSERT INTO lignes_facture (
      facture_id,
      code_service,
      libelle,
      quantite,
      prix_unitaire,
      montant_ligne
    ) VALUES (
      v_facture_id,
      v_service_code,
      (SELECT nom FROM services_facturables WHERE code = v_service_code),
      1,
      (SELECT tarif_base FROM services_facturables WHERE code = v_service_code),
      (SELECT tarif_base FROM services_facturables WHERE code = v_service_code)
    );
  END IF;
  
  -- Mettre à jour la consultation avec la facture et le statut
  UPDATE consultations
  SET facture_initial_id = v_facture_id,
      statut_paiement = 'en_attente',
      updated_at = NOW()
  WHERE id = p_consultation_id;
  
  RETURN v_facture_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. POLITIQUES RLS (Row Level Security)
-- ============================================
ALTER TABLE configurations_facturation ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir/modifier la config de leur clinique
CREATE POLICY "Users can access billing config of their clinic" ON configurations_facturation
  FOR ALL TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- 8. DONNÉES INITIALES
-- ============================================
-- Insérer les services facturables manquants si nécessaire
INSERT INTO services_facturables (code, nom, type_service, tarif_base, description) VALUES
('CONS-URG', 'Consultation Urgence', 'consultation', 3000, 'Consultation médicale en urgence'),
('DOSSIER', 'Dossier / Fiche Patient', 'consultation', 500, 'Création ou mise à jour du dossier patient')
ON CONFLICT (code) DO NOTHING;

-- Commentaires
COMMENT ON TABLE configurations_facturation IS 'Configuration des paramètres de facturation par clinique';
COMMENT ON FUNCTION check_consultation_payment_status IS 'Vérifie le statut de paiement d''une consultation et retourne si l''accès est autorisé';
COMMENT ON FUNCTION create_initial_invoice_for_consultation IS 'Crée automatiquement une facture initiale pour une consultation selon la configuration de la clinique';

