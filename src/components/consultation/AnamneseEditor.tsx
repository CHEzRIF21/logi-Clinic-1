import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Alert,
  Paper,
  Divider,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
  Checkbox,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Mic,
  Save,
  Add,
  LocalHospital,
  SmokingRooms,
  Restaurant,
  Vaccines,
  Warning,
  Stop,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { VaccinationService, Vaccine, PatientVaccination } from '../../services/vaccinationService';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  InputLabel,
} from '@mui/material';

interface AnamneseEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => Promise<void>;
  patient?: {
    id?: string;
    sexe?: string;
    date_naissance?: string;
  };
}

interface SigneClinique {
  id: string;
  description: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const AnamneseEditor: React.FC<AnamneseEditorProps> = ({
  value,
  onChange,
  onSave,
  patient,
}) => {
  // Utilisation du hook de reconnaissance vocale
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();

  // États locaux
  const [activeField, setActiveField] = useState<string | null>(null);
  const [signesCliniques, setSignesCliniques] = useState<SigneClinique[]>([]);
  const [traitementsAnterieurs, setTraitementsAnterieurs] = useState<string[]>([]);
  const [bilans, setBilans] = useState<string[]>([]);
  const [evolution, setEvolution] = useState('');
  const [newSigne, setNewSigne] = useState('');
  const [newTraitement, setNewTraitement] = useState('');
  const [newBilan, setNewBilan] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Habitudes de vie
  const [tabac, setTabac] = useState<'non' | 'ancien' | 'actuel'>('non');
  const [tabacDetails, setTabacDetails] = useState('');
  const [alcool, setAlcool] = useState<'non' | 'occasionnel' | 'regulier'>('non');
  const [alcoolDetails, setAlcoolDetails] = useState('');
  const [nutrition, setNutrition] = useState('');
  
  // Vaccinations - Structure améliorée
  interface VaccinationFormData {
    id?: string;
    vaccine_id: string;
    vaccine_name: string;
    dose_ordre: number;
    date_administration: string;
    date_rappel?: string;
    statut: 'valide' | 'annule';
    lieu?: string;
    numero_lot?: string;
    vaccinateur?: string;
  }

  const [vaccinations, setVaccinations] = useState<VaccinationFormData[]>([]);
  const [availableVaccines, setAvailableVaccines] = useState<Vaccine[]>([]);
  const [newVaccination, setNewVaccination] = useState<VaccinationFormData>({
    vaccine_id: '',
    vaccine_name: '',
    dose_ordre: 1,
    date_administration: new Date().toISOString().split('T')[0],
    statut: 'valide',
  });
  const [loadingVaccines, setLoadingVaccines] = useState(false);
  
  // Checkboxes obligatoires selon protocole
  const [grossessePossible, setGrossessePossible] = useState(false);
  const [grossesseDetails, setGrossesseDetails] = useState('');
  
  // Mise à jour du texte avec la transcription vocale
  useEffect(() => {
    if (transcript && activeField) {
      let updatedValue = '';
      switch (activeField) {
        case 'hma':
          // Utiliser une fonction de mise à jour pour éviter les problèmes de dépendances
          const currentHmaValue = value || '';
          updatedValue = currentHmaValue.trim() ? `${currentHmaValue} ${transcript.trim()}` : transcript.trim();
          onChange(updatedValue);
          break;
        case 'evolution':
          updatedValue = evolution ? `${evolution} ${transcript.trim()}` : transcript.trim();
          setEvolution(updatedValue);
          break;
        case 'tabacDetails':
          updatedValue = tabacDetails ? `${tabacDetails} ${transcript.trim()}` : transcript.trim();
          setTabacDetails(updatedValue);
          break;
        case 'alcoolDetails':
          updatedValue = alcoolDetails ? `${alcoolDetails} ${transcript.trim()}` : transcript.trim();
          setAlcoolDetails(updatedValue);
          break;
        case 'nutrition':
          updatedValue = nutrition ? `${nutrition} ${transcript.trim()}` : transcript.trim();
          setNutrition(updatedValue);
          break;
        case 'grossesseDetails':
          updatedValue = grossesseDetails ? `${grossesseDetails} ${transcript.trim()}` : transcript.trim();
          setGrossesseDetails(updatedValue);
          break;
        case 'newSigne':
          setNewSigne(transcript.trim());
          break;
        case 'newTraitement':
          setNewTraitement(transcript.trim());
          break;
        case 'newBilan':
          setNewBilan(transcript.trim());
          break;
        case 'newVaccination':
          // La vaccination n'est pas un champ texte simple, on ignore la dictée pour ce champ
          break;
        default:
          break;
      }
      // Réinitialiser le transcript après la mise à jour
      resetTranscript();
    }
  }, [transcript, activeField]);

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

  // Calculer l'âge pour déterminer si checkbox grossesse nécessaire
  const calculateAge = (dateString?: string) => {
    if (!dateString) return 0;
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const isFemaleInChildbearingAge = patient?.sexe === 'Féminin' && calculateAge(patient.date_naissance) >= 15 && calculateAge(patient.date_naissance) <= 50;

  // Charger les vaccins disponibles
  useEffect(() => {
    const loadVaccines = async () => {
      try {
        setLoadingVaccines(true);
        const vaccines = await VaccinationService.listVaccines();
        setAvailableVaccines(vaccines);
      } catch (error) {
        console.error('Erreur lors du chargement des vaccins:', error);
      } finally {
        setLoadingVaccines(false);
      }
    };
    loadVaccines();
  }, []);

  // Charger les vaccinations existantes du patient
  useEffect(() => {
    const loadPatientVaccinations = async () => {
      if (!patient?.id) return;
      try {
        const patientCard = await VaccinationService.getPatientCard(patient.id);
        if (patientCard?.doses && availableVaccines.length > 0) {
          const formattedVaccinations: VaccinationFormData[] = patientCard.doses.map((dose: PatientVaccination) => {
            const vaccine = availableVaccines.find(v => v.id === dose.vaccine_id);
            // Calculer la date de rappel si nécessaire
            let dateRappel: string | undefined;
            if (vaccine?.rappel_necessaire && vaccine.rappel_intervalle_jours) {
              const rappelDate = new Date(dose.date_administration);
              rappelDate.setDate(rappelDate.getDate() + vaccine.rappel_intervalle_jours);
              dateRappel = rappelDate.toISOString().split('T')[0];
            }
            return {
              id: dose.id,
              vaccine_id: dose.vaccine_id,
              vaccine_name: vaccine?.libelle || 'Vaccin inconnu',
              dose_ordre: dose.dose_ordre,
              date_administration: dose.date_administration.split('T')[0],
              date_rappel: dateRappel,
              statut: dose.statut,
              lieu: dose.lieu || undefined,
              numero_lot: dose.numero_lot || undefined,
              vaccinateur: dose.vaccinateur || undefined,
            };
          });
          setVaccinations(formattedVaccinations);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des vaccinations du patient:', error);
      }
    };
    if (patient?.id && availableVaccines.length > 0) {
      loadPatientVaccinations();
    }
  }, [patient?.id, availableVaccines]);

  // Gestion unifiée des signes cliniques (fusion signes positifs/négatifs)
  const handleAddSigne = () => {
    if (!newSigne.trim()) return;

    const signe: SigneClinique = {
      id: Date.now().toString(),
      description: newSigne.trim(),
    };

    setSignesCliniques([...signesCliniques, signe]);
    setNewSigne('');
  };

  const handleRemoveSigne = (id: string) => {
    setSignesCliniques(signesCliniques.filter((s) => s.id !== id));
  };

  const handleAddTraitement = () => {
    if (newTraitement.trim()) {
      setTraitementsAnterieurs([...traitementsAnterieurs, newTraitement.trim()]);
      setNewTraitement('');
    }
  };

  const handleRemoveTraitement = (index: number) => {
    setTraitementsAnterieurs(traitementsAnterieurs.filter((_, i) => i !== index));
  };

  const handleAddBilan = () => {
    if (newBilan.trim()) {
      setBilans([...bilans, newBilan.trim()]);
      setNewBilan('');
    }
  };

  const handleRemoveBilan = (index: number) => {
    setBilans(bilans.filter((_, i) => i !== index));
  };

  const handleAddVaccination = async () => {
    if (!newVaccination.vaccine_id || !newVaccination.date_administration) {
      return;
    }

    if (!patient?.id) {
      // Si pas de patient, ajouter juste en local
      setVaccinations([...vaccinations, { ...newVaccination }]);
      setNewVaccination({
        vaccine_id: '',
        vaccine_name: '',
        dose_ordre: 1,
        date_administration: new Date().toISOString().split('T')[0],
        statut: 'valide',
      });
      return;
    }

    // Sauvegarder dans la base de données
    try {
      const vaccine = availableVaccines.find(v => v.id === newVaccination.vaccine_id);
      if (!vaccine) return;

      const savedVaccination = await VaccinationService.recordDose({
        patient_id: patient.id,
        vaccine_id: newVaccination.vaccine_id,
        schedule_id: null,
        dose_ordre: newVaccination.dose_ordre,
        date_administration: newVaccination.date_administration,
        lieu: newVaccination.lieu || undefined,
        numero_lot: newVaccination.numero_lot || undefined,
        vaccinateur: newVaccination.vaccinateur || undefined,
        statut: newVaccination.statut,
      } as any);

      // Calculer la date de rappel si nécessaire
      let dateRappel: string | undefined;
      if (vaccine.rappel_necessaire && vaccine.rappel_intervalle_jours) {
        const rappelDate = new Date(newVaccination.date_administration);
        rappelDate.setDate(rappelDate.getDate() + vaccine.rappel_intervalle_jours);
        dateRappel = rappelDate.toISOString().split('T')[0];
      }

      setVaccinations([...vaccinations, {
        id: savedVaccination.id,
        ...newVaccination,
        date_rappel: dateRappel,
      }]);

      setNewVaccination({
        vaccine_id: '',
        vaccine_name: '',
        dose_ordre: 1,
        date_administration: new Date().toISOString().split('T')[0],
        statut: 'valide',
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la vaccination:', error);
      // En cas d'erreur, ajouter quand même en local
      setVaccinations([...vaccinations, { ...newVaccination }]);
    }
  };

  const handleRemoveVaccination = async (index: number) => {
    const vaccination = vaccinations[index];
    if (vaccination.id && patient?.id) {
      try {
        await VaccinationService.cancelDose(vaccination.id);
      } catch (error) {
        console.error('Erreur lors de la suppression de la vaccination:', error);
      }
    }
    setVaccinations(vaccinations.filter((_, i) => i !== index));
  };

  const handleVaccineChange = (vaccineId: string) => {
    const vaccine = availableVaccines.find(v => v.id === vaccineId);
    setNewVaccination({
      ...newVaccination,
      vaccine_id: vaccineId,
      vaccine_name: vaccine?.libelle || '',
    });
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Anamnèse Détaillée</Typography>
            <Box display="flex" gap={1}>
              {onSave && (
                <Button variant="contained" startIcon={<Save />} onClick={onSave}>
                  Enregistrer
                </Button>
              )}
            </Box>
          </Box>

          {/* Alertes pour données obligatoires */}
          {isFemaleInChildbearingAge && !grossessePossible && (
            <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
              Patient en âge de procréer : Veuillez vérifier la possibilité de grossesse.
            </Alert>
          )}

          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Histoire de la Maladie" icon={<LocalHospital />} iconPosition="start" />
            <Tab label="Habitudes de Vie" icon={<SmokingRooms />} iconPosition="start" />
            <Tab label="Vaccinations" icon={<Vaccines />} iconPosition="start" />
          </Tabs>

          {/* Onglet Histoire de la Maladie */}
          <TabPanel value={activeTab} index={0}>
            <TextField
              fullWidth
              multiline
              rows={8}
              label="Histoire de la Maladie Actuelle (HMA) *"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Décrivez l'historique du motif, les symptômes, le contexte, la chronologie..."
              required
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: renderDictationButton('hma'),
              }}
            />

            <Divider sx={{ my: 3 }} />

            {/* Section fusionnée pour les signes cliniques */}
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom>
                Symptômes et Signes Cliniques (Associés)
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Ajoutez ici tous les symptômes et signes cliniques observés ou rapportés.
              </Typography>
              
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Ajouter un symptôme ou signe clinique..."
                  value={newSigne}
                  onChange={(e) => setNewSigne(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSigne();
                    }
                  }}
                  InputProps={{
                    endAdornment: renderDictationButton('newSigne'),
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddSigne}
                  startIcon={<Add />}
                >
                  Ajouter
                </Button>
              </Box>
              
              <Box display="flex" flexWrap="wrap" gap={1}>
                {signesCliniques.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Aucun signe ajouté.
                  </Typography>
                ) : (
                  signesCliniques.map((signe) => (
                    <Chip
                      key={signe.id}
                      label={signe.description}
                      color="primary"
                      variant="outlined"
                      onDelete={() => handleRemoveSigne(signe.id)}
                    />
                  ))
                )}
              </Box>
            </Paper>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Traitements Antérieurs
                </Typography>
                <Box display="flex" gap={1} mb={1}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Ajouter un traitement..."
                    value={newTraitement}
                    onChange={(e) => setNewTraitement(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTraitement();
                      }
                    }}
                    InputProps={{
                      endAdornment: renderDictationButton('newTraitement'),
                    }}
                  />
                  <Button size="small" variant="outlined" onClick={handleAddTraitement}>
                    <Add />
                  </Button>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {traitementsAnterieurs.map((traitement, index) => (
                    <Chip
                      key={index}
                      label={traitement}
                      onDelete={() => handleRemoveTraitement(index)}
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Bilans Réalisés
                </Typography>
                <Box display="flex" gap={1} mb={1}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Ajouter un bilan..."
                    value={newBilan}
                    onChange={(e) => setNewBilan(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddBilan();
                      }
                    }}
                    InputProps={{
                      endAdornment: renderDictationButton('newBilan'),
                    }}
                  />
                  <Button size="small" variant="outlined" onClick={handleAddBilan}>
                    <Add />
                  </Button>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {bilans.map((bilan, index) => (
                    <Chip
                      key={index}
                      label={bilan}
                      onDelete={() => handleRemoveBilan(index)}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" gutterBottom>
              Évolution
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={evolution}
              onChange={(e) => setEvolution(e.target.value)}
              placeholder="Décrivez l'évolution de la pathologie..."
              InputProps={{
                endAdornment: renderDictationButton('evolution'),
              }}
            />

            {/* Checkbox grossesse si femme en âge de procréer */}
            {isFemaleInChildbearingAge && (
              <Box sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={grossessePossible}
                      onChange={(e) => setGrossessePossible(e.target.checked)}
                    />
                  }
                  label="Grossesse possible ou en cours"
                />
                {grossessePossible && (
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={grossesseDetails}
                    onChange={(e) => setGrossesseDetails(e.target.value)}
                    placeholder="Détails sur la grossesse (semaine d'aménorrhée, complications...)"
                    sx={{ mt: 1 }}
                    InputProps={{
                      endAdornment: renderDictationButton('grossesseDetails'),
                    }}
                  />
                )}
              </Box>
            )}
          </TabPanel>

          {/* Onglet Habitudes de Vie */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <SmokingRooms color="primary" />
                    <Typography variant="subtitle1">Tabac</Typography>
                  </Box>
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={tabac}
                      onChange={(e) => setTabac(e.target.value as any)}
                    >
                      <FormControlLabel value="non" control={<Radio />} label="Non fumeur" />
                      <FormControlLabel value="ancien" control={<Radio />} label="Ancien fumeur" />
                      <FormControlLabel value="actuel" control={<Radio />} label="Fumeur actuel" />
                    </RadioGroup>
                  </FormControl>
                  {(tabac === 'ancien' || tabac === 'actuel') && (
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={tabacDetails}
                      onChange={(e) => setTabacDetails(e.target.value)}
                      placeholder="Détails (paquets/année, durée, arrêt depuis...)"
                      sx={{ mt: 2 }}
                      InputProps={{
                        endAdornment: renderDictationButton('tabacDetails'),
                      }}
                    />
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Restaurant color="primary" />
                    <Typography variant="subtitle1">Alcool</Typography>
                  </Box>
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={alcool}
                      onChange={(e) => setAlcool(e.target.value as any)}
                    >
                      <FormControlLabel value="non" control={<Radio />} label="Non consommateur" />
                      <FormControlLabel value="occasionnel" control={<Radio />} label="Occasionnel" />
                      <FormControlLabel value="regulier" control={<Radio />} label="Régulier" />
                    </RadioGroup>
                  </FormControl>
                  {alcool !== 'non' && (
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={alcoolDetails}
                      onChange={(e) => setAlcoolDetails(e.target.value)}
                      placeholder="Détails (fréquence, quantité...)"
                      sx={{ mt: 2 }}
                      InputProps={{
                        endAdornment: renderDictationButton('alcoolDetails'),
                      }}
                    />
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Restaurant color="primary" />
                    <Typography variant="subtitle1">Nutrition</Typography>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={nutrition}
                    onChange={(e) => setNutrition(e.target.value)}
                    placeholder="Régime alimentaire, restrictions, habitudes nutritionnelles..."
                    InputProps={{
                      endAdornment: renderDictationButton('nutrition'),
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Onglet Vaccinations */}
          <TabPanel value={activeTab} index={2}>
            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                Vaccinations
              </Typography>

              {/* Formulaire d'ajout */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Vaccin</InputLabel>
                      <Select
                        value={newVaccination.vaccine_id}
                        label="Vaccin"
                        onChange={(e) => handleVaccineChange(e.target.value)}
                        disabled={loadingVaccines}
                      >
                        {availableVaccines.map((vaccine) => (
                          <MenuItem key={vaccine.id} value={vaccine.id}>
                            {vaccine.libelle}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Dose"
                      value={newVaccination.dose_ordre}
                      onChange={(e) => setNewVaccination({
                        ...newVaccination,
                        dose_ordre: parseInt(e.target.value) || 1,
                      })}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Date"
                      value={newVaccination.date_administration}
                      onChange={(e) => setNewVaccination({
                        ...newVaccination,
                        date_administration: e.target.value,
                      })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Rappel"
                      value={newVaccination.date_rappel || ''}
                      onChange={(e) => setNewVaccination({
                        ...newVaccination,
                        date_rappel: e.target.value || undefined,
                      })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Statut</InputLabel>
                      <Select
                        value={newVaccination.statut}
                        label="Statut"
                        onChange={(e) => setNewVaccination({
                          ...newVaccination,
                          statut: e.target.value as 'valide' | 'annule',
                        })}
                      >
                        <MenuItem value="valide">Valide</MenuItem>
                        <MenuItem value="annule">Annulé</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <Button
                      variant="contained"
                      onClick={handleAddVaccination}
                      startIcon={<Add />}
                      fullWidth
                      disabled={!newVaccination.vaccine_id || !newVaccination.date_administration}
                    >
                      Ajouter
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Tableau des vaccinations */}
              {vaccinations.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Aucune vaccination enregistrée. Ajoutez les vaccinations du patient.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Vaccin</strong></TableCell>
                        <TableCell align="center"><strong>Dose</strong></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Rappel</strong></TableCell>
                        <TableCell align="center"><strong>Statut</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vaccinations.map((vaccination, index) => (
                        <TableRow key={vaccination.id || index} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Vaccines fontSize="small" color="primary" />
                              {vaccination.vaccine_name}
                            </Box>
                          </TableCell>
                          <TableCell align="center">{vaccination.dose_ordre}</TableCell>
                          <TableCell>
                            {new Date(vaccination.date_administration).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            {vaccination.date_rappel
                              ? new Date(vaccination.date_rappel).toLocaleDateString('fr-FR')
                              : '-'}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={vaccination.statut === 'valide' ? 'Valide' : 'Annulé'}
                              size="small"
                              color={vaccination.statut === 'valide' ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveVaccination(index)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};
