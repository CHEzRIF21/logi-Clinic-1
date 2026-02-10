-- ============================================
-- Migration 93: Mettre à jour la fonction mettre_a_jour_journal_caisse
-- Objectif : utiliser les nouvelles colonnes de journal_caisse
-- (recettes_orange_money, recettes_mtn_mobile_money, recettes_moov_money,
--  recettes_wave, recettes_flooz, recettes_t_money, etc.) au lieu de
-- l'ancienne colonne unique recettes_mobile_money.
-- Compatibilité:
--  - Gère les nouveaux modes: 'orange_money', 'mtn_mobile_money',
--    'moov_money', 'wave', 'flooz', 't_money', 'carte_bancaire',
--    'virement', 'cheque', 'prise_en_charge'.
--  - Garde un fallback pour l'ancien mode 'mobile_money' en le
--    mappant sur recettes_mtn_mobile_money.
-- Isolation:
--  - Le journal est toujours partitionné par clinic_id et conserve
--    la contrainte (date_journal, caissier_id, clinic_id) UNIQUE.
-- ============================================

CREATE OR REPLACE FUNCTION public.mettre_a_jour_journal_caisse()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  date_jour DATE;
  caissier_uuid UUID;
BEGIN
  date_jour := CURRENT_DATE;
  caissier_uuid := NEW.caissier_id;

  -- Créer ou mettre à jour le journal du jour pour la clinique de l'utilisateur
  INSERT INTO public.journal_caisse (
    date_journal,
    caissier_id,
    recettes_especes,
    recettes_orange_money,
    recettes_mtn_mobile_money,
    recettes_moov_money,
    recettes_wave,
    recettes_flooz,
    recettes_t_money,
    recettes_carte,
    recettes_virement,
    recettes_cheque,
    recettes_prise_en_charge,
    recettes_autres,
    total_recettes,
    clinic_id
  )
  VALUES (
    date_jour,
    caissier_uuid,
    CASE WHEN NEW.mode_paiement = 'especes' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'orange_money' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement IN ('mtn_mobile_money', 'mobile_money') THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'moov_money' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'wave' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'flooz' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 't_money' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'carte_bancaire' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'virement' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'cheque' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'prise_en_charge' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement NOT IN ('especes','orange_money','mtn_mobile_money','moov_money','wave','flooz','t_money','carte_bancaire','virement','cheque','prise_en_charge','mobile_money') THEN NEW.montant ELSE 0 END,
    NEW.montant,
    NEW.clinic_id
  )
  ON CONFLICT (date_journal, caissier_id, clinic_id)
  DO UPDATE SET
    recettes_especes = journal_caisse.recettes_especes + CASE WHEN NEW.mode_paiement = 'especes' THEN NEW.montant ELSE 0 END,
    recettes_orange_money = journal_caisse.recettes_orange_money + CASE WHEN NEW.mode_paiement = 'orange_money' THEN NEW.montant ELSE 0 END,
    recettes_mtn_mobile_money = journal_caisse.recettes_mtn_mobile_money + CASE WHEN NEW.mode_paiement IN ('mtn_mobile_money', 'mobile_money') THEN NEW.montant ELSE 0 END,
    recettes_moov_money = journal_caisse.recettes_moov_money + CASE WHEN NEW.mode_paiement = 'moov_money' THEN NEW.montant ELSE 0 END,
    recettes_wave = journal_caisse.recettes_wave + CASE WHEN NEW.mode_paiement = 'wave' THEN NEW.montant ELSE 0 END,
    recettes_flooz = journal_caisse.recettes_flooz + CASE WHEN NEW.mode_paiement = 'flooz' THEN NEW.montant ELSE 0 END,
    recettes_t_money = journal_caisse.recettes_t_money + CASE WHEN NEW.mode_paiement = 't_money' THEN NEW.montant ELSE 0 END,
    recettes_carte = journal_caisse.recettes_carte + CASE WHEN NEW.mode_paiement = 'carte_bancaire' THEN NEW.montant ELSE 0 END,
    recettes_virement = journal_caisse.recettes_virement + CASE WHEN NEW.mode_paiement = 'virement' THEN NEW.montant ELSE 0 END,
    recettes_cheque = journal_caisse.recettes_cheque + CASE WHEN NEW.mode_paiement = 'cheque' THEN NEW.montant ELSE 0 END,
    recettes_prise_en_charge = journal_caisse.recettes_prise_en_charge + CASE WHEN NEW.mode_paiement = 'prise_en_charge' THEN NEW.montant ELSE 0 END,
    recettes_autres = journal_caisse.recettes_autres + CASE WHEN NEW.mode_paiement NOT IN ('especes','orange_money','mtn_mobile_money','moov_money','wave','flooz','t_money','carte_bancaire','virement','cheque','prise_en_charge','mobile_money') THEN NEW.montant ELSE 0 END,
    total_recettes = journal_caisse.total_recettes + NEW.montant,
    solde_fermeture = journal_caisse.solde_ouverture + journal_caisse.total_recettes + NEW.montant - journal_caisse.total_depenses,
    updated_at = NOW();

  RETURN NEW;
END;
$function$;

