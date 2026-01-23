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
  AirlineSeatFlat,
  WaterDrop,
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
  patientConstantes: propPatientConstantes,
  onSave,
  userId,
}) => {
  const [patientConstantes, setPatientConstantes] = useState(propPatientConstantes);
  const [constantes, setConstantes] = useState<Partial<ConsultationConstantes>>({
    taille_cm: initialConstantes?.taille_cm || patientConstantes?.taille_cm,
    poids_kg: initialConstantes?.poids_kg || patientConstantes?.poids_kg,
    temperature_c: initialConstantes?.temperature_c || patientConstantes?.temperature_c,
    pouls_bpm: initialConstantes?.pouls_bpm || patientConstantes?.pouls_bpm,
    frequence_respiratoire: initialConstantes?.frequence_respiratoire,
    saturation_o2: initialConstantes?.saturation_o2,
    ta_bras_gauche_systolique: initialConstantes?.ta_bras_gauche_systolique || patientConstantes?.ta_systolique,
    ta_bras_gauche_diastolique: initialConstantes?.ta_bras_gauche_diastolique || patientConstantes?.ta_diastolique,
    ta_bras_droit_systolique: initialConstantes?.ta_bras_droit_systolique || patientConstantes?.ta_systolique,
    ta_bras_droit_diastolique: initialConstantes?.ta_bras_droit_diastolique || patientConstantes?.ta_diastolique,
  });

  const [imc, setImc] = useState<number | undefined>(() => {
    if (initialConstantes?.imc) return initialConstantes.imc;
    if (patientConstantes?.taille_cm && patientConstantes?.poids_kg) {
      const tailleEnMetres = patientConstantes.taille_cm / 100;
      return Number(((patientConstantes.poids_kg / (tailleEnMetres * tailleEnMetres))).toFixed(1));
    }
    return undefined;
  });
  const [syncToPatient, setSyncToPatient] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Mettre à jour patientConstantes quand la prop change
  useEffect(() => {
    if (propPatientConstantes) {
      setPatientConstantes(propPatientConstantes);
    }
  }, [propPatientConstantes]);

  // Charger les constantes du patient si non fournies
  useEffect(() => {
    const loadPatientConstantesIfNeeded = async () => {
      if (!propPatientConstantes && !initialConstantes) {
        try {
          const latestConstantes = await ConsultationService.getPatientLatestConstantes(patientId);
          if (latestConstantes) {
            const pc = {
              taille_cm: latestConstantes.taille_cm,
              poids_kg: latestConstantes.poids_kg,
              temperature_c: latestConstantes.temperature_c,
              pouls_bpm: latestConstantes.pouls_bpm,
              ta_systolique: latestConstantes.ta_bras_gauche_systolique || latestConstantes.ta_bras_droit_systolique,
              ta_diastolique: latestConstantes.ta_bras_gauche_diastolique || latestConstantes.ta_bras_droit_diastolique,
            };
            setPatientConstantes(pc);
            // Pré-remplir le formulaire avec les constantes du patient
            setConstantes(prev => ({
              ...prev,
              taille_cm: prev.taille_cm || pc.taille_cm,
              poids_kg: prev.poids_kg || pc.poids_kg,
              temperature_c: prev.temperature_c || pc.temperature_c,
              pouls_bpm: prev.pouls_bpm || pc.pouls_bpm,
              frequence_respiratoire: prev.frequence_respiratoire || latestConstantes.frequence_respiratoire,
              saturation_o2: prev.saturation_o2 || latestConstantes.saturation_o2,
              ta_bras_gauche_systolique: prev.ta_bras_gauche_systolique || pc.ta_systolique,
              ta_bras_gauche_diastolique: prev.ta_bras_gauche_diastolique || pc.ta_diastolique,
            }));
          }
        } catch (error) {
          console.error('Erreur chargement constantes patient:', error);
        }
      }
    };
    loadPatientConstantesIfNeeded();
  }, [patientId, propPatientConstantes, initialConstantes]);

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
            ta_bras_gauche_systolique: latestConstantes.ta_bras_gauche_systolique || latestConstantes.ta_bras_droit_systolique,
            ta_bras_gauche_diastolique: latestConstantes.ta_bras_gauche_diastolique || latestConstantes.ta_bras_droit_diastolique,
            ta_bras_droit_systolique: latestConstantes.ta_bras_droit_systolique || latestConstantes.ta_bras_gauche_systolique,
            ta_bras_droit_diastolique: latestConstantes.ta_bras_droit_diastolique || latestConstantes.ta_bras_gauche_diastolique,
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
      if (syncToPatient) {
        // Recharger les constantes du patient après synchronisation
        const latestConstantes = await ConsultationService.getPatientLatestConstantes(patientId);
        if (latestConstantes) {
          setPatientConstantes({
            taille_cm: latestConstantes.taille_cm,
            poids_kg: latestConstantes.poids_kg,
            temperature_c: latestConstantes.temperature_c,
            pouls_bpm: latestConstantes.pouls_bpm,
            ta_systolique: latestConstantes.ta_bras_gauche_systolique || latestConstantes.ta_bras_droit_systolique,
            ta_diastolique: latestConstantes.ta_bras_gauche_diastolique || latestConstantes.ta_bras_droit_diastolique,
          });
          // Mettre à jour aussi les champs FR et SpO₂ dans le formulaire
          setConstantes(prev => ({
            ...prev,
            frequence_respiratoire: latestConstantes.frequence_respiratoire !== undefined ? latestConstantes.frequence_respiratoire : prev.frequence_respiratoire,
            saturation_o2: latestConstantes.saturation_o2 !== undefined ? latestConstantes.saturation_o2 : prev.saturation_o2,
          }));
        }
      }
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des constantes:', error);
      alert('Erreur lors de la sauvegarde des constantes. Veuillez réessayer.');
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
              {syncToPatient 
                ? 'Constantes sauvegardées et synchronisées au dossier patient' 
                : 'Constantes sauvegardées'}
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

          {/* Pouls / FC */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="FC (bpm)"
              type="number"
              value={constantes.pouls_bpm || ''}
              onChange={(e) => handleChange('pouls_bpm', parseInt(e.target.value) || undefined)}
              InputProps={{
                startAdornment: <Favorite sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              helperText="Fréquence cardiaque"
            />
          </Grid>

          {/* Fréquence Respiratoire */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="FR (/min)"
              type="number"
              value={constantes.frequence_respiratoire || ''}
              onChange={(e) => handleChange('frequence_respiratoire', parseInt(e.target.value) || undefined)}
              InputProps={{
                startAdornment: <AirlineSeatFlat sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              helperText="Fréquence respiratoire"
            />
          </Grid>

          {/* Saturation en Oxygène */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="SpO₂ (%)"
              type="number"
              value={constantes.saturation_o2 || ''}
              onChange={(e) => handleChange('saturation_o2', parseInt(e.target.value) || undefined)}
              InputProps={{
                startAdornment: <WaterDrop sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              helperText="Saturation en oxygène"
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>

          {/* Tension Artérielle */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Tension Artérielle (mmHg)
            </Typography>
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                label="TA Systolique"
                type="number"
                value={constantes.ta_bras_gauche_systolique || constantes.ta_bras_droit_systolique || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || undefined;
                  handleChange('ta_bras_gauche_systolique', value);
                  // Synchroniser aussi avec le bras droit pour cohérence
                  if (value !== undefined) {
                    handleChange('ta_bras_droit_systolique', value);
                  }
                }}
                InputProps={{
                  startAdornment: <MonitorHeart sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <TextField
                fullWidth
                label="TA Diastolique"
                type="number"
                value={constantes.ta_bras_gauche_diastolique || constantes.ta_bras_droit_diastolique || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || undefined;
                  handleChange('ta_bras_gauche_diastolique', value);
                  // Synchroniser aussi avec le bras droit pour cohérence
                  if (value !== undefined) {
                    handleChange('ta_bras_droit_diastolique', value);
                  }
                }}
              />
            </Box>
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

