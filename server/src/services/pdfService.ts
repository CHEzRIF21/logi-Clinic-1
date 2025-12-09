import puppeteer from 'puppeteer';
import prisma from '../prisma';
import { formatCFA } from '../utils/calc';
import SchemaCacheService from './schemaCacheService';

export class PDFService {
  /**
   * Génère le PDF d'une facture
   * Utilise Puppeteer pour générer le PDF depuis un template HTML
   */
  static async generateFacturePDF(invoiceId: string): Promise<Buffer> {
    const invoice = await SchemaCacheService.executeWithRetry(async () => {
      return await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          patient: true,
          invoiceLines: {
            include: {
              product: true,
            },
            orderBy: {
              product: {
                category: 'asc',
              },
            },
          },
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    });

    if (!invoice) {
      throw new Error('Facture non trouvée');
    }

    // Grouper les lignes par catégorie
    const groupedLines: Record<string, typeof invoice.invoiceLines> = {};
    invoice.invoiceLines.forEach(line => {
      const category = line.product.category;
      if (!groupedLines[category]) {
        groupedLines[category] = [];
      }
      groupedLines[category].push(line);
    });

    // Calculer les sous-totaux par catégorie
    const categoryTotals: Record<string, number> = {};
    Object.keys(groupedLines).forEach(category => {
      categoryTotals[category] = groupedLines[category].reduce(
        (sum, line) => sum + Number(line.total),
        0
      );
    });

    const html = this.generateHTMLTemplate(invoice, groupedLines, categoryTotals);

    // Générer le PDF avec Puppeteer
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Génère le template HTML pour la facture
   */
  private static generateHTMLTemplate(
    invoice: any,
    groupedLines: Record<string, any[]>,
    categoryTotals: Record<string, number>
  ): string {
    const patient = invoice.patient;
    const totalHT = Number(invoice.totalHT);
    const totalTax = Number(invoice.totalTax);
    const totalDiscount = Number(invoice.totalDiscount);
    const totalTTC = Number(invoice.totalTTC);
    const amountPaid = Number(invoice.amountPaid);
    const remaining = totalTTC - amountPaid;

    const categoryLabels: Record<string, string> = {
      Consommable: 'Consommables',
      Acte: 'Actes',
      Medicament: 'Médicaments',
      Chambre: 'Chambres',
      Examen: 'Examens',
    };

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${invoice.number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      color: #333;
      line-height: 1.6;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #2563eb;
    }
    .logo-section {
      flex: 1;
    }
    .clinic-info {
      flex: 1;
      text-align: right;
    }
    .clinic-name {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 5px;
    }
    .clinic-details {
      font-size: 11px;
      color: #666;
    }
    .invoice-info {
      margin: 20px 0;
      display: flex;
      justify-content: space-between;
    }
    .patient-info, .invoice-details {
      flex: 1;
    }
    .section-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 10px;
      color: #2563eb;
      padding-bottom: 5px;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-row {
      margin: 5px 0;
      font-size: 11px;
    }
    .info-label {
      font-weight: bold;
      display: inline-block;
      width: 120px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    thead {
      background-color: #2563eb;
      color: white;
    }
    th {
      padding: 10px;
      text-align: left;
      font-weight: bold;
      font-size: 11px;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }
    tbody tr:hover {
      background-color: #f8fafc;
    }
    .category-header {
      background-color: #eff6ff;
      font-weight: bold;
      color: #1e40af;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .totals-section {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 400px;
      border: 1px solid #e2e8f0;
    }
    .totals-table td {
      padding: 8px 15px;
      border-bottom: 1px solid #e2e8f0;
    }
    .totals-table td:first-child {
      font-weight: bold;
      text-align: right;
      width: 60%;
    }
    .totals-table td:last-child {
      text-align: right;
      font-weight: bold;
    }
    .total-row {
      background-color: #eff6ff;
      font-size: 13px;
      font-weight: bold;
    }
    .remaining-row {
      background-color: #fef2f2;
      color: #dc2626;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #666;
      text-align: center;
    }
    .signature-section {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 250px;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 50px;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="clinic-name">LOGI CLINIC</div>
      <div class="clinic-details">
        Centre de Santé<br>
        Abidjan, Côte d'Ivoire<br>
        Tél: +225 XX XX XX XX<br>
        Email: contact@logiclinic.ci
      </div>
    </div>
    <div class="clinic-info">
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">FACTURE</div>
      <div class="info-row">
        <span class="info-label">N° Facture:</span>
        <span>${invoice.number}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span>${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</span>
      </div>
    </div>
  </div>

  <div class="invoice-info">
    <div class="patient-info">
      <div class="section-title">PATIENT</div>
      <div class="info-row">
        <span class="info-label">Nom:</span>
        <span>${patient.lastName} ${patient.firstName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Sexe:</span>
        <span>${patient.sex}</span>
      </div>
      ${patient.phone ? `
      <div class="info-row">
        <span class="info-label">Téléphone:</span>
        <span>${patient.phone}</span>
      </div>
      ` : ''}
      ${patient.address ? `
      <div class="info-row">
        <span class="info-label">Adresse:</span>
        <span>${patient.address}</span>
      </div>
      ` : ''}
    </div>
  </div>

  <div class="section-title">DÉTAIL DE LA FACTURE</div>
  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th class="text-center">Qté</th>
        <th class="text-right">P.U.</th>
        <th class="text-right">Remise</th>
        <th class="text-right">TVA</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${Object.keys(groupedLines).map(category => {
        const lines = groupedLines[category];
        const categoryLabel = categoryLabels[category] || category;
        return `
          <tr class="category-header">
            <td colspan="6">${categoryLabel}</td>
          </tr>
          ${lines.map(line => `
            <tr>
              <td>${line.product.label}</td>
              <td class="text-center">${line.qty} ${line.product.unit}</td>
              <td class="text-right">${formatCFA(Number(line.unitPrice))}</td>
              <td class="text-right">${Number(line.discount) > 0 ? `${Number(line.discount)}%` : '-'}</td>
              <td class="text-right">${Number(line.tax) > 0 ? formatCFA(Number(line.tax)) : '-'}</td>
              <td class="text-right">${formatCFA(Number(line.total))}</td>
            </tr>
          `).join('')}
          <tr class="category-header">
            <td colspan="5" class="text-right">Sous-total ${categoryLabel}:</td>
            <td class="text-right">${formatCFA(categoryTotals[category])}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="totals-section">
    <table class="totals-table">
      <tr>
        <td>Sous-total HT:</td>
        <td>${formatCFA(totalHT)}</td>
      </tr>
      ${totalDiscount > 0 ? `
      <tr>
        <td>Remise:</td>
        <td>-${formatCFA(totalDiscount)}</td>
      </tr>
      ` : ''}
      ${totalTax > 0 ? `
      <tr>
        <td>TVA:</td>
        <td>${formatCFA(totalTax)}</td>
      </tr>
      ` : ''}
      <tr class="total-row">
        <td>Total TTC:</td>
        <td>${formatCFA(totalTTC)}</td>
      </tr>
      ${amountPaid > 0 ? `
      <tr>
        <td>Montant payé:</td>
        <td>${formatCFA(amountPaid)}</td>
      </tr>
      ` : ''}
      ${remaining > 0 ? `
      <tr class="remaining-row">
        <td>Solde à payer:</td>
        <td>${formatCFA(remaining)}</td>
      </tr>
      ` : `
      <tr style="background-color: #dcfce7; color: #15803d;">
        <td>Statut:</td>
        <td>PAYÉE</td>
      </tr>
      `}
    </table>
  </div>

  ${invoice.comment ? `
  <div style="margin-top: 20px;">
    <div class="section-title">COMMENTAIRE</div>
    <div style="padding: 10px; background-color: #f8fafc; border-left: 3px solid #2563eb; margin-top: 10px;">
      ${invoice.comment.replace(/\n/g, '<br>')}
    </div>
  </div>
  ` : ''}

  ${invoice.payments.length > 0 ? `
  <div style="margin-top: 20px;">
    <div class="section-title">HISTORIQUE DES PAIEMENTS</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Mode</th>
          <th>Référence</th>
          <th class="text-right">Montant</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.payments.map((payment: any) => `
          <tr>
            <td>${new Date(payment.createdAt).toLocaleDateString('fr-FR')}</td>
            <td>${payment.method}</td>
            <td>${payment.reference || '-'}</td>
            <td class="text-right">${formatCFA(Number(payment.amount))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">Le Caissier</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Le Patient</div>
    </div>
  </div>

  <div class="footer">
    <p>Merci de votre confiance !</p>
    <p>Cette facture est générée électroniquement et a valeur légale.</p>
    <p>En cas de réclamation, veuillez contacter le service client.</p>
  </div>
</body>
</html>
    `;
  }
}

export default PDFService;

