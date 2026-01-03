/**
 * Middleware de validation des données pour les routes inter-modules
 * Fournit une validation stricte des entrées et du contexte clinic
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Valide qu'un UUID est au bon format
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Interface pour les règles de validation
 */
interface ValidationRule {
  field: string;
  type: 'uuid' | 'string' | 'number' | 'boolean' | 'email' | 'date' | 'array';
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  enum?: string[];
  custom?: (value: any) => boolean;
  message?: string;
}

/**
 * Résultat de validation
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valide une valeur selon une règle
 */
function validateValue(value: any, rule: ValidationRule): string | null {
  // Vérifier si requis
  if (rule.required && (value === undefined || value === null || value === '')) {
    return rule.message || `Le champ '${rule.field}' est requis`;
  }

  // Si non requis et absent, c'est OK
  if (value === undefined || value === null || value === '') {
    return null;
  }

  // Valider selon le type
  switch (rule.type) {
    case 'uuid':
      if (!isValidUUID(String(value))) {
        return rule.message || `Le champ '${rule.field}' doit être un UUID valide`;
      }
      break;

    case 'string':
      if (typeof value !== 'string') {
        return rule.message || `Le champ '${rule.field}' doit être une chaîne de caractères`;
      }
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message || `Le champ '${rule.field}' doit avoir au moins ${rule.minLength} caractères`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || `Le champ '${rule.field}' ne doit pas dépasser ${rule.maxLength} caractères`;
      }
      if (rule.enum && !rule.enum.includes(value)) {
        return rule.message || `Le champ '${rule.field}' doit être l'un de: ${rule.enum.join(', ')}`;
      }
      break;

    case 'number':
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return rule.message || `Le champ '${rule.field}' doit être un nombre`;
      }
      if (rule.min !== undefined && numValue < rule.min) {
        return rule.message || `Le champ '${rule.field}' doit être au moins ${rule.min}`;
      }
      if (rule.max !== undefined && numValue > rule.max) {
        return rule.message || `Le champ '${rule.field}' ne doit pas dépasser ${rule.max}`;
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return rule.message || `Le champ '${rule.field}' doit être un booléen`;
      }
      break;

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return rule.message || `Le champ '${rule.field}' doit être une adresse email valide`;
      }
      break;

    case 'date':
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return rule.message || `Le champ '${rule.field}' doit être une date valide`;
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return rule.message || `Le champ '${rule.field}' doit être un tableau`;
      }
      if (rule.min !== undefined && value.length < rule.min) {
        return rule.message || `Le champ '${rule.field}' doit contenir au moins ${rule.min} élément(s)`;
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return rule.message || `Le champ '${rule.field}' ne doit pas contenir plus de ${rule.max} élément(s)`;
      }
      break;
  }

  // Validation personnalisée
  if (rule.custom && !rule.custom(value)) {
    return rule.message || `Le champ '${rule.field}' est invalide`;
  }

  return null;
}

/**
 * Valide les données selon un ensemble de règles
 */
export function validateData(
  data: Record<string, any>,
  rules: ValidationRule[]
): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];
    const error = validateValue(value, rule);
    if (error) {
      errors.push(error);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Middleware factory pour valider le body
 */
export function validateBody(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validateData(req.body, rules);
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: result.errors,
      });
    }
    
    next();
  };
}

/**
 * Middleware factory pour valider les query params
 */
export function validateQuery(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validateData(req.query as Record<string, any>, rules);
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation des paramètres',
        errors: result.errors,
      });
    }
    
    next();
  };
}

/**
 * Middleware factory pour valider les params de route
 */
export function validateParams(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validateData(req.params, rules);
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation des paramètres de route',
        errors: result.errors,
      });
    }
    
    next();
  };
}

/**
 * Middleware pour vérifier que l'ID est un UUID valide
 */
export function validateUuidParam(paramName: string = 'id') {
  return validateParams([
    { field: paramName, type: 'uuid', required: true },
  ]);
}

/**
 * Middleware pour vérifier le contexte clinic
 */
export function requireClinicContext(req: Request, res: Response, next: NextFunction) {
  const clinicId = (req as any).user?.clinic_id;
  
  if (!clinicId) {
    return res.status(400).json({
      success: false,
      message: 'Contexte de clinique manquant',
      code: 'CLINIC_CONTEXT_REQUIRED',
    });
  }
  
  if (!isValidUUID(clinicId)) {
    return res.status(400).json({
      success: false,
      message: 'ID de clinique invalide',
      code: 'INVALID_CLINIC_ID',
    });
  }
  
  next();
}

/**
 * Middleware combiné: auth + clinic context
 */
export function requireAuthAndClinic(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
      code: 'AUTHENTICATION_REQUIRED',
    });
  }
  
  if (!user.clinic_id || !isValidUUID(user.clinic_id)) {
    return res.status(400).json({
      success: false,
      message: 'Contexte de clinique manquant ou invalide',
      code: 'CLINIC_CONTEXT_REQUIRED',
    });
  }
  
  next();
}

/**
 * Règles de validation prédéfinies pour les entités courantes
 */
export const CommonValidationRules = {
  // Patient
  patient_id: { field: 'patient_id', type: 'uuid' as const, required: true },
  
  // Consultation
  consultation_id: { field: 'consultation_id', type: 'uuid' as const, required: true },
  
  // Médecin
  medecin_id: { field: 'medecin_id', type: 'uuid' as const, required: true },
  
  // Prescription
  prescription_id: { field: 'prescription_id', type: 'uuid' as const, required: true },
  
  // Montant
  montant: { field: 'montant', type: 'number' as const, required: true, min: 0 },
  
  // Statut
  statut: (values: string[]) => ({
    field: 'statut',
    type: 'string' as const,
    required: true,
    enum: values,
  }),
  
  // Date
  date: (fieldName: string, required = true) => ({
    field: fieldName,
    type: 'date' as const,
    required,
  }),
  
  // Texte obligatoire
  requiredText: (fieldName: string, minLength = 1, maxLength = 1000) => ({
    field: fieldName,
    type: 'string' as const,
    required: true,
    minLength,
    maxLength,
  }),
  
  // Tableau obligatoire
  requiredArray: (fieldName: string, min = 1) => ({
    field: fieldName,
    type: 'array' as const,
    required: true,
    min,
  }),
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  validateUuidParam,
  requireClinicContext,
  requireAuthAndClinic,
  validateData,
  isValidUUID,
  CommonValidationRules,
};

