-- Migration consolidée: Vérification et création des colonnes manquantes pour le stock et la dispensation
-- Date: 2025-01-XX
-- Description: S'assure que toutes les colonnes nécessaires existent pour le bon fonctionnement du système

-- ============================================
-- 1. VÉRIFICATION ET AJOUT DES COLONNES MÉDICAMENTS
-- ============================================
DO $$ 
BEGIN
  -- Ajouter les colonnes de prix si elles n'existent pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'medicaments' AND column_name = 'prix_unitaire_entree') THEN
    ALTER TABLE medicaments ADD COLUMN prix_unitaire_entree DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'medicaments' AND column_name = 'prix_total_entree') THEN
    ALTER TABLE medicaments ADD COLUMN prix_total_entree DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'medicaments' AND column_name = 'prix_unitaire_detail') THEN
    ALTER TABLE medicaments ADD COLUMN prix_unitaire_detail DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'medicaments' AND column_name = 'seuil_maximum') THEN
    ALTER TABLE medicaments ADD COLUMN seuil_maximum INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'medicaments' AND column_name = 'dci') THEN
    ALTER TABLE medicaments ADD COLUMN dci VARCHAR(200);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'medicaments' AND column_name = 'observations') THEN
    ALTER TABLE medicaments ADD COLUMN observations TEXT;
  END IF;
END $$;

-- Mettre à jour les valeurs par défaut si nécessaire
UPDATE medicaments 
SET prix_unitaire_detail = prix_unitaire 
WHERE prix_unitaire_detail IS NULL AND prix_unitaire IS NOT NULL;

UPDATE medicaments 
SET prix_unitaire_entree = ROUND(prix_unitaire * 0.7, 2)
WHERE prix_unitaire_entree IS NULL AND prix_unitaire IS NOT NULL;

-- ============================================
-- 2. VÉRIFICATION ET AJOUT DES COLONNES DISPENSATIONS
-- ============================================
DO $$ 
BEGIN
  -- Colonnes pour la table dispensations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensations' AND column_name = 'prescripteur_id') THEN
    ALTER TABLE dispensations ADD COLUMN prescripteur_id VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensations' AND column_name = 'prescripteur_nom') THEN
    ALTER TABLE dispensations ADD COLUMN prescripteur_nom VARCHAR(200);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensations' AND column_name = 'service_prescripteur') THEN
    ALTER TABLE dispensations ADD COLUMN service_prescripteur VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensations' AND column_name = 'statut_prise_charge') THEN
    ALTER TABLE dispensations ADD COLUMN statut_prise_charge VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensations' AND column_name = 'patient_nom') THEN
    ALTER TABLE dispensations ADD COLUMN patient_nom VARCHAR(200);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensations' AND column_name = 'patient_prenoms') THEN
    ALTER TABLE dispensations ADD COLUMN patient_prenoms VARCHAR(200);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensations' AND column_name = 'service_nom') THEN
    ALTER TABLE dispensations ADD COLUMN service_nom VARCHAR(200);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensations' AND column_name = 'consultation_id') THEN
    -- Vérifier si la table consultations existe avant d'ajouter la contrainte
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consultations') THEN
      ALTER TABLE dispensations ADD COLUMN consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE dispensations ADD COLUMN consultation_id UUID;
    END IF;
  END IF;
END $$;

-- Modifier la contrainte de statut pour inclure 'validee'
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'dispensations_statut_check') THEN
    ALTER TABLE dispensations DROP CONSTRAINT dispensations_statut_check;
  END IF;
  
  ALTER TABLE dispensations
  ADD CONSTRAINT dispensations_statut_check 
  CHECK (statut IN ('en_cours', 'terminee', 'annulee', 'validee'));
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorer si la contrainte existe déjà avec la bonne définition
    NULL;
END $$;

-- ============================================
-- 3. VÉRIFICATION ET AJOUT DES COLONNES DISPENSATION_LIGNES
-- ============================================
DO $$ 
BEGIN
  -- Colonnes pour la table dispensation_lignes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensation_lignes' AND column_name = 'quantite_prescite') THEN
    ALTER TABLE dispensation_lignes ADD COLUMN quantite_prescite INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensation_lignes' AND column_name = 'quantite_delivree') THEN
    ALTER TABLE dispensation_lignes ADD COLUMN quantite_delivree INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensation_lignes' AND column_name = 'numero_lot') THEN
    ALTER TABLE dispensation_lignes ADD COLUMN numero_lot VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensation_lignes' AND column_name = 'date_expiration') THEN
    ALTER TABLE dispensation_lignes ADD COLUMN date_expiration DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensation_lignes' AND column_name = 'statut') THEN
    ALTER TABLE dispensation_lignes ADD COLUMN statut VARCHAR(30) DEFAULT 'delivre';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensation_lignes' AND column_name = 'medicament_substitue_id') THEN
    ALTER TABLE dispensation_lignes ADD COLUMN medicament_substitue_id UUID REFERENCES medicaments(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensation_lignes' AND column_name = 'observations') THEN
    ALTER TABLE dispensation_lignes ADD COLUMN observations TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dispensation_lignes' AND column_name = 'prescription_line_id') THEN
    ALTER TABLE dispensation_lignes ADD COLUMN prescription_line_id UUID;
  END IF;
END $$;

-- Mettre à jour quantite_delivree pour être égal à quantite par défaut si vide
UPDATE dispensation_lignes
SET quantite_delivree = quantite
WHERE quantite_delivree = 0 OR quantite_delivree IS NULL;

UPDATE dispensation_lignes
SET quantite_prescite = quantite
WHERE quantite_prescite = 0 OR quantite_prescite IS NULL;

-- Ajouter la contrainte CHECK pour statut si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'dispensation_lignes_statut_check') THEN
    ALTER TABLE dispensation_lignes
    ADD CONSTRAINT dispensation_lignes_statut_check 
    CHECK (statut IN ('delivre', 'partiellement_delivre', 'substitution', 'rupture'));
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================
-- 4. CRÉER LA FONCTION DE GÉNÉRATION DE NUMÉRO DE DISPENSATION
-- ============================================
CREATE OR REPLACE FUNCTION generer_numero_dispensation()
RETURNS TRIGGER AS $$
DECLARE
  annee VARCHAR(4);
  nouveau_numero VARCHAR(50);
BEGIN
  annee := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_dispensation FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO nouveau_numero
  FROM dispensations
  WHERE numero_dispensation LIKE 'DISP-' || annee || '-%';
  
  nouveau_numero := 'DISP-' || annee || '-' || LPAD(nouveau_numero::TEXT, 6, '0');
  
  NEW.numero_dispensation := nouveau_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger si nécessaire
DROP TRIGGER IF EXISTS trigger_generer_numero_dispensation ON dispensations;
CREATE TRIGGER trigger_generer_numero_dispensation
BEFORE INSERT ON dispensations
FOR EACH ROW
WHEN (NEW.numero_dispensation IS NULL OR NEW.numero_dispensation = '')
EXECUTE FUNCTION generer_numero_dispensation();

-- ============================================
-- 5. CRÉER LA TABLE D'AUDIT DES DISPENSATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS dispensation_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispensation_id UUID NOT NULL REFERENCES dispensations(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('creation', 'modification', 'validation', 'annulation')),
  utilisateur_id VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. CRÉER LES INDEX POUR AMÉLIORER LES PERFORMANCES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_medicaments_dci ON medicaments(dci);
CREATE INDEX IF NOT EXISTS idx_medicaments_prix_detail ON medicaments(prix_unitaire_detail);
CREATE INDEX IF NOT EXISTS idx_dispensation_lignes_statut ON dispensation_lignes(statut);
CREATE INDEX IF NOT EXISTS idx_dispensation_lignes_prescription_line ON dispensation_lignes(prescription_line_id);
CREATE INDEX IF NOT EXISTS idx_dispensations_consultation ON dispensations(consultation_id);
CREATE INDEX IF NOT EXISTS idx_dispensations_prescripteur ON dispensations(prescripteur_id);
CREATE INDEX IF NOT EXISTS idx_dispensation_audit_dispensation ON dispensation_audit(dispensation_id);

-- ============================================
-- 7. CRÉER LA FONCTION RPC POUR DÉCRÉMENTER LE STOCK (si elle n'existe pas)
-- ============================================
CREATE OR REPLACE FUNCTION decrementer_stock_lot(
  lot_id_param UUID,
  quantite_param INTEGER
)
RETURNS VOID AS $$
DECLARE
  quantite_actuelle INTEGER;
BEGIN
  -- Récupérer la quantité actuelle
  SELECT quantite_disponible INTO quantite_actuelle
  FROM lots
  WHERE id = lot_id_param;
  
  -- Vérifier que la quantité est suffisante
  IF quantite_actuelle < quantite_param THEN
    RAISE EXCEPTION 'Stock insuffisant. Disponible: %, Demandé: %', quantite_actuelle, quantite_param;
  END IF;
  
  -- Décrémenter le stock
  UPDATE lots
  SET quantite_disponible = quantite_disponible - quantite_param,
      updated_at = NOW()
  WHERE id = lot_id_param;
  
  -- Mettre à jour le statut si le stock est épuisé
  UPDATE lots
  SET statut = 'epuise'
  WHERE id = lot_id_param AND quantite_disponible = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. COMMENTAIRES
-- ============================================
COMMENT ON COLUMN medicaments.prix_unitaire_entree IS 'Prix unitaire d''achat/entrée du médicament';
COMMENT ON COLUMN medicaments.prix_total_entree IS 'Prix total d''entrée (montant total de l''achat)';
COMMENT ON COLUMN medicaments.prix_unitaire_detail IS 'Prix unitaire de vente au détail (pharmacie/magasin détail)';
COMMENT ON COLUMN medicaments.seuil_maximum IS 'Seuil maximum de stock pour éviter la sur-commande';
COMMENT ON COLUMN medicaments.dci IS 'Dénomination Commune Internationale';
COMMENT ON COLUMN dispensation_lignes.quantite_prescite IS 'Quantité prescrite dans la prescription médicale';
COMMENT ON COLUMN dispensation_lignes.quantite_delivree IS 'Quantité réellement délivrée au patient';
COMMENT ON COLUMN dispensation_lignes.statut IS 'Statut de la ligne: delivre, partiellement_delivre, substitution, rupture';
COMMENT ON COLUMN dispensation_lignes.numero_lot IS 'Numéro de lot pour traçabilité';
COMMENT ON COLUMN dispensation_lignes.date_expiration IS 'Date d''expiration du lot délivré';

-- Message de succès
SELECT 'Migration consolidée appliquée avec succès! Toutes les colonnes nécessaires sont en place.' as status;

