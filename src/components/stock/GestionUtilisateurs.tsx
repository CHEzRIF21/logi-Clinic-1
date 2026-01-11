import React, { useState } from 'react';
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
} from '@mui/icons-material';
import {
  UtilisateurStock,
  ProfilUtilisateur,
  RoleUtilisateur,
  MagasinAcces,
  ActionStock,
  Permission,
  PERMISSIONS_PAR_ROLE,
  getRoleLabel,
  getMagasinLabel,
} from '../../types/permissions';
import { ModulePermission } from '../../types/modulePermissions';
import GestionPermissionsModules from '../parametres/GestionPermissionsModules';
import { UserPermissionsService } from '../../services/userPermissionsService';

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
  const [openDialogUtilisateur, setOpenDialogUtilisateur] = useState(false);
  const [openDialogProfil, setOpenDialogProfil] = useState(false);
  const [openDialogPermissions, setOpenDialogPermissions] = useState(false);
  const [editingUtilisateur, setEditingUtilisateur] = useState<UtilisateurStock | null>(null);
  const [editingProfil, setEditingProfil] = useState<ProfilUtilisateur | null>(null);
  const [profilForPermissions, setProfilForPermissions] = useState<ProfilUtilisateur | null>(null);
  const [utilisateurForPermissions, setUtilisateurForPermissions] = useState<UtilisateurStock | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState<'utilisateurs' | 'profils'>('utilisateurs');

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

  const handleCreateUtilisateur = () => {
    const profil = profils.find(p => p.id === formUtilisateur.profilId);
    if (profil) {
      const nouvelUtilisateur: Omit<UtilisateurStock, 'id'> = {
        ...formUtilisateur,
        permissions: profil.permissions,
        dateConnexion: undefined,
      };
      
      onCreateUtilisateur(nouvelUtilisateur);
      setFormUtilisateur({
        nom: '',
        prenom: '',
        email: '',
        role: 'pharmacien',
        profilId: '',
        magasinPrincipal: 'detail',
      });
      setOpenDialogUtilisateur(false);
    }
  };

  const handleUpdateUtilisateur = () => {
    if (editingUtilisateur) {
      const profil = profils.find(p => p.id === formUtilisateur.profilId);
      if (profil) {
        const utilisateurModifie: UtilisateurStock = {
          ...editingUtilisateur,
          ...formUtilisateur,
          permissions: profil.permissions,
        };
        
        onUpdateUtilisateur(utilisateurModifie);
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

  const handleCreateProfil = () => {
    // Si le rôle est administrateur, marquer comme admin
    const isAdmin = formProfil.role === 'administrateur';
    
    const nouveauProfil: Omit<ProfilUtilisateur, 'id'> = {
      ...formProfil,
      permissions: isAdmin ? [] : PERMISSIONS_PAR_ROLE[formProfil.role], // Admin n'a pas besoin de permissions explicites
      modulePermissions: isAdmin ? undefined : [], // Les permissions seront configurées manuellement
      isAdmin: isAdmin,
      dateCreation: new Date(),
      dateModification: new Date(),
    };
    
    onCreateProfil(nouveauProfil);
    setFormProfil({
      nom: '',
      role: 'pharmacien',
      permissions: [],
      magasinsAcces: [],
      actif: true,
    });
    setOpenDialogProfil(false);
  };

  const handleUpdateProfil = () => {
    if (editingProfil) {
      const isAdmin = formProfil.role === 'administrateur';
      
      const profilModifie: ProfilUtilisateur = {
        ...editingProfil,
        ...formProfil,
        permissions: isAdmin ? [] : (editingProfil.permissions || PERMISSIONS_PAR_ROLE[formProfil.role]),
        modulePermissions: isAdmin ? undefined : (editingProfil.modulePermissions || []),
        isAdmin: isAdmin,
        dateModification: new Date(),
      };
      
      onUpdateProfil(profilModifie);
      setEditingProfil(null);
      setFormProfil({
        nom: '',
        role: 'pharmacien',
        permissions: [],
        magasinsAcces: [],
        actif: true,
      });
      setOpenDialogProfil(false);
    }
  };

  const handleOpenPermissionsDialog = async (utilisateur: UtilisateurStock) => {
    setLoadingPermissions(true);
    try {
      // Charger les permissions depuis la base
      const permissions = await UserPermissionsService.getUserPermissions(utilisateur.id);
      
      // Créer un profil temporaire pour le composant GestionPermissionsModules
      const profilTemp: ProfilUtilisateur = {
        id: utilisateur.id,
        nom: `${utilisateur.prenom} ${utilisateur.nom}`,
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
      setUtilisateurForPermissions(utilisateur);
      setOpenDialogPermissions(true);
    } catch (error: any) {
      console.error('Erreur lors du chargement des permissions:', error);
      alert('Erreur lors du chargement des permissions: ' + error.message);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSavePermissions = async (modulePermissions: ModulePermission[]) => {
    if (utilisateurForPermissions) {
      try {
        // Sauvegarder les permissions dans la base
        await UserPermissionsService.updateUserPermissions(
          utilisateurForPermissions.id,
          modulePermissions
        );
        
        // Mettre à jour l'utilisateur localement
        const utilisateurModifie: UtilisateurStock = {
          ...utilisateurForPermissions,
          modulePermissions,
        };
        onUpdateUtilisateur(utilisateurModifie);
        
        setOpenDialogPermissions(false);
        setProfilForPermissions(null);
        setUtilisateurForPermissions(null);
      } catch (error: any) {
        console.error('Erreur lors de la sauvegarde des permissions:', error);
        alert('Erreur lors de la sauvegarde des permissions: ' + error.message);
      }
    } else if (profilForPermissions) {
      // Ancien comportement pour les profils (si nécessaire)
      const profilModifie: ProfilUtilisateur = {
        ...profilForPermissions,
        modulePermissions,
        dateModification: new Date(),
      };
      onUpdateProfil(profilModifie);
      setOpenDialogPermissions(false);
      setProfilForPermissions(null);
    }
  };

  const handleResetToDefaultPermissions = async () => {
    if (utilisateurForPermissions) {
      try {
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
        alert('Permissions réinitialisées aux valeurs par défaut du rôle');
      } catch (error: any) {
        console.error('Erreur lors de la réinitialisation:', error);
        alert('Erreur lors de la réinitialisation: ' + error.message);
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
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestion des Utilisateurs et Permissions
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Button
            variant={activeTab === 'utilisateurs' ? 'contained' : 'text'}
            onClick={() => setActiveTab('utilisateurs')}
            sx={{ mr: 2 }}
          >
            Utilisateurs ({utilisateurs.length})
          </Button>
          <Button
            variant={activeTab === 'profils' ? 'contained' : 'text'}
            onClick={() => setActiveTab('profils')}
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
                Liste des Utilisateurs
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialogUtilisateur(true)}
              >
                Nouvel Utilisateur
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Magasin Principal</TableCell>
                    <TableCell>Profil</TableCell>
                    <TableCell>Dernière Connexion</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {utilisateurs.map((utilisateur) => (
                    <TableRow key={utilisateur.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {utilisateur.prenom} {utilisateur.nom}
                        </Typography>
                      </TableCell>
                      <TableCell>{utilisateur.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(utilisateur.role)}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getMagasinLabel(utilisateur.magasinPrincipal)}
                          color="secondary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {profils.find(p => p.id === utilisateur.profilId)?.nom || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {utilisateur.dateConnexion 
                          ? utilisateur.dateConnexion.toLocaleDateString('fr-FR')
                          : 'Jamais connecté'
                        }
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {onViewUserDetail && (
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => onViewUserDetail(utilisateur.id)}
                              title="Voir les détails de l'utilisateur"
                            >
                              <Info />
                            </IconButton>
                          )}
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
                            color="secondary"
                            onClick={() => handleOpenPermissionsDialog(utilisateur)}
                            title="Configurer les permissions"
                          >
                            <Security />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDeleteUtilisateur(utilisateur.id)}
                            title="Supprimer l'utilisateur"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
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
                        Rôle: {getRoleLabel(profil.role)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Magasins d'accès: {profil.magasinsAcces.map(m => getMagasinLabel(m)).join(', ')}
                      </Typography>

                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="subtitle2">
                            Permissions ({profil.permissions.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {profil.permissions.map((permission, index) => (
                              <ListItem key={index} sx={{ pl: 0 }}>
                                <ListItemIcon>
                                  {getPermissionIcon(permission.action)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={permission.description}
                                  secondary={`Magasin: ${getMagasinLabel(permission.magasin)}`}
                                />
                                <Chip
                                  label={getMagasinLabel(permission.magasin)}
                                  color={getPermissionColor(permission.magasin) as any}
                                  size="small"
                                />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
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
                      {getRoleLabel(role as RoleUtilisateur)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Profil</InputLabel>
                <Select
                  value={formUtilisateur.profilId}
                  onChange={(e) => setFormUtilisateur({ ...formUtilisateur, profilId: e.target.value })}
                  label="Profil"
                  required
                >
                  {profils.filter(p => p.role === formUtilisateur.role).map((profil) => (
                    <MenuItem key={profil.id} value={profil.id}>
                      {profil.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Magasin Principal</InputLabel>
                <Select
                  value={formUtilisateur.magasinPrincipal}
                  onChange={(e) => setFormUtilisateur({ ...formUtilisateur, magasinPrincipal: e.target.value as MagasinAcces })}
                  label="Magasin Principal"
                >
                  <MenuItem value="gros">Magasin Gros</MenuItem>
                  <MenuItem value="detail">Magasin Détail</MenuItem>
                  <MenuItem value="tous">Tous les Magasins</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogUtilisateur(false)}>Annuler</Button>
          <Button
            onClick={editingUtilisateur ? handleUpdateUtilisateur : handleCreateUtilisateur}
            variant="contained"
            disabled={!formUtilisateur.nom || !formUtilisateur.prenom || !formUtilisateur.email || !formUtilisateur.profilId}
          >
            {editingUtilisateur ? 'Modifier' : 'Créer'}
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
                      {getRoleLabel(role as RoleUtilisateur)}
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
          <Button onClick={() => setOpenDialogProfil(false)}>Annuler</Button>
          <Button
            onClick={editingProfil ? handleUpdateProfil : handleCreateProfil}
            variant="contained"
            disabled={!formProfil.nom}
          >
            {editingProfil ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Permissions Modules */}
      <Dialog 
        open={openDialogPermissions} 
        onClose={() => setOpenDialogPermissions(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          Configuration des Permissions - {profilForPermissions?.nom}
        </DialogTitle>
        <DialogContent>
          {loadingPermissions ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : profilForPermissions ? (
            <>
              <GestionPermissionsModules
                profil={profilForPermissions}
                onSave={handleSavePermissions}
                currentUserRole={currentUserRole}
              />
              {utilisateurForPermissions && (
                <Box mt={2}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleResetToDefaultPermissions}
                    fullWidth
                  >
                    Réinitialiser aux permissions par défaut du rôle
                  </Button>
                </Box>
              )}
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialogPermissions(false);
            setProfilForPermissions(null);
            setUtilisateurForPermissions(null);
          }}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionUtilisateursComponent;
