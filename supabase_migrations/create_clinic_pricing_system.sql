-- Migration: Création du système de tarification multi-clinique
-- Date: 2025-01-XX
-- Description: Système complet de gestion de tarification par clinique avec historisation

-- ============================================
-- 1. TABLE: clinics
-- ============================================
-- Table des cliniques inscrites
CREATE TABLE IF NOT EXISTS clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. MODIFICATION: services_facturables
-- ============================================
-- Ajouter le champ tarif_defaut pour les tarifs par défaut au niveau système
ALTER TABLE services_facturables 
ADD COLUMN IF NOT EXISTS tarif_defaut DECIMAL(12, 2) DEFAULT 0;

-- Mettre à jour tarif_defaut avec les valeurs existantes de tarif_base si tarif_defaut est 0
UPDATE services_facturables 
SET tarif_defaut = tarif_base 
WHERE tarif_defaut = 0 OR tarif_defaut IS NULL;

-- ============================================
-- 3. MODIFICATION: users (si la table existe dans Supabase)
-- ============================================
-- Ajouter clinic_id pour lier les utilisateurs à leur clinique
-- Note: Cette modification sera aussi faite dans Prisma schema
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- 4. TABLE: clinic_pricing
-- ============================================
-- Tarifs spécifiques par clinique
CREATE TABLE IF NOT EXISTS clinic_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services_facturables(id) ON DELETE CASCADE,
  tarif_base DECIMAL(12, 2) NOT NULL CHECK (tarif_base >= 0),
  unite VARCHAR(20) DEFAULT 'unité',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(clinic_id, service_id)
);

-- ============================================
-- 5. TABLE: clinic_pricing_history
-- ============================================
-- Historique des modifications de tarifs
CREATE TABLE IF NOT EXISTS clinic_pricing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_pricing_id UUID NOT NULL REFERENCES clinic_pricing(id) ON DELETE CASCADE,
  tarif_ancien DECIMAL(12, 2) NOT NULL,
  tarif_nouveau DECIMAL(12, 2) NOT NULL,
  date_debut TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_fin TIMESTAMP WITH TIME ZONE,
  modified_by UUID, -- Référence vers users si la table existe
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. INDEXES pour améliorer les performances
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clinics_code ON clinics(code);
CREATE INDEX IF NOT EXISTS idx_clinics_active ON clinics(active);
CREATE INDEX IF NOT EXISTS idx_clinic_pricing_clinic ON clinic_pricing(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_pricing_service ON clinic_pricing(service_id);
CREATE INDEX IF NOT EXISTS idx_clinic_pricing_clinic_service ON clinic_pricing(clinic_id, service_id);
CREATE INDEX IF NOT EXISTS idx_clinic_pricing_active ON clinic_pricing(active);
CREATE INDEX IF NOT EXISTS idx_clinic_pricing_history_pricing ON clinic_pricing_history(clinic_pricing_id);
CREATE INDEX IF NOT EXISTS idx_clinic_pricing_history_date_debut ON clinic_pricing_history(date_debut);
CREATE INDEX IF NOT EXISTS idx_clinic_pricing_history_modified_by ON clinic_pricing_history(modified_by);
CREATE INDEX IF NOT EXISTS idx_users_clinic ON users(clinic_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');

-- ============================================
-- 7. FONCTIONS SQL pour automatisation
-- ============================================

-- Fonction pour créer automatiquement un historique lors de la modification d'un tarif
CREATE OR REPLACE FUNCTION creer_historique_tarif()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le tarif a changé, créer une entrée dans l'historique
  IF OLD.tarif_base IS DISTINCT FROM NEW.tarif_base THEN
    -- Marquer la fin de l'ancien tarif dans l'historique
    UPDATE clinic_pricing_history
    SET date_fin = NOW()
    WHERE clinic_pricing_id = NEW.id 
      AND date_fin IS NULL;
    
    -- Créer une nouvelle entrée dans l'historique
    INSERT INTO clinic_pricing_history (
      clinic_pricing_id,
      tarif_ancien,
      tarif_nouveau,
      date_debut,
      modified_by
    )
    VALUES (
      NEW.id,
      OLD.tarif_base,
      NEW.tarif_base,
      NOW(),
      current_setting('app.user_id', true)::UUID -- Récupérer l'ID utilisateur depuis le contexte
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement l'historique lors de la modification
CREATE TRIGGER trigger_creer_historique_tarif
AFTER UPDATE ON clinic_pricing
FOR EACH ROW
WHEN (OLD.tarif_base IS DISTINCT FROM NEW.tarif_base)
EXECUTE FUNCTION creer_historique_tarif();

-- Fonction pour créer automatiquement l'historique lors de l'insertion
CREATE OR REPLACE FUNCTION creer_historique_tarif_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer une entrée dans l'historique lors de la création
  INSERT INTO clinic_pricing_history (
    clinic_pricing_id,
    tarif_ancien,
    tarif_nouveau,
    date_debut,
    modified_by
  )
  VALUES (
    NEW.id,
    0, -- Pas d'ancien tarif lors de la création
    NEW.tarif_base,
    NOW(),
    current_setting('app.user_id', true)::UUID
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer l'historique lors de l'insertion
CREATE TRIGGER trigger_creer_historique_tarif_insert
AFTER INSERT ON clinic_pricing
FOR EACH ROW
EXECUTE FUNCTION creer_historique_tarif_insert();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur les tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_pricing_history ENABLE ROW LEVEL SECURITY;

-- Politique pour clinics : tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Clinics are viewable by authenticated users"
  ON clinics FOR SELECT
  TO authenticated
  USING (true);

-- Politique pour clinics : seuls les admins peuvent modifier
CREATE POLICY "Clinics are modifiable by admins only"
  ON clinics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );

-- Politique pour clinic_pricing : les utilisateurs voient uniquement les tarifs de leur clinique
CREATE POLICY "Users can view pricing for their clinic"
  ON clinic_pricing FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users 
      WHERE users.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );

-- Politique pour clinic_pricing : seuls les admins peuvent modifier
CREATE POLICY "Pricing is modifiable by admins only"
  ON clinic_pricing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );

-- Politique pour clinic_pricing_history : lecture pour tous, écriture pour admins
CREATE POLICY "Pricing history is viewable by authenticated users"
  ON clinic_pricing_history FOR SELECT
  TO authenticated
  USING (
    clinic_pricing_id IN (
      SELECT cp.id FROM clinic_pricing cp
      WHERE cp.clinic_id IN (
        SELECT clinic_id FROM users 
        WHERE users.id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Pricing history is modifiable by admins only"
  ON clinic_pricing_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );

-- ============================================
-- 9. VUES pour faciliter les requêtes
-- ============================================

-- Vue récapitulative des tarifs par clinique
CREATE OR REPLACE VIEW vue_tarifs_clinique AS
SELECT 
  cp.id,
  c.code AS clinic_code,
  c.name AS clinic_name,
  sf.code AS service_code,
  sf.nom AS service_nom,
  sf.type_service,
  COALESCE(cp.tarif_base, sf.tarif_defaut) AS tarif_applique,
  sf.tarif_defaut AS tarif_defaut_systeme,
  cp.tarif_base AS tarif_clinique,
  CASE 
    WHEN cp.tarif_base IS NOT NULL THEN 'clinique'
    ELSE 'defaut'
  END AS source_tarif,
  cp.active,
  cp.updated_at AS derniere_modification
FROM clinics c
CROSS JOIN services_facturables sf
LEFT JOIN clinic_pricing cp ON cp.clinic_id = c.id AND cp.service_id = sf.id
WHERE c.active = true AND sf.actif = true;

-- Vue de l'historique des tarifs avec détails
CREATE OR REPLACE VIEW vue_historique_tarifs AS
SELECT 
  cph.id,
  c.code AS clinic_code,
  c.name AS clinic_name,
  sf.code AS service_code,
  sf.nom AS service_nom,
  cph.tarif_ancien,
  cph.tarif_nouveau,
  cph.date_debut,
  cph.date_fin,
  u.name AS modifie_par,
  cph.created_at
FROM clinic_pricing_history cph
JOIN clinic_pricing cp ON cph.clinic_pricing_id = cp.id
JOIN clinics c ON cp.clinic_id = c.id
JOIN services_facturables sf ON cp.service_id = sf.id
LEFT JOIN users u ON cph.modified_by = u.id
ORDER BY cph.date_debut DESC;

-- ============================================
-- 10. DONNÉES INITIALES
-- ============================================

-- Créer une clinique par défaut si aucune n'existe
INSERT INTO clinics (code, name, active)
SELECT 'DEFAULT', 'Clinique par défaut', true
WHERE NOT EXISTS (SELECT 1 FROM clinics WHERE code = 'DEFAULT')
ON CONFLICT (code) DO NOTHING;

