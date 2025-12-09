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
      // Étape 1: Réception médicaments
      setCurrentStep(1);
      setTestResults(prev => ({ ...prev, reception: 'pending' }));
      
      const receptionResult = await StockService.receptionMedicament({
        medicament_id: 'test-med-1',
        numero_lot: 'LOT-TEST-001',
        quantite_initiale: 100,
        date_reception: new Date().toISOString().split('T')[0],
        date_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        prix_achat: 500,
        fournisseur: 'Fournisseur Test',
        utilisateur_id: 'test-user',
        reference_document: 'FAC-TEST-001',
        observations: 'Test de réception automatique'
      });
      
      setTestResults(prev => ({ ...prev, reception: 'success' }));

      // Étape 2: Demande interne
      setCurrentStep(2);
      setTestResults(prev => ({ ...prev, demande: 'pending' }));
      
      const demandeResult = await StockService.creerDemandeTransfert({
        medicament_id: 'test-med-1',
        lot_id: receptionResult.lot.id,
        quantite_demandee: 50,
        utilisateur_demandeur_id: 'test-user',
        motif: 'Test de demande de transfert',
        observations: 'Test automatique'
      });
      
      setTestResults(prev => ({ ...prev, demande: 'success' }));

      // Étape 3: Validation transfert
      setCurrentStep(3);
      setTestResults(prev => ({ ...prev, validation: 'pending' }));
      
      const validationResult = await StockService.validerTransfert(
        demandeResult.transfert.id,
        'test-validator'
      );
      
      setTestResults(prev => ({ ...prev, validation: 'success' }));

      // Étape 4: Dispensation patient
      setCurrentStep(4);
      setTestResults(prev => ({ ...prev, dispensation: 'pending' }));
      
      const dispensationResult = await StockService.dispensationPatient({
        patient_id: 'test-patient-1',
        type_dispensation: 'patient',
        lignes: [{
          medicament_id: 'test-med-1',
          lot_id: receptionResult.lot.id,
          quantite: 10,
          prix_unitaire: 500
        }],
        utilisateur_id: 'test-user',
        observations: 'Test de dispensation'
      });
      
      setTestResults(prev => ({ ...prev, dispensation: 'success' }));

      // Étape 5: Retour/Perte
      setCurrentStep(5);
      setTestResults(prev => ({ ...prev, retour: 'pending' }));
      
      const retourResult = await StockService.enregistrerPerteRetour({
        type: 'retour',
        medicament_id: 'test-med-1',
        lot_id: receptionResult.lot.id,
        quantite: 5,
        motif: 'Test de retour',
        utilisateur_id: 'test-user',
        observations: 'Test automatique de retour'
      });
      
      setTestResults(prev => ({ ...prev, retour: 'success' }));

      // Étape 6: Vérification alertes
      setCurrentStep(6);
      setTestResults(prev => ({ ...prev, alertes: 'pending' }));
      
      await StockService.verifierAlertes('test-med-1');
      
      setTestResults(prev => ({ ...prev, alertes: 'success' }));

      setCurrentStep(6);
    } catch (error) {
      console.error('Erreur lors du test:', error);
      setTestResults(prev => ({ ...prev, [steps[currentStep - 1]]: 'error' }));
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
