import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useSnackbar } from 'notistack';

// Composants d'authentification
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProtectedModuleRoute from './components/auth/ProtectedModuleRoute';

// Composants de navigation
import Layout from './components/layout/Layout';

// Pages des modules
import Dashboard from './pages/Dashboard';
import Pharmacie from './pages/Pharmacie';
import Maternite from './pages/Maternite';
import StockMedicaments from './pages/StockMedicaments';
import Bilan from './pages/Bilan';
import Caisse from './pages/Caisse';
import RendezVous from './pages/RendezVous';
import GestionPatients from './pages/GestionPatients';
import { ConsultationsComplete } from './pages/ConsultationsComplete';
import ConsultationModule from './pages/ConsultationModule';
import UtilisateursPermissions from './pages/UtilisateursPermissions';
import Vaccination from './pages/Vaccination';
import Laboratoire from './pages/Laboratoire';
import Imagerie from './pages/Imagerie';
import AccountRecoveryManagement from './pages/AccountRecoveryManagement';
import RegistrationRequests from './pages/RegistrationRequests';

// Types
import { User } from './types/auth';

// Utilitaires de permissions
import { canManageUsers } from './utils/permissions';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    enqueueSnackbar('Connexion réussie', { variant: 'success' });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    enqueueSnackbar('Déconnexion réussie', { variant: 'info' });
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        Chargement...
      </Box>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Dashboard user={user} />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultations"
        element={
          <ProtectedModuleRoute user={user} requiredModule="consultations">
            <Layout user={user} onLogout={handleLogout}>
              <ConsultationsComplete user={user} />
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/consultation-module"
        element={
          <ProtectedModuleRoute user={user} requiredModule="consultations">
            <Layout user={user} onLogout={handleLogout}>
              <ConsultationModule />
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/pharmacie"
        element={
          <ProtectedModuleRoute user={user} requiredModule="pharmacie">
            <Layout user={user} onLogout={handleLogout}>
              <Pharmacie />
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/maternite"
        element={
          <ProtectedModuleRoute user={user} requiredModule="maternite">
            <Layout user={user} onLogout={handleLogout}>
              <Maternite />
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/stock-medicaments"
        element={
          <ProtectedModuleRoute user={user} requiredModule="stock">
            <Layout user={user} onLogout={handleLogout}>
              <StockMedicaments />
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/utilisateurs-permissions"
        element={
          <ProtectedRoute user={user}>
            {canManageUsers(user) ? (
              <Layout user={user} onLogout={handleLogout}>
                <UtilisateursPermissions user={user} />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/account-recovery-management"
        element={
          <ProtectedRoute user={user}>
            {canManageUsers(user) ? (
              <Layout user={user} onLogout={handleLogout}>
                <AccountRecoveryManagement user={user} />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/registration-requests"
        element={
          <ProtectedRoute user={user}>
            {canManageUsers(user) ? (
              <Layout user={user} onLogout={handleLogout}>
                <RegistrationRequests user={user} />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/bilan"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Bilan />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/caisse"
        element={
          <ProtectedModuleRoute user={user} requiredModule="caisse">
            <Layout user={user} onLogout={handleLogout}>
              <Caisse />
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/rendez-vous"
        element={
          <ProtectedModuleRoute user={user} requiredModule="rendezvous">
            <Layout user={user} onLogout={handleLogout}>
              <RendezVous />
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedModuleRoute user={user} requiredModule="patients">
            <Layout user={user} onLogout={handleLogout}>
              <GestionPatients />
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/vaccination"
        element={
          <ProtectedModuleRoute user={user} requiredModule="vaccination">
            <Layout user={user} onLogout={handleLogout}>
              <Vaccination />
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/laboratoire"
        element={
          <ProtectedModuleRoute user={user} requiredModule="laboratoire">
            <Layout user={user} onLogout={handleLogout}>
              <Laboratoire />
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/imagerie"
        element={
          <ProtectedModuleRoute user={user} requiredModule="imagerie">
            <Layout user={user} onLogout={handleLogout}>
              <Imagerie />
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App; 