import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { supabase } from '../../services/stockSupabase';
import { MedicamentService } from '../../services/medicamentService';
import { LotService } from '../../services/lotService';

export const StockSupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [medicamentsCount, setMedicamentsCount] = useState<number | null>(null);
  const [lotsCount, setLotsCount] = useState<number | null>(null);
  const [medicaments, setMedicaments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      setConnectionStatus('testing');
      
      // Test de connexion basique
      const { data: medicaments, error: medicamentsError } = await supabase
        .from('medicaments')
        .select('count', { count: 'exact', head: true });

      if (medicamentsError) {
        throw medicamentsError;
      }

      const { data: lots, error: lotsError } = await supabase
        .from('lots')
        .select('count', { count: 'exact', head: true });

      if (lotsError) {
        throw lotsError;
      }

      setMedicamentsCount(medicaments?.length || 0);
      setLotsCount(lots?.length || 0);
      setConnectionStatus('success');

      // Charger quelques médicaments pour l'affichage
      await loadSampleData();
    } catch (error) {
      console.error('Erreur de connexion Supabase:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue');
      setConnectionStatus('error');
    }
  };

  const loadSampleData = async () => {
    try {
      const medicamentsData = await MedicamentService.getAllMedicaments();
      setMedicaments(medicamentsData.slice(0, 5)); // Afficher les 5 premiers

      const statsData = await MedicamentService.getMedicamentStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const testCreateMedicament = async () => {
    try {
      const testMedicament = {
        code: `TEST-${Date.now()}`,
        nom: 'Médicament de Test',
        forme: 'Comprimé',
        dosage: '500mg',
        unite: 'mg',
        fournisseur: 'Test Pharma',
        prix_unitaire: 100,
        seuil_alerte: 10,
        seuil_rupture: 5,
        emplacement: 'Rayon Test',
        categorie: 'Test',
        prescription_requise: false,
      };

      const newMedicament = await MedicamentService.createMedicament(testMedicament);
      alert(`Médicament de test créé avec succès ! ID: ${newMedicament.id}`);
      testSupabaseConnection(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la création du médicament de test:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  if (connectionStatus === 'testing') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Test de connexion à Supabase...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ maxWidth: 800, mx: 'auto', mt: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Test de Connexion Supabase - Gestion des Stocks
          </Typography>

          {connectionStatus === 'success' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Connexion à Supabase réussie !
            </Alert>
          )}

          {connectionStatus === 'error' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              ❌ Erreur de connexion : {errorMessage}
            </Alert>
          )}

          {/* Statistiques */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Médicaments
                  </Typography>
                  <Typography variant="h4">
                    {medicamentsCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Lots
                  </Typography>
                  <Typography variant="h4">
                    {lotsCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Statistiques détaillées */}
          {stats && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Statistiques détaillées
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Chip label={`Total: ${stats.total}`} color="primary" />
                </Grid>
                <Grid item xs={6}>
                  <Chip label={`Avec prescription: ${stats.parPrescription.avec_prescription}`} color="secondary" />
                </Grid>
                <Grid item xs={6}>
                  <Chip label={`Sans prescription: ${stats.parPrescription.sans_prescription}`} color="default" />
                </Grid>
                <Grid item xs={6}>
                  <Chip label={`Alertes actives: ${stats.alertes.actives}`} color="warning" />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tableau des médicaments */}
          {medicaments.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Exemples de médicaments
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Nom</TableCell>
                      <TableCell>Forme</TableCell>
                      <TableCell>Catégorie</TableCell>
                      <TableCell>Prix</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {medicaments.map((med) => (
                      <TableRow key={med.id}>
                        <TableCell>{med.code}</TableCell>
                        <TableCell>{med.nom}</TableCell>
                        <TableCell>{med.forme}</TableCell>
                        <TableCell>{med.categorie}</TableCell>
                        <TableCell>{med.prix_unitaire} FCFA</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={testSupabaseConnection}
              sx={{ mr: 1 }}
            >
              Tester à nouveau
            </Button>
            
            <Button
              variant="outlined"
              onClick={testCreateMedicament}
              disabled={connectionStatus !== 'success'}
            >
              Créer un médicament de test
            </Button>
          </Box>

          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            <strong>URL Supabase :</strong> https://kfuqghnlrnqaiaiwzziv.supabase.co
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
