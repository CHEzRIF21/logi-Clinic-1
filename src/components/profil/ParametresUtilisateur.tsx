import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Save,
  Person,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { User } from '../../types/auth';
import { ExtendedUser, UserPermissionsService } from '../../services/userPermissionsService';
import { getMyClinicId } from '../../services/clinicService';
import AvatarUpload from './AvatarUpload';
import LanguageSelector from './LanguageSelector';

interface ParametresUtilisateurProps {
  user: User | null;
  onUpdate?: () => void;
}

const ParametresUtilisateur: React.FC<ParametresUtilisateurProps> = ({ user, onUpdate }) => {
  const [userDetails, setUserDetails] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    telephone: '',
    adresse: '',
  });

  useEffect(() => {
    const loadUserDetails = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);
        const details = await UserPermissionsService.getUserById(user.id);
        setUserDetails(details);
        setFormData({
          telephone: details.telephone || '',
          adresse: details.adresse || '',
        });
      } catch (err: any) {
        console.error('Erreur lors du chargement des détails:', err);
        setError(err.message || 'Erreur lors du chargement des détails');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadUserDetails();
    }
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const clinicId = await getMyClinicId();
      if (!clinicId) {
        throw new Error('Clinic ID manquant');
      }

      await UserPermissionsService.updateUser(user.id, {
        telephone: formData.telephone || undefined,
        adresse: formData.adresse || undefined,
      } as Partial<ExtendedUser>);

      setSuccess('Paramètres sauvegardés avec succès');
      
      // Recharger les détails
      const updatedDetails = await UserPermissionsService.getUserById(user.id);
      setUserDetails(updatedDetails);

      if (onUpdate) {
        onUpdate();
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (avatarUrl: string | null) => {
    if (userDetails) {
      setUserDetails({ ...userDetails, avatar_url: avatarUrl || undefined } as any);
    }
    if (onUpdate) {
      onUpdate();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!userDetails) {
    return (
      <Alert severity="error">
        Impossible de charger les informations utilisateur
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Paramètres utilisateur
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Photo de profil */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <AvatarUpload
                userId={user.id}
                currentAvatarUrl={userDetails.avatar_url}
                onAvatarChange={handleAvatarChange}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Langue */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <LanguageSelector userId={user.id} />
            </CardContent>
          </Card>
        </Grid>

        {/* Informations personnelles */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Person color="primary" />
                <Typography variant="h6">
                  Informations personnelles
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={userDetails.email}
                    disabled
                    helperText="L'email ne peut pas être modifié"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    placeholder="+221 XX XXX XX XX"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Adresse"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary', mb: 'auto', mt: 1 }} />,
                    }}
                    placeholder="Votre adresse complète"
                  />
                </Grid>
              </Grid>

              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ParametresUtilisateur;
