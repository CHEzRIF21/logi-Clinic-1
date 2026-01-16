import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
} from '@mui/material';
import {
  Save,
  Sync,
  Height,
  Scale,
  LocalFireDepartment,
  Favorite,
  MonitorHeart,
} from '@mui/icons-material';
import { ConsultationConstantes } from '../../services/consultationApiService';
import { ConsultationService } from '../../services/consultationService';
import { validateConstantes } from './ConstantesValidation';

interface ConstantesSectionProps {
  consultationId: string;
  patientId: string;
  initialConstantes?: ConsultationConstantes | null;
  patientConstantes?: {
    taille_cm?: number;
    poids_kg?: number;
    temperature_c?: number;
    pouls_bpm?: number;
    ta_systolique?: number;
    ta_diastolique?: number;
  };
  onSave: (constantes: Partial<ConsultationConstantes>, syncToPatient: boolean) => Promise<void>;
  userId: string;
}

export const ConstantesSection: React.FC<ConstantesSectionProps> = ({
  consultationId,
  patientId,
  initialConstantes,
  patientConstantes,
  onSave,
  userId,
}) => {
  const [constantes, setConstantes] = useState<Partial<ConsultationConstantes>>({
    taille_cm: initialConstantes?.taille_cm || patientConstantes?.taille_cm,
    poids_kg: initialConstantes?.poids_kg || patientConstantes?.poids_kg,
    temperature_c: initialConstantes?.temperature_c || patientConstantes?.temperature_c,
    pouls_bpm: initialConstantes?.pouls_bpm || patientConstantes?.pouls_bpm,
    ta_bras_gauche_systolique: initialConstantes?.ta_bras_gauche_systolique || patientConstantes?.ta_systolique,
    ta_bras_gauche_diastolique: initialConstantes?.ta_bras_gauche_diastolique || patientConstantes?.ta_diastolique,
    ta_bras_droit_systolique: initialConstantes?.ta_bras_droit_systolique,
    ta_bras_droit_diastolique: initialConstantes?.ta_bras_droit_diastolique,
    hauteur_uterine: initialConstantes?.hauteur_uterine,
  });

  const [imc, setImc] = useState<number | undefined>(initialConstantes?.imc);
  const [syncToPatient, setSyncToPatient] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Calculer l'IMC automatiquement
  useEffect(() => {
    if (constantes.taille_cm && constantes.poids_kg && constantes.taille_cm > 0) {
      const tailleEnMetres = constantes.taille_cm / 100;
      const imcValue = Number((constantes.poids_kg / (tailleEnMetres * tailleEnMetres)).toFixed(1));
      setImc(imcValue);
    } else {
      setImc(undefined);
    }
  }, [constantes.taille_cm, constantes.poids_kg]);

  const handleChange = (field: keyof ConsultationConstantes, value: any) => {
    setConstantes((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSyncFromPatient = async () => {
    setSyncing(true);
    try {
      // Récupérer les dernières constantes du patient depuis les consultations précédentes
      const latestConstantes = await ConsultationService.getPatientLatestConstantes(patientId);
      
      if (latestConstantes) {
        // Charger les constantes dans le formulaire
        setConstantes({
          taille_cm: latestConstantes.taille_cm,
          poids_kg: latestConstantes.poids_kg,
          temperature_c: latestConstantes.temperature_c,
          pouls_bpm: latestConstantes.pouls_bpm,
          frequence_respiratoire: latestConstantes.frequence_respiratoire,
          saturation_o2: latestConstantes.saturation_o2,
          glycemie_mg_dl: latestConstantes.glycemie_mg_dl,
          ta_bras_gauche_systolique: latestConstantes.ta_bras_gauche_systolique,
          ta_bras_gauche_diastolique: latestConstantes.ta_bras_gauche_diastolique,
          ta_bras_droit_systolique: latestConstantes.ta_bras_droit_systolique,
          ta_bras_droit_diastolique: latestConstantes.ta_bras_droit_diastolique,
          hauteur_uterine: latestConstantes.hauteur_uterine,
        });
        setImc(latestConstantes.imc);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Aucune constante médicale trouvée dans le dossier patient');
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      alert('Erreur lors de la récupération des constantes du dossier patient');
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    // Valider les constantes avant sauvegarde
    const validation = validateConstantes(constantes);
    
    if (!validation.valid) {
      // Afficher les erreurs de validation
      const errorMessages = Object.values(validation.errors).join(', ');
      alert(`Erreurs de validation: ${errorMessages}`);
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          ...constantes,
          imc,
        },
        syncToPatient
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des constantes:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Constantes Médicales
          </Typography>
          {saved && (
            <Alert severity="success" sx={{ py: 0 }}>
              Constantes sauvegardées
            </Alert>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* Taille */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Taille (cm)"
              type="number"
              value={constantes.taille_cm || ''}
              onChange={(e) => handleChange('taille_cm', parseFloat(e.target.value) || undefined)}
              InputProps={{
                startAdornment: <Height sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          {/* Poids */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Poids (kg)"
              type="number"
              value={constantes.poids_kg || ''}
              onChange={(e) => handleChange('poids_kg', parseFloat(e.target.value) || undefined)}
              InputProps={{
                startAdornment: <Scale sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          {/* IMC (calculé automatiquement) */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="IMC"
              value={imc || ''}
              disabled
              InputProps={{
                startAdornment: <Scale sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              helperText={
                imc
                  ? imc < 18.5
                    ? 'Insuffisance pondérale'
                    : imc < 25
                    ? 'Normal'
                    : imc < 30
                    ? 'Surpoids'
                    : 'Obésité'
                  : ''
              }
            />
          </Grid>

          {/* Température */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Température (°C)"
              type="number"
              value={constantes.temperature_c || ''}
              onChange={(e) => handleChange('temperature_c', parseFloat(e.target.value) || undefined)}
              InputProps={{
                startAdornment: <LocalFireDepartment sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          {/* Pouls */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Pouls (BPM)"
              type="number"
              value={constantes.pouls_bpm || ''}
              onChange={(e) => handleChange('pouls_bpm', parseInt(e.target.value) || undefined)}
              InputProps={{
                startAdornment: <Favorite sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          {/* Tension Artérielle - Bras Gauche */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Tension Artérielle - Bras Gauche
            </Typography>
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                label="Systolique"
                type="number"
                value={constantes.ta_bras_gauche_systolique || ''}
                onChange={(e) =>
                  handleChange('ta_bras_gauche_systolique', parseInt(e.target.value) || undefined)
                }
                InputProps={{
                  startAdornment: <MonitorHeart sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <TextField
                fullWidth
                label="Diastolique"
                type="number"
                value={constantes.ta_bras_gauche_diastolique || ''}
                onChange={(e) =>
                  handleChange('ta_bras_gauche_diastolique', parseInt(e.target.value) || undefined)
                }
              />
            </Box>
          </Grid>

          {/* Tension Artérielle - Bras Droit */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Tension Artérielle - Bras Droit
            </Typography>
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                label="Systolique"
                type="number"
                value={constantes.ta_bras_droit_systolique || ''}
                onChange={(e) =>
                  handleChange('ta_bras_droit_systolique', parseInt(e.target.value) || undefined)
                }
              />
              <TextField
                fullWidth
                label="Diastolique"
                type="number"
                value={constantes.ta_bras_droit_diastolique || ''}
                onChange={(e) =>
                  handleChange('ta_bras_droit_diastolique', parseInt(e.target.value) || undefined)
                }
              />
            </Box>
          </Grid>

          {/* Hauteur Utérine (pour maternité) */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Hauteur Utérine (cm)"
              type="number"
              value={constantes.hauteur_uterine || ''}
              onChange={(e) => handleChange('hauteur_uterine', parseFloat(e.target.value) || undefined)}
              helperText="Pour consultations maternité"
            />
          </Grid>
        </Grid>

        <Box mt={3} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" gap={2} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<Sync />}
              onClick={handleSyncFromPatient}
              disabled={syncing || saving}
              size="small"
            >
              {syncing ? 'Synchronisation...' : 'Synchroniser au dossier patient'}
            </Button>
            <FormControlLabel
              control={
                <Switch
                  checked={syncToPatient}
                  onChange={(e) => setSyncToPatient(e.target.checked)}
                  color="primary"
                />
              }
              label="Appliquer au dossier patient lors de la sauvegarde"
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving || syncing}
            sx={{ minWidth: 150 }}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

