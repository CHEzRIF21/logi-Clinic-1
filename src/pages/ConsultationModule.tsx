import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  Alert,
  Snackbar,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  MedicalServices,
  Close,
} from '@mui/icons-material';
import { Patient } from '../services/supabase';
import { Consultation, ConsultationService } from '../services/consultationService';
import { ConsultationStartDialog } from '../components/consultation/ConsultationStartDialog';
import { ConsultationWorkflow } from '../components/consultation/ConsultationWorkflow';
import PatientSelector from '../components/shared/PatientSelector';
import { PatientService } from '../services/patientService';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const ConsultationModule: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [openPatientSelector, setOpenPatientSelector] = useState(false);
  const [openStartDialog, setOpenStartDialog] = useState(false);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Charger l'ID utilisateur au montage
  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // Si on a auth_user_id, chercher l'ID dans la table users
        if (user.auth_user_id) {
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.auth_user_id)
            .single();
          if (data) {
            setUserId(data.id);
            return;
          }
        }
        if (user.id) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('Erreur chargement userId:', error);
      }
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setOpenPatientSelector(false);
    // Ouvrir automatiquement le dialog de démarrage
    setOpenStartDialog(true);
  };

  const handleStartConsultation = async (templateId: string, type: string) => {
    if (!selectedPatient) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un patient',
        severity: 'error'
      });
      return;
    }

    if (!userId) {
      setSnackbar({
        open: true,
        message: 'Utilisateur non connecté',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {

      // Créer la consultation dans Supabase
      const consultation = await ConsultationService.createConsultation(
        selectedPatient.id,
        userId
      );

      // Mettre à jour avec le type si fourni
      if (type) {
        await ConsultationService.updateConsultation(
          consultation.id,
          { categorie_motif: type } as any,
          userId,
          'categorie_motif'
        );
      }

      setCurrentConsultation(consultation);
      setOpenStartDialog(false);
      setSnackbar({
        open: true,
        message: 'Consultation créée avec succès',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Erreur lors de la création de la consultation:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erreur lors de la création de la consultation',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (step: number, data: any) => {
    if (!currentConsultation) return;
    
    try {
      const userId = getCurrentUserId();
      // La sauvegarde est déjà gérée dans ConsultationWorkflow
      // Cette fonction peut être utilisée pour des actions supplémentaires
      console.log(`Étape ${step} complétée:`, data);
    } catch (error) {
      console.error('Erreur lors de la complétion de l\'étape:', error);
    }
  };

  const handleCloseConsultation = async () => {
    // Recharger la consultation pour avoir les dernières données
    if (currentConsultation) {
      try {
        const updated = await ConsultationService.getConsultationById(currentConsultation.id);
        if (updated) {
          setCurrentConsultation(updated);
        }
      } catch (error) {
        console.error('Erreur lors du rechargement:', error);
      }
    }

    setCurrentConsultation(null);
    setSelectedPatient(null);
    setSnackbar({
      open: true,
      message: 'Consultation fermée',
      severity: 'info'
    });
  };

  const handleNewConsultation = () => {
    if (currentConsultation && currentConsultation.status !== 'CLOTURE') {
      if (window.confirm('Une consultation est en cours. Voulez-vous vraiment en créer une nouvelle ?')) {
        setCurrentConsultation(null);
        setSelectedPatient(null);
      } else {
        return;
      }
    }
    setOpenPatientSelector(true);
  };

  // Si une consultation est en cours, afficher le workflow
  if (currentConsultation && selectedPatient) {
    return (
      <Box sx={{ height: '100vh', overflow: 'hidden' }}>
        <ConsultationWorkflow
          consultation={currentConsultation}
          patient={selectedPatient}
          onStepComplete={handleStepComplete}
          onClose={handleCloseConsultation}
          userId={userId}
        />
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  // Page d'accueil : sélection du patient
  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MedicalServices sx={{ fontSize: 48, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Module de Consultation
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Workflow complet de consultation médicale en 11 étapes
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={handleNewConsultation}
        >
          Nouvelle Consultation
        </Button>
      </Box>

      {/* Patient sélectionné */}
      {selectedPatient && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography>
              <strong>Patient sélectionné:</strong> {selectedPatient.prenom} {selectedPatient.nom} 
              {' '}({selectedPatient.identifiant})
            </Typography>
            <Button
              size="small"
              onClick={() => {
                setSelectedPatient(null);
                setOpenStartDialog(false);
              }}
              startIcon={<Close />}
            >
              Changer
            </Button>
          </Box>
        </Alert>
      )}

      {/* Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bienvenue dans le module de consultation
        </Typography>
        <Typography variant="body2" component="div">
          <strong>Pour démarrer une consultation :</strong>
          <ol style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>Cliquez sur "Nouvelle Consultation"</li>
            <li>Sélectionnez un patient dans la liste</li>
            <li>Choisissez un type de fiche de consultation (optionnel)</li>
            <li>Suivez le workflow guidé en 11 étapes</li>
          </ol>
        </Typography>
      </Alert>

      {/* Dialog de sélection de patient */}
      <PatientSelector
        open={openPatientSelector}
        onClose={() => setOpenPatientSelector(false)}
        onSelect={handleSelectPatient}
        title="Sélectionner un patient pour la consultation"
        allowCreate={true}
        onCreateNew={() => {
          navigate('/patients?action=create&service=Médecine générale');
        }}
      />

      {/* Dialog de démarrage de consultation */}
      <ConsultationStartDialog
        open={openStartDialog}
        onClose={() => {
          setOpenStartDialog(false);
          if (!currentConsultation) {
            setSelectedPatient(null);
          }
        }}
        onStart={handleStartConsultation}
        patient={selectedPatient}
      />

      {/* Backdrop de chargement */}
      <Backdrop open={loading} sx={{ zIndex: 9999 }}>
        <CircularProgress color="primary" />
      </Backdrop>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConsultationModule;

