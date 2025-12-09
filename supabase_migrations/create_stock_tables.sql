-- Migration: Création des tables de gestion des stocks
-- Date: 2024-12-20
-- Description: Création des tables pour la gestion complète des stocks de médicaments

-- 1. Table des médicaments
CREATE TABLE IF NOT EXISTS medicaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(200) NOT NULL,
  forme VARCHAR(100) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  unite VARCHAR(20) NOT NULL,
  fournisseur VARCHAR(200) NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL DEFAULT 0,
  seuil_alerte INTEGER NOT NULL DEFAULT 10,
  seuil_rupture INTEGER NOT NULL DEFAULT 5,
  emplacement VARCHAR(100),
  categorie VARCHAR(100) NOT NULL,
  prescription_requise BOOLEAN DEFAULT false,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_modification TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des lots
CREATE TABLE IF NOT EXISTS lots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medicament_id UUID NOT NULL REFERENCES medicaments(id) ON DELETE CASCADE,
  numero_lot VARCHAR(100) NOT NULL,
  quantite_initiale INTEGER NOT NULL,
  quantite_disponible INTEGER NOT NULL,
  date_reception DATE NOT NULL,
  date_expiration DATE NOT NULL,
  prix_achat DECIMAL(10,2) NOT NULL,
  fournisseur VARCHAR(200) NOT NULL,
  statut VARCHAR(20) CHECK (statut IN ('actif', 'expire', 'epuise')) DEFAULT 'actif',
  magasin VARCHAR(20) CHECK (magasin IN ('gros', 'detail')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(medicament_id, numero_lot)
);

-- 3. Table des mouvements de stock
CREATE TABLE IF NOT EXISTS mouvements_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) CHECK (type IN ('reception', 'transfert', 'dispensation', 'retour', 'perte', 'correction')) NOT NULL,
  medicament_id UUID NOT NULL REFERENCES medicaments(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
  quantite INTEGER NOT NULL,
  quantite_avant INTEGER NOT NULL,
  quantite_apres INTEGER NOT NULL,
  motif TEXT NOT NULL,
  utilisateur_id VARCHAR(100) NOT NULL,
  date_mouvement TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  magasin_source VARCHAR(20) CHECK (magasin_source IN ('gros', 'detail', 'externe')) NOT NULL,
  magasin_destination VARCHAR(20) CHECK (magasin_destination IN ('gros', 'detail', 'patient', 'service')) NOT NULL,
  reference_document VARCHAR(100),
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des transferts
CREATE TABLE IF NOT EXISTS transferts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_transfert VARCHAR(50) UNIQUE NOT NULL,
  date_transfert TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  magasin_source VARCHAR(20) CHECK (magasin_source IN ('gros')) NOT NULL,
  magasin_destination VARCHAR(20) CHECK (magasin_destination IN ('detail')) NOT NULL,
  statut VARCHAR(20) CHECK (statut IN ('en_cours', 'valide', 'annule')) DEFAULT 'en_cours',
  utilisateur_source_id VARCHAR(100) NOT NULL,
  utilisateur_destination_id VARCHAR(100),
  date_validation TIMESTAMP WITH TIME ZONE,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des lignes de transfert
CREATE TABLE IF NOT EXISTS transfert_lignes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transfert_id UUID NOT NULL REFERENCES transferts(id) ON DELETE CASCADE,
  medicament_id UUID NOT NULL REFERENCES medicaments(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  quantite INTEGER NOT NULL,
  quantite_validee INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table des dispensations
CREATE TABLE IF NOT EXISTS dispensations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_dispensation VARCHAR(50) UNIQUE NOT NULL,
  date_dispensation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id VARCHAR(100),
  service_id VARCHAR(100),
  type_dispensation VARCHAR(20) CHECK (type_dispensation IN ('patient', 'service')) NOT NULL,
  statut VARCHAR(20) CHECK (statut IN ('en_cours', 'terminee', 'annulee')) DEFAULT 'en_cours',
  utilisateur_id VARCHAR(100) NOT NULL,
  prescription_id VARCHAR(100),
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table des lignes de dispensation
CREATE TABLE IF NOT EXISTS dispensation_lignes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispensation_id UUID NOT NULL REFERENCES dispensations(id) ON DELETE CASCADE,
  medicament_id UUID NOT NULL REFERENCES medicaments(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  quantite INTEGER NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  prix_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Table des alertes de stock
CREATE TABLE IF NOT EXISTS alertes_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medicament_id UUID NOT NULL REFERENCES medicaments(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('rupture', 'seuil_bas', 'peremption', 'stock_surplus')) NOT NULL,
  niveau VARCHAR(20) CHECK (niveau IN ('critique', 'avertissement', 'information')) NOT NULL,
  message TEXT NOT NULL,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_resolution TIMESTAMP WITH TIME ZONE,
  statut VARCHAR(20) CHECK (statut IN ('active', 'resolue', 'ignoree')) DEFAULT 'active',
  utilisateur_resolution_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Table des inventaires
CREATE TABLE IF NOT EXISTS inventaires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_inventaire VARCHAR(50) UNIQUE NOT NULL,
  date_inventaire TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  magasin VARCHAR(20) CHECK (magasin IN ('gros', 'detail')) NOT NULL,
  statut VARCHAR(20) CHECK (statut IN ('en_cours', 'termine', 'valide')) DEFAULT 'en_cours',
  utilisateur_id VARCHAR(100) NOT NULL,
  date_validation TIMESTAMP WITH TIME ZONE,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Table des lignes d'inventaire
CREATE TABLE IF NOT EXISTS inventaire_lignes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventaire_id UUID NOT NULL REFERENCES inventaires(id) ON DELETE CASCADE,
  medicament_id UUID NOT NULL REFERENCES medicaments(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  quantite_theorique INTEGER NOT NULL,
  quantite_reelle INTEGER NOT NULL,
  ecart INTEGER GENERATED ALWAYS AS (quantite_reelle - quantite_theorique) STORED,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Table des pertes et retours
CREATE TABLE IF NOT EXISTS pertes_retours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) CHECK (type IN ('perte', 'retour')) NOT NULL,
  medicament_id UUID NOT NULL REFERENCES medicaments(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  quantite INTEGER NOT NULL,
  motif TEXT NOT NULL,
  utilisateur_id VARCHAR(100) NOT NULL,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  statut VARCHAR(20) CHECK (statut IN ('en_cours', 'valide', 'rejete')) DEFAULT 'en_cours',
  observations TEXT,
  reference_document VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_medicaments_code ON medicaments(code);
CREATE INDEX IF NOT EXISTS idx_medicaments_nom ON medicaments(nom);
CREATE INDEX IF NOT EXISTS idx_medicaments_categorie ON medicaments(categorie);
CREATE INDEX IF NOT EXISTS idx_medicaments_fournisseur ON medicaments(fournisseur);

CREATE INDEX IF NOT EXISTS idx_lots_medicament_id ON lots(medicament_id);
CREATE INDEX IF NOT EXISTS idx_lots_numero_lot ON lots(numero_lot);
CREATE INDEX IF NOT EXISTS idx_lots_date_expiration ON lots(date_expiration);
CREATE INDEX IF NOT EXISTS idx_lots_statut ON lots(statut);
CREATE INDEX IF NOT EXISTS idx_lots_magasin ON lots(magasin);

CREATE INDEX IF NOT EXISTS idx_mouvements_medicament_id ON mouvements_stock(medicament_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_lot_id ON mouvements_stock(lot_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_type ON mouvements_stock(type);
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements_stock(date_mouvement);
CREATE INDEX IF NOT EXISTS idx_mouvements_utilisateur ON mouvements_stock(utilisateur_id);

CREATE INDEX IF NOT EXISTS idx_transferts_numero ON transferts(numero_transfert);
CREATE INDEX IF NOT EXISTS idx_transferts_date ON transferts(date_transfert);
CREATE INDEX IF NOT EXISTS idx_transferts_statut ON transferts(statut);

CREATE INDEX IF NOT EXISTS idx_dispensations_numero ON dispensations(numero_dispensation);
CREATE INDEX IF NOT EXISTS idx_dispensations_date ON dispensations(date_dispensation);
CREATE INDEX IF NOT EXISTS idx_dispensations_patient ON dispensations(patient_id);
CREATE INDEX IF NOT EXISTS idx_dispensations_statut ON dispensations(statut);

CREATE INDEX IF NOT EXISTS idx_alertes_medicament_id ON alertes_stock(medicament_id);
CREATE INDEX IF NOT EXISTS idx_alertes_type ON alertes_stock(type);
CREATE INDEX IF NOT EXISTS idx_alertes_statut ON alertes_stock(statut);
CREATE INDEX IF NOT EXISTS idx_alertes_date_creation ON alertes_stock(date_creation);

CREATE INDEX IF NOT EXISTS idx_inventaires_numero ON inventaires(numero_inventaire);
CREATE INDEX IF NOT EXISTS idx_inventaires_date ON inventaires(date_inventaire);
CREATE INDEX IF NOT EXISTS idx_inventaires_magasin ON inventaires(magasin);
CREATE INDEX IF NOT EXISTS idx_inventaires_statut ON inventaires(statut);

CREATE INDEX IF NOT EXISTS idx_pertes_retours_type ON pertes_retours(type);
CREATE INDEX IF NOT EXISTS idx_pertes_retours_medicament_id ON pertes_retours(medicament_id);
CREATE INDEX IF NOT EXISTS idx_pertes_retours_lot_id ON pertes_retours(lot_id);
CREATE INDEX IF NOT EXISTS idx_pertes_retours_statut ON pertes_retours(statut);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_medicaments_updated_at 
    BEFORE UPDATE ON medicaments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lots_updated_at 
    BEFORE UPDATE ON lots 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mouvements_updated_at 
    BEFORE UPDATE ON mouvements_stock 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transferts_updated_at 
    BEFORE UPDATE ON transferts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfert_lignes_updated_at 
    BEFORE UPDATE ON transfert_lignes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispensations_updated_at 
    BEFORE UPDATE ON dispensations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispensation_lignes_updated_at 
    BEFORE UPDATE ON dispensation_lignes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alertes_updated_at 
    BEFORE UPDATE ON alertes_stock 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventaires_updated_at 
    BEFORE UPDATE ON inventaires 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventaire_lignes_updated_at 
    BEFORE UPDATE ON inventaire_lignes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pertes_retours_updated_at 
    BEFORE UPDATE ON pertes_retours 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertion de données de démonstration
INSERT INTO medicaments (code, nom, forme, dosage, unite, fournisseur, prix_unitaire, seuil_alerte, seuil_rupture, emplacement, categorie, prescription_requise) VALUES
('PAR500', 'Paracétamol 500mg', 'Comprimé', '500mg', 'mg', 'PharmaPlus', 200, 20, 10, 'Rayon A1', 'Antalgiques', false),
('IBU400', 'Ibuprofène 400mg', 'Comprimé', '400mg', 'mg', 'MediCorp', 350, 15, 8, 'Rayon A2', 'Anti-inflammatoires', false),
('AMO500', 'Amoxicilline 500mg', 'Gélule', '500mg', 'mg', 'AntibioLab', 800, 10, 5, 'Rayon B1', 'Antibiotiques', true),
('MET500', 'Métronidazole 500mg', 'Comprimé', '500mg', 'mg', 'AntibioLab', 1200, 8, 4, 'Rayon B2', 'Antibiotiques', true),
('VITC1000', 'Vitamine C 1000mg', 'Comprimé effervescent', '1000mg', 'mg', 'VitaminePlus', 150, 25, 12, 'Rayon C1', 'Vitamines', false),
('ASP500', 'Aspirine 500mg', 'Comprimé', '500mg', 'mg', 'PharmaPlus', 180, 30, 15, 'Rayon A3', 'Antalgiques', false),
('DIC50', 'Diclofénac 50mg', 'Comprimé', '50mg', 'mg', 'MediCorp', 450, 12, 6, 'Rayon A4', 'Anti-inflammatoires', true),
('CIP500', 'Ciprofloxacine 500mg', 'Comprimé', '500mg', 'mg', 'AntibioLab', 1500, 8, 4, 'Rayon B3', 'Antibiotiques', true),
('MULTI', 'Multivitamines', 'Comprimé', '1 comprimé', 'unité', 'VitaminePlus', 300, 20, 10, 'Rayon C2', 'Vitamines', false),
('CAL500', 'Calcium 500mg', 'Comprimé', '500mg', 'mg', 'VitaminePlus', 250, 15, 8, 'Rayon C3', 'Minéraux', false);

-- Insertion de lots de démonstration
INSERT INTO lots (medicament_id, numero_lot, quantite_initiale, quantite_disponible, date_reception, date_expiration, prix_achat, fournisseur, statut, magasin) 
SELECT 
  m.id,
  'LOT2024' || LPAD(ROW_NUMBER() OVER (ORDER BY m.code)::text, 3, '0'),
  CASE 
    WHEN m.code = 'PAR500' THEN 100
    WHEN m.code = 'IBU400' THEN 80
    WHEN m.code = 'AMO500' THEN 50
    WHEN m.code = 'MET500' THEN 30
    WHEN m.code = 'VITC1000' THEN 60
    ELSE 40
  END,
  CASE 
    WHEN m.code = 'PAR500' THEN 15
    WHEN m.code = 'IBU400' THEN 8
    WHEN m.code = 'AMO500' THEN 0
    WHEN m.code = 'MET500' THEN 5
    WHEN m.code = 'VITC1000' THEN 25
    ELSE 20
  END,
  '2024-01-15'::DATE,
  CASE 
    WHEN m.code = 'PAR500' THEN '2024-12-31'::DATE
    WHEN m.code = 'IBU400' THEN '2024-10-15'::DATE
    WHEN m.code = 'AMO500' THEN '2024-08-20'::DATE
    WHEN m.code = 'MET500' THEN '2025-03-15'::DATE
    WHEN m.code = 'VITC1000' THEN '2025-06-30'::DATE
    ELSE '2025-01-31'::DATE
  END,
  m.prix_unitaire * 0.7,
  m.fournisseur,
  CASE 
    WHEN m.code = 'AMO500' THEN 'epuise'
    WHEN m.code = 'IBU400' THEN 'actif'
    ELSE 'actif'
  END,
  CASE 
    WHEN m.code IN ('PAR500', 'IBU400', 'AMO500') THEN 'detail'
    ELSE 'gros'
  END
FROM medicaments m;

-- Insertion de mouvements de démonstration
INSERT INTO mouvements_stock (type, medicament_id, lot_id, quantite, quantite_avant, quantite_apres, motif, utilisateur_id, date_mouvement, magasin_source, magasin_destination, reference_document)
SELECT 
  'reception',
  l.medicament_id,
  l.id,
  l.quantite_initiale,
  0,
  l.quantite_initiale,
  'Réception initiale',
  'USER001',
  l.date_reception,
  'externe',
  l.magasin,
  'BL-2024-' || LPAD(ROW_NUMBER() OVER (ORDER BY l.id)::text, 3, '0')
FROM lots l;

-- Insertion d'alertes de démonstration
INSERT INTO alertes_stock (medicament_id, type, niveau, message, date_creation, statut)
SELECT 
  m.id,
  CASE 
    WHEN m.code = 'AMO500' THEN 'rupture'
    WHEN m.code = 'IBU400' THEN 'seuil_bas'
    WHEN m.code = 'MET500' THEN 'peremption'
    ELSE 'seuil_bas'
  END,
  CASE 
    WHEN m.code = 'AMO500' THEN 'critique'
    WHEN m.code = 'IBU400' THEN 'avertissement'
    WHEN m.code = 'MET500' THEN 'avertissement'
    ELSE 'information'
  END,
  CASE 
    WHEN m.code = 'AMO500' THEN 'Rupture de stock pour ' || m.nom
    WHEN m.code = 'IBU400' THEN 'Stock faible pour ' || m.nom
    WHEN m.code = 'MET500' THEN 'Péremption proche pour ' || m.nom
    ELSE 'Stock faible pour ' || m.nom
  END,
  NOW() - INTERVAL '2 days',
  'active'
FROM medicaments m
WHERE m.code IN ('AMO500', 'IBU400', 'MET500', 'VITC1000');

-- Commentaires sur les tables
COMMENT ON TABLE medicaments IS 'Table des médicaments de la pharmacie';
COMMENT ON TABLE lots IS 'Table des lots de médicaments';
COMMENT ON TABLE mouvements_stock IS 'Table des mouvements de stock';
COMMENT ON TABLE transferts IS 'Table des transferts entre magasins';
COMMENT ON TABLE transfert_lignes IS 'Table des lignes de transfert';
COMMENT ON TABLE dispensations IS 'Table des dispensations de médicaments';
COMMENT ON TABLE dispensation_lignes IS 'Table des lignes de dispensation';
COMMENT ON TABLE alertes_stock IS 'Table des alertes de stock';
COMMENT ON TABLE inventaires IS 'Table des inventaires de stock';
COMMENT ON TABLE inventaire_lignes IS 'Table des lignes d''inventaire';
COMMENT ON TABLE pertes_retours IS 'Table des pertes et retours de médicaments';
