/**
 * Service pour la génération et impression d'ordonnances
 * Format conforme aux réglementations ministérielles
 */

export interface OrdonnanceData {
  patient: {
    nom: string;
    prenom: string;
    date_naissance: string;
    adresse?: string;
  };
  medecin: {
    nom: string;
    prenom: string;
    specialite?: string;
    numero_ordre?: string;
    adresse?: string;
    telephone?: string;
  };
  date: string;
  prescriptions: Array<{
    medicament: string;
    dosage?: string;
    posologie: string;
    quantite: number;
    duree_jours?: number;
    instructions?: string;
  }>;
  consultation_id?: string;
}

export class PrescriptionPrintService {
  /**
   * Génère le HTML pour l'impression de l'ordonnance
   */
  static generateOrdonnanceHTML(data: OrdonnanceData): string {
    const prescriptionsHTML = data.prescriptions
      .map(
        (presc, index) => `
      <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
        <div style="font-weight: bold; margin-bottom: 5px;">
          ${index + 1}. ${presc.medicament}${presc.dosage ? ` - ${presc.dosage}` : ''}
        </div>
        <div style="margin-left: 20px; color: #555;">
          <div><strong>Posologie:</strong> ${presc.posologie}</div>
          ${presc.duree_jours ? `<div><strong>Durée:</strong> ${presc.duree_jours} jour(s)</div>` : ''}
          ${presc.quantite ? `<div><strong>Quantité:</strong> ${presc.quantite}</div>` : ''}
          ${presc.instructions ? `<div><strong>Instructions:</strong> ${presc.instructions}</div>` : ''}
        </div>
      </div>
    `
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ordonnance Médicale</title>
  <style>
    @media print {
      @page {
        size: A4;
        margin: 2cm;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
    }
    .header h1 {
      font-size: 18pt;
      margin: 0;
      font-weight: bold;
    }
    .patient-info {
      margin-bottom: 20px;
    }
    .medecin-info {
      text-align: right;
      margin-bottom: 20px;
    }
    .date {
      text-align: right;
      margin-bottom: 20px;
      font-weight: bold;
    }
    .prescriptions {
      margin-top: 30px;
    }
    .signature {
      margin-top: 50px;
      text-align: right;
    }
    .footer {
      margin-top: 30px;
      font-size: 10pt;
      color: #666;
      text-align: center;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ORDONNANCE MÉDICALE</h1>
  </div>

  <div class="patient-info">
    <strong>Patient:</strong> ${data.patient.prenom} ${data.patient.nom}<br>
    ${data.patient.date_naissance ? `<strong>Né(e) le:</strong> ${new Date(data.patient.date_naissance).toLocaleDateString('fr-FR')}<br>` : ''}
    ${data.patient.adresse ? `<strong>Adresse:</strong> ${data.patient.adresse}` : ''}
  </div>

  <div class="date">
    Date: ${new Date(data.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
  </div>

  <div class="medecin-info">
    <strong>Dr. ${data.medecin.prenom} ${data.medecin.nom}</strong><br>
    ${data.medecin.specialite ? `${data.medecin.specialite}<br>` : ''}
    ${data.medecin.numero_ordre ? `Ordre: ${data.medecin.numero_ordre}<br>` : ''}
    ${data.medecin.adresse ? `${data.medecin.adresse}<br>` : ''}
    ${data.medecin.telephone ? `Tél: ${data.medecin.telephone}` : ''}
  </div>

  <div class="prescriptions">
    <h3 style="margin-bottom: 15px;">Prescriptions:</h3>
    ${prescriptionsHTML}
  </div>

  <div class="signature">
    <div style="margin-top: 30px;">
      Signature et cachet du médecin
    </div>
    <div style="margin-top: 50px; border-top: 1px solid #000; width: 200px; margin-left: auto;">
      &nbsp;
    </div>
  </div>

  <div class="footer">
    ${data.consultation_id ? `Consultation N°: ${data.consultation_id}` : ''}
    <br>
    Document généré le ${new Date().toLocaleString('fr-FR')}
  </div>
</body>
</html>
    `;
  }

  /**
   * Ouvre une fenêtre d'impression pour l'ordonnance
   */
  static printOrdonnance(data: OrdonnanceData): void {
    const html = this.generateOrdonnanceHTML(data);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  /**
   * Télécharge l'ordonnance en PDF (nécessite une bibliothèque PDF)
   */
  static async downloadOrdonnancePDF(data: OrdonnanceData): Promise<void> {
    // TODO: Implémenter avec une bibliothèque PDF comme jsPDF ou pdfkit
    // Pour l'instant, on utilise l'impression HTML
    this.printOrdonnance(data);
  }
}

