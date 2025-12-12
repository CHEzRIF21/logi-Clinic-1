import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Chip,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Switch,
  Toolbar,
  Typography,
  Avatar,
  Divider,
  Badge,
  Alert,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  LocalPharmacy,
  PregnantWoman,
  Inventory,
  Assessment,
  Payment,
  Event,
  People,
  AccountCircle,
  Logout,
  MedicalServices,
  Vaccines,
  Science,
  Image as ImageIcon,
  Receipt,
  Notifications,
  Settings,
  Search,
  Lock,
  PersonAdd,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ModulePermission } from '../../types/auth';
import { hasModuleAccess, canManageUsers } from '../../utils/permissions';
import ThemeToggleButton from '../ui/ThemeToggleButton';
import Logo from '../ui/Logo';
import { PatientSearchAdvanced } from '../consultation/PatientSearchAdvanced';
import { Patient } from '../../services/supabase';

const drawerWidth = 280;

interface ModernLayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

// Configuration des éléments du menu avec leurs modules associés
interface MenuItemConfig {
  text: string;
  icon: React.ReactNode;
  path: string;
  badge: number | null;
  module: ModulePermission | null;
  requiresAdmin?: boolean;
}

const menuItemsConfig: MenuItemConfig[] = [
  { text: 'Tableau de bord', icon: <Dashboard />, path: '/', badge: null, module: null },
  { text: 'Consultations', icon: <MedicalServices />, path: '/consultations', badge: null, module: 'consultations' },
  { text: 'Nouvelle Consultation', icon: <MedicalServices />, path: '/consultation-module', badge: null, module: 'consultations' },
  { text: 'Vaccination', icon: <Vaccines />, path: '/vaccination', badge: null, module: 'vaccination' },
  { text: 'Laboratoire', icon: <Science />, path: '/laboratoire', badge: null, module: 'laboratoire' },
  { text: 'Imagerie Médicale', icon: <ImageIcon />, path: '/imagerie', badge: null, module: 'imagerie' },
  { text: 'Pharmacie', icon: <LocalPharmacy />, path: '/pharmacie', badge: 3, module: 'pharmacie' },
  { text: 'Maternité', icon: <PregnantWoman />, path: '/maternite', badge: null, module: 'maternite' },
  { text: 'Stock Médicaments', icon: <Inventory />, path: '/stock-medicaments', badge: null, module: 'stock' },
  { text: 'Bilan', icon: <Assessment />, path: '/bilan', badge: null, module: null },
  { text: 'Caisse', icon: <Receipt />, path: '/caisse', badge: null, module: 'caisse' },
  { text: 'Rendez-vous', icon: <Event />, path: '/rendez-vous', badge: 5, module: 'rendezvous' },
  { text: 'Gestion Patients', icon: <People />, path: '/patients', badge: null, module: 'patients' },
  { text: "Utilisateur et permission", icon: <AccountCircle />, path: '/utilisateurs-permissions', badge: null, module: 'utilisateurs', requiresAdmin: true },
  { text: "Gestion Récupération", icon: <Lock />, path: '/account-recovery-management', badge: null, module: null, requiresAdmin: true },
  { text: "Demandes d'inscription", icon: <PersonAdd />, path: '/registration-requests', badge: null, module: null, requiresAdmin: true },
];

type NotificationCategory = 'consultation' | 'laboratoire' | 'stock' | 'caisse';

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  time: string;
  type: NotificationCategory;
  read: boolean;
}

type QuickSettings = {
  compactDrawer: boolean;
  emailAlerts: boolean;
  autoUpdates: boolean;
};

// Fonction pour filtrer les éléments du menu selon les permissions
const getFilteredMenuItems = (user: User | null) => {
  if (!user) return [];
  
  return menuItemsConfig.filter(item => {
    // Le tableau de bord est toujours accessible
    if (item.path === '/') return true;
    
    // Vérifier si l'élément nécessite des droits admin
    if (item.requiresAdmin && !canManageUsers(user)) {
      return false;
    }
    
    // Vérifier si l'utilisateur a accès au module
    if (item.module) {
      return hasModuleAccess(user, item.module);
    }
    
    // Si pas de module spécifique, accessible à tous les utilisateurs connectés
    return true;
  });
};

const ModernLayout: React.FC<ModernLayoutProps> = ({ children, user, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchFeedback, setSearchFeedback] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: 'Nouvelle consultation',
      description: 'Patient Marie Koné est arrivée en salle 2.',
      time: 'Il y a 5 min',
      type: 'consultation',
      read: false,
    },
    {
      id: 2,
      title: 'Résultat de laboratoire prêt',
      description: 'Analyse sanguine de Moussa Traoré disponible.',
      time: 'Il y a 32 min',
      type: 'laboratoire',
      read: false,
    },
    {
      id: 3,
      title: 'Stock critique',
      description: 'Le lot de Paracétamol 500mg est presque épuisé.',
      time: 'Il y a 1 h',
      type: 'stock',
      read: true,
    },
  ]);
  const [quickSettings, setQuickSettings] = useState<QuickSettings>({
    compactDrawer: false,
    emailAlerts: true,
    autoUpdates: true,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;

  const getNotificationVisuals = (type: NotificationCategory) => {
    switch (type) {
      case 'consultation':
        return {
          color: theme.palette.primary.main,
          background: alpha(theme.palette.primary.main, 0.15),
          icon: <MedicalServices fontSize="small" />,
        };
      case 'laboratoire':
        return {
          color: theme.palette.success.main,
          background: alpha(theme.palette.success.main, 0.15),
          icon: <Science fontSize="small" />,
        };
      case 'stock':
        return {
          color: theme.palette.warning.main,
          background: alpha(theme.palette.warning.main, 0.2),
          icon: <Inventory fontSize="small" />,
        };
      case 'caisse':
      default:
        return {
          color: theme.palette.info.main,
          background: alpha(theme.palette.info.main, 0.15),
          icon: <Receipt fontSize="small" />,
        };
    }
  };

  const toggleQuickSetting = (key: keyof QuickSettings) => {
    setQuickSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleSettingsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsMenuClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  const handleNotificationClick = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  const handleNavigateToParametres = () => {
    handleMenuClose();
    navigate('/parametres');
  };

  const handleGoToParametresPage = () => {
    handleSettingsMenuClose();
    navigate('/parametres');
  };

  const handleProfileOpen = () => {
    handleMenuClose();
    setProfileDialogOpen(true);
  };

  const handleProfileClose = () => {
    setProfileDialogOpen(false);
  };

  const handleProfileGoToSettings = () => {
    setProfileDialogOpen(false);
    navigate('/parametres');
  };

  const handleSearchBoxActivate = () => {
    setSearchDialogOpen(true);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSearchBoxActivate();
    }
  };

  const handleSearchDialogClose = () => {
    setSearchDialogOpen(false);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchFeedback({
      open: true,
      message: `${patient.prenom} ${patient.nom} sélectionné`,
    });
  };

  const handleSearchFeedbackClose = () => {
    setSearchFeedback((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo et Header */}
      <Toolbar
        sx={{
          minHeight: '80px !important',
          px: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: theme.palette.primary.contrastText,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Logo variant="default" size="medium" animated={true} />
      </Toolbar>

      <Divider />

      {/* Menu Items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        <List sx={{ px: 1.5 }}>
          {getFilteredMenuItems(user).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    py: 1.25,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? theme.palette.primary.main : 'inherit',
                    }}
                  >
                    {item.badge ? (
                      <Badge badgeContent={item.badge} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9375rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer utilisateur */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          background: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40,
            }}
          >
            {user?.prenom?.charAt(0) || 'U'}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role || 'Utilisateur'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <CssBaseline />
      {/* AppBar moderne */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: '72px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Barre de recherche */}
          <Tooltip title="Recherche globale (Ctrl + K)" arrow>
            <Box
              role="button"
              tabIndex={0}
              aria-label="Ouvrir la recherche globale"
              onClick={handleSearchBoxActivate}
              onKeyDown={handleSearchKeyDown}
              sx={{
                flex: 1,
                maxWidth: 600,
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
                '&:focus-visible': {
                  outline: `2px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                },
              }}
            >
              <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Rechercher un patient, un dossier ou une consultation
              </Typography>
              <Chip
                label="Ctrl + K"
                size="small"
                sx={{
                  ml: 'auto',
                  fontSize: 11,
                  color: 'text.secondary',
                  bgcolor: alpha(theme.palette.text.primary, 0.05),
                }}
              />
            </Box>
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />

          {/* Toggle Dark Mode */}
          <ThemeToggleButton />

          {/* Notifications */}
          <Tooltip title="Notifications" arrow>
            <IconButton color="inherit" sx={{ mr: 1 }} onClick={handleNotificationMenuOpen}>
              <Badge badgeContent={unreadNotifications} color="error" max={9} showZero>
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Paramètres */}
          <Tooltip title="Paramètres rapides" arrow>
            <IconButton color="inherit" sx={{ mr: 1 }} onClick={handleSettingsMenuOpen}>
              <Settings />
            </IconButton>
          </Tooltip>

          {/* Menu utilisateur */}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
            sx={{ ml: 1 }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: theme.palette.primary.main,
              }}
            >
              {user?.prenom?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <MenuItem disabled sx={{ py: 1.5 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  {user?.prenom?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email || 'email@example.com'}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleProfileOpen}>
              <AccountCircle sx={{ mr: 2, fontSize: 20 }} />
              Mon Profil
            </MenuItem>
            <MenuItem onClick={handleNavigateToParametres}>
              <Settings sx={{ mr: 2, fontSize: 20 }} />
              Paramètres
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
              <Logout sx={{ mr: 2, fontSize: 20 }} />
              Déconnexion
            </MenuItem>
          </Menu>

          <Menu
            id="notifications-menu"
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: { mt: 1.5, minWidth: 360, maxWidth: '90vw', maxHeight: 420 },
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Notifications
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  handleMarkNotificationsRead();
                  handleNotificationMenuClose();
                }}
                disabled={unreadNotifications === 0}
              >
                Tout marquer lu
              </Button>
            </Box>
            <Divider />
            {notifications.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Aucune notification
                </Typography>
              </Box>
            ) : (
              <List dense sx={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifications.map((notification) => {
                  const visuals = getNotificationVisuals(notification.type);
                  return (
                    <ListItemButton
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                      sx={{
                        alignItems: 'flex-start',
                        gap: 1.5,
                        borderLeft: notification.read ? '4px solid transparent' : `4px solid ${visuals.color}`,
                        py: 1.25,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: visuals.background,
                          color: visuals.color,
                        }}
                      >
                        {visuals.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={notification.read ? 500 : 600}>
                          {notification.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {notification.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {notification.time}
                        </Typography>
                      </Box>
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Menu>

          <Menu
            id="quick-settings-menu"
            anchorEl={settingsAnchorEl}
            open={Boolean(settingsAnchorEl)}
            onClose={handleSettingsMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: { mt: 1.5, minWidth: 320, maxWidth: '90vw' },
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Paramètres rapides
              </Typography>
              <Button size="small" onClick={handleGoToParametresPage}>
                Ouvrir la page
              </Button>
            </Box>
            <Divider />
            <Box sx={{ px: 2, py: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={quickSettings.compactDrawer}
                    onChange={() => toggleQuickSetting('compactDrawer')}
                  />
                }
                label="Navigation compacte"
              />
              <FormControlLabel
                control={
                  <Switch checked={quickSettings.emailAlerts} onChange={() => toggleQuickSetting('emailAlerts')} />
                }
                label="Alertes email"
              />
              <FormControlLabel
                control={
                  <Switch checked={quickSettings.autoUpdates} onChange={() => toggleQuickSetting('autoUpdates')} />
                }
                label="Mises à jour automatiques"
              />
            </Box>
          </Menu>

          <Dialog open={searchDialogOpen} onClose={handleSearchDialogClose} fullWidth maxWidth="lg">
            <DialogTitle>Recherche globale</DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Recherchez rapidement un patient, un dossier ou un historique clinique sans quitter votre page
                actuelle.
              </Typography>
              <PatientSearchAdvanced onPatientSelect={handlePatientSelect} selectedPatient={selectedPatient} />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleSearchDialogClose}>Fermer</Button>
            </DialogActions>
          </Dialog>

          <Dialog open={profileDialogOpen} onClose={handleProfileClose} fullWidth maxWidth="sm">
            <DialogTitle>Mon profil</DialogTitle>
            <DialogContent dividers>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    width: 64,
                    height: 64,
                  }}
                >
                  {user?.prenom?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email || 'email@example.com'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role || 'Rôle non défini'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Accédez à vos informations personnelles et ajustez vos préférences d&apos;utilisation depuis la
                page Paramètres. Cette fenêtre vous permet simplement de consulter vos informations principales.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleProfileClose}>Fermer</Button>
              <Button variant="contained" onClick={handleProfileGoToSettings}>
                Modifier mes paramètres
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={searchFeedback.open}
            autoHideDuration={4000}
            onClose={handleSearchFeedbackClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={handleSearchFeedbackClose} severity="success" sx={{ width: '100%' }} variant="filled">
              {searchFeedback.message}
            </Alert>
          </Snackbar>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Contenu principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: theme.palette.background.default,
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important' }} />
        {children}
      </Box>
    </Box>
  );
};

export default ModernLayout;

