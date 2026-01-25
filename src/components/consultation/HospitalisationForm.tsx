import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
} from '@mui/material';
import {
  LocalHospital,
  Save,
} from '@mui/icons-material';

interface HospitalisationData {
  chambre_demandee?: string;
  duree_previsionnelle?: string;
  type_prise_en_charge?: string;
  actes_infirmiers?: string;
}

interface HospitalisationFormProps {
  consultationId: string;
  patientId: string;
  onSave: (data: HospitalisationData) => Promise<void>;
  initialData?: HospitalisationData;
}

export const HospitalisationForm: React.FC<HospitalisationFormProps> = ({
  consultationId,
  patientId,
  onSave,
  initialData,
}) => {
  const [data, setData] = useState<HospitalisationData>({});
  const [loading, setLoading] = useState(false);
  const [hasUserEdited, setHasUserEdited] = useState(false);

  useEffect(() => {
    // Pré-remplir avec les données déjà enregistrées (sans écraser une saisie en cours)
    if (initialData && !hasUserEdited) {
      setData(initialData);
    }
  }, [initialData, hasUserEdited]);

  const handleChange = (field: keyof HospitalisationData, val: string) => {
    setHasUserEdited(true);
    setData({ ...data, [field]: val });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(data);
      setHasUserEdited(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <LocalHospital color="primary" fontSize="large" />
        <Box>
          <Typography variant="h6" gutterBottom>
            Prescription d'Hospitalisation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chambre, durée, prise en charge et actes infirmiers
          </Typography>
        </Box>
      </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Chambre Demandée"
              value={data.chambre_demandee || ''}
              onChange={(e) => handleChange('chambre_demandee', e.target.value)}
              placeholder="Ex: Chambre 101, Chambre individuelle..."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Durée Prévisionnelle"
              value={data.duree_previsionnelle || ''}
              onChange={(e) => handleChange('duree_previsionnelle', e.target.value)}
              placeholder="Ex: 3 jours, 1 semaine..."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Type de Prise en Charge</InputLabel>
              <Select
                value={data.type_prise_en_charge || ''}
                onChange={(e) => handleChange('type_prise_en_charge', e.target.value)}
                label="Type de Prise en Charge"
              >
                <MenuItem value="normale">Normale</MenuItem>
                <MenuItem value="surveillance">Surveillance</MenuItem>
                <MenuItem value="soins_intensifs">Soins Intensifs</MenuItem>
                <MenuItem value="reanimation">Réanimation</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Actes Infirmiers Associés"
              value={data.actes_infirmiers || ''}
              onChange={(e) => handleChange('actes_infirmiers', e.target.value)}
              placeholder="Pansements, perfusions, surveillance particulière..."
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={loading}
          size="large"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer l\'Hospitalisation'}
        </Button>
      </Box>
    </Box>
  );
};

