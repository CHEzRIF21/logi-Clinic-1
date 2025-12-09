import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { TagList, Tag } from './TagList';

interface ModalMotifsProps {
  open: boolean;
  onClose: () => void;
  onSave: (motifs: string[]) => void;
  initialMotifs?: string[];
  suggestions?: Tag[];
}

export const ModalMotifs: React.FC<ModalMotifsProps> = ({
  open,
  onClose,
  onSave,
  initialMotifs = [],
  suggestions = [],
}) => {
  const [tags, setTags] = useState<Tag[]>(
    initialMotifs.map((motif, idx) => ({
      id: `motif-${idx}`,
      label: motif,
      color: 'primary',
    }))
  );

  const handleSave = () => {
    onSave(tags.map((t) => t.label));
    onClose();
  };

  const handleClose = () => {
    setTags(
      initialMotifs.map((motif, idx) => ({
        id: `motif-${idx}`,
        label: motif,
        color: 'primary',
      }))
    );
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Motifs de consultation</Typography>
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
          label="Ajouter des motifs"
          placeholder="Tapez un motif et appuyez sur Entrée..."
          allowCreate={true}
          editable={true}
          color="primary"
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

