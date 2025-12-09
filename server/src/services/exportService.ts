import prisma from '../prisma';
import SchemaCacheService from './schemaCacheService';
import { formatDate } from '../utils/date';

export interface ExportOptions {
  format: 'CSV' | 'SIE' | 'XML';
  startDate: Date;
  endDate: Date;
  includeDetails?: boolean;
}

export class ExportService {
  /**
   * Exporte les écritures comptables au format CSV
   */
  static async exportAccountingCSV(options: ExportOptions): Promise<string> {
    return await SchemaCacheService.executeWithRetry(async () => {
      const invoices = await prisma.invoice.findMany({
        where: {
          dateEmission: {
            gte: options.startDate,
            lte: options.endDate,
          },
          status: {
            not: 'ANNULEE',
          },
        },
        include: {
          patient: true,
          invoiceLines: {
            include: {
              product: true,
            },
          },
          payments: true,
        },
      });

      const entries: string[] = [];
      
      // En-tête CSV
      entries.push('Date;Compte Débit;Compte Crédit;Libellé;Montant;Pièce');

      invoices.forEach((invoice) => {
        // Écriture pour chaque facture
        const date = formatDate(invoice.dateEmission, 'yyyy-MM-dd');
        const libelle = `Facture ${invoice.number} - ${invoice.patient.firstName} ${invoice.patient.lastName}`;
        
        // Débit: Compte client (411000)
        entries.push(`${date};411000;701000;${libelle};${invoice.totalTTC};${invoice.number}`);
        
        // Crédit: Compte produit (701000)
        invoice.invoiceLines.forEach((line) => {
          const compteProduit = line.product.compteComptable || '701000';
          entries.push(`${date};${compteProduit};411000;${line.product.label};${line.total};${invoice.number}`);
        });

        // Paiements
        invoice.payments.forEach((payment) => {
          const compteCaisse = payment.method === 'ESPECE' ? '531000' : 
                              payment.method === 'CB' ? '512000' :
                              payment.method === 'VIREMENT' ? '512000' : '411000';
          entries.push(`${formatDate(payment.createdAt, 'yyyy-MM-dd')};${compteCaisse};411000;Paiement ${invoice.number};${payment.amount};${invoice.number}`);
        });
      });

      return entries.join('\n');
    });
  }

  /**
   * Exporte le journal de caisse au format CSV
   */
  static async exportCaisseJournalCSV(options: {
    startDate: Date;
    endDate: Date;
  }): Promise<string> {
    return await SchemaCacheService.executeWithRetry(async () => {
      const entries = await prisma.caisseEntry.findMany({
        where: {
          date: {
            gte: options.startDate,
            lte: options.endDate,
          },
        },
        include: {
          ligneBudgetaire: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      const payments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: options.startDate,
            lte: options.endDate,
          },
        },
        include: {
          invoice: {
            select: {
              number: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const lines: string[] = [];
      lines.push('Date;Type;Libellé;Montant;Mode;Référence;Ligne Budgétaire');

      // Entrées (paiements)
      payments.forEach((payment) => {
        lines.push(
          `${formatDate(payment.createdAt, 'dd/MM/yyyy HH:mm')};ENTREE;Paiement facture ${payment.invoice.number};${payment.amount};${payment.method};${payment.reference || ''};`
        );
      });

      // Sorties (dépenses)
      entries.forEach((entry) => {
        lines.push(
          `${formatDate(entry.date, 'dd/MM/yyyy HH:mm')};${entry.type};${entry.description || 'Dépense'};${entry.amount};${entry.type === 'DEPOT' ? 'Dépôt' : 'Dépense'};${entry.ligneBudgetaire?.code || ''};${entry.ligneBudgetaire?.libelle || ''}`
        );
      });

      return lines.join('\n');
    });
  }

  /**
   * Exporte les écritures au format SIE (format comptable suédois)
   */
  static async exportAccountingSIE(options: ExportOptions): Promise<string> {
    // Format SIE simplifié
    const csv = await this.exportAccountingCSV(options);
    // Convertir en format SIE basique
    return `#FLAGGA 0\n#SIETYP 4\n#PROGRAM "Logi Clinic" 1.0\n#GEN ${formatDate(options.startDate, 'yyyyMMdd')}\n#BTRANS\n${csv}`;
  }

  /**
   * Exporte les écritures au format XML
   */
  static async exportAccountingXML(options: ExportOptions): Promise<string> {
    return await SchemaCacheService.executeWithRetry(async () => {
      const invoices = await prisma.invoice.findMany({
        where: {
          dateEmission: {
            gte: options.startDate,
            lte: options.endDate,
          },
          status: {
            not: 'ANNULEE',
          },
        },
        include: {
          patient: true,
          invoiceLines: {
            include: {
              product: true,
            },
          },
          payments: true,
        },
      });

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<ecritures>\n';

      invoices.forEach((invoice) => {
        xml += `  <ecriture>\n`;
        xml += `    <date>${formatDate(invoice.dateEmission, 'yyyy-MM-dd')}</date>\n`;
        xml += `    <piece>${invoice.number}</piece>\n`;
        xml += `    <libelle>Facture ${invoice.number}</libelle>\n`;
        xml += `    <lignes>\n`;
        
        // Ligne débit
        xml += `      <ligne>\n`;
        xml += `        <compte>411000</compte>\n`;
        xml += `        <sens>DEBIT</sens>\n`;
        xml += `        <montant>${invoice.totalTTC}</montant>\n`;
        xml += `      </ligne>\n`;
        
        // Ligne crédit
        xml += `      <ligne>\n`;
        xml += `        <compte>701000</compte>\n`;
        xml += `        <sens>CREDIT</sens>\n`;
        xml += `        <montant>${invoice.totalTTC}</montant>\n`;
        xml += `      </ligne>\n`;
        
        xml += `    </lignes>\n`;
        xml += `  </ecriture>\n`;
      });

      xml += '</ecritures>';
      return xml;
    });
  }
}

export default ExportService;

