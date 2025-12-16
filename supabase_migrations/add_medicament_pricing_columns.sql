-- Migration: Ajout des colonnes de prix pour les médicaments
-- Date: 2024-12-20
-- Description: Ajout des colonnes pour gérer les prix d'entrée et de détail séparément

-- Ajouter les nouvelles colonnes de prix à la table medicaments
ALTER TABLE medicaments 
ADD COLUMN IF NOT EXISTS prix_unitaire_entree DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_total_entree DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_unitaire_detail DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS seuil_maximum INTEGER,
ADD COLUMN IF NOT EXISTS dci VARCHAR(200),
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Commentaires sur les nouvelles colonnes
COMMENT ON COLUMN medicaments.prix_unitaire_entree IS 'Prix unitaire d''achat/entrée du médicament';
COMMENT ON COLUMN medicaments.prix_total_entree IS 'Prix total d''entrée (montant total de l''achat)';
COMMENT ON COLUMN medicaments.prix_unitaire_detail IS 'Prix unitaire de vente au détail (pharmacie/magasin détail)';
COMMENT ON COLUMN medicaments.seuil_maximum IS 'Seuil maximum de stock pour éviter la sur-commande';
COMMENT ON COLUMN medicaments.dci IS 'Dénomination Commune Internationale';
COMMENT ON COLUMN medicaments.observations IS 'Observations générales sur le médicament';

-- Mettre à jour les valeurs existantes : 
-- Si prix_unitaire_detail n'est pas défini, utiliser prix_unitaire comme valeur par défaut
UPDATE medicaments 
SET prix_unitaire_detail = prix_unitaire 
WHERE prix_unitaire_detail IS NULL;

-- Si prix_unitaire_entree n'est pas défini, calculer 70% du prix_unitaire (marge standard)
UPDATE medicaments 
SET prix_unitaire_entree = ROUND(prix_unitaire * 0.7, 2)
WHERE prix_unitaire_entree IS NULL;

-- Créer un index sur dci pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_medicaments_dci ON medicaments(dci);

-- Créer un index sur prix_unitaire_detail pour les recherches de prix
CREATE INDEX IF NOT EXISTS idx_medicaments_prix_detail ON medicaments(prix_unitaire_detail);

-- Fonction pour calculer automatiquement le prix_total_entree si nécessaire
-- (peut être appelée lors de la création/mise à jour d'un médicament)
CREATE OR REPLACE FUNCTION calculate_prix_total_entree()
RETURNS TRIGGER AS $$
BEGIN
    -- Le prix_total_entree sera calculé lors de la réception des lots
    -- Cette fonction est préparée pour une utilisation future si nécessaire
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Le prix_total_entree sera généralement calculé lors de la réception
-- en multipliant prix_unitaire_entree par la quantité reçue

