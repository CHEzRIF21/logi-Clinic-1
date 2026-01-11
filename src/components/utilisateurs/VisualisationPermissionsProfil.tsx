import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore,
  Security,
  CheckCircle,
  Cancel,
  AdminPanelSettings,
} from '@mui/icons-material';
import { ModulePermission, ALL_MODULES, ACTION_LABELS } from '../../types/modulePermissions';
import { UserPermissionsService } from '../../services/userPermissionsService';
import { getRoleLabelByValue } from '../../config/roles';
import { UserRole } from '../../types/auth';

interface VisualisationPermissionsProfilProps {
  roleCode?: string;
  userId?: string;
}

const VisualisationPermissionsProfil: React.FC<VisualisationPermissionsProfilProps> = ({
  roleCode,
  userId,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>(roleCode || '');
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const roles: UserRole[] = [
    'admin',
    'medecin',
    'infirmier',
    'sage_femme',
    'pharmacien',
    'technicien_labo',
    'imagerie',
    'caissier',
    'receptionniste',
    'auditeur',
    'comptable',
    'secretaire',
  ];

  useEffect(() => {
    if (userId) {
      loadUserPermissions();
    } else if (selectedRole) {
      loadRolePermissions();
    }
  }, [userId, selectedRole]);

  const loadUserPermissions = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const userPerms = await UserPermissionsService.getUserPermissions(userId);
      setPermissions(userPerms);
      
      // Vérifier si admin
      const user = await UserPermissionsService.getUserById(userId);
      setIsAdmin(user?.role === 'admin' || (user?.role as string) === 'CLINIC_ADMIN');
    } catch (err: any) {
      console.error('Erreur lors du chargement des permissions:', err);
      setError(err.message || 'Erreur lors du chargement des permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async () => {
    if (!selectedRole) return;
    
    try {
      setLoading(true);
      setError(null);
      const rolePerms = await UserPermissionsService.getDefaultRolePermissions(selectedRole);
      setPermissions(rolePerms);
      setIsAdmin(selectedRole === 'admin');
    } catch (err: any) {
      console.error('Erreur lors du chargement des permissions:', err);
      setError(err.message || 'Erreur lors du chargement des permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (event: any) => {
    setSelectedRole(event.target.value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {!userId && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>Sélectionner un rôle</InputLabel>
              <Select
                value={selectedRole}
                onChange={handleRoleChange}
                label="Sélectionner un rôle"
              >
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {getRoleLabelByValue(role)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <AdminPanelSettings />
            <Typography>
              Ce profil est administrateur et a accès à tous les modules avec toutes les permissions.
            </Typography>
          </Box>
        </Alert>
      )}

      {!selectedRole && !userId && (
        <Alert severity="info">
          Veuillez sélectionner un rôle pour voir ses permissions.
        </Alert>
      )}

      {(selectedRole || userId) && (
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Security color="primary" />
            <Typography variant="h6">
              Modules et Actions Accessibles
              {selectedRole && ` - ${getRoleLabelByValue(selectedRole as UserRole)}`}
            </Typography>
          </Box>

          {permissions.length === 0 ? (
            <Alert severity="warning">
              Aucune permission configurée pour ce profil.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {permissions.map((perm) => (
                <Grid item xs={12} key={perm.module}>
                  <Accordion defaultExpanded={perm.module === 'dashboard'}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" mr={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {ALL_MODULES[perm.module]?.label || perm.module}
                          </Typography>
                          <Chip
                            label={`${perm.actions.length} action(s)`}
                            size="small"
                            color="primary"
                          />
                        </Box>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {perm.actions.map((action) => (
                            <Chip
                              key={action}
                              label={ACTION_LABELS[action]}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        {/* Actions au niveau module */}
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                          Actions au niveau module :
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                          {perm.actions.map((action) => (
                            <Chip
                              key={action}
                              label={ACTION_LABELS[action]}
                              icon={<CheckCircle />}
                              color="success"
                              variant="outlined"
                            />
                          ))}
                        </Box>

                        {/* Sous-modules */}
                        {perm.submodules && perm.submodules.length > 0 && (
                          <>
                            <Typography variant="subtitle2" gutterBottom>
                              Permissions par sous-module :
                            </Typography>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              {perm.submodules.map((sub) => (
                                <Grid item xs={12} md={6} key={sub.submodule}>
                                  <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                                      {sub.submodule}
                                    </Typography>
                                    <Box display="flex" gap={0.5} flexWrap="wrap">
                                      {sub.actions.map((action) => (
                                        <Chip
                                          key={action}
                                          label={ACTION_LABELS[action]}
                                          size="small"
                                          color="secondary"
                                          variant="outlined"
                                        />
                                      ))}
                                    </Box>
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          </>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Résumé */}
          {permissions.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Résumé des Permissions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Nombre de modules accessibles
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {permissions.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Total d'actions autorisées
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {permissions.reduce(
                        (total, perm) => total + perm.actions.length,
                        0
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Sous-modules configurés
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {permissions.reduce(
                        (total, perm) =>
                          total + (perm.submodules?.length || 0),
                        0
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};

export default VisualisationPermissionsProfil;
