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
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  Save,
  ChildCare,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { NouveauNe, AccouchementService } from '../../services/accouchementService';

interface FormulaireNouveauNeProps {
  accouchementId: string;
  nouveauNe?: NouveauNe;
  numeroOrdre?: number;
  onSave: (data: NouveauNe) => Promise<void>;
  onCancel: () => void;
}

const FormulaireNouveauNe: React.FC<FormulaireNouveauNeProps> = ({
  accouchementId,
  nouveauNe,
  numeroOrdre = 1,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<NouveauNe>>({
    accouchement_id: accouchementId,
    numero_ordre: numeroOrdre,
    sexe: nouveauNe?.sexe || 'Masculin',
    rang_naissance: nouveauNe?.rang_naissance || 1,
    poids: nouveauNe?.poids || undefined,
    taille: nouveauNe?.taille || undefined,
    perimetre_cranien: nouveauNe?.perimetre_cranien || undefined,
    // Apgar 1 min
    apgar_respiration_1min: nouveauNe?.apgar_respiration_1min || undefined,
    apgar_frequence_cardiaque_1min: nouveauNe?.apgar_frequence_cardiaque_1min || undefined,
    apgar_tonus_1min: nouveauNe?.apgar_tonus_1min || undefined,
    apgar_reflexe_1min: nouveauNe?.apgar_reflexe_1min || undefined,
    apgar_coloration_1min: nouveauNe?.apgar_coloration_1min || undefined,
    // Apgar 5 min
    apgar_respiration_5min: nouveauNe?.apgar_respiration_5min || undefined,
    apgar_frequence_cardiaque_5min: nouveauNe?.apgar_frequence_cardiaque_5min || undefined,
    apgar_tonus_5min: nouveauNe?.apgar_tonus_5min || undefined,
    apgar_reflexe_5min: nouveauNe?.apgar_reflexe_5min || undefined,
    apgar_coloration_5min: nouveauNe?.apgar_coloration_5min || undefined,
    // Apgar 10 min
    apgar_respiration_10min: nouveauNe?.apgar_respiration_10min || undefined,
    apgar_frequence_cardiaque_10min: nouveauNe?.apgar_frequence_cardiaque_10min || undefined,
    apgar_tonus_10min: nouveauNe?.apgar_tonus_10min || undefined,
    apgar_reflexe_10min: nouveauNe?.apgar_reflexe_10min || undefined,
    apgar_coloration_10min: nouveauNe?.apgar_coloration_10min || undefined,
    // Clinique
    temperature: nouveauNe?.temperature || undefined,
    etat_clinique_normal: nouveauNe?.etat_clinique_normal !== false,
    // Signes de danger
    difficulte_respirer: nouveauNe?.difficulte_respirer || false,
    coloration_anormale: nouveauNe?.coloration_anormale || false,
    convulsions: nouveauNe?.convulsions || false,
    absence_cri: nouveauNe?.absence_cri || false,
    autres_signes_danger: nouveauNe?.autres_signes_danger || '',
    // Réanimation
    reanimation_necessaire: nouveauNe?.reanimation_necessaire || false,
    ventilation_masque: nouveauNe?.ventilation_masque || false,
    oxygene: nouveauNe?.oxygene || false,
    aspiration: nouveauNe?.aspiration || false,
    massage_cardiaque: nouveauNe?.massage_cardiaque || false,
    autres_procedures: nouveauNe?.autres_procedures || '',
    // Issue
    etat_naissance: nouveauNe?.etat_naissance || 'Vivant',
    observations: nouveauNe?.observations || '',
  });

  // Calcul automatique des scores Apgar
  const apgar1min = AccouchementService.calculerApgar(
    formData.apgar_respiration_1min || 0,
    formData.apgar_frequence_cardiaque_1min || 0,
    formData.apgar_tonus_1min || 0,
    formData.apgar_reflexe_1min || 0,
    formData.apgar_coloration_1min || 0
  );

  const apgar5min = AccouchementService.calculerApgar(
    formData.apgar_respiration_5min || 0,
    formData.apgar_frequence_cardiaque_5min || 0,
    formData.apgar_tonus_5min || 0,
    formData.apgar_reflexe_5min || 0,
    formData.apgar_coloration_5min || 0
  );

  const apgar10min = AccouchementService.calculerApgar(
    formData.apgar_respiration_10min || 0,
    formData.apgar_frequence_cardiaque_10min || 0,
    formData.apgar_tonus_10min || 0,
    formData.apgar_reflexe_10min || 0,
    formData.apgar_coloration_10min || 0
  );

  const interpretation1min = AccouchementService.interpreterApgar(apgar1min);
  const interpretation5min = AccouchementService.interpreterApgar(apgar5min);
  const interpretation10min = AccouchementService.interpreterApgar(apgar10min);

  const handleChange = (field: keyof NouveauNe, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await onSave(formData as NouveauNe);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <ChildCare sx={{ mr: 1, verticalAlign: 'middle' }} />
            État du Nouveau-Né à la Naissance
          </Typography>

          <Grid container spacing={2}>
            {/* Identification */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 1 }}>
                Identification
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Sexe</InputLabel>
                <Select
                  value={formData.sexe}
                  onChange={(e) => handleChange('sexe', e.target.value)}
                  label="Sexe"
                  required
                >
                  <MenuItem value="Masculin">Masculin</MenuItem>
                  <MenuItem value="Féminin">Féminin</MenuItem>
                  <MenuItem value="Indéterminé">Indéterminé</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Rang de naissance"
                type="number"
                value={formData.rang_naissance}
                onChange={(e) => handleChange('rang_naissance', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Numéro d'ordre (si jumeaux)"
                type="number"
                value={formData.numero_ordre}
                onChange={(e) => handleChange('numero_ordre', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* Mesures anthropométriques */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Mesures Anthropométriques
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Poids (kg)"
                type="number"
                value={formData.poids || ''}
                onChange={(e) => handleChange('poids', parseFloat(e.target.value) || undefined)}
                required
                inputProps={{ step: 0.001, min: 0.5, max: 6 }}
                error={formData.poids !== undefined && (formData.poids < 2.5 || formData.poids > 4.5)}
                helperText={formData.poids !== undefined && formData.poids < 2.5 ? 'Petit poids de naissance' : ''}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Taille (cm)"
                type="number"
                value={formData.taille || ''}
                onChange={(e) => handleChange('taille', parseFloat(e.target.value) || undefined)}
                inputProps={{ step: 0.1, min: 30, max: 60 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Périmètre crânien (cm)"
                type="number"
                value={formData.perimetre_cranien || ''}
                onChange={(e) => handleChange('perimetre_cranien', parseFloat(e.target.value) || undefined)}
                inputProps={{ step: 0.1, min: 25, max: 40 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Scores Apgar */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Scores Apgar (Calcul Automatique)
          </Typography>

          {/* Résumé des scores */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Chip
              label={`Apgar 1 min: ${apgar1min}/10`}
              color={interpretation1min.couleur as any}
              icon={apgar1min >= 7 ? <CheckCircle /> : <Warning />}
            />
            <Chip
              label={`Apgar 5 min: ${apgar5min}/10`}
              color={interpretation5min.couleur as any}
              icon={apgar5min >= 7 ? <CheckCircle /> : <Warning />}
            />
            <Chip
              label={`Apgar 10 min: ${apgar10min}/10`}
              color={interpretation10min.couleur as any}
              icon={apgar10min >= 7 ? <CheckCircle /> : <Warning />}
            />
          </Box>

          {/* Alerte si score critique */}
          {(apgar1min < 7 || apgar5min < 7) && (
            <Alert severity={apgar1min < 4 || apgar5min < 4 ? 'error' : 'warning'} sx={{ mb: 2 }}>
              <Typography variant="subtitle2">
                Score Apgar {apgar1min < 4 || apgar5min < 4 ? 'critique' : 'modéré'} - Réanimation {apgar1min < 4 ? 'urgente' : 'recommandée'}
              </Typography>
            </Alert>
          )}

          {/* Tableau des critères Apgar */}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Critère</TableCell>
                  <TableCell align="center">1 min</TableCell>
                  <TableCell align="center">5 min</TableCell>
                  <TableCell align="center">10 min</TableCell>
                  <TableCell>Description (0-2 points)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><strong>Respiration</strong></TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_respiration_1min || ''}
                      onChange={(e) => handleChange('apgar_respiration_1min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_respiration_5min || ''}
                      onChange={(e) => handleChange('apgar_respiration_5min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_respiration_10min || ''}
                      onChange={(e) => handleChange('apgar_respiration_10min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell>0: Absente | 1: Faible, irrégulière | 2: Forte, cri</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Fréquence cardiaque</strong></TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_frequence_cardiaque_1min || ''}
                      onChange={(e) => handleChange('apgar_frequence_cardiaque_1min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_frequence_cardiaque_5min || ''}
                      onChange={(e) => handleChange('apgar_frequence_cardiaque_5min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_frequence_cardiaque_10min || ''}
                      onChange={(e) => handleChange('apgar_frequence_cardiaque_10min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell>0: Absente | 1: &lt;100 bpm | 2: &gt;100 bpm</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Tonus musculaire</strong></TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_tonus_1min || ''}
                      onChange={(e) => handleChange('apgar_tonus_1min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_tonus_5min || ''}
                      onChange={(e) => handleChange('apgar_tonus_5min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_tonus_10min || ''}
                      onChange={(e) => handleChange('apgar_tonus_10min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell>0: Flasque | 1: Faible flexion | 2: Mouvements actifs</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Réflexe</strong></TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_reflexe_1min || ''}
                      onChange={(e) => handleChange('apgar_reflexe_1min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_reflexe_5min || ''}
                      onChange={(e) => handleChange('apgar_reflexe_5min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_reflexe_10min || ''}
                      onChange={(e) => handleChange('apgar_reflexe_10min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell>0: Absent | 1: Grimace | 2: Éternuement/Toux</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Coloration</strong></TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_coloration_1min || ''}
                      onChange={(e) => handleChange('apgar_coloration_1min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_coloration_5min || ''}
                      onChange={(e) => handleChange('apgar_coloration_5min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={formData.apgar_coloration_10min || ''}
                      onChange={(e) => handleChange('apgar_coloration_10min', parseInt(e.target.value) || undefined)}
                      inputProps={{ min: 0, max: 2 }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  </TableCell>
                  <TableCell>0: Cyanose | 1: Extrémités cyanosées | 2: Rose</TableCell>
                </TableRow>
                <TableRow sx={{ backgroundColor: 'primary.light' }}>
                  <TableCell><strong>SCORE TOTAL</strong></TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${apgar1min}/10`}
                      color={interpretation1min.couleur as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${apgar5min}/10`}
                      color={interpretation5min.couleur as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${apgar10min}/10`}
                      color={interpretation10min.couleur as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    7-10: Normal | 4-6: Modéré | 0-3: Critique
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Interprétation */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Interprétation:
            </Typography>
            <Alert severity={interpretation5min.couleur as any}>
              <strong>Apgar 5 min: {apgar5min}/10 - {interpretation5min.niveau}</strong>
              <br />
              {interpretation5min.interpretation}
            </Alert>
          </Box>
        </CardContent>
      </Card>

      {/* Signes de danger et Réanimation */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Signes de Danger et Réanimation
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Signes de Danger
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.difficulte_respirer}
                    onChange={(e) => handleChange('difficulte_respirer', e.target.checked)}
                  />
                }
                label="Difficulté à respirer"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.coloration_anormale}
                    onChange={(e) => handleChange('coloration_anormale', e.target.checked)}
                  />
                }
                label="Coloration anormale"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.convulsions}
                    onChange={(e) => handleChange('convulsions', e.target.checked)}
                  />
                }
                label="Convulsions"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.absence_cri}
                    onChange={(e) => handleChange('absence_cri', e.target.checked)}
                  />
                }
                label="Absence de cri"
              />
              <TextField
                fullWidth
                label="Autres signes de danger"
                value={formData.autres_signes_danger}
                onChange={(e) => handleChange('autres_signes_danger', e.target.value)}
                multiline
                rows={2}
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Réanimation Néonatale
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.reanimation_necessaire}
                    onChange={(e) => handleChange('reanimation_necessaire', e.target.checked)}
                  />
                }
                label="Réanimation nécessaire"
              />
              {formData.reanimation_necessaire && (
                <Box sx={{ ml: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.ventilation_masque}
                        onChange={(e) => handleChange('ventilation_masque', e.target.checked)}
                      />
                    }
                    label="Ventilation au masque"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.oxygene}
                        onChange={(e) => handleChange('oxygene', e.target.checked)}
                      />
                    }
                    label="Oxygène"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.aspiration}
                        onChange={(e) => handleChange('aspiration', e.target.checked)}
                      />
                    }
                    label="Aspiration"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.massage_cardiaque}
                        onChange={(e) => handleChange('massage_cardiaque', e.target.checked)}
                      />
                    }
                    label="Massage cardiaque"
                  />
                  <TextField
                    fullWidth
                    label="Autres procédures"
                    value={formData.autres_procedures}
                    onChange={(e) => handleChange('autres_procedures', e.target.value)}
                    multiline
                    rows={2}
                    sx={{ mt: 1 }}
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations"
                value={formData.observations}
                onChange={(e) => handleChange('observations', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Boutons d'action */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel}>
          Annuler
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSubmit}
        >
          Enregistrer
        </Button>
      </Box>
    </Box>
  );
};

export default FormulaireNouveauNe;

