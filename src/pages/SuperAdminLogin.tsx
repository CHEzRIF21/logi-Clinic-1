import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress, Container } from '@mui/material';
import { Lock, Email } from '@mui/icons-material';
import { User } from '../types/auth';
import { apiPost } from '../services/apiClient';
import Logo from '../components/ui/Logo';

interface SuperAdminLoginProps {
  onLogin: (user: User, token: string) => void;
}

const ALL_MODULES = [
  'consultations', 'patients', 'pharmacie', 'maternite', 'laboratoire',
  'imagerie', 'vaccination', 'caisse', 'rendezvous', 'stock', 'parametres', 'utilisateurs',
] as User['permissions'];

const SuperAdminLogin: React.FC<SuperAdminLoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost<{ success: boolean; message?: string; user?: any; token?: string }>(
        '/auth/super-admin-login',
        { email: email.trim().toLowerCase(), password }
      );
      if (!data || !(data as any).success || !(data as any).user || !(data as any).token) {
        setError((data as any)?.message || 'Identifiants incorrects');
        return;
      }
      const res = data as { user: { id: string; nom?: string; prenom?: string; email: string; role: string; clinic_id?: string }; token: string };
      const appUser: User = {
        id: res.user.id,
        username: res.user.email,
        email: res.user.email,
        role: 'super_admin',
        nom: res.user.nom || '',
        prenom: res.user.prenom || '',
        clinicCode: '',
        clinicId: undefined,
        permissions: ALL_MODULES,
        status: 'actif',
      };
      onLogin(appUser, res.token);
      navigate('/super-admin', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Logo />
          </Box>
          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 600 }}>
            Espace Super Admin
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Connexion réservée aux administrateurs système
          </Typography>
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} /> }}
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{ startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} /> }}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            <a href="/login" style={{ color: 'inherit' }}>Retour à la connexion classique</a>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default SuperAdminLogin;
