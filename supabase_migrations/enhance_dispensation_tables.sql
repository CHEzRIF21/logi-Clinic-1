-- Migration: Amélioration des tables de dispensation selon le cahier des charges
-- Date: 2025-01-XX
-- Description: Ajout des champs nécessaires pour la traçabilité complète des dispensations

-- 1. Améliorer la table dispensations
ALTER TABLE dispensations
ADD COLUMN IF NOT EXISTS prescripteur_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS prescripteur_nom VARCHAR(200),
ADD COLUMN IF NOT EXISTS service_prescripteur VARCHAR(100),
ADD COLUMN IF NOT EXISTS statut_prise_charge VARCHAR(50),
ADD COLUMN IF NOT EXISTS consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL;

-- Modifier le type de statut pour inclure les nouveaux statuts
ALTER TABLE dispensations
DROP CONSTRAINT IF EXISTS dispensations_statut_check;

ALTER TABLE dispensations
ADD CONSTRAINT dispensations_statut_check 
CHECK (statut IN ('en_cours', 'terminee', 'annulee', 'validee'));

-- 2. Améliorer la table dispensation_lignes
ALTER TABLE dispensation_lignes
ADD COLUMN IF NOT EXISTS quantite_prescite INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantite_delivree INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS numero_lot VARCHAR(100),
ADD COLUMN IF NOT EXISTS date_expiration DATE,
ADD COLUMN IF NOT EXISTS statut VARCHAR(30) CHECK (statut IN ('delivre', 'partiellement_delivre', 'substitution', 'rupture')) DEFAULT 'delivre',
ADD COLUMN IF NOT EXISTS medicament_substitue_id UUID REFERENCES medicaments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS observations TEXT,
ADD COLUMN IF NOT EXISTS prescription_line_id UUID;

-- Mettre à jour quantite_delivree pour être égal à quantite par défaut
UPDATE dispensation_lignes
SET quantite_delivree = quantite
WHERE quantite_delivree = 0;

-- 3. Créer une fonction pour générer le numéro de dispensation
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

-- Trigger pour générer automatiquement le numéro de dispensation
DROP TRIGGER IF EXISTS trigger_generer_numero_dispensation ON dispensations;
CREATE TRIGGER trigger_generer_numero_dispensation
BEFORE INSERT ON dispensations
FOR EACH ROW
WHEN (NEW.numero_dispensation IS NULL OR NEW.numero_dispensation = '')
EXECUTE FUNCTION generer_numero_dispensation();

-- 4. Créer une table pour l'audit des dispensations
CREATE TABLE IF NOT EXISTS dispensation_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispensation_id UUID NOT NULL REFERENCES dispensations(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('creation', 'modification', 'validation', 'annulation')),
  utilisateur_id VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_dispensation_lignes_statut ON dispensation_lignes(statut);
CREATE INDEX IF NOT EXISTS idx_dispensation_lignes_prescription_line ON dispensation_lignes(prescription_line_id);
CREATE INDEX IF NOT EXISTS idx_dispensations_consultation ON dispensations(consultation_id);
CREATE INDEX IF NOT EXISTS idx_dispensations_prescripteur ON dispensations(prescripteur_id);
CREATE INDEX IF NOT EXISTS idx_dispensation_audit_dispensation ON dispensation_audit(dispensation_id);

-- Commentaires
COMMENT ON COLUMN dispensation_lignes.quantite_prescite IS 'Quantité prescrite dans la prescription médicale';
COMMENT ON COLUMN dispensation_lignes.quantite_delivree IS 'Quantité réellement délivrée au patient';
COMMENT ON COLUMN dispensation_lignes.statut IS 'Statut de la ligne: delivre, partiellement_delivre, substitution, rupture';
COMMENT ON COLUMN dispensation_lignes.medicament_substitue_id IS 'ID du médicament substitué si statut = substitution';
COMMENT ON COLUMN dispensation_lignes.numero_lot IS 'Numéro de lot pour traçabilité';
COMMENT ON COLUMN dispensation_lignes.date_expiration IS 'Date d''expiration du lot délivré';

-- Vérification
SELECT 'Migration d''amélioration des tables de dispensation appliquée avec succès!' as status;

