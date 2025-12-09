import React, { useState } from 'react';
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
  Alert,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  Save,
  Cancel,
  LocalHospital,
} from '@mui/icons-material';
import {
  Accouchement,
  Delivrance,
  ExamenPlacenta,
} from '../../services/accouchementService';

interface FormulaireAccouchementProps {
  dossierId: string;
  accouchement?: Accouchement;
  onSave: (data: Accouchement) => Promise<void>;
  onCancel: () => void;
}

const FormulaireAccouchement: React.FC<FormulaireAccouchementProps> = ({
  dossierId,
  accouchement,
  onSave,
  onCancel,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Accouchement>>({
    dossier_obstetrical_id: dossierId,
    date_accouchement: accouchement?.date_accouchement || new Date().toISOString(),
    heure_debut_travail: accouchement?.heure_debut_travail || '',
    heure_accouchement: accouchement?.heure_accouchement || '',
    duree_travail: accouchement?.duree_travail || undefined,
    type_accouchement: accouchement?.type_accouchement || 'Voie basse',
    presentation: accouchement?.presentation || 'Céphalique',
    issue_grossesse: accouchement?.issue_grossesse || 'Vivant',
    nombre_enfants: accouchement?.nombre_enfants || 1,
    complications: accouchement?.complications || '',
    hemorragie: accouchement?.hemorragie || false,
    volume_hemorragie: accouchement?.volume_hemorragie || undefined,
    type_anesthesie: accouchement?.type_anesthesie || '',
    ocytociques: accouchement?.ocytociques || false,
    heure_ocytociques: accouchement?.heure_ocytociques || '',
    observations: accouchement?.observations || '',
    statut: accouchement?.statut || 'en_cours',
  });

  const [delivrance, setDelivrance] = useState<Partial<Delivrance>>({
    heure_delivrance: accouchement?.delivrance?.heure_delivrance || '',
    duree_delivrance: accouchement?.delivrance?.duree_delivrance || undefined,
    perte_sang: accouchement?.delivrance?.perte_sang || 0,
    placenta_complet: accouchement?.delivrance?.placenta_complet !== false,
    anomalies_placenta: accouchement?.delivrance?.anomalies_placenta || '',
    cordon_normal: accouchement?.delivrance?.cordon_normal !== false,
    anomalies_cordon: accouchement?.delivrance?.anomalies_cordon || '',
    membranes_completes: accouchement?.delivrance?.membranes_completes !== false,
    membranes_dechirures: accouchement?.delivrance?.membranes_dechirures || false,
    episiotomie: accouchement?.delivrance?.episiotomie || false,
    dechirures_perineales: accouchement?.delivrance?.dechirures_perineales || false,
    degre_dechirure: accouchement?.delivrance?.degre_dechirure || undefined,
    reparation_perineale: accouchement?.delivrance?.reparation_perineale || false,
    observations: accouchement?.delivrance?.observations || '',
  });

  const [examenPlacenta, setExamenPlacenta] = useState<Partial<ExamenPlacenta>>({
    heure_delivrance: accouchement?.examen_placenta?.heure_delivrance || '',
    longueur_cordon: accouchement?.examen_placenta?.longueur_cordon || undefined,
    lli_hln: accouchement?.examen_placenta?.lli_hln || '',
    presence_anomalies: accouchement?.examen_placenta?.presence_anomalies || false,
    culs_de_sac: accouchement?.examen_placenta?.culs_de_sac || false,
    caillots: accouchement?.examen_placenta?.caillots || false,
    description_anomalies: accouchement?.examen_placenta?.description_anomalies || '',
    parite: accouchement?.examen_placenta?.parite || undefined,
    observations: accouchement?.examen_placenta?.observations || '',
  });

  const handleChange = (field: keyof Accouchement, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDelivranceChange = (field: keyof Delivrance, value: any) => {
    setDelivrance(prev => ({ ...prev, [field]: value }));
  };

  const handleExamenPlacentaChange = (field: keyof ExamenPlacenta, value: any) => {
    setExamenPlacenta(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const dataToSave: Accouchement = {
        ...formData as Accouchement,
        delivrance: delivrance as Delivrance,
        examen_placenta: examenPlacenta as ExamenPlacenta,
      };
      await onSave(dataToSave);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Accouchement */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
            Accouchement
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Date et heure d'accouchement"
                type="datetime-local"
                value={formData.date_accouchement?.slice(0, 16)}
                onChange={(e) => handleChange('date_accouchement', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Heure début travail"
                type="time"
                value={formData.heure_debut_travail}
                onChange={(e) => handleChange('heure_debut_travail', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Durée du travail (minutes)"
                type="number"
                value={formData.duree_travail || ''}
                onChange={(e) => handleChange('duree_travail', parseInt(e.target.value) || undefined)}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Type d'accouchement</InputLabel>
                <Select
                  value={formData.type_accouchement}
                  onChange={(e) => handleChange('type_accouchement', e.target.value)}
                  label="Type d'accouchement"
                >
                  <MenuItem value="Voie basse">Voie basse</MenuItem>
                  <MenuItem value="Césarienne">Césarienne</MenuItem>
                  <MenuItem value="Forceps">Forceps</MenuItem>
                  <MenuItem value="Ventouse">Ventouse</MenuItem>
                  <MenuItem value="Autre">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Présentation</InputLabel>
                <Select
                  value={formData.presentation}
                  onChange={(e) => handleChange('presentation', e.target.value)}
                  label="Présentation"
                >
                  <MenuItem value="Céphalique">Céphalique</MenuItem>
                  <MenuItem value="Siège">Siège</MenuItem>
                  <MenuItem value="Transverse">Transverse</MenuItem>
                  <MenuItem value="Autre">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Issue de la grossesse</InputLabel>
                <Select
                  value={formData.issue_grossesse}
                  onChange={(e) => handleChange('issue_grossesse', e.target.value)}
                  label="Issue de la grossesse"
                >
                  <MenuItem value="Vivant">Vivant</MenuItem>
                  <MenuItem value="Mort-né">Mort-né</MenuItem>
                  <MenuItem value="Mort in utero">Mort in utero</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre d'enfants"
                type="number"
                value={formData.nombre_enfants}
                onChange={(e) => handleChange('nombre_enfants', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 5 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Type d'anesthésie"
                value={formData.type_anesthesie}
                onChange={(e) => handleChange('type_anesthesie', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hemorragie}
                    onChange={(e) => handleChange('hemorragie', e.target.checked)}
                  />
                }
                label="Hémorragie"
              />
              {formData.hemorragie && (
                <TextField
                  fullWidth
                  label="Volume hémorragie (mL)"
                  type="number"
                  value={formData.volume_hemorragie || ''}
                  onChange={(e) => handleChange('volume_hemorragie', parseFloat(e.target.value) || undefined)}
                  inputProps={{ min: 0 }}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.ocytociques}
                    onChange={(e) => handleChange('ocytociques', e.target.checked)}
                  />
                }
                label="Ocytociques administrés"
              />
              {formData.ocytociques && (
                <TextField
                  fullWidth
                  label="Heure administration ocytociques"
                  type="time"
                  value={formData.heure_ocytociques}
                  onChange={(e) => handleChange('heure_ocytociques', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Complications"
                value={formData.complications}
                onChange={(e) => handleChange('complications', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Délivrance */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Délivrance (Stade 3)
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Heure de délivrance"
                type="time"
                value={delivrance.heure_delivrance}
                onChange={(e) => handleDelivranceChange('heure_delivrance', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Durée délivrance (min)"
                type="number"
                value={delivrance.duree_delivrance || ''}
                onChange={(e) => handleDelivranceChange('duree_delivrance', parseInt(e.target.value) || undefined)}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Perte de sang (mL)"
                type="number"
                value={delivrance.perte_sang}
                onChange={(e) => handleDelivranceChange('perte_sang', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0 }}
                required
                error={delivrance.perte_sang > 500}
                helperText={delivrance.perte_sang > 500 ? 'HPP détectée!' : ''}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={delivrance.placenta_complet}
                    onChange={(e) => handleDelivranceChange('placenta_complet', e.target.checked)}
                  />
                }
                label="Placenta complet"
              />
              {!delivrance.placenta_complet && (
                <TextField
                  fullWidth
                  label="Anomalies du placenta"
                  value={delivrance.anomalies_placenta}
                  onChange={(e) => handleDelivranceChange('anomalies_placenta', e.target.value)}
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={delivrance.cordon_normal}
                    onChange={(e) => handleDelivranceChange('cordon_normal', e.target.checked)}
                  />
                }
                label="Cordon normal"
              />
              {!delivrance.cordon_normal && (
                <TextField
                  fullWidth
                  label="Anomalies du cordon"
                  value={delivrance.anomalies_cordon}
                  onChange={(e) => handleDelivranceChange('anomalies_cordon', e.target.value)}
                  multiline
                  rows={2}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={delivrance.membranes_completes}
                    onChange={(e) => handleDelivranceChange('membranes_completes', e.target.checked)}
                  />
                }
                label="Membranes complètes"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={delivrance.episiotomie}
                    onChange={(e) => handleDelivranceChange('episiotomie', e.target.checked)}
                  />
                }
                label="Épisiotomie"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={delivrance.dechirures_perineales}
                    onChange={(e) => handleDelivranceChange('dechirures_perineales', e.target.checked)}
                  />
                }
                label="Déchirures périnéales"
              />
            </Grid>

            {delivrance.dechirures_perineales && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Degré de déchirure</InputLabel>
                    <Select
                      value={delivrance.degre_dechirure || ''}
                      onChange={(e) => handleDelivranceChange('degre_dechirure', parseInt(e.target.value as string) || undefined)}
                      label="Degré de déchirure"
                    >
                      <MenuItem value={1}>1er degré</MenuItem>
                      <MenuItem value={2}>2e degré</MenuItem>
                      <MenuItem value={3}>3e degré</MenuItem>
                      <MenuItem value={4}>4e degré</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={delivrance.reparation_perineale}
                        onChange={(e) => handleDelivranceChange('reparation_perineale', e.target.checked)}
                      />
                    }
                    label="Réparation périnéale effectuée"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Examen du placenta */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Examen du Placenta
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Longueur du cordon (cm)"
                type="number"
                value={examenPlacenta.longueur_cordon || ''}
                onChange={(e) => handleExamenPlacentaChange('longueur_cordon', parseFloat(e.target.value) || undefined)}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="LLI / HLN"
                value={examenPlacenta.lli_hln}
                onChange={(e) => handleExamenPlacentaChange('lli_hln', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Parité"
                type="number"
                value={examenPlacenta.parite || ''}
                onChange={(e) => handleExamenPlacentaChange('parite', parseInt(e.target.value) || undefined)}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={examenPlacenta.presence_anomalies}
                    onChange={(e) => handleExamenPlacentaChange('presence_anomalies', e.target.checked)}
                  />
                }
                label="Présence d'anomalies"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={examenPlacenta.culs_de_sac}
                    onChange={(e) => handleExamenPlacentaChange('culs_de_sac', e.target.checked)}
                  />
                }
                label="Culs-de-sac"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={examenPlacenta.caillots}
                    onChange={(e) => handleExamenPlacentaChange('caillots', e.target.checked)}
                  />
                }
                label="Caillots"
              />
            </Grid>

            {examenPlacenta.presence_anomalies && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description des anomalies"
                  value={examenPlacenta.description_anomalies}
                  onChange={(e) => handleExamenPlacentaChange('description_anomalies', e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Boutons d'action */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} startIcon={<Cancel />}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          disabled={saving}
        >
          Enregistrer
        </Button>
      </Box>
    </Box>
  );
};

export default FormulaireAccouchement;

