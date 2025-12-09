-- ============================================
-- TABLE: exam_catalog
-- ============================================

CREATE TABLE IF NOT EXISTS exam_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL,
  sous_categorie TEXT,
  module_cible TEXT NOT NULL CHECK (module_cible IN ('LABORATOIRE','IMAGERIE','GYNECO','CARDIO','PEDIATRIE','ACTE')),
  type_acte TEXT NOT NULL,
  description TEXT,
  tarif_base NUMERIC(12,2) DEFAULT 0,
  unite VARCHAR(50) DEFAULT 'unité',
  facturable BOOLEAN DEFAULT true,
  actif BOOLEAN DEFAULT true,
  service_facturable_id UUID REFERENCES services_facturables(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_catalog_code ON exam_catalog(code);
CREATE INDEX IF NOT EXISTS idx_exam_catalog_module ON exam_catalog(module_cible);
CREATE INDEX IF NOT EXISTS idx_exam_catalog_categorie ON exam_catalog(categorie);

CREATE OR REPLACE FUNCTION update_exam_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exam_catalog_updated_at ON exam_catalog;
CREATE TRIGGER trg_exam_catalog_updated_at
BEFORE UPDATE ON exam_catalog
FOR EACH ROW EXECUTE PROCEDURE update_exam_catalog_updated_at();

-- ============================================
-- DONNÉES INITIALES (Catalogue)
-- ============================================

INSERT INTO exam_catalog (code, nom, categorie, sous_categorie, module_cible, type_acte, tarif_base, unite)
VALUES
  -- Hématologie
  ('HEM-NFS', 'NFS / Hémogramme', 'Hématologie', 'Hémogramme complet', 'LABORATOIRE', 'analyse', 3000, 'examen'),
  ('HEM-PLAQ', 'Numération plaquettaire', 'Hématologie', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('HEM-HCT', 'Hématocrite', 'Hématologie', NULL, 'LABORATOIRE', 'analyse', 1000, 'examen'),
  ('HEM-FROT', 'Frottis sanguin', 'Hématologie', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('HEM-VS', 'Vitesse de sédimentation (VS)', 'Hématologie', NULL, 'LABORATOIRE', 'analyse', 1500, 'examen'),
  ('HEM-GRH', 'Groupe sanguin + Rhésus', 'Hématologie', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('HEM-COMP', 'Test de compatibilité', 'Hématologie', NULL, 'LABORATOIRE', 'analyse', 3000, 'examen'),
  -- Biochimie
  ('BIO-GLYJ', 'Glycémie à jeun', 'Biochimie', NULL, 'LABORATOIRE', 'analyse', 1500, 'examen'),
  ('BIO-GLYP', 'Glycémie post-prandiale', 'Biochimie', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('BIO-UREE', 'Urée sanguine', 'Biochimie', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('BIO-CREA', 'Créatinine', 'Biochimie', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('BIO-BILR', 'Bilan rénal complet', 'Biochimie', NULL, 'LABORATOIRE', 'panel', 5000, 'panel'),
  ('BIO-ASAT', 'ASAT (TGO)', 'Biochimie', 'Bilan hépatique', 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('BIO-ALAT', 'ALAT (TGP)', 'Biochimie', 'Bilan hépatique', 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('BIO-PAL', 'Phosphatase alcaline (PAL)', 'Biochimie', 'Bilan hépatique', 'LABORATOIRE', 'analyse', 2500, 'examen'),
  ('BIO-GGT', 'Gamma GT (GGT)', 'Biochimie', 'Bilan hépatique', 'LABORATOIRE', 'analyse', 2500, 'examen'),
  ('BIO-BILT', 'Bilirubine totale', 'Biochimie', 'Bilan hépatique', 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('BIO-BILH', 'Bilan hépatique complet', 'Biochimie', NULL, 'LABORATOIRE', 'panel', 8000, 'panel'),
  ('BIO-CHOL', 'Cholestérol total', 'Biochimie', 'Bilan lipidique', 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('BIO-HDL', 'HDL / LDL', 'Biochimie', 'Bilan lipidique', 'LABORATOIRE', 'analyse', 3000, 'examen'),
  ('BIO-TRIG', 'Triglycérides', 'Biochimie', 'Bilan lipidique', 'LABORATOIRE', 'analyse', 2500, 'examen'),
  ('BIO-LIP', 'Bilan lipidique complet', 'Biochimie', NULL, 'LABORATOIRE', 'panel', 7000, 'panel'),
  ('BIO-AMYL', 'Amylase', 'Biochimie', 'Pancréas', 'LABORATOIRE', 'analyse', 3000, 'examen'),
  ('BIO-LIPA', 'Lipase', 'Biochimie', 'Pancréas', 'LABORATOIRE', 'analyse', 3500, 'examen'),
  ('BIO-PROT', 'Protéines totales', 'Biochimie', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('BIO-ALB', 'Albumine', 'Biochimie', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('BIO-ELEC', 'Électrolytes (Na+/K+/Cl−)', 'Biochimie', 'Ionogramme', 'LABORATOIRE', 'analyse', 5000, 'examen'),
  -- Sérologie
  ('SER-VIH', 'VIH 1 & 2 (test rapide)', 'Sérologie', NULL, 'LABORATOIRE', 'analyse', 1000, 'examen'),
  ('SER-HBS', 'Hépatite B (HBsAg)', 'Sérologie', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('SER-HCV', 'Hépatite C (anti-HCV)', 'Sérologie', NULL, 'LABORATOIRE', 'analyse', 3000, 'examen'),
  ('SER-SYPH', 'Syphilis (VDRL/TPHA)', 'Sérologie', NULL, 'LABORATOIRE', 'analyse', 1500, 'examen'),
  ('SER-CRP', 'CRP', 'Sérologie', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  ('SER-WID', 'Widal', 'Sérologie', NULL, 'LABORATOIRE', 'analyse', 1500, 'examen'),
  ('SER-TOXO', 'Toxoplasmose IgG/IgM', 'Sérologie', NULL, 'LABORATOIRE', 'analyse', 5000, 'examen'),
  ('SER-RUB', 'Rubéole IgG/IgM', 'Sérologie', NULL, 'LABORATOIRE', 'analyse', 5000, 'examen'),
  ('SER-HCG', 'β-HCG sanguin', 'Sérologie', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  -- Parasitologie
  ('PAR-GOUT', 'Goutte épaisse', 'Parasitologie', 'Paludisme', 'LABORATOIRE', 'analyse', 1000, 'examen'),
  ('PAR-FROT', 'Frottis paludisme', 'Parasitologie', 'Paludisme', 'LABORATOIRE', 'analyse', 1500, 'examen'),
  ('PAR-EPS', 'EPS (selles)', 'Parasitologie', NULL, 'LABORATOIRE', 'analyse', 1500, 'examen'),
  ('PAR-OVA', 'Ova & kystes', 'Parasitologie', NULL, 'LABORATOIRE', 'analyse', 1500, 'examen'),
  ('PAR-URIN', 'Examen direct urine', 'Parasitologie', NULL, 'LABORATOIRE', 'analyse', 1000, 'examen'),
  -- Microbiologie
  ('MIC-ECBU', 'ECBU', 'Microbiologie', 'Urines', 'LABORATOIRE', 'analyse', 3000, 'examen'),
  ('MIC-CULT', 'Culture + antibiogramme', 'Microbiologie', NULL, 'LABORATOIRE', 'analyse', 7000, 'examen'),
  ('MIC-VAG', 'Prélèvement vaginal', 'Microbiologie', NULL, 'LABORATOIRE', 'analyse', 2500, 'examen'),
  ('MIC-URT', 'Prélèvement urétral', 'Microbiologie', NULL, 'LABORATOIRE', 'analyse', 3000, 'examen'),
  ('MIC-BK', 'Bacilloscopie (BK)', 'Microbiologie', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  -- Urines
  ('URI-BAND', 'Bandelette urinaire', 'Urines', NULL, 'LABORATOIRE', 'analyse', 500, 'examen'),
  ('URI-PROT', 'Protéinurie', 'Urines', NULL, 'LABORATOIRE', 'analyse', 1000, 'examen'),
  ('URI-GLY', 'Glycosurie', 'Urines', NULL, 'LABORATOIRE', 'analyse', 1000, 'examen'),
  ('URI-ALB', 'Albuminurie', 'Urines', NULL, 'LABORATOIRE', 'analyse', 1000, 'examen'),
  -- Selles
  ('SEL-COP', 'Coproculture', 'Selles', NULL, 'LABORATOIRE', 'analyse', 4000, 'examen'),
  ('SEL-PARA', 'Parasitologie selles', 'Selles', NULL, 'LABORATOIRE', 'analyse', 1500, 'examen'),
  ('SEL-OCC', 'Recherche de sang occulte', 'Selles', NULL, 'LABORATOIRE', 'analyse', 2000, 'examen'),
  -- Imagerie (Échographie)
  ('IMG-ECHO-PEL', 'Échographie pelvienne', 'Échographie', NULL, 'IMAGERIE', 'examen', 8000, 'examen'),
  ('IMG-ECHO-OBS', 'Échographie obstétricale (1er-3e trim.)', 'Échographie', NULL, 'IMAGERIE', 'examen', 10000, 'examen'),
  ('IMG-ECHO-ABD', 'Échographie abdominale', 'Échographie', NULL, 'IMAGERIE', 'examen', 10000, 'examen'),
  ('IMG-ECHO-THY', 'Échographie thyroïdienne', 'Échographie', NULL, 'IMAGERIE', 'examen', 8000, 'examen'),
  ('IMG-ECHO-MAM', 'Échographie mammaire', 'Échographie', NULL, 'IMAGERIE', 'examen', 10000, 'examen'),
  ('IMG-ECHO-TES', 'Échographie testiculaire', 'Échographie', NULL, 'IMAGERIE', 'examen', 10000, 'examen'),
  ('IMG-ECHO-REN', 'Échographie rénale', 'Échographie', NULL, 'IMAGERIE', 'examen', 8000, 'examen'),
  ('IMG-ECHO-MOL', 'Échographie parties molles', 'Échographie', NULL, 'IMAGERIE', 'examen', 8000, 'examen'),
  -- Imagerie (Radiologie optionnelle)
  ('IMG-RAD-THX', 'Radiographie thorax', 'Radiologie', NULL, 'IMAGERIE', 'examen', 7000, 'examen'),
  ('IMG-RAD-BAS', 'Radiographie bassin', 'Radiologie', NULL, 'IMAGERIE', 'examen', 7000, 'examen'),
  ('IMG-RAD-MI', 'Radiographie membre inférieur', 'Radiologie', NULL, 'IMAGERIE', 'examen', 7000, 'examen'),
  -- Pédiatrie
  ('PED-PALU', 'Test palu rapide (TDR)', 'Pédiatrie', NULL, 'PEDIATRIE', 'test', 500, 'test'),
  ('PED-HB', 'Hémoglobine rapide', 'Pédiatrie', NULL, 'PEDIATRIE', 'test', 1500, 'test'),
  ('PED-BILNUT', 'Bilan nutritionnel', 'Pédiatrie', NULL, 'PEDIATRIE', 'séance', 500, 'séance'),
  -- Actes infirmiers
  ('ACT-INJ-IM', 'Injection intramusculaire', 'Actes infirmiers', 'Injections', 'ACTE', 'acte', 500, 'acte'),
  ('ACT-INJ-IV', 'Injection intraveineuse', 'Actes infirmiers', 'Injections', 'ACTE', 'acte', 1000, 'acte'),
  ('ACT-PERF', 'Perfusion', 'Actes infirmiers', 'Soins', 'ACTE', 'acte', 2000, 'acte'),
  ('ACT-PANS', 'Pansement simple', 'Actes infirmiers', 'Pansements', 'ACTE', 'acte', 1500, 'acte'),
  ('ACT-PANC', 'Pansement complexe', 'Actes infirmiers', 'Pansements', 'ACTE', 'acte', 3000, 'acte'),
  ('ACT-SOND', 'Sondage vésical', 'Actes infirmiers', 'Procédures', 'ACTE', 'acte', 3000, 'acte'),
  ('ACT-NEBUL', 'Nébulisation', 'Actes infirmiers', 'Soins', 'ACTE', 'acte', 1500, 'acte'),
  ('ACT-SUTURE', 'Suture simple', 'Actes infirmiers', 'Procédures', 'ACTE', 'acte', 5000, 'acte')
ON CONFLICT (code) DO UPDATE
SET nom = EXCLUDED.nom,
    categorie = EXCLUDED.categorie,
    sous_categorie = EXCLUDED.sous_categorie,
    module_cible = EXCLUDED.module_cible,
    type_acte = EXCLUDED.type_acte,
    tarif_base = EXCLUDED.tarif_base,
    unite = EXCLUDED.unite,
    actif = true;

COMMENT ON TABLE exam_catalog IS 'Catalogue centralisé des examens et actes réalisables (laboratoire, imagerie, etc.)';
COMMENT ON COLUMN exam_catalog.module_cible IS 'Module cible principal: LABORATOIRE, IMAGERIE, GYNECO, CARDIO, PEDIATRIE, ACTE';


