-- ============================================
-- Migration 94: Ajouter la colonne statut_paiement aux consultations
-- Objectif : aligner le schéma avec les triggers et services
-- (consultationBillingService, caisse, rapports) qui s'attendent
-- à suivre l'état de paiement par consultation.
--
-- Valeurs autorisées :
--  - 'non_facture'  : aucune facture liée
--  - 'en_attente'   : facture émise mais non soldée
--  - 'paye'         : facture entièrement payée
--  - 'exonere'      : exonération accordée
--
-- La migration est idempotente (ADD COLUMN IF NOT EXISTS) et
-- respecte l'isolation par clinic_id (aucun impact sur les RLS).
-- ============================================

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS statut_paiement VARCHAR(20)
    CHECK (statut_paiement IN ('non_facture', 'en_attente', 'paye', 'exonere'))
    DEFAULT 'non_facture';

