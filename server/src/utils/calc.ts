import { Decimal } from '@prisma/client/runtime/library';

/**
 * Utilitaires de calcul pour les factures
 */

export function calculateLineTotal(
  qty: number,
  unitPrice: number,
  discount: number = 0,
  taxPercent: number = 0
): number {
  const subtotal = qty * unitPrice;
  const discountAmount = subtotal * (discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxPercent / 100);
  return afterDiscount + taxAmount;
}

export function calculateInvoiceTotals(lines: Array<{
  qty: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}>): {
  totalHT: number;
  totalTax: number;
  totalDiscount: number;
  totalTTC: number;
} {
  let totalHT = 0;
  let totalTax = 0;
  let totalDiscount = 0;
  let totalTTC = 0;

  lines.forEach(line => {
    const subtotal = line.qty * line.unitPrice;
    const discountAmount = subtotal * (line.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (line.tax / 100);
    
    totalHT += afterDiscount;
    totalTax += taxAmount;
    totalDiscount += discountAmount;
    totalTTC += afterDiscount + taxAmount;
  });

  return {
    totalHT: Number(totalHT.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    totalTTC: Number(totalTTC.toFixed(2)),
  };
}

export function formatCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateInvoiceNumber(code: string = 'CLINIC'): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `FAC-${code}-${year}${month}-${random}`;
}

export function generateOperationReference(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `OP-${day}-${month}-${year}-${random}`;
}

