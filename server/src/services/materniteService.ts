/**
 * Service pour la gestion de la maternité
 * Utilise Supabase pour les opérations de base de données
 */

import { supabase, supabaseAdmin } from '../config/supabase';

export interface CreateDossierObstetricalInput {
  patient_id: string;
  clinic_id: string;
  date_derniere_regles?: string;
  date_prevue_accouchement?: string;
  gestite?: number;
  parite?: number;
  antecedents_obstetricaux?: any;
  conjoint?: any;
  sage_femme_id?: string;
}

export interface CreateCPNInput {
  dossier_id: string;
  patient_id: string;
  clinic_id: string;
  numero_cpn: number;
  trimestre: number;
  date_cpn: string;
  poids?: number;
  tension_arterielle?: string;
  hauteur_uterine?: number;
  presentation?: string;
  bruits_coeur_foetal?: string;
  mouvements_actifs?: boolean;
  examens_demandes?: string[];
  vaccinations?: any;
  traitements?: any;
  conseils?: string[];
  prochain_rdv?: string;
  sage_femme_id: string;
}

export interface CreateAccouchementInput {
  dossier_id: string;
  patient_id: string;
  clinic_id: string;
  date_accouchement: string;
  heure_accouchement: string;
  mode_accouchement: string;
  presentation: string;
  terme?: number;
  duree_travail?: string;
  complications?: string[];
  nouveau_ne?: any;
  equipe_medicale?: any;
  notes?: string;
}

export interface CreateSuiviPostPartumInput {
  accouchement_id: string;
  patient_id: string;
  clinic_id: string;
  date_visite: string;
  jour_post_partum: number;
  etat_general?: string;
  temperature?: number;
  tension_arterielle?: string;
  involution_uterine?: string;
  lochies?: string;
  cicatrice?: string;
  allaitement?: string;
  complications?: string[];
  nouveau_ne_etat?: any;
  conseils?: string[];
  prochain_rdv?: string;
  sage_femme_id: string;
}

export class MaterniteService {
  private static getClient() {
    return supabaseAdmin || supabase;
  }

  /**
   * Liste des dossiers obstétricaux
   */
  static async getDossiers(filters: {
    clinic_id?: string;
    patient_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = client
      .from('dossier_obstetrical')
      .select(`
        *,
        patient:patients(id, nom, prenoms, date_naissance, telephone, numero_dossier)
      `, { count: 'exact' });

    if (filters.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      dossiers: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Récupère un dossier obstétrical par ID
   */
  static async getDossierById(id: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('dossier_obstetrical')
      .select(`
        *,
        patient:patients(id, nom, prenoms, date_naissance, telephone, numero_dossier, adresse),
        consultations_prenatales:consultation_prenatale(*),
        accouchements:accouchement(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Dossier non trouvé');

    return data;
  }

  /**
   * Crée un dossier obstétrical
   */
  static async createDossier(input: CreateDossierObstetricalInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    // Calculer la date prévue d'accouchement si DDR fournie
    let dpa = input.date_prevue_accouchement;
    if (input.date_derniere_regles && !dpa) {
      const ddr = new Date(input.date_derniere_regles);
      const dpaDate = new Date(ddr);
      dpaDate.setDate(dpaDate.getDate() + 280); // 40 semaines
      dpa = dpaDate.toISOString().split('T')[0];
    }

    // Générer un numéro de dossier
    const numero = `MAT-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await client
      .from('dossier_obstetrical')
      .insert({
        numero,
        ...input,
        date_prevue_accouchement: dpa,
        status: 'en_cours',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Met à jour un dossier obstétrical
   */
  static async updateDossier(id: string, updateData: Partial<CreateDossierObstetricalInput>) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('dossier_obstetrical')
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
   * Liste des consultations prénatales
   */
  static async getCPNs(filters: {
    dossier_id?: string;
    patient_id?: string;
    clinic_id?: string;
    page?: number;
    limit?: number;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = client
      .from('consultation_prenatale')
      .select(`
        *,
        dossier:dossier_obstetrical(
          id, numero,
          patient:patients(id, nom, prenoms)
        )
      `, { count: 'exact' });

    if (filters.dossier_id) {
      query = query.eq('dossier_id', filters.dossier_id);
    }
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }
    if (filters.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }

    const { data, error, count } = await query
      .order('numero_cpn', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      cpns: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Récupère une CPN par ID
   */
  static async getCPNById(id: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('consultation_prenatale')
      .select(`
        *,
        dossier:dossier_obstetrical(
          id, numero, date_prevue_accouchement,
          patient:patients(id, nom, prenoms, date_naissance)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Crée une consultation prénatale
   */
  static async createCPN(input: CreateCPNInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('consultation_prenatale')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Met à jour une CPN
   */
  static async updateCPN(id: string, updateData: Partial<CreateCPNInput>) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('consultation_prenatale')
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
   * Liste des accouchements
   */
  static async getAccouchements(filters: {
    dossier_id?: string;
    patient_id?: string;
    clinic_id?: string;
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
      .from('accouchement')
      .select(`
        *,
        dossier:dossier_obstetrical(
          id, numero,
          patient:patients(id, nom, prenoms)
        ),
        nouveau_nes:nouveau_ne(*)
      `, { count: 'exact' });

    if (filters.dossier_id) {
      query = query.eq('dossier_id', filters.dossier_id);
    }
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }
    if (filters.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }
    if (filters.date_debut) {
      query = query.gte('date_accouchement', filters.date_debut);
    }
    if (filters.date_fin) {
      query = query.lte('date_accouchement', filters.date_fin);
    }

    const { data, error, count } = await query
      .order('date_accouchement', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      accouchements: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Récupère un accouchement par ID
   */
  static async getAccouchementById(id: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('accouchement')
      .select(`
        *,
        dossier:dossier_obstetrical(
          id, numero, gestite, parite,
          patient:patients(id, nom, prenoms, date_naissance)
        ),
        nouveau_nes:nouveau_ne(*),
        suivi_post_partum:surveillance_post_partum(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Enregistre un accouchement
   */
  static async createAccouchement(input: CreateAccouchementInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    // Générer un numéro d'accouchement
    const numero = `ACC-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await client
      .from('accouchement')
      .insert({
        numero,
        ...input,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Mettre à jour le statut du dossier
    await client
      .from('dossier_obstetrical')
      .update({
        status: 'accouchee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.dossier_id);

    return data;
  }

  /**
   * Liste des suivis post-partum
   */
  static async getSuiviPostPartum(filters: {
    accouchement_id?: string;
    patient_id?: string;
    clinic_id?: string;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    let query = client
      .from('surveillance_post_partum')
      .select('*');

    if (filters.accouchement_id) {
      query = query.eq('accouchement_id', filters.accouchement_id);
    }
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }
    if (filters.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }

    const { data, error } = await query.order('date_visite', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Crée un suivi post-partum
   */
  static async createSuiviPostPartum(input: CreateSuiviPostPartumInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('surveillance_post_partum')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Récupère les statistiques de la maternité
   */
  static async getStats(clinicId: string, dateDebut?: string, dateFin?: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    // Dossiers en cours
    const { count: dossiersEnCours } = await client
      .from('dossier_obstetrical')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('status', 'en_cours');

    // Accouchements du mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let accouchementsQuery = client
      .from('accouchement')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);

    if (dateDebut) {
      accouchementsQuery = accouchementsQuery.gte('date_accouchement', dateDebut);
    } else {
      accouchementsQuery = accouchementsQuery.gte('date_accouchement', startOfMonth.toISOString());
    }
    if (dateFin) {
      accouchementsQuery = accouchementsQuery.lte('date_accouchement', dateFin);
    }

    const { count: accouchementsMois } = await accouchementsQuery;

    // CPNs du mois
    let cpnsQuery = client
      .from('consultation_prenatale')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);

    if (dateDebut) {
      cpnsQuery = cpnsQuery.gte('date_cpn', dateDebut);
    } else {
      cpnsQuery = cpnsQuery.gte('date_cpn', startOfMonth.toISOString());
    }
    if (dateFin) {
      cpnsQuery = cpnsQuery.lte('date_cpn', dateFin);
    }

    const { count: cpnsMois } = await cpnsQuery;

    return {
      dossiers_en_cours: dossiersEnCours || 0,
      accouchements_mois: accouchementsMois || 0,
      cpns_mois: cpnsMois || 0,
    };
  }
}

export default MaterniteService;

