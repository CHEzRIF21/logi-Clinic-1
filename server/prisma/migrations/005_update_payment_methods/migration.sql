-- Migration: Mise à jour des moyens de paiement pour l'Afrique de l'Ouest
-- Date: 2024-12-12
-- Description: Documenter les nouveaux moyens de paiement West Africa (Mobile Money)

-- Ajouter un commentaire sur la colonne method de la table Payment
-- pour documenter les valeurs acceptées
COMMENT ON COLUMN "Payment"."method" IS 'Moyens de paiement acceptés: especes, orange_money, mtn_mobile_money, moov_money, wave, flooz, t_money, carte_bancaire, virement, cheque, prise_en_charge. Rétro-compatibilité: ESPECE, CARTE, MOBILE, ASSURANCE, VIREMENT sont aussi acceptés.';

-- Ajouter un commentaire sur la colonne modePayment de la table Invoice
COMMENT ON COLUMN "Invoice"."modePayment" IS 'Mode de paiement principal: especes, orange_money, mtn_mobile_money, moov_money, wave, flooz, t_money, carte_bancaire, virement, cheque, prise_en_charge';

-- Note: Les données existantes avec les anciens codes (ESPECE, CARTE, etc.) 
-- restent valides grâce à la normalisation côté application (voir server/src/constants/paymentMethods.ts)

