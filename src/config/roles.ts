/**
 * Configuration centralisée des rôles LogiClinic
 * Utilisé pour les formulaires d'inscription et de gestion des utilisateurs
 */

import { UserRole } from '../types/auth';
import { RoleUtilisateur, getRoleLabel } from '../types/permissions';

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
    label: 'Imagerie / Échographie',
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

