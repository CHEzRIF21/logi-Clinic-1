import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Avatar,
} from '@mui/material';
import { Warning, Delete, Person } from '@mui/icons-material';
import { Patient } from '../../services/supabase';

interface DeleteConfirmationDialogProps {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  patient,
  open,
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!patient) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Warning color="error" />
          <Typography variant="h6" color="error">
            Confirmer la suppression
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Cette action est irréversible. Toutes les données du patient seront définitivement supprimées.
          </Typography>
        </Alert>

        <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: patient.sexe === 'Masculin' ? 'primary.main' : 'secondary.main' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h6">
              {patient.prenom} {patient.nom}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {patient.identifiant}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" color="textSecondary">
          Êtes-vous sûr de vouloir supprimer ce patient ? Cette action ne peut pas être annulée.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          startIcon={<Delete />}
          disabled={loading}
        >
          {loading ? 'Suppression...' : 'Supprimer définitivement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
