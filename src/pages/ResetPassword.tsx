"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from "@mui/material";
import { Lock, CheckCircle, Error as ErrorIcon } from "@mui/icons-material";
import Logo from "../components/ui/Logo";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // 🔐 Vérifier que la session est bien en mode recovery
  useEffect(() => {
    let mounted = true;
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const checkSession = async () => {
      try {
        // Nettoyer l'URL après avoir lu les paramètres (pour la sécurité)
        const cleanUrl = () => {
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        };

        // Vérifier d'abord les hash parameters (#) - méthode principale de Supabase
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        // Vérifier aussi les query parameters (?) au cas où
        const queryParams = new URLSearchParams(window.location.search);
        const queryAccessToken = queryParams.get('access_token');
        const queryRefreshToken = queryParams.get('refresh_token');
        const queryType = queryParams.get('type');

        // Utiliser les hash params en priorité, sinon les query params
        const token = accessToken || queryAccessToken;
        const refresh = refreshToken || queryRefreshToken;
        const tokenType = type || queryType;

        // Si on a un token et que c'est un type recovery, on est prêt
        if (token && tokenType === 'recovery') {
          // Nettoyer l'URL immédiatement pour la sécurité
          cleanUrl();

          // Échanger le token pour une session
          const { data, error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: refresh || '',
          });

          if (error) {
            console.error('Erreur lors de la récupération de session:', error);
            if (mounted) {
              setError('Lien de réinitialisation invalide ou expiré.');
              setCheckingSession(false);
            }
            return;
          }

          // Vérifier que la session est bien en mode recovery
          if (data.session) {
            if (mounted) {
              setReady(true);
              setCheckingSession(false);
            }
            return;
          }
        }

        // Écouter les changements d'état d'authentification
        authListener = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (mounted) {
              if (event === "PASSWORD_RECOVERY") {
                cleanUrl(); // Nettoyer l'URL quand on détecte l'événement
                setReady(true);
                setCheckingSession(false);
              } else if (event === "SIGNED_OUT" && !session && !ready) {
                // Si on est déconnecté et qu'on n'a pas de session recovery, c'est invalide
                setError('Lien de réinitialisation invalide ou expiré.');
                setCheckingSession(false);
              }
            }
          }
        );

        // Vérifier la session actuelle après un court délai
        setTimeout(async () => {
          if (mounted && !ready && checkingSession) {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
              // Si on a une session mais qu'on n'a pas encore détecté PASSWORD_RECOVERY,
              // vérifier si c'est une session recovery valide
              if (session) {
                // Vérifier si c'est une session recovery en regardant les métadonnées
                const isRecovery = session.user?.app_metadata?.recovery || false;
                if (isRecovery) {
                  setReady(true);
                } else {
                  // Si ce n'est pas une session recovery, c'est invalide
                  setError('Lien de réinitialisation invalide ou expiré.');
                }
              } else {
                setError('Lien de réinitialisation invalide ou expiré.');
              }
              setCheckingSession(false);
            }
          }
        }, 2000);
      } catch (err: any) {
        console.error('Erreur lors de la vérification de session:', err);
        if (mounted) {
          setError('Erreur lors de la vérification du lien de réinitialisation.');
          setCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      if (authListener) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    // Vérification de complexité basique
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError("Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || "Erreur lors de la mise à jour du mot de passe.");
        setLoading(false);
        return;
      }

      // Succès
      setSuccess(true);

      // Sécurité : on ferme la session recovery après un court délai
      setTimeout(async () => {
        await supabase.auth.signOut();
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      }, 2000);
    } catch (err: any) {
      console.error('Erreur lors de la réinitialisation:', err);
      setError(err.message || "Une erreur inattendue s'est produite.");
      setLoading(false);
    }
  };

  // Affichage pendant la vérification de session
  if (checkingSession) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50",
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              bgcolor: theme.palette.mode === "dark" ? "background.paper" : "white",
            }}
          >
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Vérification du lien de réinitialisation...
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  // ❌ Accès direct sans lien email valide
  if (!ready && !success) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50",
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              bgcolor: theme.palette.mode === "dark" ? "background.paper" : "white",
            }}
          >
            <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom color="error">
              Lien invalide ou expiré
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Ce lien de réinitialisation est invalide ou a expiré.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Veuillez demander un nouveau lien de réinitialisation depuis la page de connexion.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/login")}
              sx={{ mt: 2 }}
            >
              Retour à la connexion
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50",
        px: 2,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            bgcolor: theme.palette.mode === "dark" ? "background.paper" : "white",
            borderRadius: 2,
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Logo />
          </Box>

          <Typography
            variant="h5"
            component="h1"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600, mb: 1 }}
          >
            Réinitialiser le mot de passe
          </Typography>

          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Entrez votre nouveau mot de passe ci-dessous
          </Typography>

          {error && (
            <Alert
              severity="error"
              icon={<ErrorIcon />}
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {success ? (
            <Box sx={{ textAlign: "center" }}>
              <CheckCircle
                sx={{
                  fontSize: 64,
                  color: "success.main",
                  mb: 2,
                }}
              />
              <Typography variant="h6" color="success.main" gutterBottom>
                Mot de passe mis à jour avec succès
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirection vers la page de connexion...
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleReset}>
              <TextField
                fullWidth
                type="password"
                label="Nouveau mot de passe"
                placeholder="Entrez votre nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <Lock
                      sx={{
                        color: "action.active",
                        mr: 1,
                        fontSize: 20,
                      }}
                    />
                  ),
                }}
                helperText="Minimum 8 caractères avec majuscule, minuscule et chiffre"
              />

              <TextField
                fullWidth
                type="password"
                label="Confirmer le mot de passe"
                placeholder="Confirmez votre nouveau mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <Lock
                      sx={{
                        color: "action.active",
                        mr: 1,
                        fontSize: 20,
                      }}
                    />
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !password || !confirmPassword}
                sx={{
                  mb: 2,
                  py: 1.5,
                  fontWeight: 600,
                  bgcolor: theme.palette.primary.main,
                  "&:hover": {
                    bgcolor: theme.palette.primary.dark,
                  },
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                    Mise à jour...
                  </>
                ) : (
                  "Valider"
                )}
              </Button>

              <Button
                fullWidth
                variant="text"
                onClick={() => navigate("/login")}
                disabled={loading}
                sx={{ mt: 1 }}
              >
                Retour à la connexion
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
