import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export interface ConsultationTemplate {
  id: string;
  nom: string;
  specialite: string;
  description?: string;
  sections: any[];
  champs: any[];
  validations?: any;
  actif: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  patient_id: string;
  template_id?: string;
  type: string;
  status: 'EN_COURS' | 'CLOTURE' | 'ARCHIVE';
  started_at: string;
  closed_at?: string;
  created_by: string;
  updated_at: string;
  motifs?: string[];
  anamnese?: any;
  examens_cliniques?: any;
  diagnostics?: string[];
  traitement_en_cours?: string;
  notes?: string;
  prochaine_consultation?: string;
}

export interface ConsultationEntry {
  id: string;
  consultation_id: string;
  section: string;
  data: any;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  created_by: string;
  created_at: string;
  annotation?: string;
}

export interface ConsultationConstantes {
  id: string;
  consultation_id: string;
  patient_id: string;
  taille_cm?: number;
  poids_kg?: number;
  imc?: number;
  temperature_c?: number;
  pouls_bpm?: number;
  ta_bras_gauche_systolique?: number;
  ta_bras_gauche_diastolique?: number;
  ta_bras_droit_systolique?: number;
  ta_bras_droit_diastolique?: number;
  hauteur_uterine?: number;
  synced_to_patient: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CatalogExamSelection {
  code: string;
  nom: string;
  categorie?: string;
  module?: string;
  tarif_base?: number;
  sous_categorie?: string;
}

export interface Protocol {
  id: string;
  consultation_id: string;
  patient_id: string;
  admission_type: 'SOINS_DOMICILE' | 'AMBULATOIRE' | 'OBSERVATION' | 'HOSPITALISATION';
  items: ProtocolItem[];
  instructions?: string;
  horaires?: ProtocolSchedule[];
  facturable: boolean;
  operation_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProtocolItem {
  type: 'medicament' | 'consommable' | 'acte';
  produit_id?: string;
  nom: string;
  quantite: number;
  mode_administration?: string;
  pharmacie_source?: string;
  nombre_fois?: number; // Pour actes
}

export interface ProtocolSchedule {
  heure: string; // Format HH:mm
  dosage?: string;
  repetition?: string;
}

export type RequestedExam = string | CatalogExamSelection;

const getExamLabel = (exam: RequestedExam): string =>
  typeof exam === 'string'
    ? exam
    : exam?.nom || exam?.code || 'Examen';

const getExamAmount = (exam: RequestedExam): number =>
  typeof exam === 'string' ? 0 : exam?.tarif_base || 0;

export interface Prescription {
  id: string;
  consultation_id: string;
  patient_id: string;
  numero_prescription: string;
  date_prescription: string;
  statut: 'PRESCRIT' | 'PARTIELLEMENT_DISPENSE' | 'DISPENSE' | 'ANNULE';
  date_dispensation?: string;
  pharmacien_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  lines?: PrescriptionLine[];
}

export interface PrescriptionLine {
  id: string;
  prescription_id: string;
  medicament_id?: string;
  nom_medicament: string;
  posologie: string;
  quantite_totale: number;
  duree_jours?: number;
  mode_administration?: string;
  instructions?: string;
  quantite_dispensee: number;
  date_dispensation?: string;
  ordre: number;
  created_at: string;
}

export interface LabRequest {
  id: string;
  consultation_id: string;
  patient_id: string;
  type: 'INTERNE' | 'EXTERNE';
  clinical_info: string;
  tests: RequestedExam[];
  status: 'EN_ATTENTE' | 'EN_COURS' | 'RENDU' | 'ANNULE';
  date_prelevement?: string;
  date_rendu?: string;
  facturable: boolean;
  operation_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ImagingRequest {
  id: string;
  consultation_id: string;
  patient_id: string;
  type: 'INTERNE' | 'EXTERNE';
  clinical_info: string;
  examens: RequestedExam[];
  status: 'EN_ATTENTE' | 'EN_COURS' | 'RENDU' | 'ANNULE';
  date_examen?: string;
  date_rendu?: string;
  facturable: boolean;
  operation_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ConsultationFormData {
  patient_id: string;
  template_id?: string;
  type: string;
  motifs?: string[];
  anamnese?: any;
  examens_cliniques?: any;
  diagnostics?: string[];
  traitement_en_cours?: string;
  notes?: string;
  prochaine_consultation?: string;
}

// ============================================
// SERVICE
// ============================================

export class ConsultationService {
  // ============================================
  // TEMPLATES
  // ============================================

  static async getTemplates(specialite?: string): Promise<ConsultationTemplate[]> {
    let query = supabase
      .from('consultation_templates')
      .select('*')
      .eq('actif', true)
      .order('specialite', { ascending: true })
      .order('nom', { ascending: true });

    if (specialite) {
      query = query.eq('specialite', specialite);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async getTemplateById(id: string): Promise<ConsultationTemplate | null> {
    const { data, error } = await supabase
      .from('consultation_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createTemplate(template: Partial<ConsultationTemplate>): Promise<ConsultationTemplate> {
    const { data, error } = await supabase
      .from('consultation_templates')
      .insert([template])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTemplate(id: string, template: Partial<ConsultationTemplate>): Promise<ConsultationTemplate> {
    const { data, error } = await supabase
      .from('consultation_templates')
      .update(template)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('consultation_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============================================
  // CONSULTATIONS
  // ============================================

  static async createConsultation(
    formData: ConsultationFormData,
    createdBy: string
  ): Promise<Consultation> {
    const { data, error } = await supabase
      .from('consultations')
      .insert([{
        ...formData,
        created_by: createdBy,
        status: 'EN_COURS',
        started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getConsultationById(id: string): Promise<Consultation | null> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getConsultationsByStatus(
    status: 'EN_COURS' | 'CLOTURE' | 'ARCHIVE',
    filters?: { dateDebut?: string; dateFin?: string; praticienId?: string }
  ): Promise<Consultation[]> {
    let query = supabase
      .from('consultations')
      .select('*')
      .eq('status', status)
      .order('started_at', { ascending: false });

    if (filters?.dateDebut) {
      query = query.gte('started_at', filters.dateDebut);
    }
    if (filters?.dateFin) {
      query = query.lte('started_at', filters.dateFin);
    }
    if (filters?.praticienId) {
      query = query.eq('created_by', filters.praticienId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async updateConsultation(
    id: string,
    updates: Partial<Consultation>,
    userId: string,
    section?: string
  ): Promise<Consultation> {
    // Créer une entrée d'historique si section spécifiée (optionnel, ne bloque pas la sauvegarde)
    if (section && updates) {
      try {
        await this.createConsultationEntry({
          consultation_id: id,
          section,
          data: updates,
          action: 'UPDATE',
          created_by: userId
        });
      } catch (entryError) {
        // Log l'erreur mais ne bloque pas la mise à jour de la consultation
        console.warn('Erreur lors de la création de l\'entrée d\'historique (non bloquant):', entryError);
      }
    }

    const { data, error } = await supabase
      .from('consultations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async closeConsultation(id: string, userId: string): Promise<Consultation> {
    const { data, error } = await supabase
      .from('consultations')
      .update({
        status: 'CLOTURE',
        closed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Créer une entrée d'historique (optionnel, ne bloque pas la fermeture)
    try {
      await this.createConsultationEntry({
        consultation_id: id,
        section: 'consultation',
        data: { status: 'CLOTURE', closed_at: data.closed_at },
        action: 'UPDATE',
        created_by: userId
      });
    } catch (entryError) {
      // Log l'erreur mais ne bloque pas la fermeture de la consultation
      console.warn('Erreur lors de la création de l\'entrée d\'historique (non bloquant):', entryError);
    }

    // Intégration avec Rendez-vous : marquer le RDV comme complété
    const { IntegrationConsultationService, emitWebSocketEvent } = await import('./integrationConsultationService');
    await IntegrationConsultationService.markAppointmentCompleted(id);

    // Émettre une notification WebSocket
    await emitWebSocketEvent('consultation:closed', {
      consultationId: id,
      closedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return data;
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
    // Vérifier si des constantes existent déjà pour cette consultation
    const { data: existing } = await supabase
      .from('consultation_constantes')
      .select('id')
      .eq('consultation_id', consultationId)
      .single();

    let result;
    if (existing) {
      // Mettre à jour
      const { data, error } = await supabase
        .from('consultation_constantes')
        .update({
          ...constantes,
          synced_to_patient: syncToPatient,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Créer
      const { data, error } = await supabase
        .from('consultation_constantes')
        .insert([{
          consultation_id: consultationId,
          patient_id: patientId,
          ...constantes,
          synced_to_patient: syncToPatient,
          created_by: userId
        }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Créer une entrée d'historique (optionnel, ne bloque pas la sauvegarde)
    try {
      await this.createConsultationEntry({
        consultation_id: consultationId,
        section: 'constantes',
        data: result,
        action: existing ? 'UPDATE' : 'CREATE',
        created_by: userId
      });
    } catch (entryError) {
      // Log l'erreur mais ne bloque pas la sauvegarde des constantes
      console.warn('Erreur lors de la création de l\'entrée d\'historique (non bloquant):', entryError);
    }

    // Synchroniser au dossier patient si demandé
    if (syncToPatient && result) {
      // NOTE: Synchronisation avec le module Patients à implémenter
      // Cette fonctionnalité nécessite une intégration avec PatientService
      // await PatientService.updatePatientConstantes(patientId, result);
    }

    return result;
  }

  static async getConstantes(consultationId: string): Promise<ConsultationConstantes | null> {
    const { data, error } = await supabase
      .from('consultation_constantes')
      .select('*')
      .eq('consultation_id', consultationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
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
    const { data, error } = await supabase
      .from('protocols')
      .insert([{
        consultation_id: consultationId,
        patient_id: patientId,
        ...protocol,
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;

    // Créer une entrée d'historique (optionnel, ne bloque pas la création)
    try {
      await this.createConsultationEntry({
        consultation_id: consultationId,
        section: 'protocols',
        data: data,
        action: 'CREATE',
        created_by: userId
      });
    } catch (entryError) {
      console.warn('Erreur lors de la création de l\'entrée d\'historique (non bloquant):', entryError);
    }

    return data;
  }

  static async getProtocols(consultationId: string): Promise<Protocol[]> {
    const { data, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateProtocol(id: string, updates: Partial<Protocol>): Promise<Protocol> {
    const { data, error } = await supabase
      .from('protocols')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createBillingOperationFromProtocol(
    protocolId: string,
    patientId: string,
    consultationId: string
  ): Promise<string> {
    // Récupérer le protocole
    const protocol = await this.getProtocolById(protocolId);
    if (!protocol) throw new Error('Protocole non trouvé');

    // Importer le service de facturation
    const { FacturationService } = await import('./facturationService');

    // Créer des tickets de facturation pour chaque item du protocole
    const ticketIds: string[] = [];
    
    for (const item of protocol.items) {
      let typeActe = '';
      let montant = 0;

      if (item.type === 'medicament') {
        typeActe = `Médicament: ${item.nom}`;
        // NOTE: Récupération du prix depuis le catalogue de produits à implémenter
        // Le prix devrait être récupéré depuis le service de gestion des produits
        montant = 0; // À déterminer selon le produit
      } else if (item.type === 'consommable') {
        typeActe = `Consommable: ${item.nom}`;
        montant = 0; // À déterminer selon le produit
      } else if (item.type === 'acte') {
        typeActe = `Acte médical: ${item.nom}`;
        montant = 0; // À déterminer selon l'acte
      }

      if (montant > 0 || item.type === 'acte') {
        const ticket = await FacturationService.creerTicketFacturation(
          patientId,
          'consultation',
          protocolId,
          `${typeActe} (x${item.quantite})`,
          montant * item.quantite
        );
        ticketIds.push(ticket.id);
      }
    }

    // Mettre à jour le protocole avec l'ID du premier ticket (ou créer une facture groupée)
    const operationId = ticketIds.length > 0 ? ticketIds[0] : '';
    await this.updateProtocol(protocolId, { operation_id: operationId, facturable: true });

    return operationId;
  }

  static async getProtocolById(id: string): Promise<Protocol | null> {
    const { data, error } = await supabase
      .from('protocols')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
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
    // Créer la prescription
    const { data: prescription, error: presError } = await supabase
      .from('prescriptions')
      .insert([{
        consultation_id: consultationId,
        patient_id: patientId,
        created_by: userId
      }])
      .select()
      .single();

    if (presError) throw presError;

    // Créer les lignes
    const prescriptionLines = lines.map((line, index) => ({
      prescription_id: prescription.id,
      ...line,
      quantite_dispensee: 0,
      ordre: index
    }));

    const { error: linesError } = await supabase
      .from('prescription_lines')
      .insert(prescriptionLines);

    if (linesError) throw linesError;

    // Créer une entrée d'historique (optionnel, ne bloque pas la création)
    try {
      await this.createConsultationEntry({
        consultation_id: consultationId,
        section: 'prescriptions',
        data: { prescription_id: prescription.id },
        action: 'CREATE',
        created_by: userId
      });
    } catch (entryError) {
      console.warn('Erreur lors de la création de l\'entrée d\'historique (non bloquant):', entryError);
    }

    // Intégration avec Pharmacie : notifier la nouvelle prescription
    const { IntegrationConsultationService } = await import('./integrationConsultationService');
    await IntegrationConsultationService.notifyPharmacyNewPrescription(prescription.id, patientId);

    // Récupérer la prescription complète avec les lignes
    return await this.getPrescriptionById(prescription.id);
  }

  // ============================================
  // DISPENSATION PHARMACIE
  // ============================================

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
    // Récupérer la prescription
    const prescription = await this.getPrescriptionById(prescriptionId);
    if (!prescription) throw new Error('Prescription non trouvée');

    // Intégration avec le module Pharmacie/Stock
    const { StockService } = await import('./stockService');

    // Préparer les lignes de dispensation
    const lignesDispensation = linesToDispense.map((l) => ({
      medicament_id: l.medicamentId,
      lot_id: l.lotId,
      quantite: l.quantite,
      prix_unitaire: l.prixUnitaire,
    }));

    // Appeler le service de dispensation
    await StockService.dispensationPatient({
      patient_id: prescription.patient_id,
      type_dispensation: 'patient',
      lignes: lignesDispensation,
      utilisateur_id: userId,
      prescription_id: prescriptionId,
      observations: `Dispensation depuis consultation ${prescription.consultation_id}`,
    });

    // Mettre à jour les quantités dispensées dans les lignes de prescription
    for (const lineToDispense of linesToDispense) {
      const line = prescription.lines?.find((l) => l.id === lineToDispense.lineId);
      if (line) {
        const nouvelleQuantiteDispensee = (line.quantite_dispensee || 0) + lineToDispense.quantite;
        
        await supabase
          .from('prescription_lines')
          .update({
            quantite_dispensee: nouvelleQuantiteDispensee,
            date_dispensation: new Date().toISOString(),
          })
          .eq('id', lineToDispense.lineId);

        // Mettre à jour le statut de la prescription si toutes les lignes sont dispensées
        const toutesDispensées = prescription.lines?.every(
          (l) => (l.quantite_dispensee || 0) >= l.quantite_totale
        );

        if (toutesDispensées) {
          await supabase
            .from('prescriptions')
            .update({
              statut: 'DISPENSE',
              date_dispensation: new Date().toISOString(),
            })
            .eq('id', prescriptionId);
        } else {
          await supabase
            .from('prescriptions')
            .update({
              statut: 'PARTIELLEMENT_DISPENSE',
            })
            .eq('id', prescriptionId);
        }
      }
    }
  }

  static async getPrescriptionById(id: string): Promise<Prescription | null> {
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!prescription) return null;

    // Récupérer les lignes
    const { data: lines } = await supabase
      .from('prescription_lines')
      .select('*')
      .eq('prescription_id', id)
      .order('ordre', { ascending: true });

    return {
      ...prescription,
      lines: lines || []
    };
  }

  static async getPrescriptions(consultationId: string): Promise<Prescription[]> {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('date_prescription', { ascending: false });

    if (error) throw error;

    // Récupérer les lignes pour chaque prescription
    const prescriptionsWithLines = await Promise.all(
      (data || []).map(async (prescription) => {
        const { data: lines } = await supabase
          .from('prescription_lines')
          .select('*')
          .eq('prescription_id', prescription.id)
          .order('ordre', { ascending: true });

        return {
          ...prescription,
          lines: lines || []
        };
      })
    );

    return prescriptionsWithLines;
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
    const { data, error } = await supabase
      .from('lab_requests')
      .insert([{
        consultation_id: consultationId,
        patient_id: patientId,
        ...request,
        status: 'EN_ATTENTE',
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;

    // Intégration avec le module Laboratoire : notifier la création
    const { IntegrationConsultationService } = await import('./integrationConsultationService');
    await IntegrationConsultationService.notifyLabRequestCreated(data.id, consultationId, patientId);

    // Créer un ticket de facturation si facturable
    if (request.facturable) {
      const testsList = Array.isArray(request.tests) ? request.tests : [];
      const libelle = testsList.length
        ? `Analyses biologiques: ${testsList.map(getExamLabel).join(', ')}`
        : 'Analyses biologiques';
      const montantEstime = testsList.reduce((sum, exam) => sum + getExamAmount(exam), 0);

      const { FacturationService } = await import('./facturationService');
      try {
        await FacturationService.creerTicketFacturation(
          patientId,
          'laboratoire',
          data.id,
          libelle,
          montantEstime
        );
      } catch (err) {
        console.error('Erreur lors de la création du ticket de facturation:', err);
      }
    }

    // Créer une entrée d'historique (optionnel, ne bloque pas la création)
    try {
      await this.createConsultationEntry({
        consultation_id: consultationId,
        section: 'lab_requests',
        data: data,
        action: 'CREATE',
        created_by: userId
      });
    } catch (entryError) {
      console.warn('Erreur lors de la création de l\'entrée d\'historique (non bloquant):', entryError);
    }

    return data;
  }

  static async getLabRequests(consultationId: string): Promise<LabRequest[]> {
    const { data, error } = await supabase
      .from('lab_requests')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateLabRequest(id: string, updates: Partial<LabRequest>): Promise<LabRequest> {
    const { data, error } = await supabase
      .from('lab_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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
    const { data, error } = await supabase
      .from('imaging_requests')
      .insert([{
        consultation_id: consultationId,
        patient_id: patientId,
        ...request,
        status: 'EN_ATTENTE',
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;

    // Intégration avec le module Imagerie : notifier la création
    const { IntegrationConsultationService } = await import('./integrationConsultationService');
    await IntegrationConsultationService.notifyImagingRequestCreated(data.id, consultationId, patientId);

    // Créer un ticket de facturation si facturable
    if (request.facturable) {
      const examsList = Array.isArray(request.examens) ? request.examens : [];
      const libelle = examsList.length
        ? `Examens d'imagerie: ${examsList.map(getExamLabel).join(', ')}`
        : `Examens d'imagerie`;
      const montantEstime = examsList.reduce((sum, exam) => sum + getExamAmount(exam), 0);

      const { FacturationService } = await import('./facturationService');
      try {
        await FacturationService.creerTicketFacturation(
          patientId,
          'imagerie',
          data.id,
          libelle,
          montantEstime
        );
      } catch (err) {
        console.error('Erreur lors de la création du ticket de facturation:', err);
      }
    }

    // Créer une entrée d'historique (optionnel, ne bloque pas la création)
    try {
      await this.createConsultationEntry({
        consultation_id: consultationId,
        section: 'imaging_requests',
        data: data,
        action: 'CREATE',
        created_by: userId
      });
    } catch (entryError) {
      console.warn('Erreur lors de la création de l\'entrée d\'historique (non bloquant):', entryError);
    }

    return data;
  }

  static async getImagingRequests(consultationId: string): Promise<ImagingRequest[]> {
    const { data, error } = await supabase
      .from('imaging_requests')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateImagingRequest(id: string, updates: Partial<ImagingRequest>): Promise<ImagingRequest> {
    const { data, error } = await supabase
      .from('imaging_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================
  // HISTORIQUE & VERSIONING
  // ============================================

  static async createConsultationEntry(entry: Partial<ConsultationEntry>): Promise<ConsultationEntry> {
    const { data, error } = await supabase
      .from('consultation_entries')
      .insert([{
        ...entry,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getConsultationHistory(consultationId: string): Promise<ConsultationEntry[]> {
    const { data, error } = await supabase
      .from('consultation_entries')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  static async getConsultationStats(
    filters?: { dateDebut?: string; dateFin?: string; praticienId?: string }
  ): Promise<{
    total: number;
    enCours: number;
    cloturees: number;
    archivees: number;
    aujourdhui: number;
  }> {
    let baseQuery = supabase.from('consultations').select('status, started_at', { count: 'exact', head: false });

    if (filters?.dateDebut) {
      baseQuery = baseQuery.gte('started_at', filters.dateDebut);
    }
    if (filters?.dateFin) {
      baseQuery = baseQuery.lte('started_at', filters.dateFin);
    }
    if (filters?.praticienId) {
      baseQuery = baseQuery.eq('created_by', filters.praticienId);
    }

    const { data, error } = await baseQuery;

    if (error) throw error;

    const aujourdhui = new Date().toISOString().split('T')[0];
    const aujourdhuiData = (data || []).filter(
      (c) => c.started_at?.startsWith(aujourdhui)
    );

    return {
      total: data?.length || 0,
      enCours: data?.filter((c) => c.status === 'EN_COURS').length || 0,
      cloturees: data?.filter((c) => c.status === 'CLOTURE').length || 0,
      archivees: data?.filter((c) => c.status === 'ARCHIVE').length || 0,
      aujourdhui: aujourdhuiData.length
    };
  }

  // ============================================
  // WORKFLOW METHODS
  // ============================================

  /**
   * Sauvegarder les données d'une étape du workflow
   */
  static async saveWorkflowStep(
    consultationId: string,
    stepNumber: number,
    stepData: any
  ): Promise<Consultation> {
    // Support pour Vite (import.meta.env) et CRA (process.env) pour compatibilité
    const API_URL = import.meta.env.VITE_API_URL || 
      (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
      'http://localhost:3000';
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${API_URL}/api/consultations/${consultationId}/workflow/step/${stepNumber}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(stepData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la sauvegarde de l\'étape');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Récupérer toutes les données du workflow d'une consultation
   */
  static async getWorkflowData(consultationId: string): Promise<{
    consultation: Consultation;
    constantes: ConsultationConstantes | null;
    prescriptions: Prescription[];
    entries: ConsultationEntry[];
  }> {
    // Support pour Vite (import.meta.env) et CRA (process.env) pour compatibilité
    const API_URL = import.meta.env.VITE_API_URL || 
      (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
      'http://localhost:3000';
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${API_URL}/api/consultations/${consultationId}/workflow`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération du workflow');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Clôturer une consultation
   */
  static async clotureConsultation(
    consultationId: string,
    prochaineConsultation?: string
  ): Promise<Consultation> {
    // Support pour Vite (import.meta.env) et CRA (process.env) pour compatibilité
    const API_URL = import.meta.env.VITE_API_URL || 
      (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
      'http://localhost:3000';
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${API_URL}/api/consultations/${consultationId}/cloture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prochaine_consultation: prochaineConsultation })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la clôture de la consultation');
    }

    const result = await response.json();
    return result.data;
  }
}

