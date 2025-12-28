import { supabase, Patient } from './supabase';
import { PatientService } from './patientService';

/**
 * Service d'intégration centralisé pour gérer les relations entre modules
 * Permet de récupérer tous les enregistrements d'un patient dans tous les modules
 */
export class PatientIntegrationService {
  /**
   * Récupère toutes les données d'un patient dans tous les modules
   */
  static async getPatientCompleteData(patientId: string) {
    try {
      const patient = await PatientService.getPatientById(patientId);
      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      // Récupérer les données de tous les modules en parallèle
      const [
        dossiersObstetricaux,
        consultationsCPN,
        vaccinationsMaternelles,
        accouchements,
        consultations,
        vaccinations,
        examensLabo,
        examensImagerie,
      ] = await Promise.all([
        // Module Maternité
        this.getDossiersObstetricaux(patientId),
        this.getConsultationsCPN(patientId),
        this.getVaccinationsMaternelles(patientId),
        this.getAccouchements(patientId),
        
        // Module Consultations
        this.getConsultations(patientId),
        
        // Module Vaccination
        this.getVaccinations(patientId),
        
        // Module Laboratoire
        this.getExamensLaboratoire(patientId),
        
        // Module Imagerie
        this.getExamensImagerie(patientId),
      ]);

      return {
        patient,
        modules: {
          maternite: {
            dossiersObstetricaux,
            consultationsCPN,
            vaccinationsMaternelles,
            accouchements,
          },
          consultations,
          vaccinations,
          laboratoire: {
            examens: examensLabo,
          },
          imagerie: {
            examens: examensImagerie,
          },
        },
        resume: {
          totalDossiersObstetricaux: dossiersObstetricaux.length,
          totalCPN: consultationsCPN.length,
          totalAccouchements: accouchements.length,
          totalConsultations: consultations.length,
          totalVaccinations: vaccinations.length,
          totalExamensLabo: examensLabo.length,
          totalExamensImagerie: examensImagerie.length,
        },
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des données complètes:', error);
      throw error;
    }
  }

  /**
   * Récupère les dossiers obstétricaux d'un patient
   */
  static async getDossiersObstetricaux(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('dossier_obstetrical')
        .select('*')
        .eq('patient_id', patientId)
        .order('date_entree', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers obstétricaux:', error);
      return [];
    }
  }

  /**
   * Récupère les consultations prénatales d'un patient
   */
  static async getConsultationsCPN(patientId: string) {
    try {
      // Récupérer via les dossiers obstétricaux
      const { data: dossiers, error: dossiersError } = await supabase
        .from('dossier_obstetrical')
        .select('id')
        .eq('patient_id', patientId);

      if (dossiersError) throw dossiersError;

      if (!dossiers || dossiers.length === 0) {
        return [];
      }

      const dossierIds = dossiers.map(d => d.id);

      const { data, error } = await supabase
        .from('consultation_prenatale')
        .select('*')
        .in('dossier_obstetrical_id', dossierIds)
        .order('date_consultation', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des CPN:', error);
      return [];
    }
  }

  /**
   * Récupère les vaccinations maternelles d'un patient
   */
  static async getVaccinationsMaternelles(patientId: string) {
    try {
      const { data: dossiers, error: dossiersError } = await supabase
        .from('dossier_obstetrical')
        .select('id')
        .eq('patient_id', patientId);

      if (dossiersError) throw dossiersError;

      if (!dossiers || dossiers.length === 0) {
        return [];
      }

      const dossierIds = dossiers.map(d => d.id);

      const { data, error } = await supabase
        .from('vaccination_maternelle')
        .select('*')
        .in('dossier_obstetrical_id', dossierIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des vaccinations maternelles:', error);
      return [];
    }
  }

  /**
   * Récupère les accouchements d'un patient
   */
  static async getAccouchements(patientId: string) {
    try {
      const { data: dossiers, error: dossiersError } = await supabase
        .from('dossier_obstetrical')
        .select('id')
        .eq('patient_id', patientId);

      if (dossiersError) throw dossiersError;

      if (!dossiers || dossiers.length === 0) {
        return [];
      }

      const dossierIds = dossiers.map(d => d.id);

      const { data, error } = await supabase
        .from('accouchement')
        .select('*')
        .in('dossier_obstetrical_id', dossierIds)
        .order('date_accouchement', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des accouchements:', error);
      return [];
    }
  }

  /**
   * Récupère les consultations générales d'un patient
   * Note: À adapter selon votre structure de table consultations
   */
  static async getConsultations(patientId: string) {
    try {
      // Vérifier si la table consultations existe
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .order('date_consultation', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = relation does not exist
        throw error;
      }

      return data || [];
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        // Table n'existe pas encore, retourner tableau vide
        return [];
      }
      console.error('Erreur lors de la récupération des consultations:', error);
      return [];
    }
  }

  /**
   * Récupère les vaccinations d'un patient
   * Note: À adapter selon votre structure de table vaccinations
   */
  static async getVaccinations(patientId: string) {
    try {
      // Utiliser le nom correct de la table : patient_vaccinations
      const { data, error } = await supabase
        .from('patient_vaccinations')
        .select('*')
        .eq('patient_id', patientId)
        .order('date_administration', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        return [];
      }
      console.error('Erreur lors de la récupération des vaccinations:', error);
      return [];
    }
  }

  /**
   * Récupère les examens de laboratoire d'un patient
   */
  static async getExamensLaboratoire(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('examens_laboratoire')
        .select('*')
        .eq('patient_id', patientId)
        .order('date_examen', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        return [];
      }
      console.error('Erreur lors de la récupération des examens laboratoire:', error);
      return [];
    }
  }

  /**
   * Récupère les examens d'imagerie d'un patient
   */
  static async getExamensImagerie(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('examens_imagerie')
        .select('*')
        .eq('patient_id', patientId)
        .order('date_examen', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        return [];
      }
      console.error('Erreur lors de la récupération des examens imagerie:', error);
      return [];
    }
  }

  /**
   * Vérifie si un patient a des enregistrements dans un module spécifique
   */
  static async hasModuleData(patientId: string, module: 'maternite' | 'consultations' | 'vaccinations' | 'laboratoire' | 'imagerie'): Promise<boolean> {
    try {
      switch (module) {
        case 'maternite':
          const dossiers = await this.getDossiersObstetricaux(patientId);
          return dossiers.length > 0;
        
        case 'consultations':
          const consultations = await this.getConsultations(patientId);
          return consultations.length > 0;
        
        case 'vaccinations':
          const vaccinations = await this.getVaccinations(patientId);
          return vaccinations.length > 0;
        
        case 'laboratoire':
          const examensLabo = await this.getExamensLaboratoire(patientId);
          return examensLabo.length > 0;
        
        case 'imagerie':
          const examensImg = await this.getExamensImagerie(patientId);
          return examensImg.length > 0;
        
        default:
          return false;
      }
    } catch (error) {
      console.error(`Erreur lors de la vérification du module ${module}:`, error);
      return false;
    }
  }

  /**
   * Récupère un résumé rapide des données d'un patient
   */
  static async getPatientSummary(patientId: string) {
    try {
      const patient = await PatientService.getPatientById(patientId);
      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      // Récupérer d'abord les IDs des dossiers obstétricaux
      const { data: dossiersData } = await supabase
        .from('dossier_obstetrical')
        .select('id')
        .eq('patient_id', patientId);
      
      const dossierIds = dossiersData?.map(d => d.id) || [];

      const [
        dossiersResult,
        cpnResult,
        accouchementsResult,
        consultationsResult,
        vaccinationsResult,
      ] = await Promise.all([
        supabase.from('dossier_obstetrical').select('id', { count: 'exact', head: true }).eq('patient_id', patientId),
        // Utiliser .in() avec les IDs récupérés au lieu de passer une requête
        dossierIds.length > 0
          ? supabase.from('consultation_prenatale').select('id', { count: 'exact', head: true }).in('dossier_obstetrical_id', dossierIds)
          : { count: 0, error: null },
        // Utiliser .in() avec les IDs récupérés au lieu de passer une requête
        dossierIds.length > 0
          ? supabase.from('accouchement').select('id', { count: 'exact', head: true }).in('dossier_obstetrical_id', dossierIds)
          : { count: 0, error: null },
        supabase.from('consultations').select('id', { count: 'exact', head: true }).eq('patient_id', patientId),
        // Utiliser le nom correct de la table : patient_vaccinations
        supabase.from('patient_vaccinations').select('id', { count: 'exact', head: true }).eq('patient_id', patientId),
      ]);

      return {
        patient,
        summary: {
          dossiersObstetricaux: dossiersResult.count || 0,
          cpn: cpnResult.count || 0,
          accouchements: accouchementsResult.count || 0,
          consultations: consultationsResult.count || 0,
          vaccinations: vaccinationsResult.count || 0,
        },
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération du résumé:', error);
      throw error;
    }
  }
}

