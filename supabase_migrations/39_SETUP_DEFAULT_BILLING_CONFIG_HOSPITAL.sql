-- ============================================
-- Migration 39: Configuration Facturation par Défaut pour Hôpital
-- Date: 2024-12-20
-- Description: Configuration des paramètres de facturation par défaut pour un hôpital multi-services
-- ============================================

-- Insérer ou mettre à jour les configurations de facturation pour toutes les cliniques existantes
-- Configuration optimale pour un hôpital multi-services

INSERT INTO configurations_facturation (
  clinic_id,
  paiement_obligatoire_avant_consultation,
  blocage_automatique_impaye,
  paiement_plusieurs_temps,
  exception_urgence_medecin,
  actes_defaut_consultation,
  actes_defaut_dossier,
  actes_defaut_urgence,
  created_at,
  updated_at
)
SELECT 
  c.id AS clinic_id,
  true AS paiement_obligatoire_avant_consultation,  -- Paiement obligatoire activé
  true AS blocage_automatique_impaye,                -- Blocage automatique des impayés
  true AS paiement_plusieurs_temps,                  -- Permettre paiements multiples
  true AS exception_urgence_medecin,                 -- Admin + Médecin peuvent autoriser urgences
  '["CONS-GEN", "DOSSIER"]'::jsonb AS actes_defaut_consultation,  -- Actes par défaut
  true AS actes_defaut_dossier,                       -- Inclure dossier par défaut
  true AS actes_defaut_urgence,                       -- Inclure urgence si cochée
  NOW() AS created_at,
  NOW() AS updated_at
FROM clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM configurations_facturation cf 
  WHERE cf.clinic_id = c.id
)
ON CONFLICT (clinic_id) 
DO UPDATE SET
  paiement_obligatoire_avant_consultation = EXCLUDED.paiement_obligatoire_avant_consultation,
  blocage_automatique_impaye = EXCLUDED.blocage_automatique_impaye,
  paiement_plusieurs_temps = EXCLUDED.paiement_plusieurs_temps,
  exception_urgence_medecin = EXCLUDED.exception_urgence_medecin,
  actes_defaut_consultation = EXCLUDED.actes_defaut_consultation,
  actes_defaut_dossier = EXCLUDED.actes_defaut_dossier,
  actes_defaut_urgence = EXCLUDED.actes_defaut_urgence,
  updated_at = NOW();

-- Commentaire
COMMENT ON TABLE configurations_facturation IS 'Configuration des paramètres de facturation par clinique - Configuré pour hôpital multi-services avec paiement obligatoire et exceptions urgence';

