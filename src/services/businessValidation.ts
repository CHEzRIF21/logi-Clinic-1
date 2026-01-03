/**
 * Service de validation des contraintes métier
 * Vérifie les règles business avant les opérations inter-modules
 */

import { supabase } from './supabase';
import { logger } from '../utils/logger';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valide qu'une consultation est dans un état permettant une prescription
 */
export async function validateConsultationForPrescription(
  consultationId: string
): Promise<ValidationResult> {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  
  try {
    const { data: consultation, error } = await supabase
      .from('consultations')
      .select('id, status, patient_id, created_at')
      .eq('id', consultationId)
      .single();

    if (error || !consultation) {
      result.valid = false;
      result.errors.push('Consultation introuvable');
      return result;
    }

    // Vérifier que la consultation n'est pas clôturée
    if (consultation.status === 'CLOTURE') {
      result.valid = false;
      result.errors.push('Impossible de créer une prescription sur une consultation clôturée');
      return result;
    }

    // Vérifier que la consultation n'est pas annulée
    if (consultation.status === 'ANNULE') {
      result.valid = false;
      result.errors.push('Impossible de créer une prescription sur une consultation annulée');
      return result;
    }

    // Avertissement si la consultation date de plus de 24h
    const consultationDate = new Date(consultation.created_at);
    const now = new Date();
    const hoursElapsed = (now.getTime() - consultationDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursElapsed > 24) {
      result.warnings.push(`Attention: cette consultation date de plus de 24h (${Math.round(hoursElapsed)}h)`);
    }

    logger.debug('Validation consultation pour prescription', {
      consultationId,
      status: consultation.status,
      valid: result.valid,
    });

  } catch (error) {
    logger.error('Erreur validation consultation pour prescription', error as Error);
    result.valid = false;
    result.errors.push('Erreur lors de la validation');
  }

  return result;
}

/**
 * Valide qu'une prescription existe et est active avant d'enregistrer des résultats labo
 */
export async function validatePrescriptionForLabResult(
  prescriptionId: string
): Promise<ValidationResult> {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };

  try {
    const { data: prescription, error } = await supabase
      .from('lab_prescriptions')
      .select('id, statut, statut_paiement, patient_id')
      .eq('id', prescriptionId)
      .single();

    if (error || !prescription) {
      result.valid = false;
      result.errors.push('Prescription de laboratoire introuvable');
      return result;
    }

    // Vérifier que la prescription n'est pas annulée
    if (prescription.statut === 'annule') {
      result.valid = false;
      result.errors.push('Cette prescription a été annulée');
      return result;
    }

    // Avertissement si le paiement n'est pas effectué
    if (prescription.statut_paiement !== 'paye' && prescription.statut_paiement !== 'exonere') {
      result.warnings.push('Attention: le paiement n\'a pas encore été effectué pour cette prescription');
    }

    logger.debug('Validation prescription pour résultat labo', {
      prescriptionId,
      statut: prescription.statut,
      statutPaiement: prescription.statut_paiement,
      valid: result.valid,
    });

  } catch (error) {
    logger.error('Erreur validation prescription pour résultat labo', error as Error);
    result.valid = false;
    result.errors.push('Erreur lors de la validation');
  }

  return result;
}

/**
 * Valide qu'une prescription médicament est active avant dispensation
 */
export async function validatePrescriptionForDispensation(
  prescriptionId: string
): Promise<ValidationResult> {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };

  try {
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .select('id, statut, consultation_id, date_prescription')
      .eq('id', prescriptionId)
      .single();

    if (error || !prescription) {
      result.valid = false;
      result.errors.push('Prescription introuvable');
      return result;
    }

    // Vérifier que la prescription n'est pas annulée
    if (prescription.statut === 'ANNULE') {
      result.valid = false;
      result.errors.push('Cette prescription a été annulée');
      return result;
    }

    // Vérifier que la prescription n'est pas déjà complètement dispensée
    if (prescription.statut === 'DISPENSE') {
      result.valid = false;
      result.errors.push('Cette prescription a déjà été entièrement dispensée');
      return result;
    }

    // Avertissement si la prescription date de plus de 7 jours
    const prescriptionDate = new Date(prescription.date_prescription);
    const now = new Date();
    const daysElapsed = (now.getTime() - prescriptionDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysElapsed > 7) {
      result.warnings.push(`Attention: cette prescription date de plus de 7 jours (${Math.round(daysElapsed)} jours)`);
    }

    logger.debug('Validation prescription pour dispensation', {
      prescriptionId,
      statut: prescription.statut,
      daysElapsed: Math.round(daysElapsed),
      valid: result.valid,
    });

  } catch (error) {
    logger.error('Erreur validation prescription pour dispensation', error as Error);
    result.valid = false;
    result.errors.push('Erreur lors de la validation');
  }

  return result;
}

/**
 * Valide la disponibilité du stock avant dispensation
 */
export async function validateStockForDispensation(
  items: Array<{ lotId: string; quantite: number; medicamentNom?: string }>
): Promise<ValidationResult> {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };

  try {
    for (const item of items) {
      const { data: lot, error } = await supabase
        .from('lots')
        .select('id, numero_lot, quantite_disponible, date_expiration, statut')
        .eq('id', item.lotId)
        .single();

      if (error || !lot) {
        result.valid = false;
        result.errors.push(`Lot ${item.lotId} introuvable`);
        continue;
      }

      // Vérifier que le lot est actif
      if (lot.statut !== 'actif') {
        result.valid = false;
        result.errors.push(`Le lot ${lot.numero_lot} n'est pas actif (${item.medicamentNom || ''})`);
        continue;
      }

      // Vérifier la quantité disponible
      if (lot.quantite_disponible < item.quantite) {
        result.valid = false;
        result.errors.push(
          `Stock insuffisant pour ${item.medicamentNom || lot.numero_lot}: ` +
          `demandé ${item.quantite}, disponible ${lot.quantite_disponible}`
        );
        continue;
      }

      // Vérifier l'expiration
      const expirationDate = new Date(lot.date_expiration);
      const now = new Date();
      const daysUntilExpiration = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (daysUntilExpiration < 0) {
        result.valid = false;
        result.errors.push(`Le lot ${lot.numero_lot} est expiré (${item.medicamentNom || ''})`);
      } else if (daysUntilExpiration < 30) {
        result.warnings.push(
          `Attention: le lot ${lot.numero_lot} expire dans ${Math.round(daysUntilExpiration)} jours`
        );
      }
    }

    logger.debug('Validation stock pour dispensation', {
      itemsCount: items.length,
      valid: result.valid,
      errorsCount: result.errors.length,
      warningsCount: result.warnings.length,
    });

  } catch (error) {
    logger.error('Erreur validation stock pour dispensation', error as Error);
    result.valid = false;
    result.errors.push('Erreur lors de la validation du stock');
  }

  return result;
}

/**
 * Valide qu'un patient peut bénéficier d'une consultation
 */
export async function validatePatientForConsultation(
  patientId: string,
  clinicId: string
): Promise<ValidationResult> {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };

  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .select('id, nom, prenom, date_naissance, statut, clinic_id')
      .eq('id', patientId)
      .single();

    if (error || !patient) {
      result.valid = false;
      result.errors.push('Patient introuvable');
      return result;
    }

    // Vérifier que le patient appartient à la clinique
    if (patient.clinic_id !== clinicId) {
      result.valid = false;
      result.errors.push('Ce patient n\'appartient pas à cette clinique');
      return result;
    }

    // Vérifier que le patient est actif
    if (patient.statut === 'inactif' || patient.statut === 'decede') {
      result.valid = false;
      result.errors.push(`Ce patient est marqué comme ${patient.statut}`);
      return result;
    }

    // Vérifier s'il y a déjà une consultation en cours
    const { data: consultationsEnCours } = await supabase
      .from('consultations')
      .select('id, status, created_at')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .in('status', ['EN_COURS', 'EN_ATTENTE'])
      .limit(1);

    if (consultationsEnCours && consultationsEnCours.length > 0) {
      result.warnings.push('Ce patient a déjà une consultation en cours');
    }

    logger.debug('Validation patient pour consultation', {
      patientId,
      patientNom: `${patient.nom} ${patient.prenom}`,
      valid: result.valid,
    });

  } catch (error) {
    logger.error('Erreur validation patient pour consultation', error as Error);
    result.valid = false;
    result.errors.push('Erreur lors de la validation du patient');
  }

  return result;
}

/**
 * Valide les données d'une facture avant création
 */
export async function validateFactureData(
  patientId: string,
  montant: number,
  lignes: Array<{ description: string; montant: number }>
): Promise<ValidationResult> {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };

  // Vérifier le montant
  if (montant <= 0) {
    result.valid = false;
    result.errors.push('Le montant de la facture doit être positif');
  }

  // Vérifier les lignes
  if (!lignes || lignes.length === 0) {
    result.valid = false;
    result.errors.push('La facture doit contenir au moins une ligne');
  } else {
    // Vérifier la cohérence des montants
    const totalLignes = lignes.reduce((sum, l) => sum + (l.montant || 0), 0);
    if (Math.abs(totalLignes - montant) > 1) {
      result.warnings.push(
        `Le total des lignes (${totalLignes} XOF) diffère du montant total (${montant} XOF)`
      );
    }

    // Vérifier que chaque ligne a une description
    const lignesSansDescription = lignes.filter(l => !l.description || l.description.trim() === '');
    if (lignesSansDescription.length > 0) {
      result.warnings.push(`${lignesSansDescription.length} ligne(s) sans description`);
    }
  }

  // Vérifier que le patient existe
  const { data: patient, error } = await supabase
    .from('patients')
    .select('id, nom')
    .eq('id', patientId)
    .single();

  if (error || !patient) {
    result.valid = false;
    result.errors.push('Patient introuvable');
  }

  logger.debug('Validation données facture', {
    patientId,
    montant,
    lignesCount: lignes?.length || 0,
    valid: result.valid,
  });

  return result;
}

export default {
  validateConsultationForPrescription,
  validatePrescriptionForLabResult,
  validatePrescriptionForDispensation,
  validateStockForDispensation,
  validatePatientForConsultation,
  validateFactureData,
};

