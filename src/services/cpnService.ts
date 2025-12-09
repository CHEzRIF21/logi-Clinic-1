import { supabase } from './supabase';

// Types pour les droits fondamentaux
export interface DroitsFondamentaux {
  id?: string;
  dossier_obstetrical_id: string;
  droit_confidentialite?: boolean;
  date_confidentialite?: string;
  droit_dignite?: boolean;
  date_dignite?: string;
  droit_choix?: boolean;
  date_choix?: string;
  droit_securite?: boolean;
  date_securite?: string;
  droit_information?: boolean;
  date_information?: string;
  droit_continuite_soins?: boolean;
  date_continuite_soins?: string;
  autres_droits?: string;
  created_at?: string;
  updated_at?: string;
}

// Types pour la vaccination maternelle
export interface VaccinationMaternelle {
  id?: string;
  dossier_obstetrical_id: string;
  vat1_date?: string;
  vat2_date?: string;
  vat3_date?: string;
  vat4_date?: string;
  vat5_date?: string;
  prochaine_dose?: string;
  date_prochaine_dose?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Types pour le plan d'accouchement
export interface PlanAccouchement {
  id?: string;
  dossier_obstetrical_id: string;
  acceptation_accompagnant?: boolean;
  nom_accompagnant?: string;
  prevision_transport?: string;
  prevision_communication?: string;
  lieu_accouchement_prevu?: string;
  niveau_preparation_menage?: 'Faible' | 'Moyen' | 'Bon' | 'Excellent';
  evaluation_risques?: string;
  created_at?: string;
  updated_at?: string;
}

// Types pour les soins promotionnels
export interface SoinsPromotionnels {
  id?: string;
  dossier_obstetrical_id: string;
  // Informations données
  info_vih_ptme?: boolean;
  date_info_vih_ptme?: string;
  info_reference_cpn?: boolean;
  date_info_reference_cpn?: string;
  info_paludisme?: boolean;
  date_info_paludisme?: string;
  info_nutrition?: boolean;
  date_info_nutrition?: string;
  info_espacement_naissances?: boolean;
  date_info_espacement_naissances?: string;
  // Fournitures distribuées
  moustiquaire?: boolean;
  date_moustiquaire?: string;
  quantite_moustiquaire?: number;
  preservatifs?: boolean;
  date_preservatifs?: string;
  quantite_preservatifs?: number;
  fer_acide_folique?: boolean;
  date_fer_acide_folique?: string;
  quantite_fer_acide_folique?: number;
  deparasitage?: boolean;
  date_deparasitage?: string;
  autres_fournitures?: string;
  created_at?: string;
  updated_at?: string;
}

// Types pour la consultation prénatale
export interface ConsultationPrenatale {
  id?: string;
  dossier_obstetrical_id: string;
  numero_cpn: number;
  trimestre?: number;
  date_consultation: string;
  terme_semaines?: number;
  // Paramètres vitaux
  poids?: number;
  taille_uterine?: number;
  position_foetale?: string;
  mouvements_foetaux?: boolean;
  bruit_coeur_foetal?: boolean;
  oedemes?: boolean;
  etat_general?: string;
  tension_arterielle?: string;
  temperature?: number;
  // Examen obstétrical
  palpation?: string;
  presentation?: string;
  hauteur_uterine?: number;
  // Tests
  test_albumine?: string;
  test_nitrite?: string;
  test_vih?: string;
  test_syphilis?: string;
  test_glycemie?: number;
  // Examens labo
  hemoglobine?: number;
  groupe_sanguin?: string;
  autres_examens?: string;
  // Signes
  effets_secondaires?: string;
  signes_danger?: string;
  // Référence
  reference_necessaire?: boolean;
  centre_reference?: string;
  motif_reference?: string;
  suivi_retour?: string;
  // Diagnostic
  diagnostic?: string;
  decision?: string;
  prochain_rdv?: string;
  statut?: 'programmee' | 'en_cours' | 'terminee' | 'manquee' | 'annulee';
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  // Relations
  traitements?: TraitementCPN[];
  conseils?: ConseilsMere;
}

// Types pour les traitements
export interface TraitementCPN {
  id?: string;
  consultation_prenatale_id: string;
  type_traitement: string;
  medicament?: string;
  dose?: string;
  dose_numero?: number;
  posologie?: string;
  duree?: string;
  date_administration?: string;
  created_at?: string;
}

// Types pour les conseils à la mère
export interface ConseilsMere {
  id?: string;
  consultation_prenatale_id: string;
  connaitre_dangers?: boolean;
  conseils_nutritionnels?: boolean;
  info_planification_familiale?: boolean;
  hygiene_prevention?: boolean;
  allaitement?: boolean;
  preparation_accouchement?: boolean;
  autres_conseils?: string;
  created_at?: string;
}

export class CPNService {
  // ========== DROITS FONDAMENTAUX ==========
  static async getDroitsFondamentaux(dossierId: string): Promise<DroitsFondamentaux | null> {
    try {
      const { data, error } = await supabase
        .from('droits_fondamentaux')
        .select('*')
        .eq('dossier_obstetrical_id', dossierId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur getDroitsFondamentaux:', error);
      throw error;
    }
  }

  static async saveDroitsFondamentaux(data: DroitsFondamentaux): Promise<DroitsFondamentaux> {
    try {
      if (data.id) {
        const { data: updated, error } = await supabase
          .from('droits_fondamentaux')
          .update(data)
          .eq('id', data.id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('droits_fondamentaux')
          .insert([data])
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    } catch (error) {
      console.error('Erreur saveDroitsFondamentaux:', error);
      throw error;
    }
  }

  // ========== VACCINATION MATERNELLE ==========
  static async getVaccinationMaternelle(dossierId: string): Promise<VaccinationMaternelle | null> {
    try {
      const { data, error } = await supabase
        .from('vaccination_maternelle')
        .select('*')
        .eq('dossier_obstetrical_id', dossierId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur getVaccinationMaternelle:', error);
      throw error;
    }
  }

  static async saveVaccinationMaternelle(data: VaccinationMaternelle): Promise<VaccinationMaternelle> {
    try {
      if (data.id) {
        const { data: updated, error } = await supabase
          .from('vaccination_maternelle')
          .update(data)
          .eq('id', data.id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('vaccination_maternelle')
          .insert([data])
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    } catch (error) {
      console.error('Erreur saveVaccinationMaternelle:', error);
      throw error;
    }
  }

  // ========== PLAN D'ACCOUCHEMENT ==========
  static async getPlanAccouchement(dossierId: string): Promise<PlanAccouchement | null> {
    try {
      const { data, error } = await supabase
        .from('plan_accouchement')
        .select('*')
        .eq('dossier_obstetrical_id', dossierId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur getPlanAccouchement:', error);
      throw error;
    }
  }

  static async savePlanAccouchement(data: PlanAccouchement): Promise<PlanAccouchement> {
    try {
      if (data.id) {
        const { data: updated, error } = await supabase
          .from('plan_accouchement')
          .update(data)
          .eq('id', data.id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('plan_accouchement')
          .insert([data])
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    } catch (error) {
      console.error('Erreur savePlanAccouchement:', error);
      throw error;
    }
  }

  // ========== SOINS PROMOTIONNELS ==========
  static async getSoinsPromotionnels(dossierId: string): Promise<SoinsPromotionnels | null> {
    try {
      const { data, error } = await supabase
        .from('soins_promotionnels')
        .select('*')
        .eq('dossier_obstetrical_id', dossierId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur getSoinsPromotionnels:', error);
      throw error;
    }
  }

  static async saveSoinsPromotionnels(data: SoinsPromotionnels): Promise<SoinsPromotionnels> {
    try {
      if (data.id) {
        const { data: updated, error } = await supabase
          .from('soins_promotionnels')
          .update(data)
          .eq('id', data.id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('soins_promotionnels')
          .insert([data])
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    } catch (error) {
      console.error('Erreur saveSoinsPromotionnels:', error);
      throw error;
    }
  }

  // ========== CONSULTATIONS PRÉNATALES ==========
  static async getAllCPN(dossierId: string): Promise<ConsultationPrenatale[]> {
    try {
      const { data, error } = await supabase
        .from('consultation_prenatale')
        .select(`
          *,
          traitements:traitement_cpn (*),
          conseils:conseils_mere (*)
        `)
        .eq('dossier_obstetrical_id', dossierId)
        .order('date_consultation', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur getAllCPN:', error);
      throw error;
    }
  }

  static async getCPNById(id: string): Promise<ConsultationPrenatale | null> {
    try {
      const { data, error } = await supabase
        .from('consultation_prenatale')
        .select(`
          *,
          traitements:traitement_cpn (*),
          conseils:conseils_mere (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erreur getCPNById:', error);
      throw error;
    }
  }

  static async createCPN(cpn: ConsultationPrenatale): Promise<ConsultationPrenatale> {
    try {
      const { traitements, conseils, ...cpnData } = cpn;

      // Créer la CPN
      const { data: createdCPN, error: cpnError } = await supabase
        .from('consultation_prenatale')
        .insert([cpnData])
        .select()
        .single();

      if (cpnError) throw cpnError;

      // Ajouter les traitements si présents
      if (traitements && traitements.length > 0 && createdCPN.id) {
        const traitementsToInsert = traitements.map(t => ({
          ...t,
          consultation_prenatale_id: createdCPN.id,
        }));
        const { error: traitError } = await supabase
          .from('traitement_cpn')
          .insert(traitementsToInsert);
        if (traitError) throw traitError;
      }

      // Ajouter les conseils si présents
      if (conseils && createdCPN.id) {
        const { error: conseilsError } = await supabase
          .from('conseils_mere')
          .insert([{ ...conseils, consultation_prenatale_id: createdCPN.id }]);
        if (conseilsError) throw conseilsError;
      }

      return await this.getCPNById(createdCPN.id) || createdCPN;
    } catch (error) {
      console.error('Erreur createCPN:', error);
      throw error;
    }
  }

  static async updateCPN(id: string, cpn: Partial<ConsultationPrenatale>): Promise<ConsultationPrenatale> {
    try {
      const { traitements, conseils, ...cpnData } = cpn;

      // Mettre à jour la CPN
      const { data: updatedCPN, error: cpnError } = await supabase
        .from('consultation_prenatale')
        .update(cpnData)
        .eq('id', id)
        .select()
        .single();

      if (cpnError) throw cpnError;

      // Mettre à jour les traitements si présents
      if (traitements !== undefined) {
        // Supprimer les anciens
        await supabase.from('traitement_cpn').delete().eq('consultation_prenatale_id', id);
        // Insérer les nouveaux
        if (traitements.length > 0) {
          const traitementsToInsert = traitements.map(t => ({
            ...t,
            consultation_prenatale_id: id,
          }));
          await supabase.from('traitement_cpn').insert(traitementsToInsert);
        }
      }

      // Mettre à jour les conseils si présents
      if (conseils !== undefined) {
        const { data: existingConseils } = await supabase
          .from('conseils_mere')
          .select('id')
          .eq('consultation_prenatale_id', id)
          .maybeSingle();

        if (existingConseils) {
          await supabase
            .from('conseils_mere')
            .update(conseils)
            .eq('consultation_prenatale_id', id);
        } else {
          await supabase
            .from('conseils_mere')
            .insert([{ ...conseils, consultation_prenatale_id: id }]);
        }
      }

      return await this.getCPNById(id) || updatedCPN;
    } catch (error) {
      console.error('Erreur updateCPN:', error);
      throw error;
    }
  }

  static async deleteCPN(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('consultation_prenatale')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur deleteCPN:', error);
      throw error;
    }
  }

  // ========== FONCTIONS UTILITAIRES ==========
  
  // Calculer le trimestre en fonction du terme
  static calculerTrimestre(termeSemaines: number): number {
    if (termeSemaines <= 13) return 1;
    if (termeSemaines <= 28) return 2;
    return 3;
  }

  // Calculer le prochain numéro CPN
  static async getProchainNumeroCPN(dossierId: string): Promise<number> {
    try {
      const cpns = await this.getAllCPN(dossierId);
      if (cpns.length === 0) return 1;
      return Math.max(...cpns.map(c => c.numero_cpn)) + 1;
    } catch (error) {
      console.error('Erreur getProchainNumeroCPN:', error);
      return 1;
    }
  }

  // Calculer la date du prochain RDV
  static calculerProchainRDV(numeroCPN: number, dateActuelle: string): string {
    const date = new Date(dateActuelle);
    switch (numeroCPN) {
      case 1:
      case 2:
        date.setDate(date.getDate() + 28); // 4 semaines
        break;
      case 3:
        date.setDate(date.getDate() + 14); // 2 semaines
        break;
      default:
        date.setDate(date.getDate() + 7); // 1 semaine
    }
    return date.toISOString().split('T')[0];
  }

  // Vérifier si toutes les CPN obligatoires sont complètes
  static async verifierCPNObligatoires(dossierId: string): Promise<{
    cpn1: boolean;
    cpn2: boolean;
    cpn3: boolean;
    cpn4: boolean;
    toutes_completes: boolean;
  }> {
    try {
      const cpns = await this.getAllCPN(dossierId);
      const cpnTerminees = cpns.filter(c => c.statut === 'terminee');
      
      return {
        cpn1: cpnTerminees.some(c => c.numero_cpn === 1),
        cpn2: cpnTerminees.some(c => c.numero_cpn === 2),
        cpn3: cpnTerminees.some(c => c.numero_cpn === 3),
        cpn4: cpnTerminees.some(c => c.numero_cpn === 4),
        toutes_completes: cpnTerminees.length >= 4,
      };
    } catch (error) {
      console.error('Erreur verifierCPNObligatoires:', error);
      return {
        cpn1: false,
        cpn2: false,
        cpn3: false,
        cpn4: false,
        toutes_completes: false,
      };
    }
  }

  // Statistiques CPN
  static async getStatistiquesCPN(dateDebut?: string, dateFin?: string) {
    try {
      let query = supabase.from('consultation_prenatale').select('*');

      if (dateDebut && dateFin) {
        query = query.gte('date_consultation', dateDebut).lte('date_consultation', dateFin);
      }

      const { data, error } = await query;
      if (error) throw error;

      const cpns = data || [];

      return {
        total: cpns.length,
        parTrimestre: {
          trimestre1: cpns.filter(c => c.trimestre === 1).length,
          trimestre2: cpns.filter(c => c.trimestre === 2).length,
          trimestre3: cpns.filter(c => c.trimestre === 3).length,
        },
        parStatut: {
          terminees: cpns.filter(c => c.statut === 'terminee').length,
          manquees: cpns.filter(c => c.statut === 'manquee').length,
          programmees: cpns.filter(c => c.statut === 'programmee').length,
        },
        references: cpns.filter(c => c.reference_necessaire === true).length,
        testsPositifs: {
          vih: cpns.filter(c => c.test_vih === 'Positif').length,
          syphilis: cpns.filter(c => c.test_syphilis === 'Positif').length,
        },
      };
    } catch (error) {
      console.error('Erreur getStatistiquesCPN:', error);
      throw error;
    }
  }
}

