/**
 * Moyens de paiement spécifiques à l'Afrique de l'Ouest (XOF)
 * Synchronisé avec src/constants/paymentMethods.ts (frontend)
 */

export type PaymentMethod = 
  | 'especes'
  | 'orange_money'
  | 'mtn_mobile_money'
  | 'moov_money'
  | 'wave'
  | 'flooz'
  | 't_money'
  | 'carte_bancaire'
  | 'virement'
  | 'cheque'
  | 'prise_en_charge';

export interface PaymentMethodConfig {
  value: PaymentMethod;
  label: string;
  description?: string;
  requiresTransactionNumber?: boolean;
  requiresBank?: boolean;
  requiresCheckNumber?: boolean;
  requiresReference?: boolean;
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    value: 'especes',
    label: 'Espèces',
    description: 'Paiement en espèces (cash)',
  },
  {
    value: 'orange_money',
    label: 'Orange Money',
    description: 'Orange Money (Sénégal, Côte d\'Ivoire, Mali, Burkina Faso, Guinée)',
    requiresTransactionNumber: true,
  },
  {
    value: 'mtn_mobile_money',
    label: 'MTN Mobile Money',
    description: 'MTN Mobile Money (Ghana, Côte d\'Ivoire)',
    requiresTransactionNumber: true,
  },
  {
    value: 'moov_money',
    label: 'Moov Money',
    description: 'Moov Money (Côte d\'Ivoire, Togo, Bénin)',
    requiresTransactionNumber: true,
  },
  {
    value: 'wave',
    label: 'Wave',
    description: 'Wave (Sénégal, Côte d\'Ivoire, Mali, Burkina Faso)',
    requiresTransactionNumber: true,
  },
  {
    value: 'flooz',
    label: 'Flooz',
    description: 'Flooz (Togo)',
    requiresTransactionNumber: true,
  },
  {
    value: 't_money',
    label: 'T-Money',
    description: 'T-Money (Togo)',
    requiresTransactionNumber: true,
  },
  {
    value: 'carte_bancaire',
    label: 'Carte Bancaire',
    description: 'Carte bancaire (Visa, Mastercard)',
    requiresTransactionNumber: true,
  },
  {
    value: 'virement',
    label: 'Virement Bancaire',
    description: 'Virement bancaire',
    requiresTransactionNumber: true,
    requiresBank: true,
  },
  {
    value: 'cheque',
    label: 'Chèque',
    description: 'Chèque bancaire',
    requiresCheckNumber: true,
    requiresBank: true,
  },
  {
    value: 'prise_en_charge',
    label: 'Prise en Charge',
    description: 'Prise en charge (Assurance, mutuelle)',
    requiresReference: true,
  },
];

// Liste des valeurs valides pour validation
export const VALID_PAYMENT_METHODS: string[] = PAYMENT_METHODS.map(m => m.value);

// Pour rétro-compatibilité avec les anciens codes (MAJUSCULES)
export const LEGACY_PAYMENT_METHODS_MAP: Record<string, PaymentMethod> = {
  'ESPECE': 'especes',
  'ESPECES': 'especes',
  'CARTE': 'carte_bancaire',
  'CB': 'carte_bancaire',
  'MOBILE': 'orange_money', // Par défaut, mapper vers Orange Money
  'ASSURANCE': 'prise_en_charge',
  'VIREMENT': 'virement',
  'CHEQUE': 'cheque',
};

/**
 * Normalise un mode de paiement (gère la rétro-compatibilité)
 */
export const normalizePaymentMethod = (method: string): PaymentMethod | null => {
  const lower = method.toLowerCase();
  
  // Vérifier si c'est déjà un mode valide
  if (VALID_PAYMENT_METHODS.includes(lower)) {
    return lower as PaymentMethod;
  }
  
  // Vérifier les mappages legacy
  const upper = method.toUpperCase();
  if (upper in LEGACY_PAYMENT_METHODS_MAP) {
    return LEGACY_PAYMENT_METHODS_MAP[upper];
  }
  
  return null;
};

/**
 * Valide un mode de paiement
 */
export const isValidPaymentMethod = (method: string): boolean => {
  return normalizePaymentMethod(method) !== null;
};

/**
 * Récupère le libellé d'un mode de paiement
 */
export const getPaymentMethodLabel = (method: string): string => {
  const normalized = normalizePaymentMethod(method);
  if (!normalized) return method;
  
  const config = PAYMENT_METHODS.find(m => m.value === normalized);
  return config?.label || method;
};

/**
 * Récupère la configuration d'un mode de paiement
 */
export const getPaymentMethodConfig = (method: string): PaymentMethodConfig | undefined => {
  const normalized = normalizePaymentMethod(method);
  if (!normalized) return undefined;
  
  return PAYMENT_METHODS.find(m => m.value === normalized);
};

// Pour compatibilité avec l'ancien système (mobile_money générique)
export const MOBILE_MONEY_METHODS: PaymentMethod[] = [
  'orange_money',
  'mtn_mobile_money',
  'moov_money',
  'wave',
  'flooz',
  't_money',
];

/**
 * Vérifie si le mode de paiement est un mobile money
 */
export const isMobileMoney = (method: string): boolean => {
  const normalized = normalizePaymentMethod(method);
  return normalized !== null && MOBILE_MONEY_METHODS.includes(normalized);
};

