import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { EditorRichText } from './EditorRichText';

interface ModalExamensCliniquesProps {
  open: boolean;
  onClose: () => void;
  onSave: (examens: string) => void;
  initialExamens?: string;
}

export const ModalExamensCliniques: React.FC<ModalExamensCliniquesProps> = ({
  open,
  onClose,
  onSave,
  initialExamens = '',
}) => {
  const [examens, setExamens] = useState(initialExamens);

  const handleSave = () => {
    onSave(examens);
    onClose();
  };

  const handleClose = () => {
    setExamens(initialExamens);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Examens cliniques</Typography>
          <Button onClick={handleClose} size="small" startIcon={<Close />}>
            Fermer
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <EditorRichText
          value={examens}
          onChange={setExamens}
          label="Décrire les examens cliniques réalisés"
          placeholder="Examen général, examen des systèmes, signes cliniques observés..."
          minRows={8}
          fullWidth
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Annuler</Button>
        <Button onClick={handleSave} variant="contained">
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

