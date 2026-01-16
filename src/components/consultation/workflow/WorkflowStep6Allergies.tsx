import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Alert,
  Divider,
  Button,
  Snackbar
} from '@mui/material';
import { Warning, Add, CheckCircle } from '@mui/icons-material';
import { Patient } from '../../../services/supabase';
import { PatientService } from '../../../services/patientService';

interface WorkflowStep6AllergiesProps {
  patient: Patient;
  onAllergiesChange: (allergies: string) => void;
}

export const WorkflowStep6Allergies: React.FC<WorkflowStep6AllergiesProps> = ({
  patient,
  onAllergiesChange
}) => {
  const [allergiesDetails, setAllergiesDetails] = useState<string>(patient.allergies || ''); // Champ séparé pour les détails
  const [allergiesList, setAllergiesList] = useState<string[]>(
    patient.allergies ? patient.allergies.split(',').map(a => a.trim()).filter(a => a) : []
  );
  const [newAllergy, setNewAllergy] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    onAllergiesChange(allergiesDetails);
  }, [allergiesDetails, onAllergiesChange]);

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      if (!allergiesList.includes(newAllergy.trim())) {
        setAllergiesList([...allergiesList, newAllergy.trim()]);
        setNewAllergy('');
      }
    }
  };

  const handleRemoveAllergy = (allergyToRemove: string) => {
    setAllergiesList(allergiesList.filter(a => a !== allergyToRemove));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Sauvegarder uniquement le champ "Détails des allergies"
      await PatientService.updatePatient(patient.id, { allergies: allergiesDetails });
      setSnackbar({
        open: true,
        message: 'Allergies enregistrées avec succès',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erreur lors de l\'enregistrement des allergies',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Extraire les allergies depuis le champ "Détails des allergies" pour le banner
  const allergiesFromDetails = allergiesDetails ? allergiesDetails.split(',').map(a => a.trim()).filter(a => a) : [];

  return (
    <>
      {/* Banner persistant en haut */}
      {allergiesFromDetails.length > 0 && (
        <Alert
          severity="error"
          icon={<Warning />}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            mb: 2,
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}
        >
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="h6" component="span">
              ⚠️ ALLERGIES CONNUES :
            </Typography>
            {allergiesFromDetails.map((allergy, index) => (
              <Chip
                key={index}
                label={allergy}
                color="error"
                size="medium"
                sx={{ fontWeight: 'bold' }}
              />
            ))}
          </Box>
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Warning color="error" />
            <Typography variant="h6">
              Étape 6 — Allergies (Sécurité Critique)
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Allergies actuelles du patient
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {allergiesList.length === 0 ? (
                <Typography color="text.secondary">Aucune allergie enregistrée</Typography>
              ) : (
                allergiesList.map((allergy, index) => (
                  <Chip
                    key={index}
                    label={allergy}
                    color="error"
                    onDelete={() => handleRemoveAllergy(allergy)}
                    sx={{ fontWeight: 'bold' }}
                  />
                ))
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Ajouter une allergie"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              placeholder="Ex: Pénicilline, Sulfamides..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddAllergy();
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddAllergy}
              disabled={!newAllergy.trim()}
            >
              Ajouter
            </Button>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Détails des allergies"
            value={allergiesDetails}
            onChange={(e) => setAllergiesDetails(e.target.value)}
            placeholder="Liste des allergies séparées par des virgules"
          />

          <Box sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? undefined : <CheckCircle />}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les allergies'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

