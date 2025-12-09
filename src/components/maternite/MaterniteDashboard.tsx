import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PregnantWoman,
  Event,
  Warning,
  CheckCircle,
  ChildCare,
  LocalHospital,
  Schedule,
  TrendingUp,
  TrendingDown,
  Assessment,
  Notifications,
  Refresh,
  FilterList,
  Add,
  Visibility,
} from '@mui/icons-material';

interface MaterniteDashboardProps {
  patientes: any[];
  accouchements: any[];
  consultations: any[];
  alertes: any[];
  onRefresh: () => void;
  onViewDetails: (type: string, id: string) => void;
  onExportData: (format: string) => void;
  onNouvellePatiente: () => void;
}

const MaterniteDashboard: React.FC<MaterniteDashboardProps> = ({
  patientes,
  accouchements,
  consultations,
  alertes,
  onRefresh,
  onViewDetails,
  onExportData,
  onNouvellePatiente,
}) => {
  const [selectedPeriode, setSelectedPeriode] = useState('30j');
  const [openFilters, setOpenFilters] = useState(false);

  // Calcul des statistiques en temps réel
  const stats = useMemo(() => {
    const maintenant = new Date();
    const periodeStart = new Date(maintenant.getTime() - (selectedPeriode === '7j' ? 7 : selectedPeriode === '30j' ? 30 : 90) * 24 * 60 * 60 * 1000);
    
    // Patientes en suivi
    const patientesEnSuivi = patientes.filter(p => p.statut === 'suivi').length;
    const patientesEnAccouchement = patientes.filter(p => p.statut === 'accouchement').length;
    const patientesPostPartum = patientes.filter(p => p.statut === 'post_partum').length;
    
    // Accouchements
    const accouchementsPeriode = accouchements.filter(a => new Date(a.date) >= periodeStart).length;
    const accouchementsCeMois = accouchements.filter(a => {
      const dateAcc = new Date(a.date);
      return dateAcc.getMonth() === maintenant.getMonth() && dateAcc.getFullYear() === maintenant.getFullYear();
    }).length;
    
    // Consultations
    const consultationsPeriode = consultations.filter(c => new Date(c.date) >= periodeStart).length;
    const cpnManquees = consultations.filter(c => c.statut === 'manquee').length;
    
    // Alertes
    const alertesCritiques = alertes.filter(a => a.niveau === 'critique').length;
    const alertesWarnings = alertes.filter(a => a.niveau === 'warning').length;
    
    // Grossesses à risque
    const grossessesRisque = patientes.filter(p => p.risque === 'eleve').length;
    
    // Accouchements prévus cette semaine
    const accouchementsCetteSemaine = patientes.filter(p => {
      const dpa = new Date(p.dateAccouchementPrevu);
      const diffJours = (dpa.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24);
      return diffJours <= 7 && diffJours >= 0;
    }).length;
    
    // Nouveau-nés
    const nouveauxNes = accouchements.filter(a => {
      const dateAcc = new Date(a.date);
      const diffJours = (maintenant.getTime() - dateAcc.getTime()) / (1000 * 60 * 60 * 24);
      return diffJours <= 30; // Nouveau-nés de moins de 30 jours
    }).length;
    
    // Taux de césarienne
    const cesariennes = accouchements.filter(a => a.mode === 'cesarienne').length;
    const tauxCesarienne = accouchements.length > 0 ? (cesariennes / accouchements.length) * 100 : 0;
    
    // Mortalité maternelle et néonatale
    const mortaliteMaternelle = accouchements.filter(a => a.complications?.includes('mort_maternelle')).length;
    const mortaliteNeonatale = accouchements.filter(a => a.bebe?.statut === 'decede').length;
    
    return {
      patientesEnSuivi,
      patientesEnAccouchement,
      patientesPostPartum,
      accouchementsPeriode,
      accouchementsCeMois,
      consultationsPeriode,
      cpnManquees,
      alertesCritiques,
      alertesWarnings,
      grossessesRisque,
      accouchementsCetteSemaine,
      nouveauxNes,
      tauxCesarienne,
      mortaliteMaternelle,
      mortaliteNeonatale,
    };
  }, [patientes, accouchements, consultations, alertes, selectedPeriode]);

  // Données pour les graphiques (simulation)
  const chartData = useMemo(() => {
    const jours = selectedPeriode === '7j' ? 7 : selectedPeriode === '30j' ? 30 : 90;
    const data = [];
    
    for (let i = jours - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const consultations = Math.floor(Math.random() * 8) + 2;
      const accouchements = Math.floor(Math.random() * 3);
      
      data.push({
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        consultations,
        accouchements,
      });
    }
    
    return data;
  }, [selectedPeriode]);

  return (
    <Box>
      {/* En-tête avec contrôles */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Tableau de Bord Maternité - Suivi Temps Réel
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onNouvellePatiente}
          >
            Nouvelle Patiente
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setOpenFilters(true)}
          >
            Filtres
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRefresh}
          >
            Actualiser
          </Button>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => onExportData('excel')}
          >
            Exporter
          </Button>
        </Box>
      </Box>

      {/* Alertes critiques */}
      {stats.alertesCritiques > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">
            {stats.alertesCritiques} alerte(s) critique(s) nécessitent une attention immédiate
          </Typography>
        </Alert>
      )}

      {/* Métriques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PregnantWoman sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Patientes en Suivi
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.patientesEnSuivi}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stats.grossessesRisque} grossesses à risque
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Event sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Accouchements Cette Semaine
                  </Typography>
                  <Typography variant="h4" component="div" color="warning.main">
                    {stats.accouchementsCetteSemaine}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stats.accouchementsCeMois} ce mois
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ChildCare sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Nouveau-nés
                  </Typography>
                  <Typography variant="h4" component="div" color="success.main">
                    {stats.nouveauxNes}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Derniers 30 jours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Alertes Actives
                  </Typography>
                  <Typography variant="h4" component="div" color="error.main">
                    {stats.alertesCritiques + stats.alertesWarnings}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stats.alertesCritiques} critiques • {stats.alertesWarnings} warnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Indicateurs de performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Indicateurs de Performance
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Taux de Césarienne</Typography>
                    <Typography variant="body2">{stats.tauxCesarienne.toFixed(1)}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.tauxCesarienne} 
                    color={stats.tauxCesarienne > 15 ? 'warning' : 'success'}
                  />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">CPN Complètes</Typography>
                    <Typography variant="body2">
                      {patientes.length > 0 ? ((patientes.filter(p => p.cpnCompletes >= 4).length / patientes.length) * 100).toFixed(1) : 0}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={patientes.length > 0 ? (patientes.filter(p => p.cpnCompletes >= 4).length / patientes.length) * 100 : 0} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Consultations Période</Typography>
                    <Typography variant="body2">{stats.consultationsPeriode}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min((stats.consultationsPeriode / 100) * 100, 100)} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activité Récente
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${stats.consultationsPeriode} consultations`}
                    secondary="Cette période"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Event color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${stats.accouchementsPeriode} accouchements`}
                    secondary="Cette période"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Warning color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${stats.cpnManquees} CPN manquées`}
                    secondary="À rattraper"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ChildCare color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${stats.nouveauxNes} nouveau-nés`}
                    secondary="Derniers 30 jours"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphiques d'activité */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activité Maternité - {selectedPeriode}
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'end', gap: 1, p: 2 }}>
                {chartData.map((item, index) => (
                  <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                      <Box
                        sx={{
                          height: `${(item.consultations / 10) * 100}px`,
                          width: '20px',
                          backgroundColor: 'primary.main',
                          borderRadius: '2px 2px 0 0',
                        }}
                      />
                      <Box
                        sx={{
                          height: `${(item.accouchements / 3) * 100}px`,
                          width: '20px',
                          backgroundColor: 'success.main',
                          borderRadius: '0 0 2px 2px',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {item.date}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Chip label="Consultations" color="primary" size="small" />
                <Chip label="Accouchements" color="success" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alertes Prioritaires
              </Typography>
              <List>
                {alertes.slice(0, 5).map((alerte) => (
                  <ListItem key={alerte.id} divider>
                    <ListItemIcon>
                      {alerte.niveau === 'critique' ? (
                        <Warning color="error" />
                      ) : (
                        <Notifications color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={alerte.message}
                      secondary={`${alerte.type} • ${new Date(alerte.dateCreation).toLocaleDateString()}`}
                    />
                    <IconButton
                      size="small"
                      onClick={() => onViewDetails('alerte', alerte.id)}
                    >
                      <Visibility />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions rapides */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions Rapides
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<PregnantWoman />}
                  onClick={() => onViewDetails('nouvelle_patiente', '')}
                >
                  Nouvelle Patiente
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Event />}
                  onClick={() => onViewDetails('consultation', '')}
                >
                  Nouvelle Consultation
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LocalHospital />}
                  onClick={() => onViewDetails('accouchement', '')}
                >
                  Enregistrer Accouchement
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  onClick={() => onViewDetails('rapport', '')}
                >
                  Générer Rapport
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Indicateurs OMS
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Mortalité Maternelle</Typography>
                  <Typography variant="body2" color={stats.mortaliteMaternelle > 0 ? 'error.main' : 'success.main'}>
                    {stats.mortaliteMaternelle}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Mortalité Néonatale</Typography>
                  <Typography variant="body2" color={stats.mortaliteNeonatale > 0 ? 'error.main' : 'success.main'}>
                    {stats.mortaliteNeonatale}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Taux de Césarienne</Typography>
                  <Typography variant="body2" color={stats.tauxCesarienne > 15 ? 'warning.main' : 'success.main'}>
                    {stats.tauxCesarienne.toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">CPN Complètes</Typography>
                  <Typography variant="body2" color="success.main">
                    {patientes.length > 0 ? ((patientes.filter(p => p.cpnCompletes >= 4).length / patientes.length) * 100).toFixed(1) : 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de filtres */}
      <Dialog open={openFilters} onClose={() => setOpenFilters(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filtres du Tableau de Bord</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Période</InputLabel>
              <Select
                value={selectedPeriode}
                onChange={(e) => setSelectedPeriode(e.target.value)}
                label="Période"
              >
                <MenuItem value="7j">7 derniers jours</MenuItem>
                <MenuItem value="30j">30 derniers jours</MenuItem>
                <MenuItem value="90j">90 derniers jours</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFilters(false)}>Annuler</Button>
          <Button onClick={() => setOpenFilters(false)} variant="contained">
            Appliquer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaterniteDashboard;

