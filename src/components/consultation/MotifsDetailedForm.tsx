import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  Warning,
} from '@mui/icons-material';

interface MotifDetail {
  motif_principal: string;
  symptomes_associes: string[];
  duree_symptomes: string;
}

interface MotifsDetailedFormProps {
  value: MotifDetail | null;
  onChange: (motif: MotifDetail) => void;
  onSave: () => void;
}

export const MotifsDetailedForm: React.FC<MotifsDetailedFormProps> = ({
  value,
  onChange,
  onSave,
}) => {
  const [motif, setMotif] = useState<MotifDetail>(
    value || {
      motif_principal: '',
      symptomes_associes: [],
      duree_symptomes: '',
    }
  );
  const [newSymptome, setNewSymptome] = useState('');

  const handleMotifChange = (field: keyof MotifDetail, val: string | string[]) => {
    const updated = { ...motif, [field]: val };
    setMotif(updated);
    onChange(updated);
  };

  const handleAddSymptome = () => {
    if (newSymptome.trim()) {
      handleMotifChange('symptomes_associes', [...motif.symptomes_associes, newSymptome.trim()]);
      setNewSymptome('');
    }
  };

  const handleRemoveSymptome = (index: number) => {
    const updated = [...motif.symptomes_associes];
    updated.splice(index, 1);
    handleMotifChange('symptomes_associes', updated);
  };

  const isValid = motif.motif_principal.trim().length > 0 && motif.duree_symptomes.trim().length > 0;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Warning color="error" fontSize="large" />
          <Box>
            <Typography variant="h5" gutterBottom>
              Motifs de Consultation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cette étape est <strong>OBLIGATOIRE</strong> avant de continuer
            </Typography>
          </Box>
        </Box>

        <Alert severity="warning" sx={{ mb: 3 }}>
          Veuillez remplir tous les champs obligatoires avant de continuer.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Motif principal *"
              value={motif.motif_principal}
              onChange={(e) => handleMotifChange('motif_principal', e.target.value)}
              placeholder="Ex: Douleurs abdominales, Fièvre, Céphalées..."
              error={!motif.motif_principal.trim()}
              helperText={!motif.motif_principal.trim() ? 'Ce champ est obligatoire' : ''}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Symptômes associés
            </Typography>
            <Box display="flex" gap={1} mb={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ajouter un symptôme..."
                value={newSymptome}
                onChange={(e) => setNewSymptome(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSymptome();
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={handleAddSymptome}
                startIcon={<Add />}
              >
                Ajouter
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
              {motif.symptomes_associes.map((symptome, index) => (
                <Chip
                  key={index}
                  label={symptome}
                  onDelete={() => handleRemoveSymptome(index)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Durée des symptômes *"
              value={motif.duree_symptomes}
              onChange={(e) => handleMotifChange('duree_symptomes', e.target.value)}
              placeholder="Ex: 3 jours, 2 semaines, 1 mois..."
              error={!motif.duree_symptomes.trim()}
              helperText={!motif.duree_symptomes.trim() ? 'Ce champ est obligatoire' : ''}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            onClick={onSave}
            disabled={!isValid}
            color={isValid ? 'success' : 'error'}
          >
            {isValid ? 'Enregistrer et continuer' : 'Veuillez remplir tous les champs obligatoires'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

