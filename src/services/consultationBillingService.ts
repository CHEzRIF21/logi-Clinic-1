import { supabase } from './supabase';
import { getMyClinicId } from './clinicService';
import { ConfigurationService } from './configurationService';

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
  },

  /**
   * Crée une facture initiale automatique pour une consultation
   * Utilise la fonction SQL create_initial_invoice_for_consultation
   */
  async createInitialInvoice(
    patientId: string,
    consultationId: string,
    typeConsultation: 'generale' | 'specialisee' | 'urgence',
    serviceConsulte?: string,
    isUrgent: boolean = false
  ): Promise<string | null> {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) {
        throw new Error('Clinic ID non trouvé');
      }

      // Vérifier si le paiement est obligatoire
      const paymentRequired = await ConfigurationService.isPaymentRequiredBeforeConsultation();
      if (!paymentRequired) {
        return null; // Pas de facture si paiement non obligatoire
      }

      // Appeler la fonction SQL pour créer la facture initiale
      const { data, error } = await supabase.rpc('create_initial_invoice_for_consultation', {
        p_consultation_id: consultationId,
        p_patient_id: patientId,
        p_clinic_id: clinicId,
        p_type_consultation: typeConsultation,
        p_is_urgent: isUrgent,
      });

      if (error) {
        console.error('Erreur création facture initiale:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Erreur dans createInitialInvoice:', error);
      throw error;
    }
  },

  /**
   * Récupère les actes par défaut depuis la configuration
   */
  async getDefaultBillingActs(
    typeConsultation: 'generale' | 'specialisee' | 'urgence',
    isUrgent: boolean = false
  ): Promise<string[]> {
    return await ConfigurationService.getDefaultBillingActs(typeConsultation, isUrgent);
  },

  /**
   * Vérifie si le paiement est requis pour une consultation
   */
  async checkPaymentRequired(consultationId: string): Promise<boolean> {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) {
        return false;
      }

      // Vérifier la configuration
      const paymentRequired = await ConfigurationService.isPaymentRequiredBeforeConsultation();
      if (!paymentRequired) {
        return false;
      }

      // Vérifier le statut de la consultation
      const { data: consultation, error } = await supabase
        .from('consultations')
        .select('statut_paiement')
        .eq('id', consultationId)
        .single();

      if (error || !consultation) {
        return false;
      }

      // Si déjà payé ou exonéré, pas besoin de paiement
      if (consultation.statut_paiement === 'paye' || consultation.statut_paiement === 'exonere') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur vérification paiement requis:', error);
      return false;
    }
  },

  /**
   * Vérifie si l'utilisateur peut accéder à la consultation
   */
  async canAccessConsultation(consultationId: string, userId?: string): Promise<{
    canAccess: boolean;
    reason: string;
    statutPaiement?: string;
    factureId?: string;
    montantRestant?: number;
  }> {
    try {
      // Appeler la fonction SQL de vérification
      const { data, error } = await supabase.rpc('check_consultation_payment_status', {
        p_consultation_id: consultationId,
      });

      if (error) {
        console.error('Erreur vérification statut paiement:', error);
        return {
          canAccess: false,
          reason: 'Erreur lors de la vérification du paiement',
        };
      }

      if (!data || data.length === 0) {
        return {
          canAccess: false,
          reason: 'Consultation introuvable',
        };
      }

      const result = data[0];
      return {
        canAccess: result.peut_consulter,
        reason: result.message,
        statutPaiement: result.statut_paiement,
        factureId: result.facture_id,
        montantRestant: result.montant_restant ? parseFloat(result.montant_restant) : 0,
      };
    } catch (error) {
      console.error('Erreur dans canAccessConsultation:', error);
      return {
        canAccess: false,
        reason: 'Erreur lors de la vérification',
      };
    }
  },

  /**
   * Crée une facture complémentaire pour les actes prescrits après consultation
   */
  async createComplementaryInvoice(
    consultationId: string,
    patientId: string,
    acts: Array<{
      code: string;
      libelle: string;
      quantite: number;
      prix_unitaire: number;
    }>
  ): Promise<string | null> {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) {
        throw new Error('Clinic ID non trouvé');
      }

      // Calculer le montant total
      const montantTotal = acts.reduce((sum, act) => sum + (act.prix_unitaire * act.quantite), 0);

      if (montantTotal <= 0) {
        return null; // Pas de facture si montant nul
      }

      // Générer le numéro de facture
      const annee = new Date().getFullYear();
      const { data: lastFacture } = await supabase
        .from('factures')
        .select('numero_facture')
        .like('numero_facture', `FAC-${annee}-%`)
        .order('numero_facture', { ascending: false })
        .limit(1)
        .single();

      let numeroSeq = 1;
      if (lastFacture) {
        const match = lastFacture.numero_facture.match(/\d+$/);
        if (match) {
          numeroSeq = parseInt(match[0]) + 1;
        }
      }

      const numeroFacture = `FAC-${annee}-${String(numeroSeq).padStart(6, '0')}`;

      // Créer la facture complémentaire
      const { data: facture, error: factureError } = await supabase
        .from('factures')
        .insert({
          numero_facture: numeroFacture,
          patient_id: patientId,
          consultation_id: consultationId,
          montant_total: montantTotal,
          montant_restant: montantTotal,
          montant_paye: 0,
          statut: 'en_attente',
          type_facture_detail: 'complementaire',
          bloque_consultation: false, // Les factures complémentaires ne bloquent pas la consultation
          service_origine: 'consultation',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (factureError) {
        console.error('Erreur création facture complémentaire:', factureError);
        throw factureError;
      }

      // Créer les lignes de facture
      const lignes = acts.map((act, index) => ({
        facture_id: facture.id,
        code_service: act.code,
        libelle: act.libelle,
        quantite: act.quantite,
        prix_unitaire: act.prix_unitaire,
        montant_ligne: act.prix_unitaire * act.quantite,
        ordre: index + 1,
      }));

      const { error: lignesError } = await supabase
        .from('lignes_facture')
        .insert(lignes);

      if (lignesError) {
        console.error('Erreur création lignes facture:', lignesError);
        // Ne pas échouer si les lignes ne peuvent pas être créées
      }

      return facture.id;
    } catch (error) {
      console.error('Erreur dans createComplementaryInvoice:', error);
      throw error;
    }
  },

  /**
   * Récupère les factures complémentaires en attente pour une consultation
   */
  async getPendingComplementaryInvoices(consultationId: string): Promise<Array<{
    id: string;
    numero_facture: string;
    montant_total: number;
    montant_restant: number;
    statut: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('factures')
        .select('id, numero_facture, montant_total, montant_restant, statut')
        .eq('consultation_id', consultationId)
        .eq('type_facture_detail', 'complementaire')
        .in('statut', ['en_attente', 'partiellement_payee']);

      if (error) {
        console.error('Erreur récupération factures complémentaires:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getPendingComplementaryInvoices:', error);
      return [];
    }
  }
};

