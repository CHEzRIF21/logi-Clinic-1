import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { supabase } from '../../services/supabase';

export const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [patientsCount, setPatientsCount] = useState<number | null>(null);

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      setConnectionStatus('testing');
      
      // Test de connexion basique
      const { data, error } = await supabase
        .from('patients')
        .select('count', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      setPatientsCount(data?.length || 0);
      setConnectionStatus('success');
    } catch (error) {
      console.error('Erreur de connexion Supabase:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue');
      setConnectionStatus('error');
    }
  };

  const testCreatePatient = async () => {
    try {
      const testPatient = {
        identifiant: `TEST-${Date.now()}`,
        nom: 'Test',
        prenom: 'Patient',
        sexe: 'Masculin' as const,
        date_naissance: new Date().toISOString().split('T')[0],
        personne_urgence: 'Contact Test',
      };

      const { data, error } = await supabase
        .from('patients')
        .insert([testPatient])
        .select()
        .single();

      if (error) {
        throw error;
      }

      alert(`Patient de test créé avec succès ! ID: ${data.id}`);
      testSupabaseConnection(); // Recharger le compteur
    } catch (error) {
      console.error('Erreur lors de la création du patient de test:', error);
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
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Test de Connexion Supabase
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

        {patientsCount !== null && (
          <Typography variant="body1" sx={{ mb: 2 }}>
            📊 Nombre de patients dans la base : <strong>{patientsCount}</strong>
          </Typography>
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
            onClick={testCreatePatient}
            disabled={connectionStatus !== 'success'}
          >
            Créer un patient de test
          </Button>
        </Box>

        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          <strong>URL Supabase :</strong> https://kfuqghnlrnqaiaiwzziv.supabase.co
        </Typography>
      </CardContent>
    </Card>
  );
};
