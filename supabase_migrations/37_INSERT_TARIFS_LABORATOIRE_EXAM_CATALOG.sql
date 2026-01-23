-- ============================================
-- Migration: Insertion des tarifs laboratoire dans exam_catalog
-- Date: 2025-01-XX
-- Description: Insère tous les examens de TARIFS_LABORATOIRE dans exam_catalog
-- ============================================

-- Fonction pour déterminer la catégorie d'un examen
CREATE OR REPLACE FUNCTION get_categorie_labo(nom TEXT, code TEXT) RETURNS TEXT AS $$
BEGIN
  -- Biochimie
  IF nom ILIKE '%glycémie%' OR nom ILIKE '%glucose%' OR nom ILIKE '%sucre%' OR
     nom ILIKE '%urée%' OR nom ILIKE '%urémie%' OR nom ILIKE '%azotémie%' OR
     nom ILIKE '%créatin%' OR nom ILIKE '%albumine%' OR nom ILIKE '%protéine%' OR
     nom ILIKE '%bilirubine%' OR nom ILIKE '%transaminase%' OR nom ILIKE '%cholestérol%' OR
     nom ILIKE '%triglycéride%' OR nom ILIKE '%amylase%' OR nom ILIKE '%lipase%' OR
     nom ILIKE '%ionogramme%' OR nom ILIKE '%sodium%' OR nom ILIKE '%potassium%' OR
     nom ILIKE '%chlore%' OR nom ILIKE '%calcium%' OR nom ILIKE '%calcémie%' OR
     nom ILIKE '%phosphore%' OR nom ILIKE '%magnésium%' OR nom ILIKE '%magnésémie%' OR
     nom ILIKE '%phosphatase%' OR nom ILIKE '%gamma%' OR nom ILIKE '%GGT%' OR
     nom ILIKE '%CPK%' OR nom ILIKE '%CRP%' OR nom ILIKE '%protidémie%' OR
     nom ILIKE '%électrophorèse%' OR nom ILIKE '%acide urique%' OR nom ILIKE '%uricémie%' OR
     nom ILIKE '%troponine%' OR nom ILIKE '%D-Dimer%' OR nom ILIKE '%CA 125%' OR
     nom ILIKE '%CA 19-9%' OR nom ILIKE '%ACE%' OR nom ILIKE '%lipasémie%' OR
     nom ILIKE '%acetonurie%' OR nom ILIKE '%alpha foeto%' OR nom ILIKE '%AFP%' OR
     nom ILIKE '%sels et pigments biliaires%' OR nom ILIKE '%proteinurie%' OR
     nom ILIKE '%albuminurie%' OR nom ILIKE '%glucosurie%' OR nom ILIKE '%hemoglobinurie%' THEN
    RETURN 'Biochimie';
  END IF;
  
  -- Hématologie
  IF nom ILIKE '%NFS%' OR nom ILIKE '%hémogramme%' OR nom ILIKE '%numération%' OR
     nom ILIKE '%formule sanguine%' OR nom ILIKE '%plaquette%' OR nom ILIKE '%hémoglobine%' OR
     nom ILIKE '%hématocrite%' OR nom ILIKE '%frottis%' OR nom ILIKE '%vitesse de sédimentation%' OR
     nom ILIKE '%VS%' OR nom ILIKE '%groupage%' OR nom ILIKE '%rhésus%' OR
     nom ILIKE '%compatibilité%' OR nom ILIKE '%coombs%' OR nom ILIKE '%RAI%' OR
     nom ILIKE '%agglutinine%' OR nom ILIKE '%électrophorèse de l%hémoglobine%' OR
     nom ILIKE '%G6PD%' OR nom ILIKE '%test d%emmel%' OR nom ILIKE '%microfilaire%' OR
     nom ILIKE '%temps de%' OR nom ILIKE '%TCK%' OR nom ILIKE '%TP%' OR nom ILIKE '%INR%' OR
     nom ILIKE '%temps de saignement%' OR nom ILIKE '%TS%' OR nom ILIKE '%temps de coagulation%' THEN
    RETURN 'Hématologie';
  END IF;
  
  -- Sérologie
  IF nom ILIKE '%AgHBs%' OR nom ILIKE '%HBs%' OR nom ILIKE '%hépatite%' OR
     nom ILIKE '%HCV%' OR nom ILIKE '%HIV%' OR nom ILIKE '%VIH%' OR
     nom ILIKE '%syphilis%' OR nom ILIKE '%VDRL%' OR nom ILIKE '%TPHA%' OR
     nom ILIKE '%Widal%' OR nom ILIKE '%SDW%' OR nom ILIKE '%toxoplasmose%' OR
     nom ILIKE '%TOXO%' OR nom ILIKE '%rubéole%' OR nom ILIKE '%rubeole%' OR
     nom ILIKE '%Beta HCG%' OR nom ILIKE '%BHCG%' OR nom ILIKE '%HCG%' OR
     nom ILIKE '%chlamydiae%' OR nom ILIKE '%ASLO%' OR nom ILIKE '%facteurs rhumatoïdes%' OR
     nom ILIKE '%FR%' OR nom ILIKE '%IgE%' OR nom ILIKE '%AC anti Hbs%' OR
     nom ILIKE '%AC HBe%' OR nom ILIKE '%AC anti HBc%' OR nom ILIKE '%charge virale%' OR
     nom ILIKE '%HBV%' THEN
    RETURN 'Sérologie';
  END IF;
  
  -- Hormones
  IF nom ILIKE '%FSH%' OR nom ILIKE '%LH%' OR nom ILIKE '%FT3%' OR nom ILIKE '%FT4%' OR
     nom ILIKE '%TSH%' OR nom ILIKE '%prolactine%' OR nom ILIKE '%progestérone%' OR
     nom ILIKE '%PSA%' OR nom ILIKE '%testostérone%' OR nom ILIKE '%œstradiol%' OR
     nom ILIKE '%oestradiol%' THEN
    RETURN 'Hormones';
  END IF;
  
  -- Microbiologie
  IF nom ILIKE '%ECBU%' OR nom ILIKE '%culture%' OR nom ILIKE '%antibiogramme%' OR
     nom ILIKE '%ATB%' OR nom ILIKE '%prélèvement%' OR nom ILIKE '%vaginal%' OR
     nom ILIKE '%urétral%' OR nom ILIKE '%PV%' OR nom ILIKE '%BK%' OR
     nom ILIKE '%bacilloscopie%' OR nom ILIKE '%LCR%' OR nom ILIKE '%liquide articulaire%' OR
     nom ILIKE '%spermoculture%' OR nom ILIKE '%spermogramme%' OR nom ILIKE '%HLM%' THEN
    RETURN 'Microbiologie';
  END IF;
  
  -- Parasitologie
  IF nom ILIKE '%coprologie%' OR nom ILIKE '%parasitaire%' OR nom ILIKE '%œufs%' OR
     nom ILIKE '%oeufs%' OR nom ILIKE '%bilharzie%' OR nom ILIKE '%Graham%' OR
     nom ILIKE '%scoth test%' OR nom ILIKE '%EPS%' OR nom ILIKE '%ova%' OR
     nom ILIKE '%kystes%' THEN
    RETURN 'Parasitologie';
  END IF;
  
  -- Urines
  IF nom ILIKE '%urine%' OR nom ILIKE '%bandelette%' OR nom ILIKE '%protéinurie%' OR
     nom ILIKE '%glycosurie%' OR nom ILIKE '%albuminurie%' OR nom ILIKE '%chlorurorachie%' OR
     nom ILIKE '%glycorachie%' OR nom ILIKE '%protéinorachie%' THEN
    RETURN 'Urines';
  END IF;
  
  -- Selles
  IF nom ILIKE '%selles%' OR nom ILIKE '%sang occulte%' THEN
    RETURN 'Selles';
  END IF;
  
  -- Divers par défaut
  RETURN 'Divers';
END;
$$ LANGUAGE plpgsql;

-- Insertion des examens de TARIFS_LABORATOIRE
INSERT INTO exam_catalog (code, nom, categorie, sous_categorie, module_cible, type_acte, tarif_base, unite, facturable, actif)
VALUES
  ('ACETONURIE', 'Acetonurie', get_categorie_labo('Acetonurie', 'ACETONURIE'), 'Tube propre', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('ACIDE_URIQUE', 'Acide urique (uricémie)', get_categorie_labo('Acide urique (uricémie)', 'ACIDE_URIQUE'), 'Tube sec', 'LABORATOIRE', 'analyse', 2000, 'examen', true, true),
  ('AGHBS', 'AgHBs', get_categorie_labo('AgHBs', 'AGHBS'), 'Tube sec', 'LABORATOIRE', 'analyse', 2500, 'examen', true, true),
  ('ALBUMINE', 'Albumine', get_categorie_labo('Albumine', 'ALBUMINE'), 'Tube sec', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('AFP', 'Alpha foeto proteine', get_categorie_labo('Alpha foeto proteine', 'AFP'), 'Tube propre', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('AMYLASE', 'Amylase', get_categorie_labo('Amylase', 'AMYLASE'), 'Tube sec', 'LABORATOIRE', 'analyse', 6000, 'examen', true, true),
  ('ASLO', 'ASLO', get_categorie_labo('ASLO', 'ASLO'), 'Tube sec', 'LABORATOIRE', 'analyse', 4500, 'examen', true, true),
  ('CULTURES', 'Autres cultures', get_categorie_labo('Autres cultures', 'CULTURES'), 'Pot stérile', 'LABORATOIRE', 'analyse', 10000, 'examen', true, true),
  ('BHCG_QUANT', 'Beta HCG quantitatif', get_categorie_labo('Beta HCG quantitatif', 'BHCG_QUANT'), 'Tube stérile', 'LABORATOIRE', 'analyse', 15000, 'examen', true, true),
  ('BHCG_QUAL', 'Beta HCG qualitatif', get_categorie_labo('Beta HCG qualitatif', 'BHCG_QUAL'), 'Tube sec', 'LABORATOIRE', 'analyse', 2500, 'examen', true, true),
  ('BILIRUBINE_DIRECTE', 'Bilirubine direct ou conjuguée', get_categorie_labo('Bilirubine direct ou conjuguée', 'BILIRUBINE_DIRECTE'), 'Tube sec', 'LABORATOIRE', 'analyse', 2500, 'examen', true, true),
  ('BILIRUBINE_TOTALE', 'Bilirubine totale', get_categorie_labo('Bilirubine totale', 'BILIRUBINE_TOTALE'), 'Tube sec', 'LABORATOIRE', 'analyse', 2500, 'examen', true, true),
  ('CALCEMIE', 'Calcémie', get_categorie_labo('Calcémie', 'CALCEMIE'), 'Tube sec ou hépariné', 'LABORATOIRE', 'analyse', 3000, 'examen', true, true),
  ('CHOLESTEROL_HDL', 'Cholesterol HDL', get_categorie_labo('Cholesterol HDL', 'CHOLESTEROL_HDL'), 'Tube sec', 'LABORATOIRE', 'analyse', 2500, 'examen', true, true),
  ('CHOLESTEROL_TOTAL', 'Cholesterole totale', get_categorie_labo('Cholesterole totale', 'CHOLESTEROL_TOTAL'), 'Tube sec', 'LABORATOIRE', 'analyse', 2500, 'examen', true, true),
  ('CHLORE', 'Chlore', get_categorie_labo('Chlore', 'CHLORE'), 'Tube sec', 'LABORATOIRE', 'analyse', 2500, 'examen', true, true),
  ('COPROLOGIE', 'Coprologie parasitaire complète', get_categorie_labo('Coprologie parasitaire complète', 'COPROLOGIE'), 'Pot de prélèvement', 'LABORATOIRE', 'analyse', 2500, 'examen', true, true),
  ('CPK', 'CPK', get_categorie_labo('CPK', 'CPK'), 'Tube sec', 'LABORATOIRE', 'analyse', 5000, 'examen', true, true),
  ('CREATINEMIE', 'Créatinémie', get_categorie_labo('Créatinémie', 'CREATINEMIE'), 'Tube sec', 'LABORATOIRE', 'analyse', 2000, 'examen', true, true),
  ('ECBU_SIMPLE', 'ECBU SIMPLE', get_categorie_labo('ECBU SIMPLE', 'ECBU_SIMPLE'), 'Pot stérile', 'LABORATOIRE', 'analyse', 5000, 'examen', true, true),
  ('ECBU_ATB', 'ECBU+ATB', get_categorie_labo('ECBU+ATB', 'ECBU_ATB'), 'Pot stérile', 'LABORATOIRE', 'analyse', 10000, 'examen', true, true),
  ('ECB_LCR', 'ECB du LCR', get_categorie_labo('ECB du LCR', 'ECB_LCR'), 'Tubes stérile', 'LABORATOIRE', 'analyse', 5000, 'examen', true, true),
  ('ECB_LCR_CHIMIE', 'ECB du LCR+ chimie', get_categorie_labo('ECB du LCR+ chimie', 'ECB_LCR_CHIMIE'), 'Tube sterile', 'LABORATOIRE', 'analyse', 13000, 'examen', true, true),
  ('ELECTROPHORESE_HB', 'Electrophorèse de l''hemoglobine', get_categorie_labo('Electrophorèse de l''hemoglobine', 'ELECTROPHORESE_HB'), 'EDTA', 'LABORATOIRE', 'analyse', 4000, 'examen', true, true),
  ('ELECTROPHORESE_PROT', 'Electrophorèse des proteines serique', get_categorie_labo('Electrophorèse des proteines serique', 'ELECTROPHORESE_PROT'), 'Tube sec', 'LABORATOIRE', 'analyse', 20000, 'examen', true, true),
  ('FACTEURS_RHUMATOIDES', 'Facteurs Rhumatoïdes (FR)', get_categorie_labo('Facteurs Rhumatoïdes (FR)', 'FACTEURS_RHUMATOIDES'), 'Tube sec', 'LABORATOIRE', 'analyse', 3000, 'examen', true, true),
  ('FSH', 'FSH', get_categorie_labo('FSH', 'FSH'), 'Tubes sec', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('FS_GE_DP', 'FS+GE+DP', get_categorie_labo('FS+GE+DP', 'FS_GE_DP'), 'EDTA', 'LABORATOIRE', 'analyse', 1500, 'examen', true, true),
  ('FT3', 'FT3', get_categorie_labo('FT3', 'FT3'), 'Tube sec', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('FT4', 'FT4', get_categorie_labo('FT4', 'FT4'), 'Tube sec', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('GAMMA_GT', 'Gamma GT', get_categorie_labo('Gamma GT', 'GAMMA_GT'), 'tube sec', 'LABORATOIRE', 'analyse', 4500, 'examen', true, true),
  ('GLYCEMIE_JEUN', 'Glycémie à jeun', get_categorie_labo('Glycémie à jeun', 'GLYCEMIE_JEUN'), 'Oxalate ou fluorure', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('GROUPAGE_SANGUIN', 'Groupage sanguin rhésus', get_categorie_labo('Groupage sanguin rhésus', 'GROUPAGE_SANGUIN'), 'Tube sec ou EDTA', 'LABORATOIRE', 'analyse', 2500, 'examen', true, true),
  ('GLUCOSE_POST_PRANDIAL', 'Glucose post prandiale', get_categorie_labo('Glucose post prandiale', 'GLUCOSE_POST_PRANDIAL'), 'fluorure', 'LABORATOIRE', 'analyse', 1500, 'examen', true, true),
  ('G6PD', 'G6PD', get_categorie_labo('G6PD', 'G6PD'), 'EDTA', 'LABORATOIRE', 'analyse', 12000, 'examen', true, true),
  ('HEMOGLOBINURIE', 'Hemoglobinurie', get_categorie_labo('Hemoglobinurie', 'HEMOGLOBINURIE'), 'Tube propre', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('HEPATITE_C', 'Hepatite c (HCV)', get_categorie_labo('Hepatite c (HCV)', 'HEPATITE_C'), 'Tube sec', 'LABORATOIRE', 'analyse', 5000, 'examen', true, true),
  ('HLM', 'HLM', get_categorie_labo('HLM', 'HLM'), 'Pot stérile', 'LABORATOIRE', 'analyse', 3000, 'examen', true, true),
  ('HYPER_GLYCEMIE_PROVOQUEE', 'Hyper glycémie provoquée', get_categorie_labo('Hyper glycémie provoquée', 'HYPER_GLYCEMIE_PROVOQUEE'), 'Oxalate ou fluorure', 'LABORATOIRE', 'analyse', 4000, 'examen', true, true),
  ('IONOGRAMME', 'Ionogramme sanguin', get_categorie_labo('Ionogramme sanguin', 'IONOGRAMME'), 'Tube sec ou hépariné', 'LABORATOIRE', 'analyse', 9000, 'examen', true, true),
  ('IONOGRAMME_CALCIUM', 'Ionogramme + calcium', get_categorie_labo('Ionogramme + calcium', 'IONOGRAMME_CALCIUM'), 'Tube sec ou hépariné', 'LABORATOIRE', 'analyse', 12000, 'examen', true, true),
  ('LCR_CHLORURORACHIE', 'LCR: chlorurorachie', get_categorie_labo('LCR: chlorurorachie', 'LCR_CHLORURORACHIE'), 'Tube sec', 'LABORATOIRE', 'analyse', 2500, 'examen', true, true),
  ('LCR_GLYCORACHIE', 'LCR: glycorachie', get_categorie_labo('LCR: glycorachie', 'LCR_GLYCORACHIE'), 'Tube sec', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('LCR_PROTEINORACHIE', 'LCR: protéinorachie', get_categorie_labo('LCR: protéinorachie', 'LCR_PROTEINORACHIE'), 'Tube sec', 'LABORATOIRE', 'analyse', 1500, 'examen', true, true),
  ('LCR_ATB', 'LCR + ATB', get_categorie_labo('LCR + ATB', 'LCR_ATB'), 'Tube sterile', 'LABORATOIRE', 'analyse', 10000, 'examen', true, true),
  ('LH_PLASMATIQUE', 'LH plasmatique', get_categorie_labo('LH plasmatique', 'LH_PLASMATIQUE'), 'Tube sec', 'LABORATOIRE', 'analyse', 15000, 'examen', true, true),
  ('LH_URIQUE', 'LH urique', get_categorie_labo('LH urique', 'LH_URIQUE'), 'Pot stérile', 'LABORATOIRE', 'analyse', 15000, 'examen', true, true),
  ('LIQUIDE_ARTICULAIRE_ATB', 'Liquide articulaire + ATB', get_categorie_labo('Liquide articulaire + ATB', 'LIQUIDE_ARTICULAIRE_ATB'), 'Tube stérile', 'LABORATOIRE', 'analyse', 10000, 'examen', true, true),
  ('MAGNESEMIE', 'Magnésémie', get_categorie_labo('Magnésémie', 'MAGNESEMIE'), 'Tube sec', 'LABORATOIRE', 'analyse', 3000, 'examen', true, true),
  ('GRAHAM_SCOOTH', 'Methode de Graham (scoth test)', get_categorie_labo('Methode de Graham (scoth test)', 'GRAHAM_SCOOTH'), '', 'LABORATOIRE', 'analyse', 3000, 'examen', true, true),
  ('NATREMIE', 'Natrémie', get_categorie_labo('Natrémie', 'NATREMIE'), 'Tube sec ou hépariné', 'LABORATOIRE', 'analyse', 3000, 'examen', true, true),
  ('NUMERATION_BLANCHE', 'Numération blanche', get_categorie_labo('Numération blanche', 'NUMERATION_BLANCHE'), 'EDTA', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('NFS_PLAQUETTES', 'Numération formule sanguine+ plaquettes', get_categorie_labo('Numération formule sanguine+ plaquettes', 'NFS_PLAQUETTES'), 'EDTA', 'LABORATOIRE', 'analyse', 3500, 'examen', true, true),
  ('NUMERATION_PLAQUETTES', 'Numération plaquettes', get_categorie_labo('Numération plaquettes', 'NUMERATION_PLAQUETTES'), 'EDTA', 'LABORATOIRE', 'analyse', 1500, 'examen', true, true),
  ('NUMERATION_ROUGE', 'Numération rouge', get_categorie_labo('Numération rouge', 'NUMERATION_ROUGE'), 'EDTA', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('POTASSIUM', 'Potassium', get_categorie_labo('Potassium', 'POTASSIUM'), 'Tube sec ou hépariné', 'LABORATOIRE', 'analyse', 3000, 'examen', true, true),
  ('PHOSPHATASE_ACIDE', 'Phosphatase acide', get_categorie_labo('Phosphatase acide', 'PHOSPHATASE_ACIDE'), 'Tube sec', 'LABORATOIRE', 'analyse', 4000, 'examen', true, true),
  ('PHOSPHATASE_ALCALINE', 'Phosphatase alcaline', get_categorie_labo('Phosphatase alcaline', 'PHOSPHATASE_ALCALINE'), 'Tube sec', 'LABORATOIRE', 'analyse', 4000, 'examen', true, true),
  ('PHOSPHATASE_PROSTATIQUE', 'Phosphatase prostatique', get_categorie_labo('Phosphatase prostatique', 'PHOSPHATASE_PROSTATIQUE'), 'Tube sec', 'LABORATOIRE', 'analyse', 4000, 'examen', true, true),
  ('PHOSPHORE', 'Phosphore', get_categorie_labo('Phosphore', 'PHOSPHORE'), 'Tube sec', 'LABORATOIRE', 'analyse', 5000, 'examen', true, true),
  ('PROLACTINE', 'Prolactine sérique', get_categorie_labo('Prolactine sérique', 'PROLACTINE'), 'Tube sec', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('PROGESTERONE', 'Progestérone', get_categorie_labo('Progestérone', 'PROGESTERONE'), 'Tube sec', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('CRP', 'Proteine C Réactive (CRP)', get_categorie_labo('Proteine C Réactive (CRP)', 'CRP'), 'Tube sec', 'LABORATOIRE', 'analyse', 4000, 'examen', true, true),
  ('PROTIDEMIE', 'Protidémie', get_categorie_labo('Protidémie', 'PROTIDEMIE'), 'Tube sec', 'LABORATOIRE', 'analyse', 2500, 'examen', true, true),
  ('PROTEINURIE_24H', 'Proteinurie des 24 heures', get_categorie_labo('Proteinurie des 24 heures', 'PROTEINURIE_24H'), 'Bidon d''1,5 L', 'LABORATOIRE', 'analyse', 5000, 'examen', true, true),
  ('PSA_LIBRE', 'PSA libre', get_categorie_labo('PSA libre', 'PSA_LIBRE'), 'Tube sec', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('PSA_TOTALE', 'PSA totale', get_categorie_labo('PSA totale', 'PSA_TOTALE'), 'Tube sec', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('PV_ATB', 'PV + ATB', get_categorie_labo('PV + ATB', 'PV_ATB'), 'Ecouvillon stérile', 'LABORATOIRE', 'analyse', 10000, 'examen', true, true),
  ('RAI', 'Recherche d''agglutinine irrégulière (RAI)', get_categorie_labo('Recherche d''agglutinine irrégulière (RAI)', 'RAI'), 'Tube sec+ EDTA', 'LABORATOIRE', 'analyse', 6000, 'examen', true, true),
  ('MICROFILAIRE', 'Recherche de microfilaire', get_categorie_labo('Recherche de microfilaire', 'MICROFILAIRE'), 'EDTA', 'LABORATOIRE', 'analyse', 5000, 'examen', true, true),
  ('BILHARZIE', 'Recherche des œufs de Bilharzie', get_categorie_labo('Recherche des œufs de Bilharzie', 'BILHARZIE'), 'Tube conique', 'LABORATOIRE', 'analyse', 2000, 'examen', true, true),
  ('SELS_PIGMENTS_BILIAIRES', 'Sels et pigments biliaires', get_categorie_labo('Sels et pigments biliaires', 'SELS_PIGMENTS_BILIAIRES'), 'Tube propre', 'LABORATOIRE', 'analyse', 2000, 'examen', true, true),
  ('SEROLOGIE_CHLAMYDIAE', 'Serologie chlamydiae', get_categorie_labo('Serologie chlamydiae', 'SEROLOGIE_CHLAMYDIAE'), 'Tube sec', 'LABORATOIRE', 'analyse', 15000, 'examen', true, true),
  ('SDW', 'Sero diagnostique de Widal (SDW)', get_categorie_labo('Sero diagnostique de Widal (SDW)', 'SDW'), 'Tube sec', 'LABORATOIRE', 'analyse', 4000, 'examen', true, true),
  ('TOXOPLASMOSE', 'Serologie toxoplasmose (TOXO)', get_categorie_labo('Serologie toxoplasmose (TOXO)', 'TOXOPLASMOSE'), 'Tube sec', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('RUBEOLE', 'Serologie rubéole (rubeole)', get_categorie_labo('Serologie rubéole (rubeole)', 'RUBEOLE'), 'Tube sec', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('SEROLOGIE_HIV', 'Serologie HIV', get_categorie_labo('Serologie HIV', 'SEROLOGIE_HIV'), 'Tube sec', 'LABORATOIRE', 'analyse', 2000, 'examen', true, true),
  ('SODIUM', 'Sodium', get_categorie_labo('Sodium', 'SODIUM'), 'Tube sec ou hépariné', 'LABORATOIRE', 'analyse', 3000, 'examen', true, true),
  ('SPERMOGRAMME_COMPLET', 'Spermogramme + spermoculture + ATB', get_categorie_labo('Spermogramme + spermoculture + ATB', 'SPERMOGRAMME_COMPLET'), 'A faire au labo', 'LABORATOIRE', 'analyse', 15000, 'examen', true, true),
  ('SPERMOGRAMME', 'Spermogramme', get_categorie_labo('Spermogramme', 'SPERMOGRAMME'), 'A faire au labo', 'LABORATOIRE', 'analyse', 10000, 'examen', true, true),
  ('SUCRE', 'Sucre', get_categorie_labo('Sucre', 'SUCRE'), 'Tube propre', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('HEMOGLOBINE', 'Taux d''hemoglobine', get_categorie_labo('Taux d''hemoglobine', 'HEMOGLOBINE'), 'Tube sec', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('HEMATOCRITE', 'Taux d''hématocrite', get_categorie_labo('Taux d''hématocrite', 'HEMATOCRITE'), 'Tube sec', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('TCK', 'Temps de Céphaline Kaolin (TCK)', get_categorie_labo('Temps de Céphaline Kaolin (TCK)', 'TCK'), 'Citrate', 'LABORATOIRE', 'analyse', 4000, 'examen', true, true),
  ('TP_INR', 'Taux de prothrombine (TP + INR)', get_categorie_labo('Taux de prothrombine (TP + INR)', 'TP_INR'), 'Citrate', 'LABORATOIRE', 'analyse', 4000, 'examen', true, true),
  ('TS', 'Temps de saignement (TS)', get_categorie_labo('Temps de saignement (TS)', 'TS'), 'vaccinostyle', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('TEMPS_COAGULATION', 'Temps de coagulation', get_categorie_labo('Temps de coagulation', 'TEMPS_COAGULATION'), '', 'LABORATOIRE', 'analyse', 1500, 'examen', true, true),
  ('TBG', 'Test biologique de grossesse (TBG)', get_categorie_labo('Test biologique de grossesse (TBG)', 'TBG'), 'Tube sec', 'LABORATOIRE', 'analyse', 2000, 'examen', true, true),
  ('TEST_EMMEL', 'Test d''Emmel', get_categorie_labo('Test d''Emmel', 'TEST_EMMEL'), 'EDTA', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('TESTOSTERONE_LIBRE', 'Testostérone libre plasmatique', get_categorie_labo('Testostérone libre plasmatique', 'TESTOSTERONE_LIBRE'), 'Tube sec', 'LABORATOIRE', 'analyse', 30000, 'examen', true, true),
  ('TESTOSTERONE_TOTALE', 'Testostérone totale plasmatique', get_categorie_labo('Testostérone totale plasmatique', 'TESTOSTERONE_TOTALE'), 'Tube sec', 'LABORATOIRE', 'analyse', 30000, 'examen', true, true),
  ('TRANSAMINASES', 'Transaminases', get_categorie_labo('Transaminases', 'TRANSAMINASES'), 'Tubes sec', 'LABORATOIRE', 'analyse', 5000, 'examen', true, true),
  ('TRIGLYCERIDES', 'Triglycérides', get_categorie_labo('Triglycérides', 'TRIGLYCERIDES'), 'Tube sec', 'LABORATOIRE', 'analyse', 2500, 'examen', true, true),
  ('TPHA', 'TPHA', get_categorie_labo('TPHA', 'TPHA'), 'Tube sec', 'LABORATOIRE', 'analyse', 2000, 'examen', true, true),
  ('TSH', 'TSH', get_categorie_labo('TSH', 'TSH'), 'Tube sec', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('UREMIE', 'Urémie (Azotémie ou Urée)', get_categorie_labo('Urémie (Azotémie ou Urée)', 'UREMIE'), 'Tube sec', 'LABORATOIRE', 'analyse', 2000, 'examen', true, true),
  ('VDRL', 'VDRL', get_categorie_labo('VDRL', 'VDRL'), 'Tube sec', 'LABORATOIRE', 'analyse', 2000, 'examen', true, true),
  ('VS', 'Vitesse de sedimentation (VS)', get_categorie_labo('Vitesse de sedimentation (VS)', 'VS'), 'citrate', 'LABORATOIRE', 'analyse', 2000, 'examen', true, true),
  ('IGE', 'Recherche d''IgE', get_categorie_labo('Recherche d''IgE', 'IGE'), 'Tube sec', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('CA_125', 'CA 125', get_categorie_labo('CA 125', 'CA_125'), 'Tube sec', 'LABORATOIRE', 'analyse', 25000, 'examen', true, true),
  ('HBA1C', 'Hémoglobine glyquée (HBA1C)', get_categorie_labo('Hémoglobine glyquée (HBA1C)', 'HBA1C'), 'EDTA', 'LABORATOIRE', 'analyse', 10000, 'examen', true, true),
  ('CPK_2', 'CPK', get_categorie_labo('CPK', 'CPK_2'), 'Tube sec', 'LABORATOIRE', 'analyse', 6000, 'examen', true, true),
  ('CA_19_9', 'Ca 19-9', get_categorie_labo('Ca 19-9', 'CA_19_9'), 'Tube sec', 'LABORATOIRE', 'analyse', 30000, 'examen', true, true),
  ('ACE', 'ACE', get_categorie_labo('ACE', 'ACE'), 'Tube sec', 'LABORATOIRE', 'analyse', 25000, 'examen', true, true),
  ('D_DIMER', 'D-Dimer', get_categorie_labo('D-Dimer', 'D_DIMER'), 'citrate', 'LABORATOIRE', 'analyse', 20000, 'examen', true, true),
  ('OESTRADIOL', 'Œstradiol', get_categorie_labo('Œstradiol', 'OESTRADIOL'), 'Tube sec', 'LABORATOIRE', 'analyse', 16000, 'examen', true, true),
  ('ALBUMINURIE', 'Albuminurie', get_categorie_labo('Albuminurie', 'ALBUMINURIE'), 'Urine de 24 h', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('GLUCOSURIE', 'Glucosurie', get_categorie_labo('Glucosurie', 'GLUCOSURIE'), 'Urine de 24 h', 'LABORATOIRE', 'analyse', 1000, 'examen', true, true),
  ('TROPONINE_I', 'Troponine l', get_categorie_labo('Troponine l', 'TROPONINE_I'), 'Tube sec', 'LABORATOIRE', 'analyse', 25000, 'examen', true, true),
  ('AC_ANTI_HBS', 'AC anti Hbs', get_categorie_labo('AC anti Hbs', 'AC_ANTI_HBS'), 'Tube sec', 'LABORATOIRE', 'analyse', 15000, 'examen', true, true),
  ('AC_HBE', 'AC HBe', get_categorie_labo('AC HBe', 'AC_HBE'), 'Tube sec', 'LABORATOIRE', 'analyse', 25000, 'examen', true, true),
  ('AC_ANTI_HBC', 'AC anti HBc', get_categorie_labo('AC anti HBc', 'AC_ANTI_HBC'), 'Tube sec', 'LABORATOIRE', 'analyse', 25000, 'examen', true, true),
  ('CHARGE_VIRALE_HBV', 'Quantification de la charge virale Hepatite B', get_categorie_labo('Quantification de la charge virale Hepatite B', 'CHARGE_VIRALE_HBV'), 'Tube sec + EDTA', 'LABORATOIRE', 'analyse', 70000, 'examen', true, true),
  ('COOMBS', 'Test de coombs direct et indirect', get_categorie_labo('Test de coombs direct et indirect', 'COOMBS'), 'Tube sec + EDTA', 'LABORATOIRE', 'analyse', 5000, 'examen', true, true),
  ('LIPASEMIE', 'Lipasémie', get_categorie_labo('Lipasémie', 'LIPASEMIE'), 'Tube sec', 'LABORATOIRE', 'analyse', 5000, 'examen', true, true)
ON CONFLICT (code) DO UPDATE
SET nom = EXCLUDED.nom,
    categorie = EXCLUDED.categorie,
    sous_categorie = EXCLUDED.sous_categorie,
    module_cible = EXCLUDED.module_cible,
    type_acte = EXCLUDED.type_acte,
    tarif_base = EXCLUDED.tarif_base,
    unite = EXCLUDED.unite,
    actif = true,
    facturable = true;

-- Supprimer la fonction temporaire
DROP FUNCTION IF EXISTS get_categorie_labo(TEXT, TEXT);

COMMENT ON TABLE exam_catalog IS 'Catalogue centralisé des examens et actes réalisables (laboratoire, imagerie, etc.) - Mis à jour avec les tarifs du laboratoire';
