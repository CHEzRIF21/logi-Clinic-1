import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Save,
  Assignment,
  CheckCircle,
  Mic,
  Stop,
} from '@mui/icons-material';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { CarteInfantile } from '../../services/accouchementService';

interface FormulaireCarteInfantileProps {
  nouveauNeId: string;
  carte?: CarteInfantile;
  onSave: (data: CarteInfantile) => Promise<void>;
  onCancel: () => void;
}

const FormulaireCarteInfantile: React.FC<FormulaireCarteInfantileProps> = ({
  nouveauNeId,
  carte,
  onSave,
  onCancel,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CarteInfantile>>({
    nouveau_ne_id: nouveauNeId,
    carte_remplie: carte?.carte_remplie || false,
    date_remplissage: carte?.date_remplissage || '',
    vitamine_a_administree: carte?.vitamine_a_administree || false,
    age_vitamine_a: carte?.age_vitamine_a || '6 mois',
    date_vitamine_a: carte?.date_vitamine_a || '',
    pf_discute: carte?.pf_discute || false,
    date_discussion_pf: carte?.date_discussion_pf || '',
    bcg: carte?.bcg || false,
    date_bcg: carte?.date_bcg || '',
    heure_bcg: carte?.heure_bcg || '',
    polio_0: carte?.polio_0 || false,
    date_polio_0: carte?.date_polio_0 || '',
    heure_polio_0: carte?.heure_polio_0 || '',
    acceptation_mere: carte?.acceptation_mere || false,
    acceptation_pere: carte?.acceptation_pere || false,
    observations: carte?.observations || '',
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
    if (transcript && activeField === 'observations') {
      const updatedValue = formData.observations ? `${formData.observations} ${transcript}` : transcript;
      setFormData(prev => ({ ...prev, observations: updatedValue }));
      resetTranscript();
    }
  }, [transcript, activeField, formData.observations, resetTranscript]);

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

  const handleChange = (field: keyof CarteInfantile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(formData as CarteInfantile);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const vaccinationsCompletes = formData.bcg && formData.polio_0;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Carte Infantile (Carnet de Naissance)
            </Typography>
            {vaccinationsCompletes && (
              <Chip
                label="Vaccinations initiales complètes"
                color="success"
                icon={<CheckCircle />}
              />
            )}
          </Box>

          <Grid container spacing={2}>
            {/* Carte remplie */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.carte_remplie}
                    onChange={(e) => handleChange('carte_remplie', e.target.checked)}
                  />
                }
                label="Carte infantile remplie"
              />
              {formData.carte_remplie && (
                <TextField
                  fullWidth
                  type="date"
                  label="Date de remplissage"
                  value={formData.date_remplissage}
                  onChange={(e) => handleChange('date_remplissage', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ mt: 1, ml: 4 }}
                />
              )}
            </Grid>

            {/* Vaccinations initiales */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Vaccinations Initiales (à la naissance)
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.bcg}
                    onChange={(e) => handleChange('bcg', e.target.checked)}
                  />
                }
                label="BCG"
              />
              {formData.bcg && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date"
                        value={formData.date_bcg}
                        onChange={(e) => handleChange('date_bcg', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Heure"
                        value={formData.heure_bcg}
                        onChange={(e) => handleChange('heure_bcg', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.polio_0}
                    onChange={(e) => handleChange('polio_0', e.target.checked)}
                  />
                }
                label="Polio 0"
              />
              {formData.polio_0 && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date"
                        value={formData.date_polio_0}
                        onChange={(e) => handleChange('date_polio_0', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Heure"
                        value={formData.heure_polio_0}
                        onChange={(e) => handleChange('heure_polio_0', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Grid>

            {/* Vitamine A */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Vitamine A (Administration ultérieure)
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.vitamine_a_administree}
                    onChange={(e) => handleChange('vitamine_a_administree', e.target.checked)}
                  />
                }
                label="Vitamine A administrée"
              />
              {formData.vitamine_a_administree && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Âge</InputLabel>
                        <Select
                          value={formData.age_vitamine_a}
                          onChange={(e) => handleChange('age_vitamine_a', e.target.value)}
                          label="Âge"
                        >
                          <MenuItem value="6 mois">6 mois</MenuItem>
                          <MenuItem value="1 an">1 an</MenuItem>
                          <MenuItem value="3 ans">3 ans</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date"
                        value={formData.date_vitamine_a}
                        onChange={(e) => handleChange('date_vitamine_a', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Grid>

            {/* Planning Familial */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.pf_discute}
                    onChange={(e) => handleChange('pf_discute', e.target.checked)}
                  />
                }
                label="Planning Familial discuté"
              />
              {formData.pf_discute && (
                <TextField
                  fullWidth
                  type="date"
                  label="Date de discussion"
                  value={formData.date_discussion_pf}
                  onChange={(e) => handleChange('date_discussion_pf', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ mt: 1, ml: 4 }}
                />
              )}
            </Grid>

            {/* Acceptation des parents */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Acceptation des Parents
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.acceptation_mere}
                    onChange={(e) => handleChange('acceptation_mere', e.target.checked)}
                  />
                }
                label="Acceptation de la mère"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.acceptation_pere}
                    onChange={(e) => handleChange('acceptation_pere', e.target.checked)}
                  />
                }
                label="Acceptation du père"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations"
                value={formData.observations}
                onChange={(e) => handleChange('observations', e.target.value)}
                multiline
                rows={3}
                InputProps={{
                  endAdornment: renderDictationButton('observations'),
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button onClick={onCancel}>
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              startIcon={<Save />}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FormulaireCarteInfantile;

