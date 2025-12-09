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
} from '@mui/icons-material';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface AnamneseEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => Promise<void>;
  patient?: {
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
  
  // Vaccinations
  const [vaccinations, setVaccinations] = useState<string[]>([]);
  const [newVaccination, setNewVaccination] = useState('');
  
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
          setNewVaccination(transcript.trim());
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

  const handleAddVaccination = () => {
    if (newVaccination.trim()) {
      setVaccinations([...vaccinations, newVaccination.trim()]);
      setNewVaccination('');
    }
  };

  const handleRemoveVaccination = (index: number) => {
    setVaccinations(vaccinations.filter((_, i) => i !== index));
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
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Ex: BCG, DTP, Hépatite B, COVID-19..."
                  value={newVaccination}
                  onChange={(e) => setNewVaccination(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddVaccination();
                    }
                  }}
                  InputProps={{
                    endAdornment: renderDictationButton('newVaccination'),
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddVaccination}
                  startIcon={<Add />}
                >
                  Ajouter
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {vaccinations.map((vaccination, index) => (
                  <Chip
                    key={index}
                    label={vaccination}
                    icon={<Vaccines />}
                    onDelete={() => handleRemoveVaccination(index)}
                    color="primary"
                  />
                ))}
              </Box>
              {vaccinations.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Aucune vaccination enregistrée. Ajoutez les vaccinations du patient.
                </Alert>
              )}
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};
