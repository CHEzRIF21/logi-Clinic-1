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
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import {
  Save,
  ChildCare,
} from '@mui/icons-material';
import { SoinsImmediats } from '../../services/accouchementService';

interface FormulaireSoinsImmediatsProps {
  nouveauNeId: string;
  soins?: SoinsImmediats;
  onSave: (data: SoinsImmediats) => Promise<void>;
  onCancel: () => void;
}

const FormulaireSoinsImmediats: React.FC<FormulaireSoinsImmediatsProps> = ({
  nouveauNeId,
  soins,
  onSave,
  onCancel,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<SoinsImmediats>>({
    nouveau_ne_id: nouveauNeId,
    sechage: soins?.sechage || false,
    heure_sechage: soins?.heure_sechage || '',
    rechauffement: soins?.rechauffement || false,
    heure_rechauffement: soins?.heure_rechauffement || '',
    contact_peau_a_peau: soins?.contact_peau_a_peau || false,
    heure_contact_peau_a_peau: soins?.heure_contact_peau_a_peau || '',
    duree_contact_peau_a_peau: soins?.duree_contact_peau_a_peau || undefined,
    allaitement_precoce: soins?.allaitement_precoce || false,
    heure_allaitement_precoce: soins?.heure_allaitement_precoce || '',
    prophylaxie_oculaire: soins?.prophylaxie_oculaire || false,
    produit_prophylaxie_oculaire: soins?.produit_prophylaxie_oculaire || '',
    heure_prophylaxie_oculaire: soins?.heure_prophylaxie_oculaire || '',
    antiretroviral_arv: soins?.antiretroviral_arv || false,
    type_arv: soins?.type_arv || '',
    dose_arv: soins?.dose_arv || '',
    heure_arv: soins?.heure_arv || '',
    vitamine_k1: soins?.vitamine_k1 || false,
    dose_vitamine_k1: soins?.dose_vitamine_k1 || '',
    voie_vitamine_k1: soins?.voie_vitamine_k1 || 'IM',
    heure_vitamine_k1: soins?.heure_vitamine_k1 || '',
    pesee: soins?.pesee || false,
    chapelet_identification: soins?.chapelet_identification || false,
    numero_chapelet: soins?.numero_chapelet || '',
    soins_cordon: soins?.soins_cordon || false,
    antiseptique_cordon: soins?.antiseptique_cordon || '',
    heure_soins_cordon: soins?.heure_soins_cordon || '',
    observations: soins?.observations || '',
  });

  const handleChange = (field: keyof SoinsImmediats, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(formData as SoinsImmediats);
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

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <ChildCare sx={{ mr: 1, verticalAlign: 'middle' }} />
            Soins Immédiats au Nouveau-Né
          </Typography>

          <Grid container spacing={2}>
            {/* Soins de base */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Soins de Base
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.sechage}
                    onChange={(e) => handleChange('sechage', e.target.checked)}
                  />
                }
                label="Séchage"
              />
              {formData.sechage && (
                <TextField
                  fullWidth
                  type="time"
                  label="Heure"
                  value={formData.heure_sechage}
                  onChange={(e) => handleChange('heure_sechage', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ mt: 1, ml: 4 }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.rechauffement}
                    onChange={(e) => handleChange('rechauffement', e.target.checked)}
                  />
                }
                label="Réchauffement"
              />
              {formData.rechauffement && (
                <TextField
                  fullWidth
                  type="time"
                  label="Heure"
                  value={formData.heure_rechauffement}
                  onChange={(e) => handleChange('heure_rechauffement', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ mt: 1, ml: 4 }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.contact_peau_a_peau}
                    onChange={(e) => handleChange('contact_peau_a_peau', e.target.checked)}
                  />
                }
                label="Contact peau-à-peau"
              />
              {formData.contact_peau_a_peau && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Heure"
                        value={formData.heure_contact_peau_a_peau}
                        onChange={(e) => handleChange('heure_contact_peau_a_peau', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Durée (min)"
                        value={formData.duree_contact_peau_a_peau || ''}
                        onChange={(e) => handleChange('duree_contact_peau_a_peau', parseInt(e.target.value) || undefined)}
                        inputProps={{ min: 0 }}
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
                    checked={formData.allaitement_precoce}
                    onChange={(e) => handleChange('allaitement_precoce', e.target.checked)}
                  />
                }
                label="Allaitement précoce"
              />
              {formData.allaitement_precoce && (
                <TextField
                  fullWidth
                  type="time"
                  label="Heure"
                  value={formData.heure_allaitement_precoce}
                  onChange={(e) => handleChange('heure_allaitement_precoce', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ mt: 1, ml: 4 }}
                />
              )}
            </Grid>

            {/* Prophylaxie */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Prophylaxie
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.prophylaxie_oculaire}
                    onChange={(e) => handleChange('prophylaxie_oculaire', e.target.checked)}
                  />
                }
                label="Prophylaxie oculaire"
              />
              {formData.prophylaxie_oculaire && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Produit"
                        value={formData.produit_prophylaxie_oculaire}
                        onChange={(e) => handleChange('produit_prophylaxie_oculaire', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Heure"
                        value={formData.heure_prophylaxie_oculaire}
                        onChange={(e) => handleChange('heure_prophylaxie_oculaire', e.target.value)}
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
                    checked={formData.antiretroviral_arv}
                    onChange={(e) => handleChange('antiretroviral_arv', e.target.checked)}
                  />
                }
                label="ARV (si mère séropositive)"
              />
              {formData.antiretroviral_arv && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Type ARV"
                        value={formData.type_arv}
                        onChange={(e) => handleChange('type_arv', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Dose"
                        value={formData.dose_arv}
                        onChange={(e) => handleChange('dose_arv', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Heure"
                        value={formData.heure_arv}
                        onChange={(e) => handleChange('heure_arv', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.vitamine_k1}
                    onChange={(e) => handleChange('vitamine_k1', e.target.checked)}
                  />
                }
                label="Vitamine K1"
              />
              {formData.vitamine_k1 && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Dose"
                        value={formData.dose_vitamine_k1}
                        onChange={(e) => handleChange('dose_vitamine_k1', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Voie</InputLabel>
                        <Select
                          value={formData.voie_vitamine_k1}
                          onChange={(e) => handleChange('voie_vitamine_k1', e.target.value)}
                          label="Voie"
                        >
                          <MenuItem value="IM">IM</MenuItem>
                          <MenuItem value="Orale">Orale</MenuItem>
                          <MenuItem value="IV">IV</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Heure"
                        value={formData.heure_vitamine_k1}
                        onChange={(e) => handleChange('heure_vitamine_k1', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Grid>

            {/* Identification */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Identification
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.pesee}
                    onChange={(e) => handleChange('pesee', e.target.checked)}
                  />
                }
                label="Pesée"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.chapelet_identification}
                    onChange={(e) => handleChange('chapelet_identification', e.target.checked)}
                  />
                }
                label="Chapelet d'identification"
              />
              {formData.chapelet_identification && (
                <TextField
                  fullWidth
                  label="Numéro du chapelet"
                  value={formData.numero_chapelet}
                  onChange={(e) => handleChange('numero_chapelet', e.target.value)}
                  size="small"
                  sx={{ mt: 1, ml: 4 }}
                />
              )}
            </Grid>

            {/* Soins du cordon */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Soins du Cordon
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.soins_cordon}
                    onChange={(e) => handleChange('soins_cordon', e.target.checked)}
                  />
                }
                label="Soins du cordon effectués"
              />
              {formData.soins_cordon && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Antiseptique utilisé"
                        value={formData.antiseptique_cordon}
                        onChange={(e) => handleChange('antiseptique_cordon', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Heure"
                        value={formData.heure_soins_cordon}
                        onChange={(e) => handleChange('heure_soins_cordon', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                  </Grid>
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

export default FormulaireSoinsImmediats;

