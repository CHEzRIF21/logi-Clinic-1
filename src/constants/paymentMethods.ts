// Moyens de paiement spécifiques à l'Afrique de l'Ouest (XOF)

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
  icon?: string;
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

export const getPaymentMethodLabel = (method: PaymentMethod | string): string => {
  const config = PAYMENT_METHODS.find(m => m.value === method);
  return config?.label || method;
};

export const getPaymentMethodDescription = (method: PaymentMethod | string): string | undefined => {
  const config = PAYMENT_METHODS.find(m => m.value === method);
  return config?.description;
};

export const getPaymentMethodConfig = (method: PaymentMethod | string): PaymentMethodConfig | undefined => {
  return PAYMENT_METHODS.find(m => m.value === method);
};

// Pour compatibilité avec l'ancien système (mobile_money générique)
export const LEGACY_MOBILE_MONEY_METHODS: PaymentMethod[] = [
  'orange_money',
  'mtn_mobile_money',
  'moov_money',
  'wave',
  'flooz',
  't_money',
];

