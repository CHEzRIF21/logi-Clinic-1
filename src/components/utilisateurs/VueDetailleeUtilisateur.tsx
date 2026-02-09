import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Paper,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Work,
  Security,
  AccessTime,
  CheckCircle,
  Cancel,
  Edit,
  AdminPanelSettings,
  LockReset,
  LockOpen,
} from '@mui/icons-material';
import { User } from '../../types/auth';
import { ModulePermission } from '../../types/modulePermissions';
import { UserPermissionsService, ExtendedUser } from '../../services/userPermissionsService';
import { ALL_MODULES, ACTION_LABELS } from '../../types/modulePermissions';
import { getRoleLabelByValue, dbRoleToUserRole } from '../../config/roles';
import GestionPermissionsModules from '../parametres/GestionPermissionsModules';
import { ProfilUtilisateur } from '../../types/permissions';

interface VueDetailleeUtilisateurProps {
  userId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

const VueDetailleeUtilisateur: React.FC<VueDetailleeUtilisateurProps> = ({
  userId,
  onClose,
  onUpdate,
}) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger d'abord l'utilisateur
        const userData = await UserPermissionsService.getUserById(userId);

        if (!userData) {
          console.error('Utilisateur non trouvé pour userId:', userId);
          setError(`Utilisateur non trouvé (ID: ${userId}). Vérifiez que vous avez les permissions nécessaires.`);
          setLoading(false);
          return;
        }

        // Charger les permissions une fois que l'utilisateur est trouvé
        let userPermissions: ModulePermission[] = [];
        try {
          userPermissions = await UserPermissionsService.getUserPermissions(userId);
        } catch (permErr: any) {
          console.warn('Erreur lors du chargement des permissions, utilisation de permissions vides:', permErr);
          // Ne pas bloquer l'affichage si les permissions ne peuvent pas être chargées
          userPermissions = [];
        }

        setUser(userData);
        setPermissions(userPermissions);
      } catch (err: any) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err.message || 'Erreur lors du chargement des données de l\'utilisateur');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const handleSavePermissions = async (newPermissions: ModulePermission[]) => {
    try {
      await UserPermissionsService.updateUserPermissions(userId, newPermissions);
      setPermissions(newPermissions);
      setOpenPermissionsDialog(false);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert('Erreur lors de la sauvegarde des permissions: ' + err.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Alert severity="error">
        {error || 'Utilisateur non trouvé'}
      </Alert>
    );
  }

  const isAdmin = user.role === 'admin' || (user.role as string) === 'CLINIC_ADMIN';
  const profilTemp: ProfilUtilisateur = {
    id: user.id,
    nom: `${user.prenom} ${user.nom}`,
    role: user.role as any,
    permissions: [],
    magasinsAcces: [],
    modulePermissions: permissions,
    isAdmin: isAdmin,
    actif: user.actif ?? true,
    dateCreation: user.createdAt,
    dateModification: user.updatedAt,
  };

  return (
    <Box>
      <Card>
        <CardContent>
          {/* En-tête avec avatar et nom */}
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
              {user.prenom.charAt(0)}{user.nom.charAt(0)}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" component="h2">
                {user.prenom} {user.nom}
              </Typography>
              <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                <Chip
                  label={getRoleLabelByValue(dbRoleToUserRole(user.role) as any)}
                  color={isAdmin ? 'error' : 'primary'}
                  icon={isAdmin ? <AdminPanelSettings /> : <Work />}
                />
                <Chip
                  label={user.actif ? 'Actif' : 'Inactif'}
                  color={user.actif ? 'success' : 'default'}
                  icon={user.actif ? <CheckCircle /> : <Cancel />}
                />
                <Chip
                  label={user.status || 'PENDING'}
                  color="info"
                  size="small"
                />
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setOpenPermissionsDialog(true)}
            >
              Modifier les permissions
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Informations personnelles */}
          <Typography variant="h6" gutterBottom>
            Informations Personnelles
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={user.email}
                  />
                </ListItem>
                {user.telephone && (
                  <ListItem>
                    <ListItemIcon>
                      <Phone />
                    </ListItemIcon>
                    <ListItemText
                      primary="Téléphone"
                      secondary={user.telephone}
                    />
                  </ListItem>
                )}
                {user.specialite && (
                  <ListItem>
                    <ListItemIcon>
                      <Work />
                    </ListItemIcon>
                    <ListItemText
                      primary="Spécialité"
                      secondary={user.specialite}
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <List dense>
                {user.adresse && (
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    <ListItemText
                      primary="Adresse"
                      secondary={user.adresse}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon>
                    <AccessTime />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dernière connexion"
                    secondary={
                      user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString('fr-FR', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                          })
                        : 'Jamais connecté'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary="Compte créé le"
                    secondary={user.createdAt.toLocaleDateString('fr-FR', {
                      dateStyle: 'long',
                    })}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Actions de récupération */}
          <Typography variant="h6" gutterBottom>
            Actions de Récupération
          </Typography>
          <Box display="flex" gap={2} mb={3}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<LockReset />}
              onClick={async () => {
                if (window.confirm('Voulez-vous réinitialiser le mot de passe de cet utilisateur ? Un email sera envoyé avec un nouveau mot de passe temporaire.')) {
                  try {
                    await UserPermissionsService.resetUserPassword(user.id);
                    alert('Mot de passe réinitialisé avec succès. Un email avec le nouveau mot de passe temporaire a été envoyé à l\'utilisateur.');
                    if (onUpdate) onUpdate();
                  } catch (err: any) {
                    alert('Erreur: ' + err.message);
                  }
                }
              }}
            >
              Réinitialiser le mot de passe
            </Button>
            <Button
              variant="outlined"
              color={user.actif ? 'error' : 'success'}
              startIcon={user.actif ? <Cancel /> : <LockOpen />}
              onClick={async () => {
                const action = user.actif ? 'désactiver' : 'activer';
                if (window.confirm(`Voulez-vous ${action} le compte de cet utilisateur ?`)) {
                  try {
                    await UserPermissionsService.updateUser(user.id, {
                      actif: !(user as ExtendedUser).actif,
                    } as Partial<ExtendedUser>);
                    if (onUpdate) onUpdate();
                    alert(`Compte ${user.actif ? 'désactivé' : 'activé'} avec succès`);
                  } catch (err: any) {
                    alert('Erreur: ' + err.message);
                  }
                }
              }}
            >
              {user.actif ? 'Désactiver le compte' : 'Activer le compte'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Permissions */}
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Security color="primary" />
            <Typography variant="h6">
              Modules et Permissions ({permissions.length} modules)
            </Typography>
          </Box>

          {isAdmin ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Cet utilisateur est administrateur et a accès à tous les modules avec toutes les permissions.
            </Alert>
          ) : permissions.length === 0 ? (
            <Alert severity="warning">
              Aucune permission configurée pour cet utilisateur.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {permissions.map((perm) => (
                <Grid item xs={12} md={6} key={perm.module}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {ALL_MODULES[perm.module]?.label || perm.module}
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
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
                    {perm.submodules && perm.submodules.length > 0 && (
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          Sous-modules :
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={0.5} mt={0.5}>
                          {perm.submodules.map((sub) => (
                            <Box key={sub.submodule} pl={2}>
                              <Typography variant="caption" fontWeight="medium">
                                • {sub.submodule}:
                              </Typography>
                              <Box display="flex" gap={0.5} flexWrap="wrap" ml={1}>
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
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour modifier les permissions */}
      <Dialog
        open={openPermissionsDialog}
        onClose={() => setOpenPermissionsDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          Configuration des Permissions - {user.prenom} {user.nom}
        </DialogTitle>
        <DialogContent>
          <GestionPermissionsModules
            profil={profilTemp}
            onSave={handleSavePermissions}
            currentUserRole="admin"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPermissionsDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VueDetailleeUtilisateur;
