-- Migration: Création des fiches de consultation spécialisées
-- Date: 2025-01-XX
-- Description: Templates pour les différentes spécialités (MG, Gynéco, Ophtalmo, Uro, Dermato, Pédiatrie)

-- ============================================
-- FICHES DE CONSULTATION SPÉCIALISÉES
-- ============================================

-- 1. Médecine Générale (Standard)
INSERT INTO consultation_templates (nom, specialite, description, sections, champs, actif)
VALUES (
  'Fiche Standard',
  'Médecine générale',
  'Fiche de consultation standard pour médecine générale',
  '["constantes", "anamnese", "examens_cliniques", "diagnostics", "prescriptions"]'::jsonb,
  '[
    {"section": "constantes", "key": "taille", "type": "number", "label": "Taille (cm)", "required": false},
    {"section": "constantes", "key": "poids", "type": "number", "label": "Poids (kg)", "required": false},
    {"section": "constantes", "key": "temperature", "type": "number", "label": "Température (°C)", "required": false},
    {"section": "constantes", "key": "pouls", "type": "number", "label": "Pouls (bpm)", "required": false},
    {"section": "constantes", "key": "ta_systolique", "type": "number", "label": "TA Systolique", "required": false},
    {"section": "constantes", "key": "ta_diastolique", "type": "number", "label": "TA Diastolique", "required": false}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- 2. Gynécologie/Obstétrique
INSERT INTO consultation_templates (nom, specialite, description, sections, champs, actif)
VALUES (
  'Fiche Gynéco',
  'Gynécologie',
  'Fiche de consultation gynécologique et obstétricale',
  '["constantes", "anamnese", "examens_cliniques", "diagnostics", "prescriptions"]'::jsonb,
  '[
    {"section": "constantes", "key": "taille", "type": "number", "label": "Taille (cm)", "required": false},
    {"section": "constantes", "key": "poids", "type": "number", "label": "Poids (kg)", "required": false},
    {"section": "constantes", "key": "hauteur_uterine", "type": "number", "label": "Hauteur utérine (cm)", "required": false},
    {"section": "constantes", "key": "ta_systolique", "type": "number", "label": "TA Systolique", "required": false},
    {"section": "constantes", "key": "ta_diastolique", "type": "number", "label": "TA Diastolique", "required": false},
    {"section": "examens_cliniques", "key": "examen_pelvien", "type": "textarea", "label": "Examen pelvien", "required": false},
    {"section": "examens_cliniques", "key": "examen_mammaire", "type": "textarea", "label": "Examen mammaire", "required": false}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- 3. Ophtalmologie
INSERT INTO consultation_templates (nom, specialite, description, sections, champs, actif)
VALUES (
  'Fiche Ophtalmo',
  'Ophtalmologie',
  'Fiche de consultation ophtalmologique',
  '["constantes", "anamnese", "examens_cliniques", "diagnostics", "prescriptions"]'::jsonb,
  '[
    {"section": "examens_cliniques", "key": "acuite_visuelle_od", "type": "text", "label": "Acuité visuelle OD", "required": false},
    {"section": "examens_cliniques", "key": "acuite_visuelle_og", "type": "text", "label": "Acuité visuelle OG", "required": false},
    {"section": "examens_cliniques", "key": "tonometrie_od", "type": "number", "label": "Tonométrie OD (mmHg)", "required": false},
    {"section": "examens_cliniques", "key": "tonometrie_og", "type": "number", "label": "Tonométrie OG (mmHg)", "required": false},
    {"section": "examens_cliniques", "key": "fond_oeil", "type": "textarea", "label": "Fond d''œil", "required": false}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- 4. Urologie
INSERT INTO consultation_templates (nom, specialite, description, sections, champs, actif)
VALUES (
  'Fiche Uro',
  'Urologie',
  'Fiche de consultation urologique',
  '["constantes", "anamnese", "examens_cliniques", "diagnostics", "prescriptions"]'::jsonb,
  '[
    {"section": "examens_cliniques", "key": "examen_abdominal", "type": "textarea", "label": "Examen abdominal", "required": false},
    {"section": "examens_cliniques", "key": "examen_genital", "type": "textarea", "label": "Examen génital", "required": false},
    {"section": "examens_cliniques", "key": "toucher_rectal", "type": "textarea", "label": "Toucher rectal", "required": false}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- 5. Dermatologie
INSERT INTO consultation_templates (nom, specialite, description, sections, champs, actif)
VALUES (
  'Fiche JD',
  'Dermatologie',
  'Fiche de consultation dermatologique',
  '["constantes", "anamnese", "examens_cliniques", "diagnostics", "prescriptions"]'::jsonb,
  '[
    {"section": "examens_cliniques", "key": "localisation_lesion", "type": "text", "label": "Localisation des lésions", "required": false},
    {"section": "examens_cliniques", "key": "aspect_lesion", "type": "textarea", "label": "Aspect des lésions", "required": false},
    {"section": "examens_cliniques", "key": "examen_complet_peau", "type": "textarea", "label": "Examen complet de la peau", "required": false}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- 6. Pédiatrie
INSERT INTO consultation_templates (nom, specialite, description, sections, champs, actif)
VALUES (
  'Fiche Pédiatrie',
  'Pédiatrie',
  'Fiche de consultation pédiatrique',
  '["constantes", "anamnese", "examens_cliniques", "diagnostics", "prescriptions"]'::jsonb,
  '[
    {"section": "constantes", "key": "taille", "type": "number", "label": "Taille (cm)", "required": false},
    {"section": "constantes", "key": "poids", "type": "number", "label": "Poids (kg)", "required": false},
    {"section": "constantes", "key": "perimetre_cranien", "type": "number", "label": "Périmètre crânien (cm)", "required": false},
    {"section": "constantes", "key": "temperature", "type": "number", "label": "Température (°C)", "required": false},
    {"section": "examens_cliniques", "key": "examen_neuro", "type": "textarea", "label": "Examen neurologique", "required": false},
    {"section": "examens_cliniques", "key": "developpement_psychomoteur", "type": "textarea", "label": "Développement psychomoteur", "required": false}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- 7. CPN (Consultation Prénatale)
INSERT INTO consultation_templates (nom, specialite, description, sections, champs, actif)
VALUES (
  'Fiche CPN',
  'Gynécologie',
  'Fiche de consultation prénatale',
  '["constantes", "anamnese", "examens_cliniques", "diagnostics", "prescriptions"]'::jsonb,
  '[
    {"section": "constantes", "key": "taille", "type": "number", "label": "Taille (cm)", "required": false},
    {"section": "constantes", "key": "poids", "type": "number", "label": "Poids (kg)", "required": false},
    {"section": "constantes", "key": "hauteur_uterine", "type": "number", "label": "Hauteur utérine (cm)", "required": true},
    {"section": "constantes", "key": "ta_systolique", "type": "number", "label": "TA Systolique", "required": true},
    {"section": "constantes", "key": "ta_diastolique", "type": "number", "label": "TA Diastolique", "required": true},
    {"section": "examens_cliniques", "key": "battements_foetaux", "type": "text", "label": "Battements fœtaux", "required": false},
    {"section": "examens_cliniques", "key": "presentation", "type": "text", "label": "Présentation", "required": false}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- Commentaires
COMMENT ON TABLE consultation_templates IS 'Templates de fiches de consultation par spécialité';
COMMENT ON COLUMN consultation_templates.sections IS 'Liste des sections disponibles (constantes, anamnese, examens_cliniques, diagnostics, prescriptions)';
COMMENT ON COLUMN consultation_templates.champs IS 'Champs personnalisés par section avec type, label, validation';

