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
  Receipt,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PatientService } from '../../services/patientService';
import { ConsultationService } from '../../services/consultationService';
import { ConsultationBillingService } from '../../services/consultationBillingService';
import { ConfigurationService } from '../../services/configurationService';
import { Patient } from '../../services/supabase';
import { supabase } from '../../services/supabase';
import { getMyClinicId } from '../../services/clinicService';
import { SelectionActesFacturables } from './SelectionActesFacturables';
import { Acte, ActesService } from '../../services/actesService';
import PatientSelector from '../shared/PatientSelector';

interface PatientRegistrationWithBillingProps {
  onComplete?: (patientId: string, consultationId: string) => void;
  onCancel?: () => void;
}

const steps = ['Sélection Patient', 'Orientation', 'Actes à Facturer', 'Confirmation'];

export const PatientRegistrationWithBilling: React.FC<PatientRegistrationWithBillingProps> = ({
  onComplete,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [openPatientSelector, setOpenPatientSelector] = useState(false);
  const [serviceConsulte, setServiceConsulte] = useState('');
  const [medecinId, setMedecinId] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medecins, setMedecins] = useState<Array<{ id: string; nom: string; prenom: string }>>([]);
  const [paymentRequired, setPaymentRequired] = useState<boolean>(false);
  const [actesSelectionnes, setActesSelectionnes] = useState<Acte[]>([]);
  const [typeServiceFacture, setTypeServiceFacture] = useState<string>('consultation');
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [factureId, setFactureId] = useState<string | null>(null);

  React.useEffect(() => {
    loadMedecins();
  }, []);

  // Ouvrir automatiquement le sélecteur de patient au démarrage
  React.useEffect(() => {
    if (activeStep === 0 && !selectedPatient) {
      setOpenPatientSelector(true);
    }
  }, [activeStep, selectedPatient]);

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

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setOpenPatientSelector(false);
    setError(null);
    // Ne pas changer d'étape automatiquement, laisser l'utilisateur cliquer sur "Continuer"
  };

  const handleCreateConsultation = async () => {
    if (!selectedPatient) {
      setError('Veuillez sélectionner un patient');
      return;
    }

    if (!serviceConsulte) {
      setError('Veuillez sélectionner un service');
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

      // Déterminer le type de consultation basé sur le service
      let typeConsultationValue: 'generale' | 'specialisee' | 'urgence' = 'generale';
      if (serviceConsulte === 'Urgences') {
        typeConsultationValue = 'urgence';
      } else if (['Maternité', 'Pédiatrie', 'Chirurgie'].includes(serviceConsulte)) {
        typeConsultationValue = 'specialisee';
      }

      // Créer la consultation
      const consultation = await ConsultationService.createConsultation(
        selectedPatient.id,
        userId
      );

      // Mettre à jour avec le type de consultation et autres informations
      const updateData: any = {
        type_consultation: typeConsultationValue,
        service_consulte: serviceConsulte,
      };
      if (medecinId) updateData.medecin_id = medecinId;
      if (isUrgent) updateData.is_urgent = isUrgent;
      
      await ConsultationService.updateConsultation(
        consultation.id,
        updateData,
        userId
      );

      // Stocker l'ID de la consultation pour l'utiliser plus tard
      setConsultationId(consultation.id);

      // Passer à l'étape de sélection des actes
      setActiveStep(2);
    } catch (err: any) {
      console.error('Erreur création consultation:', err);
      setError('Erreur lors de la création de la consultation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoiceAndComplete = async () => {
    if (!selectedPatient || actesSelectionnes.length === 0) {
      setError('Veuillez sélectionner au moins un acte à facturer');
      return;
    }

    if (!consultationId) {
      setError('Consultation non créée. Veuillez revenir en arrière.');
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

      // Vérifier si le paiement est obligatoire
      const isPaymentRequired = await ConfigurationService.isPaymentRequiredBeforeConsultation();
      setPaymentRequired(isPaymentRequired);

      // Toujours créer une facture si des actes sont sélectionnés
      if (actesSelectionnes.length > 0) {
        // Créer un panier d'actes
        const panier = await ActesService.createPanierActes(
          selectedPatient.id,
          actesSelectionnes,
          consultationId
        );

        // Générer la facture depuis le panier avec le type de service sélectionné
        const factureIdGeneree = await ActesService.genererFactureDepuisPanier(
          panier,
          consultationId,
          typeServiceFacture
        );

        if (factureIdGeneree) {
          // Stocker l'ID de la facture pour l'affichage
          setFactureId(factureIdGeneree);
          
          // Mettre à jour la consultation avec la facture initiale si le paiement est obligatoire
          if (isPaymentRequired) {
            await ConsultationService.updateConsultation(
              consultationId,
              {
                facture_initial_id: factureIdGeneree,
                statut_paiement: 'en_attente',
              } as any,
              userId
            );
          }

          setActiveStep(3);
        } else {
          setError('Erreur lors de la création de la facture');
          setLoading(false);
          return;
        }
      } else {
        setActiveStep(3);
      }

      onComplete?.(selectedPatient.id, consultationId);
    } catch (err: any) {
      console.error('Erreur génération facture:', err);
      setError('Erreur lors de la génération de la facture: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setError(null);
    } else {
      onCancel?.();
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Person color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" gutterBottom>
                Consultation avec Facturation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sélectionnez un patient et créez une consultation avec facturation
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

          {/* Étape 1: Sélection Patient */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Sélectionner un Patient
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Veuillez sélectionner le patient concerné pour cette consultation avec facturation.
              </Typography>
              {selectedPatient ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Patient sélectionné : <strong>{selectedPatient.prenom} {selectedPatient.nom}</strong>
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Aucun patient sélectionné. Cliquez sur "Sélectionner un patient" pour continuer.
                </Alert>
              )}
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                  variant="contained"
                  onClick={() => setOpenPatientSelector(true)}
                  startIcon={<Person />}
                >
                  {selectedPatient ? 'Changer de patient' : 'Sélectionner un patient'}
                </Button>
              </Box>
              <Box display="flex" justifyContent="space-between" mt={3}>
                <Button onClick={handleCancel}>Annuler</Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (selectedPatient) {
                      setActiveStep(1);
                      setError(null);
                    } else {
                      setError('Veuillez sélectionner un patient pour continuer');
                      setOpenPatientSelector(true);
                    }
                  }}
                  disabled={!selectedPatient}
                  startIcon={<MedicalServices />}
                >
                  Continuer
                </Button>
              </Box>
            </Box>
          )}

          {/* Étape 2: Orientation */}
          {activeStep === 1 && selectedPatient && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Orientation
              </Typography>

              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Service consulté *</InputLabel>
                  <Select
                    value={serviceConsulte}
                    onChange={(e) => setServiceConsulte(e.target.value)}
                    label="Service consulté *"
                  >
                    <MenuItem value="Consultation">Consultation</MenuItem>
                    <MenuItem value="Maternité">Maternité</MenuItem>
                    <MenuItem value="Pédiatrie">Pédiatrie</MenuItem>
                    <MenuItem value="Laboratoire">Laboratoire</MenuItem>
                    <MenuItem value="Imagerie médicale">Imagerie médicale</MenuItem>
                    <MenuItem value="Urgences">Urgences</MenuItem>
                    <MenuItem value="Chirurgie">Chirurgie</MenuItem>
                    <MenuItem value="Vaccination">Vaccination</MenuItem>
                    <MenuItem value="Soins infirmiers">Soins infirmiers</MenuItem>
                  </Select>
                </FormControl>

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
                <Button 
                  onClick={handleBack}
                  disabled={loading}
                >
                  Retour
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreateConsultation}
                  disabled={loading || !selectedPatient || !serviceConsulte}
                  startIcon={loading ? <CircularProgress size={20} /> : <MedicalServices />}
                >
                  {loading ? 'Création...' : 'Continuer vers les Actes'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Étape 3: Sélection des Actes à Facturer */}
          {activeStep === 2 && selectedPatient && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Actes à Facturer
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Sélectionnez les actes médicaux à inclure dans la facture initiale.
                Les actes par défaut ont été pré-sélectionnés selon le type de consultation.
              </Typography>

              <SelectionActesFacturables
                typeConsultation={serviceConsulte === 'Urgences' ? 'urgence' : serviceConsulte === 'Maternité' || serviceConsulte === 'Pédiatrie' || serviceConsulte === 'Chirurgie' ? 'specialisee' : 'generale'}
                isUrgent={isUrgent || serviceConsulte === 'Urgences'}
                onActesChange={setActesSelectionnes}
                initialActes={actesSelectionnes}
                onServiceTypeChange={setTypeServiceFacture}
                initialServiceType={typeServiceFacture}
              />

              <Box display="flex" justifyContent="space-between" mt={3}>
                <Button 
                  onClick={handleBack}
                  disabled={loading}
                >
                  Retour
                </Button>
                <Button
                  variant="contained"
                  onClick={handleGenerateInvoiceAndComplete}
                  disabled={loading || actesSelectionnes.length === 0 || !consultationId}
                  startIcon={loading ? <CircularProgress size={20} /> : <Receipt />}
                >
                  {loading ? 'Génération...' : 'Générer la Facture et Finaliser'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Étape 4: Confirmation */}
          {activeStep === 3 && (
            <Box textAlign="center">
              <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Facture créée avec succès !
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Les actes ont été enregistrés et une facture a été générée.
                {factureId && (
                  <Box component="span" display="block" sx={{ mt: 1 }}>
                    ID Facture: <strong>{factureId}</strong>
                  </Box>
                )}
                {selectedPatient && (
                  <>
                    <Box component="span" display="block" sx={{ mt: 1 }}>
                      Patient: <strong>{selectedPatient.prenom} {selectedPatient.nom}</strong>
                    </Box>
                    <Box component="span" display="block" sx={{ mt: 1 }}>
                      Service: <strong>{serviceConsulte || 'Non spécifié'}</strong>
                    </Box>
                  </>
                )}
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                Le patient peut maintenant effectuer le paiement à la Caisse.
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
                    // Réinitialiser tout pour recommencer
                    setActiveStep(0);
                    setSelectedPatient(null);
                    setServiceConsulte('');
                    setMedecinId('');
                    setIsUrgent(false);
                    setActesSelectionnes([]);
                    setConsultationId(null);
                    setFactureId(null);
                    setError(null);
                    setOpenPatientSelector(true);
                  }}
                >
                  Nouvelle Consultation
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de sélection de patient */}
      <PatientSelector
        open={openPatientSelector}
        onClose={() => {
          setOpenPatientSelector(false);
          // Ne pas annuler automatiquement, laisser l'utilisateur décider
        }}
        onSelect={handlePatientSelect}
        title="Sélectionner un patient pour la consultation"
        allowCreate={true}
        onCreateNew={() => {
          setOpenPatientSelector(false);
          navigate('/patients?action=create');
        }}
      />
    </Box>
  );
};

