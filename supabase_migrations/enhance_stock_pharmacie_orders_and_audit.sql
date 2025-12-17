-- Migration: Amélioration Stock (Gros) & Pharmacie (Détail)
-- Objectifs:
-- 1) Flux interne (Pharmacie -> Magasin Gros): demande, validation/refus, partiel, réception (accusé)
-- 2) Flux externe (Magasin Gros -> Fournisseur): commandes fournisseur avec statuts + traçabilité
-- 3) Traçabilité transversale: journal des actions stock (qui/quand/avant/après)
--
-- Compatible avec l'existant: conserve les statuts historiques de `transferts.statut` en français.

-- ============================================
-- A) FLUX INTERNE: TRANSFERTS (DEMANDE INTERNE)
-- ============================================

-- 1) Ajouter les colonnes manquantes (compatibilité avec le code frontend)
ALTER TABLE transferts
ADD COLUMN IF NOT EXISTS motif TEXT,
ADD COLUMN IF NOT EXISTS motif_refus TEXT;

-- 2) Étendre la contrainte CHECK des statuts pour inclure "partiel"
DO $$
BEGIN
  BEGIN
    ALTER TABLE transferts DROP CONSTRAINT IF EXISTS transferts_statut_check;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE transferts
    ADD CONSTRAINT transferts_statut_check
    CHECK (statut IN ('en_attente', 'en_cours', 'valide', 'partiel', 'refuse', 'annule', 'recu'));
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- 3) Ajouter un statut "machine" (exigence cahier des charges) sans casser l'existant
ALTER TABLE transferts
ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50);

DO $$
BEGIN
  -- Définir un défaut si NULL (pour données existantes)
  UPDATE transferts
  SET workflow_status = CASE
    WHEN statut IN ('en_attente', 'en_cours') THEN 'PENDING_VALIDATION'
    WHEN statut IN ('valide', 'partiel') THEN 'APPROVED'
    WHEN statut = 'refuse' THEN 'REJECTED'
    WHEN statut = 'recu' THEN 'COMPLETED'
    ELSE 'PENDING_VALIDATION'
  END
  WHERE workflow_status IS NULL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Contrainte CHECK sur workflow_status
DO $$
BEGIN
  BEGIN
    ALTER TABLE transferts DROP CONSTRAINT IF EXISTS transferts_workflow_status_check;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE transferts
    ADD CONSTRAINT transferts_workflow_status_check
    CHECK (workflow_status IN ('PENDING_VALIDATION', 'APPROVED', 'REJECTED', 'COMPLETED'));
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- 4) Trigger pour synchroniser workflow_status à partir de statut
CREATE OR REPLACE FUNCTION sync_transferts_workflow_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.workflow_status := CASE
    WHEN NEW.statut IN ('en_attente', 'en_cours') THEN 'PENDING_VALIDATION'
    WHEN NEW.statut IN ('valide', 'partiel') THEN 'APPROVED'
    WHEN NEW.statut = 'refuse' THEN 'REJECTED'
    WHEN NEW.statut = 'recu' THEN 'COMPLETED'
    ELSE COALESCE(NEW.workflow_status, 'PENDING_VALIDATION')
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_transferts_workflow_status ON transferts;
CREATE TRIGGER trg_sync_transferts_workflow_status
BEFORE INSERT OR UPDATE OF statut ON transferts
FOR EACH ROW
EXECUTE FUNCTION sync_transferts_workflow_status();

-- ============================================
-- B) TRAÇABILITÉ: JOURNAL D'ACTIONS STOCK
-- ============================================

CREATE TABLE IF NOT EXISTS stock_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- ex: 'transfert', 'commande_fournisseur'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- ex: 'CREATED', 'APPROVED', 'REJECTED', 'RECEIVED', 'STATUS_CHANGED'
  actor_id TEXT NOT NULL, -- auth.uid() ou identifiant applicatif (string)
  old_status TEXT,
  new_status TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_audit_log_entity ON stock_audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_audit_log_actor ON stock_audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_audit_log_created_at ON stock_audit_log(created_at DESC);

-- RLS permissif (aligné avec complete_rls_policies_for_all_tables.sql)
ALTER TABLE stock_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stock_audit_log_authenticated_all ON stock_audit_log;
DROP POLICY IF EXISTS stock_audit_log_anon_all ON stock_audit_log;
CREATE POLICY stock_audit_log_authenticated_all ON stock_audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY stock_audit_log_anon_all ON stock_audit_log FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- C) FLUX EXTERNE: FOURNISSEURS & COMMANDES
-- ============================================

CREATE TABLE IF NOT EXISTS fournisseurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_fournisseurs_updated_at
  BEFORE UPDATE ON fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS commandes_fournisseur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_commande VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES fournisseurs(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  delivery_date_requested DATE,
  notes TEXT,
  pdf_link TEXT,
  created_by TEXT,
  validated_by TEXT,
  validated_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  BEGIN
    ALTER TABLE commandes_fournisseur DROP CONSTRAINT IF EXISTS commandes_fournisseur_status_check;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE commandes_fournisseur
    ADD CONSTRAINT commandes_fournisseur_status_check
    CHECK (status IN ('DRAFT', 'AWAITING_SIGNATURE', 'SENT_TO_SUPPLIER', 'RECEIVED'));
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

CREATE TRIGGER update_commandes_fournisseur_updated_at
  BEFORE UPDATE ON commandes_fournisseur
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS commandes_fournisseur_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID NOT NULL REFERENCES commandes_fournisseur(id) ON DELETE CASCADE,
  medicament_id UUID NOT NULL REFERENCES medicaments(id) ON DELETE RESTRICT,
  quantite INTEGER NOT NULL CHECK (quantite > 0),
  prix_unitaire_estime DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_commandes_fournisseur_lignes_updated_at
  BEFORE UPDATE ON commandes_fournisseur_lignes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_commandes_fournisseur_numero ON commandes_fournisseur(numero_commande);
CREATE INDEX IF NOT EXISTS idx_commandes_fournisseur_status ON commandes_fournisseur(status);
CREATE INDEX IF NOT EXISTS idx_commandes_fournisseur_supplier ON commandes_fournisseur(supplier_id);
CREATE INDEX IF NOT EXISTS idx_commandes_fournisseur_lignes_commande ON commandes_fournisseur_lignes(commande_id);
CREATE INDEX IF NOT EXISTS idx_commandes_fournisseur_lignes_medicament ON commandes_fournisseur_lignes(medicament_id);

-- Génération automatique du numéro de commande
CREATE OR REPLACE FUNCTION generer_numero_commande_fournisseur()
RETURNS TRIGGER AS $$
DECLARE
  annee VARCHAR(4);
  seq_int INTEGER;
BEGIN
  annee := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_commande FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO seq_int
  FROM commandes_fournisseur
  WHERE numero_commande LIKE 'BC-' || annee || '-%';

  NEW.numero_commande := 'BC-' || annee || '-' || LPAD(seq_int::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generer_numero_commande_fournisseur ON commandes_fournisseur;
CREATE TRIGGER trg_generer_numero_commande_fournisseur
BEFORE INSERT ON commandes_fournisseur
FOR EACH ROW
WHEN (NEW.numero_commande IS NULL OR NEW.numero_commande = '')
EXECUTE FUNCTION generer_numero_commande_fournisseur();

-- RLS permissif (aligné avec complete_rls_policies_for_all_tables.sql)
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fournisseurs_authenticated_all ON fournisseurs;
DROP POLICY IF EXISTS fournisseurs_anon_all ON fournisseurs;
CREATE POLICY fournisseurs_authenticated_all ON fournisseurs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY fournisseurs_anon_all ON fournisseurs FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE commandes_fournisseur ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commandes_fournisseur_authenticated_all ON commandes_fournisseur;
DROP POLICY IF EXISTS commandes_fournisseur_anon_all ON commandes_fournisseur;
CREATE POLICY commandes_fournisseur_authenticated_all ON commandes_fournisseur FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY commandes_fournisseur_anon_all ON commandes_fournisseur FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE commandes_fournisseur_lignes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commandes_fournisseur_lignes_authenticated_all ON commandes_fournisseur_lignes;
DROP POLICY IF EXISTS commandes_fournisseur_lignes_anon_all ON commandes_fournisseur_lignes;
CREATE POLICY commandes_fournisseur_lignes_authenticated_all ON commandes_fournisseur_lignes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY commandes_fournisseur_lignes_anon_all ON commandes_fournisseur_lignes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Message de succès
SELECT 'Migration Stock/Pharmacie (transferts + fournisseurs + commandes + audit) appliquée avec succès.' as status;

