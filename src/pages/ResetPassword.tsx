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
  // IMPORTANT: Utiliser uniquement onAuthStateChange avec PASSWORD_RECOVERY
  // Ne jamais faire confiance à app_metadata qui peut être manipulé
  useEffect(() => {
    let mounted = true;

    // Nettoyer l'URL après avoir lu les paramètres (pour la sécurité)
    const cleanUrl = () => {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };

    // Écouter les changements d'état d'authentification
    // C'est la SEULE source de vérité pour détecter PASSWORD_RECOVERY
    // IMPORTANT: Créer le listener AVANT de traiter les tokens pour ne pas manquer l'événement
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log('🔐 Reset Password - Event détecté:', event);

        if (event === "PASSWORD_RECOVERY") {
          // ✅ Session recovery détectée - autoriser le formulaire
          console.log('✅ PASSWORD_RECOVERY détecté - autorisation du formulaire');
          cleanUrl(); // Nettoyer l'URL quand on détecte l'événement
          setReady(true);
          setCheckingSession(false);
        } else if (event === "SIGNED_OUT" && !session && !ready) {
          // Si on est déconnecté et qu'on n'a pas de session recovery, c'est invalide
          console.log('❌ SIGNED_OUT sans session recovery - accès refusé');
          setError('Lien de réinitialisation invalide ou expiré.');
          setCheckingSession(false);
        }
      }
    );

    // Traiter les tokens dans l'URL si présents (nécessaire pour créer la session recovery)
    const processUrlTokens = async () => {
      try {
        // Vérifier les hash parameters (#) - méthode principale de Supabase
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('🔐 Reset Password - Tokens dans URL:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken, 
          type 
        });

        // Si on a un token de type recovery, échanger pour une session
        if (accessToken && type === 'recovery') {
          console.log('🔐 Reset Password - Traitement du token recovery');
          cleanUrl(); // Nettoyer l'URL immédiatement pour la sécurité

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('❌ Erreur lors de la récupération de session:', error);
            if (mounted) {
              setError('Lien de réinitialisation invalide ou expiré.');
              setCheckingSession(false);
            }
            return;
          }

          // Vérifier que la session a été créée
          if (data.session) {
            console.log('✅ Session créée avec succès - attente de PASSWORD_RECOVERY');
            // Note: onAuthStateChange devrait détecter PASSWORD_RECOVERY maintenant
            // Si ce n'est pas le cas, vérifier la session après un court délai
            setTimeout(async () => {
              if (mounted && !ready) {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                if (currentSession && mounted && !ready) {
                  // Si on a une session mais que PASSWORD_RECOVERY n'a pas été détecté,
                  // c'est peut-être une session recovery qui n'a pas déclenché l'événement
                  // Dans ce cas, on accepte quand même (fallback de sécurité)
                  console.log('⚠️ Session détectée mais PASSWORD_RECOVERY non déclenché - fallback');
                  setReady(true);
                  setCheckingSession(false);
                }
              }
            }, 500);
          }
        } else {
          // Pas de tokens dans l'URL - vérifier si on a déjà une session recovery
          console.log('🔐 Reset Password - Pas de tokens dans URL, vérification de la session actuelle');
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession) {
            // Pas de session du tout - accès refusé
            console.log('❌ Aucune session détectée - accès refusé');
            if (mounted) {
              setError('Lien de réinitialisation invalide ou expiré.');
              setCheckingSession(false);
            }
          }
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du traitement des tokens:', err);
        if (mounted) {
          setError('Erreur lors de la vérification du lien de réinitialisation.');
          setCheckingSession(false);
        }
      }
    };

    // Traiter les tokens dans l'URL (le listener est déjà actif)
    processUrlTokens();

    // Timeout de sécurité : si après 3 secondes on n'a pas détecté PASSWORD_RECOVERY, c'est invalide
    const timeoutId = setTimeout(() => {
      if (mounted && !ready && checkingSession) {
        console.log('⏱️ Timeout - PASSWORD_RECOVERY non détecté après 3 secondes');
        setError('Lien de réinitialisation invalide ou expiré.');
        setCheckingSession(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
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

      // Sécurité : fermer IMMÉDIATEMENT la session recovery (one-shot)
      // La session recovery ne doit être utilisée qu'une seule fois
      await supabase.auth.signOut();
      
      // Rediriger vers la page de connexion après un court délai pour afficher le message de succès
      setTimeout(() => {
        navigate("/login");
      }, 1500);
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
