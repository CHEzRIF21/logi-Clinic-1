import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  // Rediriger vers /reset-password si le lien de réinitialisation arrive sur une autre page (ex. / ou /login)
  // Supabase peut rediriger vers la "Site URL" au lieu de /reset-password si l'URL n'est pas dans la whitelist
  useEffect(() => {
    if (location.pathname === '/reset-password') return;
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.substring(1));
    if (params.get('type') === 'recovery' && params.get('access_token')) {
      navigate(`/reset-password${hash}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  // #region agent log — s'affiche dans la CONSOLE DU NAVIGATEUR (F12) quand vous allez sur /registration-requests
  if (location.pathname === '/registration-requests') {
    console.log('🔍 [DEBUG] App: route /registration-requests atteinte', {
      pathname: location.pathname,
      hasUser: !!user,
      userRole: user?.role,
    });
  }
  // #endregion
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
    
    // IMPORTANT: Stocker tous les tokens valides (JWT et internal-*) dans localStorage
    // Les tokens internal-* sont nécessaires pour les appels API vers les Edge Functions
    // Ne pas les utiliser avec supabase.auth.getUser() mais ils sont valides pour apiClient
    const isValidJWT = token && token.includes('.') && token.split('.').length === 3;
    const isInternalToken = token && token.startsWith('internal-');
    
    if (isValidJWT) {
      localStorage.setItem('token', token);
      console.log('✅ JWT valide stocké dans localStorage');
    } else if (isInternalToken) {
      // Token interne (compte démo) - stocker pour les appels API
      // ⚠️ Ne PAS utiliser ce token avec supabase.auth.getUser() ou autres endpoints Supabase Auth
      // Il est uniquement pour l'authentification interne via apiClient
      localStorage.setItem('token', token);
      console.log('✅ Token interne stocké dans localStorage (pour appels API uniquement)');
    } else {
      // Token invalide ou format inconnu
      console.warn('⚠️ Token invalide détecté - non stocké dans localStorage');
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

  // Lien de réinitialisation arrivé sur / ou /login : ne pas rendre les routes pour éviter
  // que ProtectedRoute redirige vers /login et fasse perdre le hash (#access_token&type=recovery)
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const hashParams = hash ? new URLSearchParams(hash.substring(1)) : null;
  const isRecoveryLink = hashParams?.get('type') === 'recovery' && hashParams?.get('access_token');
  const shouldRedirectToReset = location.pathname !== '/reset-password' && isRecoveryLink;

  if (shouldRedirectToReset) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Redirection vers la page de réinitialisation...
        </Typography>
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
            {(() => {
              // #region agent log
              const canManage = canManageUsers(user);
              console.log('🔍 registration-requests route check', { hasUser: !!user, userRole: user?.role, canManageUsers: canManage, userId: user?.id });
              fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:253',message:'registration-requests route check',data:{hasUser:!!user,userRole:user?.role,canManageUsers:canManage,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              return canManage ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Suspense fallback={<LoadingFallback />}>
                  <RegistrationRequests user={user} />
                  </Suspense>
                </Layout>
              ) : (
                (() => {
                  // Debug: logger pourquoi l'accès est refusé
                  if (import.meta.env.DEV) {
                    console.warn('🚫 Accès refusé à /registration-requests:', {
                      hasUser: !!user,
                      userRole: user?.role,
                      canManageUsers: canManageUsers(user),
                    });
                  }
                  // #region agent log
                  console.warn('🔍 Redirecting to landing page - access denied', { hasUser: !!user, userRole: user?.role, canManageUsers: canManageUsers(user) });
                  fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:261',message:'redirecting to landing page',data:{hasUser:!!user,userRole:user?.role,canManageUsers:canManageUsers(user)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                  // #endregion
                  return <Navigate to="/" replace />;
                })()
              );
            })()}
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