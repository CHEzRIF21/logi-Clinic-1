-- Migration 106: Création des tables du module Vaccination (consultation)
-- Résout l'erreur: Could not find the table 'public.vaccines' in the schema cache
-- Date: 2025-02-13

-- 1. Table des vaccins (catalogue PEV)
CREATE TABLE IF NOT EXISTS vaccines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  libelle VARCHAR(200) NOT NULL,
  description TEXT,
  voie_administration VARCHAR(50),
  site_injection VARCHAR(100),
  age_min_jours INTEGER DEFAULT 0,
  age_max_jours INTEGER,
  nb_doses INTEGER NOT NULL DEFAULT 1,
  intervalle_min_jours INTEGER,
  intervalle_recommande_jours INTEGER,
  rappel_necessaire BOOLEAN DEFAULT false,
  rappel_intervalle_jours INTEGER,
  medicament_id UUID REFERENCES medicaments(id) ON DELETE SET NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des schémas par dose (calendrier détaillé)
CREATE TABLE IF NOT EXISTS vaccine_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vaccine_id UUID NOT NULL REFERENCES vaccines(id) ON DELETE CASCADE,
  dose_ordre INTEGER NOT NULL,
  libelle_dose VARCHAR(100) NOT NULL,
  age_recommande_jours INTEGER NOT NULL,
  age_min_jours INTEGER,
  age_max_jours INTEGER,
  delai_rappel_jours INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (vaccine_id, dose_ordre)
);

-- 3. Table des enregistrements de vaccination patient
CREATE TABLE IF NOT EXISTS patient_vaccinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES vaccines(id) ON DELETE RESTRICT,
  schedule_id UUID REFERENCES vaccine_schedules(id) ON DELETE SET NULL,
  dose_ordre INTEGER NOT NULL,
  date_administration DATE NOT NULL,
  lieu VARCHAR(150),
  numero_lot VARCHAR(100),
  date_peremption DATE,
  vaccinateur VARCHAR(150),
  effets_secondaires TEXT,
  statut VARCHAR(20) CHECK (statut IN ('valide','annule')) DEFAULT 'valide',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (patient_id, vaccine_id, dose_ordre)
);

-- 4. Lots dédiés vaccins (optionnel)
CREATE TABLE IF NOT EXISTS vaccine_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vaccine_id UUID NOT NULL REFERENCES vaccines(id) ON DELETE CASCADE,
  numero_lot VARCHAR(100) NOT NULL,
  date_reception DATE,
  date_expiration DATE NOT NULL,
  quantite_initiale INTEGER,
  quantite_disponible INTEGER,
  temp_min_c DECIMAL(5,2),
  temp_max_c DECIMAL(5,2),
  stockage_emplacement VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (vaccine_id, numero_lot)
);

-- 5. Journal chaîne de froid
CREATE TABLE IF NOT EXISTS cold_chain_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES vaccine_batches(id) ON DELETE CASCADE,
  temperature_c DECIMAL(5,2) NOT NULL,
  mesure_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lieu VARCHAR(150),
  alerte BOOLEAN GENERATED ALWAYS AS (temperature_c < 2 OR temperature_c > 8) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Rappels de vaccination
CREATE TABLE IF NOT EXISTS vaccination_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES vaccines(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES vaccine_schedules(id) ON DELETE SET NULL,
  dose_ordre INTEGER NOT NULL,
  planned_at TIMESTAMP WITH TIME ZONE NOT NULL,
  channel VARCHAR(20) CHECK (channel IN ('sms','notification','email')) DEFAULT 'sms',
  statut VARCHAR(20) CHECK (statut IN ('planifie','envoye','manque','annule')) DEFAULT 'planifie',
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_vaccines_code ON vaccines(code);
CREATE INDEX IF NOT EXISTS idx_patient_vaccinations_patient ON patient_vaccinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_vaccinations_vaccine ON patient_vaccinations(vaccine_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_reminders_patient ON vaccination_reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_reminders_planned ON vaccination_reminders(planned_at);

-- Fonction update_updated_at (peut déjà exister)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (DROP IF EXISTS pour réexécution propre)
DROP TRIGGER IF EXISTS update_vaccines_updated_at ON vaccines;
CREATE TRIGGER update_vaccines_updated_at
  BEFORE UPDATE ON vaccines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vaccine_schedules_updated_at ON vaccine_schedules;
CREATE TRIGGER update_vaccine_schedules_updated_at
  BEFORE UPDATE ON vaccine_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patient_vaccinations_updated_at ON patient_vaccinations;
CREATE TRIGGER update_patient_vaccinations_updated_at
  BEFORE UPDATE ON patient_vaccinations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vaccine_batches_updated_at ON vaccine_batches;
CREATE TRIGGER update_vaccine_batches_updated_at
  BEFORE UPDATE ON vaccine_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vaccination_reminders_updated_at ON vaccination_reminders;
CREATE TRIGGER update_vaccination_reminders_updated_at
  BEFORE UPDATE ON vaccination_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Données PEV de base
INSERT INTO vaccines (code, libelle, description, voie_administration, nb_doses, intervalle_recommande_jours, rappel_necessaire)
VALUES
  ('BCG', 'BCG', 'Tuberculose', 'ID', 1, NULL, false),
  ('OPV', 'Polio Oral (OPV)', 'Poliomyélite', 'PO', 4, 42, false),
  ('PENTA', 'Pentavalent (DTC-HepB-Hib)', 'Diphtérie, Tétanos, Coqueluche, Hépatite B, Hib', 'IM', 3, 42, false),
  ('ROTA', 'Rotavirus', 'Gastro-entérite à rotavirus', 'PO', 2, 42, false),
  ('PCV', 'Pneumocoque (PCV)', 'Pneumocoque conjugué', 'IM', 3, 42, false)
ON CONFLICT (code) DO NOTHING;

-- Schedules (avec conflit explicite sur la contrainte unique)
INSERT INTO vaccine_schedules (vaccine_id, dose_ordre, libelle_dose, age_recommande_jours)
SELECT v.id, s.dose_ordre, s.libelle_dose, s.age_jours
FROM vaccines v
JOIN (
  VALUES
    ('BCG', 1, 'Naissance', 0),
    ('OPV', 0, 'OPV 0 (naissance)', 0),
    ('OPV', 1, 'OPV 1 (6 semaines)', 42),
    ('OPV', 2, 'OPV 2 (10 semaines)', 70),
    ('OPV', 3, 'OPV 3 (14 semaines)', 98),
    ('PENTA', 1, 'Penta 1 (6 semaines)', 42),
    ('PENTA', 2, 'Penta 2 (10 semaines)', 70),
    ('PENTA', 3, 'Penta 3 (14 semaines)', 98),
    ('ROTA', 1, 'Rota 1 (6 semaines)', 42),
    ('ROTA', 2, 'Rota 2 (10 semaines)', 70),
    ('PCV', 1, 'PCV 1 (6 semaines)', 42),
    ('PCV', 2, 'PCV 2 (10 semaines)', 70),
    ('PCV', 3, 'PCV 3 (14 semaines)', 98)
) AS s(code, dose_ordre, libelle_dose, age_jours)
ON v.code = s.code
ON CONFLICT (vaccine_id, dose_ordre) DO NOTHING;

COMMENT ON TABLE vaccines IS 'Catalogue des vaccins PEV';
COMMENT ON TABLE vaccine_schedules IS 'Schémas par dose pour chaque vaccin';
COMMENT ON TABLE patient_vaccinations IS 'Enregistrements des doses administrées';
COMMENT ON TABLE vaccine_batches IS 'Lots spécifiques aux vaccins (si non gérés dans stock)';
COMMENT ON TABLE cold_chain_logs IS 'Journal des températures pour la chaîne de froid';
COMMENT ON TABLE vaccination_reminders IS 'Planification et suivi des rappels vaccinaux';

-- RLS: permettre l'accès aux utilisateurs authentifiés (à affiner par clinic_id si besoin)
ALTER TABLE vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccine_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccine_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vaccines_authenticated_all" ON vaccines;
CREATE POLICY "vaccines_authenticated_all" ON vaccines FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "vaccine_schedules_authenticated_all" ON vaccine_schedules;
CREATE POLICY "vaccine_schedules_authenticated_all" ON vaccine_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "patient_vaccinations_authenticated_all" ON patient_vaccinations;
CREATE POLICY "patient_vaccinations_authenticated_all" ON patient_vaccinations FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "vaccine_batches_authenticated_all" ON vaccine_batches;
CREATE POLICY "vaccine_batches_authenticated_all" ON vaccine_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "vaccination_reminders_authenticated_all" ON vaccination_reminders;
CREATE POLICY "vaccination_reminders_authenticated_all" ON vaccination_reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);
