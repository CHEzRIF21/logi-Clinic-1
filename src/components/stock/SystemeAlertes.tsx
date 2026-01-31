import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Alert,
  Tooltip,
  Button,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  Close,
  Settings,
  Refresh,
  FilterList,
  Notifications,
  NotificationsOff,
  TrendingUp,
  Inventory,
  LocalShipping,
  ReportProblem,
  Visibility,
} from '@mui/icons-material';
import { supabase } from '../../services/supabase';
import { getMyClinicId } from '../../services/clinicService';
import { StockService } from '../../services/stockService';

// Types pour les alertes
interface Alerte {
  id: string;
  type: 'stock_bas' | 'peremption' | 'perte_anormale' | 'rupture_stock' | 'transfert_requis' | 'inventaire_requis';
  niveau: 'critique' | 'avertissement' | 'information';
  titre: string;
  message: string;
  medicamentId: string;
  medicamentNom: string;
  medicamentCode: string;
  dateCreation: Date;
  dateResolution?: Date;
  statut: 'active' | 'resolue' | 'ignoree';
  priorite: number; // 1-5 (5 = critique)
  utilisateurCreation: string;
  utilisateurResolution?: string;
  actionsRecommandees: string[];
  donneesContexte: Record<string, any>;
}

interface ConfigurationAlerte {
  type: string;
  active: boolean;
  seuil: number;
  delaiAlerte: number; // en jours
  notificationEmail: boolean;
  notificationSMS: boolean;
  utilisateursNotifies: string[];
}

const SystemeAlertes: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [openConfig, setOpenConfig] = useState(false);
  const [selectedAlerte, setSelectedAlerte] = useState<Alerte | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreType, setFiltreType] = useState('tous');
  const [filtreNiveau, setFiltreNiveau] = useState('tous');

  // Configuration des alertes
  const [configAlertes, setConfigAlertes] = useState<ConfigurationAlerte[]>([
    {
      type: 'stock_bas',
      active: true,
      seuil: 20, // pourcentage
      delaiAlerte: 0,
      notificationEmail: true,
      notificationSMS: false,
      utilisateursNotifies: ['pharmacien', 'magasinier']
    },
    {
      type: 'peremption',
      active: true,
      seuil: 90, // jours
      delaiAlerte: 90,
      notificationEmail: true,
      notificationSMS: true,
      utilisateursNotifies: ['pharmacien', 'magasinier', 'responsable']
    },
    {
      type: 'perte_anormale',
      active: true,
      seuil: 10, // pourcentage
      delaiAlerte: 0,
      notificationEmail: true,
      notificationSMS: true,
      utilisateursNotifies: ['responsable', 'auditeur']
    },
    {
      type: 'rupture_stock',
      active: true,
      seuil: 0,
      delaiAlerte: 0,
      notificationEmail: true,
      notificationSMS: true,
      utilisateursNotifies: ['pharmacien', 'magasinier', 'responsable']
    }
  ]);

  // Fonction pour charger les alertes depuis la base de données
  const loadAlertes = async () => {
    try {
      setLoading(true);
      const clinicId = await getMyClinicId();
      
      if (!clinicId) {
        console.error('Contexte de clinique manquant');
        setLoading(false);
        return;
      }

      // Charger les alertes depuis alertes_stock avec filtrage par clinic_id
      const { data: alertesData, error: alertesError } = await supabase
        .from('alertes_stock')
        .select(`
          id,
          medicament_id,
          type,
          niveau,
          message,
          date_creation,
          date_resolution,
          statut,
          utilisateur_resolution_id,
          created_at,
          medicaments:medicament_id (
            id,
            nom,
            code
          )
        `)
        .eq('clinic_id', clinicId)
        .order('date_creation', { ascending: false });

      if (alertesError) {
        console.error('Erreur lors du chargement des alertes:', alertesError);
        setLoading(false);
        return;
      }

      // Mapper les données vers le format attendu par le composant
      const mappedAlertes: Alerte[] = (alertesData || []).map((alerte: any) => {
        // Mapper les types de la base vers les types du frontend
        const typeMapping: Record<string, Alerte['type']> = {
          'rupture': 'rupture_stock',
          'seuil_bas': 'stock_bas',
          'peremption': 'peremption',
          'stock_surplus': 'stock_bas',
        };
        
        const mappedType = typeMapping[alerte.type] || 'stock_bas';
        
        // Calculer la priorité basée sur le niveau
        const prioriteMapping: Record<string, number> = {
          'critique': 5,
          'avertissement': 4,
          'information': 2,
        };
        
        // Générer les actions recommandées basées sur le type
        const actionsMapping: Record<string, string[]> = {
          'rupture_stock': [
            'Commander de nouveaux lots',
            'Vérifier les transferts en cours',
            'Contacter le fournisseur'
          ],
          'stock_bas': [
            'Commander de nouveaux lots',
            'Vérifier les transferts en cours',
            'Contacter le fournisseur'
          ],
          'peremption': [
            'Prioriser la dispensation de ce lot',
            'Vérifier les autres lots disponibles',
            'Planifier un retour si nécessaire'
          ],
          'perte_anormale': [
            'Vérifier la justification de la perte',
            'Contrôler les procédures de stockage',
            'Former le personnel si nécessaire'
          ],
          'transfert_requis': [
            'Créer un transfert vers le magasin concerné',
            'Vérifier la disponibilité du stock',
            'Planifier la livraison'
          ],
        };

        return {
          id: alerte.id,
          type: mappedType,
          niveau: alerte.niveau as 'critique' | 'avertissement' | 'information',
          titre: `${alerte.niveau === 'critique' ? '🚨 ' : ''}${alerte.type.replace('_', ' ').toUpperCase()} - ${alerte.medicaments?.nom || 'Médicament inconnu'}`,
          message: alerte.message,
          medicamentId: alerte.medicament_id,
          medicamentNom: alerte.medicaments?.nom || 'Médicament inconnu',
          medicamentCode: alerte.medicaments?.code || 'N/A',
          dateCreation: new Date(alerte.date_creation || alerte.created_at),
          dateResolution: alerte.date_resolution ? new Date(alerte.date_resolution) : undefined,
          statut: alerte.statut as 'active' | 'resolue' | 'ignoree',
          priorite: prioriteMapping[alerte.niveau] || 3,
          utilisateurCreation: 'Système',
          utilisateurResolution: alerte.utilisateur_resolution_id || undefined,
          actionsRecommandees: actionsMapping[mappedType] || ['Vérifier et traiter cette alerte'],
          donneesContexte: {},
        };
      });

      setAlertes(mappedAlertes);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertes();
  }, []);

  // Filtrage des alertes
  const alertesFiltrees = alertes.filter(alerte => {
    const matchesStatut = filtreStatut === 'tous' || alerte.statut === filtreStatut;
    const matchesType = filtreType === 'tous' || alerte.type === filtreType;
    const matchesNiveau = filtreNiveau === 'tous' || alerte.niveau === filtreNiveau;
    return matchesStatut && matchesType && matchesNiveau;
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleResoudreAlerte = async (alerteId: string) => {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) {
        console.error('Contexte de clinique manquant');
        return;
      }

      // Mettre à jour l'alerte dans Supabase
      const { error } = await supabase
        .from('alertes_stock')
        .update({
          statut: 'resolue',
          date_resolution: new Date().toISOString(),
        })
        .eq('id', alerteId)
        .eq('clinic_id', clinicId); // SÉCURITÉ: Vérifier que l'alerte appartient à la clinique

      if (error) {
        console.error('Erreur lors de la résolution de l\'alerte:', error);
        return;
      }

      // Mettre à jour l'état local
      setAlertes(prev => prev.map(alerte => 
        alerte.id === alerteId 
          ? { ...alerte, statut: 'resolue' as const, dateResolution: new Date(), utilisateurResolution: 'Utilisateur actuel' }
          : alerte
      ));
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
    }
  };

  const handleIgnorerAlerte = async (alerteId: string) => {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) {
        console.error('Contexte de clinique manquant');
        return;
      }

      // Mettre à jour l'alerte dans Supabase
      const { error } = await supabase
        .from('alertes_stock')
        .update({
          statut: 'ignoree',
        })
        .eq('id', alerteId)
        .eq('clinic_id', clinicId); // SÉCURITÉ: Vérifier que l'alerte appartient à la clinique

      if (error) {
        console.error('Erreur lors de l\'ignorance de l\'alerte:', error);
        return;
      }

      // Mettre à jour l'état local
      setAlertes(prev => prev.map(alerte => 
        alerte.id === alerteId 
          ? { ...alerte, statut: 'ignoree' as const }
          : alerte
      ));
    } catch (error) {
      console.error('Erreur lors de l\'ignorance de l\'alerte:', error);
    }
  };

  const handleViewDetails = (alerte: Alerte) => {
    setSelectedAlerte(alerte);
    setOpenDetails(true);
  };

  const getNiveauColor = (niveau: string) => {
    switch (niveau) {
      case 'critique': return 'error';
      case 'avertissement': return 'warning';
      case 'information': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stock_bas': return <Inventory />;
      case 'peremption': return <Warning />;
      case 'perte_anormale': return <ReportProblem />;
      case 'rupture_stock': return <Error />;
      case 'transfert_requis': return <LocalShipping />;
      case 'inventaire_requis': return <TrendingUp />;
      default: return <Info />;
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'active': return 'error';
      case 'resolue': return 'success';
      case 'ignoree': return 'default';
      default: return 'default';
    }
  };

  const stats = {
    total: alertes.length,
    actives: alertes.filter(a => a.statut === 'active').length,
    resolues: alertes.filter(a => a.statut === 'resolue').length,
    critiques: alertes.filter(a => a.niveau === 'critique' && a.statut === 'active').length,
    stockBas: alertes.filter(a => a.type === 'stock_bas' && a.statut === 'active').length,
    peremptions: alertes.filter(a => a.type === 'peremption' && a.statut === 'active').length,
    pertes: alertes.filter(a => a.type === 'perte_anormale' && a.statut === 'active').length
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Système d'Alertes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestion des alertes automatiques et notifications
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
          onClick={loadAlertes}
          disabled={loading}
        >
          Actualiser
        </Button>
      </Box>

      {/* Navigation par onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<Notifications />} label="Alertes Actives" />
          <Tab icon={<CheckCircle />} label="Alertes Résolues" />
          <Tab icon={<Settings />} label="Configuration" />
          <Tab icon={<TrendingUp />} label="Statistiques" />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      {activeTab === 0 && (
        <Box>
          {/* Statistiques rapides */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {stats.actives}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Alertes Actives
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {stats.critiques}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Critiques
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {stats.stockBas}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stock Faible
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {stats.peremptions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Péremptions
          </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Filtres */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={filtreStatut}
                      onChange={(e) => setFiltreStatut(e.target.value)}
                      label="Statut"
                    >
                      <MenuItem value="tous">Tous</MenuItem>
                      <MenuItem value="active">Actives</MenuItem>
                      <MenuItem value="resolue">Résolues</MenuItem>
                      <MenuItem value="ignoree">Ignorées</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filtreType}
                      onChange={(e) => setFiltreType(e.target.value)}
                      label="Type"
                    >
                      <MenuItem value="tous">Tous</MenuItem>
                      <MenuItem value="stock_bas">Stock Faible</MenuItem>
                      <MenuItem value="peremption">Péremption</MenuItem>
                      <MenuItem value="perte_anormale">Perte Anormale</MenuItem>
                      <MenuItem value="rupture_stock">Rupture Stock</MenuItem>
                      <MenuItem value="transfert_requis">Transfert Requis</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Niveau</InputLabel>
                    <Select
                      value={filtreNiveau}
                      onChange={(e) => setFiltreNiveau(e.target.value)}
                      label="Niveau"
                    >
                      <MenuItem value="tous">Tous</MenuItem>
                      <MenuItem value="critique">Critique</MenuItem>
                      <MenuItem value="avertissement">Avertissement</MenuItem>
                      <MenuItem value="information">Information</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => {
                        setFiltreStatut('tous');
                        setFiltreType('tous');
                        setFiltreNiveau('tous');
                      }}
                    >
                      Réinitialiser
            </Button>
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setOpenConfig(true)}
            >
                      Configurer
            </Button>
          </Box>
          </Grid>
          </Grid>
              </CardContent>
            </Card>

          {/* Tableau des alertes */}
      <Card>
        <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Niveau</TableCell>
                      <TableCell>Titre</TableCell>
                      <TableCell>Médicament</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Priorité</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alertesFiltrees.map((alerte) => (
                      <TableRow key={alerte.id}>
                        <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getTypeIcon(alerte.type)}
                            <Typography variant="body2">
                              {alerte.type.replace('_', ' ')}
                        </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                        <Chip
                          label={alerte.niveau}
                            color={getNiveauColor(alerte.niveau)}
                          size="small"
                        />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {alerte.titre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alerte.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {alerte.medicamentNom}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {alerte.medicamentCode}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {alerte.dateCreation.toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {alerte.priorite}/5
                            </Typography>
                            <Box sx={{ width: 50 }}>
                              <Slider
                                value={alerte.priorite}
                                min={1}
                                max={5}
                                disabled
                          size="small"
                                sx={{ color: alerte.priorite >= 4 ? 'error.main' : 'warning.main' }}
                        />
                      </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={alerte.statut}
                            color={getStatutColor(alerte.statut)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Voir détails">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(alerte)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                        {alerte.statut === 'active' && (
                              <>
                                <Tooltip title="Résoudre">
                                  <IconButton
                              size="small"
                              color="success"
                                    onClick={() => handleResoudreAlerte(alerte.id)}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Ignorer">
                                  <IconButton
                              size="small"
                                    color="default"
                                    onClick={() => handleIgnorerAlerte(alerte.id)}
                                  >
                                    <Close />
                                  </IconButton>
                                </Tooltip>
                              </>
                        )}
                      </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
        </CardContent>
      </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
              <Typography variant="h6" gutterBottom>
            Alertes Résolues
          </Typography>
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Titre</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Date Résolution</TableCell>
                      <TableCell>Résolu par</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alertes
                      .filter(a => a.statut === 'resolue')
                      .map((alerte) => (
                        <TableRow key={alerte.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {alerte.titre}
              </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={alerte.type.replace('_', ' ')}
                              color={getNiveauColor(alerte.niveau)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {alerte.dateResolution?.toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {alerte.utilisateurResolution}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Voir détails">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(alerte)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Configuration des Alertes
              </Typography>
          <Card>
            <CardContent>
              <Grid container spacing={3}>
                {configAlertes.map((config, index) => (
                  <Grid item xs={12} md={6} key={config.type}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          {config.type.replace('_', ' ').toUpperCase()}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                              checked={config.active}
                              onChange={(e) => {
                                const newConfig = [...configAlertes];
                                newConfig[index].active = e.target.checked;
                                setConfigAlertes(newConfig);
                              }}
                            />
                          }
                          label="Actif"
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Seuil d'alerte: {config.seuil}%
                        </Typography>
                        <Slider
                          value={config.seuil}
                          onChange={(e, value) => {
                            const newConfig = [...configAlertes];
                            newConfig[index].seuil = value as number;
                            setConfigAlertes(newConfig);
                          }}
                          min={0}
                          max={100}
                          disabled={!config.active}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Délai d'alerte: {config.delaiAlerte} jours
                        </Typography>
                        <Slider
                          value={config.delaiAlerte}
                          onChange={(e, value) => {
                            const newConfig = [...configAlertes];
                            newConfig[index].delaiAlerte = value as number;
                            setConfigAlertes(newConfig);
                          }}
                          min={0}
                          max={365}
                          disabled={!config.active}
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                              checked={config.notificationEmail}
                              onChange={(e) => {
                                const newConfig = [...configAlertes];
                                newConfig[index].notificationEmail = e.target.checked;
                                setConfigAlertes(newConfig);
                              }}
                              disabled={!config.active}
                            />
                          }
                          label="Notification Email"
                        />
              <FormControlLabel
                control={
                  <Switch
                              checked={config.notificationSMS}
                              onChange={(e) => {
                                const newConfig = [...configAlertes];
                                newConfig[index].notificationSMS = e.target.checked;
                                setConfigAlertes(newConfig);
                              }}
                              disabled={!config.active}
                            />
                          }
                          label="Notification SMS"
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Statistiques des Alertes
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Répartition par Type
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Stock Faible</Typography>
                      <Typography variant="body2" fontWeight="bold">{stats.stockBas}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Péremptions</Typography>
                      <Typography variant="body2" fontWeight="bold">{stats.peremptions}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Pertes Anormales</Typography>
                      <Typography variant="body2" fontWeight="bold">{stats.pertes}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Répartition par Statut
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Actives</Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">{stats.actives}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Résolues</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">{stats.resolues}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Total</Typography>
                      <Typography variant="body2" fontWeight="bold">{stats.total}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Dialog Détails de l'Alerte */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Détails de l'Alerte
        </DialogTitle>
        <DialogContent>
          {selectedAlerte && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Informations Générales
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Titre:</strong> {selectedAlerte.titre}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Type:</strong> {selectedAlerte.type.replace('_', ' ')}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Niveau:</strong> {selectedAlerte.niveau}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Priorité:</strong> {selectedAlerte.priorite}/5
                      </Typography>
                      <Typography variant="body2">
                        <strong>Statut:</strong> {selectedAlerte.statut}
              </Typography>
                    </Box>
                  </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Contexte
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Médicament:</strong> {selectedAlerte.medicamentNom}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Code:</strong> {selectedAlerte.medicamentCode}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date Création:</strong> {selectedAlerte.dateCreation.toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Créé par:</strong> {selectedAlerte.utilisateurCreation}
                      </Typography>
                    </Box>
                  </Paper>
            </Grid>
          </Grid>

              <Typography variant="h6" gutterBottom>
                Message
              </Typography>
              <Alert severity={selectedAlerte.niveau === 'critique' ? 'error' : 'warning'} sx={{ mb: 3 }}>
                {selectedAlerte.message}
              </Alert>

              <Typography variant="h6" gutterBottom>
                Actions Recommandées
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedAlerte.actionsRecommandees.map((action, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">•</Typography>
                    <Typography variant="body2">{action}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Fermer</Button>
          {selectedAlerte?.statut === 'active' && (
            <>
              <Button
                onClick={() => {
                  handleResoudreAlerte(selectedAlerte.id);
                  setOpenDetails(false);
                }}
                variant="contained"
                color="success"
              >
                Résoudre
              </Button>
              <Button
                onClick={() => {
                  handleIgnorerAlerte(selectedAlerte.id);
                  setOpenDetails(false);
                }}
                variant="outlined"
              >
                Ignorer
          </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemeAlertes;
