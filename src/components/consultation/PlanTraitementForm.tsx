import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Divider,
  Button,
  Chip,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Alert,
} from '@mui/material';
import {
  Assignment,
  Add,
  Delete,
  ContentCopy,
  CheckCircle,
  AttachFile,
  Description,
} from '@mui/icons-material';
import {
  TreatmentPlanTemplatesService,
  TreatmentPlanTemplate,
} from '../../services/treatmentPlanTemplatesService';

interface PlanTraitementData {
  conseils?: string;
  mesures_hygieno_dietetiques?: string;
  suivi_particulier?: string;
  restrictions?: string;
  documents_attaches?: string[];
}

interface PlanTraitementFormProps {
  value: PlanTraitementData;
  onChange: (data: PlanTraitementData) => void;
  onSave?: () => Promise<void>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const PlanTraitementForm: React.FC<PlanTraitementFormProps> = ({
  value,
  onChange,
  onSave,
}) => {
  const [data, setData] = useState<PlanTraitementData>(value || {});
  const [activeTab, setActiveTab] = useState(0);
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TreatmentPlanTemplate['categorie'] | 'all'>('all');
  const [templateSearch, setTemplateSearch] = useState('');

  const handleChange = (field: keyof PlanTraitementData, val: string | string[]) => {
    const updated = { ...data, [field]: val };
    setData(updated);
    onChange(updated);
  };

  const handleApplyTemplate = (template: TreatmentPlanTemplate) => {
    const fieldMap: Record<TreatmentPlanTemplate['categorie'], keyof PlanTraitementData> = {
      hygiene: 'mesures_hygieno_dietetiques',
      nutrition: 'mesures_hygieno_dietetiques',
      activite: 'conseils',
      suivi: 'suivi_particulier',
      restrictions: 'restrictions',
      general: 'conseils',
    };

    const field = fieldMap[template.categorie] || 'conseils';
    const currentValue = data[field] || '';
    const newValue = currentValue ? `${currentValue}\n\n${template.contenu}` : template.contenu;
    handleChange(field, newValue);
    setTemplatesDialogOpen(false);
  };

  const getTemplatesToShow = () => {
    let templates = TreatmentPlanTemplatesService.getTemplates();
    
    if (selectedCategory !== 'all') {
      templates = templates.filter((t) => t.categorie === selectedCategory);
    }
    
    if (templateSearch) {
      templates = TreatmentPlanTemplatesService.searchTemplates(templateSearch);
    }
    
    return templates;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileNames = Array.from(files).map((f) => f.name);
      handleChange('documents_attaches', [...(data.documents_attaches || []), ...fileNames]);
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Assignment color="primary" fontSize="large" />
              <Box>
                <Typography variant="h5" gutterBottom>
                  Plan de Traitement
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Conseils, mesures hygiéno-diététiques et suivi particulier
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={() => setTemplatesDialogOpen(true)}
            >
              Templates
            </Button>
          </Box>

          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Conseils Généraux" />
            <Tab label="Hygiène & Nutrition" />
            <Tab label="Suivi & Restrictions" />
            <Tab label="Documents" />
          </Tabs>

          {/* Onglet Conseils Généraux */}
          <TabPanel value={activeTab} index={0}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Conseils Donnés"
              value={data.conseils || ''}
              onChange={(e) => handleChange('conseils', e.target.value)}
              placeholder="Conseils généraux donnés au patient..."
              helperText="Conseils sur l'activité physique, la conduite à tenir, etc."
            />
          </TabPanel>

          {/* Onglet Hygiène & Nutrition */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Mesures Hygiéno-Diététiques"
                  value={data.mesures_hygieno_dietetiques || ''}
                  onChange={(e) => handleChange('mesures_hygieno_dietetiques', e.target.value)}
                  placeholder="Régime alimentaire, activité physique, hygiène de vie..."
                  helperText="Régime alimentaire, hydratation, activité physique, hygiène personnelle"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Onglet Suivi & Restrictions */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Suivi Particulier"
                  value={data.suivi_particulier || ''}
                  onChange={(e) => handleChange('suivi_particulier', e.target.value)}
                  placeholder="Surveillance particulière, signes d'alerte, rendez-vous de contrôle..."
                  helperText="Plan de suivi médical, signes d'alerte à surveiller"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Restrictions & Soins à Domicile"
                  value={data.restrictions || ''}
                  onChange={(e) => handleChange('restrictions', e.target.value)}
                  placeholder="Restrictions (pas d'efforts, isolement, repos), soins à domicile..."
                  helperText="Restrictions d'activité, isolement, repos, soins spécifiques à domicile"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Onglet Documents */}
          <TabPanel value={activeTab} index={3}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Documents Attachés
              </Typography>
              <Box display="flex" gap={2} mb={2}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AttachFile />}
                >
                  Attacher un Document
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </Button>
              </Box>
              {data.documents_attaches && data.documents_attaches.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {data.documents_attaches.map((doc, index) => (
                    <Chip
                      key={index}
                      label={doc}
                      icon={<Description />}
                      onDelete={() => {
                        const updated = [...(data.documents_attaches || [])];
                        updated.splice(index, 1);
                        handleChange('documents_attaches', updated);
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  Aucun document attaché. Vous pouvez attacher des PDF, images ou documents Word.
                </Alert>
              )}
            </Box>
          </TabPanel>

          {onSave && (
            <Box display="flex" justifyContent="flex-end" mt={3}>
              <Button variant="contained" onClick={onSave} startIcon={<CheckCircle />}>
                Enregistrer le Plan de Traitement
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog Templates */}
      <Dialog open={templatesDialogOpen} onClose={() => setTemplatesDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Templates de Conseils</Typography>
            <Autocomplete
              freeSolo
              options={['all', 'hygiene', 'nutrition', 'activite', 'suivi', 'restrictions', 'general']}
              value={selectedCategory}
              onChange={(_, v) => setSelectedCategory((v || 'all') as any)}
              renderInput={(params) => (
                <TextField {...params} size="small" label="Catégorie" sx={{ width: 200 }} />
              )}
            />
          </Box>
          <TextField
            fullWidth
            size="small"
            placeholder="Rechercher un template..."
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogTitle>
        <DialogContent>
          <List>
            {getTemplatesToShow().map((template) => (
              <ListItem key={template.id} disablePadding>
                <Paper sx={{ width: '100%', p: 2, mb: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {template.nom}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', mt: 1 }}>
                        {template.contenu}
                      </Typography>
                      {template.tags && template.tags.length > 0 && (
                        <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
                          {template.tags.map((tag, idx) => (
                            <Chip key={idx} label={tag} size="small" variant="outlined" />
                          ))}
                        </Box>
                      )}
                    </Box>
                    <IconButton
                      color="primary"
                      onClick={() => handleApplyTemplate(template)}
                      sx={{ ml: 1 }}
                    >
                      <Add />
                    </IconButton>
                  </Box>
                </Paper>
              </ListItem>
            ))}
          </List>
          {getTemplatesToShow().length === 0 && (
            <Alert severity="info">Aucun template trouvé pour cette recherche.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplatesDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

