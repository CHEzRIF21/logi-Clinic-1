import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Alert,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  Save,
  Info,
  LocalShipping,
} from '@mui/icons-material';
import { SoinsPromotionnels } from '../../services/cpnService';

interface GestionSoinsPromotionnelsProps {
  dossierId: string;
  soins?: SoinsPromotionnels;
  onSave: (data: SoinsPromotionnels) => Promise<void>;
}

const GestionSoinsPromotionnels: React.FC<GestionSoinsPromotionnelsProps> = ({
  dossierId,
  soins,
  onSave,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<SoinsPromotionnels>>({
    dossier_obstetrical_id: dossierId,
    // Informations données
    info_vih_ptme: soins?.info_vih_ptme || false,
    date_info_vih_ptme: soins?.date_info_vih_ptme || '',
    info_reference_cpn: soins?.info_reference_cpn || false,
    date_info_reference_cpn: soins?.date_info_reference_cpn || '',
    info_paludisme: soins?.info_paludisme || false,
    date_info_paludisme: soins?.date_info_paludisme || '',
    info_nutrition: soins?.info_nutrition || false,
    date_info_nutrition: soins?.date_info_nutrition || '',
    info_espacement_naissances: soins?.info_espacement_naissances || false,
    date_info_espacement_naissances: soins?.date_info_espacement_naissances || '',
    // Fournitures distribuées
    moustiquaire: soins?.moustiquaire || false,
    date_moustiquaire: soins?.date_moustiquaire || '',
    quantite_moustiquaire: soins?.quantite_moustiquaire || 0,
    preservatifs: soins?.preservatifs || false,
    date_preservatifs: soins?.date_preservatifs || '',
    quantite_preservatifs: soins?.quantite_preservatifs || 0,
    fer_acide_folique: soins?.fer_acide_folique || false,
    date_fer_acide_folique: soins?.date_fer_acide_folique || '',
    quantite_fer_acide_folique: soins?.quantite_fer_acide_folique || 0,
    deparasitage: soins?.deparasitage || false,
    date_deparasitage: soins?.date_deparasitage || '',
    autres_fournitures: soins?.autres_fournitures || '',
  });

  const handleChange = (field: keyof SoinsPromotionnels, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(formData as SoinsPromotionnels);
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

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
            Informations Données à la Mère
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.info_vih_ptme}
                    onChange={(e) => handleChange('info_vih_ptme', e.target.checked)}
                  />
                }
                label="Prévention du VIH/PTME"
              />
              {formData.info_vih_ptme && (
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={formData.date_info_vih_ptme}
                  onChange={(e) => handleChange('date_info_vih_ptme', e.target.value)}
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
                    checked={formData.info_reference_cpn}
                    onChange={(e) => handleChange('info_reference_cpn', e.target.checked)}
                  />
                }
                label="Référence pour CPN"
              />
              {formData.info_reference_cpn && (
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={formData.date_info_reference_cpn}
                  onChange={(e) => handleChange('date_info_reference_cpn', e.target.value)}
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
                    checked={formData.info_paludisme}
                    onChange={(e) => handleChange('info_paludisme', e.target.checked)}
                  />
                }
                label="Information sur le paludisme"
              />
              {formData.info_paludisme && (
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={formData.date_info_paludisme}
                  onChange={(e) => handleChange('date_info_paludisme', e.target.value)}
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
                    checked={formData.info_nutrition}
                    onChange={(e) => handleChange('info_nutrition', e.target.checked)}
                  />
                }
                label="Nutrition"
              />
              {formData.info_nutrition && (
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={formData.date_info_nutrition}
                  onChange={(e) => handleChange('date_info_nutrition', e.target.value)}
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
                    checked={formData.info_espacement_naissances}
                    onChange={(e) => handleChange('info_espacement_naissances', e.target.checked)}
                  />
                }
                label="Espacement des naissances"
              />
              {formData.info_espacement_naissances && (
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={formData.date_info_espacement_naissances}
                  onChange={(e) => handleChange('date_info_espacement_naissances', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ mt: 1, ml: 4 }}
                />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
            Fournitures Distribuées
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.moustiquaire}
                    onChange={(e) => handleChange('moustiquaire', e.target.checked)}
                  />
                }
                label="Moustiquaire"
              />
              {formData.moustiquaire && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date"
                        value={formData.date_moustiquaire}
                        onChange={(e) => handleChange('date_moustiquaire', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantité"
                        value={formData.quantite_moustiquaire}
                        onChange={(e) => handleChange('quantite_moustiquaire', parseInt(e.target.value) || 0)}
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
                    checked={formData.preservatifs}
                    onChange={(e) => handleChange('preservatifs', e.target.checked)}
                  />
                }
                label="Préservatifs"
              />
              {formData.preservatifs && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date"
                        value={formData.date_preservatifs}
                        onChange={(e) => handleChange('date_preservatifs', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantité"
                        value={formData.quantite_preservatifs}
                        onChange={(e) => handleChange('quantite_preservatifs', parseInt(e.target.value) || 0)}
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
                    checked={formData.fer_acide_folique}
                    onChange={(e) => handleChange('fer_acide_folique', e.target.checked)}
                  />
                }
                label="Fer + Acide folique"
              />
              {formData.fer_acide_folique && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date"
                        value={formData.date_fer_acide_folique}
                        onChange={(e) => handleChange('date_fer_acide_folique', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantité"
                        value={formData.quantite_fer_acide_folique}
                        onChange={(e) => handleChange('quantite_fer_acide_folique', parseInt(e.target.value) || 0)}
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
                    checked={formData.deparasitage}
                    onChange={(e) => handleChange('deparasitage', e.target.checked)}
                  />
                }
                label="Déparasitage"
              />
              {formData.deparasitage && (
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={formData.date_deparasitage}
                  onChange={(e) => handleChange('date_deparasitage', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ mt: 1, ml: 4 }}
                />
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Autres fournitures"
                value={formData.autres_fournitures}
                onChange={(e) => handleChange('autres_fournitures', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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

export default GestionSoinsPromotionnels;

