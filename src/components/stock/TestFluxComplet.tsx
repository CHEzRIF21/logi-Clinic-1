import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { StockService } from '../../services/stockService';
import { supabase } from '../../services/supabase';

const TestFluxComplet: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [testResults, setTestResults] = useState<{[key: string]: 'success' | 'error' | 'pending'}>({});
  const [loading, setLoading] = useState(false);

  const steps = [
    'Réception Médicaments → Magasin Gros',
    'Demande Interne → Responsable Gros',
    'Validation + Transfert → Mise à jour Stocks',
    'Dispensation Patients → Stock Détail décrémenté',
    'Retours/Pertes → Mise à jour avec justification',
    'Rapports & Alertes → Suivi conjoint'
  ];

  const testFluxComplet = async () => {
    setLoading(true);
    setCurrentStep(0);
    setTestResults({});

    try {
      // Créer ou récupérer un médicament de test
      const { data: medicaments, error: medError } = await supabase
        .from('medicaments')
        .select('id')
        .limit(1);
      
      if (medError || !medicaments || medicaments.length === 0) {
        throw new Error('Aucun médicament trouvé dans la base. Veuillez d\'abord créer au moins un médicament.');
      }

      const testMedicamentId = medicaments[0].id;

      // Étape 1: Réception médicaments
      setCurrentStep(1);
      setTestResults(prev => ({ ...prev, reception: 'pending' }));
      
      const receptionResult = await StockService.receptionMedicament({
        medicament_id: testMedicamentId,
        numero_lot: `LOT-TEST-${Date.now()}`,
        quantite_initiale: 100,
        date_reception: new Date().toISOString().split('T')[0],
        date_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        prix_achat: 500,
        fournisseur: 'Fournisseur Test',
        utilisateur_id: 'test-user-auto',
        reference_document: `FAC-TEST-${Date.now()}`,
        observations: 'Test de réception automatique'
      });
      
      setTestResults(prev => ({ ...prev, reception: 'success' }));

      // Étape 2: Demande interne
      setCurrentStep(2);
      setTestResults(prev => ({ ...prev, demande: 'pending' }));
      
      const demandeResult = await StockService.creerDemandeTransfert({
        medicament_id: testMedicamentId,
        lot_id: receptionResult.lot.id,
        quantite_demandee: 50,
        utilisateur_demandeur_id: 'test-user-auto',
        motif: 'Test de demande de transfert',
        observations: 'Test automatique'
      });
      
      setTestResults(prev => ({ ...prev, demande: 'success' }));

      // Étape 3: Validation transfert
      setCurrentStep(3);
      setTestResults(prev => ({ ...prev, validation: 'pending' }));
      
      await StockService.validerTransfert(
        demandeResult.transfert.id,
        'test-validator-auto'
      );
      
      setTestResults(prev => ({ ...prev, validation: 'success' }));

      // Étape 4: Dispensation patient - Récupérer un patient existant
      setCurrentStep(4);
      setTestResults(prev => ({ ...prev, dispensation: 'pending' }));
      
      const { data: patients, error: patError } = await supabase
        .from('patients')
        .select('id')
        .limit(1);
      
      if (!patError && patients && patients.length > 0) {
        // Récupérer le lot créé dans le magasin détail après le transfert
        const { data: lotDetail } = await supabase
          .from('lots')
          .select('id')
          .eq('medicament_id', testMedicamentId)
          .eq('magasin', 'detail')
          .eq('statut', 'actif')
          .gt('quantite_disponible', 0)
          .limit(1);

        if (lotDetail && lotDetail.length > 0) {
          await StockService.dispensationPatient({
            patient_id: patients[0].id,
            type_dispensation: 'patient',
            lignes: [{
              medicament_id: testMedicamentId,
              lot_id: lotDetail[0].id,
              quantite: 10,
              prix_unitaire: 500
            }],
            utilisateur_id: 'test-user-auto',
            observations: 'Test de dispensation'
          });
          
          setTestResults(prev => ({ ...prev, dispensation: 'success' }));
        } else {
          setTestResults(prev => ({ ...prev, dispensation: 'error' }));
          console.warn('Aucun lot disponible dans le magasin détail pour la dispensation');
        }
      } else {
        setTestResults(prev => ({ ...prev, dispensation: 'error' }));
        console.warn('Aucun patient trouvé pour le test de dispensation');
      }

      // Étape 5: Retour/Perte
      setCurrentStep(5);
      setTestResults(prev => ({ ...prev, retour: 'pending' }));
      
      await StockService.enregistrerPerteRetour({
        type: 'retour',
        medicament_id: testMedicamentId,
        lot_id: receptionResult.lot.id,
        quantite: 5,
        motif: 'Test de retour',
        utilisateur_id: 'test-user-auto',
        observations: 'Test automatique de retour'
      });
      
      setTestResults(prev => ({ ...prev, retour: 'success' }));

      // Étape 6: Vérification alertes
      setCurrentStep(6);
      setTestResults(prev => ({ ...prev, alertes: 'pending' }));
      
      await StockService.verifierAlertes(testMedicamentId);
      
      setTestResults(prev => ({ ...prev, alertes: 'success' }));

      setCurrentStep(6);
    } catch (error: any) {
      console.error('Erreur lors du test:', error);
      const stepKeys = ['reception', 'demande', 'validation', 'dispensation', 'retour', 'alertes'];
      const currentKey = stepKeys[currentStep - 1];
      if (currentKey) {
        setTestResults(prev => ({ ...prev, [currentKey]: 'error' }));
      }
      alert(`Erreur à l'étape ${currentStep}: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (stepIndex: number) => {
    const stepKey = steps[stepIndex].toLowerCase().replace(/\s+/g, '_');
    const result = testResults[stepKey];
    
    if (result === 'success') return <CheckCircleIcon color="success" />;
    if (result === 'error') return <ErrorIcon color="error" />;
    if (result === 'pending') return <WarningIcon color="warning" />;
    return null;
  };

  const getStepColor = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'success';
    if (stepIndex === currentStep) return 'primary';
    return 'disabled';
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Test du Flux Complet - Schéma Synthétique
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Ce test vérifie le fonctionnement complet du système selon le schéma synthétique :
              <br />
              <strong>Réception → Demande → Validation → Dispensation → Retours → Alertes</strong>
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Étapes du Flux
                </Typography>
                
                <Stepper activeStep={currentStep} orientation="vertical">
                  {steps.map((label, index) => (
                    <Step key={label} completed={index < currentStep}>
                      <StepLabel
                        icon={getStepIcon(index)}
                        color={getStepColor(index)}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Résultats des Tests
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Object.entries(testResults).map(([key, result]) => (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {result === 'success' && <CheckCircleIcon color="success" />}
                      {result === 'error' && <ErrorIcon color="error" />}
                      {result === 'pending' && <WarningIcon color="warning" />}
                      <Typography variant="body2">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Typography>
                      <Chip
                        label={result}
                        color={result === 'success' ? 'success' : result === 'error' ? 'error' : 'warning'}
                        size="small"
                      />
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlayIcon />}
                  onClick={testFluxComplet}
                  disabled={loading}
                  sx={{ mb: 1 }}
                >
                  {loading ? 'Test en cours...' : 'Lancer le Test Complet'}
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    setCurrentStep(0);
                    setTestResults({});
                  }}
                >
                  Réinitialiser
                </Button>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Description du Flux Testé
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  1. Réception Médicaments → Magasin Gros
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enregistrement d'un nouveau lot de médicament dans le magasin gros avec 
                  création automatique du mouvement de stock et vérification des alertes.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  2. Demande Interne → Responsable Gros
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Création d'une demande de transfert du magasin détail vers le magasin gros 
                  avec vérification de la disponibilité du stock.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  3. Validation + Transfert → Mise à jour Stocks
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Validation du transfert par le responsable, décrémentation du stock gros 
                  et incrémentation du stock détail avec génération du bon de transfert.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  4. Dispensation Patients → Stock Détail décrémenté
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dispensation de médicaments à un patient avec décrémentation automatique 
                  du stock détail et enregistrement du mouvement.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  5. Retours/Pertes → Mise à jour avec justification
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enregistrement d'un retour vers le magasin gros avec justification 
                  obligatoire et mise à jour des stocks des deux magasins.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  6. Rapports & Alertes → Suivi conjoint
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vérification automatique des alertes basées sur les seuils et dates 
                  de péremption pour un suivi conjoint des deux entités.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TestFluxComplet;
