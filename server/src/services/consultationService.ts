/**
 * Service pour la gestion des consultations
 * Utilise Supabase pour les opérations de base de données
 */

import { supabase, supabaseAdmin } from '../config/supabase';

export interface CreateConsultationInput {
  patient_id: string;
  medecin_id: string;
  clinic_id: string;
  motif?: string;
  type_consultation?: string;
  rendez_vous_id?: string;
  urgence?: boolean;
}

export interface ConstantesInput {
  consultation_id: string;
  poids?: number;
  taille?: number;
  temperature?: number;
  tension_systolique?: number;
  tension_diastolique?: number;
  frequence_cardiaque?: number;
  frequence_respiratoire?: number;
  saturation_o2?: number;
  glycemie?: number;
  imc?: number;
}

export interface ProtocolInput {
  consultation_id: string;
  type_protocol: string;
  titre: string;
  contenu: any;
  facturable?: boolean;
  montant?: number;
}

export class ConsultationService {
  private static getClient() {
    return supabaseAdmin || supabase;
  }

  /**
   * Liste des consultations avec filtres
   */
  static async getConsultations(filters: {
    clinic_id?: string;
    patient_id?: string;
    medecin_id?: string;
    status?: string;
    date_debut?: string;
    date_fin?: string;
    page?: number;
    limit?: number;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = client
      .from('consultations')
      .select(`
        *,
        patient:patients(id, nom, prenoms, date_naissance, sexe, numero_dossier),
        medecin:users!consultations_medecin_id_fkey(id, nom, prenom, role)
      `, { count: 'exact' });

    if (filters.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }
    if (filters.medecin_id) {
      query = query.eq('medecin_id', filters.medecin_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.date_debut) {
      query = query.gte('date_consultation', filters.date_debut);
    }
    if (filters.date_fin) {
      query = query.lte('date_consultation', filters.date_fin);
    }

    const { data, error, count } = await query
      .order('date_consultation', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      consultations: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Récupère une consultation par ID
   */
  static async getConsultationById(id: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('consultations')
      .select(`
        *,
        patient:patients(id, nom, prenoms, date_naissance, sexe, numero_dossier, telephone),
        medecin:users!consultations_medecin_id_fkey(id, nom, prenom, role, specialite)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Consultation non trouvée');

    return data;
  }

  /**
   * Crée une nouvelle consultation
   */
  static async createConsultation(input: CreateConsultationInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('consultations')
      .insert({
        ...input,
        status: 'en_cours',
        date_consultation: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Met à jour une consultation
   */
  static async updateConsultation(id: string, updateData: Partial<CreateConsultationInput & { status: string }>) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('consultations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Récupère les constantes d'une consultation
   */
  static async getConstantes(consultationId: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('consultation_constantes')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Sauvegarde les constantes
   */
  static async saveConstantes(input: ConstantesInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    // Calculer l'IMC si poids et taille sont fournis
    let imc = input.imc;
    if (input.poids && input.taille && input.taille > 0) {
      const tailleM = input.taille / 100;
      imc = Math.round((input.poids / (tailleM * tailleM)) * 10) / 10;
    }

    const { data, error } = await client
      .from('consultation_constantes')
      .upsert({
        ...input,
        imc,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'consultation_id',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Récupère l'historique (entries) d'une consultation
   */
  static async getEntries(consultationId: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('consultation_entries')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Ajoute une entrée à l'historique
   */
  static async addEntry(consultationId: string, entry: {
    type: string;
    contenu: any;
    auteur_id: string;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('consultation_entries')
      .insert({
        consultation_id: consultationId,
        ...entry,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Récupère les protocoles d'une consultation
   */
  static async getProtocols(consultationId: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('protocols')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Récupère un protocole par ID
   */
  static async getProtocolById(id: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('protocols')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Crée un protocole
   */
  static async createProtocol(input: ProtocolInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('protocols')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Récupère les prescriptions
   */
  static async getPrescriptions(filters: {
    consultation_id?: string;
    patient_id?: string;
    clinic_id?: string;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    let query = client
      .from('prescriptions')
      .select(`
        *,
        lines:prescription_lines(*)
      `);

    if (filters.consultation_id) {
      query = query.eq('consultation_id', filters.consultation_id);
    }
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }
    if (filters.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Récupère une prescription par ID
   */
  static async getPrescriptionById(id: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('prescriptions')
      .select(`
        *,
        lines:prescription_lines(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Crée une prescription
   */
  static async createPrescription(prescription: {
    consultation_id: string;
    patient_id: string;
    medecin_id: string;
    clinic_id: string;
    lines: Array<{
      medicament_id?: string;
      nom_medicament: string;
      dosage: string;
      frequence: string;
      duree: string;
      quantite: number;
      instructions?: string;
    }>;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    // Créer la prescription
    const { data: prescriptionData, error: prescriptionError } = await client
      .from('prescriptions')
      .insert({
        consultation_id: prescription.consultation_id,
        patient_id: prescription.patient_id,
        medecin_id: prescription.medecin_id,
        clinic_id: prescription.clinic_id,
        status: 'en_attente',
      })
      .select()
      .single();

    if (prescriptionError) throw new Error(prescriptionError.message);

    // Créer les lignes de prescription
    if (prescription.lines && prescription.lines.length > 0) {
      const lines = prescription.lines.map(line => ({
        ...line,
        prescription_id: prescriptionData.id,
      }));

      const { error: linesError } = await client
        .from('prescription_lines')
        .insert(lines);

      if (linesError) throw new Error(linesError.message);
    }

    return prescriptionData;
  }

  /**
   * Récupère les demandes de laboratoire
   */
  static async getLabRequests(filters: {
    consultation_id?: string;
    patient_id?: string;
    clinic_id?: string;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    let query = client
      .from('lab_requests')
      .select('*');

    if (filters.consultation_id) {
      query = query.eq('consultation_id', filters.consultation_id);
    }
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }
    if (filters.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Crée une demande de laboratoire
   */
  static async createLabRequest(request: {
    consultation_id: string;
    patient_id: string;
    medecin_id: string;
    clinic_id: string;
    type: 'INTERNE' | 'EXTERNE';
    analyses: string[];
    priorite?: string;
    notes?: string;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('lab_requests')
      .insert({
        ...request,
        status: 'en_attente',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Récupère les demandes d'imagerie
   */
  static async getImagingRequests(filters: {
    consultation_id?: string;
    patient_id?: string;
    clinic_id?: string;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    let query = client
      .from('imaging_requests')
      .select('*');

    if (filters.consultation_id) {
      query = query.eq('consultation_id', filters.consultation_id);
    }
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }
    if (filters.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Crée une demande d'imagerie
   */
  static async createImagingRequest(request: {
    consultation_id: string;
    patient_id: string;
    medecin_id: string;
    clinic_id: string;
    type: 'INTERNE' | 'EXTERNE';
    examens: string[];
    priorite?: string;
    notes?: string;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('imaging_requests')
      .insert({
        ...request,
        status: 'en_attente',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Récupère les statistiques
   */
  static async getStats(clinicId: string, dateDebut?: string, dateFin?: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    let query = client
      .from('consultations')
      .select('id, status, date_consultation', { count: 'exact' })
      .eq('clinic_id', clinicId);

    if (dateDebut) {
      query = query.gte('date_consultation', dateDebut);
    }
    if (dateFin) {
      query = query.lte('date_consultation', dateFin);
    }

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    // Calculer les statistiques
    const total = count || 0;
    const enCours = data?.filter(c => c.status === 'en_cours').length || 0;
    const terminees = data?.filter(c => c.status === 'terminee').length || 0;
    const annulees = data?.filter(c => c.status === 'annulee').length || 0;

    return {
      total,
      en_cours: enCours,
      terminees,
      annulees,
    };
  }

  /**
   * Clôture une consultation
   */
  static async closeConsultation(id: string, conclusion?: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('consultations')
      .update({
        status: 'terminee',
        conclusion,
        date_cloture: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

export default ConsultationService;

