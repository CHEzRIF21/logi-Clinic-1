import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
} from '@mui/material';
import {
  Person,
  MedicalServices,
  Payment,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PatientForm } from './PatientForm';
import { PatientService } from '../../services/patientService';
import { ConsultationService } from '../../services/consultationService';
import { ConsultationBillingService } from '../../services/consultationBillingService';
import { ConfigurationService } from '../../services/configurationService';
import { Patient, PatientFormData } from '../../services/supabase';
import { supabase } from '../../services/supabase';
import { getMyClinicId } from '../../services/clinicService';

interface PatientRegistrationWithBillingProps {
  onComplete?: (patientId: string, consultationId: string) => void;
  onCancel?: () => void;
}

const steps = ['Enregistrement Patient', 'Type Consultation', 'Confirmation'];

export const PatientRegistrationWithBilling: React.FC<PatientRegistrationWithBillingProps> = ({
  onComplete,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [patientData, setPatientData] = useState<PatientFormData | null>(null);
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);
  const [typeConsultation, setTypeConsultation] = useState<'generale' | 'specialisee' | 'urgence'>('generale');
  const [serviceConsulte, setServiceConsulte] = useState('');
  const [medecinId, setMedecinId] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medecins, setMedecins] = useState<Array<{ id: string; nom: string; prenom: string }>>([]);

  React.useEffect(() => {
    loadMedecins();
  }, []);

  const loadMedecins = async () => {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, nom, prenom')
        .eq('clinic_id', clinicId)
        .in('role', ['medecin', 'admin'])
        .eq('actif', true);

      if (!error && data) {
        setMedecins(data);
      }
    } catch (err) {
      console.error('Erreur chargement médecins:', err);
    }
  };

  const handlePatientSubmit = async (data: PatientFormData): Promise<Patient> => {
    try {
      setLoading(true);
      setError(null);

      const patient = await PatientService.createPatient(data);
      setCreatedPatient(patient);
      setPatientData(data);
      setActiveStep(1);
      return patient;
    } catch (err: any) {
      setError('Erreur lors de la création du patient: ' + err.message);
      throw err; // Re-throw to satisfy the Promise<Patient> return type
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConsultation = async () => {
    if (!createdPatient || !medecinId) {
      setError('Patient et médecin sont requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer l'utilisateur actuel
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).id : null;
      if (!userId) {
        throw new Error('Utilisateur non connecté');
      }

      // Créer la consultation
      const consultation = await ConsultationService.createConsultation(
        createdPatient.id,
        userId
      );

      // Mettre à jour avec le type de consultation et autres informations
      const updateData: any = {};
      if (typeConsultation) updateData.type_consultation = typeConsultation;
      if (serviceConsulte) updateData.service_consulte = serviceConsulte;
      if (medecinId) updateData.medecin_id = medecinId;
      
      if (Object.keys(updateData).length > 0) {
        await ConsultationService.updateConsultation(
          consultation.id,
          updateData,
          userId
        );
      }

      // Vérifier si le paiement est obligatoire et créer la facture initiale
      const paymentRequired = await ConfigurationService.isPaymentRequiredBeforeConsultation();
      
      if (paymentRequired) {
        const factureId = await ConsultationBillingService.createInitialInvoice(
          createdPatient.id,
          consultation.id,
          typeConsultation,
          serviceConsulte || undefined,
          isUrgent
        );

        if (factureId) {
          setActiveStep(2);
          // Rediriger vers la caisse après 2 secondes
          setTimeout(() => {
            navigate('/caisse', { 
              state: { 
                consultationId: consultation.id, 
                factureId,
                patientId: createdPatient.id 
              } 
            });
          }, 2000);
        } else {
          setActiveStep(2);
        }
      } else {
        setActiveStep(2);
      }

      onComplete?.(createdPatient.id, consultation.id);
    } catch (err: any) {
      console.error('Erreur création consultation:', err);
      setError('Erreur lors de la création de la consultation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    } else {
      onCancel?.();
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Person color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" gutterBottom>
                Enregistrement Patient avec Consultation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enregistrez un nouveau patient et créez immédiatement une consultation avec facturation
              </Typography>
            </Box>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Étape 1: Enregistrement Patient */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Informations du Patient
              </Typography>
              <PatientForm
                patient={null}
                onSubmit={handlePatientSubmit}
                onCancel={onCancel}
                loading={loading}
              />
            </Box>
          )}

          {/* Étape 2: Type Consultation */}
          {activeStep === 1 && createdPatient && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Type de Consultation
              </Typography>

              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Type de Consultation *</InputLabel>
                  <Select
                    value={typeConsultation}
                    onChange={(e) => setTypeConsultation(e.target.value as any)}
                    label="Type de Consultation *"
                  >
                    <MenuItem value="generale">Consultation Générale</MenuItem>
                    <MenuItem value="specialisee">Consultation Spécialisée</MenuItem>
                    <MenuItem value="urgence">Consultation Urgence</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Service Consulté"
                  value={serviceConsulte}
                  onChange={(e) => setServiceConsulte(e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="Ex: Médecine générale, Cardiologie..."
                />

                <Autocomplete
                  options={medecins}
                  getOptionLabel={(option) => `${option.prenom} ${option.nom}`}
                  value={medecins.find((m) => m.id === medecinId) || null}
                  onChange={(_, value) => setMedecinId(value?.id || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Médecin (optionnel)"
                      placeholder="Sélectionner un médecin"
                    />
                  )}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth>
                  <InputLabel>Urgence</InputLabel>
                  <Select
                    value={isUrgent ? 'oui' : 'non'}
                    onChange={(e) => setIsUrgent(e.target.value === 'oui')}
                    label="Urgence"
                  >
                    <MenuItem value="non">Non</MenuItem>
                    <MenuItem value="oui">Oui</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box display="flex" justifyContent="space-between" mt={3}>
                <Button onClick={handleBack}>Retour</Button>
                <Button
                  variant="contained"
                  onClick={handleCreateConsultation}
                  disabled={loading || !medecinId}
                  startIcon={loading ? <CircularProgress size={20} /> : <MedicalServices />}
                >
                  {loading ? 'Création...' : 'Créer la Consultation'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Étape 3: Confirmation */}
          {activeStep === 2 && (
            <Box textAlign="center">
              <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Consultation Créée avec Succès
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {createdPatient && (
                  <>
                    Patient: <strong>{createdPatient.nom} {createdPatient.prenom}</strong>
                    <br />
                    Type: <strong>{typeConsultation === 'generale' ? 'Consultation Générale' : typeConsultation === 'specialisee' ? 'Consultation Spécialisée' : 'Consultation Urgence'}</strong>
                  </>
                )}
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                Une facture initiale a été générée. Le patient doit effectuer le paiement à la caisse avant d'accéder à la consultation.
              </Alert>

              <Box display="flex" justifyContent="center" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Payment />}
                  onClick={() => navigate('/caisse')}
                >
                  Aller à la Caisse
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setActiveStep(0);
                    setCreatedPatient(null);
                    setPatientData(null);
                  }}
                >
                  Nouveau Patient
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

