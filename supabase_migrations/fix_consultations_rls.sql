-- Migration: Correction des politiques RLS pour la table consultations
-- Date: 2025-11-28
-- Description: Ajout des politiques RLS manquantes pour permettre la création de consultations

-- ============================================
-- 1. Activer RLS sur la table consultations
-- ============================================
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Supprimer les anciennes politiques si elles existent
-- ============================================
DROP POLICY IF EXISTS "Consultations are viewable by authenticated users" ON consultations;
DROP POLICY IF EXISTS "Consultations are editable by doctors and admins" ON consultations;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON consultations;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON consultations;

-- ============================================
-- 3. Politique pour permettre la lecture aux utilisateurs authentifiés
-- ============================================
CREATE POLICY "Consultations are viewable by authenticated users"
  ON consultations FOR SELECT
  TO authenticated
  USING (true);

-- Politique pour permettre la lecture aux utilisateurs anonymes (développement)
CREATE POLICY "Consultations are viewable by anon users"
  ON consultations FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- 4. Politique pour permettre l'insertion aux utilisateurs authentifiés
-- ============================================
CREATE POLICY "Consultations are insertable by authenticated users"
  ON consultations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique pour permettre l'insertion aux utilisateurs anonymes (développement)
CREATE POLICY "Consultations are insertable by anon users"
  ON consultations FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================
-- 5. Politique pour permettre la mise à jour aux utilisateurs authentifiés
-- ============================================
CREATE POLICY "Consultations are updatable by authenticated users"
  ON consultations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique pour permettre la mise à jour aux utilisateurs anonymes (développement)
CREATE POLICY "Consultations are updatable by anon users"
  ON consultations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 6. Politique pour permettre la suppression aux utilisateurs authentifiés
-- ============================================
CREATE POLICY "Consultations are deletable by authenticated users"
  ON consultations FOR DELETE
  TO authenticated
  USING (true);

-- Politique pour permettre la suppression aux utilisateurs anonymes (développement)
CREATE POLICY "Consultations are deletable by anon users"
  ON consultations FOR DELETE
  TO anon
  USING (true);

-- ============================================
-- 7. RLS pour les tables liées à consultations
-- ============================================

-- consultation_entries
ALTER TABLE consultation_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON consultation_entries;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON consultation_entries;

CREATE POLICY "Allow all operations for authenticated users"
  ON consultation_entries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users"
  ON consultation_entries
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- consultation_constantes
ALTER TABLE consultation_constantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON consultation_constantes;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON consultation_constantes;

CREATE POLICY "Allow all operations for authenticated users"
  ON consultation_constantes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users"
  ON consultation_constantes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON prescriptions;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON prescriptions;

CREATE POLICY "Allow all operations for authenticated users"
  ON prescriptions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users"
  ON prescriptions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- prescription_lines
ALTER TABLE prescription_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON prescription_lines;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON prescription_lines;

CREATE POLICY "Allow all operations for authenticated users"
  ON prescription_lines
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users"
  ON prescription_lines
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- lab_requests
ALTER TABLE lab_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON lab_requests;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON lab_requests;

CREATE POLICY "Allow all operations for authenticated users"
  ON lab_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users"
  ON lab_requests
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- imaging_requests
ALTER TABLE imaging_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON imaging_requests;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON imaging_requests;

CREATE POLICY "Allow all operations for authenticated users"
  ON imaging_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users"
  ON imaging_requests
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- protocols
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON protocols;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON protocols;

CREATE POLICY "Allow all operations for authenticated users"
  ON protocols
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users"
  ON protocols
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- consultation_templates
ALTER TABLE consultation_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON consultation_templates;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON consultation_templates;

CREATE POLICY "Allow all operations for authenticated users"
  ON consultation_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users"
  ON consultation_templates
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

-- Vérification
SELECT 'Politiques RLS pour consultations appliquées avec succès!' as status;

