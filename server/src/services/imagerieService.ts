/**
 * Service pour la gestion de l'imagerie médicale
 * Utilise Supabase pour les opérations de base de données
 */

import { supabase, supabaseAdmin } from '../config/supabase';

export interface CreateDemandeImagerieInput {
  patient_id: string;
  consultation_id?: string;
  medecin_id: string;
  clinic_id: string;
  type: 'INTERNE' | 'EXTERNE';
  examens: string[];
  priorite?: 'normale' | 'urgente' | 'critique';
  indication_clinique?: string;
  notes?: string;
}

export interface CreateExamenInput {
  demande_id: string;
  type_examen: string;
  modalite: string; // Radio, Echo, Scanner, IRM, etc.
  region_anatomique?: string;
  technicien_id?: string;
}

export interface CreateRapportInput {
  examen_id: string;
  contenu: string;
  conclusion: string;
  radiologue_id: string;
}

export class ImagerieService {
  private static getClient() {
    return supabaseAdmin || supabase;
  }

  /**
   * Liste des demandes d'imagerie
   */
  static async getDemandes(filters: {
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
      .from('imaging_requests')
      .select(`
        *,
        patient:patients(id, nom, prenoms, date_naissance, sexe, numero_dossier),
        medecin:users!imaging_requests_medecin_id_fkey(id, nom, prenom)
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
      demandes: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Récupère une demande par ID
   */
  static async getDemandeById(id: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('imaging_requests')
      .select(`
        *,
        patient:patients(id, nom, prenoms, date_naissance, sexe, numero_dossier, telephone),
        medecin:users!imaging_requests_medecin_id_fkey(id, nom, prenom, specialite),
        examens:imagerie_examens(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Demande non trouvée');

    return data;
  }

  /**
   * Crée une demande d'imagerie
   */
  static async createDemande(input: CreateDemandeImagerieInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    // Générer un numéro de demande
    const numero = `IMG-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await client
      .from('imaging_requests')
      .insert({
        numero,
        patient_id: input.patient_id,
        consultation_id: input.consultation_id,
        medecin_id: input.medecin_id,
        clinic_id: input.clinic_id,
        type: input.type,
        examens: input.examens,
        priorite: input.priorite || 'normale',
        indication_clinique: input.indication_clinique,
        notes: input.notes,
        status: 'en_attente',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Met à jour le statut d'une demande
   */
  static async updateDemandeStatus(id: string, status: string, notes?: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'realise') {
      updateData.date_realisation = new Date().toISOString();
    } else if (status === 'interprete') {
      updateData.date_interpretation = new Date().toISOString();
    }

    const { data, error } = await client
      .from('imaging_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Récupère les examens
   */
  static async getExamens(filters: {
    demande_id?: string;
    clinic_id?: string;
    status?: string;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    let query = client
      .from('imagerie_examens')
      .select(`
        *,
        demande:imaging_requests(
          id, numero, patient_id,
          patient:patients(id, nom, prenoms)
        )
      `);

    if (filters.demande_id) {
      query = query.eq('demande_id', filters.demande_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Récupère un examen par ID
   */
  static async getExamenById(id: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('imagerie_examens')
      .select(`
        *,
        demande:imaging_requests(
          id, numero, patient_id,
          patient:patients(id, nom, prenoms)
        ),
        images:imagerie_images(*),
        rapport:imagerie_rapports(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Crée un examen
   */
  static async createExamen(input: CreateExamenInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('imagerie_examens')
      .insert({
        ...input,
        status: 'en_cours',
        date_realisation: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Récupère les images d'un examen
   */
  static async getImages(examenId: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('imagerie_images')
      .select('*')
      .eq('examen_id', examenId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Ajoute une image à un examen
   */
  static async addImage(examenId: string, image: {
    url: string;
    nom_fichier: string;
    type_fichier: string;
    taille?: number;
    annotations?: any;
  }) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('imagerie_images')
      .insert({
        examen_id: examenId,
        ...image,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Crée un rapport d'interprétation
   */
  static async createRapport(input: CreateRapportInput) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('imagerie_rapports')
      .insert({
        ...input,
        date_interpretation: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Mettre à jour le statut de l'examen
    await client
      .from('imagerie_examens')
      .update({
        status: 'interprete',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.examen_id);

    return data;
  }

  /**
   * Récupère le catalogue des examens d'imagerie
   */
  static async getCatalogueExamens(clinicId?: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const { data, error } = await client
      .from('imagerie_catalogue_examens')
      .select('*')
      .order('modalite', { ascending: true })
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

  /**
   * Récupère les statistiques d'imagerie
   */
  static async getStats(clinicId: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase non configuré');

    const today = new Date().toISOString().split('T')[0];
    const startOfDay = `${today}T00:00:00`;
    const endOfDay = `${today}T23:59:59`;

    // Demandes du jour
    const { count: demandesJour } = await client
      .from('imaging_requests')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    // Demandes en attente
    const { count: enAttente } = await client
      .from('imaging_requests')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('status', 'en_attente');

    // Examens réalisés
    const { count: examensRealises } = await client
      .from('imagerie_examens')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'realise');

    return {
      demandes_jour: demandesJour || 0,
      demandes_en_attente: enAttente || 0,
      examens_realises: examensRealises || 0,
    };
  }
}

// Catalogue par défaut si la table n'existe pas
function getDefaultCatalogue() {
  return [
    { code: 'RX_THORAX', nom: 'Radiographie Thoracique', modalite: 'Radiographie', tarif: 15000 },
    { code: 'RX_ASP', nom: 'Abdomen Sans Préparation', modalite: 'Radiographie', tarif: 12000 },
    { code: 'RX_MEMBRE', nom: 'Radiographie Membre', modalite: 'Radiographie', tarif: 10000 },
    { code: 'ECHO_ABD', nom: 'Échographie Abdominale', modalite: 'Échographie', tarif: 25000 },
    { code: 'ECHO_PELV', nom: 'Échographie Pelvienne', modalite: 'Échographie', tarif: 25000 },
    { code: 'ECHO_OBS', nom: 'Échographie Obstétricale', modalite: 'Échographie', tarif: 20000 },
    { code: 'ECHO_CARD', nom: 'Échocardiographie', modalite: 'Échographie', tarif: 35000 },
    { code: 'SCAN_CRANE', nom: 'Scanner Cérébral', modalite: 'Scanner', tarif: 80000 },
    { code: 'SCAN_TAP', nom: 'Scanner Thoraco-Abdomino-Pelvien', modalite: 'Scanner', tarif: 120000 },
    { code: 'IRM_CRANE', nom: 'IRM Cérébrale', modalite: 'IRM', tarif: 150000 },
    { code: 'IRM_RACH', nom: 'IRM Rachis', modalite: 'IRM', tarif: 150000 },
    { code: 'ECG', nom: 'Électrocardiogramme', modalite: 'Cardiologie', tarif: 10000 },
  ];
}

export default ImagerieService;

