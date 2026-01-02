import { Consultation } from './consultationService';
import { Patient } from './supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ConsultationPrintData {
  consultation: Consultation;
  patient: Patient;
  medecin?: {
    nom: string;
    prenom: string;
    specialite?: string;
    numero_ordre?: string;
  };
}

export class ConsultationPrintService {
  /**
   * Génère le HTML pour l'impression de la consultation
   */
  static generateConsultationHTML(data: ConsultationPrintData): string {
    const { consultation, patient, medecin } = data;
    
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '-';
      return format(new Date(dateStr), 'dd/MM/yyyy à HH:mm', { locale: fr });
    };

    const formatDateShort = (dateStr?: string) => {
      if (!dateStr) return '-';
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr });
    };

    const motifsHTML = consultation.motifs && consultation.motifs.length > 0
      ? consultation.motifs.map(motif => `<span style="display: inline-block; padding: 3px 8px; margin: 3px; background: #e3f2fd; border-radius: 3px; font-size: 0.9em;">${motif}</span>`).join('')
      : '<em>Aucun motif renseigné</em>';

    const diagnosticsHTML = consultation.diagnostics && consultation.diagnostics.length > 0
      ? consultation.diagnostics.map(diag => `<span style="display: inline-block; padding: 3px 8px; margin: 3px; background: #e8f5e9; border-radius: 3px; font-size: 0.9em;">${diag}</span>`).join('')
      : '<em>Aucun diagnostic renseigné</em>';

    const anamneseHTML = consultation.anamnese
      ? `<div style="padding: 10px; background: #f8fafc; border-left: 3px solid #2563eb; margin-top: 10px; white-space: pre-wrap;">${consultation.anamnese.replace(/\n/g, '<br>')}</div>`
      : '<em>Non renseigné</em>';

    const examensCliniquesHTML = consultation.examens_cliniques && typeof consultation.examens_cliniques === 'object'
      ? Object.entries(consultation.examens_cliniques)
          .filter(([_, value]) => value !== null && value !== undefined && value !== '')
          .map(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `<div style="margin: 5px 0;"><strong>${label}:</strong> ${value}</div>`;
          }).join('')
      : '<em>Aucun examen clinique renseigné</em>';

    const traitementHTML = consultation.traitement_en_cours
      ? `<div style="padding: 10px; background: #fff7ed; border-left: 3px solid #f59e0b; margin-top: 10px; white-space: pre-wrap;">${consultation.traitement_en_cours.replace(/\n/g, '<br>')}</div>`
      : '<em>Aucun traitement en cours</em>';

    const prochaineConsultationHTML = consultation.prochaine_consultation
      ? `<div style="padding: 10px; background: #f0fdf4; border-left: 3px solid #22c55e; margin-top: 10px;">
          <strong>Date prévue:</strong> ${formatDateShort(consultation.prochaine_consultation)}
        </div>`
      : '<em>Non planifiée</em>';

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fiche de Consultation - ${patient.prenom} ${patient.nom}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      color: #333;
      line-height: 1.6;
      padding: 20px;
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
    .clinic-name {
      font-size: 20px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 5px;
    }
    .clinic-details {
      font-size: 9pt;
      color: #666;
    }
    .consultation-info {
      text-align: right;
    }
    .consultation-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #2563eb;
    }
    .section {
      margin: 20px 0;
      page-break-inside: avoid;
    }
    .section-title {
      font-weight: bold;
      font-size: 13pt;
      margin-bottom: 10px;
      color: #2563eb;
      padding-bottom: 5px;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 15px 0;
    }
    .info-item {
      margin: 5px 0;
    }
    .info-label {
      font-weight: bold;
      display: inline-block;
      min-width: 120px;
    }
    .content-box {
      padding: 10px;
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      margin-top: 10px;
      white-space: pre-wrap;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: bold;
    }
    .status-brouillon {
      background: #fef3c7;
      color: #92400e;
    }
    .status-en-cours {
      background: #dbeafe;
      color: #1e40af;
    }
    .status-cloture {
      background: #d1fae5;
      color: #065f46;
    }
    .status-annule {
      background: #fee2e2;
      color: #991b1b;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 9pt;
      color: #666;
      text-align: center;
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
      border-top: 1px solid #333;
      margin-top: 50px;
      padding-top: 5px;
    }
    @media print {
      body {
        margin: 0;
        padding: 15px;
      }
      .section {
        page-break-inside: avoid;
      }
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
    <div class="consultation-info">
      <div class="consultation-title">FICHE DE CONSULTATION</div>
      <div class="info-item">
        <span class="info-label">N° Consultation:</span>
        <span>${consultation.id.substring(0, 8).toUpperCase()}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Date:</span>
        <span>${formatDate(consultation.started_at || consultation.created_at)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Statut:</span>
        <span class="status-badge status-${consultation.status.toLowerCase().replace('_', '-')}">
          ${consultation.status}
        </span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">INFORMATIONS PATIENT</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Nom:</span>
        <span>${patient.prenom} ${patient.nom}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Identifiant:</span>
        <span>${patient.identifiant}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Date de naissance:</span>
        <span>${patient.date_naissance ? formatDateShort(patient.date_naissance) : '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Sexe:</span>
        <span>${patient.sexe || '-'}</span>
      </div>
      ${patient.telephone ? `
      <div class="info-item">
        <span class="info-label">Téléphone:</span>
        <span>${patient.telephone}</span>
      </div>
      ` : ''}
      ${patient.adresse ? `
      <div class="info-item">
        <span class="info-label">Adresse:</span>
        <span>${patient.adresse}</span>
      </div>
      ` : ''}
    </div>
  </div>

  ${medecin ? `
  <div class="section">
    <div class="section-title">MÉDECIN CONSULTANT</div>
    <div class="info-item">
      <span class="info-label">Nom:</span>
      <span>Dr. ${medecin.prenom} ${medecin.nom}</span>
    </div>
    ${medecin.specialite ? `
    <div class="info-item">
      <span class="info-label">Spécialité:</span>
      <span>${medecin.specialite}</span>
    </div>
    ` : ''}
    ${medecin.numero_ordre ? `
    <div class="info-item">
      <span class="info-label">N° Ordre:</span>
      <span>${medecin.numero_ordre}</span>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">MOTIF(S) DE CONSULTATION</div>
    <div style="margin-top: 10px;">
      ${motifsHTML}
    </div>
  </div>

  <div class="section">
    <div class="section-title">ANAMNÈSE</div>
    ${anamneseHTML}
  </div>

  <div class="section">
    <div class="section-title">EXAMENS CLINIQUES</div>
    <div style="margin-top: 10px;">
      ${examensCliniquesHTML}
    </div>
  </div>

  <div class="section">
    <div class="section-title">DIAGNOSTIC(S)</div>
    <div style="margin-top: 10px;">
      ${diagnosticsHTML}
    </div>
  </div>

  <div class="section">
    <div class="section-title">TRAITEMENT EN COURS</div>
    ${traitementHTML}
  </div>

  <div class="section">
    <div class="section-title">PROCHAINE CONSULTATION</div>
    ${prochaineConsultationHTML}
  </div>

  ${consultation.closed_at ? `
  <div class="section">
    <div class="section-title">INFORMATIONS DE CLÔTURE</div>
    <div class="info-item">
      <span class="info-label">Date de clôture:</span>
      <span>${formatDate(consultation.closed_at)}</span>
    </div>
  </div>
  ` : ''}

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">Signature du Médecin</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Signature du Patient</div>
    </div>
  </div>

  <div class="footer">
    <p>Document généré le ${new Date().toLocaleString('fr-FR')}</p>
    <p>Cette fiche de consultation est confidentielle et protégée par le secret médical.</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Ouvre une fenêtre d'impression pour la consultation
   */
  static printConsultation(data: ConsultationPrintData): void {
    const html = this.generateConsultationHTML(data);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      alert('Veuillez autoriser les pop-ups pour imprimer la consultation.');
    }
  }
}

