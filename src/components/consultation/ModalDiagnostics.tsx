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
import { TagList, Tag } from './TagList';

interface ModalDiagnosticsProps {
  open: boolean;
  onClose: () => void;
  onSave: (diagnostics: string[]) => void;
  initialDiagnostics?: string[];
  suggestions?: Tag[];
}

export const ModalDiagnostics: React.FC<ModalDiagnosticsProps> = ({
  open,
  onClose,
  onSave,
  initialDiagnostics = [],
  suggestions = [],
}) => {
  const [tags, setTags] = useState<Tag[]>(
    initialDiagnostics.map((diag, idx) => ({
      id: `diag-${idx}`,
      label: diag,
      color: 'success',
    }))
  );

  const handleSave = () => {
    onSave(tags.map((t) => t.label));
    onClose();
  };

  const handleClose = () => {
    setTags(
      initialDiagnostics.map((diag, idx) => ({
        id: `diag-${idx}`,
        label: diag,
        color: 'success',
      }))
    );
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Diagnostics</Typography>
          <Button onClick={handleClose} size="small" startIcon={<Close />}>
            Fermer
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TagList
          tags={tags}
          onTagsChange={setTags}
          suggestions={suggestions}
          label="Ajouter des diagnostics"
          placeholder="Tapez un diagnostic et appuyez sur Entrée..."
          allowCreate={true}
          editable={true}
          color="success"
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

