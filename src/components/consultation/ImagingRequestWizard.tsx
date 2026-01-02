import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Image,
  CheckCircle,
  ArrowForward,
  ArrowBack,
} from '@mui/icons-material';
import { ImagingRequest } from '../../services/consultationApiService';
import ExamCatalogService, { ExamCatalogEntry } from '../../services/examCatalogService';
import Autocomplete from '@mui/material/Autocomplete';
import { SpeechTextField } from '../common/SpeechTextField';

interface ImagingRequestWizardProps {
  open: boolean;
  onClose: () => void;
  onSave: (request: Partial<ImagingRequest>) => Promise<void>;
  consultationId: string;
  patientId: string;
}

const IMAGING_EXAMS_FALLBACK = [
  'Radiographie thorax',
  'Radiographie abdomen',
  'Radiographie membres',
  'Échographie abdominale',
  'Échographie pelvienne',
  'Échographie obstétricale',
  'Échographie cardiaque',
  'Scanner (TDM)',
  'IRM',
  'Mammographie',
  'Densitométrie osseuse',
  'Autre',
];

export const ImagingRequestWizard: React.FC<ImagingRequestWizardProps> = ({
  open,
  onClose,
  onSave,
  consultationId,
  patientId,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [type, setType] = useState<'INTERNE' | 'EXTERNE'>('INTERNE');
  const [clinicalInfo, setClinicalInfo] = useState('');
  const [examCatalog, setExamCatalog] = useState<ExamCatalogEntry[]>([]);
  const fallbackImagingEntries = useMemo<ExamCatalogEntry[]>(
    () =>
      IMAGING_EXAMS_FALLBACK.map((label, index) => ({
        id: `fallback-imaging-${index}`,
        code: `IMG-FB-${index}`,
        nom: label,
        categorie: 'Imagerie',
        module_cible: 'IMAGERIE',
        type_acte: 'examen',
        tarif_base: 0,
        unite: 'examen',
        facturable: false,
        actif: true,
        created_at: '1970-01-01T00:00:00.000Z',
        updated_at: '1970-01-01T00:00:00.000Z',
      })),
    []
  );
  const availableImagingExams = examCatalog.length > 0 ? examCatalog : fallbackImagingEntries;
  const [selectedExams, setSelectedExams] = useState<ExamCatalogEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [facturable, setFacturable] = useState(false);
  const totalEstimate = selectedExams.reduce((sum, exam) => sum + (exam.tarif_base || 0), 0);

  useEffect(() => {
    loadExamCatalog();
  }, []);

  const loadExamCatalog = async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const data = await ExamCatalogService.list({ module: 'IMAGERIE', actif: true });
      setExamCatalog(data);
    } catch (err) {
      console.error('Erreur lors du chargement du catalogue imagerie:', err);
      setCatalogError('Impossible de charger le catalogue, utilisation de la liste par défaut.');
    } finally {
      setCatalogLoading(false);
    }
  };

  const steps = ['Type et contexte clinique', 'Sélection des examens'];

  const handleNext = () => {
    if (activeStep === 0 && !clinicalInfo.trim()) {
      return; // Validation: contexte clinique obligatoire
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSave = async () => {
    if (selectedExams.length === 0) {
      return; // Validation: au moins un examen requis
    }

    const examensPayload = selectedExams.map((exam) => ({
      code: exam.code,
      nom: exam.nom,
      categorie: exam.categorie,
      module: exam.module_cible,
      tarif_base: exam.tarif_base,
    }));

    await onSave({
      consultation_id: consultationId,
      patient_id: patientId,
      type,
      clinical_info: clinicalInfo,
      examens: examensPayload,
      facturable,
    });

    handleClose();
  };

  const handleClose = () => {
    setActiveStep(0);
    setType('INTERNE');
    setClinicalInfo('');
    setSelectedExams([]);
    setFacturable(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold" mb={2}>
              Étape 1 : Type de demande et contexte clinique
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Type de demande</InputLabel>
              <Select value={type} onChange={(e) => setType(e.target.value as any)} label="Type de demande">
                <MenuItem value="INTERNE">Interne (imagerie de la clinique)</MenuItem>
                <MenuItem value="EXTERNE">Externe (centre d'imagerie externe)</MenuItem>
              </Select>
            </FormControl>

            <SpeechTextField
              fullWidth
              multiline
              rows={6}
              label="Renseignement clinique *"
              value={clinicalInfo}
              onChange={setClinicalInfo}
              placeholder="Décrire le contexte clinique, les symptômes, les antécédents pertinents..."
              required
              helperText="Ce champ est obligatoire pour toute demande d'imagerie"
              enableSpeech={true}
              language="fr-FR"
            />

            {!clinicalInfo.trim() && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Le renseignement clinique est obligatoire
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold" mb={2}>
              Étape 2 : Sélection des examens d'imagerie
            </Typography>

            {catalogLoading && examCatalog.length === 0 && <LinearProgress sx={{ mb: 2 }} />}
            {catalogError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {catalogError}
              </Alert>
            )}

            <Autocomplete
              multiple
              disableCloseOnSelect
              options={availableImagingExams}
              value={selectedExams}
              groupBy={(option) => option.categorie || 'Autres'}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => `${option.nom} (${option.code})`}
              onChange={(_, value) => setSelectedExams(value)}
              loading={catalogLoading}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox
                    sx={{ mr: 1 }}
                    checked={selected}
                    tabIndex={-1}
                    disableRipple
                  />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {option.nom}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.code} ·{' '}
                      {option.tarif_base
                        ? `${option.tarif_base.toLocaleString()} FCFA`
                        : 'Tarif non défini'}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sélectionner les examens"
                  placeholder="Rechercher un examen"
                  helperText="Choisissez un ou plusieurs examens dans le catalogue"
                />
              )}
            />

            {selectedExams.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Veuillez sélectionner au moins un examen
              </Alert>
            )}

            <Box mt={2} display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {selectedExams.length} examen(s) sélectionné(s)
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                Total estimé: {totalEstimate.toLocaleString()} FCFA
              </Typography>
            </Box>

            <Box mt={3}>
              <FormControlLabel
                control={
                  <Checkbox checked={facturable} onChange={(e) => setFacturable(e.target.checked)} />
                }
                label="Créer une opération facturable pour ces examens"
              />
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={(event, reason) => {
        // Empêcher la fermeture par clic en dehors ou ESC
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
        handleClose();
      }}
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Image />
          <Typography variant="h6">Demande d'Examen d'Imagerie</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Annuler</Button>
        {activeStep > 0 && (
          <Button startIcon={<ArrowBack />} onClick={handleBack}>
            Retour
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext}>
            Suivant
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={selectedExams.length === 0}
            startIcon={<CheckCircle />}
          >
            Créer la demande
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

