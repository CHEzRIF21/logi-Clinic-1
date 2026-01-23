import { Facture, Paiement } from './facturationService';
import { Patient } from './supabase';
import { getPaymentMethodLabel } from '../constants/paymentMethods';

export interface ReceiptPrintData {
  facture: Facture;
  paiement: Paiement;
  patient: Patient | null;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  caissierName?: string;
}

export class ReceiptPrintService {
  /**
   * Génère le HTML du reçu de paiement
   */
  static generateReceiptHTML(data: ReceiptPrintData): string {
    const { facture, paiement, patient, clinicName, clinicAddress, clinicPhone, clinicEmail, caissierName } = data;

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reçu de Paiement - ${facture.numero_facture}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: A4;
      margin: 1.5cm;
    }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      color: #333;
      line-height: 1.6;
      padding: 20px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .clinic-name {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .clinic-details {
      font-size: 10pt;
      color: #666;
      line-height: 1.8;
    }
    .receipt-title {
      font-size: 20px;
      font-weight: bold;
      color: #2563eb;
      margin: 20px 0;
      text-align: center;
      text-transform: uppercase;
    }
    .info-section {
      margin: 20px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .info-box {
      background: #f8fafc;
      padding: 15px;
      border-left: 4px solid #2563eb;
      border-radius: 4px;
    }
    .info-label {
      font-weight: bold;
      color: #2563eb;
      font-size: 9pt;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 11pt;
      color: #333;
    }
    .payment-details {
      margin: 30px 0;
      background: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #2563eb;
    }
    .payment-amount {
      text-align: center;
      margin: 20px 0;
    }
    .amount-label {
      font-size: 12pt;
      color: #666;
      margin-bottom: 10px;
    }
    .amount-value {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
    }
    .payment-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 20px;
    }
    .payment-item {
      padding: 10px;
      background: white;
      border-radius: 4px;
    }
    .payment-item-label {
      font-size: 9pt;
      color: #666;
      margin-bottom: 5px;
    }
    .payment-item-value {
      font-size: 11pt;
      font-weight: bold;
      color: #333;
    }
    .invoice-summary {
      margin: 30px 0;
    }
    .summary-title {
      font-size: 14pt;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #2563eb;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .summary-table th {
      background: #2563eb;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 10pt;
      font-weight: bold;
    }
    .summary-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10pt;
    }
    .summary-table tr:last-child td {
      border-bottom: none;
    }
    .summary-total {
      background: #eff6ff;
      font-weight: bold;
    }
    .summary-total td {
      padding: 15px 12px;
      font-size: 12pt;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    .signature-section {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 250px;
      text-align: center;
    }
    .signature-line {
      border-top: 2px solid #333;
      margin-top: 60px;
      padding-top: 5px;
      font-size: 10pt;
      font-weight: bold;
    }
    .thank-you {
      text-align: center;
      margin: 30px 0;
      font-size: 14pt;
      color: #2563eb;
      font-weight: bold;
    }
    @media print {
      body {
        margin: 0;
        padding: 15px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-name">${clinicName || 'LOGI CLINIC'}</div>
    <div class="clinic-details">
      ${clinicAddress || 'Centre de Santé'}<br>
      ${clinicPhone || 'Tél: +225 XX XX XX XX'}<br>
      ${clinicEmail || 'Email: contact@logiclinic.ci'}
    </div>
  </div>

  <div class="receipt-title">Reçu de Paiement</div>

  <div class="info-section">
    <div class="info-box">
      <div class="info-label">Informations Patient</div>
      <div class="info-value">
        <strong>${patient ? `${patient.prenom} ${patient.nom}` : 'N/A'}</strong><br>
        ${patient?.identifiant ? `ID: ${patient.identifiant}<br>` : ''}
        ${patient?.telephone ? `Tél: ${patient.telephone}` : ''}
      </div>
    </div>
    <div class="info-box">
      <div class="info-label">Informations Facture</div>
      <div class="info-value">
        <strong>N° Facture:</strong> ${facture.numero_facture}<br>
        <strong>Date Facture:</strong> ${formatDate(facture.date_facture)}<br>
        <strong>N° Paiement:</strong> ${paiement.numero_paiement || 'N/A'}
      </div>
    </div>
  </div>

  <div class="payment-details">
    <div class="payment-amount">
      <div class="amount-label">Montant Payé</div>
      <div class="amount-value">${formatCurrency(paiement.montant)}</div>
    </div>
    <div class="payment-info">
      <div class="payment-item">
        <div class="payment-item-label">Mode de Paiement</div>
        <div class="payment-item-value">${getPaymentMethodLabel(paiement.mode_paiement)}</div>
      </div>
      <div class="payment-item">
        <div class="payment-item-label">Date de Paiement</div>
        <div class="payment-item-value">${formatDate(paiement.date_paiement)}</div>
      </div>
      ${paiement.numero_transaction ? `
      <div class="payment-item">
        <div class="payment-item-label">N° Transaction</div>
        <div class="payment-item-value">${paiement.numero_transaction}</div>
      </div>
      ` : ''}
      ${paiement.banque ? `
      <div class="payment-item">
        <div class="payment-item-label">Banque</div>
        <div class="payment-item-value">${paiement.banque}</div>
      </div>
      ` : ''}
      ${paiement.numero_cheque ? `
      <div class="payment-item">
        <div class="payment-item-label">N° Chèque</div>
        <div class="payment-item-value">${paiement.numero_cheque}</div>
      </div>
      ` : ''}
      ${paiement.reference_prise_en_charge ? `
      <div class="payment-item">
        <div class="payment-item-label">Réf. Prise en Charge</div>
        <div class="payment-item-value">${paiement.reference_prise_en_charge}</div>
      </div>
      ` : ''}
    </div>
  </div>

  ${facture.lignes && facture.lignes.length > 0 ? `
  <div class="invoice-summary">
    <div class="summary-title">Détails de la Facture</div>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Qté</th>
          <th style="text-align: right;">Prix Unitaire</th>
          <th style="text-align: right;">Montant</th>
        </tr>
      </thead>
      <tbody>
        ${facture.lignes.map((ligne) => `
          <tr>
            <td>${ligne.libelle}</td>
            <td style="text-align: center;">${ligne.quantite}</td>
            <td style="text-align: right;">${formatCurrency(ligne.prix_unitaire)}</td>
            <td style="text-align: right;">${formatCurrency(ligne.montant_ligne)}</td>
          </tr>
        `).join('')}
        <tr class="summary-total">
          <td colspan="3" style="text-align: right;"><strong>Total Facture:</strong></td>
          <td style="text-align: right;">${formatCurrency(facture.montant_total)}</td>
        </tr>
        <tr>
          <td colspan="3" style="text-align: right;">Montant Payé:</td>
          <td style="text-align: right;">${formatCurrency(facture.montant_paye)}</td>
        </tr>
        ${facture.montant_restant > 0 ? `
        <tr>
          <td colspan="3" style="text-align: right; color: #dc2626;"><strong>Reste à Payer:</strong></td>
          <td style="text-align: right; color: #dc2626; font-weight: bold;">${formatCurrency(facture.montant_restant)}</td>
        </tr>
        ` : `
        <tr style="background: #dcfce7;">
          <td colspan="3" style="text-align: right; color: #15803d;"><strong>Statut:</strong></td>
          <td style="text-align: right; color: #15803d; font-weight: bold;">FACTURE PAYÉE</td>
        </tr>
        `}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${paiement.notes ? `
  <div style="margin: 20px 0; padding: 15px; background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
    <div style="font-weight: bold; color: #2563eb; margin-bottom: 5px;">Notes:</div>
    <div style="color: #333;">${paiement.notes}</div>
  </div>
  ` : ''}

  <div class="thank-you">Merci de votre confiance !</div>

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">${caissierName || 'Le Caissier'}</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Le Patient</div>
    </div>
  </div>

  <div class="footer">
    <p><strong>Ce reçu est généré électroniquement et a valeur légale.</strong></p>
    <p>En cas de réclamation, veuillez contacter le service client.</p>
    <p style="margin-top: 10px; font-size: 8pt;">Imprimé le ${formatDate(new Date())}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Ouvre une fenêtre d'impression pour le reçu
   */
  static printReceipt(data: ReceiptPrintData): void {
    const html = this.generateReceiptHTML(data);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Veuillez autoriser les pop-ups pour imprimer le reçu');
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Fermer la fenêtre après impression (optionnel)
        // printWindow.close();
      }, 250);
    };
  }
}
