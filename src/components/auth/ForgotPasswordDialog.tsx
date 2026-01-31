import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Close,
  Email,
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
} from '@mui/icons-material';
import { supabase } from '../../services/supabase';
import { useTheme } from '@mui/material/styles';

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Timeout pour la requête (30 secondes)
  const REQUEST_TIMEOUT = 30000;

  // Fonction pour valider l'email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fonction pour envoyer l'email de réinitialisation avec gestion des timeouts
  const handleSendResetEmail = async () => {
    setError(null);
    setSuccess(false);

    // Validation de l'email
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }

    setLoading(true);

    try {
      // Obtenir l'URL de redirection
      const redirectTo = `${window.location.origin}/reset-password`;

      // Créer une promesse de timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('TIMEOUT'));
        }, REQUEST_TIMEOUT);
      });

      // Envoyer la requête avec gestion du timeout
      const resetPromise = supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      });

      // Attendre la requête ou le timeout (celui qui se termine en premier)
      let result;
      try {
        result = await Promise.race([resetPromise, timeoutPromise]);
      } catch (raceError: any) {
        // Si le timeout gagne la course, on a une erreur TIMEOUT
        if (raceError?.message === 'TIMEOUT' || raceError?.message?.includes('TIMEOUT')) {
          throw new Error('TIMEOUT');
        }
        throw raceError;
      }

      // Si on arrive ici, la requête a réussi (pas de timeout)
      const { error: resetError } = result;

      if (resetError) {
        // Gestion des erreurs spécifiques
        if (resetError.message?.includes('timeout') || resetError.message?.includes('TIMEOUT')) {
          throw new Error('TIMEOUT');
        }

        // Erreur de rate limiting
        if (resetError.message?.includes('rate limit') || resetError.status === 429) {
          setError(
            'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.'
          );
          return;
        }

        // Erreur d'utilisateur non trouvé (pour la sécurité, on ne révèle pas si l'email existe)
        if (
          resetError.message?.includes('user not found') ||
          resetError.message?.includes('User not found')
        ) {
          // Pour la sécurité, on affiche un message générique même si l'utilisateur n'existe pas
          setSuccess(true);
          setEmailSent(true);
          return;
        }

        // Autres erreurs
        throw resetError;
      }

      // Succès
      setSuccess(true);
      setEmailSent(true);
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', err);

      // Détecter les différents types d'erreurs de timeout
      const errorMessage = err?.message || err?.error_description || String(err || '').toLowerCase();
      const errorStatus = err?.status || err?.statusCode || err?.code;

      // Erreur 504 Gateway Timeout (upstream request timeout)
      if (
        errorStatus === 504 ||
        errorMessage.includes('504') ||
        errorMessage.includes('gateway timeout') ||
        errorMessage.includes('upstream request timeout') ||
        errorMessage === 'timeout' ||
        errorMessage.includes('timeout')
      ) {
        setError(
          'Le serveur Supabase met trop de temps à répondre. Cela peut être dû à une surcharge temporaire. Veuillez réessayer dans quelques instants ou contacter le support si le problème persiste.'
        );
        return;
      }

      // Erreur réseau générale
      if (
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('networkerror')
      ) {
        setError(
          'Erreur de connexion réseau. Vérifiez votre connexion internet et réessayez.'
        );
        return;
      }

      // Erreur de rate limiting
      if (errorStatus === 429 || errorMessage.includes('rate limit')) {
        setError(
          'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.'
        );
        return;
      }

      // Pour toutes les autres erreurs, on affiche un message générique de succès
      // pour des raisons de sécurité (ne pas révéler si l'email existe ou non)
      // MAIS on log l'erreur pour le debugging
      console.warn('Erreur non gérée lors de l\'envoi de l\'email:', err);
      setSuccess(true);
      setEmailSent(true);
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire quand le dialog se ferme
  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setError(null);
      setSuccess(false);
      setEmailSent(false);
      onClose();
    }
  };

  // Gérer la soumission avec Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && email.trim()) {
      handleSendResetEmail();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6" component="span">
          Mot de passe oublié
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {success && emailSent ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle
              sx={{
                fontSize: 64,
                color: 'success.main',
                mb: 2,
              }}
            />
            <Typography variant="h6" gutterBottom color="success.main">
              Email envoyé avec succès
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email
              contenant un lien pour réinitialiser votre mot de passe.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Vérifiez votre boîte de réception et vos spams. Le lien expire dans 1 heure.
            </Typography>
            <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Conseil :</strong> Si vous ne recevez pas l'email, vérifiez que l'adresse
                est correcte et attendez quelques minutes.
              </Typography>
            </Alert>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" paragraph>
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre
              mot de passe.
            </Typography>

            {error && (
              <Alert
                severity="error"
                icon={<ErrorIcon />}
                sx={{ mb: 2 }}
                action={
                  <IconButton
                    size="small"
                    onClick={() => setError(null)}
                    color="inherit"
                  >
                    <Close fontSize="small" />
                  </IconButton>
                }
              >
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              autoFocus
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder="exemple@email.com"
              sx={{ mt: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              helperText="Vous recevrez un lien de réinitialisation par email"
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Le lien de réinitialisation sera valide pendant <strong>1 heure</strong>.
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {success && emailSent ? (
          <Button
            variant="contained"
            onClick={handleClose}
            fullWidth
            startIcon={<CheckCircle />}
          >
            Compris
          </Button>
        ) : (
          <>
            <Button
              onClick={handleClose}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleSendResetEmail}
              disabled={loading || !email.trim()}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Email />
                )
              }
            >
              {loading ? 'Envoi...' : 'Envoyer'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
