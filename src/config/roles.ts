/**
 * Configuration centralisée des rôles LogiClinic
 * Utilisé pour les formulaires d'inscription et de gestion des utilisateurs
 */

import { UserRole } from '../types/auth';
import { RoleUtilisateur, getRoleLabel } from '../types/permissions';

/**
 * Mapping rôle venant de la base (users.role) → UserRole frontend.
 * Inclut les role_code standard (IMAGERIE, INFIRMIER, ...) et les anciens codes métier
 * (IMAGING_TECH, NURSE, MIDWIFE, LAB_TECH, PHARMACIST, FINANCE) pour affichage correct.
 */
export const DB_ROLE_TO_USER_ROLE: Record<string, UserRole> = {
  SUPER_ADMIN: 'admin',
  CLINIC_ADMIN: 'admin',
  ADMIN: 'admin',
  MEDECIN: 'medecin',
  INFIRMIER: 'infirmier',
  SAGE_FEMME: 'sage_femme',
  PHARMACIEN: 'pharmacien',
  TECHNICIEN_LABO: 'technicien_labo',
  LABORANTIN: 'laborantin',
  IMAGERIE: 'imagerie',
  CAISSIER: 'caissier',
  COMPTABLE: 'comptable',
  RECEPTIONNISTE: 'receptionniste',
  AIDE_SOIGNANT: 'aide_soignant',
  SECRETAIRE: 'secretaire',
  AUDITEUR: 'auditeur',
  // Anciens codes métier (script MAMELLES-001, etc.) → role_code LogiClinic
  IMAGING_TECH: 'imagerie',
  LAB_TECH: 'technicien_labo',
  MIDWIFE: 'sage_femme',
  NURSE: 'infirmier',
  PHARMACIST: 'pharmacien',
  FINANCE: 'caissier',
};

/**
 * Convertit un rôle venant de la base (users.role) en UserRole pour le frontend.
 * Si le rôle est inconnu, retourne 'receptionniste' (accès limité) au lieu d'afficher un rôle incorrect.
 */
export function dbRoleToUserRole(role: string | null | undefined): UserRole {
  if (role == null || role === '') return 'receptionniste';
  const key = role.toString().toUpperCase().replace(/-/g, '_');
  return DB_ROLE_TO_USER_ROLE[key] ?? 'receptionniste';
}

/**
 * Liste de tous les rôles disponibles avec leurs labels
 */
export const ALL_ROLES: Array<{ value: UserRole; label: string; description?: string }> = [
  {
    value: 'admin',
    label: 'Administrateur Clinique',
    description: 'Responsable du centre - Accès complet',
  },
  {
    value: 'medecin',
    label: 'Médecin',
    description: 'Prise en charge médicale - Diagnostic et prescription',
  },
  {
    value: 'infirmier',
    label: 'Infirmier',
    description: 'Soins et suivi - Constantes et soins',
  },
  {
    value: 'sage_femme',
    label: 'Sage-femme',
    description: 'Soins et suivi maternité - CPN, accouchements, post-partum',
  },
  {
    value: 'pharmacien',
    label: 'Pharmacien',
    description: 'Gestion médicaments - Stocks et délivrance',
  },
  {
    value: 'technicien_labo',
    label: 'Technicien de Laboratoire',
    description: 'Examens biologiques - Résultats laboratoire',
  },
  {
    value: 'imagerie',
    label: 'Imagerie médicale',
    description: 'Examens d\'imagerie - Échographie et imagerie médicale',
  },
  {
    value: 'caissier',
    label: 'Caissier',
    description: 'Facturation et paiements - Caisse et journal',
  },
  {
    value: 'receptionniste',
    label: 'Réceptionniste / Accueil',
    description: 'Enregistrement & RDV - Création patients et rendez-vous',
  },
  {
    value: 'aide_soignant',
    label: 'Aide-soignante',
    description: 'Mêmes accès que réceptionniste - Enregistrement & RDV à la réception',
  },
  {
    value: 'auditeur',
    label: 'Auditeur / Direction',
    description: 'Lecture stratégique - Rapports en lecture seule',
  },
];

/**
 * Mapping des rôles UserRole vers RoleUtilisateur
 *
 * Note: le rôle `super_admin` est un rôle plateforme (gestion multi-cliniques).
 * On le mappe sur le rôle métier `administrateur_clinique` pour la partie permissions.
 */
export const ROLE_TO_ROLE_UTILISATEUR: Record<UserRole, RoleUtilisateur> = {
  super_admin: 'administrateur_clinique',
  admin: 'administrateur_clinique',
  medecin: 'medecin',
  infirmier: 'infirmier',
  sage_femme: 'sage_femme',
  pharmacien: 'pharmacien',
  technicien_labo: 'technicien_labo',
  laborantin: 'laborantin',
  imagerie: 'imagerie',
  caissier: 'caissier',
  comptable: 'comptable',
  receptionniste: 'receptionniste',
  aide_soignant: 'receptionniste',
  secretaire: 'secretaire',
  auditeur: 'auditeur',
};

/**
 * Rôles disponibles pour l'inscription (exclut admin qui doit être créé manuellement)
 */
export const REGISTRATION_ROLES: Array<{ value: UserRole; label: string; description?: string }> = 
  ALL_ROLES.filter(role => role.value !== 'admin');

/**
 * Obtient le label d'un rôle
 */
export function getRoleLabelByValue(role: UserRole): string {
  const roleConfig = ALL_ROLES.find(r => r.value === role);
  return roleConfig?.label || role;
}

/**
 * Obtient la description d'un rôle
 */
export function getRoleDescription(role: UserRole): string | undefined {
  const roleConfig = ALL_ROLES.find(r => r.value === role);
  return roleConfig?.description;
}

