// Types de rôles disponibles (LogiClinic)
export type UserRole = 
  | 'super_admin'             // Super Admin (gestion cliniques et agents)
  | 'admin'                    // Administrateur Clinique
  | 'medecin'                  // Médecin
  | 'infirmier'                // Infirmier
  | 'sage_femme'               // Sage-femme
  | 'pharmacien'               // Pharmacien
  | 'technicien_labo'          // Technicien de Laboratoire
  | 'laborantin'               // Laborantin (alias technicien labo)
  | 'imagerie'                 // Imagerie / Échographie
  | 'caissier'                 // Caissier
  | 'comptable'                // Comptable
  | 'receptionniste'           // Réceptionniste / Accueil
  | 'aide_soignant'            // Aide-soignante (mêmes accès que réceptionniste)
  | 'secretaire'               // Secrétaire
  | 'auditeur';                // Auditeur / Direction

// Modules disponibles dans l'application
export type ModulePermission = 
  | 'consultations'
  | 'patients'
  | 'pharmacie'
  | 'maternite'
  | 'laboratoire'
  | 'imagerie'
  | 'vaccination'
  | 'caisse'
  | 'rendezvous'
  | 'stock'
  | 'parametres'
  | 'utilisateurs';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  nom: string;
  prenom: string;
  clinicCode?: string; // Code de la clinique (vide pour super_admin)
  clinicId?: string; // ID de la clinique dans la base de données
  permissions: ModulePermission[]; // Modules accessibles
  status: 'actif' | 'inactif' | 'suspendu';
}

export interface LoginCredentials {
  clinicCode: string; // Code clinique
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  clinicCode: string;
} 