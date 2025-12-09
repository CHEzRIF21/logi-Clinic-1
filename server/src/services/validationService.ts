import { Decimal } from '@prisma/client/runtime/library';

export class ValidationService {
  /**
   * Valide une facture avant création
   */
  static validateInvoice(lines: Array<{
    productId: string;
    qty: number;
    unitPrice: number;
    discount?: number;
  }>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!lines || lines.length === 0) {
      errors.push('Au moins une ligne de facture est requise');
      return { valid: false, errors };
    }

    let totalTTC = 0;

    lines.forEach((line, index) => {
      // Validation quantité
      if (!line.qty || line.qty <= 0) {
        errors.push(`Ligne ${index + 1}: La quantité doit être supérieure à 0`);
      }

      // Validation prix unitaire
      if (line.unitPrice === undefined || line.unitPrice < 0) {
        errors.push(`Ligne ${index + 1}: Le prix unitaire doit être positif ou nul`);
      }

      // Validation remise
      if (line.discount !== undefined) {
        if (line.discount < 0 || line.discount > 100) {
          errors.push(`Ligne ${index + 1}: La remise doit être entre 0 et 100%`);
        }
      }

      // Calcul total ligne
      const subtotal = line.qty * line.unitPrice;
      const discountAmount = subtotal * ((line.discount || 0) / 100);
      const afterDiscount = subtotal - discountAmount;
      totalTTC += afterDiscount;
    });

    // Validation total facture
    if (totalTTC < 0) {
      errors.push('Le montant total de la facture ne peut pas être négatif');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valide un paiement
   */
  static validatePayment(amount: number, remaining: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!amount || amount <= 0) {
      errors.push('Le montant du paiement doit être supérieur à 0');
    }

    if (amount > remaining) {
      errors.push(`Le montant du paiement (${amount} FCFA) dépasse le solde restant (${remaining} FCFA)`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valide une opération
   */
  static validateOperation(lines: Array<{
    productId: string;
    qty: number;
    unitPrice: number;
  }>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!lines || lines.length === 0) {
      errors.push('Au moins une ligne d\'opération est requise');
      return { valid: false, errors };
    }

    lines.forEach((line, index) => {
      if (!line.qty || line.qty <= 0) {
        errors.push(`Ligne ${index + 1}: La quantité doit être supérieure à 0`);
      }

      if (line.unitPrice === undefined || line.unitPrice < 0) {
        errors.push(`Ligne ${index + 1}: Le prix unitaire doit être positif ou nul`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valide un patient
   */
  static validatePatient(data: {
    firstName?: string;
    lastName?: string;
    sex?: string;
    dob?: Date | string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push('Le prénom est requis');
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push('Le nom est requis');
    }

    if (!data.sex) {
      errors.push('Le sexe est requis');
    } else if (!['M', 'F'].includes(data.sex)) {
      errors.push('Le sexe doit être M ou F');
    }

    if (!data.dob) {
      errors.push('La date de naissance est requise');
    } else {
      const dob = typeof data.dob === 'string' ? new Date(data.dob) : data.dob;
      if (dob > new Date()) {
        errors.push('La date de naissance ne peut pas être dans le futur');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default ValidationService;

