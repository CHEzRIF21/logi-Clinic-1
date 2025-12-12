// Types de rôles disponibles
export type UserRole = 
  | 'admin' 
  | 'medecin' 
  | 'secretaire' 
  | 'infirmier' 
  | 'pharmacien' 
  | 'comptable'
  | 'laborantin'
  | 'caissier';

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
  clinicCode: string; // Code de la clinique
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