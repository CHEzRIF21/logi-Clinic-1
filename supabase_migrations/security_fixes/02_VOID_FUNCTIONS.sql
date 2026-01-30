-- ============================================
-- LOT 2: Fonctions RETURNS VOID (9 fonctions)
-- Exécuter ce fichier via Supabase Dashboard > SQL Editor
-- ============================================

-- 1. insert_role_permissions
CREATE OR REPLACE FUNCTION insert_role_permissions(
  p_role_code VARCHAR(50),
  p_module_name VARCHAR(50),
  p_actions TEXT[],
  p_submodules JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_item VARCHAR(20);
  submodule_item JSONB;
BEGIN
  FOREACH action_item IN ARRAY p_actions
  LOOP
    INSERT INTO default_role_permissions (role_code, module_name, permission_action)
    VALUES (p_role_code, p_module_name, action_item)
    ON CONFLICT (role_code, module_name, permission_action, submodule_name) DO NOTHING;
  END LOOP;

  IF p_submodules IS NOT NULL THEN
    FOR submodule_item IN SELECT * FROM jsonb_array_elements(p_submodules)
    LOOP
      FOREACH action_item IN ARRAY (SELECT ARRAY(SELECT jsonb_array_elements_text(submodule_item->'actions')))
      LOOP
        INSERT INTO default_role_permissions (role_code, module_name, permission_action, submodule_name)
        VALUES (p_role_code, p_module_name, action_item, submodule_item->>'submodule')
        ON CONFLICT (role_code, module_name, permission_action, submodule_name) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
END;
$$;

-- 2. log_user_login
CREATE OR REPLACE FUNCTION log_user_login(p_user_id UUID, p_clinic_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    clinic_id,
    action,
    details,
    created_at
  ) VALUES (
    p_user_id,
    p_clinic_id,
    'LOGIN',
    jsonb_build_object('timestamp', NOW()),
    NOW()
  );
END;
$$;

-- 3. log_user_activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_clinic_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    clinic_id,
    action,
    details,
    created_at
  ) VALUES (
    p_user_id,
    p_clinic_id,
    p_action,
    COALESCE(p_details, '{}'::jsonb),
    NOW()
  );
END;
$$;

-- 4. mettre_a_jour_statut_facture
CREATE OR REPLACE FUNCTION mettre_a_jour_statut_facture(p_facture_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_montant_total DECIMAL;
  v_montant_paye DECIMAL;
  v_montant_restant DECIMAL;
BEGIN
  SELECT montant_total, montant_paye, montant_restant
  INTO v_montant_total, v_montant_paye, v_montant_restant
  FROM factures
  WHERE id = p_facture_id;
  
  IF v_montant_restant <= 0 THEN
    UPDATE factures
    SET statut = 'payee', updated_at = NOW()
    WHERE id = p_facture_id;
  ELSIF v_montant_paye > 0 THEN
    UPDATE factures
    SET statut = 'partiellement_payee', updated_at = NOW()
    WHERE id = p_facture_id;
  END IF;
END;
$$;

-- 5. mettre_a_jour_journal_caisse
CREATE OR REPLACE FUNCTION mettre_a_jour_journal_caisse(
  p_ticket_id UUID,
  p_montant DECIMAL,
  p_type_paiement TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT clinic_id INTO v_clinic_id
  FROM tickets_facturation
  WHERE id = p_ticket_id;
  
  INSERT INTO journal_caisse (
    ticket_id,
    montant,
    type_paiement,
    clinic_id,
    created_at
  ) VALUES (
    p_ticket_id,
    p_montant,
    p_type_paiement,
    v_clinic_id,
    NOW()
  );
END;
$$;

-- 6. update_consultation_payment_status
CREATE OR REPLACE FUNCTION update_consultation_payment_status(p_consultation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE consultations
  SET 
    statut_paiement = CASE
      WHEN EXISTS (
        SELECT 1 FROM factures f
        JOIN paiements p ON p.facture_id = f.id
        WHERE f.consultation_id = p_consultation_id
        AND f.statut = 'payee'
      ) THEN 'paye'
      WHEN EXISTS (
        SELECT 1 FROM factures f
        JOIN paiements p ON p.facture_id = f.id
        WHERE f.consultation_id = p_consultation_id
        AND f.statut = 'partiellement_payee'
      ) THEN 'partiellement_paye'
      ELSE 'non_paye'
    END,
    updated_at = NOW()
  WHERE id = p_consultation_id;
END;
$$;

-- 7. update_actes_on_payment
CREATE OR REPLACE FUNCTION update_actes_on_payment(p_facture_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tickets_facturation
  SET statut = 'paye', updated_at = NOW()
  WHERE id IN (
    SELECT ticket_id FROM lignes_facture
    WHERE facture_id = p_facture_id
  );
END;
$$;

-- 8. decrementer_stock_lot
CREATE OR REPLACE FUNCTION decrementer_stock_lot(
  p_lot_id UUID,
  p_quantite INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE lots
  SET quantite_restante = quantite_restante - p_quantite,
      updated_at = NOW()
  WHERE id = p_lot_id
  AND quantite_restante >= p_quantite;
END;
$$;

-- 9. corriger_liaisons_facture
CREATE OR REPLACE FUNCTION corriger_liaisons_facture(p_facture_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE factures
  SET 
    consultation_id = COALESCE(consultation_id, (
      SELECT consultation_id FROM tickets_facturation
      WHERE id IN (SELECT ticket_id FROM lignes_facture WHERE facture_id = p_facture_id)
      LIMIT 1
    )),
    updated_at = NOW()
  WHERE id = p_facture_id;
END;
$$;

-- 10. decrement_stock_on_prescription_payment
CREATE OR REPLACE FUNCTION decrement_stock_on_prescription_payment(p_prescription_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ligne RECORD;
BEGIN
  FOR ligne IN 
    SELECT * FROM prescription_lines
    WHERE prescription_id = p_prescription_id
  LOOP
    PERFORM decrementer_stock_lot(ligne.lot_id, ligne.quantite);
  END LOOP;
END;
$$;

SELECT 'LOT 2 TERMINÉ: 10 fonctions VOID corrigées' as status;
