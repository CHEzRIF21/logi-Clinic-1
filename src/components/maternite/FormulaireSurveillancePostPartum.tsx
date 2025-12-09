import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Save,
  CheckCircle,
  Refresh,
  Mic,
  Stop,
} from '@mui/icons-material';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import {
  PostPartumService,
  SurveillancePostPartum,
  ObservationPostPartum,
} from '../../services/postPartumService';

interface FormulaireSurveillancePostPartumProps {
  accouchementId: string;
  onClose: () => void;
}

const FormulaireSurveillancePostPartum: React.FC<FormulaireSurveillancePostPartumProps> = ({
  accouchementId,
  onClose,
}) => {
  const [surveillance, setSurveillance] = useState<SurveillancePostPartum | null>(null);
  const [observations, setObservations] = useState<ObservationPostPartum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<ObservationPostPartum | null>(null);
  const [openObservationDialog, setOpenObservationDialog] = useState(false);

  const loadSurveillance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let surv = await PostPartumService.getSurveillanceByAccouchement(accouchementId);
      
      if (!surv) {
        // Créer une nouvelle surveillance
        surv = await PostPartumService.createSurveillance({
          accouchement_id: accouchementId,
          duree_surveillance: 120,
          statut: 'en_cours',
        });
      }
      
      setSurveillance(surv);
      
      if (surv.id) {
        const obs = await PostPartumService.getObservations(surv.id);
        setObservations(obs);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [accouchementId]);

  useEffect(() => {
    loadSurveillance();
  }, [loadSurveillance]);

  const handleOpenObservation = (observation: ObservationPostPartum) => {
    setSelectedObservation(observation);
    setOpenObservationDialog(true);
  };

  const handleSaveObservation = async (observationData: Partial<ObservationPostPartum>) => {
    try {
      if (selectedObservation?.id) {
        await PostPartumService.saveObservation({
          ...selectedObservation,
          ...observationData,
        } as ObservationPostPartum);
      }
      await loadSurveillance();
      setOpenObservationDialog(false);
      setSelectedObservation(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  const getAlertLevel = (observation: ObservationPostPartum): 'normal' | 'modere' | 'severe' | 'critique' => {
    const detection = PostPartumService.detecterRisques(observation);
    return detection.severite;
  };

  const getAlertColor = (level: 'normal' | 'modere' | 'severe' | 'critique') => {
    switch (level) {
      case 'critique': return 'error';
      case 'severe': return 'error';
      case 'modere': return 'warning';
      default: return 'success';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Surveillance Post-Partum Immédiate (2 heures)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {surveillance?.statut && (
                <Chip
                  label={surveillance.statut}
                  color={surveillance.statut === 'termine' ? 'success' : 'primary'}
                />
              )}
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadSurveillance}
                size="small"
              >
                Actualiser
              </Button>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Protocole OMS :</strong> Surveillance toutes les 15 minutes pendant 2 heures après l'accouchement.
              Les paramètres vitaux doivent être enregistrés pour détecter précocement les complications (HPP, infection, hypertension).
            </Typography>
          </Alert>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Heure</TableCell>
                  <TableCell>Temp. (°C)</TableCell>
                  <TableCell>TA</TableCell>
                  <TableCell>Pouls</TableCell>
                  <TableCell>Resp.</TableCell>
                  <TableCell>Contraction</TableCell>
                  <TableCell>Saignement</TableCell>
                  <TableCell>Douleurs</TableCell>
                  <TableCell>Alertes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {observations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Aucune observation enregistrée
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  observations.map((obs, index) => {
                    const alertLevel = getAlertLevel(obs);
                    const detection = PostPartumService.detecterRisques(obs);
                    
                    return (
                      <TableRow
                        key={obs.id || index}
                        sx={{
                          backgroundColor: alertLevel !== 'normal' ? 
                            alertLevel === 'critique' ? 'error.light' :
                            alertLevel === 'severe' ? 'error.light' :
                            'warning.light' : 'inherit',
                        }}
                      >
                        <TableCell>
                          <strong>{obs.heure_observation}</strong>
                        </TableCell>
                        <TableCell>
                          {obs.temperature || '-'}
                          {obs.alerte_hyperthermie && ' 🔥'}
                          {obs.alerte_hypothermie && ' ❄️'}
                        </TableCell>
                        <TableCell>
                          {obs.tension_arterielle_systolique && obs.tension_arterielle_diastolique
                            ? `${obs.tension_arterielle_systolique}/${obs.tension_arterielle_diastolique}`
                            : '-'}
                          {obs.alerte_hypertension && ' ⚠️'}
                          {obs.alerte_hypotension && ' ⬇️'}
                        </TableCell>
                        <TableCell>
                          {obs.pouls || '-'}
                          {obs.alerte_tachycardie && ' 💓'}
                        </TableCell>
                        <TableCell>
                          {obs.respiration || '-'}
                        </TableCell>
                        <TableCell>
                          {obs.contraction_uterine || '-'}
                        </TableCell>
                        <TableCell>
                          {obs.saignement_qualite || '-'}
                          {obs.saignement_quantite ? ` (${obs.saignement_quantite} mL)` : ''}
                          {obs.alerte_hpp && ' 🚨'}
                        </TableCell>
                        <TableCell>
                          {obs.douleurs || '-'}
                        </TableCell>
                        <TableCell>
                          {detection.alertes.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {detection.alertes.map((alerte, i) => (
                                <Chip
                                  key={i}
                                  label={alerte}
                                  size="small"
                                  color={getAlertColor(alertLevel)}
                                />
                              ))}
                            </Box>
                          ) : (
                            <CheckCircle color="success" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenObservation(obs)}
                            color="primary"
                          >
                            {obs.temperature ? <Edit /> : <Add />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog pour l'observation */}
      {openObservationDialog && selectedObservation && (
        <FormulaireObservationDialog
          observation={selectedObservation}
          onSave={handleSaveObservation}
          onClose={() => {
            setOpenObservationDialog(false);
            setSelectedObservation(null);
          }}
        />
      )}
    </Box>
  );
};

// Composant Dialog pour saisir une observation
interface FormulaireObservationDialogProps {
  observation: ObservationPostPartum;
  onSave: (data: Partial<ObservationPostPartum>) => void;
  onClose: () => void;
}

const FormulaireObservationDialog: React.FC<FormulaireObservationDialogProps> = ({
  observation,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<ObservationPostPartum>>({
    temperature: observation.temperature,
    tension_arterielle_systolique: observation.tension_arterielle_systolique,
    tension_arterielle_diastolique: observation.tension_arterielle_diastolique,
    pouls: observation.pouls,
    respiration: observation.respiration,
    contraction_uterine: observation.contraction_uterine,
    saignement_qualite: observation.saignement_qualite,
    saignement_quantite: observation.saignement_quantite,
    douleurs: observation.douleurs,
    oedemes: observation.oedemes,
    etat_perinee: observation.etat_perinee,
    etat_general: observation.etat_general,
    mictions: observation.mictions,
    conscience: observation.conscience,
    agent_observation: observation.agent_observation,
  });

  // Voice recognition
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();
  const [activeField, setActiveField] = useState<string | null>(null);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && activeField === 'agent_observation') {
      setFormData(prev => ({ ...prev, agent_observation: transcript }));
      resetTranscript();
    }
  }, [transcript, activeField, resetTranscript]);

  const handleStartDictation = (field: string) => {
    if (isListening && activeField === field) {
      stopListening();
      setActiveField(null);
      resetTranscript();
    } else {
      if (isListening) {
        stopListening();
        resetTranscript();
      }
      setActiveField(field);
      startListening();
    }
  };

  const renderDictationButton = (field: string) => {
    if (!isSupported) return null;
    const isFieldActive = activeField === field && isListening;
    
    return (
      <Tooltip title={isFieldActive ? "Arrêter la dictée" : "Démarrer la dictée"}>
        <IconButton
          onClick={() => handleStartDictation(field)}
          color={isFieldActive ? "error" : "primary"}
          size="small"
        >
          {isFieldActive ? <Stop /> : <Mic />}
        </IconButton>
      </Tooltip>
    );
  };

  const handleChange = (field: keyof ObservationPostPartum, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  // Détection en temps réel des risques
  const detection = PostPartumService.detecterRisques({ ...observation, ...formData } as ObservationPostPartum);

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Observation Post-Partum - {observation.heure_observation}
      </DialogTitle>
      <DialogContent>
        {/* Alertes en temps réel */}
        {detection.alertes.length > 0 && (
          <Alert
            severity={detection.severite === 'critique' || detection.severite === 'severe' ? 'error' : 'warning'}
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle2" gutterBottom>
              <strong>Alertes détectées:</strong>
            </Typography>
            {detection.alertes.map((alerte, i) => (
              <Typography key={i} variant="body2">• {alerte}</Typography>
            ))}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Paramètres vitaux */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Paramètres Vitaux
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Température (°C)"
              type="number"
              value={formData.temperature || ''}
              onChange={(e) => handleChange('temperature', parseFloat(e.target.value) || undefined)}
              inputProps={{ step: 0.1, min: 35, max: 42 }}
              error={formData.temperature !== undefined && (formData.temperature > 38 || formData.temperature < 36)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="TA Systolique (mmHg)"
              type="number"
              value={formData.tension_arterielle_systolique || ''}
              onChange={(e) => handleChange('tension_arterielle_systolique', parseInt(e.target.value) || undefined)}
              inputProps={{ min: 60, max: 200 }}
              error={formData.tension_arterielle_systolique !== undefined && (formData.tension_arterielle_systolique < 90 || formData.tension_arterielle_systolique > 140)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="TA Diastolique (mmHg)"
              type="number"
              value={formData.tension_arterielle_diastolique || ''}
              onChange={(e) => handleChange('tension_arterielle_diastolique', parseInt(e.target.value) || undefined)}
              inputProps={{ min: 40, max: 120 }}
              error={formData.tension_arterielle_diastolique !== undefined && formData.tension_arterielle_diastolique > 90}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Pouls (bpm)"
              type="number"
              value={formData.pouls || ''}
              onChange={(e) => handleChange('pouls', parseInt(e.target.value) || undefined)}
              inputProps={{ min: 40, max: 180 }}
              error={formData.pouls !== undefined && formData.pouls > 100}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Respiration (cpm)"
              type="number"
              value={formData.respiration || ''}
              onChange={(e) => handleChange('respiration', parseInt(e.target.value) || undefined)}
              inputProps={{ min: 10, max: 40 }}
            />
          </Grid>

          {/* Paramètres obstétricaux */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
              Paramètres Obstétricaux
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Contraction utérine</InputLabel>
              <Select
                value={formData.contraction_uterine || ''}
                onChange={(e) => handleChange('contraction_uterine', e.target.value)}
                label="Contraction utérine"
              >
                <MenuItem value="Présente">Présente</MenuItem>
                <MenuItem value="Absente">Absente</MenuItem>
                <MenuItem value="Faible">Faible</MenuItem>
                <MenuItem value="Normale">Normale</MenuItem>
                <MenuItem value="Forte">Forte</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Qualité saignement</InputLabel>
              <Select
                value={formData.saignement_qualite || ''}
                onChange={(e) => handleChange('saignement_qualite', e.target.value)}
                label="Qualité saignement"
              >
                <MenuItem value="Absent">Absent</MenuItem>
                <MenuItem value="Normal">Normal</MenuItem>
                <MenuItem value="Abondant">Abondant</MenuItem>
                <MenuItem value="Très abondant">Très abondant</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Quantité saignement (mL)"
              type="number"
              value={formData.saignement_quantite || ''}
              onChange={(e) => handleChange('saignement_quantite', parseFloat(e.target.value) || undefined)}
              inputProps={{ min: 0 }}
              error={formData.saignement_quantite !== undefined && formData.saignement_quantite > 500}
              helperText={formData.saignement_quantite !== undefined && formData.saignement_quantite > 500 ? 'HPP détectée!' : ''}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Douleurs</InputLabel>
              <Select
                value={formData.douleurs || ''}
                onChange={(e) => handleChange('douleurs', e.target.value)}
                label="Douleurs"
              >
                <MenuItem value="Absentes">Absentes</MenuItem>
                <MenuItem value="Légères">Légères</MenuItem>
                <MenuItem value="Modérées">Modérées</MenuItem>
                <MenuItem value="Sévères">Sévères</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>État du périnée</InputLabel>
              <Select
                value={formData.etat_perinee || ''}
                onChange={(e) => handleChange('etat_perinee', e.target.value)}
                label="État du périnée"
              >
                <MenuItem value="Normal">Normal</MenuItem>
                <MenuItem value="Épisiotomie">Épisiotomie</MenuItem>
                <MenuItem value="Déchirure">Déchirure</MenuItem>
                <MenuItem value="Hématome">Hématome</MenuItem>
                <MenuItem value="Infection">Infection</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>État général</InputLabel>
              <Select
                value={formData.etat_general || ''}
                onChange={(e) => handleChange('etat_general', e.target.value)}
                label="État général"
              >
                <MenuItem value="Bon">Bon</MenuItem>
                <MenuItem value="Moyen">Moyen</MenuItem>
                <MenuItem value="Altéré">Altéré</MenuItem>
                <MenuItem value="Critique">Critique</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Mictions</InputLabel>
              <Select
                value={formData.mictions || ''}
                onChange={(e) => handleChange('mictions', e.target.value)}
                label="Mictions"
              >
                <MenuItem value="Normales">Normales</MenuItem>
                <MenuItem value="Difficiles">Difficiles</MenuItem>
                <MenuItem value="Absentes">Absentes</MenuItem>
                <MenuItem value="Incontinence">Incontinence</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Conscience</InputLabel>
              <Select
                value={formData.conscience || ''}
                onChange={(e) => handleChange('conscience', e.target.value)}
                label="Conscience"
              >
                <MenuItem value="Normale">Normale</MenuItem>
                <MenuItem value="Confuse">Confuse</MenuItem>
                <MenuItem value="Somnolente">Somnolente</MenuItem>
                <MenuItem value="Coma">Coma</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Agent d'observation"
              value={formData.agent_observation || ''}
              onChange={(e) => handleChange('agent_observation', e.target.value)}
              inputProps={{ maxLength: 20 }} // Limite stricte pour correspondre à la base de données
              helperText={`${(formData.agent_observation || '').length}/20 caractères`}
              InputProps={{
                endAdornment: renderDictationButton('agent_observation'),
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={<Save />}
        >
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormulaireSurveillancePostPartum;

