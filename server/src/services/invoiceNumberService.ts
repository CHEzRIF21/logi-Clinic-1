import prisma from '../prisma';
import SchemaCacheService from './schemaCacheService';

/**
 * Service pour gérer la numérotation unique des factures
 * Garantit l'unicité et la non-réutilisabilité
 */
export class InvoiceNumberService {
  /**
   * Génère un numéro de facture unique
   * Format: FAC-CODE-YYYYMM-XXXX
   */
  static async generateUniqueInvoiceNumber(code: string = 'CLINIC'): Promise<string> {
    return await SchemaCacheService.executeWithRetry(async () => {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const prefix = `FAC-${code}-${year}${month}`;

      // Chercher le dernier numéro utilisé ce mois
      const lastInvoice = await prisma.invoice.findFirst({
        where: {
          number: {
            startsWith: prefix,
          },
        },
        orderBy: {
          number: 'desc',
        },
      });

      let sequence = 1;
      if (lastInvoice) {
        // Extraire le numéro de séquence du dernier numéro
        const lastSequence = parseInt(lastInvoice.number.split('-').pop() || '0');
        sequence = lastSequence + 1;
      }

      // Formater avec padding à 4 chiffres
      const sequenceStr = String(sequence).padStart(4, '0');
      const number = `${prefix}-${sequenceStr}`;

      // Vérifier l'unicité (double vérification)
      const exists = await prisma.invoice.findUnique({
        where: { number },
      });

      if (exists) {
        // Si existe (cas très rare), incrémenter
        return this.generateUniqueInvoiceNumber(code);
      }

      return number;
    });
  }

  /**
   * Vérifie qu'un numéro de facture n'existe pas déjà
   */
  static async isInvoiceNumberUnique(number: string): Promise<boolean> {
    return await SchemaCacheService.executeWithRetry(async () => {
      const exists = await prisma.invoice.findUnique({
        where: { number },
      });

      return !exists;
    });
  }

  /**
   * Génère une référence d'opération unique
   * Format: OP-DD-MM-YYYY-XXX
   */
  static async generateUniqueOperationReference(): Promise<string> {
    return await SchemaCacheService.executeWithRetry(async () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const prefix = `OP-${day}-${month}-${year}`;

      // Chercher le dernier numéro du jour
      const lastOperation = await prisma.operation.findFirst({
        where: {
          reference: {
            startsWith: prefix,
          },
        },
        orderBy: {
          reference: 'desc',
        },
      });

      let sequence = 1;
      if (lastOperation) {
        const lastSequence = parseInt(lastOperation.reference.split('-').pop() || '0');
        sequence = lastSequence + 1;
      }

      const sequenceStr = String(sequence).padStart(3, '0');
      const reference = `${prefix}-${sequenceStr}`;

      // Vérifier l'unicité
      const exists = await prisma.operation.findUnique({
        where: { reference },
      });

      if (exists) {
        return this.generateUniqueOperationReference();
      }

      return reference;
    });
  }
}

export default InvoiceNumberService;

