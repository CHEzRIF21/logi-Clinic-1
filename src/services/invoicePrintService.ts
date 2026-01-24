import { Facture, LigneFacture, Paiement } from './facturationService';
import { Patient } from './supabase';
import { getPaymentMethodLabel } from '../constants/paymentMethods';
import { supabase } from './supabase';
import { getMyClinicId } from './clinicService';

export interface InvoicePrintData {
  facture: Facture;
  patient: Patient | null;
  lignes: LigneFacture[];
  paiements: Paiement[];
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicIfu?: string;
  clinicRccm?: string;
  clinicLogo?: string;
  caissierName?: string;
  consultationType?: string;
  devise?: string;
}

export class InvoicePrintService {
  /**
   * Récupère les informations de la clinique
   */
  static async getClinicInfo(): Promise<{
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    ifu?: string;
    rccm?: string;
    logo?: string;
  }> {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) {
        return {};
      }

      const { data: clinicData } = await supabase
        .from('clinics')
        .select('name, address, phone, email, ifu, rccm, logo_url')
        .eq('id', clinicId)
        .single();

      if (clinicData) {
        return {
          name: clinicData.name,
          address: clinicData.address,
          phone: clinicData.phone,
          email: clinicData.email,
          ifu: clinicData.ifu,
          rccm: clinicData.rccm,
          logo: clinicData.logo_url,
        };
      }
    } catch (error) {
      console.error('Erreur récupération infos clinique:', error);
    }
    return {};
  }

  /**
   * Génère le HTML de la facture avec impression en double
   */
  static generateInvoiceHTML(data: InvoicePrintData): string {
    const {
      facture,
      patient,
      lignes,
      paiements,
      clinicName,
      clinicAddress,
      clinicPhone,
      clinicEmail,
      clinicIfu,
      clinicRccm,
      clinicLogo,
      caissierName,
      consultationType,
      devise = 'XOF',
    } = data;

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: devise,
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };

    const formatDateTime = (date: string | Date) => {
      return new Date(date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    // Déterminer le statut de la facture
    const isPaid = facture.statut === 'payee' && facture.montant_restant <= 0;
    const statusText = isPaid ? 'Facture acquittée' : 'Facture non soldée';

    // Grouper les lignes par service
    const lignesParService = lignes.reduce((acc, ligne) => {
      const service = ligne.code_service?.split('-')[0] || 'Autre';
      if (!acc[service]) {
        acc[service] = [];
      }
      acc[service].push(ligne);
      return acc;
    }, {} as Record<string, LigneFacture[]>);

    // Générer une facture (sera dupliquée)
    const generateSingleInvoice = () => `
      <div class="invoice-page">
        <!-- EN-TÊTE -->
        <div class="header">
          <div class="header-left">
            ${clinicLogo ? `<img src="${clinicLogo}" alt="Logo" class="clinic-logo" />` : ''}
            ${clinicName ? `<div class="clinic-name">${clinicName}</div>` : ''}
            ${clinicAddress ? `<div class="clinic-address">${clinicAddress}</div>` : ''}
            ${clinicPhone ? `<div class="clinic-contact">Tél: ${clinicPhone}</div>` : ''}
            ${clinicEmail ? `<div class="clinic-contact">Email: ${clinicEmail}</div>` : ''}
            ${clinicIfu ? `<div class="clinic-contact">N° IFU: ${clinicIfu}</div>` : ''}
            ${clinicRccm ? `<div class="clinic-contact">RCCM: ${clinicRccm}</div>` : ''}
            <div class="clinic-contact">Devise: ${devise}</div>
          </div>
          <div class="header-right">
            ${clinicLogo ? `<img src="${clinicLogo}" alt="Logo" class="clinic-logo" />` : ''}
            ${clinicName ? `<div class="clinic-name">${clinicName}</div>` : ''}
            ${clinicAddress ? `<div class="clinic-address">${clinicAddress}</div>` : ''}
            ${clinicPhone ? `<div class="clinic-contact">Tél: ${clinicPhone}</div>` : ''}
            ${clinicEmail ? `<div class="clinic-contact">Email: ${clinicEmail}</div>` : ''}
            ${clinicIfu ? `<div class="clinic-contact">N° IFU: ${clinicIfu}</div>` : ''}
            ${clinicRccm ? `<div class="clinic-contact">RCCM: ${clinicRccm}</div>` : ''}
            <div class="clinic-contact">Devise: ${devise}</div>
          </div>
        </div>

        <!-- INFORMATIONS PATIENT -->
        <div class="patient-section">
          <div class="section-title">👤 INFORMATIONS PATIENT</div>
          <div class="patient-info-grid">
            <div class="info-item">
              <span class="info-label">Nom & Prénoms:</span>
              <span class="info-value">${patient ? `${patient.prenom || ''} ${patient.nom || ''}`.trim() : 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Sexe – Âge:</span>
              <span class="info-value">
                ${patient?.sexe || 'N/A'}${patient?.date_naissance ? ` – ${new Date().getFullYear() - new Date(patient.date_naissance).getFullYear()} ans` : ''}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">ID Patient:</span>
              <span class="info-value">${patient?.identifiant || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Type:</span>
              <span class="info-value">Interne</span>
            </div>
          </div>
        </div>

        <!-- INFORMATIONS FACTURE -->
        <div class="invoice-info-section">
          <div class="section-title">📄 INFORMATIONS FACTURE</div>
          <div class="invoice-info-grid">
            <div class="info-item">
              <span class="info-label">Numéro de facture:</span>
              <span class="info-value">${facture.numero_facture}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date & heure:</span>
              <span class="info-value">${formatDateTime(facture.date_facture)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Caissier:</span>
              <span class="info-value">${caissierName || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Origine:</span>
              <span class="info-value">${consultationType || facture.service_origine || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Clinique / Site:</span>
              <span class="info-value">${clinicName || 'N/A'}</span>
            </div>
          </div>
        </div>

        <!-- DÉTAIL DES ACTES -->
        <div class="acts-section">
          <div class="section-title">🧪 DÉTAIL DES ACTES</div>
          <table class="acts-table">
            <thead>
              <tr>
                <th>Acte</th>
                <th>Service</th>
                <th>Qté</th>
                <th>Prix</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${lignes.map((ligne) => {
                const service = ligne.code_service?.split('-')[0] || 'Autre';
                return `
                  <tr>
                    <td>${ligne.libelle}</td>
                    <td>${service}</td>
                    <td class="text-center">${ligne.quantite}</td>
                    <td class="text-right">${formatCurrency(ligne.prix_unitaire)}</td>
                    <td class="text-right">${formatCurrency(ligne.montant_ligne)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- RÉCAPITULATIF FINANCIER -->
        <div class="financial-section">
          <div class="section-title">💰 RÉCAPITULATIF FINANCIER</div>
          <div class="financial-summary">
            <div class="summary-row">
              <span class="summary-label">Sous-total:</span>
              <span class="summary-value">${formatCurrency(facture.montant_total + facture.montant_remise)}</span>
            </div>
            ${facture.montant_remise > 0 ? `
            <div class="summary-row">
              <span class="summary-label">Remise:</span>
              <span class="summary-value">-${formatCurrency(facture.montant_remise)}</span>
            </div>
            ` : ''}
            <div class="summary-row total-row">
              <span class="summary-label">Total à payer:</span>
              <span class="summary-value">${formatCurrency(facture.montant_total)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Montant payé:</span>
              <span class="summary-value">${formatCurrency(facture.montant_paye)}</span>
            </div>
            <div class="summary-row ${facture.montant_restant > 0 ? 'remaining-row' : 'paid-row'}">
              <span class="summary-label">Reste à payer:</span>
              <span class="summary-value">${formatCurrency(facture.montant_restant)}</span>
            </div>
            ${paiements.length > 0 ? `
            <div class="payment-methods">
              <div class="payment-methods-label">Mode(s) de paiement:</div>
              <div class="payment-methods-list">
                ${paiements.map(p => getPaymentMethodLabel(p.mode_paiement)).join(', ')}
              </div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- PIED DE PAGE -->
        <div class="footer-section">
          <div class="status-badge ${isPaid ? 'paid' : 'unpaid'}">
            ${statusText}
          </div>
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">Cachet & Signature</div>
            </div>
          </div>
          <div class="legal-message">
            <strong>Bonne Guérison</strong> Amen!!!🙏🏼
          </div>
        </div>
      </div>
    `;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture - ${facture.numero_facture}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: A4;
      margin: 0;
    }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 10pt;
      color: #000;
      line-height: 1.4;
      background: white;
    }
    .invoice-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .invoice-page {
      width: 100%;
      padding: 15mm;
      page-break-after: always;
      border-bottom: 2px dashed #ccc;
    }
    .invoice-page:last-child {
      page-break-after: auto;
      border-bottom: none;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #2563eb;
    }
    .header-left, .header-right {
      flex: 1;
    }
    .clinic-name {
      font-size: 18pt;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 5px;
    }
    .clinic-address {
      font-size: 9pt;
      color: #333;
      margin-bottom: 3px;
    }
    .clinic-contact {
      font-size: 8pt;
      color: #666;
      margin-bottom: 2px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      color: #2563eb;
      margin: 15px 0 10px 0;
      padding-bottom: 5px;
      border-bottom: 1px solid #2563eb;
    }
    .patient-section, .invoice-info-section {
      margin-bottom: 15px;
    }
    .patient-info-grid, .invoice-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 5px;
      background: #f8fafc;
      border-left: 3px solid #2563eb;
    }
    .info-label {
      font-weight: bold;
      font-size: 9pt;
      color: #2563eb;
      margin-right: 10px;
    }
    .info-value {
      font-size: 9pt;
      color: #000;
      text-align: right;
    }
    .acts-section {
      margin: 15px 0;
    }
    .acts-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 9pt;
    }
    .acts-table th {
      background: #2563eb;
      color: white;
      padding: 8px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #1e40af;
    }
    .acts-table td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
    }
    .acts-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .financial-section {
      margin: 15px 0;
    }
    .financial-summary {
      margin-top: 8px;
      border: 2px solid #2563eb;
      padding: 10px;
      background: #f8fafc;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .summary-row:last-child {
      border-bottom: none;
    }
    .summary-label {
      font-size: 10pt;
      font-weight: bold;
      color: #333;
    }
    .summary-value {
      font-size: 10pt;
      font-weight: bold;
      color: #000;
    }
    .total-row {
      background: #eff6ff;
      padding: 8px;
      margin: 5px 0;
      border: 1px solid #2563eb;
    }
    .remaining-row {
      background: #fef2f2;
      color: #dc2626;
    }
    .paid-row {
      background: #dcfce7;
      color: #15803d;
    }
    .payment-methods {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }
    .payment-methods-label {
      font-size: 9pt;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 5px;
    }
    .payment-methods-list {
      font-size: 9pt;
      color: #333;
    }
    .footer-section {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid #2563eb;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 4px;
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 15px;
      text-align: center;
      width: 100%;
    }
    .status-badge.paid {
      background: #dcfce7;
      color: #15803d;
      border: 2px solid #15803d;
    }
    .status-badge.unpaid {
      background: #fef2f2;
      color: #dc2626;
      border: 2px solid #dc2626;
    }
    .signature-section {
      margin: 20px 0;
      text-align: center;
    }
    .signature-box {
      display: inline-block;
      width: 200px;
    }
    .signature-line {
      border-top: 2px solid #000;
      margin-top: 50px;
      padding-top: 5px;
      font-size: 9pt;
      font-weight: bold;
    }
    .legal-message {
      text-align: center;
      margin-top: 15px;
      font-size: 12pt;
      font-weight: bold;
      color: #2563eb;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .invoice-page {
        page-break-after: always;
      }
      .invoice-page:last-child {
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    ${generateSingleInvoice()}
    ${generateSingleInvoice()}
  </div>
</body>
</html>
    `;
  }

  /**
   * Ouvre une fenêtre d'impression pour la facture
   */
  static async printInvoice(factureId: string): Promise<void> {
    try {
      // Récupérer la facture complète
      const { FacturationService } = await import('./facturationService');
      const facture = await FacturationService.getFactureById(factureId);

      // Récupérer le patient
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', facture.patient_id)
        .single();

      // Récupérer les informations de la clinique
      const clinicInfo = await this.getClinicInfo();

      // Récupérer le nom du caissier
      let caissierName = 'N/A';
      if (facture.caissier_id) {
        const { data: caissierData } = await supabase
          .from('users')
          .select('nom, prenom')
          .eq('id', facture.caissier_id)
          .single();
        if (caissierData) {
          caissierName = `${caissierData.prenom || ''} ${caissierData.nom || ''}`.trim();
        }
      }

      // Récupérer le type de consultation si disponible
      let consultationType: string | undefined;
      if (facture.consultation_id) {
        const { data: consultationData } = await supabase
          .from('consultations')
          .select('type')
          .eq('id', facture.consultation_id)
          .single();
        if (consultationData) {
          consultationType = consultationData.type;
        }
      }

      // Préparer les données d'impression
      const printData: InvoicePrintData = {
        facture,
        patient: patientData || null,
        lignes: facture.lignes || [],
        paiements: facture.paiements || [],
        clinicName: clinicInfo.name,
        clinicAddress: clinicInfo.address,
        clinicPhone: clinicInfo.phone,
        clinicEmail: clinicInfo.email,
        clinicIfu: clinicInfo.ifu,
        clinicRccm: clinicInfo.rccm,
        clinicLogo: clinicInfo.logo,
        caissierName,
        consultationType,
      };

      // Générer le HTML
      const html = this.generateInvoiceHTML(printData);

      // Ouvrir la fenêtre d'impression
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        alert('Veuillez autoriser les pop-ups pour imprimer la facture');
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();
      
      // Attendre que le contenu soit chargé avant d'imprimer
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } catch (error: any) {
      console.error('Erreur impression facture:', error);
      throw new Error(`Erreur lors de l'impression de la facture: ${error.message}`);
    }
  }
}
