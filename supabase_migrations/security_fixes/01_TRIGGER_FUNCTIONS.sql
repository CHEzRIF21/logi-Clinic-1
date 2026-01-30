-- ============================================
-- LOT 1: Fonctions TRIGGER (6 fonctions)
-- Exécuter ce fichier via Supabase Dashboard > SQL Editor
-- ============================================

-- 1. set_user_custom_permissions_updated_at
CREATE OR REPLACE FUNCTION set_user_custom_permissions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. update_account_recovery_requests_updated_at
CREATE OR REPLACE FUNCTION update_account_recovery_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. update_ticket_on_payment
CREATE OR REPLACE FUNCTION update_ticket_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tickets_facturation
  SET updated_at = NOW()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

-- 4. update_facture_montant_restant
CREATE OR REPLACE FUNCTION update_facture_montant_restant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE factures
  SET 
    montant_paye = COALESCE((
      SELECT SUM(montant) 
      FROM paiements 
      WHERE facture_id = NEW.facture_id
    ), 0),
    montant_restant = montant_total - COALESCE((
      SELECT SUM(montant) 
      FROM paiements 
      WHERE facture_id = NEW.facture_id
    ), 0),
    updated_at = NOW()
  WHERE id = NEW.facture_id;
  RETURN NEW;
END;
$$;

-- 5. update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 6. update_user_custom_permissions_updated_at
CREATE OR REPLACE FUNCTION update_user_custom_permissions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 7. update_consultation_from_invoice
CREATE OR REPLACE FUNCTION update_consultation_from_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.consultation_id IS NOT NULL THEN
    PERFORM update_consultation_payment_status(NEW.consultation_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 8. trigger_update_actes_on_facture_payment
CREATE OR REPLACE FUNCTION trigger_update_actes_on_facture_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM update_actes_on_payment(NEW.facture_id);
  RETURN NEW;
END;
$$;

-- 9. decrement_stock_on_facture_status_update
CREATE OR REPLACE FUNCTION decrement_stock_on_facture_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.statut = 'payee' AND OLD.statut != 'payee' THEN
    IF NEW.service_origine = 'pharmacie' AND NEW.reference_origine IS NOT NULL THEN
      PERFORM decrement_stock_on_prescription_payment(NEW.reference_origine::UUID);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

SELECT 'LOT 1 TERMINÉ: 9 fonctions TRIGGER corrigées' as status;
