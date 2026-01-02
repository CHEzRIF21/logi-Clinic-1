/**
 * Service pour la gestion du laboratoire
 * Utilise Supabase pour les opérations de base de données
 */

import { supabase, supabaseAdmin } from '../config/supabase';

export interface CreatePrescriptionLaboInput {
  patient_id: string;
  consultation_id?: string;
  medecin_id: string;
  clinic_id: string;
  analyses: string[];
  priorite?: 'normale' | 'urgente' | 'critique';
  notes_cliniques?: string;
}

export interface CreateAnalyseInput {
  prescription_id: string;
  code_analyse: string;
  nom_analyse: string;
  categorie?: string;
  tarif?: number;
}

export interface ResultatInput {
  analyse_id: string;
  valeur: string;
  unite?: string;
  valeur_reference_min?: number;
  valeur_reference_max?: number;
  interpretation?: string;
  validateur_id: string;
}

export class LaboratoireService {
  private static getClient() {
    return supabaseAdmin || supabase;
  }

  /**
   * Liste des prescriptions de laboratoire
   */
  static async getPrescriptions(filters: {
    clinic_id?: string;
    patient_id?: string;
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
      .from('lab_prescriptions')
      .select(`
        *,
        patient:patients(id, nom, prenoms, date_naissance, sexe, numero_dossier),
        medecin:users!lab_prescriptions_medecin_id_fkey(id, nom, prenom),
        analyses:lab_prescriptions_analyses(*)
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
    if (filters.date_debut) {
      query = query.gte('created_at', filters.date_debut);
    }
    if (filters.date_fin) {
      query = query.lte('created_at', filters.date_fin);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      prescriptions: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Récupère une prescription par ID
   */
  static async getPrescriptionById(id: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('lab_prescriptions')
      .select(`
        *,
        patient:patients(id, nom, prenoms, date_naissance, sexe, numero_dossier, telephone),
        medecin:users!lab_prescriptions_medecin_id_fkey(id, nom, prenom, specialite),
        analyses:lab_prescriptions_analyses(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Prescription non trouvée');

    return data;
  }

  /**
   * Crée une prescription de laboratoire
   */
  static async createPrescription(input: CreatePrescriptionLaboInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    // Générer un numéro de prescription
    const numero = `LAB-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await client
      .from('lab_prescriptions')
      .insert({
        numero,
        patient_id: input.patient_id,
        consultation_id: input.consultation_id,
        medecin_id: input.medecin_id,
        clinic_id: input.clinic_id,
        priorite: input.priorite || 'normale',
        notes_cliniques: input.notes_cliniques,
        status: 'en_attente',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Créer les analyses associées
    if (input.analyses && input.analyses.length > 0) {
      const analysesToInsert = input.analyses.map(analyseCode => ({
        prescription_id: data.id,
        code_analyse: analyseCode,
        nom_analyse: analyseCode, // À enrichir avec le catalogue
        status: 'en_attente',
      }));

      const { error: analysesError } = await client
        .from('lab_prescriptions_analyses')
        .insert(analysesToInsert);

      if (analysesError) {
        console.error('Erreur création analyses:', analysesError);
      }
    }

    return data;
  }

  /**
   * Met à jour le statut d'une prescription
   */
  static async updatePrescriptionStatus(id: string, status: string, notes?: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'prelevement_effectue') {
      updateData.date_prelevement = new Date().toISOString();
    } else if (status === 'validee') {
      updateData.date_validation = new Date().toISOString();
    }

    const { data, error } = await client
      .from('lab_prescriptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Récupère les analyses
   */
  static async getAnalyses(filters: {
    prescription_id?: string;
    clinic_id?: string;
    status?: string;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    let query = client
      .from('lab_prescriptions_analyses')
      .select(`
        *,
        prescription:lab_prescriptions(
          id, numero, patient_id, 
          patient:patients(id, nom, prenoms)
        )
      `);

    if (filters.prescription_id) {
      query = query.eq('prescription_id', filters.prescription_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Crée une analyse
   */
  static async createAnalyse(input: CreateAnalyseInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('lab_prescriptions_analyses')
      .insert({
        ...input,
        status: 'en_attente',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Récupère les résultats
   */
  static async getResultats(filters: {
    analyse_id?: string;
    prescription_id?: string;
    patient_id?: string;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    let query = client
      .from('lab_resultats_consultation')
      .select('*');

    if (filters.analyse_id) {
      query = query.eq('analyse_id', filters.analyse_id);
    }
    if (filters.prescription_id) {
      query = query.eq('prescription_id', filters.prescription_id);
    }
    if (filters.patient_id) {
      query = query.eq('patient_id', filters.patient_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Valide un résultat
   */
  static async validerResultat(input: ResultatInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    // Mettre à jour l'analyse
    const { error: analyseError } = await client
      .from('lab_prescriptions_analyses')
      .update({
        valeur: input.valeur,
        unite: input.unite,
        valeur_reference_min: input.valeur_reference_min,
        valeur_reference_max: input.valeur_reference_max,
        interpretation: input.interpretation,
        status: 'validee',
        validateur_id: input.validateur_id,
        date_validation: new Date().toISOString(),
      })
      .eq('id', input.analyse_id);

    if (analyseError) throw new Error(analyseError.message);

    // Récupérer l'analyse mise à jour
    const { data, error } = await client
      .from('lab_prescriptions_analyses')
      .select('*')
      .eq('id', input.analyse_id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Récupère les informations d'intégration
   */
  static async getIntegrations(clinicId: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    // Récupérer les KPI du laboratoire
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = `${today}T00:00:00`;
    const endOfDay = `${today}T23:59:59`;

    // Compter les prescriptions du jour
    const { count: prescriptionsToday } = await client
      .from('lab_prescriptions')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    // Compter les prescriptions en attente
    const { count: enAttente } = await client
      .from('lab_prescriptions')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('status', 'en_attente');

    // Compter les analyses validées
    const { count: analysesValidees } = await client
      .from('lab_prescriptions_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'validee');

    return {
      prescriptions_jour: prescriptionsToday || 0,
      prescriptions_en_attente: enAttente || 0,
      analyses_validees: analysesValidees || 0,
      connexions: [
        { module: 'Consultation', status: 'actif', description: 'Prescriptions électroniques' },
        { module: 'Maternité', status: 'actif', description: 'Bilans prénataux' },
        { module: 'Caisse', status: 'actif', description: 'Facturation automatique' },
        { module: 'Stock', status: 'actif', description: 'Déstockage réactifs' },
      ],
    };
  }

  /**
   * Récupère le catalogue des analyses
   */
  static async getCatalogueAnalyses(clinicId?: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('lab_catalogue_analyses')
      .select('*')
      .order('categorie', { ascending: true })
      .order('nom', { ascending: true });

    if (error) {
      // Si la table n'existe pas, retourner un catalogue par défaut
      if (error.code === '42P01') {
        return getDefaultCatalogue();
      }
      throw new Error(error.message);
    }

    return data || getDefaultCatalogue();
  }
}

// Catalogue par défaut si la table n'existe pas
function getDefaultCatalogue() {
  return [
    { code: 'NFS', nom: 'Numération Formule Sanguine', categorie: 'Hématologie', tarif: 5000 },
    { code: 'GS', nom: 'Groupe Sanguin', categorie: 'Hématologie', tarif: 3000 },
    { code: 'GLY', nom: 'Glycémie', categorie: 'Biochimie', tarif: 2000 },
    { code: 'CREAT', nom: 'Créatininémie', categorie: 'Biochimie', tarif: 3000 },
    { code: 'UREE', nom: 'Urée', categorie: 'Biochimie', tarif: 2500 },
    { code: 'TGO', nom: 'Transaminases TGO', categorie: 'Biochimie', tarif: 3500 },
    { code: 'TGP', nom: 'Transaminases TGP', categorie: 'Biochimie', tarif: 3500 },
    { code: 'VIH', nom: 'Sérologie VIH', categorie: 'Sérologie', tarif: 5000 },
    { code: 'SYPH', nom: 'Sérologie Syphilis', categorie: 'Sérologie', tarif: 4000 },
    { code: 'PALU', nom: 'Goutte Épaisse / TDR Paludisme', categorie: 'Parasitologie', tarif: 2000 },
    { code: 'ECBU', nom: 'Examen Cytobactériologique Urines', categorie: 'Bactériologie', tarif: 6000 },
    { code: 'CRP', nom: 'Protéine C Réactive', categorie: 'Biochimie', tarif: 4000 },
  ];
}

export default LaboratoireService;

