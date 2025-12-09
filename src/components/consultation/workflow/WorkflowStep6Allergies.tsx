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
  Button
} from '@mui/material';
import { Warning, Add } from '@mui/icons-material';
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
  const [allergies, setAllergies] = useState<string>(patient.allergies || '');
  const [newAllergy, setNewAllergy] = useState<string>('');

  useEffect(() => {
    onAllergiesChange(allergies);
  }, [allergies, onAllergiesChange]);

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      const allergiesList = allergies ? allergies.split(',').map(a => a.trim()) : [];
      if (!allergiesList.includes(newAllergy.trim())) {
        const updated = [...allergiesList, newAllergy.trim()].join(', ');
        setAllergies(updated);
        setNewAllergy('');
      }
    }
  };

  const handleRemoveAllergy = (allergyToRemove: string) => {
    const allergiesList = allergies.split(',').map(a => a.trim()).filter(a => a !== allergyToRemove);
    setAllergies(allergiesList.join(', '));
  };

  const handleSave = async () => {
    try {
      await PatientService.updatePatient(patient.id, { allergies });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const allergiesList = allergies ? allergies.split(',').map(a => a.trim()).filter(a => a) : [];

  return (
    <>
      {/* Banner persistant en haut */}
      {allergiesList.length > 0 && (
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
            {allergiesList.map((allergy, index) => (
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

          <Alert severity="error" sx={{ mb: 2 }}>
            Les allergies doivent être très visibles et affichées en permanence pendant toute la consultation.
          </Alert>

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
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Liste des allergies séparées par des virgules"
          />

          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="error" onClick={handleSave}>
              Enregistrer les allergies
            </Button>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

