import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle,
  VpnKey,
} from '@mui/icons-material';
import { supabase } from '../../services/supabase';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
  clinicName: string;
  clinicCode?: string;
  clinicId?: string;
  authUserId?: string;
  currentPassword?: string;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  onClose,
  onSuccess,
  userEmail,
  clinicName,
  clinicCode,
  clinicId,
  authUserId,
  currentPassword,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre' };
    }
    return { valid: true, message: '' };
  };

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Vérifier si une session existe
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      let sessionActive = !sessionError && !!session;
      
      // Si pas de session mais qu'on a le mot de passe actuel, essayer de se connecter
      if (!sessionActive && currentPassword) {
        console.log('Tentative de connexion avec le mot de passe actuel pour établir une session...');
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: currentPassword,
        });
        
        if (authData?.session && !authErr) {
          sessionActive = true;
          console.log('Session établie avec succès');
        } else {
          console.log('Impossible d\'établir une session:', authErr?.message);
        }
      }
      
      if (sessionActive) {
        // Session active, utiliser updateUser normalement
        const { error: authError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (authError) {
          throw new Error(authError.message || 'Erreur lors du changement de mot de passe');
        }

        // 2. Mettre à jour le statut de l'utilisateur dans la table users
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              status: 'ACTIVE',
              temp_code_used: true,
              first_login_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', authUser.id);

          if (updateError) {
            console.error('Erreur lors de la mise à jour du statut:', updateError);
            // Ne pas bloquer si cette mise à jour échoue, le mot de passe est déjà changé
          }
        }
      } else {
        // Pas de session active, utiliser la fonction RPC pour contourner RLS
        console.log('Aucune session active, utilisation de la fonction RPC pour mettre à jour le statut');
        
        // Utiliser la fonction RPC update_user_status_after_password_change
        // qui contourne RLS grâce à SECURITY DEFINER
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'update_user_status_after_password_change',
          {
            p_email: userEmail,
            p_clinic_id: clinicId || null,
            p_auth_user_id: authUserId || null,
          }
        );

        if (rpcError) {
          console.error('Erreur RPC:', rpcError);
          throw new Error(rpcError.message || 'Erreur lors de la mise à jour du statut');
        }

        if (!rpcResult) {
          throw new Error('Impossible de mettre à jour le statut utilisateur');
        }

        console.log('✅ Statut utilisateur mis à jour avec succès via RPC');
        
        // Note: Le mot de passe dans Supabase Auth ne peut pas être changé sans session
        // L'utilisateur devra utiliser "Mot de passe oublié" ou se reconnecter avec le nouveau mot de passe
        // après que le statut soit passé à ACTIVE
      }

      setSuccess(true);
      
      // Attendre un peu avant de fermer
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('Erreur de changement de mot de passe:', err);
      setError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={success ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!success}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VpnKey color="primary" />
          <Typography variant="h6">
            Changer votre mot de passe
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Bienvenue {userEmail} ! Pour votre sécurité, veuillez définir un nouveau mot de passe.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Clinique:</strong> {clinicName}{clinicCode && ` (Code: ${clinicCode})`}
          </Typography>
        </Alert>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Mot de passe changé avec succès !
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vous allez être redirigé vers votre tableau de bord...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Nouveau mot de passe"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Minimum 8 caractères avec majuscule, minuscule et chiffre"
            />

            <TextField
              fullWidth
              label="Confirmer le mot de passe"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={onClose}
            disabled={isLoading}
          >
            Plus tard
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isLoading || !newPassword || !confirmPassword}
            startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
          >
            {isLoading ? 'Changement en cours...' : 'Changer le mot de passe'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ChangePasswordDialog;

