import { format, parseISO, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Calcule l'âge à partir d'une date de naissance
 */
export function calculateAge(dob: Date | string): number {
  try {
    const birthDate = typeof dob === 'string' ? parseISO(dob) : dob;
    return differenceInYears(new Date(), birthDate);
  } catch (error) {
    return 0;
  }
}

/**
 * Formate une date au format français
 */
export function formatDate(date: Date | string | null | undefined, formatStr: string = 'dd/MM/yyyy'): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: fr });
  } catch (error) {
    return '';
  }
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Génère une référence d'opération au format OP-DD-MM-YYYY-XXX
 */
export function generateOperationReference(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `OP-${day}-${month}-${year}-${random}`;
}

/**
 * Génère un numéro de facture au format FAC-CODE-DATE-XXX
 */
export function generateInvoiceNumber(code: string = 'CLINIC'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `FAC-${code}-${year}${month}-${random}`;
}

