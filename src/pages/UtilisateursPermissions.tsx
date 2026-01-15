import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Alert, 
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import GestionUtilisateursComponent from '../components/stock/GestionUtilisateurs';
import VueDetailleeUtilisateur from '../components/utilisateurs/VueDetailleeUtilisateur';
import StatistiquesUtilisateurs from '../components/utilisateurs/StatistiquesUtilisateurs';
import VisualisationPermissionsProfil from '../components/utilisateurs/VisualisationPermissionsProfil';
import GestionNotifications from '../components/utilisateurs/GestionNotifications';
import { UtilisateurStock, ProfilUtilisateur } from '../types/permissions';
import { User } from '../types/auth';
import { UserPermissionsService, ExtendedUser } from '../services/userPermissionsService';
import { getMyClinicId } from '../services/clinicService';
import { canManageUsers, isAdminRole } from '../utils/permissions';

interface UtilisateursPermissionsProps {
  user?: User | null;
}

const UtilisateursPermissions: React.FC<UtilisateursPermissionsProps> = ({ user }) => {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurStock[]>([]);
  const [profils, setProfils] = useState<ProfilUtilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [openUserDetail, setOpenUserDetail] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Vérifier si l'utilisateur actuel est administrateur
  const isAdmin = canManageUsers(user ?? null);

  // Charger les utilisateurs depuis Supabase
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentClinicId = await getMyClinicId();
        
        if (!currentClinicId) {
          setError('Clinic ID manquant');
          return;
        }

        setClinicId(currentClinicId);
        const users = await UserPermissionsService.getAllUsers(currentClinicId);
        
        // Transformer les User en UtilisateurStock avec statut et dernière connexion
        const utilisateursStock: UtilisateurStock[] = users.map(u => {
          const createdAt = u.createdAt ? new Date(u.createdAt) : new Date();
          const isNewUser = (Date.now() - createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 jours
          
          return {
            id: u.id,
            nom: u.nom,
            prenom: u.prenom,
            email: u.email,
            role: u.role as any,
            profilId: u.id,
            magasinPrincipal: 'detail' as any,
            permissions: [],
            modulePermissions: [],
            isAdmin: isAdminRole(u.role as string),
            // Ajouter la date de dernière connexion si disponible
            dateConnexion: u.lastLogin ? new Date(u.lastLogin) : undefined,
            // Ajouter le statut réel de l'utilisateur
            status: u.status || (u.actif ? 'ACTIVE' : 'SUSPENDED'),
            // Indicateur pour les nouveaux utilisateurs
            isNewUser: isNewUser,
          };
        });

        setUtilisateurs(utilisateursStock);
        
        // Charger les profils personnalisés depuis la base de données
        const customProfiles = await UserPermissionsService.getCustomProfiles(currentClinicId);
        const profilsStock: ProfilUtilisateur[] = await Promise.all(
          customProfiles.map(async (profile: any) => {
            const permissions = await UserPermissionsService.getCustomProfilePermissions(profile.id);
            return {
              id: profile.id,
              nom: profile.nom,
              role: profile.role_code as any,
              permissions: [],
              magasinsAcces: [],
              modulePermissions: permissions,
              isAdmin: profile.is_admin || false,
              actif: profile.actif ?? true,
              dateCreation: new Date(profile.created_at),
              dateModification: new Date(profile.updated_at),
            };
          })
        );
        setProfils(profilsStock);
      } catch (err: any) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        setError(err.message || 'Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const handleCreateUtilisateur = async (utilisateur: Omit<UtilisateurStock, 'id'>) => {
    // Cette fonction sera gérée par le composant GestionUtilisateurs
    // qui appellera directement le service
    console.log('Création utilisateur:', utilisateur);
  };

  const handleUpdateUtilisateur = async (utilisateur: UtilisateurStock) => {
    try {
      await UserPermissionsService.updateUser(utilisateur.id, {
        role: utilisateur.role as any,
      });
      
      // Recharger les utilisateurs
      const clinicId = await getMyClinicId();
      if (clinicId) {
        const users = await UserPermissionsService.getAllUsers(clinicId);
        const utilisateursStock: UtilisateurStock[] = users.map(u => ({
          id: u.id,
          nom: u.nom,
          prenom: u.prenom,
          email: u.email,
          role: u.role as any,
          profilId: u.id,
          magasinPrincipal: 'detail' as any,
          permissions: [],
          modulePermissions: [],
          isAdmin: isAdminRole(u.role as string),
          dateConnexion: u.lastLogin ? new Date(u.lastLogin) : undefined,
          status: u.status || (u.actif ? 'ACTIVE' : 'SUSPENDED'),
        }));
        setUtilisateurs(utilisateursStock);
      }
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour:', err);
      setError(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteUtilisateur = async (utilisateurId: string) => {
    try {
      await UserPermissionsService.deleteUser(utilisateurId);
      
      // Recharger les utilisateurs après suppression
      if (clinicId) {
        const users = await UserPermissionsService.getAllUsers(clinicId);
        const utilisateursStock: UtilisateurStock[] = users.map(u => ({
          id: u.id,
          nom: u.nom,
          prenom: u.prenom,
          email: u.email,
          role: u.role as any,
          profilId: u.id,
          magasinPrincipal: 'detail' as any,
          permissions: [],
          modulePermissions: [],
          isAdmin: isAdminRole(u.role as string),
          dateConnexion: u.lastLogin ? new Date(u.lastLogin) : undefined,
          status: u.status || (u.actif ? 'ACTIVE' : 'SUSPENDED'),
          isNewUser: u.createdAt ? (Date.now() - new Date(u.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false,
        }));
        setUtilisateurs(utilisateursStock);
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', err);
      setError(err.message || 'Erreur lors de la suppression de l\'utilisateur');
      throw err; // Propager l'erreur pour que le composant enfant puisse l'afficher
    }
  };

  const handleCreateProfil = async (profil: Omit<ProfilUtilisateur, 'id'>) => {
    if (!clinicId) {
      setError('Clinic ID manquant');
      throw new Error('Clinic ID manquant');
    }

    try {
      const userDataStr = localStorage.getItem('user');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const createdBy = userData?.id || null;

      const profileId = await UserPermissionsService.createCustomProfile(
        clinicId,
        profil.nom,
        profil.nom, // Utiliser le nom comme description par défaut
        profil.role,
        profil.isAdmin || false,
        profil.modulePermissions || [],
        createdBy
      );

      // Recharger les profils
      const customProfiles = await UserPermissionsService.getCustomProfiles(clinicId);
      const profilsStock: ProfilUtilisateur[] = await Promise.all(
        customProfiles.map(async (profile: any) => {
          const permissions = await UserPermissionsService.getCustomProfilePermissions(profile.id);
          return {
            id: profile.id,
            nom: profile.nom,
            role: profile.role_code as any,
            permissions: [],
            magasinsAcces: [],
            modulePermissions: permissions,
            isAdmin: profile.is_admin || false,
            actif: profile.actif ?? true,
            dateCreation: new Date(profile.created_at),
            dateModification: new Date(profile.updated_at),
          };
        })
      );
      setProfils(profilsStock);
    } catch (err: any) {
      console.error('Erreur lors de la création du profil:', err);
      setError(err.message || 'Erreur lors de la création du profil');
      throw err; // Propager l'erreur pour que le composant enfant puisse la gérer
    }
  };

  const handleUpdateProfil = async (profil: ProfilUtilisateur) => {
    try {
      await UserPermissionsService.updateCustomProfile(profil.id, {
        nom: profil.nom,
        actif: profil.actif,
        permissions: profil.modulePermissions,
      });

      // Recharger les profils
      if (clinicId) {
        const customProfiles = await UserPermissionsService.getCustomProfiles(clinicId);
        const profilsStock: ProfilUtilisateur[] = await Promise.all(
          customProfiles.map(async (profile: any) => {
            const permissions = await UserPermissionsService.getCustomProfilePermissions(profile.id);
            return {
              id: profile.id,
              nom: profile.nom,
              role: profile.role_code as any,
              permissions: [],
              magasinsAcces: [],
              modulePermissions: permissions,
              isAdmin: profile.is_admin || false,
              actif: profile.actif ?? true,
              dateCreation: new Date(profile.created_at),
              dateModification: new Date(profile.updated_at),
            };
          })
        );
        setProfils(profilsStock);
      }
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    }
  };

  const handleDeleteProfil = async (profilId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) {
      return;
    }

    try {
      await UserPermissionsService.deleteCustomProfile(profilId);

      // Recharger les profils
      if (clinicId) {
        const customProfiles = await UserPermissionsService.getCustomProfiles(clinicId);
        const profilsStock: ProfilUtilisateur[] = await Promise.all(
          customProfiles.map(async (profile: any) => {
            const permissions = await UserPermissionsService.getCustomProfilePermissions(profile.id);
            return {
              id: profile.id,
              nom: profile.nom,
              role: profile.role_code as any,
              permissions: [],
              magasinsAcces: [],
              modulePermissions: permissions,
              isAdmin: profile.is_admin || false,
              actif: profile.actif ?? true,
              dateCreation: new Date(profile.created_at),
              dateModification: new Date(profile.updated_at),
            };
          })
        );
        setProfils(profilsStock);
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression du profil:', err);
      setError(err.message || 'Erreur lors de la suppression du profil');
    }
  };

  // Si l'utilisateur n'est pas admin, afficher un message d'accès refusé
  if (!isAdmin) {
    return (
      <Container maxWidth="lg" data-testid="users-permissions-page">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" data-testid="users-permissions-access-denied">
            Accès refusé. Seul l'administrateur peut accéder à la gestion des utilisateurs et permissions.
          </Alert>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" data-testid="users-permissions-page">
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" data-testid="users-permissions-page">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  const handleViewUserDetail = (userId: string) => {
    setSelectedUserId(userId);
    setOpenUserDetail(true);
  };

  const handleCloseUserDetail = () => {
    setOpenUserDetail(false);
    setSelectedUserId(null);
    // Recharger les utilisateurs après modification
    if (clinicId) {
      UserPermissionsService.getAllUsers(clinicId).then(users => {
        const utilisateursStock: UtilisateurStock[] = users.map(u => ({
          id: u.id,
          nom: u.nom,
          prenom: u.prenom,
          email: u.email,
          role: u.role as any,
          profilId: u.id,
          magasinPrincipal: 'detail' as any,
          permissions: [],
          modulePermissions: [],
          isAdmin: isAdminRole(u.role as string),
          dateConnexion: u.lastLogin ? new Date(u.lastLogin) : undefined,
          status: u.status || (u.actif ? 'ACTIVE' : 'SUSPENDED'),
          isNewUser: u.createdAt ? (Date.now() - new Date(u.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false,
        }));
        setUtilisateurs(utilisateursStock);
      });
    }
  };

  return (
    <Container maxWidth="xl" data-testid="users-permissions-page">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom data-testid="users-permissions-title">
          Utilisateurs et Permissions
        </Typography>

        {/* Onglets pour naviguer entre les différentes vues */}
        <Box 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            mb: 3,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            data-testid="users-permissions-tabs"
            sx={{
              width: '100%',
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              },
            }}
          >
            <Tab 
              label={isMobile ? "Utilisateurs" : "Gestion des Utilisateurs"}
              data-testid="users-permissions-tab-users"
              sx={{ 
                minWidth: { xs: 'auto', md: 180 },
                textTransform: 'none',
                fontSize: { xs: '0.875rem', md: '1rem' },
              }}
            />
            <Tab 
              label={isMobile ? "Stats" : "Statistiques et Rapports"}
              data-testid="users-permissions-tab-stats"
              sx={{ 
                minWidth: { xs: 'auto', md: 180 },
                textTransform: 'none',
                fontSize: { xs: '0.875rem', md: '1rem' },
              }}
            />
            <Tab 
              label={isMobile ? "Permissions" : "Visualisation des Permissions"}
              data-testid="users-permissions-tab-permissions"
              sx={{ 
                minWidth: { xs: 'auto', md: 180 },
                textTransform: 'none',
                fontSize: { xs: '0.875rem', md: '1rem' },
              }}
            />
            <Tab 
              label={isMobile ? "Notifications" : "Gestion Notifications"}
              data-testid="users-permissions-tab-notifications"
              sx={{ 
                minWidth: { xs: 'auto', md: 180 },
                textTransform: 'none',
                fontSize: { xs: '0.875rem', md: '1rem' },
              }}
            />
          </Tabs>
        </Box>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 0 && (
          <GestionUtilisateursComponent
            utilisateurs={utilisateurs}
            profils={profils}
            onCreateUtilisateur={handleCreateUtilisateur}
            onUpdateUtilisateur={handleUpdateUtilisateur}
            onDeleteUtilisateur={handleDeleteUtilisateur}
            onCreateProfil={handleCreateProfil}
            onUpdateProfil={handleUpdateProfil}
            onDeleteProfil={handleDeleteProfil}
            currentUserRole={user?.role}
            onViewUserDetail={handleViewUserDetail}
          />
        )}

        {activeTab === 1 && clinicId && (
          <StatistiquesUtilisateurs clinicId={clinicId} />
        )}

        {activeTab === 2 && (
          <VisualisationPermissionsProfil />
        )}

        {activeTab === 3 && user && (
          <GestionNotifications user={user as ExtendedUser} />
        )}

        {/* Dialog pour la vue détaillée utilisateur */}
        <Dialog
          open={openUserDetail}
          onClose={handleCloseUserDetail}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { height: '90vh' }
          }}
        >
          <DialogTitle>
            Détails de l'Utilisateur
          </DialogTitle>
          <DialogContent>
            {selectedUserId && (
              <VueDetailleeUtilisateur
                userId={selectedUserId}
                onClose={handleCloseUserDetail}
                onUpdate={handleCloseUserDetail}
              />
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UtilisateursPermissions;


