-- Migration pour corriger la contrainte unique sur la table lots
-- La contrainte doit inclure le magasin pour permettre qu'un même lot 
-- existe dans les deux magasins (gros et détail)

-- 1. Supprimer l'ancienne contrainte unique
ALTER TABLE lots 
DROP CONSTRAINT IF EXISTS lots_medicament_id_numero_lot_key;

-- 2. Ajouter la nouvelle contrainte unique incluant le magasin
ALTER TABLE lots 
ADD CONSTRAINT lots_medicament_id_numero_lot_magasin_key 
UNIQUE (medicament_id, numero_lot, magasin);

-- 3. Créer un index pour améliorer les performances des recherches
CREATE INDEX IF NOT EXISTS idx_lots_medicament_numero_magasin 
ON lots(medicament_id, numero_lot, magasin);

-- Note: Cette migration permet maintenant d'avoir le même numéro de lot
-- pour un médicament dans les deux magasins (gros et détail),
-- ce qui correspond au flux métier des transferts internes.
