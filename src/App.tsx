import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';

// Composants d'authentification (chargés immédiatement car critiques)
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProtectedModuleRoute from './components/auth/ProtectedModuleRoute';
import ResetPassword from './pages/ResetPassword';

// Composants de navigation (chargés immédiatement)
import Layout from './components/layout/Layout';

// Pages des modules - Lazy loading pour améliorer les performances
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Pharmacie = lazy(() => import('./pages/Pharmacie'));
const Maternite = lazy(() => import('./pages/Maternite'));
const StockMedicaments = lazy(() => import('./pages/StockMedicaments'));
const Bilan = lazy(() => import('./pages/Bilan'));
const Caisse = lazy(() => import('./pages/Caisse'));
const RendezVous = lazy(() => import('./pages/RendezVous'));
const GestionPatients = lazy(() => import('./pages/GestionPatients'));
const Consultations = lazy(() => import('./pages/Consultations'));
const UtilisateursPermissions = lazy(() => import('./pages/UtilisateursPermissions'));
const Vaccination = lazy(() => import('./pages/Vaccination'));
const Laboratoire = lazy(() => import('./pages/Laboratoire'));
const Imagerie = lazy(() => import('./pages/Imagerie'));
const AccountRecoveryManagement = lazy(() => import('./pages/AccountRecoveryManagement'));
const RegistrationRequests = lazy(() => import('./pages/RegistrationRequests'));
const StaffManagementPage = lazy(() => import('./pages/StaffManagementPage'));

// Composant de chargement pour Suspense
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    sx={{
      bgcolor: 'background.default',
    }}
  >
    <CircularProgress size={48} />
  </Box>
);

// Types
import { User } from './types/auth';

// Utilitaires de permissions
import { canManageUsers } from './utils/permissions';
import { clearClinicCache } from './services/clinicService';

function App() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:53',message:'App component mounted',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:60',message:'App useEffect started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    // Vérifier si l'utilisateur est déjà connecté
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:68',message:'User loaded from localStorage',data:{hasToken:!!token,hasUserData:!!userData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:72',message:'ERROR: Failed to parse user data',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:78',message:'App loading complete',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  }, []);

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    
    // IMPORTANT: Ne stocker que les JWT valides dans localStorage
    // Les tokens internes (comme "internal-xxx") ne doivent pas être stockés
    // car ils causent des erreurs "JWT malformé" quand utilisés avec Supabase Auth
    const isValidJWT = token && token.includes('.') && token.split('.').length === 3;
    
    if (isValidJWT) {
      localStorage.setItem('token', token);
      console.log('✅ JWT valide stocké dans localStorage');
    } else {
      // Token interne (compte démo) - ne pas stocker dans localStorage
      // La session Supabase sera gérée automatiquement par le client Supabase
      console.warn('⚠️ Token interne détecté - non stocké dans localStorage (compte démo)');
      // Ne pas stocker le token interne pour éviter les erreurs JWT malformé
      localStorage.removeItem('token');
    }
    
    localStorage.setItem('user', JSON.stringify(userData));
    enqueueSnackbar('Connexion réussie', { variant: 'success' });
  };

  const handleLogout = () => {
    clearClinicCache();
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
    <Suspense fallback={<LoadingFallback />}>
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
        path="/reset-password"
        element={<ResetPassword />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
                <Suspense fallback={<LoadingFallback />}>
              <Dashboard user={user} />
                </Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultations"
        element={
          <ProtectedModuleRoute user={user} requiredModule="consultations">
            <Layout user={user} onLogout={handleLogout}>
              <Suspense fallback={<LoadingFallback />}>
              <Consultations />
              </Suspense>
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/pharmacie"
        element={
          <ProtectedModuleRoute user={user} requiredModule="pharmacie">
            <Layout user={user} onLogout={handleLogout}>
              <Suspense fallback={<LoadingFallback />}>
              <Pharmacie />
              </Suspense>
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/maternite"
        element={
          <ProtectedModuleRoute user={user} requiredModule="maternite">
            <Layout user={user} onLogout={handleLogout}>
              <Suspense fallback={<LoadingFallback />}>
              <Maternite />
              </Suspense>
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/stock-medicaments"
        element={
          <ProtectedModuleRoute user={user} requiredModule="stock">
            <Layout user={user} onLogout={handleLogout}>
              <Suspense fallback={<LoadingFallback />}>
              <StockMedicaments />
              </Suspense>
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
                <Suspense fallback={<LoadingFallback />}>
                <UtilisateursPermissions user={user} />
                </Suspense>
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
                <Suspense fallback={<LoadingFallback />}>
                <AccountRecoveryManagement user={user} />
                </Suspense>
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
                <Suspense fallback={<LoadingFallback />}>
                <RegistrationRequests user={user} />
                </Suspense>
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff-management"
        element={
          <ProtectedRoute user={user}>
            {canManageUsers(user) ? (
              <Layout user={user} onLogout={handleLogout}>
                <Suspense fallback={<LoadingFallback />}>
                <StaffManagementPage user={user} />
                </Suspense>
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
              <Suspense fallback={<LoadingFallback />}>
              <Bilan />
              </Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/caisse"
        element={
          <ProtectedModuleRoute user={user} requiredModule="caisse">
            <Layout user={user} onLogout={handleLogout}>
              <Suspense fallback={<LoadingFallback />}>
              <Caisse />
              </Suspense>
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/rendez-vous"
        element={
          <ProtectedModuleRoute user={user} requiredModule="rendezvous">
            <Layout user={user} onLogout={handleLogout}>
              <Suspense fallback={<LoadingFallback />}>
              <RendezVous />
              </Suspense>
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedModuleRoute user={user} requiredModule="patients">
            <Layout user={user} onLogout={handleLogout}>
              <Suspense fallback={<LoadingFallback />}>
              <GestionPatients />
              </Suspense>
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/vaccination"
        element={
          <ProtectedModuleRoute user={user} requiredModule="vaccination">
            <Layout user={user} onLogout={handleLogout}>
              <Suspense fallback={<LoadingFallback />}>
              <Vaccination />
              </Suspense>
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/laboratoire"
        element={
          <ProtectedModuleRoute user={user} requiredModule="laboratoire">
            <Layout user={user} onLogout={handleLogout}>
              <Suspense fallback={<LoadingFallback />}>
              <Laboratoire />
              </Suspense>
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route
        path="/imagerie"
        element={
          <ProtectedModuleRoute user={user} requiredModule="imagerie">
            <Layout user={user} onLogout={handleLogout}>
              <Suspense fallback={<LoadingFallback />}>
              <Imagerie />
              </Suspense>
            </Layout>
          </ProtectedModuleRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

export default App; 