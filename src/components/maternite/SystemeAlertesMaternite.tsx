import React, { useState, useEffect, useMemo } from 'react';
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
  Switch,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  Schedule,
  PregnantWoman,
  ChildCare,
  LocalHospital,
  Notifications,
  Settings,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Add,
  ExpandMore,
} from '@mui/icons-material';

interface SystemeAlertesMaterniteProps {
  patientes: any[];
  consultations: any[];
  accouchements: any[];
  onCreerAlerte: (alerte: any) => void;
  onResoudreAlerte: (id: string) => void;
  onIgnorerAlerte: (id: string) => void;
  onConfigurerAlertes: (config: any) => void;
}

const SystemeAlertesMaternite: React.FC<SystemeAlertesMaterniteProps> = ({
  patientes,
  consultations,
  accouchements,
  onCreerAlerte,
  onResoudreAlerte,
  onIgnorerAlerte,
  onConfigurerAlertes,
}) => {
  const [alertes, setAlertes] = useState<any[]>([]);
  const [openConfig, setOpenConfig] = useState(false);
  const [openNouvelleAlerte, setOpenNouvelleAlerte] = useState(false);
  const [configAlertes, setConfigAlertes] = useState({
    // Seuils pour les alertes
    seuils: {
      tensionMax: 14,
      tensionMin: 9,
      poidsGainMax: 15,
      ageGestationnelMax: 42,
      scoreApgarMin: 7,
    },
    // Alertes automatiques
    alertesAuto: {
      cpnManquee: true,
      grossesseRisque: true,
      accouchementProche: true,
      tensionElevee: true,
      poidsExcessif: true,
      scoreApgarBas: true,
    },
    // Notifications
    notifications: {
      email: true,
      sms: false,
      popup: true,
    },
  });

  const [nouvelleAlerte, setNouvelleAlerte] = useState({
    type: '',
    niveau: 'warning',
    message: '',
    patienteId: '',
    dateEcheance: '',
    priorite: 'normale',
    description: '',
  });

  // Génération automatique des alertes
  const genererAlertesAutomatiques = useMemo(() => {
    const nouvellesAlertes: any[] = [];
    const maintenant = new Date();

    patientes.forEach(patiente => {
      // CPN manquées
      if (configAlertes.alertesAuto.cpnManquee) {
        const cpnManquees = consultations.filter(c => 
          c.patienteId === patiente.id && c.statut === 'manquee'
        );
        if (cpnManquees.length > 0) {
          nouvellesAlertes.push({
            id: `CPN_${patiente.id}`,
            type: 'cpn_manquee',
            niveau: 'warning',
            message: `CPN manquée pour ${patiente.prenom} ${patiente.nom}`,
            patienteId: patiente.id,
            dateCreation: maintenant.toISOString(),
            statut: 'active',
            priorite: 'normale',
            description: `${cpnManquees.length} consultation(s) prénatale(s) manquée(s)`,
          });
        }
      }

      // Grossesse à risque
      if (configAlertes.alertesAuto.grossesseRisque && patiente.risque === 'eleve') {
        nouvellesAlertes.push({
          id: `RISQUE_${patiente.id}`,
          type: 'grossesse_risque',
          niveau: 'error',
          message: `Grossesse à risque pour ${patiente.prenom} ${patiente.nom}`,
          patienteId: patiente.id,
          dateCreation: maintenant.toISOString(),
          statut: 'active',
          priorite: 'elevee',
          description: 'Surveillance renforcée requise',
        });
      }

      // Accouchement proche
      if (configAlertes.alertesAuto.accouchementProche && patiente.dateAccouchementPrevu) {
        const dpa = new Date(patiente.dateAccouchementPrevu);
        const diffJours = (dpa.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffJours <= 7 && diffJours >= 0) {
          nouvellesAlertes.push({
            id: `DPA_${patiente.id}`,
            type: 'accouchement_proche',
            niveau: 'warning',
            message: `Accouchement prévu dans ${Math.ceil(diffJours)} jour(s) pour ${patiente.prenom} ${patiente.nom}`,
            patienteId: patiente.id,
            dateCreation: maintenant.toISOString(),
            statut: 'active',
            priorite: 'elevee',
            description: `Date d'accouchement prévue: ${dpa.toLocaleDateString()}`,
          });
        }
      }

      // Tension élevée
      if (configAlertes.alertesAuto.tensionElevee) {
        const derniereConsultation = consultations
          .filter(c => c.patienteId === patiente.id && c.statut === 'terminee')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (derniereConsultation && derniereConsultation.tension) {
          const tension = derniereConsultation.tension.split('/');
          const systolique = parseInt(tension[0]);
          const diastolique = parseInt(tension[1]);
          
          if (systolique >= configAlertes.seuils.tensionMax || diastolique >= 9) {
            nouvellesAlertes.push({
              id: `TENSION_${patiente.id}`,
              type: 'tension_elevee',
              niveau: 'error',
              message: `Tension élevée pour ${patiente.prenom} ${patiente.nom}`,
              patienteId: patiente.id,
              dateCreation: maintenant.toISOString(),
              statut: 'active',
              priorite: 'elevee',
              description: `Tension: ${derniereConsultation.tension} (seuil: ${configAlertes.seuils.tensionMax}/9)`,
            });
          }
        }
      }
    });

    // Score Apgar bas
    if (configAlertes.alertesAuto.scoreApgarBas) {
      accouchements.forEach(accouchement => {
        if (accouchement.nouveauNe && accouchement.nouveauNe.scoreApgar5 < configAlertes.seuils.scoreApgarMin) {
          nouvellesAlertes.push({
            id: `APGAR_${accouchement.id}`,
            type: 'score_apgar_bas',
            niveau: 'error',
            message: `Score Apgar bas pour le nouveau-né de ${accouchement.patienteId}`,
            patienteId: accouchement.patienteId,
            dateCreation: maintenant.toISOString(),
            statut: 'active',
            priorite: 'critique',
            description: `Score Apgar 5min: ${accouchement.nouveauNe.scoreApgar5} (seuil: ${configAlertes.seuils.scoreApgarMin})`,
          });
        }
      });
    }

    return nouvellesAlertes;
  }, [patientes, consultations, accouchements, configAlertes]);

  // Mise à jour des alertes
  useEffect(() => {
    setAlertes(genererAlertesAutomatiques);
  }, [genererAlertesAutomatiques]);

  const handleCreerAlerte = () => {
    const alerte = {
      ...nouvelleAlerte,
      id: `MANUAL_${Date.now()}`,
      dateCreation: new Date().toISOString(),
      statut: 'active',
    };
    onCreerAlerte(alerte);
    setNouvelleAlerte({
      type: '',
      niveau: 'warning',
      message: '',
      patienteId: '',
      dateEcheance: '',
      priorite: 'normale',
      description: '',
    });
    setOpenNouvelleAlerte(false);
  };

  const handleConfigurer = () => {
    onConfigurerAlertes(configAlertes);
    setOpenConfig(false);
  };

  const getNiveauColor = (niveau: string) => {
    switch (niveau) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getNiveauIcon = (niveau: string) => {
    switch (niveau) {
      case 'error': return <Error />;
      case 'warning': return <Warning />;
      case 'info': return <Info />;
      default: return <Notifications />;
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'critique': return 'error';
      case 'elevee': return 'warning';
      case 'normale': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cpn_manquee': return <Schedule />;
      case 'grossesse_risque': return <PregnantWoman />;
      case 'accouchement_proche': return <LocalHospital />;
      case 'tension_elevee': return <Warning />;
      case 'score_apgar_bas': return <ChildCare />;
      default: return <Notifications />;
    }
  };

  const alertesActives = alertes.filter(a => a.statut === 'active');
  const alertesCritiques = alertesActives.filter(a => a.niveau === 'error');
  const alertesWarnings = alertesActives.filter(a => a.niveau === 'warning');

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Système d'Alertes Maternité
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setOpenConfig(true)}
          >
            Configuration
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenNouvelleAlerte(true)}
          >
            Nouvelle Alerte
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => setAlertes(genererAlertesAutomatiques)}
          >
            Actualiser
          </Button>
        </Box>
      </Box>

      {/* Résumé des alertes */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Error sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="error.main">
                    {alertesCritiques.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Alertes Critiques
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {alertesWarnings.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Alertes Warnings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Notifications sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="info.main">
                    {alertesActives.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Actives
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="success.main">
                    {alertes.filter(a => a.statut === 'resolue').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Résolues
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Liste des alertes */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alertes Actives
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Niveau</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Priorité</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alertesActives.map((alerte) => (
                  <TableRow key={alerte.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getTypeIcon(alerte.type)}
                        <Typography sx={{ ml: 1 }}>
                          {alerte.type.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alerte.niveau}
                        color={getNiveauColor(alerte.niveau) as any}
                        size="small"
                        icon={getNiveauIcon(alerte.niveau)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {alerte.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {alerte.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alerte.priorite}
                        color={getPrioriteColor(alerte.priorite) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(alerte.dateCreation).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alerte.statut}
                        color={alerte.statut === 'active' ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => onResoudreAlerte(alerte.id)}
                        color="success"
                      >
                        <CheckCircle />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onIgnorerAlerte(alerte.id)}
                        color="warning"
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog Configuration */}
      <Dialog open={openConfig} onClose={() => setOpenConfig(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configuration des Alertes</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Seuils */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Seuils d'Alerte
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Tension artérielle maximale (systolique)</Typography>
              <Slider
                value={configAlertes.seuils.tensionMax}
                onChange={(e, value) => setConfigAlertes(prev => ({
                  ...prev,
                  seuils: { ...prev.seuils, tensionMax: value as number }
                }))}
                min={10}
                max={20}
                step={0.5}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Score Apgar minimum</Typography>
              <Slider
                value={configAlertes.seuils.scoreApgarMin}
                onChange={(e, value) => setConfigAlertes(prev => ({
                  ...prev,
                  seuils: { ...prev.seuils, scoreApgarMin: value as number }
                }))}
                min={0}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>

            {/* Alertes automatiques */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Alertes Automatiques
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configAlertes.alertesAuto.cpnManquee}
                    onChange={(e) => setConfigAlertes(prev => ({
                      ...prev,
                      alertesAuto: { ...prev.alertesAuto, cpnManquee: e.target.checked }
                    }))}
                  />
                }
                label="CPN manquées"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configAlertes.alertesAuto.grossesseRisque}
                    onChange={(e) => setConfigAlertes(prev => ({
                      ...prev,
                      alertesAuto: { ...prev.alertesAuto, grossesseRisque: e.target.checked }
                    }))}
                  />
                }
                label="Grossesses à risque"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configAlertes.alertesAuto.accouchementProche}
                    onChange={(e) => setConfigAlertes(prev => ({
                      ...prev,
                      alertesAuto: { ...prev.alertesAuto, accouchementProche: e.target.checked }
                    }))}
                  />
                }
                label="Accouchements proches"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configAlertes.alertesAuto.tensionElevee}
                    onChange={(e) => setConfigAlertes(prev => ({
                      ...prev,
                      alertesAuto: { ...prev.alertesAuto, tensionElevee: e.target.checked }
                    }))}
                  />
                }
                label="Tension élevée"
              />
            </Grid>

            {/* Notifications */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configAlertes.notifications.email}
                    onChange={(e) => setConfigAlertes(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: e.target.checked }
                    }))}
                  />
                }
                label="Email"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configAlertes.notifications.sms}
                    onChange={(e) => setConfigAlertes(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, sms: e.target.checked }
                    }))}
                  />
                }
                label="SMS"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configAlertes.notifications.popup}
                    onChange={(e) => setConfigAlertes(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, popup: e.target.checked }
                    }))}
                  />
                }
                label="Popup"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfig(false)}>Annuler</Button>
          <Button onClick={handleConfigurer} variant="contained">
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Nouvelle Alerte */}
      <Dialog open={openNouvelleAlerte} onClose={() => setOpenNouvelleAlerte(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle Alerte Manuelle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type d'alerte</InputLabel>
                <Select
                  value={nouvelleAlerte.type}
                  onChange={(e) => setNouvelleAlerte(prev => ({ ...prev, type: e.target.value }))}
                  label="Type d'alerte"
                >
                  <MenuItem value="cpn_manquee">CPN manquée</MenuItem>
                  <MenuItem value="grossesse_risque">Grossesse à risque</MenuItem>
                  <MenuItem value="accouchement_proche">Accouchement proche</MenuItem>
                  <MenuItem value="tension_elevee">Tension élevée</MenuItem>
                  <MenuItem value="score_apgar_bas">Score Apgar bas</MenuItem>
                  <MenuItem value="autre">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Niveau</InputLabel>
                <Select
                  value={nouvelleAlerte.niveau}
                  onChange={(e) => setNouvelleAlerte(prev => ({ ...prev, niveau: e.target.value }))}
                  label="Niveau"
                >
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priorité</InputLabel>
                <Select
                  value={nouvelleAlerte.priorite}
                  onChange={(e) => setNouvelleAlerte(prev => ({ ...prev, priorite: e.target.value }))}
                  label="Priorité"
                >
                  <MenuItem value="normale">Normale</MenuItem>
                  <MenuItem value="elevee">Élevée</MenuItem>
                  <MenuItem value="critique">Critique</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                value={nouvelleAlerte.message}
                onChange={(e) => setNouvelleAlerte(prev => ({ ...prev, message: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={nouvelleAlerte.description}
                onChange={(e) => setNouvelleAlerte(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Patiente</InputLabel>
                <Select
                  value={nouvelleAlerte.patienteId}
                  onChange={(e) => setNouvelleAlerte(prev => ({ ...prev, patienteId: e.target.value }))}
                  label="Patiente"
                >
                  {patientes.map(patiente => (
                    <MenuItem key={patiente.id} value={patiente.id}>
                      {patiente.prenom} {patiente.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date d'échéance"
                type="date"
                value={nouvelleAlerte.dateEcheance}
                onChange={(e) => setNouvelleAlerte(prev => ({ ...prev, dateEcheance: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNouvelleAlerte(false)}>Annuler</Button>
          <Button onClick={handleCreerAlerte} variant="contained">
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemeAlertesMaternite;

