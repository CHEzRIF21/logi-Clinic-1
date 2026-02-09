import { supabase, Patient, PatientFormData, PatientFile, PatientCareTimeline } from './supabase';
import { getMyClinicId } from './clinicService';

export class PatientService {
  // Récupérer tous les patients (filtrés par clinic_id)
  static async getAllPatients(): Promise<Patient[]> {
    try {
      const clinicId = await getMyClinicId();
      
      if (!clinicId) {
        throw new Error('Contexte de clinique manquant. Veuillez vous reconnecter.');
      }
      
      // Toujours filtrer par clinic_id
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('nom', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des patients:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getAllPatients:', error);
      throw error;
    }
  }

  // Récupérer un patient par ID
  static async getPatientById(id: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du patient:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans getPatientById:', error);
      throw error;
    }
  }

  // Récupérer un patient par identifiant
  static async getPatientByIdentifiant(identifiant: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('identifiant', identifiant)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du patient:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans getPatientByIdentifiant:', error);
      throw error;
    }
  }

  // Rechercher des patients (filtrés par clinic_id)
  static async searchPatients(query: string): Promise<Patient[]> {
    try {
      const clinicId = await getMyClinicId();
      
      if (!clinicId) {
        throw new Error('Contexte de clinique manquant. Veuillez vous reconnecter.');
      }
      
      // Toujours filtrer par clinic_id
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,identifiant.ilike.%${query}%`)
        .order('nom', { ascending: true });

      if (error) {
        console.error('Erreur lors de la recherche des patients:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans searchPatients:', error);
      throw error;
    }
  }

  // Créer un nouveau patient
  static async createPatient(patientData: PatientFormData): Promise<Patient> {
    try {
      // Générer un identifiant unique si non fourni
      if (!patientData.identifiant || patientData.identifiant.trim() === '') {
        const clinicId = await getMyClinicId();
        const count = await this.getPatientsCount();
        const generatedIdentifiant = `PAT${String(count + 1).padStart(3, '0')}`;
        
        // Vérifier l'unicité globale de l'identifiant
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id, identifiant, clinic_id')
          .eq('identifiant', generatedIdentifiant)
          .maybeSingle();
        
        if (existingPatient) {
          // Si l'identifiant existe déjà, générer un nouveau avec UUID partiel pour garantir l'unicité
          // Utiliser les 8 premiers caractères d'un UUID pour garantir l'unicité
          const uuidPart = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
          patientData.identifiant = `PAT${uuidPart}`;
        } else {
          patientData.identifiant = generatedIdentifiant;
        }
      }

      // Liste des champs requis qui ne doivent pas être null
      const requiredFields = ['identifiant', 'nom', 'prenom', 'date_naissance', 'personne_urgence'];
      
      // Préparer les données pour l'insertion
      const dataToInsert: any = {};
      
      // Traiter chaque champ
      Object.keys(patientData).forEach(key => {
        const value = (patientData as any)[key];
        
        // Ignorer les champs undefined (ne pas les inclure dans l'insertion)
        if (value === undefined) {
          return;
        }
        
        // Pour les champs requis, garder la valeur même si vide
        if (requiredFields.includes(key)) {
          dataToInsert[key] = value;
        } 
        // Pour les champs optionnels null, les inclure explicitement comme null
        else if (value === null) {
          dataToInsert[key] = null;
        }
        // Pour les chaînes vides dans les champs optionnels, convertir en null
        else if (value === '') {
          dataToInsert[key] = null;
        }
        // Pour les booléens, garder la valeur
        else if (typeof value === 'boolean') {
          dataToInsert[key] = value;
        }
        // Pour les autres valeurs, garder telles quelles
        else {
          dataToInsert[key] = value;
        }
      });

      // Validation des champs requis
      if (!dataToInsert.nom || !dataToInsert.prenom || !dataToInsert.date_naissance || !dataToInsert.personne_urgence) {
        throw new Error('Les champs nom, prénom, date de naissance et personne d\'urgence sont requis');
      }

      // Ajouter clinic_id (OBLIGATOIRE pour l'isolation multi-tenant)
      const clinicId = await getMyClinicId();
      if (!clinicId) {
        throw new Error('Clinic ID manquant. Impossible de créer un patient sans clinic_id.');
      }
      dataToInsert.clinic_id = clinicId;

      // Vérifier qu'un patient avec le même nom, prénom ET date de naissance existe déjà dans cette clinique
      const nomNormalise = dataToInsert.nom.trim().toUpperCase();
      const prenomNormalise = dataToInsert.prenom.trim().toUpperCase();
      
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .ilike('nom', nomNormalise)
        .ilike('prenom', prenomNormalise)
        .eq('date_naissance', dataToInsert.date_naissance)
        .maybeSingle();

      // Si un patient existe avec le même nom, prénom et date de naissance, mettre à jour au lieu de créer
      if (existingPatient) {
        console.log(`Patient existant trouvé (ID: ${existingPatient.id}), mise à jour au lieu de création`);
        
        // Fusionner les données : garder les valeurs existantes si les nouvelles sont vides/null/undefined
        const mergedData: any = {};
        
        // Pour chaque champ du formulaire, fusionner intelligemment
        Object.keys(patientData).forEach(key => {
          const newValue = (patientData as any)[key];
          const existingValue = (existingPatient as any)[key];
          
          // Si la nouvelle valeur est définie et non vide, l'utiliser
          // Sinon, garder la valeur existante
          if (newValue !== undefined && newValue !== null && newValue !== '') {
            mergedData[key] = newValue;
          } else if (existingValue !== undefined && existingValue !== null) {
            mergedData[key] = existingValue;
          }
        });
        
        // S'assurer que les champs requis sont présents
        if (!mergedData.nom) mergedData.nom = existingPatient.nom;
        if (!mergedData.prenom) mergedData.prenom = existingPatient.prenom;
        if (!mergedData.date_naissance) mergedData.date_naissance = existingPatient.date_naissance;
        if (!mergedData.identifiant) mergedData.identifiant = existingPatient.identifiant;
        
        // Mettre à jour le patient existant
        return await this.updatePatient(existingPatient.id, mergedData);
      }

      console.log('Données à insérer:', JSON.stringify(dataToInsert, null, 2));

      // Si erreur de colonne manquante, retirer les nouveaux champs et réessayer
      const newFields = [
        'accompagnant_nom', 'accompagnant_prenoms', 'accompagnant_filiation',
        'accompagnant_telephone', 'accompagnant_quartier', 'accompagnant_profession',
        'personne_prevenir_option', 'personne_prevenir_nom', 'personne_prevenir_prenoms',
        'personne_prevenir_filiation', 'personne_prevenir_telephone', 'personne_prevenir_quartier',
        'personne_prevenir_profession'
      ];
      
      let dataToInsertFinal = { ...dataToInsert };
      let retryWithoutNewFields = false;
      let maxRetries = 3;
      let retryCount = 0;
      let lastError: any = null;

      // Boucle de retry pour gérer les conditions de course
      let data: any = null;
      let error: any = null;

      while (retryCount < maxRetries) {
        // Si erreur de duplication précédente, générer un nouvel identifiant
        if (lastError?.code === '23505' && lastError?.message?.includes('identifiant')) {
          const count = await this.getPatientsCount();
          const uuidPart = crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
          dataToInsertFinal.identifiant = `PAT${String(count + 1).padStart(3, '0')}-${uuidPart}`;
          
          // S'assurer que clinic_id est toujours présent
          if (!dataToInsertFinal.clinic_id) {
            const clinicId = await getMyClinicId();
            if (clinicId) {
              dataToInsertFinal.clinic_id = clinicId;
            }
          }
        }

        const result = await supabase
          .from('patients')
          .insert([dataToInsertFinal])
          .select()
          .single();

        data = result.data;
        error = result.error;

        // Si succès ou erreur non liée à la duplication, sortir de la boucle
        if (!error || (error.code !== '23505' || !error.message?.includes('identifiant'))) {
          break;
        }

        lastError = error;
        retryCount++;

        // Attendre un peu avant de réessayer (éviter les collisions simultanées)
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
      }

      if (error) {
        console.error('Erreur Supabase lors de la création du patient:', error);
        console.error('Code erreur:', error.code);
        console.error('Message erreur:', error.message);
        console.error('Détails:', error.details);
        console.error('Hint:', error.hint);
        console.error('Données envoyées:', JSON.stringify(dataToInsertFinal, null, 2));
        
        // Si l'erreur indique qu'une colonne n'existe pas, retirer les nouveaux champs
        if (error.message && (error.message.includes('column') || error.message.includes('does not exist') || error.message.includes('n\'existe pas'))) {
          console.warn('Colonnes manquantes détectées, retrait des nouveaux champs et nouvelle tentative...');
          // Retirer les nouveaux champs
          newFields.forEach(field => {
            delete dataToInsertFinal[field];
          });
          retryWithoutNewFields = true;
        } else {
          // Message d'erreur plus explicite
          let errorMessage = 'Erreur lors de la création du patient';
          if (error.code === '23505') {
            errorMessage = 'Un patient avec cet identifiant existe déjà';
          } else if (error.code === '23503') {
            errorMessage = 'Erreur de référence (clé étrangère)';
          } else if (error.code === '23502') {
            errorMessage = 'Un champ requis est manquant';
          } else if (error.message && error.message.includes('row-level security')) {
            errorMessage = 'Erreur de sécurité (RLS) : Les politiques de sécurité de la base de données bloquent cette opération. Veuillez appliquer les migrations SQL dans Supabase (fichier: apply_all_migrations_and_rls.sql).';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          throw new Error(`${errorMessage}${error.details ? `: ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`);
        }
      }

      // Si on doit réessayer sans les nouveaux champs
      if (retryWithoutNewFields) {
        console.log('Nouvelle tentative sans les nouveaux champs:', JSON.stringify(dataToInsertFinal, null, 2));
        const { data: retryData, error: retryError } = await supabase
          .from('patients')
          .insert([dataToInsertFinal])
          .select()
          .single();

        if (retryError) {
          console.error('Erreur lors de la nouvelle tentative:', retryError);
          let errorMessage = 'Erreur lors de la création du patient';
          if (retryError.code === '23505') {
            errorMessage = 'Un patient avec cet identifiant existe déjà';
          } else if (retryError.code === '23502') {
            errorMessage = 'Un champ requis est manquant';
          } else if (retryError.message && retryError.message.includes('row-level security')) {
            errorMessage = 'Erreur de sécurité (RLS) : Les politiques de sécurité de la base de données bloquent cette opération. Veuillez appliquer les migrations SQL dans Supabase (fichier: apply_all_migrations_and_rls.sql).';
          } else if (retryError.message) {
            errorMessage = retryError.message;
          }
          const migrationNote = ' Appliquez la migration add_patient_accompagnant_personne_prevenir dans Supabase pour activer les champs accompagnant et personne à prévenir.';
          throw new Error(`${errorMessage}.${migrationNote}`);
        }
        
        return retryData;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans createPatient:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur inconnue lors de la création du patient');
    }
  }

  // Mettre à jour un patient
  static async updatePatient(id: string, patientData: Partial<PatientFormData>): Promise<Patient> {
    try {
      // Récupérer le patient actuel pour fusionner les données
      const { data: currentPatient, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentPatient) {
        throw new Error('Patient non trouvé');
      }

      // Fusionner intelligemment les données : garder les nouvelles valeurs si elles sont définies et non vides
      const mergedData: any = { ...currentPatient };
      
      Object.keys(patientData).forEach(key => {
        const newValue = (patientData as any)[key];
        const currentValue = (currentPatient as any)[key];
        
        // Si la nouvelle valeur est définie et non vide, l'utiliser
        // Sinon, garder la valeur existante
        if (newValue !== undefined && newValue !== null && newValue !== '') {
          mergedData[key] = newValue;
        } else if (currentValue !== undefined && currentValue !== null) {
          mergedData[key] = currentValue;
        }
      });

      // Ne pas mettre à jour les champs système
      delete mergedData.id;
      delete mergedData.created_at;
      delete mergedData.clinic_id; // Ne pas modifier le clinic_id
      mergedData.updated_at = new Date().toISOString();

      // Si le nom ou prénom est modifié, vérifier qu'il n'y a pas de doublon dans la même clinique
      if (patientData.nom || patientData.prenom) {
        const clinicId = await getMyClinicId();
        if (clinicId) {
          const nomAVerifier = (mergedData.nom || '').trim().toUpperCase();
          const prenomAVerifier = (mergedData.prenom || '').trim().toUpperCase();

          if (nomAVerifier && prenomAVerifier) {
            const { data: existingPatientByName } = await supabase
              .from('patients')
              .select('id, identifiant, nom, prenom')
              .eq('clinic_id', clinicId)
              .neq('id', id) // Exclure le patient actuel
              .ilike('nom', nomAVerifier)
              .ilike('prenom', prenomAVerifier)
              .maybeSingle();

            if (existingPatientByName) {
              throw new Error(
                `Un patient avec le nom "${mergedData.nom}" et le prénom "${mergedData.prenom}" existe déjà dans cette clinique (Identifiant: ${existingPatientByName.identifiant}). ` +
                `Un patient ne peut pas avoir deux dossiers d'enregistrement dans la même clinique.`
              );
            }
          }
        }
      }

      const { data, error } = await supabase
        .from('patients')
        .update(mergedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du patient:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans updatePatient:', error);
      throw error;
    }
  }

  // Supprimer un patient
  static async deletePatient(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du patient:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur dans deletePatient:', error);
      throw error;
    }
  }

  // Compter le nombre total de patients (filtrés par clinic_id)
  static async getPatientsCount(): Promise<number> {
    try {
      const clinicId = await getMyClinicId();
      
      if (!clinicId) {
        throw new Error('Contexte de clinique manquant. Veuillez vous reconnecter.');
      }
      
      // Toujours filtrer par clinic_id
      const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId);

      if (error) {
        console.error('Erreur lors du comptage des patients:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Erreur dans getPatientsCount:', error);
      throw error;
    }
  }

  // Récupérer les statistiques des patients
  static async getPatientStats() {
    try {
      const clinicId = await getMyClinicId();
      
      if (!clinicId) {
        throw new Error('Contexte de clinique manquant. Veuillez vous reconnecter.');
      }
      
      // Toujours filtrer par clinic_id
      const { data, error } = await supabase
        .from('patients')
        .select('sexe, couverture_sante, service_initial, statut')
        .eq('clinic_id', clinicId);

      if (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        parSexe: {
          masculin: data?.filter(p => p.sexe === 'Masculin').length || 0,
          feminin: data?.filter(p => p.sexe === 'Féminin').length || 0,
        },
        parCouverture: {
          ramu: data?.filter(p => p.couverture_sante === 'RAMU').length || 0,
          cnss: data?.filter(p => p.couverture_sante === 'CNSS').length || 0,
          gratuite: data?.filter(p => p.couverture_sante === 'Gratuité').length || 0,
          aucun: data?.filter(p => p.couverture_sante === 'Aucun').length || 0,
        },
        parService: {
          medecine: data?.filter(p => p.service_initial === 'Médecine générale').length || 0,
          maternite: data?.filter(p => p.service_initial === 'Maternité').length || 0,
          pediatrie: data?.filter(p => p.service_initial === 'Pédiatrie').length || 0,
          autres: data?.filter(p => p.service_initial === 'Autres').length || 0,
        },
        parStatut: {
          nouveau: data?.filter(p => p.statut === 'Nouveau').length || 0,
          connu: data?.filter(p => p.statut === 'Connu').length || 0,
        },
      };

      return stats;
    } catch (error) {
      console.error('Erreur dans getPatientStats:', error);
      throw error;
    }
  }

  // Récupérer les patients par service
  static async getPatientsByService(service: string): Promise<Patient[]> {
    try {
      const clinicId = await getMyClinicId();
      
      if (!clinicId) {
        throw new Error('Contexte de clinique manquant. Veuillez vous reconnecter.');
      }
      
      // Toujours filtrer par clinic_id
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('service_initial', service)
        .order('nom', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des patients par service:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getPatientsByService:', error);
      throw error;
    }
  }

  // Récupérer les patients par statut
  static async getPatientsByStatus(status: string): Promise<Patient[]> {
    try {
      const clinicId = await getMyClinicId();
      
      if (!clinicId) {
        throw new Error('Contexte de clinique manquant. Veuillez vous reconnecter.');
      }
      
      // Toujours filtrer par clinic_id
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('statut', status)
        .order('nom', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des patients par statut:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getPatientsByStatus:', error);
      throw error;
    }
  }

  // ========== Gestion des fichiers ==========

  // Récupérer les fichiers d'un patient
  static async getPatientFiles(patientId: string): Promise<PatientFile[]> {
    try {
      const { data, error } = await supabase
        .from('patient_files')
        .select('*')
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des fichiers:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getPatientFiles:', error);
      throw error;
    }
  }

  // Télécharger un fichier pour un patient
  static async uploadPatientFile(
    patientId: string,
    file: File,
    category: 'carnet_medical' | 'document_identite' | 'prescription' | 'examen' | 'autre' = 'autre',
    description?: string
  ): Promise<PatientFile> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `patient-files/${fileName}`;

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erreur lors du téléchargement du fichier:', uploadError);
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('patient-files')
        .getPublicUrl(filePath);

      // Enregistrer dans la base de données
      const { data, error: dbError } = await supabase
        .from('patient_files')
        .insert({
          patient_id: patientId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
          file_url: urlData.publicUrl,
          category,
          description,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Erreur lors de l\'enregistrement du fichier:', dbError);
        throw dbError;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans uploadPatientFile:', error);
      throw error;
    }
  }

  // Supprimer un fichier
  static async deletePatientFile(fileId: string): Promise<void> {
    try {
      // Récupérer les informations du fichier pour supprimer du storage
      const { data: fileData, error: fetchError } = await supabase
        .from('patient_files')
        .select('file_path')
        .eq('id', fileId)
        .single();

      if (fetchError) {
        console.error('Erreur lors de la récupération du fichier:', fetchError);
        throw fetchError;
      }

      // Supprimer du storage si le chemin existe
      if (fileData?.file_path) {
        const { error: storageError } = await supabase.storage
          .from('patient-files')
          .remove([fileData.file_path]);

        if (storageError) {
          console.warn('Erreur lors de la suppression du fichier du storage:', storageError);
        }
      }

      // Supprimer de la base de données
      const { error: dbError } = await supabase
        .from('patient_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Erreur lors de la suppression du fichier:', dbError);
        throw dbError;
      }
    } catch (error) {
      console.error('Erreur dans deletePatientFile:', error);
      throw error;
    }
  }

  // ========== Gestion du suivi des étapes ==========

  // Récupérer le suivi des étapes d'un patient
  static async getPatientCareTimeline(patientId: string): Promise<PatientCareTimeline[]> {
    try {
      const { data, error } = await supabase
        .from('patient_care_timeline')
        .select('*')
        .eq('patient_id', patientId)
        .order('date_debut', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération du suivi:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur dans getPatientCareTimeline:', error);
      throw error;
    }
  }

  // Ajouter une étape de prise en charge
  static async addCareTimelineStep(
    patientId: string,
    stepData: {
      etape: string;
      description?: string;
      statut?: 'en_attente' | 'en_cours' | 'termine' | 'annule';
      date_debut?: string;
      date_fin?: string;
      date_prevue?: string;
      service?: string;
      medecin_responsable?: string;
      notes?: string;
    }
  ): Promise<PatientCareTimeline> {
    try {
      const { data, error } = await supabase
        .from('patient_care_timeline')
        .insert({
          patient_id: patientId,
          ...stepData,
          statut: stepData.statut || 'en_attente',
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'ajout de l\'étape:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans addCareTimelineStep:', error);
      throw error;
    }
  }

  // Mettre à jour une étape de prise en charge
  static async updateCareTimelineStep(
    stepId: string,
    stepData: Partial<{
      etape: string;
      description: string;
      statut: 'en_attente' | 'en_cours' | 'termine' | 'annule';
      date_debut: string;
      date_fin: string;
      date_prevue: string;
      service: string;
      medecin_responsable: string;
      notes: string;
    }>
  ): Promise<PatientCareTimeline> {
    try {
      const { data, error } = await supabase
        .from('patient_care_timeline')
        .update(stepData)
        .eq('id', stepId)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour de l\'étape:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur dans updateCareTimelineStep:', error);
      throw error;
    }
  }

  // Supprimer une étape de prise en charge
  static async deleteCareTimelineStep(stepId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('patient_care_timeline')
        .delete()
        .eq('id', stepId);

      if (error) {
        console.error('Erreur lors de la suppression de l\'étape:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur dans deleteCareTimelineStep:', error);
      throw error;
    }
  }
}
