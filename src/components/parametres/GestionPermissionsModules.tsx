import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Alert,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Cancel,
  Security,
  AdminPanelSettings,
  SelectAll,
  Deselect,
  Restore,
} from '@mui/icons-material';
import {
  ModulePermission,
  ModuleName,
  PermissionAction,
  ALL_MODULES,
  PERMISSION_ACTIONS,
  ACTION_LABELS,
  getAllPermissions,
} from '../../types/modulePermissions';
import { ProfilUtilisateur, RoleUtilisateur } from '../../types/permissions';
import { getDefaultPermissionsForRole } from '../../config/defaultRolePermissions';
import { UserRole } from '../../types/auth';

interface GestionPermissionsModulesProps {
  profil: ProfilUtilisateur;
  onSave: (permissions: ModulePermission[]) => void;
  currentUserRole?: string; // Pour vérifier si l'utilisateur actuel est admin
}

// Mapping des rôles RoleUtilisateur vers UserRole
const roleMapping: Record<RoleUtilisateur, UserRole> = {
  administrateur_clinique: 'admin',
  administrateur: 'admin',
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

const GestionPermissionsModules: React.FC<GestionPermissionsModulesProps> = ({
  profil,
  onSave,
  currentUserRole,
}) => {
  const isCurrentUserAdmin = currentUserRole === 'admin';
  const isProfilAdmin = profil.isAdmin || profil.role === 'administrateur_clinique';

  // Obtenir les permissions par défaut pour ce rôle
  const defaultPermissions = roleMapping[profil.role] 
    ? getDefaultPermissionsForRole(roleMapping[profil.role])
    : [];

  // Initialiser les permissions : si admin, toutes les permissions, sinon celles du profil ou vides
  const [permissions, setPermissions] = useState<ModulePermission[]>(
    isProfilAdmin
      ? getAllPermissions()
      : profil.modulePermissions || defaultPermissions
  );

  // Si le profil est admin, désactiver la modification (admin a toujours toutes les permissions)
  const isReadOnly = isProfilAdmin;

  const toggleModuleAction = (module: ModuleName, action: PermissionAction) => {
    if (isReadOnly) return;

    setPermissions(prev => {
      const moduleIndex = prev.findIndex(p => p.module === module);
      
      if (moduleIndex === -1) {
        // Créer une nouvelle entrée pour ce module
        return [
          ...prev,
          {
            module,
            actions: [action],
          }
        ];
      }

      const updated = [...prev];
      const modulePermission = { ...updated[moduleIndex] };
      
      if (modulePermission.actions.includes(action)) {
        // Retirer l'action
        modulePermission.actions = modulePermission.actions.filter(a => a !== action);
      } else {
        // Ajouter l'action
        modulePermission.actions = [...modulePermission.actions, action].sort();
      }

      // Si plus d'actions, retirer le module
      if (modulePermission.actions.length === 0) {
        updated.splice(moduleIndex, 1);
        return updated;
      }

      updated[moduleIndex] = modulePermission;
      return updated;
    });
  };

  const toggleSubModuleAction = (
    module: ModuleName,
    submodule: string,
    action: PermissionAction
  ) => {
    if (isReadOnly) return;

    setPermissions(prev => {
      const moduleIndex = prev.findIndex(p => p.module === module);
      
      if (moduleIndex === -1) {
        // Créer le module avec le sous-module
        return [
          ...prev,
          {
            module,
            actions: [],
            submodules: [{
              submodule,
              actions: [action],
            }],
          }
        ];
      }

      const updated = [...prev];
      const modulePermission = { ...updated[moduleIndex] };
      
      if (!modulePermission.submodules) {
        modulePermission.submodules = [];
      }

      const subModuleIndex = modulePermission.submodules.findIndex(
        s => s.submodule === submodule
      );

      if (subModuleIndex === -1) {
        // Créer le sous-module
        modulePermission.submodules = [
          ...modulePermission.submodules,
          {
            submodule,
            actions: [action],
          }
        ];
      } else {
        const subModulePermission = { ...modulePermission.submodules[subModuleIndex] };
        
        if (subModulePermission.actions.includes(action)) {
          subModulePermission.actions = subModulePermission.actions.filter(a => a !== action);
        } else {
          subModulePermission.actions = [...subModulePermission.actions, action].sort();
        }

        if (subModulePermission.actions.length === 0) {
          modulePermission.submodules = modulePermission.submodules.filter(
            (_, i) => i !== subModuleIndex
          );
        } else {
          modulePermission.submodules[subModuleIndex] = subModulePermission;
        }
      }

      updated[moduleIndex] = modulePermission;
      return updated;
    });
  };

  const selectAllModuleActions = (module: ModuleName) => {
    if (isReadOnly) return;

    setPermissions(prev => {
      const moduleIndex = prev.findIndex(p => p.module === module);
      
      if (moduleIndex === -1) {
        return [
          ...prev,
          {
            module,
            actions: [...PERMISSION_ACTIONS],
          }
        ];
      }

      const updated = [...prev];
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        actions: [...PERMISSION_ACTIONS],
      };
      return updated;
    });
  };

  const deselectAllModuleActions = (module: ModuleName) => {
    if (isReadOnly) return;

    setPermissions(prev => prev.filter(p => p.module !== module));
  };

  const hasModuleAction = (module: ModuleName, action: PermissionAction): boolean => {
    const modulePermission = permissions.find(p => p.module === module);
    return modulePermission?.actions.includes(action) || false;
  };

  const hasSubModuleAction = (
    module: ModuleName,
    submodule: string,
    action: PermissionAction
  ): boolean => {
    const modulePermission = permissions.find(p => p.module === module);
    const subModulePermission = modulePermission?.submodules?.find(s => s.submodule === submodule);
    return subModulePermission?.actions.includes(action) || false;
  };

  const handleSave = () => {
    onSave(permissions);
  };

  const handleRestoreDefaults = () => {
    if (isReadOnly || !roleMapping[profil.role]) return;
    const defaults = getDefaultPermissionsForRole(roleMapping[profil.role]);
    setPermissions(defaults);
  };

  // Vérifier si une permission est recommandée par défaut pour ce rôle
  const isDefaultPermission = (module: ModuleName, action: PermissionAction, submodule?: string): boolean => {
    if (!defaultPermissions.length) return false;
    const defaultModule = defaultPermissions.find(p => p.module === module);
    if (!defaultModule) return false;
    
    if (!defaultModule.actions.includes(action)) return false;
    
    if (submodule && defaultModule.submodules) {
      const defaultSubmodule = defaultModule.submodules.find(s => s.submodule === submodule);
      if (defaultSubmodule) {
        return defaultSubmodule.actions.includes(action);
      }
    }
    
    return true;
  };

  if (!isCurrentUserAdmin) {
    return (
      <Alert severity="error">
        Accès refusé. Seul l'administrateur peut configurer les permissions.
      </Alert>
    );
  }

  return (
    <Box>
      {isProfilAdmin && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <AdminPanelSettings />
            <Typography variant="body2">
              Ce profil est administrateur. Il a automatiquement toutes les permissions.
              Les modifications ci-dessous ne seront pas appliquées.
            </Typography>
          </Box>
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Configuration des Permissions par Module
        </Typography>
        {!isReadOnly && (
          <Box display="flex" gap={2}>
            {defaultPermissions.length > 0 && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleRestoreDefaults}
                startIcon={<Restore />}
              >
                Restaurer les valeurs par défaut
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              startIcon={<CheckCircle />}
            >
              Enregistrer les Permissions
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={2}>
        {Object.entries(ALL_MODULES).map(([moduleKey, moduleInfo]) => {
          const module = moduleKey as ModuleName;
          const hasAllActions = PERMISSION_ACTIONS.every(action =>
            hasModuleAction(module, action)
          );

          return (
            <Grid item xs={12} key={module}>
              <Card variant="outlined">
                <CardContent>
                  <Accordion defaultExpanded={module === 'dashboard'}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" mr={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Security color="primary" />
                          <Typography variant="h6">
                            {moduleInfo.label}
                          </Typography>
                          {hasAllActions && (
                            <Chip
                              label="Toutes"
                              color="success"
                              size="small"
                              icon={<CheckCircle />}
                            />
                          )}
                        </Box>
                        {!isReadOnly && (
                          <Box display="flex" gap={1}>
                            <Tooltip title="Sélectionner toutes les actions">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectAllModuleActions(module);
                                }}
                              >
                                <SelectAll />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Désélectionner toutes les actions">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deselectAllModuleActions(module);
                                }}
                              >
                                <Deselect />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Actions au niveau du module
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          {PERMISSION_ACTIONS.map(action => (
                            <Grid item xs={12} sm={6} md={4} key={action}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={hasModuleAction(module, action)}
                                    onChange={() => toggleModuleAction(module, action)}
                                    disabled={isReadOnly}
                                  />
                                }
                                label={
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {hasModuleAction(module, action) ? (
                                      <CheckCircle 
                                        color={isDefaultPermission(module, action) ? "success" : "primary"} 
                                        fontSize="small" 
                                      />
                                    ) : (
                                      <Cancel color="disabled" fontSize="small" />
                                    )}
                                    {ACTION_LABELS[action]}
                                    {isDefaultPermission(module, action) && (
                                      <Chip 
                                        label="Par défaut" 
                                        size="small" 
                                        color="info" 
                                        variant="outlined"
                                        sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                                      />
                                    )}
                                  </Box>
                                }
                              />
                            </Grid>
                          ))}
                        </Grid>

                        {moduleInfo.submodules && moduleInfo.submodules.length > 0 && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>
                              Permissions par sous-module
                            </Typography>
                            {moduleInfo.submodules.map(submodule => (
                              <Accordion key={submodule} sx={{ mb: 1 }}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {submodule}
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Grid container spacing={2}>
                                    {PERMISSION_ACTIONS.map(action => (
                                      <Grid item xs={12} sm={6} md={4} key={action}>
                                        <FormControlLabel
                                          control={
                                            <Checkbox
                                              checked={hasSubModuleAction(module, submodule, action)}
                                              onChange={() =>
                                                toggleSubModuleAction(module, submodule, action)
                                              }
                                              disabled={isReadOnly}
                                            />
                                          }
                                          label={
                                            <Box display="flex" alignItems="center" gap={1}>
                                              {hasSubModuleAction(module, submodule, action) ? (
                                                <CheckCircle 
                                                  color={isDefaultPermission(module, action, submodule) ? "success" : "primary"} 
                                                  fontSize="small" 
                                                />
                                              ) : (
                                                <Cancel color="disabled" fontSize="small" />
                                              )}
                                              {ACTION_LABELS[action]}
                                              {isDefaultPermission(module, action, submodule) && (
                                                <Chip 
                                                  label="Par défaut" 
                                                  size="small" 
                                                  color="info" 
                                                  variant="outlined"
                                                  sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                                                />
                                              )}
                                            </Box>
                                          }
                                        />
                                      </Grid>
                                    ))}
                                  </Grid>
                                </AccordionDetails>
                              </Accordion>
                            ))}
                          </>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default GestionPermissionsModules;

