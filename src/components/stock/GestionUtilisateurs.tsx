import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  InputAdornment,
  Avatar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  Security,
  AdminPanelSettings,
  Visibility,
  Edit as EditIcon,
  Info,
  NewReleases,
  FilterList,
  Search,
  Warning,
  Person,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  UtilisateurStock,
  ProfilUtilisateur,
  RoleUtilisateur,
  MagasinAcces,
  ActionStock,
  Permission,
  PERMISSIONS_PAR_ROLE,
  getMagasinLabel,
} from '../../types/permissions';
import { ModulePermission } from '../../types/modulePermissions';
import GestionPermissionsModules from '../parametres/GestionPermissionsModules';
import { UserPermissionsService } from '../../services/userPermissionsService';
import { getRoleLabelByValue, dbRoleToUserRole } from '../../config/roles';

interface GestionUtilisateursProps {
  utilisateurs: UtilisateurStock[];
  profils: ProfilUtilisateur[];
  onCreateUtilisateur: (utilisateur: Omit<UtilisateurStock, 'id'>) => void;
  onUpdateUtilisateur: (utilisateur: UtilisateurStock) => void;
  onDeleteUtilisateur: (utilisateurId: string) => void;
  onCreateProfil: (profil: Omit<ProfilUtilisateur, 'id'>) => void;
  onUpdateProfil: (profil: ProfilUtilisateur) => void;
  onDeleteProfil: (profilId: string) => void;
  currentUserRole?: string; // Rôle de l'utilisateur actuel pour vérifier les permissions
  onViewUserDetail?: (userId: string) => void; // Callback pour ouvrir la vue détaillée
}

const GestionUtilisateursComponent: React.FC<GestionUtilisateursProps> = ({
  utilisateurs,
  profils,
  onCreateUtilisateur,
  onUpdateUtilisateur,
  onDeleteUtilisateur,
  onCreateProfil,
  onUpdateProfil,
  onDeleteProfil,
  currentUserRole,
  onViewUserDetail,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [openDialogUtilisateur, setOpenDialogUtilisateur] = useState(false);
  const [openDialogProfil, setOpenDialogProfil] = useState(false);
  const [openDialogPermissions, setOpenDialogPermissions] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUtilisateur, setEditingUtilisateur] = useState<UtilisateurStock | null>(null);
  const [editingProfil, setEditingProfil] = useState<ProfilUtilisateur | null>(null);
  const [profilForPermissions, setProfilForPermissions] = useState<ProfilUtilisateur | null>(null);
  const [utilisateurForPermissions, setUtilisateurForPermissions] = useState<UtilisateurStock | null>(null);
  const [userToDelete, setUserToDelete] = useState<UtilisateurStock | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'utilisateurs' | 'profils'>('utilisateurs');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'active' | 'pending' | 'suspended'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formUtilisateur, setFormUtilisateur] = useState({
    nom: '',
    prenom: '',
    email: '',
    role: 'pharmacien' as RoleUtilisateur,
    profilId: '',
    magasinPrincipal: 'detail' as MagasinAcces,
  });

  const [formProfil, setFormProfil] = useState({
    nom: '',
    role: 'pharmacien' as RoleUtilisateur,
    permissions: [] as Permission[],
    magasinsAcces: [] as MagasinAcces[],
    actif: true,
  });

  const handleCreateUtilisateur = async () => {
    try {
      setSaving(true);
      const nouvelUtilisateur: Omit<UtilisateurStock, 'id'> = {
        ...formUtilisateur,
        profilId: '', // Pas de profil requis
        magasinPrincipal: 'detail', // Valeur par défaut
        permissions: [], // Les permissions seront assignées selon le rôle
        dateConnexion: undefined,
      };
      
      await onCreateUtilisateur(nouvelUtilisateur);
      setFormUtilisateur({
        nom: '',
        prenom: '',
        email: '',
        role: 'pharmacien',
        profilId: '',
        magasinPrincipal: 'detail',
      });
      setOpenDialogUtilisateur(false);
      enqueueSnackbar('Utilisateur créé avec succès', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Erreur lors de la création de l\'utilisateur', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUtilisateur = async () => {
    if (editingUtilisateur) {
      try {
        setSaving(true);
        const utilisateurModifie: UtilisateurStock = {
          ...editingUtilisateur,
          nom: formUtilisateur.nom,
          prenom: formUtilisateur.prenom,
          email: formUtilisateur.email,
          role: formUtilisateur.role,
        };
        
        await onUpdateUtilisateur(utilisateurModifie);
        setEditingUtilisateur(null);
        setFormUtilisateur({
          nom: '',
          prenom: '',
          email: '',
          role: 'pharmacien',
          profilId: '',
          magasinPrincipal: 'detail',
        });
        setOpenDialogUtilisateur(false);
        enqueueSnackbar('Utilisateur modifié avec succès', { variant: 'success' });
      } catch (error: any) {
        enqueueSnackbar(error.message || 'Erreur lors de la modification de l\'utilisateur', { variant: 'error' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleEditUtilisateur = (utilisateur: UtilisateurStock) => {
    setEditingUtilisateur(utilisateur);
    setFormUtilisateur({
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      role: utilisateur.role,
      profilId: utilisateur.profilId,
      magasinPrincipal: utilisateur.magasinPrincipal,
    });
    setOpenDialogUtilisateur(true);
  };

  const handleCreateProfil = async () => {
    // Si le rôle est administrateur, marquer comme admin
    const isAdmin = formProfil.role === 'administrateur' || formProfil.role === 'administrateur_clinique';
    
    const nouveauProfil: Omit<ProfilUtilisateur, 'id'> = {
      ...formProfil,
      permissions: isAdmin ? [] : PERMISSIONS_PAR_ROLE[formProfil.role] || [], // Admin n'a pas besoin de permissions explicites
      modulePermissions: isAdmin ? undefined : [], // Les permissions seront configurées après création
      isAdmin: isAdmin,
      dateCreation: new Date(),
      dateModification: new Date(),
    };
    
      try {
        setSaving(true);
        await onCreateProfil(nouveauProfil);
        
        setFormProfil({
          nom: '',
          role: 'pharmacien',
          permissions: [],
          magasinsAcces: [],
          actif: true,
        });
        setOpenDialogProfil(false);
        enqueueSnackbar('Profil créé avec succès', { variant: 'success' });
      } catch (error: any) {
        console.error('Erreur lors de la création du profil:', error);
        enqueueSnackbar('Erreur lors de la création du profil: ' + (error?.message || 'Erreur inconnue'), { variant: 'error' });
      } finally {
        setSaving(false);
      }
  };

  const handleUpdateProfil = async () => {
    if (editingProfil) {
      try {
        setSaving(true);
        const isAdmin = formProfil.role === 'administrateur' || formProfil.role === 'administrateur_clinique';
        
        const profilModifie: ProfilUtilisateur = {
          ...editingProfil,
          ...formProfil,
          permissions: isAdmin ? [] : (editingProfil.permissions || PERMISSIONS_PAR_ROLE[formProfil.role] || []),
          modulePermissions: isAdmin ? undefined : (editingProfil.modulePermissions || []),
          isAdmin: isAdmin,
          dateModification: new Date(),
        };
        
        await onUpdateProfil(profilModifie);
        
        setEditingProfil(null);
        setFormProfil({
          nom: '',
          role: 'pharmacien',
          permissions: [],
          magasinsAcces: [],
          actif: true,
        });
        setOpenDialogProfil(false);
        enqueueSnackbar('Profil modifié avec succès', { variant: 'success' });
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        enqueueSnackbar('Erreur lors de la mise à jour du profil: ' + (error?.message || 'Erreur inconnue'), { variant: 'error' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleOpenPermissionsDialog = async (utilisateur: UtilisateurStock) => {
    // Ouvrir immédiatement le dialogue pour un meilleur UX
    setOpenDialogPermissions(true);
    setLoadingPermissions(true);
    
    try {
      let permissions: ModulePermission[] = [];
      
      // Détecter si c'est un profil personnalisé (pas d'email) ou un utilisateur réel
      const isCustomProfile = !utilisateur.email || utilisateur.email === '';
      
      if (isCustomProfile) {
        // C'est un profil personnalisé, utiliser getCustomProfilePermissions
        permissions = await UserPermissionsService.getCustomProfilePermissions(utilisateur.id);
      } else {
        // C'est un utilisateur réel, utiliser getUserPermissions
        try {
          permissions = await UserPermissionsService.getUserPermissions(utilisateur.id);
        } catch (permError: any) {
          console.error('Erreur lors de la récupération des permissions utilisateur:', permError);
          // En cas d'erreur, utiliser les permissions vides plutôt que de bloquer
          permissions = [];
          enqueueSnackbar('Impossible de charger les permissions. Utilisation des permissions par défaut.', { variant: 'warning' });
        }
      }
      
      // Créer un profil temporaire pour le composant GestionPermissionsModules
      const profilTemp: ProfilUtilisateur = {
        id: utilisateur.id,
        nom: utilisateur.email ? `${utilisateur.prenom} ${utilisateur.nom}` : utilisateur.nom,
        role: utilisateur.role,
        permissions: [],
        magasinsAcces: [],
        modulePermissions: permissions,
        isAdmin: utilisateur.isAdmin || false,
        actif: true,
        dateCreation: new Date(),
        dateModification: new Date(),
      };
      
      setProfilForPermissions(profilTemp);
      setUtilisateurForPermissions(isCustomProfile ? null : utilisateur); // null si c'est un profil personnalisé
    } catch (error: any) {
      console.error('Erreur lors du chargement des permissions:', error);
      enqueueSnackbar('Erreur lors du chargement des permissions: ' + (error.message || 'Erreur inconnue'), { variant: 'error' });
      // Ne pas fermer le dialogue, mais afficher un message d'erreur
      setProfilForPermissions(null);
      setUtilisateurForPermissions(null);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSavePermissions = async (modulePermissions: ModulePermission[]) => {
    console.log('handleSavePermissions appelé avec:', modulePermissions);
    
    if (utilisateurForPermissions) {
      // C'est un utilisateur réel
      try {
        setSaving(true);
        console.log('Sauvegarde des permissions pour utilisateur:', utilisateurForPermissions.id);
        
        // Sauvegarder les permissions dans la base
        await UserPermissionsService.updateUserPermissions(
          utilisateurForPermissions.id,
          modulePermissions
        );
        
        console.log('Permissions sauvegardées avec succès pour utilisateur:', utilisateurForPermissions.id);
        
        // Note: on ne met pas à jour l'utilisateur via onUpdateUtilisateur car:
        // 1. Les permissions sont déjà sauvegardées dans user_custom_permissions
        // 2. La table users n'est pas modifiée pour les permissions
        // 3. Cela évite l'erreur RLS sur la mise à jour de users
        
        setOpenDialogPermissions(false);
        setProfilForPermissions(null);
        setUtilisateurForPermissions(null);
        enqueueSnackbar('Permissions mises à jour avec succès', { variant: 'success' });
      } catch (error: any) {
        console.error('Erreur lors de la sauvegarde des permissions:', error);
        enqueueSnackbar('Erreur lors de la sauvegarde des permissions: ' + (error.message || 'Erreur inconnue'), { variant: 'error' });
        // Ne pas fermer le dialogue en cas d'erreur pour permettre à l'utilisateur de réessayer
      } finally {
        setSaving(false);
      }
    } else if (profilForPermissions) {
      // C'est un profil personnalisé
      try {
        setSaving(true);
        console.log('Sauvegarde des permissions pour profil:', profilForPermissions.id);
        
        // Sauvegarder les permissions du profil personnalisé dans la base
        await UserPermissionsService.updateCustomProfile(profilForPermissions.id, {
          permissions: modulePermissions,
        });
        
        console.log('Permissions sauvegardées avec succès pour profil:', profilForPermissions.id);
        
        // Mettre à jour le profil localement
        const profilModifie: ProfilUtilisateur = {
          ...profilForPermissions,
          modulePermissions,
          dateModification: new Date(),
        };
        await onUpdateProfil(profilModifie);
        
        setOpenDialogPermissions(false);
        setProfilForPermissions(null);
        setUtilisateurForPermissions(null);
        enqueueSnackbar('Permissions du profil mises à jour avec succès', { variant: 'success' });
      } catch (error: any) {
        console.error('Erreur lors de la sauvegarde des permissions du profil:', error);
        enqueueSnackbar('Erreur lors de la sauvegarde des permissions: ' + (error.message || 'Erreur inconnue'), { variant: 'error' });
        // Ne pas fermer le dialogue en cas d'erreur pour permettre à l'utilisateur de réessayer
      } finally {
        setSaving(false);
      }
    } else {
      console.error('Aucun utilisateur ou profil sélectionné pour la sauvegarde des permissions');
      enqueueSnackbar('Erreur: Aucun utilisateur ou profil sélectionné', { variant: 'error' });
    }
  };

  const handleResetToDefaultPermissions = async () => {
    if (utilisateurForPermissions) {
      try {
        setSaving(true);
        await UserPermissionsService.resetToDefaultPermissions(utilisateurForPermissions.id);
        
        // Recharger les permissions
        const permissions = await UserPermissionsService.getUserPermissions(utilisateurForPermissions.id);
        
        const profilTemp: ProfilUtilisateur = {
          id: utilisateurForPermissions.id,
          nom: `${utilisateurForPermissions.prenom} ${utilisateurForPermissions.nom}`,
          role: utilisateurForPermissions.role,
          permissions: [],
          magasinsAcces: [],
          modulePermissions: permissions,
          isAdmin: utilisateurForPermissions.isAdmin || false,
          actif: true,
          dateCreation: new Date(),
          dateModification: new Date(),
        };
        
        setProfilForPermissions(profilTemp);
        enqueueSnackbar('Permissions réinitialisées aux valeurs par défaut du rôle', { variant: 'success' });
      } catch (error: any) {
        console.error('Erreur lors de la réinitialisation:', error);
        enqueueSnackbar('Erreur lors de la réinitialisation: ' + error.message, { variant: 'error' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteClick = (utilisateur: UtilisateurStock) => {
    setUserToDelete(utilisateur);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        setDeleting(true);
        await onDeleteUtilisateur(userToDelete.id);
        setOpenDeleteDialog(false);
        setUserToDelete(null);
        enqueueSnackbar('Utilisateur supprimé avec succès', { variant: 'success' });
      } catch (error: any) {
        enqueueSnackbar(error.message || 'Erreur lors de la suppression de l\'utilisateur', { variant: 'error' });
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleEditProfil = (profil: ProfilUtilisateur) => {
    setEditingProfil(profil);
    setFormProfil({
      nom: profil.nom,
      role: profil.role,
      permissions: profil.permissions,
      magasinsAcces: profil.magasinsAcces,
      actif: profil.actif,
    });
    setOpenDialogProfil(true);
  };

  const getPermissionIcon = (action: ActionStock) => {
    switch (action) {
      case 'lecture_stock':
        return <Visibility color="info" />;
      case 'ecriture_stock':
        return <EditIcon color="primary" />;
      case 'gestion_medicaments':
        return <Security color="secondary" />;
      case 'gestion_utilisateurs':
        return <AdminPanelSettings color="warning" />;
      default:
        return <Security />;
    }
  };

  const getPermissionColor = (magasin: MagasinAcces) => {
    switch (magasin) {
      case 'tous':
        return 'success';
      case 'gros':
        return 'primary';
      case 'detail':
        return 'secondary';
      case 'aucun':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box data-testid="gestion-utilisateurs-root">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom data-testid="gestion-utilisateurs-title">
          Gestion des Utilisateurs et Permissions
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Button
            variant={activeTab === 'utilisateurs' ? 'contained' : 'text'}
            onClick={() => setActiveTab('utilisateurs')}
            sx={{ mr: 2 }}
            data-testid="gestion-utilisateurs-switch-users"
          >
            Utilisateurs ({utilisateurs.length})
          </Button>
          <Button
            variant={activeTab === 'profils' ? 'contained' : 'text'}
            onClick={() => setActiveTab('profils')}
            data-testid="gestion-utilisateurs-switch-profils"
          >
            Profils ({profils.length})
          </Button>
        </Box>
      </Box>

      {/* Onglet Utilisateurs */}
      {activeTab === 'utilisateurs' && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Liste des Utilisateurs ({utilisateurs.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialogUtilisateur(true)}
                data-testid="btn-create-user"
              >
                Nouvel Utilisateur
              </Button>
            </Box>

            {/* Filtres et recherche */}
            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
              <TextField
                size="small"
                placeholder="Rechercher par nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                inputProps={{ 'data-testid': 'users-search-input' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250, flexGrow: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Filtrer par statut</InputLabel>
                <Select
                  value={filterStatus}
                  label="Filtrer par statut"
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  startAdornment={<FilterList />}
                  inputProps={{ 'data-testid': 'users-status-filter' }}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="new">Nouveaux (7 jours)</MenuItem>
                  <MenuItem value="active">Actifs</MenuItem>
                  <MenuItem value="pending">En attente</MenuItem>
                  <MenuItem value="suspended">Suspendus</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TableContainer component={Paper}>
              <Table data-testid="users-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Dernière Connexion</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    // Filtrer les utilisateurs
                    let filteredUsers = utilisateurs;
                    
                    // Filtre par recherche
                    if (searchTerm) {
                      const searchLower = searchTerm.toLowerCase();
                      filteredUsers = filteredUsers.filter(u => 
                        u.nom.toLowerCase().includes(searchLower) ||
                        u.prenom.toLowerCase().includes(searchLower) ||
                        u.email.toLowerCase().includes(searchLower)
                      );
                    }
                    
                    // Filtre par statut
                    if (filterStatus !== 'all') {
                      filteredUsers = filteredUsers.filter(u => {
                        switch (filterStatus) {
                          case 'new':
                            return u.isNewUser === true;
                          case 'active':
                            return (u.status || '').toUpperCase() === 'ACTIVE';
                          case 'pending':
                            return (u.status || '').toUpperCase() === 'PENDING';
                          case 'suspended':
                            return (u.status || '').toUpperCase() === 'SUSPENDED';
                          default:
                            return true;
                        }
                      });
                    }
                    
                    return filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary" sx={{ py: 4 }}>
                            {searchTerm || filterStatus !== 'all' 
                              ? 'Aucun utilisateur ne correspond aux critères de recherche.'
                              : 'Aucun utilisateur trouvé. Les utilisateurs apparaîtront ici après approbation de leurs demandes d\'inscription.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((utilisateur) => (
                      <TableRow key={utilisateur.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight="medium">
                              {utilisateur.prenom} {utilisateur.nom}
                            </Typography>
                            {utilisateur.isNewUser && (
                              <Chip
                                icon={<NewReleases />}
                                label="Nouveau"
                                color="info"
                                size="small"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{utilisateur.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={getRoleLabelByValue(dbRoleToUserRole(utilisateur.role) as any)}
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const status = utilisateur.status || (utilisateur.isAdmin ? 'ACTIVE' : 'ACTIVE');
                            const getStatusLabel = (s: string) => {
                              switch (s.toUpperCase()) {
                                case 'ACTIVE':
                                  return 'Actif';
                                case 'PENDING':
                                  return 'En attente';
                                case 'SUSPENDED':
                                  return 'Suspendu';
                                default:
                                  return s;
                              }
                            };
                            const getStatusColor = (s: string) => {
                              switch (s.toUpperCase()) {
                                case 'ACTIVE':
                                  return utilisateur.isAdmin ? 'warning' : 'success';
                                case 'PENDING':
                                  return 'warning';
                                case 'SUSPENDED':
                                  return 'error';
                                default:
                                  return 'default';
                              }
                            };
                            return (
                              <Chip
                                label={utilisateur.isAdmin ? 'Admin' : getStatusLabel(status)}
                                color={getStatusColor(status) as any}
                                size="small"
                              />
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {utilisateur.dateConnexion 
                            ? utilisateur.dateConnexion.toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Jamais connecté'
                          }
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" gap={0.5} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => {
                                if (onViewUserDetail) {
                                  onViewUserDetail(utilisateur.id);
                                } else {
                                  enqueueSnackbar('Fonction de détails non disponible', { variant: 'warning' });
                                }
                              }}
                              title="Voir les détails de l'utilisateur"
                            >
                              <Info />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditUtilisateur(utilisateur)}
                              title="Modifier l'utilisateur"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPermissionsDialog(utilisateur)}
                              title="Configurer les permissions"
                              sx={{ 
                                color: 'success.main',
                                '&:hover': {
                                  backgroundColor: 'success.light',
                                  color: 'success.dark',
                                }
                              }}
                            >
                              <Security />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(utilisateur)}
                              title="Supprimer l'utilisateur"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                    );
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Onglet Profils */}
      {activeTab === 'profils' && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Liste des Profils
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialogProfil(true)}
                data-testid="btn-create-profile"
              >
                Nouveau Profil
              </Button>
            </Box>

            <Grid container spacing={2}>
              {profils.map((profil) => (
                <Grid item xs={12} md={6} key={profil.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                          {profil.nom}
                        </Typography>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditProfil(profil)}
                            title="Modifier le profil"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => {
                              // Convertir ProfilUtilisateur en UtilisateurStock pour la compatibilité
                              const utilisateurStock: UtilisateurStock = {
                                id: profil.id,
                                nom: profil.nom.split(' ')[0] || '',
                                prenom: profil.nom.split(' ').slice(1).join(' ') || '',
                                email: '',
                                role: profil.role,
                                profilId: profil.id,
                                magasinPrincipal: profil.magasinsAcces?.[0] || 'detail',
                                permissions: profil.permissions || [],
                                modulePermissions: profil.modulePermissions || [],
                                isAdmin: profil.isAdmin || false,
                              };
                              handleOpenPermissionsDialog(utilisateurStock);
                            }}
                            title="Configurer les permissions"
                          >
                            <Security />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDeleteProfil(profil.id)}
                            title="Supprimer le profil"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Rôle: {getRoleLabelByValue(dbRoleToUserRole(profil.role) as any)}
                      </Typography>

                      {profil.magasinsAcces && profil.magasinsAcces.length > 0 && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Magasins d'accès: {profil.magasinsAcces.map(m => getMagasinLabel(m)).join(', ')}
                        </Typography>
                      )}

                      {profil.isAdmin ? (
                        <Typography variant="body2" color="warning.main" fontWeight="medium">
                          ⚠️ Administrateur - Toutes les permissions sont accordées
                        </Typography>
                      ) : (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle2">
                              Permissions ({profil.modulePermissions?.length || 0} modules)
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {profil.modulePermissions && profil.modulePermissions.length > 0 ? (
                              <List dense>
                                {profil.modulePermissions.map((modulePerm, index) => (
                                  <ListItem key={index} sx={{ pl: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <Box display="flex" alignItems="center" gap={1} width="100%">
                                      <Security fontSize="small" color="primary" />
                                      <Typography variant="body2" fontWeight="medium">
                                        {modulePerm.module}
                                      </Typography>
                                      <Chip
                                        label={`${modulePerm.actions.length} action(s)`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    </Box>
                                    {modulePerm.actions.length > 0 && (
                                      <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                                        Actions: {modulePerm.actions.join(', ')}
                                      </Typography>
                                    )}
                                    {modulePerm.submodules && modulePerm.submodules.length > 0 && (
                                      <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                                        Sous-modules: {modulePerm.submodules.map(s => s.submodule).join(', ')}
                                      </Typography>
                                    )}
                                  </ListItem>
                                ))}
                              </List>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Aucune permission configurée. Cliquez sur l'icône de sécurité pour configurer les permissions.
                              </Typography>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Dialog Utilisateur */}
      <Dialog open={openDialogUtilisateur} onClose={() => setOpenDialogUtilisateur(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUtilisateur ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom"
                value={formUtilisateur.nom}
                onChange={(e) => setFormUtilisateur({ ...formUtilisateur, nom: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prénom"
                value={formUtilisateur.prenom}
                onChange={(e) => setFormUtilisateur({ ...formUtilisateur, prenom: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formUtilisateur.email}
                onChange={(e) => setFormUtilisateur({ ...formUtilisateur, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Rôle</InputLabel>
                <Select
                  value={formUtilisateur.role}
                  onChange={(e) => setFormUtilisateur({ ...formUtilisateur, role: e.target.value as RoleUtilisateur })}
                  label="Rôle"
                >
                  {Object.keys(PERMISSIONS_PAR_ROLE).map((role) => (
                    <MenuItem key={role} value={role}>
                      {getRoleLabelByValue(dbRoleToUserRole(role) as any)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 1 }}>
                Les permissions seront configurées automatiquement selon le rôle sélectionné. 
                Vous pourrez les personnaliser après création en cliquant sur l'icône de sécurité.
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogUtilisateur(false)} disabled={saving}>Annuler</Button>
          <Button
            onClick={editingUtilisateur ? handleUpdateUtilisateur : handleCreateUtilisateur}
            variant="contained"
            disabled={!formUtilisateur.nom || !formUtilisateur.prenom || !formUtilisateur.email || saving}
          >
            {saving ? <CircularProgress size={20} /> : editingUtilisateur ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Profil */}
      <Dialog open={openDialogProfil} onClose={() => setOpenDialogProfil(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProfil ? 'Modifier le profil' : 'Nouveau profil'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom du profil"
                value={formProfil.nom}
                onChange={(e) => setFormProfil({ ...formProfil, nom: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Rôle</InputLabel>
                <Select
                  value={formProfil.role}
                  onChange={(e) => setFormProfil({ ...formProfil, role: e.target.value as RoleUtilisateur })}
                  label="Rôle"
                >
                  {Object.keys(PERMISSIONS_PAR_ROLE).map((role) => (
                    <MenuItem key={role} value={role}>
                      {getRoleLabelByValue(dbRoleToUserRole(role) as any)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formProfil.actif}
                    onChange={(e) => setFormProfil({ ...formProfil, actif: e.target.checked })}
                  />
                }
                label="Profil actif"
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                {formProfil.role === 'administrateur' 
                  ? 'Le profil administrateur a automatiquement toutes les permissions. Aucune configuration n\'est nécessaire.'
                  : 'Les permissions de base seront configurées selon le rôle. Vous pourrez les personnaliser après la création du profil en cliquant sur l\'icône de sécurité.'}
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogProfil(false)} disabled={saving}>Annuler</Button>
          <Button
            onClick={editingProfil ? handleUpdateProfil : handleCreateProfil}
            variant="contained"
            disabled={!formProfil.nom || saving}
          >
            {saving ? <CircularProgress size={20} /> : editingProfil ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Permissions Modules */}
      <Dialog 
        open={openDialogPermissions} 
        onClose={() => {
          if (!loadingPermissions && !saving) {
            setOpenDialogPermissions(false);
            setProfilForPermissions(null);
            setUtilisateurForPermissions(null);
          }
        }}
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          Configuration des Permissions {profilForPermissions ? `- ${profilForPermissions.nom}` : ''}
        </DialogTitle>
        <DialogContent>
          {loadingPermissions ? (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px" gap={2}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Chargement des permissions...
              </Typography>
            </Box>
          ) : profilForPermissions ? (
            <>
              <GestionPermissionsModules
                profil={profilForPermissions}
                onSave={handleSavePermissions}
                currentUserRole={currentUserRole}
                saving={saving}
              />
              {utilisateurForPermissions && (
                <Box mt={2}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleResetToDefaultPermissions}
                    fullWidth
                    disabled={saving}
                  >
                    Réinitialiser aux permissions par défaut du rôle
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <Alert severity="error">
                Impossible de charger les permissions. Veuillez réessayer.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenDialogPermissions(false);
              setProfilForPermissions(null);
              setUtilisateurForPermissions(null);
            }} 
            disabled={saving || loadingPermissions}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={openDeleteDialog} onClose={() => !deleting && setOpenDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Warning color="error" />
            <Typography variant="h6" color="error">
              Confirmer la suppression
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {userToDelete && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Cette action est irréversible. L'utilisateur et toutes ses données associées seront définitivement supprimés.
                </Typography>
              </Alert>
              <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  {userToDelete.prenom.charAt(0)}{userToDelete.nom.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {userToDelete.prenom} {userToDelete.nom}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userToDelete.email}
                  </Typography>
                  <Chip
                    label={getRoleLabelByValue(dbRoleToUserRole(userToDelete.role) as any)}
                    color="primary"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action ne peut pas être annulée.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleting}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
            disabled={deleting}
          >
            {deleting ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionUtilisateursComponent;
