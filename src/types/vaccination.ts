/**
 * Types pour le Module Vaccination - LogiClinic
 * Programme Élargi de Vaccination (PEV) - Afrique de l'Ouest
 */

// === VACCINS ET CALENDRIER ===

export interface Vaccine {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  voie_administration?: 'IM' | 'SC' | 'ID' | 'orale' | string;
  site_injection?: string;
  age_min_jours?: number;
  age_max_jours?: number | null;
  nb_doses: number;
  intervalle_min_jours?: number | null;
  intervalle_recommande_jours?: number | null;
  rappel_necessaire?: boolean;
  rappel_intervalle_jours?: number | null;
  medicament_id?: string | null;
  conservation_min_celsius?: number;
  conservation_max_celsius?: number;
  duree_apres_ouverture_heures?: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface VaccineSchedule {
  id: string;
  vaccine_id: string;
  dose_ordre: number;
  libelle_dose: string;
  age_recommande_jours: number;
  age_min_jours?: number | null;
  age_max_jours?: number | null;
  delai_rappel_jours?: number | null;
  obligatoire?: boolean;
  created_at: string;
  updated_at: string;
}

// === STATUT DE VACCINATION ===

export type VaccinationStatut = 'a_jour' | 'a_faire' | 'en_retard' | 'perdu_de_vue' | 'contre_indique' | 'rattrapage';

export interface PatientVaccinationStatus {
  patient_id: string;
  vaccine_id: string;
  statut: VaccinationStatut;
  prochaine_dose?: number;
  date_prevue?: string;
  jours_retard?: number;
  derniere_dose_date?: string;
  message?: string;
}

export interface PatientVaccination {
  id: string;
  patient_id: string;
  vaccine_id: string;
  schedule_id?: string | null;
  dose_ordre: number;
  date_administration: string;
  lieu?: string | null;
  numero_lot?: string | null;
  date_peremption?: string | null;
  vaccinateur?: string | null;
  vaccinateur_id?: string | null;
  effets_secondaires?: string | null;
  site_injection?: string;
  voie_administration?: 'IM' | 'SC' | 'ID' | 'orale';
  statut: 'valide' | 'annule';
  observation?: string | null;
  created_at: string;
  updated_at: string;
}

// === CHAÎNE DE FROID ===

export interface RelevéTemperature {
  id: string;
  refrigerateur_id: string;
  refrigerateur_nom: string;
  date: string;
  heure: 'matin' | 'soir';
  temperature_celsius: number;
  est_conforme: boolean;
  alerte?: string | null;
  enregistre_par: string;
  enregistre_par_id?: string | null;
  actions_correctives?: string | null;
  created_at: string;
}

export interface Refrigerateur {
  id: string;
  nom: string;
  emplacement: string;
  temperature_min: number;
  temperature_max: number;
  actif: boolean;
  derniere_temperature?: number;
  derniere_lecture?: string;
  statut_alerte: 'normal' | 'attention' | 'critique';
}

// === GESTION DES STOCKS VACCINS ===

export interface LotVaccin {
  id: string;
  vaccine_id: string;
  vaccin_libelle: string;
  medicament_id: string;
  numero_lot: string;
  date_fabrication?: string;
  date_expiration: string;
  quantite_initiale: number;
  quantite_disponible: number;
  quantite_utilisee: number;
  quantite_perdue: number;
  motif_perte?: string;
  flacon_ouvert?: boolean;
  date_ouverture?: string;
  heure_limite_utilisation?: string;
  fournisseur?: string;
  prix_unitaire_xof?: number;
  magasin: 'central' | 'detail';
  statut: 'actif' | 'epuise' | 'expire' | 'rappele';
  created_at: string;
  updated_at: string;
}

export interface FlaconOuvert {
  id: string;
  lot_id: string;
  vaccine_id: string;
  vaccin_libelle: string;
  numero_lot: string;
  date_ouverture: string;
  heure_ouverture: string;
  doses_restantes: number;
  doses_initiales: number;
  heure_limite: string;
  est_utilisable: boolean;
  ouvert_par: string;
}

export interface RappelLot {
  id: string;
  numero_lot: string;
  vaccine_id: string;
  raison: string;
  date_rappel: string;
  fabricant?: string;
  patients_affectes: {
    patient_id: string;
    patient_nom: string;
    date_vaccination: string;
  }[];
  actions_requises?: string;
  statut: 'en_cours' | 'traite';
}

// === MAPI - Manifestations Adverses Post-Immunisation ===

export interface MAPI {
  id: string;
  patient_vaccination_id: string;
  patient_id: string;
  patient_nom: string;
  vaccine_id: string;
  vaccin_libelle: string;
  numero_lot: string;
  date_vaccination: string;
  date_survenue: string;
  delai_heures: number;
  type: MAPIType;
  gravite: 'legere' | 'moderee' | 'severe' | 'deces';
  description: string;
  symptomes: string[];
  traitement_administre?: string;
  evolution: 'guerison' | 'sequelles' | 'deces' | 'en_cours';
  hospitalisation: boolean;
  duree_hospitalisation_jours?: number;
  declarant: string;
  declarant_id?: string | null;
  date_declaration: string;
  transmis_niveau_superieur: boolean;
  date_transmission?: string;
  actions_prises?: string;
  created_at: string;
  updated_at: string;
}

export type MAPIType = 
  | 'fievre_elevee'
  | 'reaction_locale_severe'
  | 'abces'
  | 'lymphadenite_bcg'
  | 'choc_anaphylactique'
  | 'convulsions'
  | 'encephalopathie'
  | 'paralysie_flasque'
  | 'autre';

// === RAPPELS ET CAMPAGNES SMS ===

export interface VaccinationReminder {
  id: string;
  patient_id: string;
  patient_nom?: string;
  patient_telephone?: string;
  vaccine_id: string;
  vaccin_libelle?: string;
  schedule_id?: string | null;
  dose_ordre: number;
  planned_at: string;
  channel: 'sms' | 'whatsapp' | 'notification' | 'email' | 'appel';
  message?: string;
  statut: 'planifie' | 'envoye' | 'delivre' | 'echoue' | 'annule' | 'manque';
  tentatives?: number;
  derniere_tentative?: string;
  erreur?: string;
  details?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampagneVaccination {
  id: string;
  nom: string;
  description?: string;
  date_debut: string;
  date_fin: string;
  vaccins_cibles: string[];
  age_min_mois?: number;
  age_max_mois?: number;
  zone_geographique?: string;
  objectif_couverture: number;
  population_cible: number;
  vaccinations_realisees: number;
  taux_couverture: number;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
  created_at: string;
  updated_at: string;
}

export interface ModeleSMS {
  id: string;
  type: 'rappel_rdv' | 'rappel_retard' | 'confirmation' | 'campagne';
  libelle: string;
  contenu: string;
  variables: string[];
  actif: boolean;
}

// === STATISTIQUES ET RAPPORTS ===

export interface StatistiquesVaccination {
  periode: {
    debut: string;
    fin: string;
  };
  total_doses: number;
  total_patients: number;
  par_vaccin: {
    vaccine_id: string;
    libelle: string;
    doses: number;
    pourcentage: number;
  }[];
  par_tranche_age: {
    tranche: string;
    patients: number;
    doses: number;
    couverture: number;
  }[];
  taux_couverture_global: number;
  rendez_vous: {
    honores: number;
    manques: number;
    taux_presence: number;
  };
  perdus_de_vue: number;
  mapi_declares: number;
  taux_perte_vaccins: number;
}

