import { supabase } from './supabase';

// Types pour le dossier obstétrical
export interface ConjointInfo {
  nom_prenoms?: string;
  profession?: string;
  groupe_sanguin?: 'A' | 'B' | 'AB' | 'O' | 'Inconnu';
  rhesus?: 'Positif' | 'Négatif' | 'Inconnu';
  electrophorese_hemoglobine?: string;
  serologie?: string;
  personne_contacter_nom?: string;
  personne_contacter_adresse?: string;
  personne_contacter_telephone?: string;
  referee?: boolean;
  referee_par?: string;
}

export interface GrossesseAnterieure {
  id?: string;
  annee?: number;
  evolution?: string;
  poids?: number;
  sexe?: 'Masculin' | 'Féminin' | 'Inconnu';
  etat_enfants?: string;
}

export interface FacteursSurveillance {
  age_inferieur_16?: boolean;
  age_superieur_35?: boolean;
  taille_inferieure_150?: boolean;
  parite_superieure_6?: boolean;
  cesarienne_dernier_accouchement?: boolean;
  mort_ne_dernier_accouchement?: boolean;
  drepanocytose_ss_sc?: boolean;
  hta_connue?: boolean;
  fausses_couches_repetees?: boolean;
  diabete?: boolean;
  autres_facteurs?: string;
}

export interface ExamensComplementaires {
  groupe_sanguin?: 'A' | 'B' | 'AB' | 'O' | 'Inconnu';
  rhesus?: 'Positif' | 'Négatif' | 'Inconnu';
  test_coombs_indirect?: string;
  tpha?: string;
  vdrl?: string;
  hiv1_hiv2?: string;
  ecbu?: string;
  taux_hemoglobine?: number;
  hematocrite?: number;
  plaquettes?: number;
  electrophorese_hemoglobine?: string;
  toxoplasmose_igg?: string;
  toxoplasmose_igm?: string;
  rubeole_igg?: string;
  glycemic_jeun?: number;
  gp75?: number;
  hepatite_b?: string;
  autres_examens?: string;
}

export interface DossierObstetrical {
  id?: string;
  patient_id: string;
  date_entree?: string;
  date_sortie?: string;
  numero_dossier?: string;
  
  // Informations conjoint
  conjoint_nom_prenoms?: string;
  conjoint_profession?: string;
  conjoint_groupe_sanguin?: 'A' | 'B' | 'AB' | 'O' | 'Inconnu';
  conjoint_rhesus?: 'Positif' | 'Négatif' | 'Inconnu';
  conjoint_electrophorese_hemoglobine?: string;
  conjoint_serologie?: string;
  personne_contacter_nom?: string;
  personne_contacter_adresse?: string;
  personne_contacter_telephone?: string;
  referee?: boolean;
  referee_par?: string;
  
  // Antécédents obstétricaux
  transfusions_anterieures?: boolean;
  nombre_transfusions?: number;
  gestite?: number;
  parite?: number;
  nombre_avortements?: number;
  nombre_enfants_vivants?: number;
  nombre_enfants_decedes?: number;
  ddr?: string; // Date des dernières règles
  dpa?: string; // Date probable d'accouchement
  
  // Facteurs de surveillance
  age_inferieur_16?: boolean;
  age_superieur_35?: boolean;
  taille_inferieure_150?: boolean;
  parite_superieure_6?: boolean;
  cesarienne_dernier_accouchement?: boolean;
  mort_ne_dernier_accouchement?: boolean;
  drepanocytose_ss_sc?: boolean;
  hta_connue?: boolean;
  fausses_couches_repetees?: boolean;
  diabete?: boolean;
  autres_facteurs?: string;
  
  // Examens complémentaires
  examen_groupe_sanguin?: 'A' | 'B' | 'AB' | 'O' | 'Inconnu';
  examen_rhesus?: 'Positif' | 'Négatif' | 'Inconnu';
  test_coombs_indirect?: string;
  tpha?: string;
  vdrl?: string;
  hiv1_hiv2?: string;
  ecbu?: string;
  taux_hemoglobine?: number;
  hematocrite?: number;
  plaquettes?: number;
  electrophorese_hemoglobine?: string;
  toxoplasmose_igg?: string;
  toxoplasmose_igm?: string;
  rubeole_igg?: string;
  glycemic_jeun?: number;
  gp75?: number;
  hepatite_b?: string;
  autres_examens?: string;
  
  // VIH / Syphilis
  vih?: boolean;
  mise_sous_arv?: boolean;
  syphilis?: boolean;
  mise_sous_ctm?: boolean;
  
  // Statut
  statut?: 'en_cours' | 'accouche' | 'post_partum' | 'clos';
  notes?: string;
  
  // Grossesses antérieures (relation séparée)
  grossesses_anterieures?: GrossesseAnterieure[];
  
  // Relations (pour les jointures Supabase)
  patients?: any;
  
  created_at?: string;
  updated_at?: string;
}

export interface DossierObstetricalFormData extends Omit<DossierObstetrical, 'id' | 'created_at' | 'updated_at'> {
  grossesses_anterieures?: GrossesseAnterieure[];
}

export class MaterniteService {
  // Récupérer tous les dossiers obstétricaux
  static async getAllDossiers(): Promise<DossierObstetrical[]> {
    try {
      // Vérifier la connexion Supabase
      if (!supabase) {
        throw new Error('Connexion Supabase non initialisée. Vérifiez votre configuration.');
      }

      // Récupérer les dossiers avec les grossesses antérieures
      // Utiliser une requête plus simple d'abord pour tester la connexion
      const { data: dossiersData, error: dossiersError } = await supabase
        .from('dossier_obstetrical')
        .select('*')
        .order('date_entree', { ascending: false })
        .limit(100);

      if (dossiersError) {
        console.error('Erreur Supabase lors de la récupération des dossiers:', dossiersError);
        
        // Messages d'erreur plus explicites
        if (dossiersError.code === 'PGRST116' || dossiersError.message?.includes('relation') || dossiersError.message?.includes('does not exist')) {
          throw new Error('Les tables de la base de données n\'existent pas encore. Veuillez exécuter le script SQL de configuration dans Supabase (scripts/setup-complete-maternite.sql)');
        }
        
        if (dossiersError.message?.includes('JWT') || dossiersError.message?.includes('API key') || dossiersError.message?.includes('Invalid API key')) {
          throw new Error('Clé API Supabase invalide. Vérifiez votre configuration dans src/services/supabase.ts');
        }
        
        // Gérer les erreurs réseau différemment
        const errorMsg = dossiersError.message || '';
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('fetch')) {
          throw new Error('Erreur de connexion réseau. Vérifiez votre connexion Internet et réessayez.');
        }
        
        throw new Error(`Erreur lors de la récupération des dossiers: ${dossiersError.message || 'Erreur inconnue'}`);
      }

      if (!dossiersData || dossiersData.length === 0) {
        console.info('Aucun dossier obstétrical trouvé dans la base de données.');
        return [];
      }

      // Récupérer les grossesses antérieures pour chaque dossier
      const dossiersWithRelations = await Promise.all(
        (dossiersData || []).map(async (dossier) => {
          try {
            // Récupérer le patient
            const { data: patientData, error: patientError } = await supabase
              .from('patients')
              .select('*')
              .eq('id', dossier.patient_id)
              .single();

            // Récupérer les grossesses antérieures
            const { data: grossessesData } = await supabase
              .from('grossesses_anterieures')
              .select('*')
              .eq('dossier_obstetrical_id', dossier.id);

            return {
              ...dossier,
              patients: patientData || null,
              grossesses_anterieures: grossessesData || [],
            };
          } catch (err) {
            console.warn(`Erreur lors de la récupération des relations pour le dossier ${dossier.id}:`, err);
            return {
              ...dossier,
              patients: null,
              grossesses_anterieures: [],
            };
          }
        })
      );

      return dossiersWithRelations as DossierObstetrical[];
    } catch (error: any) {
      console.error('Erreur dans getAllDossiers:', error);
      
      // Re-lancer l'erreur avec un message plus clair
      if (error.message) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Impossible de se connecter à Supabase. Vérifiez:\n1. Votre connexion Internet\n2. L\'URL Supabase dans src/services/supabase.ts\n3. Que le projet Supabase est actif\n4. Que le script SQL a été exécuté (scripts/setup-complete-maternite.sql)');
      }
      
      throw new Error(`Erreur lors du chargement des dossiers: ${error.message || 'Erreur inconnue'}`);
    }
  }

  // Récupérer un dossier par ID
  static async getDossierById(id: string): Promise<DossierObstetrical | null> {
    try {
      const { data: dossierData, error: dossierError } = await supabase
        .from('dossier_obstetrical')
        .select(`
          *,
          grossesses_anterieures (*)
        `)
        .eq('id', id)
        .single();

      if (dossierError) {
        if (dossierError.code === 'PGRST116') {
          return null;
        }
        console.error('Erreur lors de la récupération du dossier:', dossierError);
        throw dossierError;
      }

      // Récupérer le patient
      if (dossierData) {
        const { data: patientData } = await supabase
          .from('patients')
          .select('*')
          .eq('id', dossierData.patient_id)
          .single();

        return { ...dossierData, patients: patientData } as DossierObstetrical;
      }

      return null;
    } catch (error) {
      console.error('Erreur dans getDossierById:', error);
      throw error;
    }
  }

  // Récupérer un dossier par patient_id
  static async getDossierByPatientId(patientId: string): Promise<DossierObstetrical | null> {
    try {
      const { data: dossierData, error: dossierError } = await supabase
        .from('dossier_obstetrical')
        .select(`
          *,
          grossesses_anterieures (*)
        `)
        .eq('patient_id', patientId)
        .order('date_entree', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dossierError) {
        console.error('Erreur lors de la récupération du dossier:', dossierError);
        throw dossierError;
      }

      // Récupérer le patient
      if (dossierData) {
        const { data: patientData } = await supabase
          .from('patients')
          .select('*')
          .eq('id', dossierData.patient_id)
          .single();

        return { ...dossierData, patients: patientData } as DossierObstetrical;
      }

      return null;
    } catch (error) {
      console.error('Erreur dans getDossierByPatientId:', error);
      throw error;
    }
  }

  // Créer un nouveau dossier obstétrical
  static async createDossier(dossierData: DossierObstetricalFormData): Promise<DossierObstetrical> {
    try {
      // Extraire les grossesses antérieures
      const { grossesses_anterieures, ...dossierMain } = dossierData;

      // Calculer la DPA si DDR est fournie
      if (dossierMain.ddr && !dossierMain.dpa) {
        const ddrDate = new Date(dossierMain.ddr);
        ddrDate.setDate(ddrDate.getDate() + 280); // 40 semaines
        dossierMain.dpa = ddrDate.toISOString().split('T')[0];
      }

      // Insérer le dossier principal
      const { data: dossier, error: dossierError } = await supabase
        .from('dossier_obstetrical')
        .insert([dossierMain])
        .select()
        .single();

      if (dossierError) {
        console.error('Erreur lors de la création du dossier:', dossierError);
        throw dossierError;
      }

      // Insérer les grossesses antérieures si elles existent
      if (grossesses_anterieures && grossesses_anterieures.length > 0 && dossier.id) {
        const grossessesToInsert = grossesses_anterieures.map(g => ({
          dossier_obstetrical_id: dossier.id,
          annee: g.annee,
          evolution: g.evolution,
          poids: g.poids,
          sexe: g.sexe,
          etat_enfants: g.etat_enfants,
        }));

        const { error: grossessesError } = await supabase
          .from('grossesses_anterieures')
          .insert(grossessesToInsert);

        if (grossessesError) {
          console.error('Erreur lors de l\'insertion des grossesses antérieures:', grossessesError);
          throw grossessesError;
        }
      }

      // Récupérer le dossier complet avec les relations
      const dossierComplet = await this.getDossierById(dossier.id);
      return dossierComplet || dossier;
    } catch (error) {
      console.error('Erreur dans createDossier:', error);
      throw error;
    }
  }

  // Mettre à jour un dossier obstétrical
  static async updateDossier(
    id: string,
    dossierData: Partial<DossierObstetricalFormData>
  ): Promise<DossierObstetrical> {
    try {
      // Extraire les grossesses antérieures
      const { grossesses_anterieures, ...dossierMain } = dossierData;

      // Calculer la DPA si DDR est modifiée
      if (dossierMain.ddr && !dossierMain.dpa) {
        const ddrDate = new Date(dossierMain.ddr);
        ddrDate.setDate(ddrDate.getDate() + 280);
        dossierMain.dpa = ddrDate.toISOString().split('T')[0];
      }

      // Mettre à jour le dossier principal
      const { data: dossier, error: dossierError } = await supabase
        .from('dossier_obstetrical')
        .update(dossierMain)
        .eq('id', id)
        .select()
        .single();

      if (dossierError) {
        console.error('Erreur lors de la mise à jour du dossier:', dossierError);
        throw dossierError;
      }

      // Mettre à jour les grossesses antérieures si fournies
      if (grossesses_anterieures !== undefined && dossier.id) {
        // Supprimer les anciennes grossesses
        const { error: deleteError } = await supabase
          .from('grossesses_anterieures')
          .delete()
          .eq('dossier_obstetrical_id', dossier.id);

        if (deleteError) {
          console.error('Erreur lors de la suppression des grossesses antérieures:', deleteError);
          throw deleteError;
        }

        // Insérer les nouvelles grossesses
        if (grossesses_anterieures.length > 0) {
          const grossessesToInsert = grossesses_anterieures.map(g => ({
            dossier_obstetrical_id: dossier.id,
            annee: g.annee,
            evolution: g.evolution,
            poids: g.poids,
            sexe: g.sexe,
            etat_enfants: g.etat_enfants,
          }));

          const { error: insertError } = await supabase
            .from('grossesses_anterieures')
            .insert(grossessesToInsert);

          if (insertError) {
            console.error('Erreur lors de l\'insertion des grossesses antérieures:', insertError);
            throw insertError;
          }
        }
      }

      // Récupérer le dossier complet avec les relations
      const dossierComplet = await this.getDossierById(dossier.id);
      return dossierComplet || dossier;
    } catch (error) {
      console.error('Erreur dans updateDossier:', error);
      throw error;
    }
  }

  // Supprimer un dossier obstétrical
  static async deleteDossier(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('dossier_obstetrical')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du dossier:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur dans deleteDossier:', error);
      throw error;
    }
  }

  // Calculer la DPA (Date Probable d'Accouchement)
  static calculateDPA(ddr: string): string {
    if (!ddr) return '';
    const ddrDate = new Date(ddr);
    ddrDate.setDate(ddrDate.getDate() + 280); // 40 semaines
    return ddrDate.toISOString().split('T')[0];
  }

  // Calculer l'âge gestationnel en semaines
  static calculateAgeGestationnel(ddr: string): number {
    if (!ddr) return 0;
    const ddrDate = new Date(ddr);
    const maintenant = new Date();
    const diffJours = (maintenant.getTime() - ddrDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor(diffJours / 7);
  }

  // Détecter les facteurs de risque
  static detecterFacteursRisque(dossier: DossierObstetrical, agePatient?: number): string[] {
    const facteurs: string[] = [];

    if (agePatient !== undefined) {
      if (agePatient < 16) facteurs.push('Âge < 16 ans');
      if (agePatient > 35) facteurs.push('Âge > 35 ans');
    }

    if (dossier.age_inferieur_16) facteurs.push('Âge < 16 ans');
    if (dossier.age_superieur_35) facteurs.push('Âge > 35 ans');
    if (dossier.taille_inferieure_150) facteurs.push('Taille < 1,50 m');
    if (dossier.parite_superieure_6) facteurs.push('Parité ≥ 6');
    if (dossier.cesarienne_dernier_accouchement) facteurs.push('Césarienne au dernier accouchement');
    if (dossier.mort_ne_dernier_accouchement) facteurs.push('Mort-né au dernier accouchement');
    if (dossier.drepanocytose_ss_sc) facteurs.push('Drépanocytose SS ou SC');
    if (dossier.hta_connue) facteurs.push('HTA connue');
    if (dossier.fausses_couches_repetees) facteurs.push('Fausses couches répétées');
    if (dossier.diabete) facteurs.push('Diabète');
    if (dossier.autres_facteurs) facteurs.push('Autres facteurs');

    return facteurs;
  }

  // Récupérer les statistiques
  static async getStatistics(dateDebut?: string, dateFin?: string) {
    try {
      let query = supabase.from('dossier_obstetrical').select('*');

      if (dateDebut && dateFin) {
        query = query.gte('date_entree', dateDebut).lte('date_entree', dateFin);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        throw error;
      }

      const dossiers = data || [];

      const stats = {
        total: dossiers.length,
        parStatut: {
          en_cours: dossiers.filter(d => d.statut === 'en_cours').length,
          accouche: dossiers.filter(d => d.statut === 'accouche').length,
          post_partum: dossiers.filter(d => d.statut === 'post_partum').length,
          clos: dossiers.filter(d => d.statut === 'clos').length,
        },
        gestiteMoyenne: dossiers.reduce((acc, d) => acc + (d.gestite || 0), 0) / dossiers.length || 0,
        pariteMoyenne: dossiers.reduce((acc, d) => acc + (d.parite || 0), 0) / dossiers.length || 0,
        vihPositif: dossiers.filter(d => d.vih === true).length,
        syphilisPositif: dossiers.filter(d => d.syphilis === true).length,
        facteursRisque: {
          age_inferieur_16: dossiers.filter(d => d.age_inferieur_16).length,
          age_superieur_35: dossiers.filter(d => d.age_superieur_35).length,
          taille_inferieure_150: dossiers.filter(d => d.taille_inferieure_150).length,
          parite_superieure_6: dossiers.filter(d => d.parite_superieure_6).length,
          cesarienne: dossiers.filter(d => d.cesarienne_dernier_accouchement).length,
          mort_ne: dossiers.filter(d => d.mort_ne_dernier_accouchement).length,
          drepanocytose: dossiers.filter(d => d.drepanocytose_ss_sc).length,
          hta: dossiers.filter(d => d.hta_connue).length,
          fausses_couches: dossiers.filter(d => d.fausses_couches_repetees).length,
          diabete: dossiers.filter(d => d.diabete).length,
        },
      };

      return stats;
    } catch (error) {
      console.error('Erreur dans getStatistics:', error);
      throw error;
    }
  }
}

