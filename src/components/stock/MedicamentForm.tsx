import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { MedicamentFormData } from '../../services/stockSupabase';
import { MedicamentIdGenerator } from '../../utils/medicamentIdGenerator';

interface MedicamentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (medicamentData: MedicamentFormData) => Promise<void>;
  loading?: boolean;
  medicament?: MedicamentFormData | null;
  existingCodes?: string[];
}

const MedicamentForm: React.FC<MedicamentFormProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  medicament = null,
  existingCodes = [],
}) => {
  const [formData, setFormData] = useState<MedicamentFormData>({
    code: '',
    nom: '',
    forme: 'Comprimé',
    dosage: '',
    unite: 'Boîte',
    fournisseur: '',
    prix_unitaire: 0,
    seuil_alerte: 10,
    seuil_rupture: 5,
    emplacement: '',
    categorie: 'Autres',
    prescription_requise: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedId, setGeneratedId] = useState<string>('');

  // Générer un ID automatiquement au chargement du formulaire
  useEffect(() => {
    if (open && !medicament) {
      const newId = MedicamentIdGenerator.generateId(existingCodes);
      setGeneratedId(newId);
      setFormData(prev => ({ ...prev, code: newId }));
    }
  }, [open, medicament, existingCodes]);

  // Initialiser le formulaire avec les données du médicament si en mode édition
  useEffect(() => {
    if (medicament) {
      setFormData(medicament);
      setGeneratedId(medicament.code);
    } else {
      setFormData({
        code: '',
        nom: '',
        forme: 'Comprimé',
        dosage: '',
        unite: 'Boîte',
        fournisseur: '',
        prix_unitaire: 0,
        seuil_alerte: 10,
        seuil_rupture: 5,
        emplacement: '',
        categorie: 'Autres',
        prescription_requise: false,
      });
    }
  }, [medicament]);

  const handleChange = (field: keyof MedicamentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du médicament est obligatoire';
    }

    if (!formData.dosage.trim()) {
      newErrors.dosage = 'Le dosage est obligatoire';
    }

    if (!formData.fournisseur.trim()) {
      newErrors.fournisseur = 'Le fournisseur est obligatoire';
    }

    if (formData.prix_unitaire <= 0) {
      newErrors.prix_unitaire = 'Le prix unitaire doit être supérieur à 0';
    }

    if (formData.seuil_alerte < 0) {
      newErrors.seuil_alerte = 'Le seuil d\'alerte ne peut pas être négatif';
    }

    if (formData.seuil_rupture < 0) {
      newErrors.seuil_rupture = 'Le seuil de rupture ne peut pas être négatif';
    }

    if (!formData.emplacement.trim()) {
      newErrors.emplacement = 'L\'emplacement est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      code: '',
      nom: '',
      forme: 'Comprimé',
      dosage: '',
      unite: 'Boîte',
      fournisseur: '',
      prix_unitaire: 0,
      seuil_alerte: 10,
      seuil_rupture: 5,
      emplacement: '',
      categorie: 'Autres',
      prescription_requise: false,
    });
    setErrors({});
    setGeneratedId('');
    onClose();
  };

  const generateNewId = () => {
    const newId = MedicamentIdGenerator.generateId(existingCodes);
    setGeneratedId(newId);
    setFormData(prev => ({ ...prev, code: newId }));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {medicament ? 'Modifier le médicament' : 'Nouveau médicament'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {/* ID généré automatiquement */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Identifiant du médicament
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={generatedId || 'Génération en cours...'}
                color="primary"
                variant="outlined"
                size="medium"
              />
              {!medicament && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={generateNewId}
                  disabled={loading}
                >
                  Générer un nouvel ID
                </Button>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              L'identifiant est généré automatiquement au format MED000, MED001, etc.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Nom du médicament */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du médicament *"
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                error={!!errors.nom}
                helperText={errors.nom || 'Saisissez le nom commercial du médicament'}
                required
                disabled={loading}
              />
            </Grid>

            {/* Forme et dosage */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Forme pharmaceutique *</InputLabel>
                <Select
                  value={formData.forme}
                  onChange={(e) => handleChange('forme', e.target.value)}
                  label="Forme pharmaceutique *"
                  disabled={loading}
                >
                  <MenuItem value="Comprimé">Comprimé</MenuItem>
                  <MenuItem value="Sirop">Sirop</MenuItem>
                  <MenuItem value="Gélule">Gélule</MenuItem>
                  <MenuItem value="Injection">Injection</MenuItem>
                  <MenuItem value="Pommade">Pommade</MenuItem>
                  <MenuItem value="Suppositoire">Suppositoire</MenuItem>
                  <MenuItem value="Autres">Autres</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dosage *"
                value={formData.dosage}
                onChange={(e) => handleChange('dosage', e.target.value)}
                error={!!errors.dosage}
                helperText={errors.dosage || 'Ex: 500mg, 1g, 5ml'}
                required
                disabled={loading}
              />
            </Grid>

            {/* Unité et fournisseur */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Unité *</InputLabel>
                <Select
                  value={formData.unite}
                  onChange={(e) => handleChange('unite', e.target.value)}
                  label="Unité *"
                  disabled={loading}
                >
                  <MenuItem value="Boîte">Boîte</MenuItem>
                  <MenuItem value="Flacon">Flacon</MenuItem>
                  <MenuItem value="Ampoule">Ampoule</MenuItem>
                  <MenuItem value="Tube">Tube</MenuItem>
                  <MenuItem value="Sachet">Sachet</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fournisseur *"
                value={formData.fournisseur}
                onChange={(e) => handleChange('fournisseur', e.target.value)}
                error={!!errors.fournisseur}
                helperText={errors.fournisseur}
                required
                disabled={loading}
              />
            </Grid>

            {/* Prix et seuils */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Prix unitaire (FCFA) *"
                type="number"
                value={formData.prix_unitaire}
                onChange={(e) => {
                  const value = Math.max(0, parseFloat(e.target.value) || 0);
                  handleChange('prix_unitaire', value);
                }}
                inputProps={{ min: 0, step: 0.01 }}
                error={!!errors.prix_unitaire}
                helperText={errors.prix_unitaire}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Seuil d'alerte"
                type="number"
                value={formData.seuil_alerte}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  handleChange('seuil_alerte', value);
                }}
                inputProps={{ min: 0, step: 1 }}
                error={!!errors.seuil_alerte}
                helperText={errors.seuil_alerte}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Seuil de rupture"
                type="number"
                value={formData.seuil_rupture}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  handleChange('seuil_rupture', value);
                }}
                inputProps={{ min: 0, step: 1 }}
                error={!!errors.seuil_rupture}
                helperText={errors.seuil_rupture}
                disabled={loading}
              />
            </Grid>

            {/* Emplacement et catégorie */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emplacement *"
                value={formData.emplacement}
                onChange={(e) => handleChange('emplacement', e.target.value)}
                error={!!errors.emplacement}
                helperText={errors.emplacement || 'Ex: Rayon A-1, Frigo B-2'}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Catégorie *</InputLabel>
                <Select
                  value={formData.categorie}
                  onChange={(e) => handleChange('categorie', e.target.value)}
                  label="Catégorie *"
                  disabled={loading}
                >
                  <MenuItem value="Analgésiques">Analgésiques</MenuItem>
                  <MenuItem value="Antibiotiques">Antibiotiques</MenuItem>
                  <MenuItem value="Anti-inflammatoires">Anti-inflammatoires</MenuItem>
                  <MenuItem value="Antihypertenseurs">Antihypertenseurs</MenuItem>
                  <MenuItem value="Antidiabétiques">Antidiabétiques</MenuItem>
                  <MenuItem value="Vitamines">Vitamines</MenuItem>
                  <MenuItem value="Antiparasitaires">Antiparasitaires</MenuItem>
                  <MenuItem value="Antiviraux">Antiviraux</MenuItem>
                  <MenuItem value="Antifongiques">Antifongiques</MenuItem>
                  <MenuItem value="Antihistaminiques">Antihistaminiques</MenuItem>
                  <MenuItem value="Bronchodilatateurs">Bronchodilatateurs</MenuItem>
                  <MenuItem value="Autres">Autres</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Prescription requise */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Prescription requise</InputLabel>
                <Select
                  value={formData.prescription_requise ? 'oui' : 'non'}
                  onChange={(e) => handleChange('prescription_requise', e.target.value === 'oui')}
                  label="Prescription requise"
                  disabled={loading}
                >
                  <MenuItem value="non">Non</MenuItem>
                  <MenuItem value="oui">Oui</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Enregistrement...' : (medicament ? 'Modifier' : 'Créer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MedicamentForm;
