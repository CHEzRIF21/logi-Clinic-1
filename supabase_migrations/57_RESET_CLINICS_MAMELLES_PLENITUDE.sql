-- ============================================
-- MIGRATION 57: RÉINITIALISATION COMPLÈTE DES CLINIQUES MAMELLES-001 ET CLIN-PLENITUDE-001
-- ============================================
-- Cette migration réinitialise TOUTES les données pour les deux cliniques :
-- - MAMELLES-001
-- - CLIN-PLENITUDE-001
--
-- Ce qui sera supprimé :
-- - Tous les patients et leurs données associées
-- - Toutes les consultations
-- - Toutes les prescriptions
-- - Toutes les données laboratoire
-- - Toutes les données imagerie
-- - Toutes les données maternité
-- - Toutes les factures et paiements
-- - Tous les stocks et médicaments
-- - Toutes les alertes stock (y compris le tag rouge pharmacie)
-- - Toutes les dispensations
-- - Tous les rendez-vous
-- - Toutes les notifications
--
-- Ce qui sera conservé :
-- - Les cliniques elles-mêmes (structure)
-- - Les admins (mais statut réinitialisé à PENDING)
-- ============================================

DO $$
DECLARE
  v_clinic1_id UUID;
  v_clinic2_id UUID;
  v_clinic1_code TEXT := 'MAMELLES-001';
  v_clinic2_code TEXT := 'CLIN-PLENITUDE-001';
  v_deleted_count INT;
  v_table TEXT;
  v_table_exists BOOLEAN;
  v_column_exists BOOLEAN;
BEGIN
  -- Récupérer les IDs des cliniques
  SELECT id INTO v_clinic1_id FROM clinics WHERE code = v_clinic1_code;
  SELECT id INTO v_clinic2_id FROM clinics WHERE code = v_clinic2_code;

  IF v_clinic1_id IS NULL THEN
    RAISE NOTICE '⚠️  Clinique % non trouvée', v_clinic1_code;
  ELSE
    RAISE NOTICE '✅ Clinique % trouvée (ID: %)', v_clinic1_code, v_clinic1_id;
  END IF;

  IF v_clinic2_id IS NULL THEN
    RAISE NOTICE '⚠️  Clinique % non trouvée', v_clinic2_code;
  ELSE
    RAISE NOTICE '✅ Clinique % trouvée (ID: %)', v_clinic2_code, v_clinic2_id;
  END IF;

  IF v_clinic1_id IS NULL AND v_clinic2_id IS NULL THEN
    RAISE EXCEPTION '❌ Aucune des deux cliniques n''a été trouvée. Arrêt de la migration.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🗑️  DÉBUT DE LA RÉINITIALISATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ============================================
  -- ÉTAPE 1 : SUPPRIMER LES DONNÉES ENFANTES (qui référencent d'autres tables)
  -- ============================================

  -- Supprimer les alertes stock (TAG ROUGE PHARMACIE) - PRIORITÉ
  RAISE NOTICE '📋 Suppression des alertes stock (tag rouge pharmacie)...';
  BEGIN
    -- Supprimer les alertes liées aux deux cliniques ciblées
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM alertes_stock 
      WHERE medicament_id IN (
        SELECT id FROM medicaments WHERE clinic_id = v_clinic1_id
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % alertes supprimées pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM alertes_stock 
      WHERE medicament_id IN (
        SELECT id FROM medicaments WHERE clinic_id = v_clinic2_id
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % alertes supprimées pour %', v_deleted_count, v_clinic2_code;
    END IF;
    
    -- Supprimer toutes les alertes orphelines (liées à des médicaments sans clinic_id)
    DELETE FROM alertes_stock 
    WHERE medicament_id IN (
      SELECT id FROM medicaments WHERE clinic_id IS NULL
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
      RAISE NOTICE '   ✅ % alertes orphelines supprimées (médicaments sans clinic_id)', v_deleted_count;
    END IF;
    
    -- Supprimer toutes les alertes liées à des médicaments qui n'existent plus
    DELETE FROM alertes_stock 
    WHERE medicament_id NOT IN (SELECT id FROM medicaments);
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
      RAISE NOTICE '   ✅ % alertes supprimées (médicaments inexistants)', v_deleted_count;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ⚠️  Erreur lors de la suppression des alertes stock: %', SQLERRM;
  END;

  -- Supprimer les lignes de dispensation
  RAISE NOTICE '📋 Suppression des lignes de dispensation...';
  BEGIN
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM dispensation_lignes 
      WHERE dispensation_id IN (
        SELECT id FROM dispensations WHERE clinic_id = v_clinic1_id
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % lignes supprimées pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM dispensation_lignes 
      WHERE dispensation_id IN (
        SELECT id FROM dispensations WHERE clinic_id = v_clinic2_id
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % lignes supprimées pour %', v_deleted_count, v_clinic2_code;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ⚠️  Erreur lors de la suppression des lignes de dispensation: %', SQLERRM;
  END;

  -- Supprimer les dispensations
  RAISE NOTICE '📋 Suppression des dispensations...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM dispensations WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % dispensations supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM dispensations WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % dispensations supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les lignes de transfert
  RAISE NOTICE '📋 Suppression des lignes de transfert...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM transfert_lignes 
    WHERE transfert_id IN (
      SELECT id FROM transferts WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % lignes supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM transfert_lignes 
    WHERE transfert_id IN (
      SELECT id FROM transferts WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % lignes supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les transferts
  RAISE NOTICE '📋 Suppression des transferts...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM transferts WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % transferts supprimés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM transferts WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % transferts supprimés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les pertes et retours
  RAISE NOTICE '📋 Suppression des pertes et retours...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM pertes_retours 
    WHERE medicament_id IN (
      SELECT id FROM medicaments WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % pertes/retours supprimés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM pertes_retours 
    WHERE medicament_id IN (
      SELECT id FROM medicaments WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % pertes/retours supprimés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les lignes d'inventaire
  RAISE NOTICE '📋 Suppression des lignes d''inventaire...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM inventaire_lignes 
    WHERE inventaire_id IN (
      SELECT id FROM inventaires WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % lignes supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM inventaire_lignes 
    WHERE inventaire_id IN (
      SELECT id FROM inventaires WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % lignes supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les inventaires
  RAISE NOTICE '📋 Suppression des inventaires...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM inventaires WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % inventaires supprimés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM inventaires WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % inventaires supprimés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les mouvements de stock
  RAISE NOTICE '📋 Suppression des mouvements de stock...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM mouvements_stock 
    WHERE medicament_id IN (
      SELECT id FROM medicaments WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % mouvements supprimés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM mouvements_stock 
    WHERE medicament_id IN (
      SELECT id FROM medicaments WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % mouvements supprimés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les lots
  RAISE NOTICE '📋 Suppression des lots...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM lots 
    WHERE medicament_id IN (
      SELECT id FROM medicaments WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % lots supprimés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM lots 
    WHERE medicament_id IN (
      SELECT id FROM medicaments WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % lots supprimés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les médicaments
  RAISE NOTICE '📋 Suppression des médicaments...';
  BEGIN
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM medicaments WHERE clinic_id = v_clinic1_id;
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % médicaments supprimés pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM medicaments WHERE clinic_id = v_clinic2_id;
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % médicaments supprimés pour %', v_deleted_count, v_clinic2_code;
    END IF;
    
    -- Supprimer les médicaments orphelins (sans clinic_id) et leurs données associées
    RAISE NOTICE '📋 Suppression des médicaments orphelins (sans clinic_id)...';
    
    -- D'abord supprimer les données enfants des médicaments orphelins
    DELETE FROM alertes_stock WHERE medicament_id IN (SELECT id FROM medicaments WHERE clinic_id IS NULL);
    DELETE FROM lots WHERE medicament_id IN (SELECT id FROM medicaments WHERE clinic_id IS NULL);
    DELETE FROM mouvements_stock WHERE medicament_id IN (SELECT id FROM medicaments WHERE clinic_id IS NULL);
    DELETE FROM pertes_retours WHERE medicament_id IN (SELECT id FROM medicaments WHERE clinic_id IS NULL);
    
    -- Ensuite supprimer les médicaments orphelins
    DELETE FROM medicaments WHERE clinic_id IS NULL;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    IF v_deleted_count > 0 THEN
      RAISE NOTICE '   ✅ % médicaments orphelins supprimés', v_deleted_count;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ⚠️  Erreur lors de la suppression des médicaments: %', SQLERRM;
  END;

  -- Supprimer les lignes de prescription
  RAISE NOTICE '📋 Suppression des lignes de prescription...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM prescription_lines 
    WHERE prescription_id IN (
      SELECT id FROM prescriptions WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % lignes supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM prescription_lines 
    WHERE prescription_id IN (
      SELECT id FROM prescriptions WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % lignes supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les prescriptions
  RAISE NOTICE '📋 Suppression des prescriptions...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM prescriptions WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % prescriptions supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM prescriptions WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % prescriptions supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les lignes de facture
  RAISE NOTICE '📋 Suppression des lignes de facture...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM lignes_facture 
    WHERE facture_id IN (
      SELECT id FROM factures WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % lignes supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM lignes_facture 
    WHERE facture_id IN (
      SELECT id FROM factures WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % lignes supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les paiements
  RAISE NOTICE '📋 Suppression des paiements...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM paiements 
    WHERE facture_id IN (
      SELECT id FROM factures WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % paiements supprimés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM paiements 
    WHERE facture_id IN (
      SELECT id FROM factures WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % paiements supprimés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les tickets de facturation
  RAISE NOTICE '📋 Suppression des tickets de facturation...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM tickets_facturation WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % tickets supprimés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM tickets_facturation WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % tickets supprimés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les remises et exonérations
  RAISE NOTICE '📋 Suppression des remises et exonérations...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM remises_exonerations 
    WHERE facture_id IN (
      SELECT id FROM factures WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % remises supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM remises_exonerations 
    WHERE facture_id IN (
      SELECT id FROM factures WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % remises supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les factures
  RAISE NOTICE '📋 Suppression des factures...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM factures WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % factures supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM factures WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % factures supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer le journal de caisse
  RAISE NOTICE '📋 Suppression du journal de caisse...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM journal_caisse WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % entrées supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM journal_caisse WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % entrées supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les constantes de consultation
  RAISE NOTICE '📋 Suppression des constantes de consultation...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM consultation_constantes 
    WHERE consultation_id IN (
      SELECT id FROM consultations WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % constantes supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM consultation_constantes 
    WHERE consultation_id IN (
      SELECT id FROM consultations WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % constantes supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les entrées de consultation
  RAISE NOTICE '📋 Suppression des entrées de consultation...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM consultation_entries 
    WHERE consultation_id IN (
      SELECT id FROM consultations WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % entrées supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM consultation_entries 
    WHERE consultation_id IN (
      SELECT id FROM consultations WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % entrées supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les étapes de consultation
  RAISE NOTICE '📋 Suppression des étapes de consultation...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM consultation_steps 
    WHERE consult_id IN (
      SELECT id FROM consultations WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % étapes supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM consultation_steps 
    WHERE consult_id IN (
      SELECT id FROM consultations WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % étapes supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les consultations
  RAISE NOTICE '📋 Suppression des consultations...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM consultations WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % consultations supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM consultations WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % consultations supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les demandes laboratoire
  RAISE NOTICE '📋 Suppression des demandes laboratoire...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM lab_requests WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % demandes supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM lab_requests WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % demandes supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les résultats laboratoire (rapports, analyses, prélèvements) liés aux consultations
  -- Ordre important : enfants d'abord (rapports → analyses → prélèvements → prescriptions_analyses → prescriptions)
  RAISE NOTICE '📋 Suppression des résultats laboratoire (rapports/analyses/prélèvements)...';
  
  -- Supprimer les rapports laboratoire (enfants de prelevements)
  -- Vérifier si la table existe avant de supprimer
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'lab_rapports'
  ) INTO v_table_exists;
  
  IF v_table_exists THEN
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM lab_rapports 
      WHERE prelevement_id IN (
        SELECT lp.id FROM lab_prelevements lp 
        JOIN lab_prescriptions p ON p.id = lp.prescription_id 
        WHERE p.consultation_id IN (SELECT id FROM consultations WHERE clinic_id = v_clinic1_id)
           OR p.patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic1_id)
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % rapports supprimés pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM lab_rapports 
      WHERE prelevement_id IN (
        SELECT lp.id FROM lab_prelevements lp 
        JOIN lab_prescriptions p ON p.id = lp.prescription_id 
        WHERE p.consultation_id IN (SELECT id FROM consultations WHERE clinic_id = v_clinic2_id)
           OR p.patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic2_id)
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % rapports supprimés pour %', v_deleted_count, v_clinic2_code;
    END IF;
  END IF;

  -- Supprimer les analyses laboratoire (enfants de prelevements)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'lab_analyses'
  ) INTO v_table_exists;
  
  IF v_table_exists THEN
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM lab_analyses 
      WHERE prelevement_id IN (
        SELECT lp.id FROM lab_prelevements lp 
        JOIN lab_prescriptions p ON p.id = lp.prescription_id 
        WHERE p.consultation_id IN (SELECT id FROM consultations WHERE clinic_id = v_clinic1_id)
           OR p.patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic1_id)
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % analyses supprimées pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM lab_analyses 
      WHERE prelevement_id IN (
        SELECT lp.id FROM lab_prelevements lp 
        JOIN lab_prescriptions p ON p.id = lp.prescription_id 
        WHERE p.consultation_id IN (SELECT id FROM consultations WHERE clinic_id = v_clinic2_id)
           OR p.patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic2_id)
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % analyses supprimées pour %', v_deleted_count, v_clinic2_code;
    END IF;
  END IF;

  -- Supprimer les prélèvements laboratoire (enfants de prescriptions)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'lab_prelevements'
  ) INTO v_table_exists;
  
  IF v_table_exists THEN
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM lab_prelevements 
      WHERE prescription_id IN (
        SELECT id FROM lab_prescriptions 
        WHERE consultation_id IN (SELECT id FROM consultations WHERE clinic_id = v_clinic1_id)
           OR patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic1_id)
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % prélèvements supprimés pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM lab_prelevements 
      WHERE prescription_id IN (
        SELECT id FROM lab_prescriptions 
        WHERE consultation_id IN (SELECT id FROM consultations WHERE clinic_id = v_clinic2_id)
           OR patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic2_id)
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % prélèvements supprimés pour %', v_deleted_count, v_clinic2_code;
    END IF;
  END IF;

  -- Supprimer les prescriptions analyses laboratoire (enfants de prescriptions)
  RAISE NOTICE '📋 Suppression des prescriptions analyses laboratoire...';
  BEGIN
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM lab_prescriptions_analyses 
      WHERE prescription_id IN (
        SELECT lp.id FROM lab_prescriptions lp 
        WHERE lp.patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic1_id)
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % prescriptions analyses supprimées pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM lab_prescriptions_analyses 
      WHERE prescription_id IN (
        SELECT lp.id FROM lab_prescriptions lp 
        WHERE lp.patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic2_id)
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % prescriptions analyses supprimées pour %', v_deleted_count, v_clinic2_code;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ⚠️  Erreur lors de la suppression des prescriptions analyses: %', SQLERRM;
  END;

  -- Supprimer les prescriptions laboratoire (parent)
  RAISE NOTICE '📋 Suppression des prescriptions laboratoire...';
  BEGIN
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM lab_prescriptions 
      WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic1_id);
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % prescriptions supprimées pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM lab_prescriptions 
      WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic2_id);
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % prescriptions supprimées pour %', v_deleted_count, v_clinic2_code;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ⚠️  Erreur lors de la suppression des prescriptions laboratoire: %', SQLERRM;
  END;

  -- Supprimer les notifications laboratoire maternité
  RAISE NOTICE '📋 Suppression des notifications laboratoire maternité...';
  BEGIN
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM lab_notifications_maternite 
      WHERE patient_id IN (
        SELECT id FROM patients WHERE clinic_id = v_clinic1_id
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % notifications supprimées pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM lab_notifications_maternite 
      WHERE patient_id IN (
        SELECT id FROM patients WHERE clinic_id = v_clinic2_id
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % notifications supprimées pour %', v_deleted_count, v_clinic2_code;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ⚠️  Erreur lors de la suppression des notifications maternité: %', SQLERRM;
  END;

  -- Note: lab_examens_maternite est une table de référence/catalogue, pas de données spécifiques à une clinique
  -- Pas besoin de la supprimer

  -- Supprimer les demandes imagerie (vérifier si clinic_id existe, sinon via patient_id)
  RAISE NOTICE '📋 Suppression des demandes imagerie...';
  IF v_clinic1_id IS NOT NULL THEN
    -- Vérifier si la colonne clinic_id existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'imaging_requests' 
      AND column_name = 'clinic_id'
    ) THEN
      DELETE FROM imaging_requests WHERE clinic_id = v_clinic1_id;
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % demandes supprimées pour %', v_deleted_count, v_clinic1_code;
    ELSE
      DELETE FROM imaging_requests 
      WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic1_id);
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % demandes supprimées pour % (via patient_id)', v_deleted_count, v_clinic1_code;
    END IF;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'imaging_requests' 
      AND column_name = 'clinic_id'
    ) THEN
      DELETE FROM imaging_requests WHERE clinic_id = v_clinic2_id;
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % demandes supprimées pour %', v_deleted_count, v_clinic2_code;
    ELSE
      DELETE FROM imaging_requests 
      WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic2_id);
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % demandes supprimées pour % (via patient_id)', v_deleted_count, v_clinic2_code;
    END IF;
  END IF;

  -- Supprimer les annotations imagerie (via patient_id car imagerie_examens n'a pas clinic_id)
  RAISE NOTICE '📋 Suppression des annotations imagerie...';
  BEGIN
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM imagerie_annotations 
      WHERE image_id IN (
        SELECT id FROM imagerie_images 
        WHERE examen_id IN (
          SELECT id FROM imagerie_examens 
          WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic1_id)
        )
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % annotations supprimées pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM imagerie_annotations 
      WHERE image_id IN (
        SELECT id FROM imagerie_images 
        WHERE examen_id IN (
          SELECT id FROM imagerie_examens 
          WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic2_id)
        )
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % annotations supprimées pour %', v_deleted_count, v_clinic2_code;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ⚠️  Erreur lors de la suppression des annotations imagerie: %', SQLERRM;
  END;

  -- Supprimer les images imagerie (via patient_id)
  RAISE NOTICE '📋 Suppression des images imagerie...';
  BEGIN
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM imagerie_images 
      WHERE examen_id IN (
        SELECT id FROM imagerie_examens 
        WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic1_id)
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % images supprimées pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM imagerie_images 
      WHERE examen_id IN (
        SELECT id FROM imagerie_examens 
        WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic2_id)
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % images supprimées pour %', v_deleted_count, v_clinic2_code;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ⚠️  Erreur lors de la suppression des images imagerie: %', SQLERRM;
  END;

  -- Supprimer les rapports imagerie (via patient_id)
  RAISE NOTICE '📋 Suppression des rapports imagerie...';
  BEGIN
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM imagerie_rapports 
      WHERE examen_id IN (
        SELECT id FROM imagerie_examens 
        WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic1_id)
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % rapports supprimés pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM imagerie_rapports 
      WHERE examen_id IN (
        SELECT id FROM imagerie_examens 
        WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic2_id)
      );
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % rapports supprimés pour %', v_deleted_count, v_clinic2_code;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ⚠️  Erreur lors de la suppression des rapports imagerie: %', SQLERRM;
  END;

  -- Supprimer les examens imagerie (via patient_id)
  RAISE NOTICE '📋 Suppression des examens imagerie...';
  BEGIN
    IF v_clinic1_id IS NOT NULL THEN
      DELETE FROM imagerie_examens 
      WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic1_id);
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % examens supprimés pour %', v_deleted_count, v_clinic1_code;
    END IF;
    
    IF v_clinic2_id IS NOT NULL THEN
      DELETE FROM imagerie_examens 
      WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id = v_clinic2_id);
      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      RAISE NOTICE '   ✅ % examens supprimés pour %', v_deleted_count, v_clinic2_code;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ⚠️  Erreur lors de la suppression des examens imagerie: %', SQLERRM;
  END;

  -- Supprimer les données maternité (post-partum)
  RAISE NOTICE '📋 Suppression des données maternité...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM surveillance_post_partum WHERE clinic_id = v_clinic1_id;
    DELETE FROM observation_post_partum WHERE clinic_id = v_clinic1_id;
    DELETE FROM traitement_post_partum WHERE clinic_id = v_clinic1_id;
    DELETE FROM conseils_post_partum WHERE clinic_id = v_clinic1_id;
    DELETE FROM sortie_salle_naissance WHERE clinic_id = v_clinic1_id;
    DELETE FROM complication_post_partum WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Données maternité supprimées pour %', v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM surveillance_post_partum WHERE clinic_id = v_clinic2_id;
    DELETE FROM observation_post_partum WHERE clinic_id = v_clinic2_id;
    DELETE FROM traitement_post_partum WHERE clinic_id = v_clinic2_id;
    DELETE FROM conseils_post_partum WHERE clinic_id = v_clinic2_id;
    DELETE FROM sortie_salle_naissance WHERE clinic_id = v_clinic2_id;
    DELETE FROM complication_post_partum WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Données maternité supprimées pour %', v_clinic2_code;
  END IF;

  -- Supprimer les dossiers obstétricaux
  RAISE NOTICE '📋 Suppression des dossiers obstétricaux...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM dossier_obstetrical WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % dossiers supprimés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM dossier_obstetrical WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % dossiers supprimés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les consultations prénatales
  RAISE NOTICE '📋 Suppression des consultations prénatales...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM consultation_prenatale WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % consultations supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM consultation_prenatale WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % consultations supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les fichiers patients
  RAISE NOTICE '📋 Suppression des fichiers patients...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM patient_files 
    WHERE patient_id IN (
      SELECT id FROM patients WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % fichiers supprimés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM patient_files 
    WHERE patient_id IN (
      SELECT id FROM patients WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % fichiers supprimés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les timelines de soins patients
  RAISE NOTICE '📋 Suppression des timelines de soins...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM patient_care_timeline 
    WHERE patient_id IN (
      SELECT id FROM patients WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % timelines supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM patient_care_timeline 
    WHERE patient_id IN (
      SELECT id FROM patients WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % timelines supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les assurances patients
  RAISE NOTICE '📋 Suppression des assurances patients...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM patient_assurances 
    WHERE patient_id IN (
      SELECT id FROM patients WHERE clinic_id = v_clinic1_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % assurances supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM patient_assurances 
    WHERE patient_id IN (
      SELECT id FROM patients WHERE clinic_id = v_clinic2_id
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % assurances supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les patients
  RAISE NOTICE '📋 Suppression des patients...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM patients WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % patients supprimés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM patients WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % patients supprimés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les rendez-vous
  RAISE NOTICE '📋 Suppression des rendez-vous...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM rendez_vous WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % rendez-vous supprimés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM rendez_vous WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % rendez-vous supprimés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les notifications hospitalisation
  RAISE NOTICE '📋 Suppression des notifications hospitalisation...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM notifications_hospitalisation WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % notifications supprimées pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM notifications_hospitalisation WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % notifications supprimées pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- Supprimer les tarifs clinique
  RAISE NOTICE '📋 Suppression des tarifs clinique...';
  IF v_clinic1_id IS NOT NULL THEN
    DELETE FROM clinic_pricing WHERE clinic_id = v_clinic1_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % tarifs supprimés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    DELETE FROM clinic_pricing WHERE clinic_id = v_clinic2_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % tarifs supprimés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- ============================================
  -- ÉTAPE 2 : RÉINITIALISER LE STATUT DES ADMINS
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 Réinitialisation du statut des admins...';
  
  IF v_clinic1_id IS NOT NULL THEN
    UPDATE users 
    SET status = 'PENDING', 
        actif = true,
        updated_at = NOW()
    WHERE clinic_id = v_clinic1_id 
      AND role = 'CLINIC_ADMIN';
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % admins réinitialisés pour %', v_deleted_count, v_clinic1_code;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    UPDATE users 
    SET status = 'PENDING', 
        actif = true,
        updated_at = NOW()
    WHERE clinic_id = v_clinic2_id 
      AND role = 'CLINIC_ADMIN';
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✅ % admins réinitialisés pour %', v_deleted_count, v_clinic2_code;
  END IF;

  -- ============================================
  -- ÉTAPE 3 : VÉRIFICATION FINALE
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RÉINITIALISATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Vérifier qu'il ne reste plus de données
  IF v_clinic1_id IS NOT NULL THEN
    RAISE NOTICE '📊 Vérification %:', v_clinic1_code;
    SELECT COUNT(*) INTO v_deleted_count FROM patients WHERE clinic_id = v_clinic1_id;
    RAISE NOTICE '   Patients restants: %', v_deleted_count;
    SELECT COUNT(*) INTO v_deleted_count FROM consultations WHERE clinic_id = v_clinic1_id;
    RAISE NOTICE '   Consultations restantes: %', v_deleted_count;
    SELECT COUNT(*) INTO v_deleted_count FROM factures WHERE clinic_id = v_clinic1_id;
    RAISE NOTICE '   Factures restantes: %', v_deleted_count;
    SELECT COUNT(*) INTO v_deleted_count FROM medicaments WHERE clinic_id = v_clinic1_id;
    RAISE NOTICE '   Médicaments restants: %', v_deleted_count;
    -- Vérifier les alertes stock (via medicament_id)
    SELECT COUNT(*) INTO v_deleted_count FROM alertes_stock 
    WHERE medicament_id IN (SELECT id FROM medicaments WHERE clinic_id = v_clinic1_id);
    RAISE NOTICE '   Alertes stock restantes: %', v_deleted_count;
  END IF;
  
  IF v_clinic2_id IS NOT NULL THEN
    RAISE NOTICE '📊 Vérification %:', v_clinic2_code;
    SELECT COUNT(*) INTO v_deleted_count FROM patients WHERE clinic_id = v_clinic2_id;
    RAISE NOTICE '   Patients restants: %', v_deleted_count;
    SELECT COUNT(*) INTO v_deleted_count FROM consultations WHERE clinic_id = v_clinic2_id;
    RAISE NOTICE '   Consultations restantes: %', v_deleted_count;
    SELECT COUNT(*) INTO v_deleted_count FROM factures WHERE clinic_id = v_clinic2_id;
    RAISE NOTICE '   Factures restantes: %', v_deleted_count;
    SELECT COUNT(*) INTO v_deleted_count FROM medicaments WHERE clinic_id = v_clinic2_id;
    RAISE NOTICE '   Médicaments restants: %', v_deleted_count;
    -- Vérifier les alertes stock (via medicament_id)
    SELECT COUNT(*) INTO v_deleted_count FROM alertes_stock 
    WHERE medicament_id IN (SELECT id FROM medicaments WHERE clinic_id = v_clinic2_id);
    RAISE NOTICE '   Alertes stock restantes: %', v_deleted_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Les deux cliniques ont été complètement réinitialisées !';
  RAISE NOTICE '   - Toutes les données métier ont été supprimées';
  RAISE NOTICE '   - Toutes les alertes stock (tag rouge pharmacie) ont été supprimées';
  RAISE NOTICE '   - Les admins ont été réinitialisés (statut PENDING)';
  RAISE NOTICE '';
  
END $$;
