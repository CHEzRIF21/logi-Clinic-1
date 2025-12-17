-- Étendre le workflow des transferts internes (Demande → Validation/Refus → Réception)
-- Objectif métier:
-- - Magasin Gros se ravitaille depuis l'externe (fournisseurs) via les réceptions
-- - Pharmacie / Magasin Détail se ravitaille depuis le Magasin Gros via demandes internes

-- 1) Colonnes supplémentaires pour tracer la réception côté Magasin Détail
ALTER TABLE transferts
ADD COLUMN IF NOT EXISTS date_reception TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS utilisateur_reception_id VARCHAR(100);

-- 2) Étendre la contrainte CHECK sur le statut des transferts
-- Statuts:
-- - en_attente: demande créée par la Pharmacie / Magasin Détail, en attente de décision du Responsable Gros
-- - valide: accepté par Responsable Gros et stock mis à jour (Gros -, Détail +)
-- - refuse: refusé par Responsable Gros (pas de mouvement de stock)
-- - annule: annulé (optionnel, interne)
-- - en_cours: conservé pour compatibilité historique (anciens transferts)
-- - recu: réception confirmée par la Pharmacie / Magasin Détail (accusé de réception)
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  BEGIN
    ALTER TABLE transferts DROP CONSTRAINT IF EXISTS transferts_statut_check;
  EXCEPTION WHEN OTHERS THEN
    -- Ignorer si la contrainte n'existe pas ou si nom différent
    NULL;
  END;

  -- Recréer une contrainte explicite compatible
  BEGIN
    ALTER TABLE transferts
    ADD CONSTRAINT transferts_statut_check
    CHECK (statut IN ('en_attente', 'en_cours', 'valide', 'refuse', 'annule', 'recu'));
  EXCEPTION WHEN OTHERS THEN
    -- Si une contrainte du même nom existe déjà, ignorer
    NULL;
  END;
END $$;

