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
  Badge,
} from '@mui/material';
import GestionUtilisateursComponent from '../components/stock/GestionUtilisateurs';
import VueDetailleeUtilisateur from '../components/utilisateurs/VueDetailleeUtilisateur';
import StatistiquesUtilisateurs from '../components/utilisateurs/StatistiquesUtilisateurs';
import VisualisationPermissionsProfil from '../components/utilisateurs/VisualisationPermissionsProfil';
import RegistrationRequestsTab from '../components/utilisateurs/RegistrationRequestsTab';
import AccountRecoveryTab from '../components/utilisateurs/AccountRecoveryTab';
import { UtilisateurStock, ProfilUtilisateur } from '../types/permissions';
import { User } from '../types/auth';
import { UserPermissionsService, ExtendedUser } from '../services/userPermissionsService';
import { getMyClinicId } from '../services/clinicService';

interface UtilisateursPermissionsProps {
  user?: User | null;
}

// Helper pour vérifier si un rôle est admin
const isAdminRole = (role: string | undefined): boolean => {
  if (!role) return false;
  return role === 'admin' || role === 'CLINIC_ADMIN' || role === 'ADMIN';
};

const UtilisateursPermissions: React.FC<UtilisateursPermissionsProps> = ({ user }) => {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurStock[]>([]);
  const [profils, setProfils] = useState<ProfilUtilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [openUserDetail, setOpenUserDetail] = useState(false);
  const [pendingRegistrationCount, setPendingRegistrationCount] = useState(0);
  const [pendingRecoveryCount, setPendingRecoveryCount] = useState(0);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Vérifier si l'utilisateur actuel est administrateur
  const isAdmin = isAdminRole(user?.role as string);

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
        
        // Transformer les User en UtilisateurStock
        const utilisateursStock: UtilisateurStock[] = users.map(u => ({
          id: u.id,
          nom: u.nom,
          prenom: u.prenom,
          email: u.email,
          role: u.role as any,
          profilId: u.id, // Utiliser l'ID utilisateur comme profilId temporaire
          magasinPrincipal: 'detail' as any,
          permissions: [],
          modulePermissions: [],
          isAdmin: isAdminRole(u.role as string),
        }));

        setUtilisateurs(utilisateursStock);
        
        // Les profils sont basés sur les rôles définis dans role_definitions
        // On peut les charger depuis la base si nécessaire, pour l'instant on garde une liste vide
        setProfils([]);
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

  // Charger les compteurs de notifications
  useEffect(() => {
    const loadNotificationCounts = async () => {
      if (!clinicId) return;
      
      try {
        const [registrationCount, recoveryCount] = await Promise.all([
          UserPermissionsService.getPendingRegistrationRequestsCount(clinicId),
          UserPermissionsService.getPendingRecoveryRequestsCount(clinicId),
        ]);
        
        setPendingRegistrationCount(registrationCount);
        setPendingRecoveryCount(recoveryCount);
      } catch (err) {
        console.error('Erreur lors du chargement des notifications:', err);
      }
    };

    if (clinicId && isAdmin) {
      loadNotificationCounts();
      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(loadNotificationCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [clinicId, isAdmin]);

  // Fonction pour recharger les utilisateurs après approbation d'une demande
  const handleRequestApproved = async () => {
    if (clinicId) {
      try {
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
        }));
        setUtilisateurs(utilisateursStock);
        
        // Recharger les compteurs de notifications
        const [registrationCount, recoveryCount] = await Promise.all([
          UserPermissionsService.getPendingRegistrationRequestsCount(clinicId),
          UserPermissionsService.getPendingRecoveryRequestsCount(clinicId),
        ]);
        setPendingRegistrationCount(registrationCount);
        setPendingRecoveryCount(recoveryCount);
      } catch (err) {
        console.error('Erreur lors du rechargement:', err);
      }
    }
  };

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
        }));
        setUtilisateurs(utilisateursStock);
      }
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour:', err);
      setError(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteUtilisateur = async (utilisateurId: string) => {
    // Cette fonction sera gérée par le composant GestionUtilisateurs
    console.log('Suppression utilisateur:', utilisateurId);
  };

  const handleCreateProfil = (profil: Omit<ProfilUtilisateur, 'id'>) => {
    // Les profils sont basés sur les rôles, pas besoin de créer de nouveaux profils
    console.log('Création profil:', profil);
  };

  const handleUpdateProfil = (profil: ProfilUtilisateur) => {
    // Les profils sont basés sur les rôles, pas besoin de modifier
    console.log('Mise à jour profil:', profil);
  };

  const handleDeleteProfil = (profilId: string) => {
    // Les profils sont basés sur les rôles, pas besoin de supprimer
    console.log('Suppression profil:', profilId);
  };

  // Si l'utilisateur n'est pas admin, afficher un message d'accès refusé
  if (!isAdmin) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            Accès refusé. Seul l'administrateur peut accéder à la gestion des utilisateurs et permissions.
          </Alert>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
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
        }));
        setUtilisateurs(utilisateursStock);
      });
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
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
              label={
                <Badge badgeContent={0} color="error" invisible>
                  {isMobile ? "Utilisateurs" : "Gestion des Utilisateurs"}
                </Badge>
              }
              sx={{ 
                minWidth: { xs: 'auto', md: 180 },
                textTransform: 'none',
                fontSize: { xs: '0.875rem', md: '1rem' },
              }}
            />
            <Tab 
              label={
                <Badge badgeContent={pendingRegistrationCount} color="error" invisible={pendingRegistrationCount === 0}>
                  {isMobile ? "Demandes" : "Demandes d'inscription"}
                </Badge>
              }
              sx={{ 
                minWidth: { xs: 'auto', md: 180 },
                textTransform: 'none',
                fontSize: { xs: '0.875rem', md: '1rem' },
              }}
            />
            <Tab 
              label={
                <Badge badgeContent={pendingRecoveryCount} color="error" invisible={pendingRecoveryCount === 0}>
                  {isMobile ? "Récupération" : "Récupération de compte"}
                </Badge>
              }
              sx={{ 
                minWidth: { xs: 'auto', md: 180 },
                textTransform: 'none',
                fontSize: { xs: '0.875rem', md: '1rem' },
              }}
            />
            <Tab 
              label={isMobile ? "Stats" : "Statistiques et Rapports"}
              sx={{ 
                minWidth: { xs: 'auto', md: 180 },
                textTransform: 'none',
                fontSize: { xs: '0.875rem', md: '1rem' },
              }}
            />
            <Tab 
              label={isMobile ? "Permissions" : "Visualisation des Permissions"}
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

        {activeTab === 1 && user && (
          <RegistrationRequestsTab 
            user={user} 
            onRequestApproved={handleRequestApproved}
          />
        )}

        {activeTab === 2 && user && (
          <AccountRecoveryTab user={user} />
        )}

        {activeTab === 3 && clinicId && (
          <StatistiquesUtilisateurs clinicId={clinicId} />
        )}

        {activeTab === 4 && (
          <VisualisationPermissionsProfil />
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


