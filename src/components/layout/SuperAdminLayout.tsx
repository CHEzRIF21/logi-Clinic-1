import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, AppBar } from '@mui/material';
import { Dashboard as DashboardIcon, Business, Logout } from '@mui/icons-material';
import { User } from '../../types/auth';

const DRAWER_WIDTH = 240;

interface SuperAdminLayoutProps {
  user: User | null;
  onLogout: () => void;
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/super-admin/login', { replace: true });
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="span">
            Logiclinic – Super Admin
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2">{user?.email}</Typography>
          <ListItemButton onClick={handleLogout} sx={{ ml: 1 }}>
            <ListItemIcon><Logout /></ListItemIcon>
            <ListItemText primary="Déconnexion" />
          </ListItemButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', top: 64 },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', pt: 2 }}>
          <List>
            <ListItemButton component={Link} to="/super-admin">
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Tableau de bord" />
            </ListItemButton>
            <ListItemButton component={Link} to="/super-admin/clinics">
              <ListItemIcon><Business /></ListItemIcon>
              <ListItemText primary="Cliniques" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default SuperAdminLayout;
