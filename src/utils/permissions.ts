import { User, ModulePermission } from '../types/auth';

/**
 * Vérifie si un utilisateur a accès à un module spécifique
 */
export function hasModuleAccess(user: User | null, module: ModulePermission): boolean {
  if (!user) return false;
  
  // L'admin a accès à tous les modules
  if (user.role === 'admin') {
    return true;
  }
  
  // Vérifier si le module est dans les permissions de l'utilisateur
  return user.permissions?.includes(module) ?? false;
}

/**
 * Vérifie si un utilisateur peut gérer les utilisateurs et permissions
 * Seul l'admin clinique peut faire cela
 */
export function canManageUsers(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'admin';
}

/**
 * Retourne la liste des modules accessibles pour un utilisateur
 */
export function getAccessibleModules(user: User | null): ModulePermission[] {
  if (!user) return [];
  
  // L'admin a accès à tous les modules
  if (user.role === 'admin') {
    return [
      'consultations',
      'patients',
      'pharmacie',
      'maternite',
      'laboratoire',
      'imagerie',
      'vaccination',
      'facturation',
      'caisse',
      'rendezvous',
      'stock',
      'parametres',
      'utilisateurs',
    ];
  }
  
  return user.permissions || [];
}

/**
 * Vérifie si l'utilisateur peut accéder aux paramètres
 */
export function canAccessSettings(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || hasModuleAccess(user, 'parametres');
}

