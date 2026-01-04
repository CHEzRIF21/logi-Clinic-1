import { supabase } from './supabase';
import { getMyClinicId } from './clinicService';

export interface BillingSummaryLine {
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'consultation' | 'labo' | 'imagerie' | 'medicament' | 'acte';
}

export interface BillingSummary {
  consultationId: string;
  patientId: string;
  lines: BillingSummaryLine[];
  total: number;
  warnings: string[];
  factureId?: string;
}

export const ConsultationBillingService = {
  /**
   * Construit le résumé de facturation pour une consultation
   */
  async buildBillingSummary(consultationId: string): Promise<BillingSummary> {
    const lines: BillingSummaryLine[] = [];
    const warnings: string[] = [];

    // Récupérer la consultation
    const { data: consultation, error: consultError } = await supabase
      .from('consultations')
      .select('*, patients(id, nom, prenom)')
      .eq('id', consultationId)
      .single();

    if (consultError) {
      throw new Error(`Consultation introuvable: ${consultError.message}`);
    }

    const patientId = consultation.patient_id;

    // 1. Ajouter la consultation elle-même
    const consultationTarif = 5000; // Tarif par défaut en XOF
    lines.push({
      label: `Consultation ${consultation.type || 'Médecine générale'}`,
      quantity: 1,
      unitPrice: consultationTarif,
      total: consultationTarif,
      type: 'consultation'
    });

    // 2. Récupérer les prescriptions de médicaments
    try {
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select(`
          id,
          prescription_lines(
            id,
            nom_medicament,
            quantite_totale,
            medicaments(prix_unitaire_detail, prix_unitaire)
          )
        `)
        .eq('consultation_id', consultationId);

      if (prescriptions) {
        for (const presc of prescriptions) {
          const prescLines = (presc as any).prescription_lines || [];
          for (const line of prescLines) {
            const medicament = line.medicaments;
            const prixUnit = medicament?.prix_unitaire_detail || medicament?.prix_unitaire || 0;
            lines.push({
              label: line.nom_medicament || 'Médicament',
              quantity: line.quantite_totale || 1,
              unitPrice: prixUnit,
              total: prixUnit * (line.quantite_totale || 1),
              type: 'medicament'
            });
          }
        }
      }
    } catch (e) {
      console.warn('Erreur récupération prescriptions:', e);
      warnings.push('Certaines prescriptions n\'ont pas pu être chargées');
    }

    // 3. Récupérer les demandes de labo
    try {
      const { data: labRequests } = await supabase
        .from('lab_prescriptions')
        .select('id, type_examen, montant_total')
        .eq('consultation_id', consultationId);

      if (labRequests) {
        for (const lab of labRequests) {
          lines.push({
            label: lab.type_examen || 'Examen laboratoire',
            quantity: 1,
            unitPrice: lab.montant_total || 0,
            total: lab.montant_total || 0,
            type: 'labo'
          });
        }
      }
    } catch (e) {
      console.warn('Erreur récupération labo:', e);
    }

    // 4. Récupérer les demandes d'imagerie
    try {
      const { data: imagingRequests } = await supabase
        .from('imaging_requests')
        .select('id, type_examen, montant')
        .eq('consultation_id', consultationId);

      if (imagingRequests) {
        for (const img of imagingRequests) {
          lines.push({
            label: img.type_examen || 'Examen imagerie',
            quantity: 1,
            unitPrice: img.montant || 0,
            total: img.montant || 0,
            type: 'imagerie'
          });
        }
      }
    } catch (e) {
      console.warn('Erreur récupération imagerie:', e);
    }

    // Calculer le total
    const total = lines.reduce((sum, line) => sum + line.total, 0);

    return {
      consultationId,
      patientId,
      lines,
      total,
      warnings
    };
  },

  /**
   * S'assure qu'une facture est générée pour la consultation
   */
  async ensureInvoiceGenerated(consultationId: string, patientId: string): Promise<{ factureId: string }> {
    const clinicId = await getMyClinicId();

    // Vérifier si une facture existe déjà
    const { data: existingFacture } = await supabase
      .from('factures')
      .select('id')
      .eq('consultation_id', consultationId)
      .maybeSingle();

    if (existingFacture) {
      return { factureId: existingFacture.id };
    }

    // Construire le résumé de facturation
    const summary = await this.buildBillingSummary(consultationId);

    // Créer la facture
    const { data: facture, error } = await supabase
      .from('factures')
      .insert({
        patient_id: patientId,
        clinic_id: clinicId,
        consultation_id: consultationId,
        montant_total: summary.total,
        montant_paye: 0,
        statut: 'en_attente',
        lignes: summary.lines,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Si la table n'existe pas, retourner un ID fictif
      if (error.code === '42P01') {
        console.warn('Table factures non trouvée, facturation simulée');
        return { factureId: `SIM-${consultationId.substring(0, 8)}` };
      }
      throw error;
    }

    return { factureId: facture.id };
  },

  /**
   * Génère et enregistre la facture pour une consultation
   */
  async generateInvoice(consultationId: string, patientId: string): Promise<BillingSummary> {
    const summary = await this.buildBillingSummary(consultationId);
    const result = await this.ensureInvoiceGenerated(consultationId, patientId);
    summary.factureId = result.factureId;
    return summary;
  }
};

