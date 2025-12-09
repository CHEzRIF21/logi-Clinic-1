import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Box,
  Divider,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Close,
  Search,
  LocalHospital,
  Description,
} from '@mui/icons-material';
import { ConsultationTemplate } from '../../services/consultationApiService';

interface ModalChoixTemplateProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: ConsultationTemplate) => void;
  templates: ConsultationTemplate[];
}

export const ModalChoixTemplate: React.FC<ModalChoixTemplateProps> = ({
  open,
  onClose,
  onSelect,
  templates,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialite, setSelectedSpecialite] = useState<string>('all');

  // Grouper les templates par spécialité
  const templatesBySpecialite = templates.reduce((acc, template) => {
    const specialite = template.specialite || 'Autres';
    if (!acc[specialite]) {
      acc[specialite] = [];
    }
    acc[specialite].push(template);
    return acc;
  }, {} as Record<string, ConsultationTemplate[]>);

  const specialites = Object.keys(templatesBySpecialite).sort();

  // Filtrer les templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.specialite?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialite = selectedSpecialite === 'all' || template.specialite === selectedSpecialite;
    
    return matchesSearch && matchesSpecialite;
  });

  const handleSelect = () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (template) {
      onSelect(template);
      setSelectedTemplateId('');
      setSearchQuery('');
      setSelectedSpecialite('all');
    }
  };

  const handleClose = () => {
    setSelectedTemplateId('');
    setSearchQuery('');
    setSelectedSpecialite('all');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Choisir une fiche de consultation</Typography>
          <Button onClick={handleClose} size="small" startIcon={<Close />}>
            Fermer
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Recherche */}
        <TextField
          fullWidth
          placeholder="Rechercher un template..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {/* Filtre par spécialité */}
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Filtrer par spécialité</FormLabel>
          <RadioGroup
            row
            value={selectedSpecialite}
            onChange={(e) => setSelectedSpecialite(e.target.value)}
          >
            <FormControlLabel value="all" control={<Radio />} label="Toutes" />
            {specialites.map((specialite) => (
              <FormControlLabel
                key={specialite}
                value={specialite}
                control={<Radio />}
                label={specialite}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* Liste des templates */}
        {filteredTemplates.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              Aucun template trouvé
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredTemplates.map((template) => (
              <ListItem key={template.id} disablePadding>
                <ListItemButton
                  selected={selectedTemplateId === template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    '&.Mui-selected': {
                      bgcolor: 'primary.light',
                      '&:hover': {
                        bgcolor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    <Radio
                      checked={selectedTemplateId === template.id}
                      value={template.id}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{template.nom}</Typography>
                        <Chip
                          label={template.specialite}
                          size="small"
                          color="primary"
                          variant="outlined"
                          icon={<LocalHospital />}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        {template.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {template.description}
                          </Typography>
                        )}
                        {template.sections && Array.isArray(template.sections) && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            {template.sections.map((section: string, idx: number) => (
                              <Chip
                                key={idx}
                                label={section}
                                size="small"
                                variant="outlined"
                                icon={<Description />}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Annuler</Button>
        <Button
          onClick={handleSelect}
          variant="contained"
          disabled={!selectedTemplateId}
        >
          Utiliser ce template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

