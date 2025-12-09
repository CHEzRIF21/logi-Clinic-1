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
} from '@mui/material';
import {
  Add,
  Edit,
  Save,
  Cancel,
  Visibility,
  PregnantWoman,
  Event,
  Warning,
  CheckCircle,
  Schedule,
  Assessment,
  LocalHospital,
  Vaccines,
} from '@mui/icons-material';

interface GestionCPNProps {
  patiente: any;
  onSaveCPN: (cpn: any) => void;
  onClose: () => void;
}

const GestionCPN: React.FC<GestionCPNProps> = ({
  patiente,
  onSaveCPN,
  onClose,
}) => {
  const [cpnForm, setCpnForm] = useState({
    id: '',
    patienteId: patiente?.id || '',
    numeroCPN: 1,
    date: new Date().toISOString().split('T')[0],
    ageGestationnel: 0,
    
    // Signes vitaux
    tension: '',
    poids: 0,
    taille: 0,
    temperature: 0,
    pouls: 0,
    
    // Examen clinique
    hauteurUterine: 0,
    presentation: '',
    bruitsCardiaques: '',
    mouvementsActifs: false,
    
    // Examens complémentaires
    examens: {
      hemoglobine: '',
      glycemie: '',
      proteines: '',
      albumine: '',
      autres: '',
    },
    
    // Vaccinations
    vaccinations: {
      tetanos: false,
      grippe: false,
      autres: '',
    },
    
    // Conseils et prescriptions
    conseils: '',
    prescriptions: '',
    prochaineVisite: '',
    
    // Observations
    observations: '',
    complications: '',
    statut: 'programmee',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  // Calcul automatique de l'âge gestationnel
  const calculerAgeGestationnel = (ddr: string, dateCPN: string) => {
    if (!ddr || !dateCPN) return 0;
    const dateDDR = new Date(ddr);
    const dateCPN_ = new Date(dateCPN);
    const diffJours = (dateCPN_.getTime() - dateDDR.getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor(diffJours / 7);
  };

  // Mise à jour automatique de l'âge gestationnel
  useEffect(() => {
    if (cpnForm.date && patiente?.dateDerniereRegles) {
      const ageGest = calculerAgeGestationnel(patiente.dateDerniereRegles, cpnForm.date);
      setCpnForm(prev => ({ ...prev, ageGestationnel: ageGest }));
    }
  }, [cpnForm.date, patiente?.dateDerniereRegles]);

  const handleInputChange = (field: string, value: any) => {
    setCpnForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExamensChange = (field: string, value: any) => {
    setCpnForm(prev => ({
      ...prev,
      examens: {
        ...prev.examens,
        [field]: value
      }
    }));
  };

  const handleVaccinationsChange = (field: string, value: any) => {
    setCpnForm(prev => ({
      ...prev,
      vaccinations: {
        ...prev.vaccinations,
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSaveCPN(cpnForm);
    setOpenDialog(false);
  };

  const getCPNColor = (numero: number) => {
    switch (numero) {
      case 1: return 'primary';
      case 2: return 'secondary';
      case 3: return 'success';
      case 4: return 'warning';
      default: return 'default';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'programmee': return 'info';
      case 'terminee': return 'success';
      case 'manquee': return 'error';
      default: return 'default';
    }
  };

  // Données de démonstration pour les CPN existantes
  const cpnExistantes = patiente?.consultations || [
    {
      id: '1',
      numeroCPN: 1,
      date: '2024-01-15',
      ageGestationnel: 12,
      tension: '12/8',
      poids: 65,
      observations: 'Première consultation, grossesse normale',
      statut: 'terminee'
    },
    {
      id: '2',
      numeroCPN: 2,
      date: '2024-02-15',
      ageGestationnel: 20,
      tension: '13/8',
      poids: 68,
      observations: 'Échographie morphologique normale',
      statut: 'terminee'
    }
  ];

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Gestion des Consultations Prénatales - {patiente?.prenom} {patiente?.nom}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setCpnForm(prev => ({
              ...prev,
              numeroCPN: cpnExistantes.length + 1,
              date: new Date().toISOString().split('T')[0]
            }));
            setOpenDialog(true);
          }}
        >
          Nouvelle CPN
        </Button>
      </Box>

      {/* Alertes et recommandations */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Recommandations OMS :</strong> Au minimum 4 consultations prénatales (CPN1, CPN2, CPN3, CPN4) 
          aux semaines 12, 20, 28 et 36 de grossesse.
        </Typography>
      </Alert>

      {/* Tableau des CPN */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Historique des Consultations Prénatales
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>CPN</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Âge Gestationnel</TableCell>
                  <TableCell>Tension</TableCell>
                  <TableCell>Poids</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Observations</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cpnExistantes.map((cpn: any) => (
                  <TableRow key={cpn.id}>
                    <TableCell>
                      <Chip
                        label={`CPN${cpn.numeroCPN}`}
                        color={getCPNColor(cpn.numeroCPN) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(cpn.date).toLocaleDateString()}</TableCell>
                    <TableCell>{cpn.ageGestationnel} SA</TableCell>
                    <TableCell>{cpn.tension}</TableCell>
                    <TableCell>{cpn.poids} kg</TableCell>
                    <TableCell>
                      <Chip
                        label={cpn.statut}
                        color={getStatutColor(cpn.statut) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{cpn.observations}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setCpnForm(cpn);
                          setOpenDialog(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setCpnForm(cpn);
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

      {/* Dialog CPN */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {isEditing ? 'Modifier' : 'Nouvelle'} CPN{cpnForm.numeroCPN}
            </Typography>
            <Chip
              label={`${cpnForm.ageGestationnel} SA`}
              color="info"
              icon={<Schedule />}
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
                label="Date de consultation"
                type="date"
                value={cpnForm.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Numéro CPN"
                type="number"
                value={cpnForm.numeroCPN}
                onChange={(e) => handleInputChange('numeroCPN', parseInt(e.target.value) || 1)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Âge gestationnel"
                value={`${cpnForm.ageGestationnel} semaines d'aménorrhée`}
                disabled
              />
            </Grid>

            {/* Signes vitaux */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Signes Vitaux
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Tension artérielle"
                value={cpnForm.tension}
                onChange={(e) => handleInputChange('tension', e.target.value)}
                disabled={!isEditing}
                placeholder="12/8"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Poids (kg)"
                type="number"
                value={cpnForm.poids}
                onChange={(e) => handleInputChange('poids', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Température (°C)"
                type="number"
                value={cpnForm.temperature}
                onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Pouls (bpm)"
                type="number"
                value={cpnForm.pouls}
                onChange={(e) => handleInputChange('pouls', parseInt(e.target.value) || 0)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Examen clinique */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Examen Clinique
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Hauteur utérine (cm)"
                type="number"
                value={cpnForm.hauteurUterine}
                onChange={(e) => handleInputChange('hauteurUterine', parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Présentation</InputLabel>
                <Select
                  value={cpnForm.presentation}
                  onChange={(e) => handleInputChange('presentation', e.target.value)}
                  disabled={!isEditing}
                  label="Présentation"
                >
                  <MenuItem value="cephalique">Céphalique</MenuItem>
                  <MenuItem value="breech">Siège</MenuItem>
                  <MenuItem value="transverse">Transverse</MenuItem>
                  <MenuItem value="variable">Variable</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Bruits cardiaques fœtaux"
                value={cpnForm.bruitsCardiaques}
                onChange={(e) => handleInputChange('bruitsCardiaques', e.target.value)}
                disabled={!isEditing}
                placeholder="140 bpm"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={cpnForm.mouvementsActifs}
                    onChange={(e) => handleInputChange('mouvementsActifs', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Mouvements actifs du fœtus"
              />
            </Grid>

            {/* Examens complémentaires */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Examens Complémentaires
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hémoglobine (g/dL)"
                value={cpnForm.examens.hemoglobine}
                onChange={(e) => handleExamensChange('hemoglobine', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Glycémie (g/L)"
                value={cpnForm.examens.glycemie}
                onChange={(e) => handleExamensChange('glycemie', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Protéinurie"
                value={cpnForm.examens.proteines}
                onChange={(e) => handleExamensChange('proteines', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Albumine"
                value={cpnForm.examens.albumine}
                onChange={(e) => handleExamensChange('albumine', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Autres examens"
                multiline
                rows={2}
                value={cpnForm.examens.autres}
                onChange={(e) => handleExamensChange('autres', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Vaccinations */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Vaccinations
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={cpnForm.vaccinations.tetanos}
                    onChange={(e) => handleVaccinationsChange('tetanos', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Vaccin Tétanos"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={cpnForm.vaccinations.grippe}
                    onChange={(e) => handleVaccinationsChange('grippe', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Vaccin Grippe"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Autres vaccinations"
                value={cpnForm.vaccinations.autres}
                onChange={(e) => handleVaccinationsChange('autres', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Conseils et prescriptions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Conseils et Prescriptions
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Conseils donnés"
                multiline
                rows={3}
                value={cpnForm.conseils}
                onChange={(e) => handleInputChange('conseils', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Prescriptions"
                multiline
                rows={3}
                value={cpnForm.prescriptions}
                onChange={(e) => handleInputChange('prescriptions', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prochaine visite"
                type="date"
                value={cpnForm.prochaineVisite}
                onChange={(e) => handleInputChange('prochaineVisite', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={cpnForm.statut}
                  onChange={(e) => handleInputChange('statut', e.target.value)}
                  disabled={!isEditing}
                  label="Statut"
                >
                  <MenuItem value="programmee">Programmée</MenuItem>
                  <MenuItem value="terminee">Terminée</MenuItem>
                  <MenuItem value="manquee">Manquée</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Observations */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Observations
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations générales"
                multiline
                rows={3}
                value={cpnForm.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Complications"
                multiline
                rows={2}
                value={cpnForm.complications}
                onChange={(e) => handleInputChange('complications', e.target.value)}
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

export default GestionCPN;

