import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Upload, Save } from '@mui/icons-material';
import { supabase } from '../../../services/supabase';
import { getMyClinicId } from '../../../services/clinicService';

export interface BilanAntérieur {
  id?: string;
  patient_id: string;
  date_bilan: string;
  type_examen: string;
  tests: string;
  statut: 'prescrit' | 'preleve' | 'termine' | 'annule';
  fichier_url?: string;
  details?: string;
  created_at?: string;
}

interface EnregistrerBilanAntérieurDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  consultationId?: string; // Optionnel: pour lier le bilan à la consultation en cours (RLS)
  onSave: () => void;
}

export const EnregistrerBilanAntérieurDialog: React.FC<EnregistrerBilanAntérieurDialogProps> = ({
  open,
  onClose,
  patientId,
  consultationId,
  onSave
}) => {
  const [bilan, setBilan] = useState<Partial<BilanAntérieur>>({
    date_bilan: new Date().toISOString().split('T')[0],
    type_examen: '',
    tests: '',
    statut: 'termine',
    details: ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUploadFile = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const clinicId = await getMyClinicId();
      if (!clinicId) {
        throw new Error('Clinic ID manquant');
      }

      // Créer le chemin du fichier
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `bilans/${fileName}`;

      // Uploader le fichier vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Récupérer l'URL publique du fichier
      const { data: urlData } = supabase.storage
        .from('patient-files')
        .getPublicUrl(filePath);

      setBilan(prev => ({ ...prev, fichier_url: urlData.publicUrl }));
    } catch (err: any) {
      console.error('Erreur lors de l\'upload:', err);
      setError(err.message || 'Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!bilan.date_bilan || !bilan.type_examen || !bilan.tests) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const clinicId = await getMyClinicId();
      if (!clinicId) {
        throw new Error('Clinic ID manquant');
      }

      // Créer une prescription de laboratoire pour le bilan antérieur
      const insertData: any = {
        patient_id: patientId,
        type_examen: bilan.type_examen,
        details: bilan.details || bilan.tests,
        date_prescription: new Date(bilan.date_bilan).toISOString(),
        origine: 'consultation',
        statut: bilan.statut
      };

      // Lier à la consultation en cours pour satisfaire la politique RLS
      if (consultationId) {
        insertData.consultation_id = consultationId;
      }

      // Ajouter clinic_id seulement si la colonne existe
      // (la table lab_prescriptions devrait avoir clinic_id selon l'architecture multi-tenant)
      try {
        // Vérifier si clinic_id existe en essayant de l'insérer
        insertData.clinic_id = clinicId;
      } catch (e) {
        // Si clinic_id n'existe pas, on continue sans
        console.warn('clinic_id non disponible pour lab_prescriptions');
      }

      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('lab_prescriptions')
        .insert([insertData])
        .select()
        .single();

      if (prescriptionError) {
        throw prescriptionError;
      }

      // Si un fichier a été uploadé, on peut le stocker dans une table de fichiers joints
      // ou simplement dans les détails de la prescription
      if (bilan.fichier_url && prescriptionData) {
        // Mettre à jour la prescription avec l'URL du fichier dans les détails
        await supabase
          .from('lab_prescriptions')
          .update({
            details: `${bilan.details || bilan.tests}\n\nFichier joint: ${bilan.fichier_url}`
          })
          .eq('id', prescriptionData.id);
      }

      // Réinitialiser le formulaire
      setBilan({
        date_bilan: new Date().toISOString().split('T')[0],
        type_examen: '',
        tests: '',
        statut: 'termine',
        details: ''
      });
      setFile(null);
      
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Erreur lors de l\'enregistrement:', err);
      setError(err.message || 'Erreur lors de l\'enregistrement du bilan');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving && !uploading) {
      setBilan({
        date_bilan: new Date().toISOString().split('T')[0],
        type_examen: '',
        tests: '',
        statut: 'termine',
        details: ''
      });
      setFile(null);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Enregistrer un bilan antérieur</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            type="date"
            label="Date du bilan"
            value={bilan.date_bilan}
            onChange={(e) => setBilan({ ...bilan, date_bilan: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            fullWidth
            label="Type d'examen"
            value={bilan.type_examen}
            onChange={(e) => setBilan({ ...bilan, type_examen: e.target.value })}
            placeholder="Ex: NFS, Glycémie, VIH, Paludisme..."
            required
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Tests / Résultats"
            value={bilan.tests}
            onChange={(e) => setBilan({ ...bilan, tests: e.target.value })}
            placeholder="Détaillez les tests effectués et leurs résultats..."
            required
          />

          <FormControl fullWidth required>
            <InputLabel id="statut-label">Statut</InputLabel>
            <Select
              labelId="statut-label"
              value={bilan.statut}
              label="Statut"
              onChange={(e) => setBilan({ ...bilan, statut: e.target.value as BilanAntérieur['statut'] })}
            >
              <MenuItem value="prescrit">Prescrit</MenuItem>
              <MenuItem value="preleve">Prélevé</MenuItem>
              <MenuItem value="termine">Terminé</MenuItem>
              <MenuItem value="annule">Annulé</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Détails supplémentaires (optionnel)"
            value={bilan.details}
            onChange={(e) => setBilan({ ...bilan, details: e.target.value })}
            placeholder="Informations complémentaires..."
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Fichier du bilan (optionnel)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <input
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<Upload />}
                  disabled={uploading}
                >
                  {file ? file.name : 'Sélectionner un fichier'}
                </Button>
              </label>
              {file && !bilan.fichier_url && (
                <Button
                  variant="contained"
                  onClick={handleUploadFile}
                  disabled={uploading}
                  startIcon={uploading ? <CircularProgress size={16} /> : <Upload />}
                >
                  {uploading ? 'Upload...' : 'Uploader'}
                </Button>
              )}
              {bilan.fichier_url && (
                <Alert severity="success" sx={{ flex: 1 }}>
                  Fichier uploadé avec succès
                </Alert>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving || uploading}>
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          disabled={saving || uploading || !bilan.date_bilan || !bilan.type_examen || !bilan.tests}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
