import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Avatar,
  Typography,
  Chip,
  Divider,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close,
  AdminPanelSettings,
  Work,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { User } from '../../types/auth';
import { ExtendedUser } from '../../services/userPermissionsService';
import { UserPermissionsService } from '../../services/userPermissionsService';
import { getRoleLabelByValue } from '../../config/roles';
import ActiviteTab from './ActiviteTab';
import ConnexionsTab from './ConnexionsTab';
import NotificationsHistoryTab from './NotificationsHistoryTab';

interface MonProfilModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

const MonProfilModal: React.FC<MonProfilModalProps> = ({ open, onClose, user }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [userDetails, setUserDetails] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserDetails = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);
        const details = await UserPermissionsService.getUserById(user.id);
        setUserDetails(details);
      } catch (err: any) {
        console.error('Erreur lors du chargement des détails:', err);
        setError(err.message || 'Erreur lors du chargement des détails');
      } finally {
        setLoading(false);
      }
    };

    if (open && user?.id) {
      loadUserDetails();
    }
  }, [open, user?.id]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'admin' || (user.role as string) === 'CLINIC_ADMIN';
  // Si userDetails existe, l'utiliser, sinon créer un ExtendedUser à partir de User
  const displayUser: ExtendedUser = userDetails || {
    ...user,
    status: 'actif',
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    telephone: undefined,
    adresse: undefined,
    specialite: undefined,
    lastLogin: undefined,
  } as ExtendedUser;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          width: '80%',
          maxWidth: '1200px',
          height: '90vh',
          maxHeight: '900px',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" component="span">
            Mon Profil
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* En-tête avec informations utilisateur */}
            <Box
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <Box display="flex" alignItems="center" gap={3}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    border: '3px solid white',
                    fontSize: '2.5rem',
                  }}
                >
                  {displayUser.prenom?.charAt(0) || 'U'}
                  {displayUser.nom?.charAt(0) || ''}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {displayUser.prenom} {displayUser.nom}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                    <Chip
                      label={getRoleLabelByValue(displayUser.role as any)}
                      icon={isAdmin ? <AdminPanelSettings /> : <Work />}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                    />
                    <Chip
                      label={displayUser.actif !== false ? 'Actif' : 'Inactif'}
                      icon={displayUser.actif !== false ? <CheckCircle /> : <Cancel />}
                      sx={{
                        bgcolor: displayUser.actif !== false
                          ? 'rgba(76, 175, 80, 0.3)'
                          : 'rgba(244, 67, 54, 0.3)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                    />
                    {displayUser.status && (
                      <Chip
                        label={displayUser.status}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    {displayUser.email}
                  </Typography>
                  {(displayUser as ExtendedUser).telephone && (
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {(displayUser as ExtendedUser).telephone}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Onglets */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Activités" />
                <Tab label="Connexions" />
                <Tab label="Notifications" />
              </Tabs>
            </Box>

            {/* Contenu des onglets */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {activeTab === 0 && user.id && <ActiviteTab userId={user.id} />}
              {activeTab === 1 && user.id && <ConnexionsTab userId={user.id} />}
              {activeTab === 2 && user.id && <NotificationsHistoryTab userId={user.id} />}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MonProfilModal;
