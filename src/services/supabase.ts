import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration Supabase via variables d'environnement
// IMPORTANT: Ne jamais hardcoder les clés dans le code !
// Support pour Vite (import.meta.env) et CRA (process.env) pour compatibilité
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_URL) || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_ANON_KEY) || '';

// Vérifier si les variables sont des placeholders ou manquantes
const isPlaceholder = (value: string) => {
  return value.includes('votre-projet') || value.includes('votre-anon-key') || value === '';
};

const hasValidConfig = supabaseUrl && supabaseAnonKey && !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

// Créer le client Supabase avec options optimisées
// Utiliser des valeurs par défaut si la configuration n'est pas valide pour éviter les erreurs
export const supabase: SupabaseClient = hasValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'logi-clinic-maternite',
        },
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

// Avertissement si la configuration n'est pas valide
if (!hasValidConfig) {
  console.warn('⚠️ Configuration Supabase non valide ou manquante!');
  console.warn('L\'application fonctionnera en mode limité. Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans le fichier .env');
}

// Test de connexion au démarrage (non-bloquant)
export const testSupabaseConnection = async (): Promise<boolean> => {
  // Ne pas tester si la configuration n'est pas valide
  if (!hasValidConfig) {
    console.warn('⚠️ Test de connexion Supabase ignoré - configuration non valide');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('patients')
      .select('count')
      .limit(1);
    
    if (error) {
      // Ne pas bloquer l'application si la table n'existe pas encore
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.warn('⚠️ Table "patients" n\'existe pas encore. Appliquez les migrations Supabase.');
      } else {
        console.error('❌ Erreur de connexion Supabase:', error);
      }
      return false;
    }
    
    console.log('✅ Connexion Supabase réussie!');
    return true;
  } catch (err: any) {
    // Ne pas bloquer l'application en cas d'erreur
    console.warn('⚠️ Erreur lors du test de connexion Supabase:', err?.message || err);
    return false;
  }
};

// Exécuter le test au chargement du module (non-bloquant, en arrière-plan)
if (typeof window !== 'undefined' && hasValidConfig) {
  // Exécuter de manière asynchrone sans bloquer le chargement
  setTimeout(() => {
    testSupabaseConnection().catch((err) => {
      // Ignorer silencieusement les erreurs pour ne pas bloquer l'application
      console.warn('Test de connexion Supabase échoué:', err?.message);
    });
  }, 1000); // Attendre 1 seconde après le chargement
}

// Types pour les patients
export interface Patient {
  id: string;
  identifiant: string;
  nom: string;
  prenom: string;
  sexe: 'Masculin' | 'Féminin';
  date_naissance: string;
  age: number;
  lieu_naissance?: string;
  nationalite?: string;
  adresse?: string;
  telephone?: string;
  telephone_proche?: string;
  personne_urgence?: string;
  profession?: string;
  situation_matrimoniale?: 'Célibataire' | 'Marié(e)' | 'Veuf(ve)' | 'Divorcé(e)';
  couverture_sante?: 'RAMU' | 'CNSS' | 'Gratuité' | 'Aucun';
  groupe_sanguin?: 'A' | 'B' | 'AB' | 'O' | 'Inconnu';
  allergies?: string;
  maladies_chroniques?: string;
  statut_vaccinal?: 'À jour' | 'Incomplet' | 'Inconnu';
  antecedents_medicaux?: string;
  prise_medicaments_reguliers?: boolean;
  medicaments_reguliers?: string;
  date_enregistrement: string;
  service_initial?: 'Médecine générale' | 'Maternité' | 'Pédiatrie' | 'Laboratoire' | 'Imagerie Médicale' | 'Pharmacie' | 'Vaccination' | 'Autres';
  statut?: 'Nouveau' | 'Connu';
  notes?: string;
  // Accompagnant
  accompagnant_nom?: string;
  accompagnant_prenoms?: string;
  accompagnant_filiation?: string;
  accompagnant_telephone?: string;
  accompagnant_quartier?: string;
  accompagnant_profession?: string;
  // Personne à prévenir
  personne_prevenir_option?: 'identique_accompagnant' | 'autre';
  personne_prevenir_nom?: string;
  personne_prevenir_prenoms?: string;
  personne_prevenir_filiation?: string;
  personne_prevenir_telephone?: string;
  personne_prevenir_quartier?: string;
  personne_prevenir_profession?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientFormData {
  identifiant: string;
  nom: string;
  prenom: string;
  sexe: 'Masculin' | 'Féminin';
  date_naissance: string;
  lieu_naissance?: string;
  nationalite?: string;
  adresse?: string;
  telephone?: string;
  telephone_proche?: string;
  personne_urgence?: string;
  profession?: string;
  situation_matrimoniale?: 'Célibataire' | 'Marié(e)' | 'Veuf(ve)' | 'Divorcé(e)';
  couverture_sante?: 'RAMU' | 'CNSS' | 'Gratuité' | 'Aucun';
  groupe_sanguin?: 'A' | 'B' | 'AB' | 'O' | 'Inconnu';
  allergies?: string;
  maladies_chroniques?: string;
  statut_vaccinal?: 'À jour' | 'Incomplet' | 'Inconnu';
  antecedents_medicaux?: string;
  prise_medicaments_reguliers?: boolean;
  medicaments_reguliers?: string;
  service_initial?: 'Médecine générale' | 'Maternité' | 'Pédiatrie' | 'Laboratoire' | 'Imagerie Médicale' | 'Pharmacie' | 'Vaccination' | 'Autres';
  statut?: 'Nouveau' | 'Connu';
  notes?: string;
  // Accompagnant
  accompagnant_nom?: string;
  accompagnant_prenoms?: string;
  accompagnant_filiation?: string;
  accompagnant_telephone?: string;
  accompagnant_quartier?: string;
  accompagnant_profession?: string;
  // Personne à prévenir
  personne_prevenir_option?: 'identique_accompagnant' | 'autre';
  personne_prevenir_nom?: string;
  personne_prevenir_prenoms?: string;
  personne_prevenir_filiation?: string;
  personne_prevenir_telephone?: string;
  personne_prevenir_quartier?: string;
  personne_prevenir_profession?: string;
}

// Types pour les fichiers joints
export interface PatientFile {
  id: string;
  patient_id: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  file_path: string;
  file_url?: string;
  description?: string;
  category?: 'carnet_medical' | 'document_identite' | 'prescription' | 'examen' | 'autre';
  uploaded_by?: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

// Types pour le suivi des étapes de prise en charge
export interface PatientCareTimeline {
  id: string;
  patient_id: string;
  etape: string;
  description?: string;
  statut: 'en_attente' | 'en_cours' | 'termine' | 'annule';
  date_debut?: string;
  date_fin?: string;
  date_prevue?: string;
  service?: string;
  medecin_responsable?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
