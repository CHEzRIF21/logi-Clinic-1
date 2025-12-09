/**
 * Service API pour le module Consultation
 * Utilise les routes backend au lieu de Supabase directement
 */

import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './apiClient';
import type {
  Consultation,
  ConsultationTemplate,
  ConsultationEntry,
  ConsultationConstantes,
  Protocol,
  ProtocolItem,
  ProtocolSchedule,
  Prescription,
  PrescriptionLine,
  LabRequest,
  ImagingRequest,
  ConsultationFormData,
} from './consultationService';
import { ConsultationService } from './consultationService';

// Réexporter les types pour compatibilité
export type {
  Consultation,
  ConsultationTemplate,
  ConsultationEntry,
  ConsultationConstantes,
  Protocol,
  ProtocolItem,
  ProtocolSchedule,
  Prescription,
  PrescriptionLine,
  LabRequest,
  ImagingRequest,
  ConsultationFormData,
};

export class ConsultationApiService {
  // ============================================
  // TEMPLATES
  // ============================================

  static async getTemplates(specialite?: string): Promise<ConsultationTemplate[]> {
    const params = specialite ? `?specialite=${encodeURIComponent(specialite)}` : '';
    return apiGet<ConsultationTemplate[]>(`/consultations/templates${params}`);
  }

  static async getTemplateById(id: string): Promise<ConsultationTemplate | null> {
    return apiGet<ConsultationTemplate>(`/consultations/templates/${id}`);
  }

  static async createTemplate(template: Partial<ConsultationTemplate>): Promise<ConsultationTemplate> {
    return apiPost<ConsultationTemplate>('/consultations/templates', template);
  }

  static async updateTemplate(id: string, template: Partial<ConsultationTemplate>): Promise<ConsultationTemplate> {
    return apiPut<ConsultationTemplate>(`/consultations/templates/${id}`, template);
  }

  static async deleteTemplate(id: string): Promise<void> {
    return apiDelete<void>(`/consultations/templates/${id}`);
  }

  // ============================================
  // CONSULTATIONS
  // ============================================

  static async createConsultation(
    formData: ConsultationFormData,
    createdBy: string
  ): Promise<Consultation> {
    return apiPost<Consultation>('/consultations', {
      patientId: formData.patient_id,
      templateId: formData.template_id,
      type: formData.type,
      createdBy,
      motifs: formData.motifs,
      anamnese: formData.anamnese,
      examens_cliniques: formData.examens_cliniques,
    });
  }

  static async getConsultationById(id: string): Promise<Consultation | null> {
    return apiGet<Consultation>(`/consultations/${id}`);
  }

  static async getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
    try {
      return await apiGet<Consultation[]>(`/consultations/patients/${patientId}`);
    } catch (error) {
      console.warn(
        '[ConsultationApiService] API backend indisponible, bascule vers Supabase',
        error
      );
      // Fallback vers Supabase pour éviter le blocage du workflow
      const consultations = await ConsultationService.getConsultationsByPatient(patientId);
      return consultations;
    }
  }

  static async getConsultationsByStatus(
    status: 'EN_COURS' | 'CLOTURE' | 'ARCHIVE',
    filters?: { dateDebut?: string; dateFin?: string; praticienId?: string }
  ): Promise<Consultation[]> {
    const params = new URLSearchParams();
    params.append('status', status);
    if (filters?.dateDebut) params.append('dateDebut', filters.dateDebut);
    if (filters?.dateFin) params.append('dateFin', filters.dateFin);
    if (filters?.praticienId) params.append('praticienId', filters.praticienId);
    
    const queryString = params.toString();
    return apiGet<Consultation[]>(`/consultations?${queryString}`);
  }

  static async updateConsultation(
    id: string,
    updates: Partial<Consultation>,
    userId: string,
    section?: string
  ): Promise<Consultation> {
    // Si section spécifiée, créer une entrée d'historique d'abord
    if (section) {
      await this.createConsultationEntry(id, {
        section,
        data: updates,
        action: 'UPDATE',
        createdBy: userId,
      });
    }
    
    return apiPut<Consultation>(`/consultations/${id}`, updates);
  }

  static async closeConsultation(id: string, userId: string): Promise<Consultation> {
    return apiPost<Consultation>(`/consultations/${id}/close`, { closedBy: userId });
  }

  // ============================================
  // CONSULTATION ENTRIES (Historique)
  // ============================================

  static async createConsultationEntry(
    consultationId: string,
    entry: {
      section: string;
      data: any;
      action: 'CREATE' | 'UPDATE' | 'DELETE';
      createdBy: string;
      annotation?: string;
    }
  ): Promise<ConsultationEntry> {
    return apiPost<ConsultationEntry>(`/consultations/${consultationId}/entries`, entry);
  }

  static async getConsultationHistory(consultationId: string): Promise<ConsultationEntry[]> {
    return apiGet<ConsultationEntry[]>(`/consultations/${consultationId}/entries`);
  }

  static async updateConsultationEntry(
    consultationId: string,
    entryId: string,
    updates: Partial<ConsultationEntry>
  ): Promise<ConsultationEntry> {
    return apiPut<ConsultationEntry>(`/consultations/${consultationId}/entries/${entryId}`, updates);
  }

  // ============================================
  // CONSTANTES
  // ============================================

  static async saveConstantes(
    consultationId: string,
    patientId: string,
    constantes: Partial<ConsultationConstantes>,
    userId: string,
    syncToPatient: boolean = false
  ): Promise<ConsultationConstantes> {
    return apiPost<ConsultationConstantes>(`/consultations/${consultationId}/constantes`, {
      patientId,
      constantes,
      syncToPatient,
      createdBy: userId,
    });
  }

  static async getConstantes(consultationId: string): Promise<ConsultationConstantes | null> {
    return apiGet<ConsultationConstantes>(`/consultations/${consultationId}/constantes`);
  }

  // ============================================
  // PROTOCOLES
  // ============================================

  static async createProtocol(
    consultationId: string,
    patientId: string,
    protocol: Partial<Protocol>,
    userId: string
  ): Promise<Protocol> {
    return apiPost<Protocol>(`/consultations/${consultationId}/protocols`, {
      patientId,
      ...protocol,
      createdBy: userId,
    });
  }

  static async getProtocols(consultationId: string): Promise<Protocol[]> {
    return apiGet<Protocol[]>(`/consultations/${consultationId}/protocols`);
  }

  static async getProtocolById(id: string): Promise<Protocol | null> {
    // Note: Cette route peut ne pas exister dans le backend, à vérifier
    return apiGet<Protocol>(`/consultations/protocols/${id}`);
  }

  static async applyProtocol(
    protocolId: string,
    options: { facturer?: boolean; createPrescription?: boolean }
  ): Promise<{ success: boolean; operationId?: string; prescriptionId?: string }> {
    return apiPost(`/consultations/protocols/${protocolId}/apply`, options);
  }

  // ============================================
  // PRESCRIPTIONS
  // ============================================

  static async createPrescription(
    consultationId: string,
    patientId: string,
    lines: Partial<PrescriptionLine>[],
    userId: string
  ): Promise<Prescription> {
    return apiPost<Prescription>('/consultations/prescriptions', {
      consultationId,
      patientId,
      lines,
      createdBy: userId,
    });
  }

  static async getPrescriptions(consultationId: string): Promise<Prescription[]> {
    return apiGet<Prescription[]>(`/consultations/prescriptions?consultationId=${consultationId}`);
  }

  static async getPrescriptionById(id: string): Promise<Prescription | null> {
    return apiGet<Prescription>(`/consultations/prescriptions/${id}`);
  }

  static async dispenserPrescription(
    prescriptionId: string,
    linesToDispense: Array<{
      lineId: string;
      medicamentId: string;
      lotId: string;
      quantite: number;
      prixUnitaire: number;
    }>,
    userId: string
  ): Promise<void> {
    return apiPost(`/consultations/prescriptions/${prescriptionId}/dispense`, {
      userId,
      linesToDispense,
    });
  }

  // ============================================
  // DEMANDES LABORATOIRE
  // ============================================

  static async createLabRequest(
    consultationId: string,
    patientId: string,
    request: Partial<LabRequest>,
    userId: string
  ): Promise<LabRequest> {
    return apiPost<LabRequest>('/consultations/lab-requests', {
      consultationId,
      patientId,
      ...request,
      createdBy: userId,
    });
  }

  static async getLabRequests(consultationId: string): Promise<LabRequest[]> {
    return apiGet<LabRequest[]>(`/consultations/lab-requests?consultationId=${consultationId}`);
  }

  static async updateLabRequestStatus(
    id: string,
    status: 'EN_ATTENTE' | 'EN_COURS' | 'RENDU' | 'ANNULE'
  ): Promise<LabRequest> {
    return apiPut<LabRequest>(`/consultations/lab-requests/${id}/status`, { status });
  }

  // ============================================
  // DEMANDES IMAGERIE
  // ============================================

  static async createImagingRequest(
    consultationId: string,
    patientId: string,
    request: Partial<ImagingRequest>,
    userId: string
  ): Promise<ImagingRequest> {
    return apiPost<ImagingRequest>('/consultations/imaging-requests', {
      consultationId,
      patientId,
      ...request,
      createdBy: userId,
    });
  }

  static async getImagingRequests(consultationId: string): Promise<ImagingRequest[]> {
    return apiGet<ImagingRequest[]>(`/consultations/imaging-requests?consultationId=${consultationId}`);
  }

  static async updateImagingRequestStatus(
    id: string,
    status: 'EN_ATTENTE' | 'EN_COURS' | 'RENDU' | 'ANNULE'
  ): Promise<ImagingRequest> {
    return apiPut<ImagingRequest>(`/consultations/imaging-requests/${id}/status`, { status });
  }

  // ============================================
  // MOTIFS & DIAGNOSTICS
  // ============================================

  static async getMotifs(search?: string): Promise<Array<{ id: string; label: string }>> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiGet<Array<{ id: string; label: string }>>(`/motifs${params}`);
  }

  static async createMotif(label: string): Promise<{ id: string; label: string }> {
    return apiPost<{ id: string; label: string }>('/motifs', { label });
  }

  static async getDiagnostics(search?: string): Promise<Array<{ id: string; label: string; code?: string }>> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiGet<Array<{ id: string; label: string; code?: string }>>(`/diagnostics${params}`);
  }

  static async createDiagnostic(label: string, code?: string): Promise<{ id: string; label: string; code?: string }> {
    return apiPost<{ id: string; label: string; code?: string }>('/diagnostics', { label, code });
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  static async getConsultationStats(filters?: {
    dateDebut?: string;
    dateFin?: string;
    praticienId?: string;
  }): Promise<{
    total: number;
    enCours: number;
    cloturees: number;
    archivees: number;
    aujourdhui: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.dateDebut) params.append('start', filters.dateDebut);
    if (filters?.dateFin) params.append('end', filters.dateFin);
    if (filters?.praticienId) params.append('praticienId', filters.praticienId);
    
    const queryString = params.toString();
    return apiGet(`/consultations/stats${queryString ? `?${queryString}` : ''}`);
  }

  // ============================================
  // MÉTHODES UTILITAIRES (pour compatibilité)
  // ============================================

  /**
   * Créer une opération facturable depuis un protocole
   * Cette méthode appelle le backend qui gère la création des tickets
   */
  static async createBillingOperationFromProtocol(
    protocolId: string,
    patientId: string,
    consultationId: string
  ): Promise<string> {
    const result = await this.applyProtocol(protocolId, { facturer: true });
    return result.operationId || '';
  }
}

