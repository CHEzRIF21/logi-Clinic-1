import { supabase } from './supabase';
import { FacturationService, LigneFacture } from './facturationService';
import { getMyClinicId } from './clinicService';

export interface ActeComplementaire {
  code: string;
  libelle: string;
  quantite: number;
  prix_unitaire: number;
  type_service?: 'consultation' | 'pharmacie' | 'laboratoire' | 'maternite' | 'vaccination' | 'imagerie' | 'autre';
}

export class ComplementaryInvoiceService {
  /**
   * Crée une facture complémentaire pour une consultation
   */
  static async createComplementaryInvoice(
    consultationId: string,
    actes: ActeComplementaire[]
  ): Promise<string> {
    const clinicId = await getMyClinicId();
    if (!clinicId) {
      throw new Error('Clinic ID manquant');
    }

    // Récupérer la consultation pour obtenir le patient_id
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .select('patient_id')
      .eq('id', consultationId)
      .single();

    if (consultationError || !consultation) {
      throw new Error('Consultation non trouvée');
    }

    // Convertir les actes en lignes de facture
    const lignes: LigneFacture[] = actes.map((acte) => ({
      code_service: acte.code,
      libelle: acte.libelle,
      quantite: acte.quantite,
      prix_unitaire: acte.prix_unitaire,
      remise_ligne: 0,
      montant_ligne: acte.prix_unitaire * acte.quantite,
    }));

    // Créer la facture complémentaire avec statut 'en_attente'
    const facture = await FacturationService.createFacture({
      patient_id: consultation.patient_id,
      consultation_id: consultationId,
      lignes,
      type_facture: 'normale',
      service_origine: 'actes_complementaires',
    });

    // Marquer la facture comme complémentaire (scope clinique)
    let updateQuery = supabase
      .from('factures')
      .update({
        type_facture_detail: 'complementaire',
        statut: 'en_attente'
      })
      .eq('id', facture.id);
    if (clinicId) updateQuery = updateQuery.eq('clinic_id', clinicId);
    await updateQuery;

    return facture.id;
  }

  /**
   * Ajoute un acte à une facture existante
   */
  static async addActeToInvoice(
    factureId: string,
    acte: ActeComplementaire
  ): Promise<void> {
    // Récupérer la facture
    const facture = await FacturationService.getFactureById(factureId);

    // Créer une nouvelle ligne de facture
    const ligne: LigneFacture = {
      facture_id: factureId,
      code_service: acte.code,
      libelle: acte.libelle,
      quantite: acte.quantite,
      prix_unitaire: acte.prix_unitaire,
      remise_ligne: 0,
      montant_ligne: acte.prix_unitaire * acte.quantite,
    };

    // Ajouter la ligne
    const { error } = await supabase
      .from('lignes_facture')
      .insert([ligne]);

    if (error) {
      throw error;
    }

    const clinicId = await getMyClinicId();
    if (facture.statut === 'payee') {
      let updateQuery = supabase
        .from('factures')
        .update({ statut: 'en_attente' })
        .eq('id', factureId);
      if (clinicId) updateQuery = updateQuery.eq('clinic_id', clinicId);
      await updateQuery;
    }
  }

  /**
   * Vérifie s'il y a des factures complémentaires non payées pour une consultation
   */
  static async checkComplementaryInvoices(consultationId: string): Promise<{
    hasUnpaid: boolean;
    factures: Array<{ id: string; montant_restant: number }>;
  }> {
    const clinicId = await getMyClinicId();
    let query = supabase
      .from('factures')
      .select('id, montant_restant, statut')
      .eq('consultation_id', consultationId)
      .eq('type_facture_detail', 'complementaire')
      .in('statut', ['en_attente', 'partiellement_payee']);
    if (clinicId) query = query.eq('clinic_id', clinicId);
    const { data: factures, error } = await query;

    if (error) {
      throw error;
    }

    return {
      hasUnpaid: factures && factures.length > 0,
      factures: factures || [],
    };
  }
}
