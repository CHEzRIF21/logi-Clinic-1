import { supabase } from './supabase';
import {
  FacturationService,
  Facture,
  LigneFacture,
  ServiceFacturable,
} from './facturationService';

export type BillingLineSource = 'CONSULTATION' | 'MEDICAMENT' | 'LABO' | 'IMAGERIE';

export interface ConsultationBillingLine {
  source: BillingLineSource;
  referenceId?: string;
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
  serviceFacturableId?: string;
  codeService?: string;
}

export interface ConsultationBillingSummary {
  lines: ConsultationBillingLine[];
  total: number;
  warnings: string[];
}

interface SupabaseConsultation {
  id: string;
  patient_id: string;
  type: string;
  template_id?: string;
}

interface SupabaseTemplate {
  id: string;
  nom: string;
  specialite: string;
}

export class ConsultationBillingService {
  static async getExistingInvoice(consultationId: string): Promise<Facture | null> {
    const { data, error } = await supabase
      .from('factures')
      .select('*')
      .eq('consultation_id', consultationId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? (await FacturationService.getFactureById(data.id)) : null;
  }

  static async buildBillingSummary(consultationId: string): Promise<ConsultationBillingSummary> {
    const consultation = await this.getConsultation(consultationId);
    if (!consultation) {
      throw new Error('Consultation introuvable');
    }

    const template = await this.getTemplate(consultation.template_id);

    const lines: ConsultationBillingLine[] = [];
    const warnings: string[] = [];

    // 1. Acte de consultation
    const consultationService = await this.getConsultationService(template?.specialite);
    if (consultationService) {
      const line = this.createConsultationLine(consultation, consultationService);
      lines.push(line);
      if (line.unitPrice <= 0) {
        warnings.push("Le tarif de l'acte de consultation n'est pas défini");
      }
    } else {
      warnings.push('Aucun service facturable trouvé pour les consultations');
    }

    // 2. Médicaments prescrits
    const medicationLines = await this.getMedicationLines(consultationId);
    lines.push(...medicationLines.lines);
    warnings.push(...medicationLines.warnings);

    // 3. Examens laboratoire
    const labLines = await this.getLabRequestLines(consultationId);
    lines.push(...labLines.lines);
    warnings.push(...labLines.warnings);

    // 4. Examens d'imagerie
    const imagingLines = await this.getImagingRequestLines(consultationId);
    lines.push(...imagingLines.lines);
    warnings.push(...imagingLines.warnings);

    const total = lines.reduce((sum, line) => sum + line.total, 0);

    return {
      lines,
      total,
      warnings,
    };
  }

  static async generateInvoice(
    consultationId: string,
    patientId: string
  ): Promise<{ facture: Facture; summary: ConsultationBillingSummary }> {
    const existing = await this.getExistingInvoice(consultationId);
    if (existing) {
      return { facture: existing, summary: await this.buildBillingSummary(consultationId) };
    }

    const summary = await this.buildBillingSummary(consultationId);
    if (summary.lines.length === 0) {
      throw new Error('Aucun élément facturable pour cette consultation');
    }

    const facture = await FacturationService.createFacture({
      patient_id: patientId,
      consultation_id: consultationId,
      service_origine: 'consultation',
      reference_externe: consultationId,
      lignes: summary.lines.map((line, index) => {
        const factureLine: LigneFacture = {
          libelle: line.label,
          quantite: line.quantity,
          prix_unitaire: line.unitPrice,
          montant_ligne: line.total,
          remise_ligne: 0,
          service_facturable_id: line.serviceFacturableId,
          code_service: line.codeService,
          ordre: index + 1,
        };
        return factureLine;
      }),
    });

    return { facture, summary };
  }

  static async ensureInvoiceGenerated(
    consultationId: string,
    patientId: string
  ): Promise<Facture | null> {
    const existing = await this.getExistingInvoice(consultationId);
    if (existing) return existing;

    const summary = await this.buildBillingSummary(consultationId);
    if (summary.lines.length === 0) {
      return null;
    }

    const { facture } = await this.generateInvoice(consultationId, patientId);
    return facture;
  }

  private static async getConsultation(
    consultationId: string
  ): Promise<SupabaseConsultation | null> {
    const { data, error } = await supabase
      .from('consultations')
      .select('id, patient_id, type, template_id')
      .eq('id', consultationId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de la consultation:', error);
      return null;
    }
    return data as SupabaseConsultation;
  }

  private static async getTemplate(templateId?: string | null): Promise<SupabaseTemplate | null> {
    if (!templateId) return null;

    const { data, error } = await supabase
      .from('consultation_templates')
      .select('id, nom, specialite')
      .eq('id', templateId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur lors de la récupération du template:', error);
      return null;
    }

    return data as SupabaseTemplate | null;
  }

  private static async getConsultationService(
    specialite?: string | null
  ): Promise<ServiceFacturable | null> {
    if (specialite) {
      const { data, error } = await supabase
        .from('services_facturables')
        .select('*')
        .eq('type_service', 'consultation')
        .eq('actif', true)
        .ilike('nom', `%${specialite}%`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur services facturables (specialite):', error);
      } else if (data) {
        return data as ServiceFacturable;
      }
    }

    const { data, error } = await supabase
      .from('services_facturables')
      .select('*')
      .eq('type_service', 'consultation')
      .eq('actif', true)
      .order('tarif_base', { ascending: false })
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur services facturables:', error);
      return null;
    }

    return data as ServiceFacturable | null;
  }

  private static createConsultationLine(
    consultation: SupabaseConsultation,
    service: ServiceFacturable
  ): ConsultationBillingLine {
    const unitPrice = service.tarif_base || 0;
    return {
      source: 'CONSULTATION',
      referenceId: service.id,
      label: service.nom || `Consultation ${consultation.type}`,
      quantity: 1,
      unitPrice,
      total: unitPrice,
      serviceFacturableId: service.id,
      codeService: service.code,
    };
  }

  private static async getMedicationLines(
    consultationId: string
  ): Promise<{ lines: ConsultationBillingLine[]; warnings: string[] }> {
    const warnings: string[] = [];
    const lines: ConsultationBillingLine[] = [];

    const { data: prescriptions, error: prescriptionsError } = await supabase
      .from('prescriptions')
      .select('id')
      .eq('consultation_id', consultationId);

    if (prescriptionsError) {
      console.error('Erreur prescriptions:', prescriptionsError);
      return { lines, warnings };
    }

    const prescriptionIds = (prescriptions || []).map((p) => p.id);
    if (prescriptionIds.length === 0) {
      return { lines, warnings };
    }

    const { data: prescriptionLines, error: linesError } = await supabase
      .from('prescription_lines')
      .select(
        `
        id,
        prescription_id,
        nom_medicament,
        quantite_totale,
        medicament_id,
        medicaments (
          id,
          nom,
          prix_unitaire
        )
      `
      )
      .in('prescription_id', prescriptionIds);

    if (linesError && linesError.code !== 'PGRST116') {
      console.error('Erreur lignes de prescription:', linesError);
      return { lines, warnings };
    }

    (prescriptionLines || []).forEach((line) => {
      const medicament = (line as any).medicaments;
      const label = line.nom_medicament || medicament?.nom || 'Médicament';
      const quantity = line.quantite_totale || 1;
      const unitPrice = this.asNumber(medicament?.prix_unitaire);
      if (unitPrice <= 0) {
        warnings.push(`Tarif non défini pour ${label}`);
      }
      lines.push({
        source: 'MEDICAMENT',
        referenceId: line.id,
        label,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      });
    });

    return { lines, warnings };
  }

  private static async getLabRequestLines(
    consultationId: string
  ): Promise<{ lines: ConsultationBillingLine[]; warnings: string[] }> {
    const warnings: string[] = [];
    const lines: ConsultationBillingLine[] = [];

    const { data, error } = await supabase
      .from('lab_requests')
      .select('id, tests')
      .eq('consultation_id', consultationId);

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur demandes labo:', error);
      return { lines, warnings };
    }

    (data || []).forEach((request) => {
      const tests = Array.isArray(request.tests) ? request.tests : [];
      tests.forEach((test: any, index: number) => {
        const label = test?.nom || test?.code || 'Analyse biologique';
        const unitPrice = this.asNumber(test?.tarif_base);
        if (unitPrice <= 0) {
          warnings.push(`Tarif non défini pour l'analyse ${label}`);
        }
        lines.push({
          source: 'LABO',
          referenceId: `${request.id}-test-${index}`,
          label,
          quantity: 1,
          unitPrice,
          total: unitPrice,
          serviceFacturableId: test?.service_facturable_id || undefined,
          codeService: test?.code,
        });
      });
    });

    return { lines, warnings };
  }

  private static async getImagingRequestLines(
    consultationId: string
  ): Promise<{ lines: ConsultationBillingLine[]; warnings: string[] }> {
    const warnings: string[] = [];
    const lines: ConsultationBillingLine[] = [];

    const { data, error } = await supabase
      .from('imaging_requests')
      .select('id, examens')
      .eq('consultation_id', consultationId);

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur demandes imagerie:', error);
      return { lines, warnings };
    }

    (data || []).forEach((request) => {
      const exams = Array.isArray(request.examens) ? request.examens : [];
      exams.forEach((exam: any, index: number) => {
        const label = exam?.nom || exam?.code || "Examen d'imagerie";
        const unitPrice = this.asNumber(exam?.tarif_base);
        if (unitPrice <= 0) {
          warnings.push(`Tarif non défini pour l'examen ${label}`);
        }
        lines.push({
          source: 'IMAGERIE',
          referenceId: `${request.id}-exam-${index}`,
          label,
          quantity: 1,
          unitPrice,
          total: unitPrice,
          serviceFacturableId: exam?.service_facturable_id || undefined,
          codeService: exam?.code,
        });
      });
    });

    return { lines, warnings };
  }

  private static asNumber(value: any): number {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  }
}

export default ConsultationBillingService;

