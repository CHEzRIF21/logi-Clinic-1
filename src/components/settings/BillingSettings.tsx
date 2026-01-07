import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Chip,
  IconButton,
  Autocomplete,
} from '@mui/material';
import {
  Save,
  Payment,
  Settings,
  Add,
  Delete,
} from '@mui/icons-material';
import { ConfigurationService, BillingConfiguration } from '../../services/configurationService';
import { supabase } from '../../services/supabase';

const BillingSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BillingConfiguration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newActeCode, setNewActeCode] = useState('');

  // Liste des services facturables disponibles
  const [servicesDisponibles, setServicesDisponibles] = useState<Array<{ code: string; nom: string }>>([]);

  useEffect(() => {
    loadConfiguration();
    loadServicesDisponibles();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      const billingConfig = await ConfigurationService.getBillingConfigurationWithDefaults();
      setConfig(billingConfig);
    } catch (err: any) {
      console.error('Erreur chargement configuration:', err);
      setError('Erreur lors du chargement de la configuration: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadServicesDisponibles = async () => {
    try {
      const { data, error } = await supabase
        .from('services_facturables')
        .select('code, nom')
        .eq('actif', true)
        .order('nom');

      if (!error && data) {
        setServicesDisponibles(data);
      }
    } catch (err) {
      console.error('Erreur chargement services:', err);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await ConfigurationService.updateBillingConfiguration({
        paiement_obligatoire_avant_consultation: config.paiement_obligatoire_avant_consultation,
        blocage_automatique_impaye: config.blocage_automatique_impaye,
        paiement_plusieurs_temps: config.paiement_plusieurs_temps,
        exception_urgence_medecin: config.exception_urgence_medecin,
        actes_defaut_consultation: config.actes_defaut_consultation,
        actes_defaut_dossier: config.actes_defaut_dossier,
        actes_defaut_urgence: config.actes_defaut_urgence,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erreur sauvegarde configuration:', err);
      setError('Erreur lors de la sauvegarde: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddActe = () => {
    if (!newActeCode.trim() || !config) return;

    const acteCode = newActeCode.trim().toUpperCase();
    if (!config.actes_defaut_consultation.includes(acteCode)) {
      setConfig({
        ...config,
        actes_defaut_consultation: [...config.actes_defaut_consultation, acteCode],
      });
      setNewActeCode('');
    }
  };

  const handleRemoveActe = (code: string) => {
    if (!config) return;

    setConfig({
      ...config,
      actes_defaut_consultation: config.actes_defaut_consultation.filter((c) => c !== code),
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return (
      <Alert severity="error">
        Impossible de charger la configuration. Veuillez réessayer.
      </Alert>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Settings color="primary" fontSize="large" />
            <Box>
              <Typography variant="h5" gutterBottom>
                Paramètres de Facturation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configurez le processus de paiement obligatoire avant consultation
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Configuration sauvegardée avec succès
            </Alert>
          )}

          {/* Paramètres principaux */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Paramètres Généraux
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={config.paiement_obligatoire_avant_consultation}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paiement_obligatoire_avant_consultation: e.target.checked,
                    })
                  }
                />
              }
              label="Paiement obligatoire avant consultation"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Si activé, une facture initiale sera générée automatiquement à la création de chaque consultation
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={config.blocage_automatique_impaye}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      blocage_automatique_impaye: e.target.checked,
                    })
                  }
                  disabled={!config.paiement_obligatoire_avant_consultation}
                />
              }
              label="Blocage automatique si impayé"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Bloque l'accès à la consultation si le paiement n'est pas effectué
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={config.paiement_plusieurs_temps}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paiement_plusieurs_temps: e.target.checked,
                    })
                  }
                />
              }
              label="Autoriser le paiement en plusieurs temps"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Permet les paiements partiels (factures partiellement payées)
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={config.exception_urgence_medecin}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      exception_urgence_medecin: e.target.checked,
                    })
                  }
                />
              }
              label="Exception urgence avec autorisation médecin"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Permet aux médecins d'autoriser une consultation d'urgence sans paiement préalable
            </Typography>
          </Box>

          {/* Actes par défaut */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Actes par Défaut à la Création de Consultation
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={config.actes_defaut_dossier}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      actes_defaut_dossier: e.target.checked,
                    })
                  }
                />
              }
              label="Inclure dossier/fiche patient par défaut"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={config.actes_defaut_urgence}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      actes_defaut_urgence: e.target.checked,
                    })
                  }
                />
              }
              label="Inclure acte urgence si consultation urgente"
            />

            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Actes supplémentaires à inclure automatiquement :
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                {config.actes_defaut_consultation.map((code) => (
                  <Chip
                    key={code}
                    label={code}
                    onDelete={() => handleRemoveActe(code)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Box display="flex" gap={1} alignItems="center">
                <Autocomplete
                  freeSolo
                  options={servicesDisponibles.map((s) => s.code)}
                  value={newActeCode}
                  onChange={(_, value) => setNewActeCode(value || '')}
                  onInputChange={(_, value) => setNewActeCode(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Code acte"
                      placeholder="Ex: CONS-GEN, DOSSIER"
                      size="small"
                      sx={{ minWidth: 200 }}
                    />
                  )}
                />
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddActe}
                  disabled={!newActeCode.trim()}
                >
                  Ajouter
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Les codes doivent correspondre aux codes des services facturables (ex: CONS-GEN, CONS-SPEC, DOSSIER)
              </Typography>
            </Box>
          </Box>

          {/* Bouton de sauvegarde */}
          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              onClick={handleSave}
              disabled={saving}
              size="large"
            >
              {saving ? 'Sauvegarde...' : 'Enregistrer les Paramètres'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BillingSettings;

