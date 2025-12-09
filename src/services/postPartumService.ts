import { supabase } from './supabase';

// ========== TYPES ==========

export interface SurveillancePostPartum {
  id?: string;
  accouchement_id: string;
  date_debut_surveillance?: string;
  date_fin_surveillance?: string;
  duree_surveillance?: number;
  statut?: 'en_cours' | 'termine' | 'complication' | 'transfere';
  agent_responsable?: string;
  agent_id?: string;
  observations?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  observations_list?: ObservationPostPartum[];
  traitements?: TraitementPostPartum[];
  conseils?: ConseilsPostPartum;
  sortie?: SortieSalleNaissance;
  complications?: ComplicationPostPartum[];
}

export interface ObservationPostPartum {
  id?: string;
  surveillance_post_partum_id: string;
  heure_observation: string;
  minute_observation?: number;
  timestamp_observation?: string;
  // Paramètres vitaux
  temperature?: number;
  tension_arterielle_systolique?: number;
  tension_arterielle_diastolique?: number;
  pouls?: number;
  respiration?: number;
  // Paramètres obstétricaux
  contraction_uterine?: 'Présente' | 'Absente' | 'Faible' | 'Normale' | 'Forte';
  saignement_qualite?: 'Normal' | 'Abondant' | 'Très abondant' | 'Absent';
  saignement_quantite?: number;
  douleurs?: 'Absentes' | 'Légères' | 'Modérées' | 'Sévères';
  oedemes?: boolean;
  // Examens physiques
  etat_perinee?: 'Normal' | 'Épisiotomie' | 'Déchirure' | 'Hématome' | 'Infection';
  plaie_perinee?: string;
  saignement_perineal?: boolean;
  etat_general?: 'Bon' | 'Moyen' | 'Altéré' | 'Critique';
  mictions?: 'Normales' | 'Difficiles' | 'Absentes' | 'Incontinence';
  diurese?: number;
  conscience?: 'Normale' | 'Confuse' | 'Somnolente' | 'Coma';
  // Risques (détectés automatiquement)
  risque_hpp?: boolean;
  risque_retention_placentaire?: boolean;
  risque_infection?: boolean;
  risque_hypertension?: boolean;
  risque_anemie_severe?: boolean;
  // Alertes (générées automatiquement)
  alerte_hpp?: boolean;
  alerte_tachycardie?: boolean;
  alerte_hypotension?: boolean;
  alerte_hypertension?: boolean;
  alerte_hyperthermie?: boolean;
  alerte_hypothermie?: boolean;
  notes?: string;
  agent_observation?: string;
  created_at?: string;
}

export interface TraitementPostPartum {
  id?: string;
  surveillance_post_partum_id: string;
  type_traitement: 'Ocytocine' | 'Antibiotique' | 'Anti-inflammatoire' | 'Antalgique' | 'Fer' | 'Acide folique' | 'Solution IV' | 'Misoprostol' | 'Autre';
  medicament?: string;
  dose: string;
  voie_administration?: 'IV' | 'IM' | 'Orale' | 'Rectale' | 'Autre';
  heure_administration: string;
  date_administration?: string;
  posologie?: string;
  duree?: string;
  indication?: string;
  agent_administration: string;
  agent_id?: string;
  reponse_traitement?: string;
  effets_secondaires?: string;
  created_at?: string;
}

export interface ConseilsPostPartum {
  id?: string;
  surveillance_post_partum_id: string;
  signes_danger?: boolean;
  date_signes_danger?: string;
  agent_signes_danger?: string;
  nutrition_hydratation?: boolean;
  date_nutrition?: string;
  agent_nutrition?: string;
  hygiene_perineale?: boolean;
  date_hygiene_perineale?: string;
  agent_hygiene_perineale?: string;
  allaitement?: boolean;
  date_allaitement?: string;
  agent_allaitement?: string;
  planification_familiale?: boolean;
  date_planification_familiale?: string;
  agent_planification_familiale?: string;
  retour_consultation?: boolean;
  date_retour_consultation?: string;
  agent_retour_consultation?: string;
  autres_conseils?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SortieSalleNaissance {
  id?: string;
  surveillance_post_partum_id: string;
  heure_sortie: string;
  date_sortie?: string;
  etat_mere?: 'Stable' | 'Stable sous surveillance' | 'Instable' | 'Critique';
  etat_detaille?: string;
  destination?: 'Maternité' | 'Hospitalisation' | 'Référence' | 'Domicile' | 'Autre';
  service_destination?: string;
  chambre?: string;
  accompagnant_present?: boolean;
  nom_accompagnant?: string;
  transport_utilise?: string;
  dossier_transfere?: boolean;
  service_receveur?: string;
  agent_sortie: string;
  agent_id?: string;
  signature_agent?: string;
  observations?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ComplicationPostPartum {
  id?: string;
  surveillance_post_partum_id: string;
  type_complication: 'Hémorragie post-partum' | 'Rétention placentaire' | 'Infection' | 'Hypertension' | 'Hypotension' | 'Anémie sévère' | 'Choc' | 'Pré-éclampsie post-partum' | 'Autre';
  description: string;
  heure_debut?: string;
  date_debut?: string;
  severite?: 'Légère' | 'Modérée' | 'Sévère' | 'Critique';
  prise_en_charge?: string;
  traitement_applique?: string;
  evolution?: 'Résolue' | 'En cours' | 'Aggravée' | 'Référence';
  heure_resolution?: string;
  agent_detection?: string;
  agent_prise_en_charge?: string;
  created_at?: string;
  updated_at?: string;
}

// ========== SERVICE ==========

export class PostPartumService {
  
  // ========== SURVEILLANCE POST-PARTUM ==========
  
  static async createSurveillance(surveillance: SurveillancePostPartum): Promise<SurveillancePostPartum> {
    try {
      const { observations_list, traitements, conseils, sortie, complications, ...survData } = surveillance;

      const { data: created, error } = await supabase
        .from('surveillance_post_partum')
        .insert([survData])
        .select()
        .single();

      if (error) throw error;

      // Générer automatiquement les créneaux d'observation toutes les 15 minutes
      if (created.id) {
        await this.genererCreneauxObservation(created.id, survData.duree_surveillance || 120);
      }

      return await this.getSurveillance(created.id) || created;
    } catch (error) {
      console.error('Erreur createSurveillance:', error);
      throw error;
    }
  }

  static async getSurveillance(id: string): Promise<SurveillancePostPartum | null> {
    try {
      const { data, error } = await supabase
        .from('surveillance_post_partum')
        .select(`
          *,
          observations_list:observation_post_partum (*),
          traitements:traitement_post_partum (*),
          conseils:conseils_post_partum (*),
          sortie:sortie_salle_naissance (*),
          complications:complication_post_partum (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as SurveillancePostPartum;
    } catch (error) {
      console.error('Erreur getSurveillance:', error);
      throw error;
    }
  }

  static async getSurveillanceByAccouchement(accouchementId: string): Promise<SurveillancePostPartum | null> {
    try {
      const { data, error } = await supabase
        .from('surveillance_post_partum')
        .select(`
          *,
          observations_list:observation_post_partum (*),
          traitements:traitement_post_partum (*),
          conseils:conseils_post_partum (*),
          sortie:sortie_salle_naissance (*),
          complications:complication_post_partum (*)
        `)
        .eq('accouchement_id', accouchementId)
        .order('date_debut_surveillance', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data || null) as SurveillancePostPartum | null;
    } catch (error) {
      console.error('Erreur getSurveillanceByAccouchement:', error);
      throw error;
    }
  }

  static async updateSurveillance(id: string, surveillance: Partial<SurveillancePostPartum>): Promise<SurveillancePostPartum> {
    try {
      const { observations_list, traitements, conseils, sortie, complications, ...survData } = surveillance;

      const { data: updated, error } = await supabase
        .from('surveillance_post_partum')
        .update(survData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return await this.getSurveillance(id) || updated;
    } catch (error) {
      console.error('Erreur updateSurveillance:', error);
      throw error;
    }
  }

  // ========== OBSERVATIONS (toutes les 15 minutes) ==========
  
  static async saveObservation(observation: ObservationPostPartum): Promise<ObservationPostPartum> {
    try {
      // Nettoyage et validation des données avant envoi pour éviter les erreurs SQL
      const cleanedObservation = { ...observation };
      
      // Tronquer les champs textuels qui pourraient dépasser les limites de la base
      // Hypothèse: certaines colonnes sont limitées à VARCHAR(20) en production
      if (cleanedObservation.agent_observation && cleanedObservation.agent_observation.length > 20) {
        console.warn(`Champ agent_observation tronqué: ${cleanedObservation.agent_observation}`);
        cleanedObservation.agent_observation = cleanedObservation.agent_observation.substring(0, 20);
      }
      
      if (cleanedObservation.notes && cleanedObservation.notes.length > 500) {
         cleanedObservation.notes = cleanedObservation.notes.substring(0, 500);
      }

      if (observation.id) {
        const { data, error } = await supabase
          .from('observation_post_partum')
          .update(cleanedObservation)
          .eq('id', observation.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('observation_post_partum')
          .insert([cleanedObservation])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erreur saveObservation:', error);
      throw error;
    }
  }

  static async getObservations(surveillanceId: string): Promise<ObservationPostPartum[]> {
    try {
      const { data, error } = await supabase
        .from('observation_post_partum')
        .select('*')
        .eq('surveillance_post_partum_id', surveillanceId)
        .order('timestamp_observation', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur getObservations:', error);
      throw error;
    }
  }

  // Générer automatiquement les créneaux d'observation toutes les 15 minutes
  static async genererCreneauxObservation(surveillanceId: string, dureeMinutes: number = 120): Promise<void> {
    try {
      const surveillance = await this.getSurveillance(surveillanceId);
      if (!surveillance || !surveillance.date_debut_surveillance) return;

      const debut = new Date(surveillance.date_debut_surveillance);
      const nombreObservations = Math.floor(dureeMinutes / 15);

      const observations: Partial<ObservationPostPartum>[] = [];

      for (let i = 0; i < nombreObservations; i++) {
        const timestamp = new Date(debut);
        timestamp.setMinutes(timestamp.getMinutes() + i * 15);

        observations.push({
          surveillance_post_partum_id: surveillanceId,
          heure_observation: timestamp.toTimeString().slice(0, 5),
          minute_observation: (i * 15) % 60,
          timestamp_observation: timestamp.toISOString(),
        });
      }

      // Insérer uniquement les créneaux qui n'existent pas déjà
      for (const obs of observations) {
        const { data: existing } = await supabase
          .from('observation_post_partum')
          .select('id')
          .eq('surveillance_post_partum_id', surveillanceId)
          .eq('heure_observation', obs.heure_observation)
          .eq('minute_observation', obs.minute_observation)
          .maybeSingle();

        if (!existing) {
          await supabase.from('observation_post_partum').insert([obs]);
        }
      }
    } catch (error) {
      console.error('Erreur genererCreneauxObservation:', error);
      throw error;
    }
  }

  // ========== TRAITEMENTS ==========
  
  static async saveTraitement(traitement: TraitementPostPartum): Promise<TraitementPostPartum> {
    try {
      if (traitement.id) {
        const { data, error } = await supabase
          .from('traitement_post_partum')
          .update(traitement)
          .eq('id', traitement.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('traitement_post_partum')
          .insert([traitement])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erreur saveTraitement:', error);
      throw error;
    }
  }

  static async getTraitements(surveillanceId: string): Promise<TraitementPostPartum[]> {
    try {
      const { data, error } = await supabase
        .from('traitement_post_partum')
        .select('*')
        .eq('surveillance_post_partum_id', surveillanceId)
        .order('date_administration', { ascending: true })
        .order('heure_administration', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur getTraitements:', error);
      throw error;
    }
  }

  // ========== CONSEILS ==========
  
  static async saveConseils(conseils: ConseilsPostPartum): Promise<ConseilsPostPartum> {
    try {
      if (conseils.id) {
        const { data, error } = await supabase
          .from('conseils_post_partum')
          .update(conseils)
          .eq('id', conseils.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('conseils_post_partum')
          .insert([conseils])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erreur saveConseils:', error);
      throw error;
    }
  }

  // ========== SORTIE SALLE DE NAISSANCE ==========
  
  static async saveSortie(sortie: SortieSalleNaissance): Promise<SortieSalleNaissance> {
    try {
      if (sortie.id) {
        const { data, error } = await supabase
          .from('sortie_salle_naissance')
          .update(sortie)
          .eq('id', sortie.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('sortie_salle_naissance')
          .insert([sortie])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erreur saveSortie:', error);
      throw error;
    }
  }

  // ========== COMPLICATIONS ==========
  
  static async saveComplication(complication: ComplicationPostPartum): Promise<ComplicationPostPartum> {
    try {
      if (complication.id) {
        const { data, error } = await supabase
          .from('complication_post_partum')
          .update(complication)
          .eq('id', complication.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('complication_post_partum')
          .insert([complication])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erreur saveComplication:', error);
      throw error;
    }
  }

  static async getComplications(surveillanceId: string): Promise<ComplicationPostPartum[]> {
    try {
      const { data, error } = await supabase
        .from('complication_post_partum')
        .select('*')
        .eq('surveillance_post_partum_id', surveillanceId)
        .order('date_debut', { ascending: true })
        .order('heure_debut', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur getComplications:', error);
      throw error;
    }
  }

  // ========== DÉTECTION AUTOMATIQUE DES RISQUES ==========
  
  static detecterRisques(observation: ObservationPostPartum): {
    risques: string[];
    alertes: string[];
    severite: 'normal' | 'modere' | 'severe' | 'critique';
  } {
    const risques: string[] = [];
    const alertes: string[] = [];
    let severite: 'normal' | 'modere' | 'severe' | 'critique' = 'normal';

    // HPP (Hémorragie post-partum)
    if (observation.saignement_quantite && observation.saignement_quantite > 500) {
      risques.push('HPP');
      alertes.push('Hémorragie post-partum détectée');
      severite = observation.saignement_quantite > 1000 ? 'critique' : 'severe';
    }

    if (observation.saignement_qualite === 'Abondant' || observation.saignement_qualite === 'Très abondant') {
      risques.push('HPP');
      alertes.push('Saignement abondant');
      severite = 'severe';
    }

    // Tachycardie
    if (observation.pouls && observation.pouls > 100) {
      alertes.push('Tachycardie');
      if (severite === 'normal') severite = 'modere';
    }

    // Hypotension
    if (observation.tension_arterielle_systolique && observation.tension_arterielle_systolique < 90) {
      alertes.push('Hypotension');
      risques.push('HPP');
      severite = 'severe';
    }

    // Hypertension
    if (
      (observation.tension_arterielle_systolique && observation.tension_arterielle_systolique > 140) ||
      (observation.tension_arterielle_diastolique && observation.tension_arterielle_diastolique > 90)
    ) {
      alertes.push('Hypertension');
      risques.push('Hypertension post-partum');
      severite = 'modere';
    }

    // Hyperthermie
    if (observation.temperature && observation.temperature > 38.0) {
      alertes.push('Hyperthermie');
      risques.push('Infection');
      severite = 'severe';
    }

    // Hypothermie
    if (observation.temperature && observation.temperature < 36.0) {
      alertes.push('Hypothermie');
      if (severite === 'normal') severite = 'modere';
    }

    // Rétention placentaire
    if (
      (observation.saignement_qualite === 'Abondant' || observation.saignement_qualite === 'Très abondant') &&
      (observation.contraction_uterine === 'Absente' || observation.contraction_uterine === 'Faible')
    ) {
      risques.push('Rétention placentaire');
      alertes.push('Risque de rétention placentaire');
      severite = 'severe';
    }

    // Anémie sévère
    if (observation.saignement_quantite && observation.saignement_quantite > 1000) {
      risques.push('Anémie sévère');
      severite = 'critique';
    }

    // Altération de conscience
    if (observation.conscience && observation.conscience !== 'Normale') {
      risques.push('Pré-éclampsie/Choc');
      alertes.push('Altération de la conscience');
      severite = 'critique';
    }

    return { risques, alertes, severite };
  }

  // ========== STATISTIQUES ==========
  
  static async getStatistiques(dateDebut?: string, dateFin?: string) {
    try {
      let query = supabase.from('surveillance_post_partum').select('*');

      if (dateDebut && dateFin) {
        query = query.gte('date_debut_surveillance', dateDebut).lte('date_debut_surveillance', dateFin);
      }

      const { data: surveillances, error } = await query;
      if (error) throw error;

      // Récupérer les observations avec alertes
      const { data: observations } = await supabase
        .from('observation_post_partum')
        .select('*');

      // Récupérer les complications
      const { data: complications } = await supabase
        .from('complication_post_partum')
        .select('*');

      return {
        total_surveillances: surveillances?.length || 0,
        surveillances_terminees: surveillances?.filter(s => s.statut === 'termine').length || 0,
        surveillances_complications: surveillances?.filter(s => s.statut === 'complication').length || 0,
        alertes: {
          hpp: observations?.filter(o => o.alerte_hpp === true).length || 0,
          tachycardie: observations?.filter(o => o.alerte_tachycardie === true).length || 0,
          hypertension: observations?.filter(o => o.alerte_hypertension === true).length || 0,
          hyperthermie: observations?.filter(o => o.alerte_hyperthermie === true).length || 0,
        },
        complications: {
          hpp: complications?.filter(c => c.type_complication === 'Hémorragie post-partum').length || 0,
          infection: complications?.filter(c => c.type_complication === 'Infection').length || 0,
          hypertension: complications?.filter(c => c.type_complication === 'Hypertension').length || 0,
          total: complications?.length || 0,
        },
        traitements_moyens: {
          ocytocine: 0, // À calculer selon les données
          antibiotiques: 0,
          antalgiques: 0,
        },
      };
    } catch (error) {
      console.error('Erreur getStatistiques:', error);
      throw error;
    }
  }

  // ========== RAPPORT POST-PARTUM ==========
  
  static async genererRapport(surveillanceId: string): Promise<{
    surveillance: SurveillancePostPartum;
    resume: {
      duree: number;
      nombre_observations: number;
      alertes_total: number;
      traitements_total: number;
      complications_total: number;
    };
    observations: ObservationPostPartum[];
    traitements: TraitementPostPartum[];
    complications: ComplicationPostPartum[];
    conseils: ConseilsPostPartum | null;
    sortie: SortieSalleNaissance | null;
  }> {
    try {
      const surveillance = await this.getSurveillance(surveillanceId);
      if (!surveillance) throw new Error('Surveillance non trouvée');

      const observations = surveillance.observations_list || [];
      const traitements = surveillance.traitements || [];
      const complications = surveillance.complications || [];

      const alertes_total = observations.reduce((acc, obs) => {
        return acc + (obs.alerte_hpp ? 1 : 0) + (obs.alerte_tachycardie ? 1 : 0) +
               (obs.alerte_hypertension ? 1 : 0) + (obs.alerte_hyperthermie ? 1 : 0);
      }, 0);

      return {
        surveillance,
        resume: {
          duree: surveillance.duree_surveillance || 120,
          nombre_observations: observations.length,
          alertes_total,
          traitements_total: traitements.length,
          complications_total: complications.length,
        },
        observations,
        traitements,
        complications,
        conseils: surveillance.conseils || null,
        sortie: surveillance.sortie || null,
      };
    } catch (error) {
      console.error('Erreur genererRapport:', error);
      throw error;
    }
  }
}

