/**
 * Validations pour les constantes médicales
 * Selon les règles métiers spécifiées
 */

export interface ConstantesValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export const validateConstantes = (constantes: {
  temperature_c?: number;
  poids_kg?: number;
  taille_cm?: number;
  ta_bras_gauche_systolique?: number;
  ta_bras_gauche_diastolique?: number;
  ta_bras_droit_systolique?: number;
  ta_bras_droit_diastolique?: number;
}): ConstantesValidationResult => {
  const errors: Record<string, string> = {};

  // Validation température: 30..45 °C
  if (constantes.temperature_c !== undefined) {
    if (constantes.temperature_c < 30 || constantes.temperature_c > 45) {
      errors.temperature_c = 'La température doit être entre 30 et 45 °C';
    }
  }

  // Validation poids: > 0 kg
  if (constantes.poids_kg !== undefined) {
    if (constantes.poids_kg <= 0) {
      errors.poids_kg = 'Le poids doit être supérieur à 0 kg';
    }
  }

  // Validation taille: > 30 cm
  if (constantes.taille_cm !== undefined) {
    if (constantes.taille_cm <= 30) {
      errors.taille_cm = 'La taille doit être supérieure à 30 cm';
    }
  }

  // Validation TA Systolique: 40..300 mmHg
  if (constantes.ta_bras_gauche_systolique !== undefined) {
    if (constantes.ta_bras_gauche_systolique < 40 || constantes.ta_bras_gauche_systolique > 300) {
      errors.ta_bras_gauche_systolique = 'La tension systolique doit être entre 40 et 300 mmHg';
    }
  }

  if (constantes.ta_bras_droit_systolique !== undefined) {
    if (constantes.ta_bras_droit_systolique < 40 || constantes.ta_bras_droit_systolique > 300) {
      errors.ta_bras_droit_systolique = 'La tension systolique doit être entre 40 et 300 mmHg';
    }
  }

  // Validation TA Diastolique: 30..200 mmHg
  if (constantes.ta_bras_gauche_diastolique !== undefined) {
    if (constantes.ta_bras_gauche_diastolique < 30 || constantes.ta_bras_gauche_diastolique > 200) {
      errors.ta_bras_gauche_diastolique = 'La tension diastolique doit être entre 30 et 200 mmHg';
    }
  }

  if (constantes.ta_bras_droit_diastolique !== undefined) {
    if (constantes.ta_bras_droit_diastolique < 30 || constantes.ta_bras_droit_diastolique > 200) {
      errors.ta_bras_droit_diastolique = 'La tension diastolique doit être entre 30 et 200 mmHg';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

