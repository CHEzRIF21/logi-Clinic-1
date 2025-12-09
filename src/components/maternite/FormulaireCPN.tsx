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
  FormControlLabel,
  Checkbox,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Save,
  Cancel,
  Event,
  LocalHospital,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import {
  CPNService,
  ConsultationPrenatale,
  TraitementCPN,
  ConseilsMere,
} from '../../services/cpnService';

interface FormulaireCPNProps {
  dossierId: string;
  cpn?: ConsultationPrenatale;
  onSave: (data: ConsultationPrenatale) => Promise<void>;
  onCancel: () => void;
}

const FormulaireCPN: React.FC<FormulaireCPNProps> = ({
  dossierId,
  cpn,
  onSave,
  onCancel,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prochainNumeroCPN, setProchainNumeroCPN] = useState(1);

  const [formData, setFormData] = useState<Partial<ConsultationPrenatale>>({
    dossier_obstetrical_id: dossierId,
    numero_cpn: cpn?.numero_cpn || 1,
    trimestre: cpn?.trimestre || undefined,
    date_consultation: cpn?.date_consultation || new Date().toISOString().split('T')[0],
    terme_semaines: cpn?.terme_semaines || undefined,
    // Paramètres vitaux
    poids: cpn?.poids || undefined,
    taille_uterine: cpn?.taille_uterine || undefined,
    position_foetale: cpn?.position_foetale || '',
    mouvements_foetaux: cpn?.mouvements_foetaux || false,
    bruit_coeur_foetal: cpn?.bruit_coeur_foetal || false,
    oedemes: cpn?.oedemes || false,
    etat_general: cpn?.etat_general || '',
    tension_arterielle: cpn?.tension_arterielle || '',
    temperature: cpn?.temperature || undefined,
    // Examen obstétrical
    palpation: cpn?.palpation || '',
    presentation: cpn?.presentation || '',
    hauteur_uterine: cpn?.hauteur_uterine || undefined,
    // Tests
    test_albumine: cpn?.test_albumine || '',
    test_nitrite: cpn?.test_nitrite || '',
    test_vih: cpn?.test_vih || '',
    test_syphilis: cpn?.test_syphilis || '',
    test_glycemie: cpn?.test_glycemie || undefined,
    // Examens labo
    hemoglobine: cpn?.hemoglobine || undefined,
    groupe_sanguin: cpn?.groupe_sanguin || '',
    autres_examens: cpn?.autres_examens || '',
    // Signes
    effets_secondaires: cpn?.effets_secondaires || '',
    signes_danger: cpn?.signes_danger || '',
    // Référence
    reference_necessaire: cpn?.reference_necessaire || false,
    centre_reference: cpn?.centre_reference || '',
    motif_reference: cpn?.motif_reference || '',
    suivi_retour: cpn?.suivi_retour || '',
    // Diagnostic
    diagnostic: cpn?.diagnostic || '',
    decision: cpn?.decision || '',
    prochain_rdv: cpn?.prochain_rdv || '',
    statut: cpn?.statut || 'en_cours',
  });

  const [traitements, setTraitements] = useState<Partial<TraitementCPN>[]>(cpn?.traitements || []);
  const [conseils, setConseils] = useState<Partial<ConseilsMere>>(cpn?.conseils || {});

  useEffect(() => {
    if (!cpn) {
      loadProchainNumeroCPN();
    }
  }, [dossierId]);

  useEffect(() => {
    // Calculer le trimestre automatiquement
    if (formData.terme_semaines) {
      const trimestre = CPNService.calculerTrimestre(formData.terme_semaines);
      setFormData(prev => ({ ...prev, trimestre }));
    }
  }, [formData.terme_semaines]);

  useEffect(() => {
    // Calculer le prochain RDV automatiquement
    if (formData.numero_cpn && formData.date_consultation) {
      const prochainRDV = CPNService.calculerProchainRDV(formData.numero_cpn, formData.date_consultation);
      setFormData(prev => ({ ...prev, prochain_rdv: prochainRDV }));
    }
  }, [formData.numero_cpn, formData.date_consultation]);

  const loadProchainNumeroCPN = async () => {
    try {
      const numero = await CPNService.getProchainNumeroCPN(dossierId);
      setProchainNumeroCPN(numero);
      setFormData(prev => ({ ...prev, numero_cpn: numero }));
    } catch (err) {
      console.error('Erreur loadProchainNumeroCPN:', err);
    }
  };

  const handleChange = (field: keyof ConsultationPrenatale, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTraitement = () => {
    setTraitements(prev => [...prev, {
      type_traitement: 'TPI/SP',
      dose: '',
      date_administration: formData.date_consultation,
    }]);
  };

  const handleUpdateTraitement = (index: number, field: keyof TraitementCPN, value: any) => {
    setTraitements(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteTraitement = (index: number) => {
    setTraitements(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const dataToSave: ConsultationPrenatale = {
        ...formData as ConsultationPrenatale,
        traitements: traitements as TraitementCPN[],
        conseils: conseils as ConseilsMere,
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

      {/* Informations générales */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
            Consultation Prénatale (CPN)
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Numéro CPN"
                type="number"
                value={formData.numero_cpn}
                onChange={(e) => handleChange('numero_cpn', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Date de consultation"
                type="date"
                value={formData.date_consultation}
                onChange={(e) => handleChange('date_consultation', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Terme (SA)"
                type="number"
                value={formData.terme_semaines || ''}
                onChange={(e) => handleChange('terme_semaines', parseInt(e.target.value) || undefined)}
                inputProps={{ min: 1, max: 42 }}
                helperText="Semaines d'aménorrhée"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Trimestre"
                value={formData.trimestre || 'Calculé auto'}
                disabled
                helperText="Calculé automatiquement"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Paramètres vitaux et examen obstétrical */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Paramètres Vitaux et Examen Obstétrical
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Poids (kg)"
                type="number"
                value={formData.poids || ''}
                onChange={(e) => handleChange('poids', parseFloat(e.target.value) || undefined)}
                inputProps={{ step: 0.1, min: 30, max: 150 }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Hauteur utérine (cm)"
                type="number"
                value={formData.hauteur_uterine || ''}
                onChange={(e) => handleChange('hauteur_uterine', parseFloat(e.target.value) || undefined)}
                inputProps={{ step: 0.1, min: 0, max: 50 }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Tension artérielle"
                value={formData.tension_arterielle}
                onChange={(e) => handleChange('tension_arterielle', e.target.value)}
                placeholder="120/80"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Température (°C)"
                type="number"
                value={formData.temperature || ''}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value) || undefined)}
                inputProps={{ step: 0.1, min: 35, max: 42 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Présentation</InputLabel>
                <Select
                  value={formData.presentation}
                  onChange={(e) => handleChange('presentation', e.target.value)}
                  label="Présentation"
                >
                  <MenuItem value="">Non évalué</MenuItem>
                  <MenuItem value="Céphalique">Céphalique</MenuItem>
                  <MenuItem value="Siège">Siège</MenuItem>
                  <MenuItem value="Transverse">Transverse</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Position fœtale"
                value={formData.position_foetale}
                onChange={(e) => handleChange('position_foetale', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>État général</InputLabel>
                <Select
                  value={formData.etat_general}
                  onChange={(e) => handleChange('etat_general', e.target.value)}
                  label="État général"
                >
                  <MenuItem value="Bon">Bon</MenuItem>
                  <MenuItem value="Moyen">Moyen</MenuItem>
                  <MenuItem value="Altéré">Altéré</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.mouvements_foetaux}
                    onChange={(e) => handleChange('mouvements_foetaux', e.target.checked)}
                  />
                }
                label="Mouvements fœtaux"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.bruit_coeur_foetal}
                    onChange={(e) => handleChange('bruit_coeur_foetal', e.target.checked)}
                  />
                }
                label="Bruit du cœur fœtal (BCF)"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.oedemes}
                    onChange={(e) => handleChange('oedemes', e.target.checked)}
                  />
                }
                label="Œdèmes"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Palpation"
                value={formData.palpation}
                onChange={(e) => handleChange('palpation', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tests et examens */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Tests et Examens de Laboratoire
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Test Albumine"
                value={formData.test_albumine}
                onChange={(e) => handleChange('test_albumine', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Test Nitrite"
                value={formData.test_nitrite}
                onChange={(e) => handleChange('test_nitrite', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Hémoglobine (g/dL)"
                type="number"
                value={formData.hemoglobine || ''}
                onChange={(e) => handleChange('hemoglobine', parseFloat(e.target.value) || undefined)}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Test VIH</InputLabel>
                <Select
                  value={formData.test_vih}
                  onChange={(e) => handleChange('test_vih', e.target.value)}
                  label="Test VIH"
                >
                  <MenuItem value="">Non fait</MenuItem>
                  <MenuItem value="Négatif">Négatif</MenuItem>
                  <MenuItem value="Positif">Positif</MenuItem>
                  <MenuItem value="Indéterminé">Indéterminé</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Test Syphilis</InputLabel>
                <Select
                  value={formData.test_syphilis}
                  onChange={(e) => handleChange('test_syphilis', e.target.value)}
                  label="Test Syphilis"
                >
                  <MenuItem value="">Non fait</MenuItem>
                  <MenuItem value="Négatif">Négatif</MenuItem>
                  <MenuItem value="Positif">Positif</MenuItem>
                  <MenuItem value="Indéterminé">Indéterminé</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Glycémie (g/L)"
                type="number"
                value={formData.test_glycemie || ''}
                onChange={(e) => handleChange('test_glycemie', parseFloat(e.target.value) || undefined)}
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Autres examens"
                value={formData.autres_examens}
                onChange={(e) => handleChange('autres_examens', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Diagnostic et décision */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Diagnostic et Décision
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Effets secondaires"
                value={formData.effets_secondaires}
                onChange={(e) => handleChange('effets_secondaires', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Signes de danger"
                value={formData.signes_danger}
                onChange={(e) => handleChange('signes_danger', e.target.value)}
                multiline
                rows={2}
                error={Boolean(formData.signes_danger)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Diagnostic"
                value={formData.diagnostic}
                onChange={(e) => handleChange('diagnostic', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Décision"
                value={formData.decision}
                onChange={(e) => handleChange('decision', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Référence */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.reference_necessaire}
                onChange={(e) => handleChange('reference_necessaire', e.target.checked)}
              />
            }
            label="Référence nécessaire"
          />

          {formData.reference_necessaire && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Centre de référence"
                  value={formData.centre_reference}
                  onChange={(e) => handleChange('centre_reference', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Motif de référence"
                  value={formData.motif_reference}
                  onChange={(e) => handleChange('motif_reference', e.target.value)}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Prochain rendez-vous */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Prochain Rendez-vous
          </Typography>
          <TextField
            fullWidth
            label="Prochain RDV"
            type="date"
            value={formData.prochain_rdv}
            onChange={(e) => handleChange('prochain_rdv', e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Calculé automatiquement selon le protocole OMS"
          />
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

export default FormulaireCPN;

