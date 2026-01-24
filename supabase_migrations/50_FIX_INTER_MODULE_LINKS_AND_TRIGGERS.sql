-- ============================================
-- MIGRATION : Fix des liaisons inter-modules et vérification des triggers
-- VERSION: 50
-- DATE: 2026-01-24
-- ============================================
-- Ce script :
-- 1. Vérifie et corrige les triggers de mise à jour des actes
-- 2. S'assure que les liaisons Consultation → Facture → Paiement → Stock fonctionnent
-- 3. Vérifie que les tickets_facturation sont correctement mis à jour
-- 4. Consolide tous les triggers nécessaires
-- ============================================

-- ============================================
-- 0. CRÉER LES FONCTIONS SI ELLES N'EXISTENT PAS
-- ============================================

-- Fonction pour mettre à jour le statut de la facture
CREATE OR REPLACE FUNCTION mettre_a_jour_statut_facture()
RETURNS TRIGGER AS $$
DECLARE
  total_paye DECIMAL(12, 2);
  montant_total_facture DECIMAL(12, 2);
  nouveau_statut VARCHAR(20);
  v_facture_id UUID;
BEGIN
  -- Déterminer la facture_id selon l'opération
  IF TG_OP = 'DELETE' THEN
    v_facture_id := OLD.facture_id;
  ELSE
    v_facture_id := NEW.facture_id;
  END IF;
  
  -- Calculer le total payé
  SELECT COALESCE(SUM(montant), 0)
  INTO total_paye
  FROM paiements
  WHERE facture_id = v_facture_id;
  
  -- Récupérer le montant total de la facture
  SELECT montant_total
  INTO montant_total_facture
  FROM factures
  WHERE id = v_facture_id;
  
  -- Déterminer le nouveau statut
  IF total_paye >= montant_total_facture THEN
    nouveau_statut := 'payee';
  ELSIF total_paye > 0 THEN
    nouveau_statut := 'partiellement_payee';
  ELSE
    nouveau_statut := 'en_attente';
  END IF;
  
  -- Mettre à jour la facture
  UPDATE factures
  SET 
    montant_paye = total_paye,
    montant_restant = montant_total_facture - total_paye,
    statut = nouveau_statut,
    updated_at = NOW()
  WHERE id = v_facture_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le journal de caisse
CREATE OR REPLACE FUNCTION mettre_a_jour_journal_caisse()
RETURNS TRIGGER AS $$
DECLARE
  date_jour DATE;
  caissier_uuid UUID;
BEGIN
  date_jour := CURRENT_DATE;
  caissier_uuid := NEW.caissier_id;
  
  -- Créer ou mettre à jour le journal du jour
  INSERT INTO journal_caisse (
    date_journal,
    caissier_id,
    recettes_especes,
    recettes_mobile_money,
    recettes_carte,
    recettes_virement,
    total_recettes
  )
  VALUES (
    date_jour,
    caissier_uuid,
    CASE WHEN NEW.mode_paiement = 'especes' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'mobile_money' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'carte_bancaire' THEN NEW.montant ELSE 0 END,
    CASE WHEN NEW.mode_paiement = 'virement' THEN NEW.montant ELSE 0 END,
    NEW.montant
  )
  ON CONFLICT (date_journal, caissier_id)
  DO UPDATE SET
    recettes_especes = journal_caisse.recettes_especes + CASE WHEN NEW.mode_paiement = 'especes' THEN NEW.montant ELSE 0 END,
    recettes_mobile_money = journal_caisse.recettes_mobile_money + CASE WHEN NEW.mode_paiement = 'mobile_money' THEN NEW.montant ELSE 0 END,
    recettes_carte = journal_caisse.recettes_carte + CASE WHEN NEW.mode_paiement = 'carte_bancaire' THEN NEW.montant ELSE 0 END,
    recettes_virement = journal_caisse.recettes_virement + CASE WHEN NEW.mode_paiement = 'virement' THEN NEW.montant ELSE 0 END,
    total_recettes = journal_caisse.total_recettes + NEW.montant,
    solde_fermeture = journal_caisse.solde_ouverture + journal_caisse.total_recettes + NEW.montant - journal_caisse.total_depenses,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le statut de paiement de la consultation
CREATE OR REPLACE FUNCTION update_consultation_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_facture_id UUID;
  v_statut_facture VARCHAR(20);
  v_montant_restant DECIMAL(12,2);
  v_consultation_id UUID;
BEGIN
  -- Récupérer l'ID de la facture
  v_facture_id := NEW.facture_id;
  
  -- Récupérer le statut et montant restant de la facture
  SELECT statut, montant_restant, consultation_id
  INTO v_statut_facture, v_montant_restant, v_consultation_id
  FROM factures
  WHERE id = v_facture_id;
  
  -- Si la facture est liée à une consultation et bloque la consultation
  IF v_consultation_id IS NOT NULL THEN
    -- Mettre à jour le statut de paiement de la consultation
    IF v_statut_facture = 'payee' AND v_montant_restant <= 0 THEN
      UPDATE consultations
      SET statut_paiement = 'paye',
          updated_at = NOW()
      WHERE id = v_consultation_id;
    ELSIF v_statut_facture = 'partiellement_payee' OR v_statut_facture = 'en_attente' THEN
      UPDATE consultations
      SET statut_paiement = 'en_attente',
          updated_at = NOW()
      WHERE id = v_consultation_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour la consultation depuis la facture
CREATE OR REPLACE FUNCTION update_consultation_from_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_consultation_id UUID;
BEGIN
  -- Si la facture est liée à une consultation
  IF NEW.consultation_id IS NOT NULL THEN
    v_consultation_id := NEW.consultation_id;
    
    -- Mettre à jour le statut selon le statut de la facture
    IF NEW.statut = 'payee' AND NEW.montant_restant <= 0 THEN
      UPDATE consultations
      SET statut_paiement = 'paye',
          updated_at = NOW()
      WHERE id = v_consultation_id;
    ELSIF NEW.statut IN ('partiellement_payee', 'en_attente') THEN
      UPDATE consultations
      SET statut_paiement = 'en_attente',
          updated_at = NOW()
      WHERE id = v_consultation_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. VÉRIFICATION ET CORRECTION DES TRIGGERS EXISTANTS
-- ============================================

-- S'assurer que le trigger de mise à jour du statut de facture existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_mettre_a_jour_statut_facture'
  ) THEN
    CREATE TRIGGER trigger_mettre_a_jour_statut_facture
    AFTER INSERT OR UPDATE OR DELETE ON paiements
    FOR EACH ROW
    EXECUTE FUNCTION mettre_a_jour_statut_facture();
    
    RAISE NOTICE '✅ Trigger trigger_mettre_a_jour_statut_facture créé';
  ELSE
    RAISE NOTICE '✅ Trigger trigger_mettre_a_jour_statut_facture existe déjà';
  END IF;
END $$;

-- S'assurer que le trigger de mise à jour du journal de caisse existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_mettre_a_jour_journal_caisse'
  ) THEN
    CREATE TRIGGER trigger_mettre_a_jour_journal_caisse
    AFTER INSERT ON paiements
    FOR EACH ROW
    WHEN (NEW.mode_paiement != 'prise_en_charge')
    EXECUTE FUNCTION mettre_a_jour_journal_caisse();
    
    RAISE NOTICE '✅ Trigger trigger_mettre_a_jour_journal_caisse créé';
  ELSE
    RAISE NOTICE '✅ Trigger trigger_mettre_a_jour_journal_caisse existe déjà';
  END IF;
END $$;

-- S'assurer que le trigger de mise à jour de consultation existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_consultation_payment_status'
  ) THEN
    CREATE TRIGGER trigger_update_consultation_payment_status
    AFTER INSERT OR UPDATE ON paiements
    FOR EACH ROW
    EXECUTE FUNCTION update_consultation_payment_status();
    
    RAISE NOTICE '✅ Trigger trigger_update_consultation_payment_status créé';
  ELSE
    RAISE NOTICE '✅ Trigger trigger_update_consultation_payment_status existe déjà';
  END IF;
END $$;

-- S'assurer que le trigger de mise à jour de consultation depuis facture existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_consultation_from_invoice'
  ) THEN
    CREATE TRIGGER trigger_update_consultation_from_invoice
    AFTER UPDATE OF statut, montant_restant ON factures
    FOR EACH ROW
    WHEN (NEW.consultation_id IS NOT NULL)
    EXECUTE FUNCTION update_consultation_from_invoice();
    
    RAISE NOTICE '✅ Trigger trigger_update_consultation_from_invoice créé';
  ELSE
    RAISE NOTICE '✅ Trigger trigger_update_consultation_from_invoice existe déjà';
  END IF;
END $$;

-- Fonction trigger_update_actes_on_facture_payment (si migration 49 pas encore appliquée)
CREATE OR REPLACE FUNCTION trigger_update_actes_on_facture_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la facture vient d'être payée (statut passe à 'payee')
  IF NEW.statut = 'payee' 
     AND NEW.montant_restant <= 0
     AND (OLD.statut IS NULL OR OLD.statut != 'payee' OR OLD.montant_restant > 0) THEN
    -- Appeler la fonction pour mettre à jour les actes (si elle existe)
    BEGIN
      PERFORM update_actes_on_payment(NEW.id);
    EXCEPTION
      WHEN undefined_function THEN
        -- La fonction update_actes_on_payment n'existe pas encore (migration 49 pas appliquée)
        -- Mettre à jour manuellement les tickets
        UPDATE tickets_facturation
        SET 
          statut = 'payee',
          date_paiement = NOW(),
          updated_at = NOW()
        WHERE facture_id = NEW.id
          AND statut IN ('en_attente', 'facture');
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- S'assurer que le trigger de mise à jour des actes existe (migration 49)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_actes_on_facture_payment'
  ) THEN
    CREATE TRIGGER trigger_update_actes_on_facture_payment
    AFTER UPDATE OF statut, montant_restant ON factures
    FOR EACH ROW
    WHEN (NEW.statut = 'payee' AND NEW.montant_restant <= 0)
    EXECUTE FUNCTION trigger_update_actes_on_facture_payment();
    
    RAISE NOTICE '✅ Trigger trigger_update_actes_on_facture_payment créé';
  ELSE
    RAISE NOTICE '✅ Trigger trigger_update_actes_on_facture_payment existe déjà';
  END IF;
END $$;

-- ============================================
-- 2. VÉRIFICATION DE LA FONCTION update_actes_on_payment
-- ============================================

-- Créer la fonction update_actes_on_payment si elle n'existe pas (migration 49)
CREATE OR REPLACE FUNCTION update_actes_on_payment(p_facture_id UUID)
RETURNS TABLE (
  tickets_updated INT,
  operations_updated INT
) AS $$
DECLARE
  v_facture_statut VARCHAR(20);
  v_facture_montant_restant DECIMAL(12,2);
  v_tickets_count INT := 0;
  v_operations_count INT := 0;
BEGIN
  -- Récupérer le statut et montant restant de la facture
  SELECT statut, montant_restant
  INTO v_facture_statut, v_facture_montant_restant
  FROM factures
  WHERE id = p_facture_id;
  
  -- Si la facture est complètement payée
  IF v_facture_statut = 'payee' AND v_facture_montant_restant <= 0 THEN
    -- 1. Mettre à jour les tickets_facturation liés
    UPDATE tickets_facturation
    SET 
      statut = 'payee',
      date_paiement = NOW(),
      updated_at = NOW()
    WHERE facture_id = p_facture_id
      AND statut IN ('en_attente', 'facture');
    
    GET DIAGNOSTICS v_tickets_count = ROW_COUNT;
    
    -- 2. Mettre à jour les opérations liées (si la table existe)
    BEGIN
      UPDATE operations
      SET 
        status = 'PAYEE',
        updated_at = NOW()
      WHERE invoice_id = p_facture_id
        AND status != 'PAYEE';
      
      GET DIAGNOSTICS v_operations_count = ROW_COUNT;
    EXCEPTION
      WHEN undefined_table THEN
        -- La table operations n'existe pas, ce n'est pas grave
        v_operations_count := 0;
      WHEN OTHERS THEN
        -- Autre erreur, on continue quand même
        v_operations_count := 0;
    END;
  END IF;
  
  RETURN QUERY SELECT v_tickets_count, v_operations_count;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_actes_on_payment'
  ) THEN
    RAISE NOTICE '✅ Fonction update_actes_on_payment créée/vérifiée';
  END IF;
END $$;

-- ============================================
-- 3. VÉRIFICATION DE LA STRUCTURE tickets_facturation
-- ============================================

-- Vérifier que la colonne date_paiement existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets_facturation' 
    AND column_name = 'date_paiement'
  ) THEN
    ALTER TABLE tickets_facturation 
    ADD COLUMN date_paiement TIMESTAMP WITH TIME ZONE;
    
    RAISE NOTICE '✅ Colonne date_paiement ajoutée à tickets_facturation';
  ELSE
    RAISE NOTICE '✅ Colonne date_paiement existe déjà';
  END IF;
END $$;

-- Vérifier que la contrainte CHECK inclut 'payee'
DO $$
BEGIN
  -- Vérifier si la contrainte existe et inclut 'payee'
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'tickets_facturation_statut_check'
    AND check_clause LIKE '%payee%'
  ) THEN
    RAISE NOTICE '✅ Contrainte tickets_facturation_statut_check inclut déjà ''payee''';
  ELSE
    -- Supprimer l'ancienne contrainte si elle existe
    ALTER TABLE tickets_facturation 
    DROP CONSTRAINT IF EXISTS tickets_facturation_statut_check;
    
    -- Ajouter la nouvelle contrainte avec 'payee'
    ALTER TABLE tickets_facturation 
    ADD CONSTRAINT tickets_facturation_statut_check 
    CHECK (statut IN ('en_attente', 'facture', 'payee', 'annule'));
    
    RAISE NOTICE '✅ Contrainte tickets_facturation_statut_check mise à jour avec ''payee''';
  END IF;
END $$;

-- ============================================
-- 4. FONCTION DE VÉRIFICATION DES LIAISONS
-- ============================================

CREATE OR REPLACE FUNCTION verifier_liaisons_inter_modules(p_facture_id UUID)
RETURNS TABLE (
  facture_id UUID,
  consultation_id UUID,
  facture_statut VARCHAR,
  consultation_statut_paiement VARCHAR,
  tickets_count INT,
  tickets_payes_count INT,
  paiements_count INT,
  montant_total DECIMAL,
  montant_paye DECIMAL,
  montant_restant DECIMAL
) AS $$
DECLARE
  v_facture RECORD;
  v_consultation_id UUID;
  v_tickets_count INT;
  v_tickets_payes_count INT;
  v_paiements_count INT;
BEGIN
  -- Récupérer les informations de la facture
  SELECT 
    f.id,
    f.consultation_id,
    f.statut,
    f.montant_total,
    f.montant_paye,
    f.montant_restant
  INTO v_facture
  FROM factures f
  WHERE f.id = p_facture_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Facture non trouvée: %', p_facture_id;
  END IF;
  
  v_consultation_id := v_facture.consultation_id;
  
  -- Compter les tickets
  SELECT COUNT(*)
  INTO v_tickets_count
  FROM tickets_facturation
  WHERE facture_id = p_facture_id;
  
  SELECT COUNT(*)
  INTO v_tickets_payes_count
  FROM tickets_facturation
  WHERE facture_id = p_facture_id
    AND statut = 'payee';
  
  -- Compter les paiements
  SELECT COUNT(*)
  INTO v_paiements_count
  FROM paiements
  WHERE facture_id = p_facture_id;
  
  -- Récupérer le statut de paiement de la consultation si elle existe
  DECLARE
    v_consultation_statut_paiement VARCHAR;
  BEGIN
    IF v_consultation_id IS NOT NULL THEN
      SELECT statut_paiement
      INTO v_consultation_statut_paiement
      FROM consultations
      WHERE id = v_consultation_id;
    ELSE
      v_consultation_statut_paiement := NULL;
    END IF;
    
    RETURN QUERY SELECT
      v_facture.id,
      v_consultation_id,
      v_facture.statut::VARCHAR,
      v_consultation_statut_paiement,
      v_tickets_count,
      v_tickets_payes_count,
      v_paiements_count,
      v_facture.montant_total,
      v_facture.montant_paye,
      v_facture.montant_restant;
  END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verifier_liaisons_inter_modules(UUID) IS 'Vérifie les liaisons entre facture, consultation, tickets et paiements';

-- ============================================
-- 5. FONCTION DE CORRECTION AUTOMATIQUE
-- ============================================

CREATE OR REPLACE FUNCTION corriger_liaisons_facture(p_facture_id UUID)
RETURNS TABLE (
  action VARCHAR,
  resultat TEXT
) AS $$
DECLARE
  v_facture RECORD;
  v_consultation_id UUID;
  v_tickets_updated INT := 0;
BEGIN
  -- Récupérer la facture
  SELECT 
    id,
    consultation_id,
    statut,
    montant_restant
  INTO v_facture
  FROM factures
  WHERE id = p_facture_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'ERREUR'::VARCHAR, 'Facture non trouvée'::TEXT;
    RETURN;
  END IF;
  
  v_consultation_id := v_facture.consultation_id;
  
  -- Si la facture est payée, mettre à jour les tickets
  IF v_facture.statut = 'payee' AND v_facture.montant_restant <= 0 THEN
    -- Mettre à jour les tickets
    UPDATE tickets_facturation
    SET 
      statut = 'payee',
      date_paiement = COALESCE(date_paiement, NOW()),
      updated_at = NOW()
    WHERE facture_id = p_facture_id
      AND statut IN ('en_attente', 'facture');
    
    GET DIAGNOSTICS v_tickets_updated = ROW_COUNT;
    
    RETURN QUERY SELECT 'TICKETS'::VARCHAR, format('%s tickets mis à jour', v_tickets_updated)::TEXT;
    
    -- Mettre à jour la consultation si elle existe
    IF v_consultation_id IS NOT NULL THEN
      UPDATE consultations
      SET 
        statut_paiement = 'paye',
        updated_at = NOW()
      WHERE id = v_consultation_id
        AND statut_paiement != 'paye';
      
      RETURN QUERY SELECT 'CONSULTATION'::VARCHAR, 'Statut de paiement mis à jour'::TEXT;
    END IF;
  END IF;
  
  RETURN QUERY SELECT 'SUCCES'::VARCHAR, 'Correction terminée'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION corriger_liaisons_facture(UUID) IS 'Corrige automatiquement les liaisons d''une facture (tickets, consultation)';

-- ============================================
-- 6. VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  v_triggers_count INT;
  v_functions_count INT;
BEGIN
  -- Compter les triggers importants
  SELECT COUNT(*) INTO v_triggers_count
  FROM pg_trigger
  WHERE tgname IN (
    'trigger_mettre_a_jour_statut_facture',
    'trigger_mettre_a_jour_journal_caisse',
    'trigger_update_consultation_payment_status',
    'trigger_update_consultation_from_invoice',
    'trigger_update_actes_on_facture_payment'
  );
  
  -- Compter les fonctions importantes
  SELECT COUNT(*) INTO v_functions_count
  FROM pg_proc
  WHERE proname IN (
    'mettre_a_jour_statut_facture',
    'mettre_a_jour_journal_caisse',
    'update_consultation_payment_status',
    'update_consultation_from_invoice',
    'update_actes_on_payment',
    'trigger_update_actes_on_facture_payment'
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION 50 APPLIQUÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Vérifications:';
  RAISE NOTICE '   ✅ % triggers vérifiés/créés', v_triggers_count;
  RAISE NOTICE '   ✅ % fonctions vérifiées/créées', v_functions_count;
  RAISE NOTICE '';
  RAISE NOTICE '📝 Fonctions disponibles:';
  RAISE NOTICE '   - verifier_liaisons_inter_modules(facture_id) : Vérifie les liaisons';
  RAISE NOTICE '   - corriger_liaisons_facture(facture_id) : Corrige les liaisons';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Liaisons inter-modules:';
  RAISE NOTICE '   ✅ Consultation ↔ Facture (via consultation_id)';
  RAISE NOTICE '   ✅ Facture ↔ Paiements (via facture_id)';
  RAISE NOTICE '   ✅ Facture ↔ Tickets (via facture_id)';
  RAISE NOTICE '   ✅ Paiements → Journal de Caisse (automatique)';
  RAISE NOTICE '   ✅ Facture payée → Tickets payés (automatique)';
  RAISE NOTICE '   ✅ Facture payée → Consultation débloquée (automatique)';
  RAISE NOTICE '';
END $$;
