-- ============================================
-- MIGRATION 34: AJOUT INDEX SUR CLÉS ÉTRANGÈRES
-- ============================================
-- Cette migration ajoute les index manquants sur les clés étrangères
-- pour améliorer les performances des requêtes de jointure
-- ============================================

-- Table: anamnese_templates
CREATE INDEX IF NOT EXISTS idx_anamnese_templates_created_by 
ON anamnese_templates(created_by);

-- Table: clinic_temporary_codes
CREATE INDEX IF NOT EXISTS idx_clinic_temporary_codes_created_by 
ON clinic_temporary_codes(created_by_super_admin);
CREATE INDEX IF NOT EXISTS idx_clinic_temporary_codes_used_by 
ON clinic_temporary_codes(used_by_user_id);

-- Table: cold_chain_logs
CREATE INDEX IF NOT EXISTS idx_cold_chain_logs_batch_id 
ON cold_chain_logs(batch_id);

-- Table: consultation_steps
CREATE INDEX IF NOT EXISTS idx_consultation_steps_clinic_id 
ON consultation_steps(clinic_id);

-- Table: credits_facturation
CREATE INDEX IF NOT EXISTS idx_credits_facturation_patient_id 
ON credits_facturation(patient_id);

-- Table: dispensation_lignes
CREATE INDEX IF NOT EXISTS idx_dispensation_lignes_dispensation_id 
ON dispensation_lignes(dispensation_id);
CREATE INDEX IF NOT EXISTS idx_dispensation_lignes_lot_id 
ON dispensation_lignes(lot_id);
CREATE INDEX IF NOT EXISTS idx_dispensation_lignes_medicament_id 
ON dispensation_lignes(medicament_id);
CREATE INDEX IF NOT EXISTS idx_dispensation_lignes_medicament_substitue_id 
ON dispensation_lignes(medicament_substitue_id);

-- Table: exam_catalog
CREATE INDEX IF NOT EXISTS idx_exam_catalog_service_facturable_id 
ON exam_catalog(service_facturable_id);

-- Table: imaging_requests
CREATE INDEX IF NOT EXISTS idx_imaging_requests_patient_id 
ON imaging_requests(patient_id);

-- Table: inventaire_lignes
CREATE INDEX IF NOT EXISTS idx_inventaire_lignes_inventaire_id 
ON inventaire_lignes(inventaire_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_lignes_lot_id 
ON inventaire_lignes(lot_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_lignes_medicament_id 
ON inventaire_lignes(medicament_id);

-- Table: lab_alertes
CREATE INDEX IF NOT EXISTS idx_lab_alertes_analyse_id 
ON lab_alertes(analyse_id);
CREATE INDEX IF NOT EXISTS idx_lab_alertes_reactif_id 
ON lab_alertes(reactif_id);

-- Table: lab_consommations_reactifs
CREATE INDEX IF NOT EXISTS idx_lab_consommations_reactifs_reactif_id 
ON lab_consommations_reactifs(reactif_id);

-- Table: lab_requests
CREATE INDEX IF NOT EXISTS idx_lab_requests_patient_id 
ON lab_requests(patient_id);

-- Table: lignes_facture
CREATE INDEX IF NOT EXISTS idx_lignes_facture_service_facturable_id 
ON lignes_facture(service_facturable_id);

-- Table: mouvements_stock
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_lot_id 
ON mouvements_stock(lot_id);

-- Table: patient_care_timeline
CREATE INDEX IF NOT EXISTS idx_patient_care_timeline_created_by 
ON patient_care_timeline(created_by);

-- Table: patient_deparasitage
CREATE INDEX IF NOT EXISTS idx_patient_deparasitage_clinic_id 
ON patient_deparasitage(clinic_id);

-- Table: patient_files
CREATE INDEX IF NOT EXISTS idx_patient_files_uploaded_by 
ON patient_files(uploaded_by);

-- Table: patient_vaccinations
CREATE INDEX IF NOT EXISTS idx_patient_vaccinations_schedule_id 
ON patient_vaccinations(schedule_id);

-- Table: pertes_retours
CREATE INDEX IF NOT EXISTS idx_pertes_retours_lot_id 
ON pertes_retours(lot_id);
CREATE INDEX IF NOT EXISTS idx_pertes_retours_medicament_id 
ON pertes_retours(medicament_id);

-- Table: protocols
CREATE INDEX IF NOT EXISTS idx_protocols_patient_id 
ON protocols(patient_id);

-- Table: remises_exonerations
CREATE INDEX IF NOT EXISTS idx_remises_exonerations_facture_id 
ON remises_exonerations(facture_id);

-- Table: tickets_facturation
CREATE INDEX IF NOT EXISTS idx_tickets_facturation_facture_id 
ON tickets_facturation(facture_id);

-- Table: transfert_lignes
CREATE INDEX IF NOT EXISTS idx_transfert_lignes_lot_id 
ON transfert_lignes(lot_id);
CREATE INDEX IF NOT EXISTS idx_transfert_lignes_medicament_id 
ON transfert_lignes(medicament_id);
CREATE INDEX IF NOT EXISTS idx_transfert_lignes_transfert_id 
ON transfert_lignes(transfert_id);

-- Table: vaccination_reminders
CREATE INDEX IF NOT EXISTS idx_vaccination_reminders_schedule_id 
ON vaccination_reminders(schedule_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_reminders_vaccine_id 
ON vaccination_reminders(vaccine_id);

-- Table: vaccines
CREATE INDEX IF NOT EXISTS idx_vaccines_medicament_id 
ON vaccines(medicament_id);

-- Commentaires
COMMENT ON INDEX idx_anamnese_templates_created_by IS 'Index ajouté pour améliorer les performances des jointures';
COMMENT ON INDEX idx_dispensation_lignes_dispensation_id IS 'Index ajouté pour améliorer les performances des jointures';
COMMENT ON INDEX idx_dispensation_lignes_lot_id IS 'Index ajouté pour améliorer les performances des jointures';
COMMENT ON INDEX idx_dispensation_lignes_medicament_id IS 'Index ajouté pour améliorer les performances des jointures';

