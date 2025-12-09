import { supabase, Patient } from './supabase';

export interface Consultation {
  id: string;
  patient_id: string;
  type: string;
  started_at: string;
  ended_at?: string;
  motifs?: string[];
  diagnostics?: string[];
  [key: string]: any;
}

export interface Prescription {
  id: string;
  consultation_id: string;
  lines?: Array<{
    nom_medicament: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface LabRequest {
  id: string;
  consultation_id: string;
  tests?: Array<{
    nom?: string;
    code?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface ImagingRequest {
  id: string;
  consultation_id: string;
  examens?: Array<{
    nom?: string;
    code?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface PatientConsultationHistoryEntry {
  consultation: Consultation;
  prescriptions: Prescription[];
  labRequests: LabRequest[];
  imagingRequests: ImagingRequest[];
}

export class PatientHistoryService {
  /**
   * Récupère l'historique des consultations d'un patient
   */
  static async getConsultationHistory(patientId: string): Promise<PatientConsultationHistoryEntry[]> {
    try {
      // Récupérer les consultations
      const { data: consultations, error: consultationsError } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .order('started_at', { ascending: false });

      if (consultationsError) {
        throw consultationsError;
      }

      if (!consultations || consultations.length === 0) {
        return [];
      }

      // Pour chaque consultation, récupérer les prescriptions, examens labo et imagerie
      const historyEntries: PatientConsultationHistoryEntry[] = await Promise.all(
        consultations.map(async (consultation) => {
          const consultationId = consultation.id;

          // Récupérer les prescriptions
          const { data: prescriptions } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('consultation_id', consultationId);

          // Récupérer les demandes de laboratoire (via patient_id et date)
          const consultationDate = new Date(consultation.started_at);
          const consultationDateStart = new Date(consultationDate);
          consultationDateStart.setHours(0, 0, 0, 0);
          const consultationDateEnd = new Date(consultationDate);
          consultationDateEnd.setHours(23, 59, 59, 999);

          const { data: labRequests } = await supabase
            .from('lab_prescriptions')
            .select('*')
            .eq('patient_id', patientId)
            .gte('date_prescription', consultationDateStart.toISOString())
            .lte('date_prescription', consultationDateEnd.toISOString());

          // Récupérer les demandes d'imagerie (via patient_id et date)
          const { data: imagingRequests } = await supabase
            .from('imagerie_examens')
            .select('*')
            .eq('patient_id', patientId)
            .gte('date_examen', consultationDateStart.toISOString())
            .lte('date_examen', consultationDateEnd.toISOString());

          return {
            consultation: consultation as Consultation,
            prescriptions: (prescriptions || []) as Prescription[],
            labRequests: (labRequests || []) as LabRequest[],
            imagingRequests: (imagingRequests || []) as ImagingRequest[],
          };
        })
      );

      return historyEntries;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }

  /**
   * Construit le HTML pour l'impression/export PDF de l'historique
   */
  static buildPrintableHtml(patient: Patient, history: PatientConsultationHistoryEntry[]): string {
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Historique des consultations - ${patient.prenom} ${patient.nom}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    .header {
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .patient-info {
      margin-bottom: 30px;
    }
    .consultation {
      margin-bottom: 30px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .consultation-header {
      font-weight: bold;
      font-size: 1.2em;
      margin-bottom: 10px;
      color: #1976d2;
    }
    .section {
      margin-top: 15px;
    }
    .section-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .motif, .diagnostic {
      display: inline-block;
      padding: 3px 8px;
      margin: 3px;
      background: #f0f0f0;
      border-radius: 3px;
      font-size: 0.9em;
    }
    .diagnostic {
      background: #e8f5e9;
    }
    @media print {
      body { margin: 0; }
      .consultation { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Historique des Consultations</h1>
    <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
  </div>

  <div class="patient-info">
    <h2>Informations du Patient</h2>
    <p><strong>Nom:</strong> ${patient.prenom} ${patient.nom}</p>
    <p><strong>Identifiant:</strong> ${patient.identifiant}</p>
    <p><strong>Date de naissance:</strong> ${patient.date_naissance ? new Date(patient.date_naissance).toLocaleDateString('fr-FR') : 'Non renseignée'}</p>
    <p><strong>Sexe:</strong> ${patient.sexe}</p>
    ${patient.telephone ? `<p><strong>Téléphone:</strong> ${patient.telephone}</p>` : ''}
  </div>

  <h2>Consultations (${history.length})</h2>
  ${history.map((entry, index) => {
    const consultationDate = new Date(entry.consultation.started_at);
    return `
      <div class="consultation">
        <div class="consultation-header">
          Consultation #${history.length - index} - ${consultationDate.toLocaleDateString('fr-FR')} à ${consultationDate.toLocaleTimeString('fr-FR')}
        </div>
        <p><strong>Type:</strong> ${entry.consultation.type || 'Non spécifié'}</p>
        
        ${entry.consultation.motifs && entry.consultation.motifs.length > 0 ? `
          <div class="section">
            <div class="section-title">Motifs:</div>
            ${entry.consultation.motifs.map(motif => `<span class="motif">${motif}</span>`).join('')}
          </div>
        ` : ''}
        
        ${entry.consultation.diagnostics && entry.consultation.diagnostics.length > 0 ? `
          <div class="section">
            <div class="section-title">Diagnostics:</div>
            ${entry.consultation.diagnostics.map(diag => `<span class="diagnostic">${diag}</span>`).join('')}
          </div>
        ` : ''}
        
        ${entry.prescriptions.length > 0 ? `
          <div class="section">
            <div class="section-title">Prescriptions:</div>
            <ul>
              ${entry.prescriptions.map(pres => `
                <li>${pres.lines?.map((line: any) => line.nom_medicament).join(', ') || 'Aucune ligne'}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${entry.labRequests.length > 0 ? `
          <div class="section">
            <div class="section-title">Examens de laboratoire:</div>
            <ul>
              ${entry.labRequests.map(req => `
                <li>${req.tests?.map((test: any) => test?.nom || test?.code || 'Test').join(', ') || 'Aucun test'}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${entry.imagingRequests.length > 0 ? `
          <div class="section">
            <div class="section-title">Examens d'imagerie:</div>
            <ul>
              ${entry.imagingRequests.map(req => `
                <li>${req.examens?.map((exam: any) => exam?.nom || exam?.code || 'Examen').join(', ') || 'Aucun examen'}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }).join('')}
</body>
</html>
    `;
    return html;
  }
}

