import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Button,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  MonitorHeart,
  Save,
  Sync,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { ConsultationConstantes } from '../../services/consultationApiService';
import { ConsultationService } from '../../services/consultationService';
import { PatientService } from '../../services/patientService';
import { Patient } from '../../services/supabase';

interface SignesVitauxSectionProps {
  consultationId: string;
  patientId: string;
  userId: string;
  onSave: (constantes: Partial<ConsultationConstantes>, syncToPatient: boolean) => Promise<void>;
}

export const SignesVitauxSection: React.FC<SignesVitauxSectionProps> = ({
  consultationId,
  patientId,
  userId,
  onSave,
}) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [constantes, setConstantes] = useState<Partial<ConsultationConstantes>>({});
  const [imc, setImc] = useState<number | undefined>();
  const [syncToPatient, setSyncToPatient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  // Seuils configurables pour les alertes
  const SEUILS = {
    temperature: { min: 36.0, max: 37.5 },
    tension_systolique: { min: 90, max: 140 },
    tension_diastolique: { min: 60, max: 90 },
    pouls: { min: 60, max: 100 },
    saturation_o2: { min: 95, max: 100 },
    frequence_respiratoire: { min: 12, max: 20 },
    glycemie: { min: 70, max: 100 }, // À jeun
    imc: { min: 18.5, max: 25 },
  };

  useEffect(() => {
    loadPatientData();
    loadConsultationConstantes();
  }, [patientId, consultationId]);

  const loadPatientData = async () => {
    try {
      const patientData = await PatientService.getPatientById(patientId);
      setPatient(patientData);
    } catch (error) {
      console.error('Erreur lors du chargement des données patient:', error);
    }
  };

  const loadConsultationConstantes = async () => {
    try {
      // Charger les constantes déjà enregistrées pour cette consultation
      const existingConstantes = await ConsultationService.getConstantes(consultationId);
      
      if (existingConstantes) {
        // Charger les constantes existantes
        setConstantes({
          taille_cm: existingConstantes.taille_cm,
          poids_kg: existingConstantes.poids_kg,
          imc: existingConstantes.imc,
          temperature_c: existingConstantes.temperature_c,
          pouls_bpm: existingConstantes.pouls_bpm,
          ta_bras_gauche_systolique: existingConstantes.ta_bras_gauche_systolique,
          ta_bras_gauche_diastolique: existingConstantes.ta_bras_gauche_diastolique,
          ta_bras_droit_systolique: existingConstantes.ta_bras_droit_systolique,
          ta_bras_droit_diastolique: existingConstantes.ta_bras_droit_diastolique,
          hauteur_uterine: existingConstantes.hauteur_uterine,
        });
        setImc(existingConstantes.imc);
      } else {
        // Si aucune constante n'existe, charger depuis le dossier patient
        const patientData = await PatientService.getPatientById(patientId);
        if (patientData) {
          setConstantes({
            taille_cm: (patientData as any).taille_cm,
            poids_kg: (patientData as any).poids_kg,
            temperature_c: (patientData as any).temperature_c,
            pouls_bpm: (patientData as any).pouls_bpm,
            ta_bras_gauche_systolique: (patientData as any).ta_systolique,
            ta_bras_gauche_diastolique: (patientData as any).ta_diastolique,
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des constantes:', error);
      // En cas d'erreur, charger depuis le dossier patient
      try {
        const patientData = await PatientService.getPatientById(patientId);
        if (patientData) {
          setConstantes({
            taille_cm: (patientData as any).taille_cm,
            poids_kg: (patientData as any).poids_kg,
            temperature_c: (patientData as any).temperature_c,
            pouls_bpm: (patientData as any).pouls_bpm,
            ta_bras_gauche_systolique: (patientData as any).ta_systolique,
            ta_bras_gauche_diastolique: (patientData as any).ta_diastolique,
          });
        }
      } catch (patientError) {
        console.error('Erreur lors du chargement des données patient:', patientError);
      }
    }
  };

  const checkAlerts = (updated: Partial<ConsultationConstantes>) => {
    const newAlerts: string[] = [];

    // Vérifier la température
    if (updated.temperature_c !== undefined) {
      if (updated.temperature_c < SEUILS.temperature.min) {
        newAlerts.push(`⚠️ Température basse (${updated.temperature_c}°C) - Hypothermie possible`);
      } else if (updated.temperature_c > SEUILS.temperature.max) {
        newAlerts.push(`⚠️ Température élevée (${updated.temperature_c}°C) - Fièvre détectée`);
      }
    }

    // Vérifier la tension artérielle
    if (updated.ta_bras_gauche_systolique !== undefined) {
      if (updated.ta_bras_gauche_systolique < SEUILS.tension_systolique.min) {
        newAlerts.push(`⚠️ Tension systolique basse (${updated.ta_bras_gauche_systolique} mmHg) - Hypotension`);
      } else if (updated.ta_bras_gauche_systolique > SEUILS.tension_systolique.max) {
        newAlerts.push(`⚠️ Tension systolique élevée (${updated.ta_bras_gauche_systolique} mmHg) - Hypertension`);
      }
    }
    if (updated.ta_bras_gauche_diastolique !== undefined) {
      if (updated.ta_bras_gauche_diastolique < SEUILS.tension_diastolique.min) {
        newAlerts.push(`⚠️ Tension diastolique basse (${updated.ta_bras_gauche_diastolique} mmHg)`);
      } else if (updated.ta_bras_gauche_diastolique > SEUILS.tension_diastolique.max) {
        newAlerts.push(`⚠️ Tension diastolique élevée (${updated.ta_bras_gauche_diastolique} mmHg) - Hypertension`);
      }
    }

    // Vérifier le pouls
    if (updated.pouls_bpm !== undefined) {
      if (updated.pouls_bpm < SEUILS.pouls.min) {
        newAlerts.push(`⚠️ Pouls faible (${updated.pouls_bpm} bpm) - Bradycardie`);
      } else if (updated.pouls_bpm > SEUILS.pouls.max) {
        newAlerts.push(`⚠️ Pouls élevé (${updated.pouls_bpm} bpm) - Tachycardie`);
      }
    }

    // Vérifier la saturation O2
    const saturation = (updated as any).saturation_o2;
    if (saturation !== undefined) {
      if (saturation < SEUILS.saturation_o2.min) {
        newAlerts.push(`🚨 Saturation O2 faible (${saturation}%) - Hypoxémie - ALERTE`);
      }
    }

    // Vérifier la fréquence respiratoire
    const freqResp = (updated as any).frequence_respiratoire;
    if (freqResp !== undefined) {
      if (freqResp < SEUILS.frequence_respiratoire.min) {
        newAlerts.push(`⚠️ Fréquence respiratoire faible (${freqResp}/min) - Bradypnée`);
      } else if (freqResp > SEUILS.frequence_respiratoire.max) {
        newAlerts.push(`⚠️ Fréquence respiratoire élevée (${freqResp}/min) - Tachypnée`);
      }
    }

    // Vérifier la glycémie
    const glycemie = (updated as any).glycemie_capillaire;
    if (glycemie !== undefined) {
      if (glycemie < SEUILS.glycemie.min) {
        newAlerts.push(`🚨 Glycémie basse (${glycemie} mg/dL) - Hypoglycémie - ALERTE`);
      } else if (glycemie > SEUILS.glycemie.max * 1.4) {
        newAlerts.push(`⚠️ Glycémie élevée (${glycemie} mg/dL) - Hyperglycémie possible`);
      }
    }

    // Vérifier l'IMC
    const currentImc = updated.imc || imc;
    if (currentImc !== undefined) {
      if (currentImc < SEUILS.imc.min) {
        newAlerts.push(`⚠️ IMC faible (${currentImc}) - Insuffisance pondérale`);
      } else if (currentImc > SEUILS.imc.max) {
        newAlerts.push(`⚠️ IMC élevé (${currentImc}) - Surpoids/Obésité`);
      }
    }

    setAlerts(newAlerts);
  };

  const handleChange = (field: keyof ConsultationConstantes, value: number | undefined) => {
    const updated = { ...constantes, [field]: value };
    setConstantes(updated);

    // Calculer l'IMC automatiquement
    if (field === 'taille_cm' || field === 'poids_kg') {
      const taille = field === 'taille_cm' ? value : constantes.taille_cm;
      const poids = field === 'poids_kg' ? value : constantes.poids_kg;
      if (taille && poids && taille > 0) {
        const tailleEnMetres = taille / 100;
        const imcValue = Number((poids / (tailleEnMetres * tailleEnMetres)).toFixed(1));
        setImc(imcValue);
        updated.imc = imcValue;
      } else {
        setImc(undefined);
      }
    }

    // Vérifier les alertes
    checkAlerts(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({ ...constantes, imc }, syncToPatient);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <MonitorHeart color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" gutterBottom>
              Signes Vitaux
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Affichage des signes vitaux déjà enregistrés + possibilité d'en ajouter ou modifier
            </Typography>
          </Box>
        </Box>

        {patient && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {constantes.taille_cm || constantes.poids_kg || constantes.temperature_c
              ? 'Signes vitaux chargés depuis la consultation précédente. Vous pouvez les modifier.'
              : `Données chargées depuis le dossier patient: ${patient.prenom} ${patient.nom}`}
          </Alert>
        )}

        {/* Affichage des alertes */}
        {alerts.length > 0 && (
          <Box mb={2}>
            {alerts.map((alert, index) => (
              <Alert
                key={index}
                severity={alert.includes('🚨') ? 'error' : 'warning'}
                icon={alert.includes('🚨') ? <Error /> : <Warning />}
                sx={{ mb: 1 }}
              >
                {alert}
              </Alert>
            ))}
          </Box>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Température (°C)"
              value={constantes.temperature_c || ''}
              onChange={(e) => handleChange('temperature_c', parseFloat(e.target.value) || undefined)}
              InputProps={{
                inputProps: { min: 0, max: 50, step: 0.1 },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                type="number"
                label="TA Systolique (mmHg)"
                value={constantes.ta_bras_gauche_systolique || ''}
                onChange={(e) =>
                  handleChange('ta_bras_gauche_systolique', parseInt(e.target.value) || undefined)
                }
              />
              <TextField
                fullWidth
                type="number"
                label="TA Diastolique (mmHg)"
                value={constantes.ta_bras_gauche_diastolique || ''}
                onChange={(e) =>
                  handleChange('ta_bras_gauche_diastolique', parseInt(e.target.value) || undefined)
                }
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Poids (kg)"
              value={constantes.poids_kg || ''}
              onChange={(e) => handleChange('poids_kg', parseFloat(e.target.value) || undefined)}
              InputProps={{
                inputProps: { min: 0, max: 500, step: 0.1 },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Taille (cm)"
              value={constantes.taille_cm || ''}
              onChange={(e) => handleChange('taille_cm', parseFloat(e.target.value) || undefined)}
              InputProps={{
                inputProps: { min: 0, max: 300, step: 0.1 },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="IMC"
              value={imc !== undefined ? imc.toFixed(1) : ''}
              InputProps={{
                readOnly: true,
              }}
              helperText={
                imc !== undefined
                  ? imc < 18.5
                    ? 'Insuffisance pondérale'
                    : imc < 25
                    ? 'Normal'
                    : imc < 30
                    ? 'Surpoids'
                    : 'Obésité'
                  : 'Calculé automatiquement'
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Saturation O2 (%)"
              value={(constantes as any).saturation_o2 || ''}
              onChange={(e) =>
                handleChange('saturation_o2' as any, parseFloat(e.target.value) || undefined)
              }
              InputProps={{
                inputProps: { min: 0, max: 100, step: 0.1 },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Fréquence Cardiaque (bpm)"
              value={constantes.pouls_bpm || ''}
              onChange={(e) => handleChange('pouls_bpm', parseInt(e.target.value) || undefined)}
              InputProps={{
                inputProps: { min: 0, max: 300 },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Fréquence Respiratoire (cpm)"
              value={(constantes as any).frequence_respiratoire || ''}
              onChange={(e) =>
                handleChange('frequence_respiratoire' as any, parseInt(e.target.value) || undefined)
              }
              InputProps={{
                inputProps: { min: 0, max: 100 },
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <input
              type="checkbox"
              checked={syncToPatient}
              onChange={(e) => setSyncToPatient(e.target.checked)}
            />
            <Typography variant="body2">
              Synchroniser avec le dossier patient
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading}
          >
            Enregistrer les Signes Vitaux
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

