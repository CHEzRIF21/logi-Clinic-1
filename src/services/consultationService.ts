import { supabase } from './supabase';
import { getMyClinicId } from './clinicService';

export interface Consultation {
  id: string;
  patient_id: string;
  clinic_id: string;
  medecin_id?: string;
  status: 'BROUILLON' | 'EN_COURS' | 'CLOTURE' | 'ANNULE';
  motifs: string[];
  categorie_motif?: string;
  type?: string; // Type de consultation (Médecine générale, etc.)
  template_id?: string; // ID du template utilisé
  anamnese?: string;
  traitement_en_cours?: string;
  examens_cliniques: any;
  diagnostics: string[];
  diagnostics_detail: any[];
  prochaine_consultation?: string;
  started_at?: string; // Utilise started_at au lieu de opened_at
  closed_at?: string;
  opened_by?: string; // Utilisateur qui a ouvert la consultation
  created_by?: string; // Utilisateur qui a créé la consultation
  created_at?: string;
  updated_at?: string;
}

export interface ConsultationConstantes {
  id: string;
  consultation_id: string;
  patient_id: string;
  clinic_id: string;
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
  saturation_o2?: number;
  frequence_respiratoire?: number;
  glycemie_mg_dl?: number;
  created_at: string;
}

export interface LabRequest {
  id: string;
  consultation_id: string;
  patient_id: string;
  type_examen?: string;
  type?: 'INTERNE' | 'EXTERNE';
  clinical_info?: string;
  details?: string;
  statut?: 'en_attente' | 'preleve' | 'termine' | 'annule';
  tests?: any[];
  facturable?: boolean;
  created_at?: string;
}

export class ConsultationService {
  /**
   * Récupérer les templates de consultation
   */
  static async getTemplates(): Promise<any[]> {
    const { data, error } = await supabase
      .from('consultation_templates')
      .select('*')
      .eq('actif', true);

    if (error) throw error;
    return data || [];
  }

  /**
   * Créer une nouvelle consultation
   */
  static async createConsultation(patientId: string, userId: string): Promise<Consultation> {
    let clinicId = await getMyClinicId();
    
    // Fallback: Si getMyClinicId() retourne null, récupérer depuis l'utilisateur
    if (!clinicId && userId) {
      try {
        // Vérifier que userId est un UUID valide
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(userId)) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('clinic_id')
            .eq('id', userId)
            .maybeSingle();
          
          if (!userError && userData?.clinic_id) {
            clinicId = userData.clinic_id;
          } else if (userError) {
            console.error('Erreur récupération clinic_id depuis userId:', userError);
          }
        } else {
          console.warn('userId invalide (pas un UUID):', userId);
        }
      } catch (err) {
        console.error('Erreur récupération clinic_id depuis userId:', err);
      }
    }
    
    if (!clinicId) {
      throw new Error('Clinic ID non trouvé. Vérifiez que l\'utilisateur est bien lié à une clinique.');
    }

    const { data, error } = await supabase
      .from('consultations')
      .insert({
        patient_id: patientId,
        clinic_id: clinicId,
        opened_by: userId,
        created_by: userId,
        type: 'Médecine générale', // Colonne REQUISE (NOT NULL) dans la table
        status: 'EN_COURS'
        // categorie_motif sera ajouté plus tard si nécessaire (colonne optionnelle)
        // opened_at sera défini automatiquement par la valeur par défaut de la table
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création consultation:', error);
      throw new Error(`Erreur lors de la création de la consultation: ${error.message}`);
    }
    return data;
  }

  /**
   * Récupérer toutes les consultations
   */
  static async getAllConsultations(): Promise<Consultation[]> {
    const clinicId = await getMyClinicId();
    let query = supabase
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtrer par clinic_id si pas super admin
    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Récupérer une consultation par son ID
   */
  static async getConsultationById(id: string): Promise<Consultation | null> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Mettre à jour une consultation
   */
  static async updateConsultation(id: string, updates: Partial<Consultation>, userId: string, field?: string): Promise<Consultation> {
    const { data, error } = await supabase
      .from('consultations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Sauvegarder une étape du workflow
   */
  static async saveWorkflowStep(consultationId: string, stepNumber: number, stepData: any, userId: string): Promise<void> {
    // 1. Sauvegarder dans la table spécialisée des étapes
    const { error: stepError } = await supabase
      .from('consultation_steps')
      .upsert({
        consult_id: consultationId,
        step_number: stepNumber,
        data: stepData,
        completed_at: new Date().toISOString(),
        completed_by: userId
      }, { onConflict: 'consult_id, step_number' });

    if (stepError) throw stepError;

    // 2. Mettre à jour la consultation principale selon l'étape
    const updates: any = {};
    if (stepNumber === 1) { // Motifs
      updates.motifs = stepData.motif ? [stepData.motif] : [];
      updates.categorie_motif = stepData.categorie_motif;
    } else if (stepNumber === 2) { // Anamnèse
      updates.anamnese = stepData.anamnese;
    } else if (stepNumber === 4) { // Antécédents
      // Les antécédents sont souvent gérés via une table séparée pour être persistants
      if (stepData.antecedents) {
        const { medicaux, chirurgicaux, familiaux } = stepData.antecedents;
        const clinicId = await getMyClinicId();
        
        // Stocker en JSON dans la consultation pour le workflow
        updates.antecedents_consultation = stepData.antecedents;
        
        // Synchroniser vers patient_antecedents pour le dossier permanent
        try {
          const { data: consultation } = await supabase
            .from('consultations')
            .select('patient_id')
            .eq('id', consultationId)
            .single();
          
          if (consultation?.patient_id && clinicId) {
            // Synchroniser les antécédents médicaux
            if (medicaux && Array.isArray(medicaux)) {
              for (const ant of medicaux) {
                if (ant.nom && ant.nom.trim()) {
                  await supabase.from('patient_antecedents').upsert({
                    patient_id: consultation.patient_id,
                    clinic_id: clinicId,
                    type: 'medicaux',
                    nom: ant.nom.trim(),
                    annee: ant.annee || null,
                    created_by: userId
                  }, { 
                    onConflict: 'patient_antecedents_unique_patient_type_nom',
                    ignoreDuplicates: false
                  });
                }
              }
            }
            
            // Synchroniser les antécédents chirurgicaux
            if (chirurgicaux && Array.isArray(chirurgicaux)) {
              for (const ant of chirurgicaux) {
                if (ant.nom && ant.nom.trim()) {
                  await supabase.from('patient_antecedents').upsert({
                    patient_id: consultation.patient_id,
                    clinic_id: clinicId,
                    type: 'chirurgicaux',
                    nom: ant.nom.trim(),
                    annee: ant.annee || null,
                    created_by: userId
                  }, { 
                    onConflict: 'patient_antecedents_unique_patient_type_nom',
                    ignoreDuplicates: false
                  });
                }
              }
            }
            
            // Synchroniser les antécédents familiaux
            if (familiaux && Array.isArray(familiaux)) {
              for (const ant of familiaux) {
                if (ant && ant.trim()) {
                  await supabase.from('patient_antecedents').upsert({
                    patient_id: consultation.patient_id,
                    clinic_id: clinicId,
                    type: 'familiaux',
                    nom: ant.trim(),
                    annee: null,
                    created_by: userId
                  }, { 
                    onConflict: 'patient_antecedents_unique_patient_type_nom',
                    ignoreDuplicates: false
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error('Erreur synchronisation antécédents:', error);
          // Ne pas bloquer le workflow si la synchro échoue
        }
      }
    } else if (stepNumber === 5) { // Prévention
      // Géré principalement via VaccinationService et DeparasitageService
    } else if (stepNumber === 8) { // Examen physique
      updates.examens_cliniques = stepData.examens_cliniques;
    } else if (stepNumber === 9) { // Diagnostic
      updates.diagnostics = stepData.diagnostics;
      updates.diagnostics_detail = stepData.diagnostics_detail;
    }

    if (Object.keys(updates).length > 0) {
      const { error: consultError } = await supabase
        .from('consultations')
        .update(updates)
        .eq('id', consultationId);
      
      if (consultError) throw consultError;
    }
  }

  /**
   * Récupérer les constantes d'une consultation
   */
  static async getConstantes(consultationId: string): Promise<ConsultationConstantes | null> {
    const { data, error } = await supabase
      .from('consultation_constantes')
      .select('*')
      .eq('consultation_id', consultationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Récupérer les dernières constantes médicales du patient
   * Priorité : patient_constantes (constantes synchronisées) > consultation_constantes (dernières consultations)
   */
  static async getPatientLatestConstantes(patientId: string): Promise<ConsultationConstantes | null> {
    try {
      // D'abord, essayer de récupérer depuis patient_constantes (constantes synchronisées)
      const { data: patientConstantes, error: patientError } = await supabase
        .from('patient_constantes')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (!patientError && patientConstantes) {
        // Convertir patient_constantes en ConsultationConstantes
        return {
          id: patientConstantes.id,
          consultation_id: patientConstantes.last_consultation_id || '',
          patient_id: patientConstantes.patient_id,
          clinic_id: patientConstantes.clinic_id,
          taille_cm: patientConstantes.taille_cm,
          poids_kg: patientConstantes.poids_kg,
          imc: patientConstantes.imc,
          temperature_c: patientConstantes.temperature_c,
          pouls_bpm: patientConstantes.pouls_bpm,
          frequence_respiratoire: patientConstantes.frequence_respiratoire,
          saturation_o2: patientConstantes.saturation_o2,
          glycemie_mg_dl: patientConstantes.glycemie_mg_dl,
          ta_bras_gauche_systolique: patientConstantes.ta_systolique,
          ta_bras_gauche_diastolique: patientConstantes.ta_diastolique,
          ta_bras_droit_systolique: patientConstantes.ta_systolique,
          ta_bras_droit_diastolique: patientConstantes.ta_diastolique,
          hauteur_uterine: patientConstantes.hauteur_uterine,
          created_at: patientConstantes.created_at
        } as ConsultationConstantes;
      }

      // Fallback : récupérer depuis consultation_constantes (dernières consultations)
      const { data, error } = await supabase
        .from('consultation_constantes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des constantes du patient:', error);
      return null;
    }
  }

  /**
   * Sauvegarder les constantes
   */
  static async saveConstantes(consultationId: string, patientId: string, data: Partial<ConsultationConstantes>, userId: string, syncToPatient: boolean = false): Promise<void> {
    const clinicId = await getMyClinicId();
    
    const { error } = await supabase
      .from('consultation_constantes')
      .upsert({
        ...data,
        consultation_id: consultationId,
        patient_id: patientId,
        clinic_id: clinicId,
        created_by: userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'consultation_id' });

    if (error) throw error;

    // Si syncToPatient est activé, synchroniser vers patient_constantes
    if (syncToPatient) {
      const { error: syncError } = await supabase
        .from('patient_constantes')
        .upsert({
          patient_id: patientId,
          clinic_id: clinicId,
          taille_cm: data.taille_cm,
          poids_kg: data.poids_kg,
          imc: data.imc,
          temperature_c: data.temperature_c,
          pouls_bpm: data.pouls_bpm,
          frequence_respiratoire: data.frequence_respiratoire,
          saturation_o2: data.saturation_o2,
          ta_systolique: data.ta_bras_gauche_systolique || data.ta_bras_droit_systolique,
          ta_diastolique: data.ta_bras_gauche_diastolique || data.ta_bras_droit_diastolique,
          last_consultation_id: consultationId,
          last_updated_by: userId,
          last_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'patient_id' });

      if (syncError) {
        console.error('Erreur lors de la synchronisation vers patient_constantes:', syncError);
        // Ne pas bloquer la sauvegarde si la synchronisation échoue
        // mais logger l'erreur pour le débogage
      }
    }
  }

  /**
   * Récupérer les demandes de labo (lab_prescriptions au lieu de lab_requests inexistant)
   */
  static async getLabRequests(consultationId: string): Promise<LabRequest[]> {
    const { data, error } = await supabase
      .from('lab_prescriptions')
      .select('*')
      .eq('consultation_id', consultationId);

    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      consultation_id: r.consultation_id,
      patient_id: r.patient_id,
      type_examen: r.type_examen,
      type: r.origine === 'urgence' ? 'EXTERNE' : 'INTERNE',
      clinical_info: r.details,
      details: r.details,
      statut: r.statut === 'prescrit' ? 'en_attente' : r.statut === 'preleve' ? 'preleve' : r.statut === 'annule' ? 'annule' : 'termine',
      tests: r.details ? [{ nom: r.type_examen, details: r.details }] : [],
      facturable: true,
      created_at: r.created_at,
    }));
  }

  /**
   * Dispenser une prescription (simulé via integrationService)
   */
  static async dispenserPrescription(prescriptionId: string, items: any[], userId?: string): Promise<void> {
    // Cette méthode devrait appeler le service de dispensation/stock
    // Pour l'instant, on laisse le frontend appeler les services dédiés
    console.log('Dispensation prescription:', prescriptionId, items, userId);
  }

  /**
   * Créer une ordonnance complète
   */
  static async createPrescription(
    consultationId: string, 
    patientId: string, 
    userId: string, 
    lines: any[]
  ): Promise<any> {
    const clinicId = await getMyClinicId();
    
    // 1. Créer la prescription avec statut PRESCRIT pour qu'elle soit visible dans le module Pharmacie
    const { data: prescription, error: prescError } = await supabase
      .from('prescriptions')
      .insert({
        consultation_id: consultationId,
        patient_id: patientId,
        clinic_id: clinicId,
        created_by: userId,
        statut: 'PRESCRIT' // Statut explicite pour que la prescription soit visible dans le module Pharmacie
      })
      .select()
      .single();

    if (prescError) throw prescError;

    // 2. Créer les lignes de prescription
    const prescriptionLines = lines.map(line => ({
      prescription_id: prescription.id,
      medicament_id: line.medicament_id,
      nom_medicament: line.nom_medicament,
      posologie: line.posologie,
      quantite_totale: line.quantite_totale,
      duree_jours: line.duree_jours,
      mode_administration: line.mode_administration,
      instructions: line.instructions
    }));

    const { error: linesError } = await supabase
      .from('prescription_lines')
      .insert(prescriptionLines);

    if (linesError) throw linesError;

    // 3. Créer une facture "pharmacie" (en attente) liée à cette ordonnance,
    // afin que la délivrance soit possible uniquement après paiement à la Caisse.
    try {
      const uniqueMedicamentIds = Array.from(
        new Set(
          (lines || [])
            .map((l: any) => l?.medicament_id)
            .filter((id: any): id is string => Boolean(id))
        )
      );

      const medicamentsMap = new Map<
        string,
        { id: string; code?: string | null; nom?: string | null; prix_unitaire_detail?: number | null; prix_unitaire?: number | null }
      >();

      if (uniqueMedicamentIds.length > 0) {
        const { data: medsData, error: medsError } = await supabase
          .from('medicaments')
          .select('id, code, nom, prix_unitaire_detail, prix_unitaire')
          .in('id', uniqueMedicamentIds);

        if (medsError) throw medsError;
        (medsData || []).forEach((m: any) => medicamentsMap.set(m.id, m));
      }

      const invoiceLines = (lines || []).map((l: any, idx: number) => {
        const qty = Math.max(1, Number(l?.quantite_totale || 1));
        const med = l?.medicament_id ? medicamentsMap.get(l.medicament_id) : undefined;
        const unitPrice = Number(med?.prix_unitaire_detail ?? med?.prix_unitaire ?? 0);
        const libelle = String(l?.nom_medicament || med?.nom || 'Médicament');
        const codeService = String(med?.code || `MED-${idx + 1}`);
        const montantLigne = Math.max(0, unitPrice * qty);

        return {
          code_service: codeService,
          libelle,
          quantite: qty,
          prix_unitaire: unitPrice,
          remise_ligne: 0,
          montant_ligne: montantLigne,
          ordre: idx + 1,
        };
      });

      const montantTotal = invoiceLines.reduce((sum, l) => sum + (Number(l.montant_ligne) || 0), 0);
      const montantRestant = montantTotal > 0 ? montantTotal : 0;
      const statutFacture = montantTotal > 0 ? 'en_attente' : 'payee';

      // Générer un numéro de facture (fallback) : FAC-YYYY-000001
      const annee = new Date().getFullYear();
      let numeroSeq = 1;
      const { data: lastFacture, error: lastFactureError } = await supabase
        .from('factures')
        .select('numero_facture')
        .like('numero_facture', `FAC-${annee}-%`)
        .order('numero_facture', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!lastFactureError && lastFacture?.numero_facture) {
        const match = String(lastFacture.numero_facture).match(/\d+$/);
        if (match) numeroSeq = parseInt(match[0], 10) + 1;
      }
      const numeroFacture = `FAC-${annee}-${String(numeroSeq).padStart(6, '0')}`;

      const { data: facture, error: factureError } = await supabase
        .from('factures')
        .insert({
          numero_facture: numeroFacture,
          patient_id: patientId,
          clinic_id: clinicId,
          // IMPORTANT: on ne lie pas à consultation_id pour éviter de modifier le statut_paiement de la consultation
          consultation_id: null,
          montant_ht: montantTotal,
          montant_tva: 0,
          montant_remise: 0,
          montant_total: montantTotal,
          montant_paye: montantTotal > 0 ? 0 : montantTotal,
          montant_restant: montantRestant,
          statut: statutFacture,
          type_facture: 'normale',
          type_facture_detail: 'complementaire',
          bloque_consultation: false,
          service_origine: 'pharmacie',
          reference_externe: prescription.id,
          notes: `Ordonnance médicamenteuse (Prescription ${prescription.numero_prescription || prescription.id})`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (factureError) throw factureError;

      if (invoiceLines.length > 0) {
        const { error: lignesFactureError } = await supabase.from('lignes_facture').insert(
          invoiceLines.map((l) => ({
            facture_id: facture.id,
            ...l,
          }))
        );
        if (lignesFactureError) throw lignesFactureError;
      }

      // Créer un ticket de facturation lié à cette facture (acte caisse)
      const { error: ticketError } = await supabase.from('tickets_facturation').insert({
        patient_id: patientId,
        clinic_id: clinicId,
        service_origine: 'pharmacie',
        reference_origine: prescription.id,
        type_acte: 'ordonnance_medicaments',
        montant: montantTotal,
        statut: 'facture',
        facture_id: facture.id,
        date_creation: new Date().toISOString(),
        date_facturation: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (ticketError) throw ticketError;

      // Lier la prescription à la facture pour le "payment gate" côté pharmacie
      const { error: linkError } = await supabase
        .from('prescriptions')
        .update({ facture_id: facture.id, updated_at: new Date().toISOString() })
        .eq('id', prescription.id);
      if (linkError) throw linkError;
    } catch (billingError: any) {
      console.error('Erreur lors de la création de la facture pharmacie pour la prescription:', billingError);
      // Pour garantir le workflow "paiement requis avant délivrance", on annule la création de la prescription
      // si la facturation échoue (évite les prescriptions non facturées).
      try {
        await supabase.from('prescription_lines').delete().eq('prescription_id', prescription.id);
        await supabase.from('prescriptions').delete().eq('id', prescription.id);
      } catch (rollbackError) {
        console.error('Rollback impossible après échec facturation (prescription/lines):', rollbackError);
      }

      const msg = billingError?.message ? String(billingError.message) : 'Erreur inconnue';
      throw new Error(`Erreur facturation ordonnance: ${msg}`);
    }

    return prescription;
  }
}

