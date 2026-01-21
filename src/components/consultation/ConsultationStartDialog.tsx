import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Close,
  LocalHospital,
  Description,
  Add,
  CheckCircle,
} from '@mui/icons-material';
import { ConsultationApiService, ConsultationTemplate } from '../../services/consultationApiService';
import { Patient } from '../../services/supabase';

interface ConsultationStartDialogProps {
  open: boolean;
  onClose: () => void;
  onStart: (templateId: string, type: string) => Promise<void>;
  patient: Patient | null;
}

const SPECIALITE_ICONS: Record<string, React.ReactNode> = {
  'Médecine générale': <LocalHospital />,
  'Gynécologie': <LocalHospital />,
  'Ophtalmologie': <LocalHospital />,
  'Urologie': <LocalHospital />,
  'Dermatologie': <LocalHospital />,
  'Pédiatrie': <LocalHospital />,
};

// Liste complète des spécialités médicales
const SPECIALITES_MEDICALES = [
  'Cardiologie',
  'Pneumologie',
  'Gastro-entérologie / Hépatologie',
  'Néphrologie',
  'Endocrinologie / Diabétologie',
  'Rhumatologie',
  'Hématologie',
  'Oncologie médicale',
  'Neurologie',
  'Dermatologie',
  'Maladies infectieuses',
  'Allergologie',
  'Médecine du sport',
  'Médecine du travail',
  'Pédiatrie',
  'Néonatologie (consultations de suivi)',
  'Gynécologie',
  'Ophtalmologie',
  'Oto-rhino-laryngologie (ORL)',
  'Audiologie',
  'Autres',
];

export const ConsultationStartDialog: React.FC<ConsultationStartDialogProps> = ({
  open,
  onClose,
  onStart,
  patient,
}) => {
  const [templates, setTemplates] = useState<ConsultationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ConsultationTemplate | null>(null);
  const [customType, setCustomType] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterSpecialite, setFilterSpecialite] = useState<string>('all');

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const data = await ConsultationApiService.getTemplates();
      setTemplates(data.filter((t) => t.actif));
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    }
  };

  const handleStart = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConsultationStartDialog.tsx:76',message:'handleStart entry',data:{hasPatient:!!patient,patientId:patient?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    if (!patient) {
      alert('Veuillez sélectionner un patient');
      return;
    }

    // Permettre de démarrer même sans template ni type personnalisé (utilisera un type par défaut)
    setLoading(true);
    try {
      const templateId = selectedTemplate?.id || '';
      const type = selectedTemplate?.specialite || customType.trim() || 'Médecine générale';
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConsultationStartDialog.tsx:86',message:'Before onStart call',data:{templateId,type},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
      await onStart(templateId, type);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConsultationStartDialog.tsx:88',message:'After onStart call - NOT closing dialog yet',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
      // Ne PAS fermer le dialog ici - laisser le parent le fermer après avoir mis à jour le state
      // Le parent fermera le dialog via setOpenStartDialog(false) dans handleStartConsultation
      // Cela évite le race condition où onClose réinitialise selectedPatient avant que React ne mette à jour le state
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConsultationStartDialog.tsx:90',message:'After handleClose',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ConsultationStartDialog.tsx:91',message:'Error in handleStart',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      console.error('Erreur lors du démarrage:', error);
      alert('Erreur lors du démarrage de la consultation');
      // Ne pas fermer le dialog en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setCustomType('');
    setFilterSpecialite('all');
    onClose();
  };

  const filteredTemplates = filterSpecialite === 'all'
    ? templates
    : templates.filter((t) => t.specialite === filterSpecialite);

  // Utiliser la liste complète des spécialités médicales
  const specialites = SPECIALITES_MEDICALES;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      disableEnforceFocus
      disableAutoFocus
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Description color="primary" />
            <Typography variant="h6">Démarrer une Nouvelle Consultation</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" aria-label="Fermer">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {patient && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Patient sélectionné: <strong>{patient.prenom} {patient.nom}</strong> ({patient.identifiant})
          </Alert>
        )}

        <Box mb={3}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Filtrer par spécialité</InputLabel>
            <Select
              value={filterSpecialite}
              onChange={(e) => setFilterSpecialite(e.target.value)}
              label="Filtrer par spécialité"
            >
              <MenuItem value="all">Toutes les spécialités</MenuItem>
              {specialites
                .filter((spec) => spec) // Filtrer les valeurs null/undefined
                .map((spec) => (
                  <MenuItem key={spec} value={spec}>
                    {spec}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle1" gutterBottom>
            Choisissez le type de fiche de consultation :
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedTemplate?.id === template.id ? 2 : 1,
                    borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      {SPECIALITE_ICONS[template.specialite] || <Description />}
                      {selectedTemplate?.id === template.id && (
                        <CheckCircle color="primary" />
                      )}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {template.nom}
                    </Typography>
                    <Chip label={template.specialite} size="small" sx={{ mb: 1 }} />
                    {template.description && (
                      <Typography variant="body2" color="text.secondary">
                        {template.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            Ou saisissez un type personnalisé :
          </Typography>
          <TextField
            fullWidth
            placeholder="Ex: Consultation spécialisée, Suivi post-opératoire..."
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            disabled={!!selectedTemplate}
            helperText="Utilisez ce champ si aucune fiche prédéfinie ne correspond à vos besoins"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleStart}
          disabled={loading}
          startIcon={<Add />}
        >
          {loading ? 'Démarrage...' : 'Démarrer la Consultation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

