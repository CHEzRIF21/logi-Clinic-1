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
  consult_id: string;
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
      .eq('consult_id', consultationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Sauvegarder les constantes
   */
  static async saveConstantes(consultationId: string, patientId: string, data: Partial<ConsultationConstantes>, userId: string): Promise<void> {
    const clinicId = await getMyClinicId();
    
    const { error } = await supabase
      .from('consultation_constantes')
      .upsert({
        ...data,
        consult_id: consultationId,
        patient_id: patientId,
        clinic_id: clinicId,
        created_by: userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'consult_id' });

    if (error) throw error;
  }

  /**
   * Récupérer les demandes de labo
   */
  static async getLabRequests(consultationId: string): Promise<LabRequest[]> {
    const { data, error } = await supabase
      .from('lab_requests')
      .select('*')
      .eq('consultation_id', consultationId);

    if (error) throw error;
    return data || [];
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
    
    // 1. Créer la prescription
    const { data: prescription, error: prescError } = await supabase
      .from('prescriptions')
      .insert({
        consultation_id: consultationId,
        patient_id: patientId,
        clinic_id: clinicId,
        medecin_id: userId,
        created_by: userId
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

    return prescription;
  }
}

