/**
 * Matrice de permissions par défaut pour les 9 rôles métier de LogiClinic
 * Basé sur le diagramme de spécification des rôles et permissions
 */

import { ModulePermission, ModuleName, PermissionAction } from '../types/modulePermissions';
import { UserRole } from '../types/auth';

/**
 * Permissions par défaut pour chaque rôle
 * Structure: Module -> Actions -> Sous-modules (optionnel)
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, ModulePermission[]> = {
  // Administrateur Clinique - Accès complet à tous les modules
  admin: [
    {
      module: 'dashboard',
      actions: ['read', 'write', 'delete', 'export', 'admin'],
      submodules: [
        { submodule: 'statistiques', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'graphiques', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'rapports', actions: ['read', 'write', 'delete', 'export', 'admin'] },
      ],
    },
    {
      module: 'gestion_patients',
      actions: ['read', 'write', 'delete', 'export', 'admin'],
      submodules: [
        { submodule: 'creation', actions: ['read', 'write', 'admin'] },
        { submodule: 'modification', actions: ['read', 'write', 'delete', 'admin'] },
        { submodule: 'dossier', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'historique', actions: ['read', 'export', 'admin'] },
        { submodule: 'export', actions: ['read', 'export', 'admin'] },
      ],
    },
    {
      module: 'consultations',
      actions: ['read', 'write', 'delete', 'export', 'admin'],
      submodules: [
        { submodule: 'liste', actions: ['read', 'export', 'admin'] },
        { submodule: 'historique', actions: ['read', 'export', 'admin'] },
        { submodule: 'details', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'prescriptions', actions: ['read', 'write', 'export', 'admin'] },
      ],
    },
    {
      module: 'pharmacie',
      actions: ['read', 'write', 'delete', 'export', 'admin'],
      submodules: [
        { submodule: 'dispensation', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'prescriptions', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'inventaire', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'alertes', actions: ['read', 'write', 'export', 'admin'] },
      ],
    },
    {
      module: 'laboratoire',
      actions: ['read', 'write', 'delete', 'export', 'admin'],
      submodules: [
        { submodule: 'demandes', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'resultats', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'validation', actions: ['read', 'write', 'admin'] },
        { submodule: 'rapports', actions: ['read', 'write', 'export', 'admin'] },
      ],
    },
    {
      module: 'imagerie',
      actions: ['read', 'write', 'delete', 'export', 'admin'],
      submodules: [
        { submodule: 'demandes', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'examens', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'annotations', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'rapports', actions: ['read', 'write', 'export', 'admin'] },
      ],
    },
    {
      module: 'caisse',
      actions: ['read', 'write', 'delete', 'export', 'admin'],
      submodules: [
        { submodule: 'tableau_bord', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'tickets', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'creation_facture', actions: ['read', 'write', 'admin'] },
        { submodule: 'paiements', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'journal', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'rapports', actions: ['read', 'write', 'export', 'admin'] },
        { submodule: 'cloture', actions: ['read', 'write', 'admin'] },
      ],
    },
    {
      module: 'bilan',
      actions: ['read', 'write', 'delete', 'export', 'admin'],
      submodules: [
        { submodule: 'creation', actions: ['read', 'write', 'admin'] },
        { submodule: 'consultation', actions: ['read', 'export', 'admin'] },
        { submodule: 'export', actions: ['read', 'export', 'admin'] },
      ],
    },
    {
      module: 'utilisateurs_permissions',
      actions: ['read', 'write', 'delete', 'export', 'admin'],
      submodules: [
        { submodule: 'gestion_utilisateurs', actions: ['read', 'write', 'delete', 'admin'] },
        { submodule: 'gestion_profils', actions: ['read', 'write', 'delete', 'admin'] },
        { submodule: 'configuration_permissions', actions: ['read', 'write', 'admin'] },
      ],
    },
  ],

  // Médecin - Patients (lecture seule), Consultations (diagnostic, prescription), Laboratoire/Imagerie (demande examens)
  medecin: [
    {
      module: 'gestion_patients',
      actions: ['read'],
      submodules: [
        { submodule: 'dossier', actions: ['read'] },
        { submodule: 'historique', actions: ['read'] },
      ],
    },
    {
      module: 'consultations',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'liste', actions: ['read'] },
        { submodule: 'historique', actions: ['read'] },
        { submodule: 'details', actions: ['read', 'write'] },
        { submodule: 'prescriptions', actions: ['read', 'write'] },
      ],
    },
    {
      module: 'laboratoire',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'demandes', actions: ['read', 'write'] },
        { submodule: 'resultats', actions: ['read'] },
      ],
    },
    {
      module: 'imagerie',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'demandes', actions: ['read', 'write'] },
        { submodule: 'examens', actions: ['read'] },
        { submodule: 'rapports', actions: ['read'] },
      ],
    },
    {
      module: 'pharmacie',
      actions: ['read'],
      submodules: [
        { submodule: 'prescriptions', actions: ['read'] },
        { submodule: 'inventaire', actions: ['read'] },
      ],
    },
  ],

  // Infirmier - Patients (lecture), Consultations (constantes, soins), Laboratoire/Imagerie (demande examens)
  infirmier: [
    {
      module: 'gestion_patients',
      actions: ['read'],
      submodules: [
        { submodule: 'dossier', actions: ['read'] },
        { submodule: 'historique', actions: ['read'] },
      ],
    },
    {
      module: 'consultations',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'liste', actions: ['read'] },
        { submodule: 'details', actions: ['read', 'write'] },
      ],
    },
    {
      module: 'laboratoire',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'demandes', actions: ['read', 'write'] },
        { submodule: 'resultats', actions: ['read'] },
      ],
    },
    {
      module: 'imagerie',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'demandes', actions: ['read', 'write'] },
        { submodule: 'examens', actions: ['read'] },
        { submodule: 'rapports', actions: ['read'] },
      ],
    },
  ],

  // Sage-femme - Même permissions que infirmier + accès maternité + Laboratoire/Imagerie (demande examens)
  sage_femme: [
    {
      module: 'gestion_patients',
      actions: ['read'],
      submodules: [
        { submodule: 'dossier', actions: ['read'] },
        { submodule: 'historique', actions: ['read'] },
      ],
    },
    {
      module: 'consultations',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'liste', actions: ['read'] },
        { submodule: 'details', actions: ['read', 'write'] },
      ],
    },
    {
      module: 'maternite',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'dossiers', actions: ['read', 'write'] },
        { submodule: 'cpn', actions: ['read', 'write'] },
        { submodule: 'accouchements', actions: ['read', 'write'] },
        { submodule: 'post_partum', actions: ['read', 'write'] },
      ],
    },
    {
      module: 'laboratoire',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'demandes', actions: ['read', 'write'] },
        { submodule: 'resultats', actions: ['read'] },
      ],
    },
    {
      module: 'imagerie',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'demandes', actions: ['read', 'write'] },
        { submodule: 'examens', actions: ['read'] },
        { submodule: 'rapports', actions: ['read'] },
      ],
    },
  ],

  // Pharmacien - Pharmacie (stocks, délivrance), Rapports pharmacie
  pharmacien: [
    {
      module: 'pharmacie',
      actions: ['read', 'write', 'export'],
      submodules: [
        { submodule: 'dispensation', actions: ['read', 'write', 'export'] },
        { submodule: 'prescriptions', actions: ['read', 'write'] },
        { submodule: 'inventaire', actions: ['read', 'write', 'export'] },
        { submodule: 'alertes', actions: ['read', 'write'] },
      ],
    },
    {
      module: 'stock_medicaments',
      actions: ['read', 'write', 'export'],
      submodules: [
        { submodule: 'inventaire', actions: ['read', 'write', 'export'] },
        { submodule: 'entrees', actions: ['read', 'write'] },
        { submodule: 'sorties', actions: ['read', 'write'] },
        { submodule: 'alertes', actions: ['read', 'write'] },
      ],
    },
    {
      module: 'bilan',
      actions: ['read', 'export'],
      submodules: [
        { submodule: 'consultation', actions: ['read', 'export'] },
        { submodule: 'export', actions: ['read', 'export'] },
      ],
    },
  ],

  // Technicien de Laboratoire - Laboratoire (résultats labo)
  technicien_labo: [
    {
      module: 'laboratoire',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'demandes', actions: ['read'] },
        { submodule: 'resultats', actions: ['read', 'write'] },
        { submodule: 'validation', actions: ['read', 'write'] },
      ],
    },
  ],

  // Imagerie / Échographie - Imagerie uniquement
  imagerie: [
    {
      module: 'imagerie',
      actions: ['read', 'write', 'export'],
      submodules: [
        { submodule: 'demandes', actions: ['read'] },
        { submodule: 'examens', actions: ['read', 'write', 'export'] },
        { submodule: 'annotations', actions: ['read', 'write'] },
        { submodule: 'rapports', actions: ['read', 'write', 'export'] },
      ],
    },
  ],

  // Caissier - Caisse (paiements, reçus), Journal caisse uniquement (pas de rapports financiers)
  caissier: [
    {
      module: 'caisse',
      actions: ['read', 'write', 'export'],
      submodules: [
        { submodule: 'tableau_bord', actions: ['read'] },
        { submodule: 'tickets', actions: ['read', 'write'] },
        { submodule: 'creation_facture', actions: ['read', 'write'] },
        { submodule: 'paiements', actions: ['read', 'write', 'export'] },
        { submodule: 'journal', actions: ['read', 'write', 'export'] },
      ],
    },
  ],

  // Réceptionniste / Accueil - Patients (création et modification), RDV
  receptionniste: [
    {
      module: 'gestion_patients',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'creation', actions: ['read', 'write'] },
        { submodule: 'modification', actions: ['read', 'write'] },
        { submodule: 'dossier', actions: ['read'] },
      ],
    },
    {
      module: 'rendez_vous',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'planification', actions: ['read', 'write'] },
        { submodule: 'gestion', actions: ['read', 'write'] },
        { submodule: 'annulation', actions: ['read', 'write'] },
      ],
    },
  ],

  // Auditeur / Direction - Lecture seule sur tous les modules + Rapports financiers
  auditeur: [
    {
      module: 'dashboard',
      actions: ['read', 'export'],
      submodules: [
        { submodule: 'statistiques', actions: ['read', 'export'] },
        { submodule: 'graphiques', actions: ['read', 'export'] },
        { submodule: 'rapports', actions: ['read', 'export'] },
      ],
    },
    {
      module: 'gestion_patients',
      actions: ['read'],
      submodules: [
        { submodule: 'dossier', actions: ['read'] },
        { submodule: 'historique', actions: ['read'] },
      ],
    },
    {
      module: 'consultations',
      actions: ['read'],
      submodules: [
        { submodule: 'liste', actions: ['read'] },
        { submodule: 'historique', actions: ['read'] },
        { submodule: 'details', actions: ['read'] },
      ],
    },
    {
      module: 'pharmacie',
      actions: ['read'],
      submodules: [
        { submodule: 'prescriptions', actions: ['read'] },
        { submodule: 'inventaire', actions: ['read'] },
      ],
    },
    {
      module: 'laboratoire',
      actions: ['read'],
      submodules: [
        { submodule: 'demandes', actions: ['read'] },
        { submodule: 'resultats', actions: ['read'] },
        { submodule: 'rapports', actions: ['read'] },
      ],
    },
    {
      module: 'imagerie',
      actions: ['read'],
      submodules: [
        { submodule: 'demandes', actions: ['read'] },
        { submodule: 'examens', actions: ['read'] },
        { submodule: 'rapports', actions: ['read'] },
      ],
    },
    {
      module: 'bilan',
      actions: ['read', 'export'],
      submodules: [
        { submodule: 'consultation', actions: ['read', 'export'] },
        { submodule: 'export', actions: ['read', 'export'] },
      ],
    },
    {
      module: 'caisse',
      actions: ['read', 'export'],
      submodules: [
        { submodule: 'rapports', actions: ['read', 'export'] },
        { submodule: 'journal', actions: ['read', 'export'] },
      ],
    },
  ],

  // Alias et nouveaux rôles
  laborantin: [], // Utilise les permissions de technicien_labo si défini dynamiquement
  comptable: [
    {
      module: 'dashboard',
      actions: ['read', 'export'],
      submodules: [
        { submodule: 'statistiques', actions: ['read', 'export'] },
        { submodule: 'rapports', actions: ['read', 'export'] },
      ],
    },
    {
      module: 'caisse',
      actions: ['read', 'export'],
      submodules: [
        { submodule: 'rapports', actions: ['read', 'export'] },
        { submodule: 'journal', actions: ['read', 'export'] },
      ],
    },
    {
      module: 'bilan',
      actions: ['read', 'export'],
      submodules: [
        { submodule: 'consultation', actions: ['read', 'export'] },
        { submodule: 'export', actions: ['read', 'export'] },
      ],
    },
    {
      module: 'pharmacie',
      actions: ['read'],
      submodules: [
        { submodule: 'inventaire', actions: ['read'] },
      ],
    },
  ],
  secretaire: [
    {
      module: 'dashboard',
      actions: ['read'],
      submodules: [
        { submodule: 'statistiques', actions: ['read'] },
      ],
    },
    {
      module: 'gestion_patients',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'creation', actions: ['read', 'write'] },
        { submodule: 'modification', actions: ['read'] },
        { submodule: 'dossier', actions: ['read'] },
      ],
    },
    {
      module: 'rendez_vous',
      actions: ['read', 'write'],
      submodules: [
        { submodule: 'calendrier', actions: ['read', 'write'] },
        { submodule: 'creation', actions: ['read', 'write'] },
      ],
    },
  ],
};

/**
 * Obtient les permissions par défaut pour un rôle donné
 */
export function getDefaultPermissionsForRole(role: UserRole): ModulePermission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

/**
 * Vérifie si un rôle a une permission spécifique
 */
export function roleHasPermission(
  role: UserRole,
  module: ModuleName,
  action: PermissionAction,
  submodule?: string
): boolean {
  const permissions = getDefaultPermissionsForRole(role);
  const modulePermission = permissions.find(p => p.module === module);
  
  if (!modulePermission) return false;
  
  // Vérifier l'action au niveau du module
  if (!modulePermission.actions.includes(action)) {
    return false;
  }
  
  // Si un sous-module est spécifié, vérifier aussi les permissions du sous-module
  if (submodule && modulePermission.submodules) {
    const subModulePermission = modulePermission.submodules.find(s => s.submodule === submodule);
    if (subModulePermission) {
      return subModulePermission.actions.includes(action);
    }
  }
  
  return true;
}

/**
 * Obtient la description d'un rôle
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: 'Responsable du centre - Accès complet à tous les modules',
    medecin: 'Prise en charge médicale - Diagnostic et prescription',
    infirmier: 'Soins et suivi - Constantes et soins',
    sage_femme: 'Soins et suivi maternité - CPN, accouchements, post-partum',
    pharmacien: 'Gestion médicaments - Stocks et délivrance',
    technicien_labo: 'Examens biologiques - Résultats laboratoire',
    laborantin: 'Examens biologiques - Résultats laboratoire',
    imagerie: 'Examens d\'imagerie - Échographie et imagerie médicale',
    caissier: 'Facturation et paiements - Caisse et journal',
    comptable: 'Gestion comptable - Rapports et finances',
    receptionniste: 'Enregistrement & RDV - Création patients et rendez-vous',
    secretaire: 'Accueil et secrétariat - Gestion administrative',
    auditeur: 'Lecture stratégique - Rapports en lecture seule',
  };
  return descriptions[role] || '';
}

