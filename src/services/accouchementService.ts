import { supabase } from './supabase';

// ========== TYPES ==========

export interface Accouchement {
  id?: string;
  dossier_obstetrical_id: string;
  date_accouchement: string;
  heure_debut_travail?: string;
  heure_accouchement: string;
  duree_travail?: number;
  type_accouchement?: 'Voie basse' | 'Césarienne' | 'Forceps' | 'Ventouse' | 'Autre';
  presentation?: 'Céphalique' | 'Siège' | 'Transverse' | 'Autre';
  issue_grossesse?: 'Vivant' | 'Mort-né' | 'Mort in utero';
  nombre_enfants?: number;
  complications?: string;
  hemorragie?: boolean;
  volume_hemorragie?: number;
  type_anesthesie?: string;
  ocytociques?: boolean;
  heure_ocytociques?: string;
  sage_femme_id?: string;
  medecin_id?: string;
  statut?: 'en_cours' | 'termine' | 'complique';
  observations?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  // Relations
  delivrance?: Delivrance;
  examen_placenta?: ExamenPlacenta;
  nouveau_nes?: NouveauNe[];
  sensibilisation?: SensibilisationMere;
  references?: ReferenceTransfert[];
}

export interface Delivrance {
  id?: string;
  accouchement_id: string;
  heure_delivrance: string;
  duree_delivrance?: number;
  perte_sang: number;
  placenta_complet?: boolean;
  anomalies_placenta?: string;
  cordon_normal?: boolean;
  anomalies_cordon?: string;
  membranes_completes?: boolean;
  membranes_dechirures?: boolean;
  episiotomie?: boolean;
  dechirures_perineales?: boolean;
  degre_dechirure?: number;
  reparation_perineale?: boolean;
  observations?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExamenPlacenta {
  id?: string;
  accouchement_id: string;
  heure_delivrance?: string;
  longueur_cordon?: number;
  lli_hln?: string;
  presence_anomalies?: boolean;
  culs_de_sac?: boolean;
  caillots?: boolean;
  description_anomalies?: string;
  parite?: number;
  photo_url?: string;
  observations?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NouveauNe {
  id?: string;
  accouchement_id: string;
  numero_ordre?: number;
  sexe: 'Masculin' | 'Féminin' | 'Indéterminé';
  rang_naissance?: number;
  poids: number;
  taille?: number;
  perimetre_cranien?: number;
  // Scores Apgar (calculés automatiquement)
  apgar_1min?: number;
  apgar_5min?: number;
  apgar_10min?: number;
  // Détails Apgar 1 min
  apgar_respiration_1min?: number;
  apgar_frequence_cardiaque_1min?: number;
  apgar_tonus_1min?: number;
  apgar_reflexe_1min?: number;
  apgar_coloration_1min?: number;
  // Détails Apgar 5 min
  apgar_respiration_5min?: number;
  apgar_frequence_cardiaque_5min?: number;
  apgar_tonus_5min?: number;
  apgar_reflexe_5min?: number;
  apgar_coloration_5min?: number;
  // Détails Apgar 10 min
  apgar_respiration_10min?: number;
  apgar_frequence_cardiaque_10min?: number;
  apgar_tonus_10min?: number;
  apgar_reflexe_10min?: number;
  apgar_coloration_10min?: number;
  // Clinique
  temperature?: number;
  etat_clinique_normal?: boolean;
  // Signes de danger
  difficulte_respirer?: boolean;
  coloration_anormale?: boolean;
  convulsions?: boolean;
  absence_cri?: boolean;
  autres_signes_danger?: string;
  // Réanimation
  reanimation_necessaire?: boolean;
  ventilation_masque?: boolean;
  oxygene?: boolean;
  aspiration?: boolean;
  massage_cardiaque?: boolean;
  autres_procedures?: string;
  // Issue
  etat_naissance?: 'Vivant' | 'Mort-né' | 'Décédé post-natal';
  observations?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  soins_immediats?: SoinsImmediats;
  carte_infantile?: CarteInfantile;
}

export interface SoinsImmediats {
  id?: string;
  nouveau_ne_id: string;
  sechage?: boolean;
  heure_sechage?: string;
  rechauffement?: boolean;
  heure_rechauffement?: string;
  contact_peau_a_peau?: boolean;
  heure_contact_peau_a_peau?: string;
  duree_contact_peau_a_peau?: number;
  allaitement_precoce?: boolean;
  heure_allaitement_precoce?: string;
  prophylaxie_oculaire?: boolean;
  produit_prophylaxie_oculaire?: string;
  heure_prophylaxie_oculaire?: string;
  antiretroviral_arv?: boolean;
  type_arv?: string;
  dose_arv?: string;
  heure_arv?: string;
  vitamine_k1?: boolean;
  dose_vitamine_k1?: string;
  voie_vitamine_k1?: 'IM' | 'Orale' | 'IV';
  heure_vitamine_k1?: string;
  pesee?: boolean;
  chapelet_identification?: boolean;
  numero_chapelet?: string;
  soins_cordon?: boolean;
  antiseptique_cordon?: string;
  heure_soins_cordon?: string;
  observations?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CarteInfantile {
  id?: string;
  nouveau_ne_id: string;
  carte_remplie?: boolean;
  date_remplissage?: string;
  vitamine_a_administree?: boolean;
  age_vitamine_a?: '6 mois' | '1 an' | '3 ans';
  date_vitamine_a?: string;
  pf_discute?: boolean;
  date_discussion_pf?: string;
  bcg?: boolean;
  date_bcg?: string;
  heure_bcg?: string;
  polio_0?: boolean;
  date_polio_0?: string;
  heure_polio_0?: string;
  acceptation_mere?: boolean;
  acceptation_pere?: boolean;
  observations?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SensibilisationMere {
  id?: string;
  accouchement_id: string;
  quantite_sang?: boolean;
  date_quantite_sang?: string;
  agent_quantite_sang?: string;
  hemorragie?: boolean;
  date_hemorragie?: string;
  agent_hemorragie?: string;
  massage_uterin?: boolean;
  date_massage_uterin?: string;
  agent_massage_uterin?: string;
  traction_controlee?: boolean;
  date_traction_controlee?: string;
  agent_traction_controlee?: string;
  ocytociques_10min?: boolean;
  date_ocytociques_10min?: string;
  agent_ocytociques_10min?: string;
  assistance?: boolean;
  type_assistance?: string;
  date_assistance?: string;
  agent_assistance?: string;
  anthelminthique?: boolean;
  date_anthelminthique?: string;
  agent_anthelminthique?: string;
  nutrition?: boolean;
  date_nutrition?: string;
  agent_nutrition?: string;
  observations?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReferenceTransfert {
  id?: string;
  accouchement_id?: string;
  nouveau_ne_id?: string;
  reference_necessaire?: boolean;
  motif?: string;
  heure_transfert?: string;
  structure_reference?: string;
  moyen_transfert?: string;
  agent_transfert?: string;
  signature_agent?: string;
  statut_transfert?: 'En attente' | 'En cours' | 'Arrivé' | 'Refusé';
  retour_information?: string;
  created_at?: string;
  updated_at?: string;
}

// ========== SERVICE ==========

export class AccouchementService {
  
  // ========== ACCOUCHEMENT ==========
  
  static async getAccouchement(id: string): Promise<Accouchement | null> {
    try {
      const { data, error } = await supabase
        .from('accouchement')
        .select(`
          *,
          delivrance (*),
          examen_placenta (*),
          nouveau_nes:nouveau_ne (
            *,
            soins_immediats (*),
            carte_infantile (*)
          ),
          sensibilisation:sensibilisation_mere (*),
          references:reference_transfert (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as Accouchement;
    } catch (error) {
      console.error('Erreur getAccouchement:', error);
      throw error;
    }
  }

  static async getAllAccouchements(dossierId?: string): Promise<Accouchement[]> {
    try {
      let query = supabase
        .from('accouchement')
        .select(`
          *,
          delivrance (*),
          examen_placenta (*),
          nouveau_nes:nouveau_ne (
            *,
            soins_immediats (*),
            carte_infantile (*)
          ),
          sensibilisation:sensibilisation_mere (*),
          references:reference_transfert (*)
        `)
        .order('date_accouchement', { ascending: false });

      if (dossierId) {
        query = query.eq('dossier_obstetrical_id', dossierId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Accouchement[];
    } catch (error) {
      console.error('Erreur getAllAccouchements:', error);
      throw error;
    }
  }

  static async createAccouchement(accouchement: Accouchement): Promise<Accouchement> {
    try {
      const { delivrance, examen_placenta, nouveau_nes, sensibilisation, references, ...accData } = accouchement;

      const { data: created, error } = await supabase
        .from('accouchement')
        .insert([accData])
        .select()
        .single();

      if (error) throw error;

      // Créer la délivrance si présente
      if (delivrance && created.id) {
        await this.saveDelivrance({ ...delivrance, accouchement_id: created.id });
      }

      // Créer l'examen du placenta si présent
      if (examen_placenta && created.id) {
        await this.saveExamenPlacenta({ ...examen_placenta, accouchement_id: created.id });
      }

      // Créer les nouveau-nés si présents
      if (nouveau_nes && nouveau_nes.length > 0 && created.id) {
        for (const nn of nouveau_nes) {
          await this.createNouveauNe({ ...nn, accouchement_id: created.id });
        }
      }

      // Créer la sensibilisation si présente
      if (sensibilisation && created.id) {
        await this.saveSensibilisationMere({ ...sensibilisation, accouchement_id: created.id });
      }

      return await this.getAccouchement(created.id) || created;
    } catch (error) {
      console.error('Erreur createAccouchement:', error);
      throw error;
    }
  }

  static async updateAccouchement(id: string, accouchement: Partial<Accouchement>): Promise<Accouchement> {
    try {
      const { delivrance, examen_placenta, nouveau_nes, sensibilisation, references, ...accData } = accouchement;

      const { data: updated, error } = await supabase
        .from('accouchement')
        .update(accData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return await this.getAccouchement(id) || updated;
    } catch (error) {
      console.error('Erreur updateAccouchement:', error);
      throw error;
    }
  }

  static async deleteAccouchement(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('accouchement')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur deleteAccouchement:', error);
      throw error;
    }
  }

  // ========== DÉLIVRANCE ==========

  static async saveDelivrance(delivrance: Delivrance): Promise<Delivrance> {
    try {
      if (delivrance.id) {
        const { data, error } = await supabase
          .from('delivrance')
          .update(delivrance)
          .eq('id', delivrance.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('delivrance')
          .insert([delivrance])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erreur saveDelivrance:', error);
      throw error;
    }
  }

  // ========== EXAMEN PLACENTA ==========

  static async saveExamenPlacenta(examen: ExamenPlacenta): Promise<ExamenPlacenta> {
    try {
      if (examen.id) {
        const { data, error } = await supabase
          .from('examen_placenta')
          .update(examen)
          .eq('id', examen.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('examen_placenta')
          .insert([examen])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erreur saveExamenPlacenta:', error);
      throw error;
    }
  }

  // ========== NOUVEAU-NÉ ==========

  static async createNouveauNe(nouveauNe: NouveauNe): Promise<NouveauNe> {
    try {
      const { soins_immediats, carte_infantile, ...nnData } = nouveauNe;

      const { data: created, error } = await supabase
        .from('nouveau_ne')
        .insert([nnData])
        .select()
        .single();

      if (error) throw error;

      // Créer les soins immédiats si présents
      if (soins_immediats && created.id) {
        await this.saveSoinsImmediats({ ...soins_immediats, nouveau_ne_id: created.id });
      }

      // Créer la carte infantile si présente
      if (carte_infantile && created.id) {
        await this.saveCarteInfantile({ ...carte_infantile, nouveau_ne_id: created.id });
      }

      return created;
    } catch (error) {
      console.error('Erreur createNouveauNe:', error);
      throw error;
    }
  }

  static async updateNouveauNe(id: string, nouveauNe: Partial<NouveauNe>): Promise<NouveauNe> {
    try {
      const { soins_immediats, carte_infantile, ...nnData } = nouveauNe;

      const { data: updated, error } = await supabase
        .from('nouveau_ne')
        .update(nnData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (error) {
      console.error('Erreur updateNouveauNe:', error);
      throw error;
    }
  }

  // ========== SOINS IMMÉDIATS ==========

  static async saveSoinsImmediats(soins: SoinsImmediats): Promise<SoinsImmediats> {
    try {
      if (soins.id) {
        const { data, error } = await supabase
          .from('soins_immediats')
          .update(soins)
          .eq('id', soins.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('soins_immediats')
          .insert([soins])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erreur saveSoinsImmediats:', error);
      throw error;
    }
  }

  // ========== CARTE INFANTILE ==========

  static async saveCarteInfantile(carte: CarteInfantile): Promise<CarteInfantile> {
    try {
      if (carte.id) {
        const { data, error } = await supabase
          .from('carte_infantile')
          .update(carte)
          .eq('id', carte.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('carte_infantile')
          .insert([carte])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erreur saveCarteInfantile:', error);
      throw error;
    }
  }

  // ========== SENSIBILISATION MÈRE ==========

  static async saveSensibilisationMere(sensibilisation: SensibilisationMere): Promise<SensibilisationMere> {
    try {
      if (sensibilisation.id) {
        const { data, error } = await supabase
          .from('sensibilisation_mere')
          .update(sensibilisation)
          .eq('id', sensibilisation.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('sensibilisation_mere')
          .insert([sensibilisation])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erreur saveSensibilisationMere:', error);
      throw error;
    }
  }

  // ========== RÉFÉRENCE/TRANSFERT ==========

  static async saveReferenceTransfert(reference: ReferenceTransfert): Promise<ReferenceTransfert> {
    try {
      if (reference.id) {
        const { data, error } = await supabase
          .from('reference_transfert')
          .update(reference)
          .eq('id', reference.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('reference_transfert')
          .insert([reference])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erreur saveReferenceTransfert:', error);
      throw error;
    }
  }

  // ========== FONCTIONS UTILITAIRES ==========

  // Calculer le score Apgar
  static calculerApgar(
    respiration: number,
    frequenceCardiaque: number,
    tonus: number,
    reflexe: number,
    coloration: number
  ): number {
    return (respiration || 0) + (frequenceCardiaque || 0) + (tonus || 0) + (reflexe || 0) + (coloration || 0);
  }

  // Interpréter le score Apgar
  static interpreterApgar(score: number): { niveau: string; interpretation: string; couleur: string } {
    if (score >= 7 && score <= 10) {
      return {
        niveau: 'Normal',
        interpretation: 'Bonne adaptation à la vie extra-utérine',
        couleur: 'success',
      };
    } else if (score >= 4 && score <= 6) {
      return {
        niveau: 'Modéré',
        interpretation: 'Adaptation modérée, surveillance nécessaire',
        couleur: 'warning',
      };
    } else {
      return {
        niveau: 'Critique',
        interpretation: 'Adaptation difficile, réanimation urgente',
        couleur: 'error',
      };
    }
  }

  // ========== STATISTIQUES ==========

  static async getStatistiques(dateDebut?: string, dateFin?: string) {
    try {
      let query = supabase.from('accouchement').select('*');

      if (dateDebut && dateFin) {
        query = query.gte('date_accouchement', dateDebut).lte('date_accouchement', dateFin);
      }

      const { data: accouchements, error } = await query;
      if (error) throw error;

      // Récupérer les nouveau-nés
      const { data: nouveauNes } = await supabase
        .from('nouveau_ne')
        .select('*');

      // Récupérer les délivrances
      const { data: delivrances } = await supabase
        .from('delivrance')
        .select('*');

      return {
        total_accouchements: accouchements?.length || 0,
        par_type: {
          voie_basse: accouchements?.filter(a => a.type_accouchement === 'Voie basse').length || 0,
          cesarienne: accouchements?.filter(a => a.type_accouchement === 'Césarienne').length || 0,
          forceps: accouchements?.filter(a => a.type_accouchement === 'Forceps').length || 0,
          ventouse: accouchements?.filter(a => a.type_accouchement === 'Ventouse').length || 0,
        },
        naissances: {
          vivantes: nouveauNes?.filter(n => n.etat_naissance === 'Vivant').length || 0,
          morts_nes: nouveauNes?.filter(n => n.etat_naissance === 'Mort-né').length || 0,
        },
        complications: {
          hemorragies: accouchements?.filter(a => a.hemorragie === true).length || 0,
          episiotomies: delivrances?.filter(d => d.episiotomie === true).length || 0,
          dechirures: delivrances?.filter(d => d.dechirures_perineales === true).length || 0,
        },
        apgar_moyen: {
          une_min: nouveauNes?.reduce((acc, n) => acc + (n.apgar_1min || 0), 0) / (nouveauNes?.length || 1),
          cinq_min: nouveauNes?.reduce((acc, n) => acc + (n.apgar_5min || 0), 0) / (nouveauNes?.length || 1),
        },
        reanimations: nouveauNes?.filter(n => n.reanimation_necessaire === true).length || 0,
      };
    } catch (error) {
      console.error('Erreur getStatistiques:', error);
      throw error;
    }
  }
}

