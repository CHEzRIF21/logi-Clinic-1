import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Snackbar,
  Button,
} from '@mui/material';
import { User } from '../types/auth';
import { Patient } from '../services/supabase';
import { Consultation } from '../services/consultationService';
import { ConsultationService } from '../services/consultationService';
import { PatientSearchAdvanced } from '../components/consultation/PatientSearchAdvanced';
import { ConsultationWorkflow } from '../components/consultation/ConsultationWorkflow';
import { supabase } from '../services/supabase';
import { MedicalServices } from '@mui/icons-material';

interface ConsultationsCompleteProps {
  user: User | null;
}

/**
 * Page complète de gestion des consultations
 * Module de consultation médicale avec workflow en 11 étapes
 */
export const ConsultationsComplete: React.FC<ConsultationsCompleteProps> = ({ user }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userIdLoading, setUserIdLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Récupérer l'utilisateur authentifié
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (!authError && authUser) {
          setUserId(authUser.id);
          setUserIdLoading(false);
          return;
        }

        // Fallback: récupérer depuis localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (user.id && uuidRegex.test(user.id)) {
              setUserId(user.id);
              setUserIdLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Erreur lors du parsing de userData:', e);
          }
        }

        // UUID temporaire pour développement
        console.warn('Aucun utilisateur authentifié trouvé, utilisation d\'un UUID temporaire');
        setUserId('00000000-0000-0000-0000-000000000001');
        setUserIdLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        setUserId('00000000-0000-0000-0000-000000000001');
        setUserIdLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handlePatientSelect = async (selectedPatient: Patient) => {
    if (!userId || userIdLoading) {
      showSnackbar('Veuillez patienter, chargement de votre session...', 'info');
      return;
    }

    setPatient(selectedPatient);
    setConsultation(null);
    showSnackbar(`Patient sélectionné: ${selectedPatient.prenom} ${selectedPatient.nom}`, 'success');
  };

  const handleCreateConsultation = async () => {
    if (!patient) {
      showSnackbar('Veuillez d\'abord sélectionner un patient', 'error');
      return;
    }

    if (!userId || userIdLoading) {
      showSnackbar('Session utilisateur invalide', 'error');
      return;
    }

    setLoading(true);
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(patient.id)) {
        throw new Error('ID patient invalide.');
      }
      if (!uuidRegex.test(userId)) {
        throw new Error('Session utilisateur invalide.');
      }

      const consultationData = await ConsultationService.createConsultation(
        {
          patient_id: patient.id,
          type: 'Médecine générale',
        },
        userId
      );
      
      if (!consultationData.patient_id) {
        consultationData.patient_id = patient.id;
      }
      
      setConsultation(consultationData);
      showSnackbar('Nouvelle consultation créée', 'success');
    } catch (error: any) {
      console.error('Erreur lors de la création de la consultation:', error);
      showSnackbar(`Erreur: ${error?.message || 'Erreur lors de la création'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (step: number, data: any) => {
    if (!consultation) return;
    
    try {
      // La sauvegarde est gérée par ConsultationWorkflow
      // Ici on peut ajouter des actions supplémentaires si nécessaire
      const updated = await ConsultationService.getConsultationById(consultation.id);
      setConsultation(updated);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la consultation:', error);
    }
  };

  const handleClose = async () => {
    if (!consultation) return;
    
    try {
      // Clôturer la consultation
      await ConsultationService.clotureConsultation(consultation.id, userId);
      const updated = await ConsultationService.getConsultationById(consultation.id);
      setConsultation(updated);
      
      showSnackbar('Consultation clôturée avec succès', 'success');
      
      // Réinitialiser après 2 secondes
      setTimeout(() => {
        setPatient(null);
        setConsultation(null);
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la clôture:', error);
      showSnackbar('Erreur lors de la clôture de la consultation', 'error');
    }
  };

  if (userIdLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Si aucune consultation n'est créée, afficher la sélection de patient
  if (!consultation) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={4}>
            <MedicalServices sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Module Consultations
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Workflow de consultation médicale en 11 étapes
              </Typography>
            </Box>
          </Box>

          {user && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Connecté en tant que : {user.nom} {user.prenom} ({user.role})
            </Alert>
          )}

          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              1. Sélectionner un patient
            </Typography>
            <PatientSearchAdvanced
              onPatientSelect={handlePatientSelect}
              selectedPatient={patient}
            />
          </Box>

          {patient && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Patient sélectionné : {patient.prenom} {patient.nom} (IPP: {patient.identifiant})
              </Alert>
              <Button
                variant="contained"
                size="large"
                onClick={handleCreateConsultation}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <MedicalServices />}
              >
                {loading ? 'Création en cours...' : 'Créer une nouvelle consultation'}
              </Button>
            </Box>
          )}
        </Paper>

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
      </Container>
    );
  }

  // Afficher le workflow de consultation
  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <ConsultationWorkflow
        consultation={consultation}
        patient={patient!}
        onStepComplete={handleStepComplete}
        onClose={handleClose}
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
    </Container>
  );
};

export default ConsultationsComplete;
