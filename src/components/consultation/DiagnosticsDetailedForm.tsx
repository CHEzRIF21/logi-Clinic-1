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
  Autocomplete,
  Divider,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Science,
  CheckCircle,
  Help,
  Cancel,
  Edit,
  Info,
  Mic,
  MicOff,
  Stop,
} from '@mui/icons-material';
import { DiagnosticsService, DiagnosticCIM10 } from '../../services/diagnosticsService';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface DiagnosticDetail {
  id?: string;
  code_cim10?: string;
  libelle: string;
  type: 'probable' | 'differentiel' | 'confirme';
  certainty?: 'probable' | 'suspecte' | 'confirme';
  justification?: string;
}

interface DiagnosticsDetailedFormProps {
  diagnosticsProbables: string[];
  diagnosticsDifferentiels: string[];
  testsComplementaires: string[];
  onDiagnosticsProbablesChange: (diagnostics: string[]) => void;
  onDiagnosticsDifferentielsChange: (diagnostics: string[]) => void;
  onTestsComplementairesChange: (tests: string[]) => void;
  onSave: () => void;
}

export const DiagnosticsDetailedForm: React.FC<DiagnosticsDetailedFormProps> = ({
  diagnosticsProbables,
  diagnosticsDifferentiels,
  testsComplementaires,
  onDiagnosticsProbablesChange,
  onDiagnosticsDifferentielsChange,
  onTestsComplementairesChange,
  onSave,
}) => {
  const [diagnosticsProbablesDetails, setDiagnosticsProbablesDetails] = useState<DiagnosticDetail[]>([]);
  const [diagnosticsDifferentielsDetails, setDiagnosticsDifferentielsDetails] = useState<DiagnosticDetail[]>([]);
  const [newDiagnosticProbable, setNewDiagnosticProbable] = useState('');
  const [newDiagnosticDifferentiel, setNewDiagnosticDifferentiel] = useState('');
  const [newTestComplementaire, setNewTestComplementaire] = useState('');
  const [cim10Options, setCim10Options] = useState<DiagnosticCIM10[]>([]);
  const [cim10Loading, setCim10Loading] = useState(false);
  const [justificationDialogOpen, setJustificationDialogOpen] = useState(false);
  const [editingDiagnostic, setEditingDiagnostic] = useState<DiagnosticDetail | null>(null);
  const [justificationText, setJustificationText] = useState('');
  const [certainty, setCertainty] = useState<'probable' | 'suspecte' | 'confirme'>('probable');
  const [analyseSynthetique, setAnalyseSynthetique] = useState('');

  // Voice recognition
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();
  const [activeField, setActiveField] = useState<string | null>(null);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && activeField) {
      switch (activeField) {
        case 'newDiagnosticProbable':
          setNewDiagnosticProbable(transcript);
          searchCIM10(transcript);
          break;
        case 'newDiagnosticDifferentiel':
          setNewDiagnosticDifferentiel(transcript);
          searchCIM10(transcript);
          break;
        case 'newTestComplementaire':
          setNewTestComplementaire(transcript);
          break;
        case 'analyseSynthetique':
          const updatedAnalyse = analyseSynthetique ? `${analyseSynthetique} ${transcript}` : transcript;
          setAnalyseSynthetique(updatedAnalyse);
          break;
        case 'justificationText':
          const updatedJustification = justificationText ? `${justificationText} ${transcript}` : transcript;
          setJustificationText(updatedJustification);
          break;
      }
      resetTranscript();
    }
  }, [transcript, activeField, analyseSynthetique, justificationText, resetTranscript]);

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

  useEffect(() => {
    // Charger les diagnostics favoris au démarrage
    loadFavoris();
  }, []);

  const loadFavoris = async () => {
    try {
      const favoris = await DiagnosticsService.getFavoris();
      setCim10Options(favoris);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    }
  };

  const searchCIM10 = async (query: string) => {
    if (query.length < 2) {
      setCim10Options([]);
      return;
    }

    setCim10Loading(true);
    try {
      const results = await DiagnosticsService.searchDiagnostics(query);
      setCim10Options(results);
    } catch (error) {
      console.error('Erreur lors de la recherche CIM-10:', error);
    } finally {
      setCim10Loading(false);
    }
  };

  const handleAddDiagnosticProbable = (diagnostic?: DiagnosticCIM10) => {
    if (diagnostic) {
      const newDiag: DiagnosticDetail = {
        code_cim10: diagnostic.code,
        libelle: diagnostic.libelle,
        type: 'probable',
        certainty: 'probable',
      };
      setDiagnosticsProbablesDetails([...diagnosticsProbablesDetails, newDiag]);
      onDiagnosticsProbablesChange([...diagnosticsProbables, `${diagnostic.code} - ${diagnostic.libelle}`]);
      setNewDiagnosticProbable('');
    } else if (newDiagnosticProbable.trim()) {
      const newDiag: DiagnosticDetail = {
        libelle: newDiagnosticProbable.trim(),
        type: 'probable',
        certainty: 'probable',
      };
      setDiagnosticsProbablesDetails([...diagnosticsProbablesDetails, newDiag]);
      onDiagnosticsProbablesChange([...diagnosticsProbables, newDiagnosticProbable.trim()]);
      setNewDiagnosticProbable('');
    }
  };

  const handleAddDiagnosticDifferentiel = (diagnostic?: DiagnosticCIM10) => {
    if (diagnostic) {
      const newDiag: DiagnosticDetail = {
        code_cim10: diagnostic.code,
        libelle: diagnostic.libelle,
        type: 'differentiel',
        certainty: 'suspecte',
      };
      setDiagnosticsDifferentielsDetails([...diagnosticsDifferentielsDetails, newDiag]);
      onDiagnosticsDifferentielsChange([...diagnosticsDifferentiels, `${diagnostic.code} - ${diagnostic.libelle}`]);
      setNewDiagnosticDifferentiel('');
    } else if (newDiagnosticDifferentiel.trim()) {
      const newDiag: DiagnosticDetail = {
        libelle: newDiagnosticDifferentiel.trim(),
        type: 'differentiel',
        certainty: 'suspecte',
      };
      setDiagnosticsDifferentielsDetails([...diagnosticsDifferentielsDetails, newDiag]);
      onDiagnosticsDifferentielsChange([...diagnosticsDifferentiels, newDiagnosticDifferentiel.trim()]);
      setNewDiagnosticDifferentiel('');
    }
  };

  const handleEditJustification = (diagnostic: DiagnosticDetail, type: 'probable' | 'differentiel') => {
    setEditingDiagnostic(diagnostic);
    setJustificationText(diagnostic.justification || '');
    setCertainty(diagnostic.certainty || 'probable');
    setJustificationDialogOpen(true);
  };

  const handleSaveJustification = () => {
    if (!editingDiagnostic) return;

    const updated: DiagnosticDetail = {
      ...editingDiagnostic,
      justification: justificationText,
      certainty: certainty,
    };

    if (editingDiagnostic.type === 'probable') {
      const index = diagnosticsProbablesDetails.findIndex(d => d.libelle === editingDiagnostic.libelle);
      if (index !== -1) {
        const updatedList = [...diagnosticsProbablesDetails];
        updatedList[index] = updated;
        setDiagnosticsProbablesDetails(updatedList);
      }
    } else {
      const index = diagnosticsDifferentielsDetails.findIndex(d => d.libelle === editingDiagnostic.libelle);
      if (index !== -1) {
        const updatedList = [...diagnosticsDifferentielsDetails];
        updatedList[index] = updated;
        setDiagnosticsDifferentielsDetails(updatedList);
      }
    }

    setJustificationDialogOpen(false);
    setEditingDiagnostic(null);
    setJustificationText('');
  };

  const handleRemoveDiagnosticProbable = (index: number) => {
    const updated = [...diagnosticsProbables];
    updated.splice(index, 1);
    onDiagnosticsProbablesChange(updated);
    const updatedDetails = [...diagnosticsProbablesDetails];
    updatedDetails.splice(index, 1);
    setDiagnosticsProbablesDetails(updatedDetails);
  };

  const handleRemoveDiagnosticDifferentiel = (index: number) => {
    const updated = [...diagnosticsDifferentiels];
    updated.splice(index, 1);
    onDiagnosticsDifferentielsChange(updated);
    const updatedDetails = [...diagnosticsDifferentielsDetails];
    updatedDetails.splice(index, 1);
    setDiagnosticsDifferentielsDetails(updatedDetails);
  };

  const handleAddTestComplementaire = () => {
    if (newTestComplementaire.trim()) {
      onTestsComplementairesChange([...testsComplementaires, newTestComplementaire.trim()]);
      setNewTestComplementaire('');
    }
  };

  const handleRemoveTestComplementaire = (index: number) => {
    const updated = [...testsComplementaires];
    updated.splice(index, 1);
    onTestsComplementairesChange(updated);
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Science color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" gutterBottom>
              Diagnostics et Tests Complémentaires
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Diagnostic(s) probable(s), différentiel(s) et tests à demander
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Diagnostics Probables */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Diagnostic(s) Probable(s) *
            </Typography>
            <Autocomplete
              freeSolo
              options={cim10Options}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return `${option.code} - ${option.libelle}`;
              }}
              loading={cim10Loading}
              onInputChange={(_, value) => {
                setNewDiagnosticProbable(value);
                searchCIM10(value);
              }}
              onChange={(_, value) => {
                if (value && typeof value !== 'string') {
                  handleAddDiagnosticProbable(value);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder="Rechercher par code CIM-10 ou libellé..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {cim10Loading ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                        {renderDictationButton('newDiagnosticProbable')}
                      </>
                    ),
                  }}
                />
              )}
              sx={{ mb: 1 }}
            />
            <Box display="flex" gap={1} mb={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ou saisir manuellement..."
                value={newDiagnosticProbable}
                onChange={(e) => setNewDiagnosticProbable(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddDiagnosticProbable();
                  }
                }}
                InputProps={{
                  endAdornment: renderDictationButton('newDiagnosticProbable'),
                }}
              />
              <Button
                variant="outlined"
                onClick={() => handleAddDiagnosticProbable()}
                startIcon={<Add />}
              >
                Ajouter
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
              {diagnosticsProbablesDetails.map((diag, index) => (
                <Chip
                  key={index}
                  label={
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {diag.code_cim10 && (
                        <Typography variant="caption" fontWeight="bold">
                          {diag.code_cim10}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        {diag.libelle}
                      </Typography>
                      {diag.certainty === 'confirme' && <CheckCircle fontSize="small" color="success" />}
                      {diag.certainty === 'suspecte' && <Help fontSize="small" color="warning" />}
                    </Box>
                  }
                  onDelete={() => handleRemoveDiagnosticProbable(index)}
                  color={diag.certainty === 'confirme' ? 'success' : 'primary'}
                  icon={
                    <Tooltip title={diag.justification || 'Cliquer pour ajouter une justification'}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditJustification(diag, 'probable')}
                      >
                        {diag.justification ? <Info color="primary" /> : <Edit fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  }
                />
              ))}
            </Box>
          </Grid>

          {/* Diagnostics Différentiels */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom color="warning.main">
              Diagnostic(s) Différentiel(s)
            </Typography>
            <Autocomplete
              freeSolo
              options={cim10Options}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return `${option.code} - ${option.libelle}`;
              }}
              loading={cim10Loading}
              onInputChange={(_, value) => {
                setNewDiagnosticDifferentiel(value);
                searchCIM10(value);
              }}
              onChange={(_, value) => {
                if (value && typeof value !== 'string') {
                  handleAddDiagnosticDifferentiel(value);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder="Rechercher par code CIM-10 ou libellé..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {cim10Loading ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                        {renderDictationButton('newDiagnosticDifferentiel')}
                      </>
                    ),
                  }}
                />
              )}
              sx={{ mb: 1 }}
            />
            <Box display="flex" gap={1} mb={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ou saisir manuellement..."
                value={newDiagnosticDifferentiel}
                onChange={(e) => setNewDiagnosticDifferentiel(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddDiagnosticDifferentiel();
                  }
                }}
                InputProps={{
                  endAdornment: renderDictationButton('newDiagnosticDifferentiel'),
                }}
              />
              <Button
                variant="outlined"
                onClick={() => handleAddDiagnosticDifferentiel()}
                startIcon={<Add />}
              >
                Ajouter
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
              {diagnosticsDifferentielsDetails.map((diag, index) => (
                <Chip
                  key={index}
                  label={
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {diag.code_cim10 && (
                        <Typography variant="caption" fontWeight="bold">
                          {diag.code_cim10}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        {diag.libelle}
                      </Typography>
                    </Box>
                  }
                  onDelete={() => handleRemoveDiagnosticDifferentiel(index)}
                  color="warning"
                  icon={
                    <Tooltip title={diag.justification || 'Cliquer pour ajouter une justification'}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditJustification(diag, 'differentiel')}
                      >
                        {diag.justification ? <Info color="primary" /> : <Edit fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  }
                />
              ))}
            </Box>
          </Grid>

          {/* Tests Complémentaires */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Tests Complémentaires à Demander
            </Typography>
            <Box display="flex" gap={1} mb={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ex: NFS, Glycémie, Radiographie thorax..."
                value={newTestComplementaire}
                onChange={(e) => setNewTestComplementaire(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTestComplementaire();
                  }
                }}
                InputProps={{
                  endAdornment: renderDictationButton('newTestComplementaire'),
                }}
              />
              <Button
                variant="outlined"
                onClick={handleAddTestComplementaire}
                startIcon={<Add />}
              >
                Ajouter
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
              {testsComplementaires.map((test, index) => (
                <Chip
                  key={index}
                  label={test}
                  onDelete={() => handleRemoveTestComplementaire(index)}
                  color="info"
                  />
              ))}
            </Box>
          </Grid>

          {/* Analyse Synthétique */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Analyse Synthétique du Cas
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={analyseSynthetique}
              onChange={(e) => setAnalyseSynthetique(e.target.value)}
              placeholder="Synthèse clinique, raisonnement diagnostique, éléments clés..."
              helperText="Résumé analytique permettant de comprendre le raisonnement diagnostique"
              InputProps={{
                endAdornment: renderDictationButton('analyseSynthetique'),
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box display="flex" justifyContent="flex-end">
          <Button variant="contained" onClick={onSave}>
            Enregistrer
          </Button>
        </Box>
      </CardContent>

      {/* Dialog pour justification */}
      <Dialog open={justificationDialogOpen} onClose={() => setJustificationDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Justification Clinique du Diagnostic
          {editingDiagnostic && editingDiagnostic.code_cim10 && (
            <Typography variant="caption" display="block" color="text.secondary">
              Code CIM-10: {editingDiagnostic.code_cim10}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Certitude du Diagnostic</InputLabel>
                <Select
                  value={certainty}
                  onChange={(e) => setCertainty(e.target.value as any)}
                  label="Certitude du Diagnostic"
                >
                  <MenuItem value="probable">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Help color="info" />
                      Probable
                    </Box>
                  </MenuItem>
                  <MenuItem value="suspecte">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Cancel color="warning" />
                      Suspecté
                    </Box>
                  </MenuItem>
                  <MenuItem value="confirme">
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircle color="success" />
                      Confirmé
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Justification Clinique"
                value={justificationText}
                onChange={(e) => setJustificationText(e.target.value)}
                placeholder="Décrivez les éléments cliniques qui justifient ce diagnostic..."
                helperText="Symptômes, signes cliniques, résultats d'examens, éléments du contexte..."
                InputProps={{
                  endAdornment: renderDictationButton('justificationText'),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJustificationDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveJustification}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
