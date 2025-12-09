import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Grid,
} from '@mui/material';
import {
  Add,
  Delete,
  Medication,
  Close,
  Print,
  Download,
  Warning,
  CheckCircle,
  SwapHoriz,
} from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import { Patient } from '../../services/supabase';
import { PrescriptionLine } from '../../services/consultationApiService';
import {
  IncompatibilityAlert,
  MedicamentSafetyInfo,
  PrescriptionSafetyAlert,
  PrescriptionSafetyService,
} from '../../services/prescriptionSafetyService';
import { PrescriptionPrintService, OrdonnanceData } from '../../services/prescriptionPrintService';

interface PrescriptionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (lines: Partial<PrescriptionLine>[]) => Promise<void>;
  consultationId: string;
  patientId: string;
  patient?: Patient | null;
  medecin?: {
    nom: string;
    prenom: string;
    specialite?: string;
    numero_ordre?: string;
    adresse?: string;
    telephone?: string;
  };
}

interface PrescriptionLineDraft extends Partial<PrescriptionLine> {
  medicament_id?: string;
  selectedMedicament?: MedicamentSafetyInfo | null;
  medicamentInput?: string;
  alerts?: PrescriptionSafetyAlert[];
}

const createEmptyLine = (): PrescriptionLineDraft => ({
  nom_medicament: '',
  posologie: '',
  quantite_totale: 1,
  duree_jours: undefined,
  mode_administration: '',
  instructions: '',
  medicamentInput: '',
  selectedMedicament: null,
  alerts: [],
});

export const PrescriptionFormModal: React.FC<PrescriptionFormModalProps> = ({
  open,
  onClose,
  onSave,
  consultationId,
  patientId,
  patient,
  medecin,
}) => {
  const [lines, setLines] = useState<PrescriptionLineDraft[]>([createEmptyLine()]);
  const [medicamentOptions, setMedicamentOptions] = useState<MedicamentSafetyInfo[]>([]);
  const [optionsQuery, setOptionsQuery] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [incompatibilityAlerts, setIncompatibilityAlerts] = useState<IncompatibilityAlert[]>([]);

  const patientAllergies = useMemo(
    () => PrescriptionSafetyService.parseAllergies(patient?.allergies),
    [patient?.allergies]
  );

  useEffect(() => {
    let cancelled = false;

    const fetchMedicaments = async () => {
      if (!optionsQuery || optionsQuery.trim().length < 2) {
        setMedicamentOptions([]);
        return;
      }

      setOptionsLoading(true);
      try {
        const results = await PrescriptionSafetyService.searchMedicaments(optionsQuery.trim());
        if (!cancelled) {
          setMedicamentOptions(results);
        }
      } catch (error) {
        console.error('Erreur lors de la recherche de médicaments:', error);
        if (!cancelled) {
          setMedicamentOptions([]);
        }
      } finally {
        if (!cancelled) {
          setOptionsLoading(false);
        }
      }
    };

    fetchMedicaments().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [optionsQuery]);

  useEffect(() => {
    let cancelled = false;
    const medicamentIds = lines
      .map((line) => line.medicament_id)
      .filter((value): value is string => Boolean(value));

    if (medicamentIds.length < 2) {
      setIncompatibilityAlerts([]);
      return;
    }

    PrescriptionSafetyService.getIncompatibilities(medicamentIds)
      .then((alerts) => {
        if (!cancelled) {
          setIncompatibilityAlerts(alerts);
        }
      })
      .catch((error) => {
        console.error('Erreur lors de la vérification des incompatibilités:', error);
        if (!cancelled) {
          setIncompatibilityAlerts([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lines]);

  const handleAddLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, updater: (line: PrescriptionLineDraft) => PrescriptionLineDraft) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = updater(prev[index]);
      return updated;
    });
  };

  const handleLineChange = (index: number, field: keyof PrescriptionLine, value: any) => {
    updateLine(index, (line) => ({
      ...line,
      [field]: value,
    }));
  };

  const handleMedicamentInputChange = (index: number, value: string) => {
    updateLine(index, (line) => {
      const nextLine: PrescriptionLineDraft = {
        ...line,
        medicamentInput: value,
        nom_medicament: value,
      };

      if (!value) {
        nextLine.selectedMedicament = null;
        nextLine.medicament_id = undefined;
        nextLine.alerts = [];
      }

      return nextLine;
    });
    setOptionsQuery(value);
  };

  const handleMedicamentSelect = (index: number, value: MedicamentSafetyInfo | string | null) => {
    updateLine(index, (line) => {
      if (!value) {
        return {
          ...line,
          selectedMedicament: null,
          medicament_id: undefined,
          nom_medicament: line.medicamentInput || '',
          alerts: [],
        };
      }

      if (typeof value === 'string') {
        return {
          ...line,
          selectedMedicament: null,
          medicament_id: undefined,
          medicamentInput: value,
          nom_medicament: value,
          alerts: [],
        };
      }

      const alerts: PrescriptionSafetyAlert[] = [];
      const stockAlert = PrescriptionSafetyService.getStockAlert(value);
      if (stockAlert) {
        alerts.push(stockAlert);
      }
      alerts.push(...PrescriptionSafetyService.getAllergyAlerts(patientAllergies, value));

      return {
        ...line,
        selectedMedicament: value,
        medicament_id: value.id,
        nom_medicament: value.nom,
        medicamentInput: value.nom,
        alerts,
      };
    });
  };

  const handlePrintOrdonnance = () => {
    const validLines = lines.filter(
      (line) => line.nom_medicament && line.posologie && line.quantite_totale
    );

    if (validLines.length === 0) {
      alert('Veuillez remplir au moins une ligne de prescription complète');
      return;
    }

    const ordonnanceData: OrdonnanceData = {
      patient: {
        nom: patient?.nom || '',
        prenom: patient?.prenom || '',
        date_naissance: patient?.date_naissance || '',
        adresse: patient?.adresse || '',
      },
      medecin: medecin || {
        nom: 'Médecin',
        prenom: 'Dr.',
      },
      date: new Date().toISOString(),
      consultation_id: consultationId,
      prescriptions: validLines.map((line) => ({
        medicament: line.nom_medicament || '',
        dosage: line.selectedMedicament?.dosage,
        posologie: line.posologie || '',
        quantite: line.quantite_totale || 1,
        duree_jours: line.duree_jours,
        instructions: line.instructions,
      })),
    };

    PrescriptionPrintService.printOrdonnance(ordonnanceData);
  };

  const handleSave = async () => {
    const invalidLines = lines.filter(
      (line) => !line.nom_medicament || !line.posologie || !line.quantite_totale || !line.medicament_id
    );

    if (invalidLines.length > 0) {
      alert('Veuillez sélectionner un médicament du catalogue et remplir tous les champs obligatoires pour chaque ligne');
      return;
    }

    try {
      await onSave(
        lines.map((line) => ({
          medicament_id: line.medicament_id,
          nom_medicament: line.nom_medicament,
          posologie: line.posologie,
          quantite_totale: line.quantite_totale,
          duree_jours: line.duree_jours,
          mode_administration: line.mode_administration,
          instructions: line.instructions,
        }))
      );
      handleClose();
    } catch (error) {
      console.error('Erreur lors de la création de la prescription:', error);
    }
  };

  const handleClose = () => {
    setLines([createEmptyLine()]);
    setMedicamentOptions([]);
    setOptionsQuery('');
    setIncompatibilityAlerts([]);
    onClose();
  };

  const getMedicamentName = (id: string) => {
    return (
      lines.find((line) => line.medicament_id === id)?.nom_medicament ||
      medicamentOptions.find((option) => option.id === id)?.nom ||
      'Médicament'
    );
  };

  const renderLineAlerts = (alerts?: PrescriptionSafetyAlert[]) => {
    if (!alerts || alerts.length === 0) return null;
    return alerts.map((alert, idx) => (
      <Alert key={`${alert.type}-${idx}`} severity={alert.severity} sx={{ mt: 1 }}>
        {alert.message}
      </Alert>
    ));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Medication />
            <Typography variant="h6">Nouvelle Prescription</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {incompatibilityAlerts.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Incompatibilités détectées
              </Typography>
              <Box component="ul" sx={{ pl: 3, m: 0 }}>
                {incompatibilityAlerts.map((alert, idx) => (
                  <li key={`${alert.id}-${idx}`}>
                    {getMedicamentName(alert.medicament_1_id)} / {getMedicamentName(alert.medicament_2_id)} —{' '}
                    {alert.description}
                  </li>
                ))}
              </Box>
            </Alert>
          )}

          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Lignes de prescription
          </Typography>

          {lines.map((line, index) => (
            <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2">Ligne {index + 1}</Typography>
                {lines.length > 1 && (
                  <IconButton size="small" color="error" onClick={() => handleRemoveLine(index)}>
                    <Delete />
                  </IconButton>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete<MedicamentSafetyInfo, false, true, true>
                    freeSolo
                    options={medicamentOptions}
                    loading={optionsLoading}
                    value={line.selectedMedicament || null}
                    inputValue={line.medicamentInput || ''}
                    onInputChange={(_, newInputValue) => handleMedicamentInputChange(index, newInputValue)}
                    onChange={(_, newValue) => handleMedicamentSelect(index, newValue)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) =>
                      option && typeof option !== 'string'
                        ? `${option.nom}${option.dosage ? ` (${option.dosage} ${option.unite || ''})` : ''}`
                        : ''
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Nom du médicament *"
                        required
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {optionsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={option.id} display="flex" flexDirection="column">
                        <Typography variant="body2" fontWeight="bold">
                          {option.nom}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.dosage} {option.unite} • Stock: {option.stock_total} unités
                        </Typography>
                      </Box>
                    )}
                  />
                  {line.selectedMedicament && (
                    <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                      <Chip
                        size="small"
                        label={`Stock total: ${line.selectedMedicament.stock_total}`}
                        color={
                          line.selectedMedicament.stock_total <= 0
                            ? 'error'
                            : line.selectedMedicament.seuil_alerte &&
                              line.selectedMedicament.stock_total <= line.selectedMedicament.seuil_alerte
                            ? 'warning'
                            : 'success'
                        }
                      />
                      <Chip size="small" label={`Détail: ${line.selectedMedicament.stock_detail}`} />
                      <Chip size="small" label={`Gros: ${line.selectedMedicament.stock_gros}`} />
                    </Box>
                  )}
                  {renderLineAlerts(line.alerts)}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Posologie *"
                    value={line.posologie || ''}
                    onChange={(e) => handleLineChange(index, 'posologie', e.target.value)}
                    placeholder="Ex: 1 comprimé matin et soir"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Quantité totale *"
                    type="number"
                    value={line.quantite_totale || ''}
                    onChange={(e) => handleLineChange(index, 'quantite_totale', parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Durée (jours)"
                    type="number"
                    value={line.duree_jours || ''}
                    onChange={(e) => handleLineChange(index, 'duree_jours', parseInt(e.target.value) || undefined)}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Mode d'administration</InputLabel>
                    <Select
                      value={line.mode_administration || ''}
                      onChange={(e) => handleLineChange(index, 'mode_administration', e.target.value)}
                      label="Mode d'administration"
                    >
                      <MenuItem value="orale">Orale</MenuItem>
                      <MenuItem value="injection">Injection</MenuItem>
                      <MenuItem value="topique">Topique</MenuItem>
                      <MenuItem value="inhalation">Inhalation</MenuItem>
                      <MenuItem value="rectale">Rectale</MenuItem>
                      <MenuItem value="autre">Autre</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Instructions"
                    value={line.instructions || ''}
                    onChange={(e) => handleLineChange(index, 'instructions', e.target.value)}
                    placeholder="Instructions particulières..."
                  />
                </Grid>
              </Grid>
            </Box>
          ))}

          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddLine}
            fullWidth
            sx={{ mt: 2 }}
          >
            Ajouter une ligne
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Box display="flex" gap={1} flex={1} justifyContent="space-between">
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrintOrdonnance}
            disabled={lines.filter((l) => l.nom_medicament && l.posologie).length === 0}
          >
            Imprimer l'ordonnance
          </Button>
          <Box display="flex" gap={1}>
            <Button onClick={handleClose}>Annuler</Button>
            <Button variant="contained" onClick={handleSave}>
              Créer la prescription
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

