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
  Remove,
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
import { supabase } from '../../services/supabase';
import { PrescriptionPrintService, OrdonnanceData } from '../../services/prescriptionPrintService';
import { MedicamentService } from '../../services/medicamentService';
import { MedicamentSupabase } from '../../services/stockSupabase';
import { getMedicamentsFallbackOptions } from '../../data/medicamentsOptionsFallback';

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
  const [lines, setLines] = useState<PrescriptionLineDraft[]>([]);
  const [allMedicaments, setAllMedicaments] = useState<MedicamentSupabase[]>([]);
  const [medicamentOptions, setMedicamentOptions] = useState<MedicamentSafetyInfo[]>([]);
  const [optionsQuery, setOptionsQuery] = useState('');
  const [loadingMedicaments, setLoadingMedicaments] = useState(false);
  const [incompatibilityAlerts, setIncompatibilityAlerts] = useState<IncompatibilityAlert[]>([]);

  const patientAllergies = useMemo(
    () => PrescriptionSafetyService.parseAllergies(patient?.allergies),
    [patient?.allergies]
  );

  // Charger tous les médicaments au montage du composant
  useEffect(() => {
    const loadAllMedicaments = async () => {
      try {
        setLoadingMedicaments(true);
        const medicaments = await MedicamentService.getAllMedicaments();
        setAllMedicaments(medicaments);
      } catch (error) {
        console.error('Erreur lors du chargement des médicaments:', error);
      } finally {
        setLoadingMedicaments(false);
      }
    };

    if (open) {
      loadAllMedicaments();
    }
  }, [open]);

  // Rafraîchir les stocks en temps réel pour les médicaments sélectionnés
  useEffect(() => {
    const refreshStocks = async () => {
      const medicamentsToRefresh = lines
        .filter((line) => line.selectedMedicament?.id)
        .map((line) => line.selectedMedicament!.id);

      if (medicamentsToRefresh.length === 0) return;

      for (const medicamentId of medicamentsToRefresh) {
        try {
          const stock = await PrescriptionSafetyService.getMedicamentStock(medicamentId);
          
          setLines((prevLines) =>
            prevLines.map((line) => {
              if (line.selectedMedicament?.id === medicamentId) {
                const updatedMedicament = {
                  ...line.selectedMedicament,
                  stock_detail: stock.stock_detail,
                  stock_gros: stock.stock_gros,
                  stock_total: stock.stock_total,
                };
                
                // Mettre à jour les alertes de stock
                const stockAlert = PrescriptionSafetyService.getStockAlert(updatedMedicament);
                const updatedAlerts = line.alerts?.filter((a) => a.type !== 'stock') || [];
                if (stockAlert) {
                  updatedAlerts.push(stockAlert);
                }
                
                return {
                  ...line,
                  selectedMedicament: updatedMedicament,
                  alerts: updatedAlerts,
                };
              }
              return line;
            })
          );
        } catch (error) {
          console.error(`Erreur lors du rafraîchissement du stock pour ${medicamentId}:`, error);
        }
      }
    };

    // Rafraîchir immédiatement puis toutes les 10 secondes
    refreshStocks();
    const interval = setInterval(refreshStocks, 10000);

    // Écouter les changements en temps réel via Supabase
    const channel = supabase
      .channel('stocks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lots',
        },
        () => {
          refreshStocks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mouvements_stock',
        },
        () => {
          refreshStocks();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [lines.map((l) => l.selectedMedicament?.id).join(',')]);

  // Liste fallback unifiée (medicamentsFrequents + listeMedicamentsComplet)
  const fallbackMedicamentOptions = useMemo(
    () => getMedicamentsFallbackOptions(),
    []
  );

  // Rechercher les médicaments avec leurs stocks en temps réel
  useEffect(() => {
    let cancelled = false;

    const buildOptionsFromMedicaments = async (meds: MedicamentSupabase[]): Promise<MedicamentSafetyInfo[]> => {
      const slice = meds.slice(0, 25).map(async (med) => {
        try {
          const stock = await PrescriptionSafetyService.getMedicamentStock(med.id);
          return {
            id: med.id,
            code: med.code,
            nom: med.nom,
            dosage: med.dosage,
            unite: med.unite,
            categorie: med.categorie,
            prescription_requise: med.prescription_requise,
            seuil_alerte: med.seuil_alerte,
            seuil_rupture: med.seuil_rupture,
            stock_detail: stock.stock_detail,
            stock_gros: stock.stock_gros,
            stock_total: stock.stock_total,
            molecules: [],
          } as MedicamentSafetyInfo;
        } catch {
          return {
            id: med.id,
            code: med.code,
            nom: med.nom,
            dosage: med.dosage,
            unite: med.unite,
            categorie: med.categorie,
            prescription_requise: med.prescription_requise,
            seuil_alerte: med.seuil_alerte,
            seuil_rupture: med.seuil_rupture,
            stock_detail: 0,
            stock_gros: 0,
            stock_total: 0,
            molecules: [],
          } as MedicamentSafetyInfo;
        }
      });
      return Promise.all(slice);
    };

    const searchMedicaments = async () => {
      try {
        setLoadingMedicaments(true);

        // Si la requête est vide : afficher les premiers médicaments ou le fallback
        if (!optionsQuery || optionsQuery.trim().length < 1) {
          if (allMedicaments.length > 0) {
            const results = await buildOptionsFromMedicaments(allMedicaments);
            if (!cancelled) {
              setMedicamentOptions(results);
            }
          } else {
            // Fallback : liste des médicaments fréquents quand la table est vide
            if (!cancelled) {
              setMedicamentOptions(fallbackMedicamentOptions);
            }
          }
          if (!cancelled) setLoadingMedicaments(false);
          return;
        }

        // Si la requête fait moins de 2 caractères, utiliser la recherche locale
        if (optionsQuery.trim().length < 2) {
          const filtered = allMedicaments
            .filter((med) => {
              const nom = (med.nom || '').toLowerCase();
              const code = (med.code || '').toLowerCase();
              const q = optionsQuery.toLowerCase();
              return nom.includes(q) || code.includes(q);
            })
            .slice(0, 20);

          const results = filtered.length > 0
            ? await buildOptionsFromMedicaments(filtered)
            : getMedicamentsFallbackOptions(optionsQuery);

          if (!cancelled) {
            setMedicamentOptions(results);
          }
        } else {
          // Recherche via le service pour les requêtes de 2+ caractères
          const results = await PrescriptionSafetyService.searchMedicaments(optionsQuery);
          if (!cancelled) {
            setMedicamentOptions(results);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la recherche de médicaments:', error);
        if (!cancelled) {
          setMedicamentOptions(fallbackMedicamentOptions);
        }
      } finally {
        if (!cancelled) {
          setLoadingMedicaments(false);
        }
      }
    };

    const timeoutId = setTimeout(searchMedicaments, open ? 150 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [optionsQuery, allMedicaments, open, fallbackMedicamentOptions]);

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
        nom_medicament: value, // Mettre à jour le nom même si pas sélectionné du catalogue
        alerts: [],
      };

      // Si l'utilisateur efface la sélection, réinitialiser
      if (!value) {
        nextLine.selectedMedicament = null;
        nextLine.medicament_id = undefined;
      }

      return nextLine;
    });
    
    // Filtrer la liste des médicaments selon la saisie
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

    // Utiliser setTimeout pour éviter de bloquer l'interface
    setTimeout(() => {
      PrescriptionPrintService.printOrdonnance(ordonnanceData);
    }, 100);
  };

  const handleSave = async () => {
    // Validation assouplie : nom_medicament, posologie et quantite_totale sont obligatoires
    // medicament_id est optionnel (permet la saisie libre)
    const invalidLines = lines.filter(
      (line) => !line.nom_medicament || !line.posologie || !line.quantite_totale
    );

    if (invalidLines.length > 0) {
      alert('Veuillez remplir tous les champs obligatoires (nom du médicament, posologie, quantité) pour chaque ligne');
      return;
    }

    try {
      await onSave(
        lines.map((line) => ({
          medicament_id: line.medicament_id, // Peut être undefined si saisie libre
          nom_medicament: line.nom_medicament || '',
          posologie: line.posologie || '',
          quantite_totale: line.quantite_totale || 1,
          duree_jours: line.duree_jours,
          mode_administration: line.mode_administration || '',
          instructions: line.instructions || '',
        }))
      );
      handleClose();
    } catch (error: any) {
      console.error('Erreur lors de la création de la prescription:', error);
      alert(error.message || 'Erreur lors de la création de la prescription');
    }
  };

  const handleClose = () => {
    setLines([]);
    setAllMedicaments([]);
    setMedicamentOptions([]);
    setOptionsQuery('');
    setIncompatibilityAlerts([]);
    onClose();
  };

  const handleDialogClose = (event: any, reason?: string) => {
    // Empêcher la fermeture par clic en dehors ou ESC
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }
    handleClose();
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
    <Dialog open={open} onClose={handleDialogClose} maxWidth="md" fullWidth>
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

          <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
            Sélectionner les médicaments
          </Typography>

          {/* Zone de recherche et sélection de médicaments */}
          <Box sx={{ mb: 3 }}>
            <Autocomplete<MedicamentSafetyInfo, false, true, true>
              freeSolo
              options={medicamentOptions}
              loading={loadingMedicaments}
              value={null}
              inputValue={optionsQuery}
              onInputChange={(_, newInputValue) => {
                setOptionsQuery(newInputValue);
              }}
              onChange={(_, newValue) => {
                // Gérer la sélection de manière synchrone d'abord
                if (newValue && typeof newValue !== 'string') {
                  // Vérifier si le médicament n'est pas déjà sélectionné
                  const alreadySelected = lines.some(
                    (line) => line.medicament_id === newValue.id || line.nom_medicament === newValue.nom
                  );
                  
                  if (alreadySelected) {
                    setOptionsQuery('');
                    return;
                  }

                  // Créer la ligne immédiatement avec les données disponibles
                  const newLine = createEmptyLine();
                  const alerts: PrescriptionSafetyAlert[] = [];
                  const isFallback = String(newValue.id).startsWith('fallback-');
                  // Pour les médicaments du catalogue (non fallback), lier medicament_id
                  newLine.selectedMedicament = newValue;
                  newLine.medicament_id = isFallback ? undefined : newValue.id;
                  newLine.nom_medicament = newValue.nom;
                  newLine.medicamentInput = newValue.nom;
                  const stockAlert = !isFallback ? PrescriptionSafetyService.getStockAlert(newValue) : null;
                  if (stockAlert) alerts.push(stockAlert);
                  alerts.push(...PrescriptionSafetyService.getAllergyAlerts(patientAllergies, newValue));
                  newLine.alerts = alerts;
                  
                  setLines((prev) => [...prev, newLine]);
                  setOptionsQuery('');

                  // Rafraîchir les stocks en arrière-plan (sauf pour les médicaments fallback)
                  if (!isFallback) {
                  PrescriptionSafetyService.getMedicamentStock(newValue.id)
                    .then((realTimeStock) => {
                      setLines((prevLines) =>
                        prevLines.map((line) => {
                          if (line.medicament_id === newValue.id && line.selectedMedicament) {
                            const updatedMedicament = {
                              ...line.selectedMedicament,
                              stock_detail: realTimeStock.stock_detail,
                              stock_gros: realTimeStock.stock_gros,
                              stock_total: realTimeStock.stock_total,
                            };
                            
                            // Mettre à jour les alertes de stock
                            const updatedStockAlert = PrescriptionSafetyService.getStockAlert(updatedMedicament);
                            const updatedAlerts = line.alerts?.filter((a) => a.type !== 'stock') || [];
                            if (updatedStockAlert) {
                              updatedAlerts.push(updatedStockAlert);
                            }
                            
                            return {
                              ...line,
                              selectedMedicament: updatedMedicament,
                              alerts: updatedAlerts,
                            };
                          }
                          return line;
                        })
                      );
                    })
                    .catch((error) => {
                      console.error('Erreur lors de la récupération du stock:', error);
                    });
                  }
                } else if (typeof newValue === 'string' && newValue.trim().length > 0) {
                  // Si c'est une saisie libre, créer une ligne avec le nom saisi
                  const newLine = createEmptyLine();
                  newLine.nom_medicament = newValue.trim();
                  newLine.medicamentInput = newValue.trim();
                  newLine.alerts = [];
                  
                  setLines((prev) => [...prev, newLine]);
                  setOptionsQuery('');
                }
              }}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return false;
                if (typeof option === 'string' || typeof value === 'string') return option === value;
                return option.id === value.id;
              }}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                if (!option) return '';
                return `${option.nom}${option.dosage ? ` (${option.dosage} ${option.unite || ''})` : ''}`;
              }}
              filterOptions={(options, { inputValue }) => {
                // Le filtrage est déjà fait par la recherche, on retourne les options telles quelles
                return options;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Rechercher et ajouter un médicament"
                  placeholder="Cliquez ou tapez pour rechercher et ajouter des médicaments..."
                  helperText={
                    loadingMedicaments
                      ? 'Chargement des médicaments...'
                      : optionsQuery.length > 0 && medicamentOptions.length === 0
                      ? 'Aucun médicament trouvé. Vous pouvez continuer à taper librement.'
                      : optionsQuery.length > 0 && medicamentOptions.length > 0
                      ? `${medicamentOptions.length} médicament(s) trouvé(s)`
                      : medicamentOptions.length > 0
                      ? `${medicamentOptions.length} médicament(s) disponibles — cliquez pour afficher ou tapez pour rechercher`
                      : 'Cliquez ou tapez pour afficher les médicaments disponibles'
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingMedicaments ? <CircularProgress color="inherit" size={20} /> : null}
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
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
            Détails de prescription ({lines.filter(l => l.medicament_id || l.nom_medicament).length} médicament(s))
          </Typography>

          {/* Liste des médicaments sélectionnés avec leurs détails */}
          {lines
            .filter((line) => line.medicament_id || line.nom_medicament)
            .map((line, index) => {
              const actualIndex = lines.findIndex((l) => l === line);
              return (
                <Box
                  key={actualIndex}
                  sx={{
                    mb: 3,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Medication color="primary" />
                      <Typography variant="subtitle2" fontWeight="bold">
                        {line.selectedMedicament?.nom || line.nom_medicament || 'Médicament'}
                        {line.selectedMedicament?.dosage && ` (${line.selectedMedicament.dosage} ${line.selectedMedicament.unite || ''})`}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveLine(actualIndex)}
                      title="Supprimer ce médicament"
                    >
                      <Remove />
                    </IconButton>
                  </Box>

                  {line.selectedMedicament && (
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
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

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Posologie *"
                        value={line.posologie || ''}
                        onChange={(e) => handleLineChange(actualIndex, 'posologie', e.target.value)}
                        placeholder="Ex: 1 comprimé matin et soir"
                        required
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Quantité totale *"
                        type="number"
                        value={line.quantite_totale || ''}
                        onChange={(e) =>
                          handleLineChange(actualIndex, 'quantite_totale', parseInt(e.target.value) || 1)
                        }
                        inputProps={{ min: 1 }}
                        required
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Durée (jours)"
                        type="number"
                        value={line.duree_jours || ''}
                        onChange={(e) =>
                          handleLineChange(actualIndex, 'duree_jours', parseInt(e.target.value) || undefined)
                        }
                        inputProps={{ min: 1 }}
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Mode d'administration</InputLabel>
                        <Select
                          value={line.mode_administration || ''}
                          onChange={(e) =>
                            handleLineChange(actualIndex, 'mode_administration', e.target.value)
                          }
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
                        onChange={(e) => handleLineChange(actualIndex, 'instructions', e.target.value)}
                        placeholder="Instructions particulières..."
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              );
            })}

          {lines.filter((l) => l.medicament_id || l.nom_medicament).length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Aucun médicament sélectionné. Cliquez sur le champ de recherche ci-dessus pour afficher la liste, ou tapez pour rechercher un médicament.
            </Alert>
          )}
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

