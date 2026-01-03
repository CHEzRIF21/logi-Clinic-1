/**
 * Codes d'erreur standardisés pour l'API LogiClinic
 * Permet une gestion cohérente des erreurs côté frontend
 */

/**
 * Catégories d'erreurs
 */
export enum ErrorCategory {
  AUTHENTICATION = 'AUTH',
  AUTHORIZATION = 'AUTHZ',
  VALIDATION = 'VALID',
  BUSINESS = 'BIZ',
  DATABASE = 'DB',
  INTEGRATION = 'INTEG',
  SYSTEM = 'SYS',
  NETWORK = 'NET',
}

/**
 * Codes d'erreur avec leurs messages par défaut
 */
export const ErrorCodes = {
  // ==========================================
  // Erreurs d'authentification (AUTH)
  // ==========================================
  AUTH_TOKEN_MISSING: {
    code: 'AUTH_001',
    message: 'Token d\'authentification manquant',
    httpStatus: 401,
  },
  AUTH_TOKEN_INVALID: {
    code: 'AUTH_002',
    message: 'Token d\'authentification invalide',
    httpStatus: 401,
  },
  AUTH_TOKEN_EXPIRED: {
    code: 'AUTH_003',
    message: 'Session expirée, veuillez vous reconnecter',
    httpStatus: 401,
  },
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_004',
    message: 'Identifiants invalides',
    httpStatus: 401,
  },
  AUTH_ACCOUNT_LOCKED: {
    code: 'AUTH_005',
    message: 'Compte verrouillé. Contactez l\'administrateur',
    httpStatus: 403,
  },
  AUTH_CLINIC_CODE_INVALID: {
    code: 'AUTH_006',
    message: 'Code clinique invalide',
    httpStatus: 401,
  },

  // ==========================================
  // Erreurs d'autorisation (AUTHZ)
  // ==========================================
  AUTHZ_PERMISSION_DENIED: {
    code: 'AUTHZ_001',
    message: 'Permission refusée pour cette action',
    httpStatus: 403,
  },
  AUTHZ_ROLE_INSUFFICIENT: {
    code: 'AUTHZ_002',
    message: 'Rôle insuffisant pour cette opération',
    httpStatus: 403,
  },
  AUTHZ_CLINIC_MISMATCH: {
    code: 'AUTHZ_003',
    message: 'Accès non autorisé à cette clinique',
    httpStatus: 403,
  },
  AUTHZ_RESOURCE_OWNERSHIP: {
    code: 'AUTHZ_004',
    message: 'Vous n\'êtes pas propriétaire de cette ressource',
    httpStatus: 403,
  },

  // ==========================================
  // Erreurs de validation (VALID)
  // ==========================================
  VALID_REQUIRED_FIELD: {
    code: 'VALID_001',
    message: 'Champ obligatoire manquant',
    httpStatus: 400,
  },
  VALID_INVALID_FORMAT: {
    code: 'VALID_002',
    message: 'Format de données invalide',
    httpStatus: 400,
  },
  VALID_INVALID_UUID: {
    code: 'VALID_003',
    message: 'Identifiant UUID invalide',
    httpStatus: 400,
  },
  VALID_INVALID_DATE: {
    code: 'VALID_004',
    message: 'Format de date invalide',
    httpStatus: 400,
  },
  VALID_INVALID_EMAIL: {
    code: 'VALID_005',
    message: 'Format d\'email invalide',
    httpStatus: 400,
  },
  VALID_VALUE_OUT_OF_RANGE: {
    code: 'VALID_006',
    message: 'Valeur hors des limites autorisées',
    httpStatus: 400,
  },
  VALID_CLINIC_CONTEXT_MISSING: {
    code: 'VALID_007',
    message: 'Contexte de clinique manquant',
    httpStatus: 400,
  },

  // ==========================================
  // Erreurs métier (BIZ)
  // ==========================================
  BIZ_CONSULTATION_ALREADY_CLOSED: {
    code: 'BIZ_001',
    message: 'Cette consultation est déjà clôturée',
    httpStatus: 400,
  },
  BIZ_PRESCRIPTION_ALREADY_DISPENSED: {
    code: 'BIZ_002',
    message: 'Cette prescription a déjà été dispensée',
    httpStatus: 400,
  },
  BIZ_STOCK_INSUFFICIENT: {
    code: 'BIZ_003',
    message: 'Stock insuffisant pour cette opération',
    httpStatus: 400,
  },
  BIZ_LOT_EXPIRED: {
    code: 'BIZ_004',
    message: 'Ce lot est expiré',
    httpStatus: 400,
  },
  BIZ_PAYMENT_REQUIRED: {
    code: 'BIZ_005',
    message: 'Paiement requis avant de continuer',
    httpStatus: 402,
  },
  BIZ_PATIENT_INACTIVE: {
    code: 'BIZ_006',
    message: 'Ce patient est inactif',
    httpStatus: 400,
  },
  BIZ_DUPLICATE_ENTRY: {
    code: 'BIZ_007',
    message: 'Cette entrée existe déjà',
    httpStatus: 409,
  },
  BIZ_OPERATION_NOT_ALLOWED: {
    code: 'BIZ_008',
    message: 'Cette opération n\'est pas autorisée dans l\'état actuel',
    httpStatus: 400,
  },
  BIZ_LAB_RESULTS_NOT_VALIDATED: {
    code: 'BIZ_009',
    message: 'Les résultats de laboratoire ne sont pas encore validés',
    httpStatus: 400,
  },
  BIZ_PRESCRIPTION_CANCELLED: {
    code: 'BIZ_010',
    message: 'Cette prescription a été annulée',
    httpStatus: 400,
  },

  // ==========================================
  // Erreurs de base de données (DB)
  // ==========================================
  DB_ENTITY_NOT_FOUND: {
    code: 'DB_001',
    message: 'Entité non trouvée',
    httpStatus: 404,
  },
  DB_CONSTRAINT_VIOLATION: {
    code: 'DB_002',
    message: 'Violation de contrainte de base de données',
    httpStatus: 400,
  },
  DB_UNIQUE_VIOLATION: {
    code: 'DB_003',
    message: 'Cette valeur existe déjà',
    httpStatus: 409,
  },
  DB_FOREIGN_KEY_VIOLATION: {
    code: 'DB_004',
    message: 'Référence à une entité inexistante',
    httpStatus: 400,
  },
  DB_CONNECTION_ERROR: {
    code: 'DB_005',
    message: 'Erreur de connexion à la base de données',
    httpStatus: 503,
  },

  // ==========================================
  // Erreurs d'intégration (INTEG)
  // ==========================================
  INTEG_MODULE_UNAVAILABLE: {
    code: 'INTEG_001',
    message: 'Module indisponible',
    httpStatus: 503,
  },
  INTEG_SYNC_FAILED: {
    code: 'INTEG_002',
    message: 'Échec de synchronisation entre modules',
    httpStatus: 500,
  },
  INTEG_TICKET_CREATION_FAILED: {
    code: 'INTEG_003',
    message: 'Échec de création du ticket de facturation',
    httpStatus: 500,
  },
  INTEG_NOTIFICATION_FAILED: {
    code: 'INTEG_004',
    message: 'Échec d\'envoi de notification',
    httpStatus: 500,
  },

  // ==========================================
  // Erreurs système (SYS)
  // ==========================================
  SYS_INTERNAL_ERROR: {
    code: 'SYS_001',
    message: 'Erreur interne du serveur',
    httpStatus: 500,
  },
  SYS_SERVICE_UNAVAILABLE: {
    code: 'SYS_002',
    message: 'Service temporairement indisponible',
    httpStatus: 503,
  },
  SYS_RATE_LIMITED: {
    code: 'SYS_003',
    message: 'Trop de requêtes, veuillez patienter',
    httpStatus: 429,
  },
  SYS_MAINTENANCE: {
    code: 'SYS_004',
    message: 'Système en maintenance',
    httpStatus: 503,
  },
} as const;

/**
 * Type pour les codes d'erreur
 */
export type ErrorCode = keyof typeof ErrorCodes;

/**
 * Interface pour une erreur standardisée
 */
export interface StandardError {
  code: string;
  message: string;
  httpStatus: number;
  details?: Record<string, any>;
  traceId?: string;
}

/**
 * Crée une erreur standardisée
 */
export function createError(
  errorCode: ErrorCode,
  details?: Record<string, any>,
  customMessage?: string,
  traceId?: string
): StandardError {
  const errorDef = ErrorCodes[errorCode];
  return {
    code: errorDef.code,
    message: customMessage || errorDef.message,
    httpStatus: errorDef.httpStatus,
    details,
    traceId,
  };
}

/**
 * Vérifie si une erreur est d'un certain type
 */
export function isErrorCode(error: any, errorCode: ErrorCode): boolean {
  return error?.code === ErrorCodes[errorCode].code;
}

/**
 * Récupère le message français pour un code d'erreur
 */
export function getErrorMessage(code: string): string {
  for (const key of Object.keys(ErrorCodes) as ErrorCode[]) {
    if (ErrorCodes[key].code === code) {
      return ErrorCodes[key].message;
    }
  }
  return 'Une erreur est survenue';
}

export default ErrorCodes;

