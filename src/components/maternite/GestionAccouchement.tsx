import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add,
  Edit,
  Save,
  Cancel,
  Visibility,
  LocalHospital,
  ChildCare,
  Event,
  Warning,
  CheckCircle,
  Schedule,
  Assessment,
  ExpandMore,
  PregnantWoman,
} from '@mui/icons-material';

interface GestionAccouchementProps {
  patiente: any;
  onSaveAccouchement: (accouchement: any) => void;
  onClose: () => void;
}

const GestionAccouchement: React.FC<GestionAccouchementProps> = ({
  patiente,
  onSaveAccouchement,
  onClose,
}) => {
  const [accouchementForm, setAccouchementForm] = useState({
    id: '',
    patienteId: patiente?.id || '',
    
    // Informations générales
    date: new Date().toISOString().slice(0, 16),
    dureeTravail: 0,
    dureeExpulsion: 0,
    
    // Mode d'accouchement
    mode: 'voie_basse',
    indication: '',
    
    // Interventions
    interventions: {
      episiotomie: false,
      forceps: false,
      ventouse: false,
      cesarienne: false,
      autres: '',
    },
    
    // Complications maternelles
    complicationsMaternelles: {
      hemorragie: false,
      dechirure: false,
      infection: false,
      hypertension: false,
      autres: '',
    },
    
    // Informations du nouveau-né
    nouveauNe: {
      sexe: '',
      poids: 0,
      taille: 0,
      perimetreCranien: 0,
      scoreApgar1: 0,
      scoreApgar5: 0,
      scoreApgar10: 0,
      allaitement: '',
      statut: 'vivant',
      complications: '',
    },
    
    // Soins post-accouchement
    soinsPostAccouchement: {
      dureeHospitalisation: 0,
      complications: '',
      traitement: '',
      sortie: '',
    },
    
    // Observations
    observations: '',
    personnel: '',
    statut: 'en_cours',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setAccouchementForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInterventionsChange = (field: string, value: any) => {
    setAccouchementForm(prev => ({
      ...prev,
      interventions: {
        ...prev.interventions,
        [field]: value
      }
    }));
  };

  const handleComplicationsChange = (field: string, value: any) => {
    setAccouchementForm(prev => ({
      ...prev,
      complicationsMaternelles: {
        ...prev.complicationsMaternelles,
        [field]: value
      }
    }));
  };

  const handleNouveauNeChange = (field: string, value: any) => {
    setAccouchementForm(prev => ({
      ...prev,
      nouveauNe: {
        ...prev.nouveauNe,
        [field]: value
      }
    }));
  };

  const handleSoinsChange = (field: string, value: any) => {
    setAccouchementForm(prev => ({
      ...prev,
      soinsPostAccouchement: {
        ...prev.soinsPostAccouchement,
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSaveAccouchement(accouchementForm);
    setOpenDialog(false);
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'voie_basse': return 'success';
      case 'cesarienne': return 'warning';
      case 'forceps': return 'info';
      case 'ventouse': return 'secondary';
      default: return 'default';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_cours': return 'warning';
      case 'termine': return 'success';
      case 'complications': return 'error';
      default: return 'default';
    }
  };

  // Données de démonstration
  const accouchementsExistants = patiente?.accouchements || [];

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Gestion des Accouchements - {patiente?.prenom} {patiente?.nom}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setAccouchementForm(prev => ({
              ...prev,
              date: new Date().toISOString().slice(0, 16)
            }));
            setOpenDialog(true);
          }}
        >
          Nouvel Accouchement
        </Button>
      </Box>

      {/* Alertes */}
      {patiente?.dateAccouchementPrevu && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Date d'accouchement prévue :</strong> {new Date(patiente.dateAccouchementPrevu).toLocaleDateString()}
          </Typography>
        </Alert>
      )}

      {/* Tableau des accouchements */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Historique des Accouchements
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date/Heure</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Durée Travail</TableCell>
                  <TableCell>Poids Bébé</TableCell>
                  <TableCell>Score Apgar</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accouchementsExistants.map((accouchement: any) => (
                  <TableRow key={accouchement.id}>
                    <TableCell>{new Date(accouchement.date).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={accouchement.mode}
                        color={getModeColor(accouchement.mode) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{accouchement.dureeTravail}h</TableCell>
                    <TableCell>{accouchement.nouveauNe?.poids}g</TableCell>
                    <TableCell>
                      {accouchement.nouveauNe?.scoreApgar1}/{accouchement.nouveauNe?.scoreApgar5}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={accouchement.statut}
                        color={getStatutColor(accouchement.statut) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setAccouchementForm(accouchement);
                          setOpenDialog(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setAccouchementForm(accouchement);
                          setIsEditing(true);
                          setOpenDialog(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog Accouchement */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {isEditing ? 'Modifier' : 'Nouvel'} Accouchement
            </Typography>
            <Chip
              label={accouchementForm.statut}
              color={getStatutColor(accouchementForm.statut) as any}
              icon={<LocalHospital />}
            />
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Informations générales */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Informations Générales
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Date et heure d'accouchement"
                type="datetime-local"
                value={accouchementForm.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Durée du travail (heures)"
                type="number"
                value={accouchementForm.dureeTravail}
                onChange={(e) => handleInputChange('dureeTravail', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Durée d'expulsion (minutes)"
                type="number"
                value={accouchementForm.dureeExpulsion}
                onChange={(e) => handleInputChange('dureeExpulsion', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Mode d'accouchement */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Mode d'Accouchement
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Mode d'accouchement</InputLabel>
                <Select
                  value={accouchementForm.mode}
                  onChange={(e) => handleInputChange('mode', e.target.value)}
                  disabled={!isEditing}
                  label="Mode d'accouchement"
                >
                  <MenuItem value="voie_basse">Voie basse</MenuItem>
                  <MenuItem value="cesarienne">Césarienne</MenuItem>
                  <MenuItem value="forceps">Forceps</MenuItem>
                  <MenuItem value="ventouse">Ventouse</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Indication"
                value={accouchementForm.indication}
                onChange={(e) => handleInputChange('indication', e.target.value)}
                disabled={!isEditing}
                placeholder="Détresse fœtale, stagnation, etc."
              />
            </Grid>

            {/* Interventions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Interventions
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={accouchementForm.interventions.episiotomie}
                    onChange={(e) => handleInterventionsChange('episiotomie', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Épisiotomie"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={accouchementForm.interventions.forceps}
                    onChange={(e) => handleInterventionsChange('forceps', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Forceps"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={accouchementForm.interventions.ventouse}
                    onChange={(e) => handleInterventionsChange('ventouse', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Ventouse"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={accouchementForm.interventions.cesarienne}
                    onChange={(e) => handleInterventionsChange('cesarienne', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Césarienne"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Autres interventions"
                value={accouchementForm.interventions.autres}
                onChange={(e) => handleInterventionsChange('autres', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Complications maternelles */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Complications Maternelles
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={accouchementForm.complicationsMaternelles.hemorragie}
                    onChange={(e) => handleComplicationsChange('hemorragie', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Hémorragie"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={accouchementForm.complicationsMaternelles.dechirure}
                    onChange={(e) => handleComplicationsChange('dechirure', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Déchirure"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={accouchementForm.complicationsMaternelles.infection}
                    onChange={(e) => handleComplicationsChange('infection', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Infection"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={accouchementForm.complicationsMaternelles.hypertension}
                    onChange={(e) => handleComplicationsChange('hypertension', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Hypertension"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Autres complications"
                value={accouchementForm.complicationsMaternelles.autres}
                onChange={(e) => handleComplicationsChange('autres', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Informations du nouveau-né */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Informations du Nouveau-né
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sexe</InputLabel>
                <Select
                  value={accouchementForm.nouveauNe.sexe}
                  onChange={(e) => handleNouveauNeChange('sexe', e.target.value)}
                  disabled={!isEditing}
                  label="Sexe"
                >
                  <MenuItem value="M">Masculin</MenuItem>
                  <MenuItem value="F">Féminin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Poids (g)"
                type="number"
                value={accouchementForm.nouveauNe.poids}
                onChange={(e) => handleNouveauNeChange('poids', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Taille (cm)"
                type="number"
                value={accouchementForm.nouveauNe.taille}
                onChange={(e) => handleNouveauNeChange('taille', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Périmètre crânien (cm)"
                type="number"
                value={accouchementForm.nouveauNe.perimetreCranien}
                onChange={(e) => handleNouveauNeChange('perimetreCranien', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Score Apgar */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Score Apgar
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Apgar 1 min"
                type="number"
                value={accouchementForm.nouveauNe.scoreApgar1}
                onChange={(e) => handleNouveauNeChange('scoreApgar1', parseInt(e.target.value) || 0)}
                disabled={!isEditing}
                inputProps={{ min: 0, max: 10 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Apgar 5 min"
                type="number"
                value={accouchementForm.nouveauNe.scoreApgar5}
                onChange={(e) => handleNouveauNeChange('scoreApgar5', parseInt(e.target.value) || 0)}
                disabled={!isEditing}
                inputProps={{ min: 0, max: 10 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Apgar 10 min"
                type="number"
                value={accouchementForm.nouveauNe.scoreApgar10}
                onChange={(e) => handleNouveauNeChange('scoreApgar10', parseInt(e.target.value) || 0)}
                disabled={!isEditing}
                inputProps={{ min: 0, max: 10 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Allaitement</InputLabel>
                <Select
                  value={accouchementForm.nouveauNe.allaitement}
                  onChange={(e) => handleNouveauNeChange('allaitement', e.target.value)}
                  disabled={!isEditing}
                  label="Allaitement"
                >
                  <MenuItem value="maternel">Maternel</MenuItem>
                  <MenuItem value="artificiel">Artificiel</MenuItem>
                  <MenuItem value="mixte">Mixte</MenuItem>
                  <MenuItem value="aucun">Aucun</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={accouchementForm.nouveauNe.statut}
                  onChange={(e) => handleNouveauNeChange('statut', e.target.value)}
                  disabled={!isEditing}
                  label="Statut"
                >
                  <MenuItem value="vivant">Vivant</MenuItem>
                  <MenuItem value="decede">Décédé</MenuItem>
                  <MenuItem value="en_detresse">En détresse</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Complications du nouveau-né"
                multiline
                rows={2}
                value={accouchementForm.nouveauNe.complications}
                onChange={(e) => handleNouveauNeChange('complications', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Soins post-accouchement */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Soins Post-Accouchement
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Durée d'hospitalisation (jours)"
                type="number"
                value={accouchementForm.soinsPostAccouchement.dureeHospitalisation}
                onChange={(e) => handleSoinsChange('dureeHospitalisation', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Date de sortie"
                type="date"
                value={accouchementForm.soinsPostAccouchement.sortie}
                onChange={(e) => handleSoinsChange('sortie', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={accouchementForm.statut}
                  onChange={(e) => handleInputChange('statut', e.target.value)}
                  disabled={!isEditing}
                  label="Statut"
                >
                  <MenuItem value="en_cours">En cours</MenuItem>
                  <MenuItem value="termine">Terminé</MenuItem>
                  <MenuItem value="complications">Complications</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Complications post-accouchement"
                multiline
                rows={2}
                value={accouchementForm.soinsPostAccouchement.complications}
                onChange={(e) => handleSoinsChange('complications', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Traitement prescrit"
                multiline
                rows={2}
                value={accouchementForm.soinsPostAccouchement.traitement}
                onChange={(e) => handleSoinsChange('traitement', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Observations générales */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Observations Générales
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations"
                multiline
                rows={4}
                value={accouchementForm.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Personnel présent"
                value={accouchementForm.personnel}
                onChange={(e) => handleInputChange('personnel', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          {isEditing && (
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
            >
              Sauvegarder
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionAccouchement;

