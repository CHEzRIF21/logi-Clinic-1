-- ============================================
-- Migration 91: Recréer la vue public.factures_en_attente
-- Objectif : s'assurer que la vue inclut bien clinic_id et respecte
-- l'isolation des données par clinique, conformément aux règles multi-tenant.
-- La définition ci-dessous est alignée avec l'état actuel de la base.
-- ============================================

CREATE OR REPLACE VIEW public.factures_en_attente AS
SELECT
  id,
  numero_facture,
  patient_id,
  date_facture,
  date_echeance,
  montant_ht,
  montant_tva,
  montant_remise,
  montant_total,
  montant_paye,
  montant_restant,
  statut,
  type_facture,
  numero_fiscal,
  qr_code,
  identifiant_contribuable,
  consultation_id,
  service_origine,
  reference_externe,
  caissier_id,
  notes,
  created_at,
  updated_at,
  clinic_id
FROM factures f
WHERE
  statut::text = ANY (
    ARRAY[
      'en_attente'::character varying,
      'partiellement_payee'::character varying
    ]::text[]
  )
  AND montant_restant > 0::numeric;

