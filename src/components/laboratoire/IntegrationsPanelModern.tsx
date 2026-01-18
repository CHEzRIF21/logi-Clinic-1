import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Person,
  LocalHospital,
  Payment,
  Inventory,
  Dashboard,
  AccountBalance,
  PregnantWoman,
  ArrowForward,
  ArrowBack,
  SwapHoriz,
  Block
} from '@mui/icons-material';
import { GlassCard } from '../ui/GlassCard';
import { StatBadge } from '../ui/StatBadge';
import { LaboratoireIntegrationService } from '../../services/laboratoireIntegrationService';

interface IntegrationsPanelModernProps {
  prescriptionId?: string;
  patientId?: string;
}

interface ModuleConnection {
  id: string;
  nom: string;
  icon: React.ReactNode;
  direction: 'entree' | 'sortie' | 'bidirectionnel' | 'aucun';
  couleur: string;
  description: string;
  statut: 'actif' | 'inactif' | 'alerte';
  detailConnexion: string;
  importance: string;
}

const IntegrationsPanelModern: React.FC<IntegrationsPanelModernProps> = ({ prescriptionId, patientId }) => {
  const [syntheseData, setSyntheseData] = useState<any>(null);
  const [kpiData, setKpiData] = useState<any>(null);
  const [bilanData, setBilanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<ModuleConnection | null>(null);
  const [openBilanDialog, setOpenBilanDialog] = useState(false);
  const [openKPIDialog, setOpenKPIDialog] = useState(false);

  // Définition des connexions inter-modules
  const moduleConnections: ModuleConnection[] = [
    {
      id: 'gestion_patient',
      nom: 'Gestion Patient',
      icon: <Person sx={{ fontSize: 40, color: '#2196F3' }} />,
      direction: 'entree',
      couleur: '#2196F3',
      description: 'Récupération de l\'État Civil',
      statut: 'actif',
      detailConnexion: 'Le Labo récupère l\'âge et le sexe du patient. C\'est crucial pour déterminer automatiquement les valeurs normales (ex: le taux d\'hémoglobine normal n\'est pas le même pour un homme, une femme ou un bébé).',
      importance: 'Essentiel pour les valeurs de référence automatiques'
    },
    {
      id: 'consultation',
      nom: 'Consultation',
      icon: <LocalHospital sx={{ fontSize: 40, color: '#4CAF50' }} />,
      direction: 'bidirectionnel',
      couleur: '#4CAF50',
      description: 'Prescription ↔ Résultats',
      statut: 'actif',
      detailConnexion: '1. Commande : Le médecin envoie la prescription électronique (demande d\'examen).\n2. Résultat : Une fois validé par le technicien, le résultat s\'affiche directement dans le dossier de consultation du médecin.',
      importance: 'Flux principal de travail'
    },
    {
      id: 'maternite',
      nom: 'Maternité',
      icon: <PregnantWoman sx={{ fontSize: 40, color: '#E91E63' }} />,
      direction: 'bidirectionnel',
      couleur: '#E91E63',
      description: 'Bilans prénataux',
      statut: 'actif',
      detailConnexion: 'Même logique que la consultation, mais spécifique aux bilans prénataux (Groupe sanguin, Toxoplasmose, VIH). Les résultats urgents doivent être visibles par les sages-femmes.',
      importance: 'Critique pour le suivi de grossesse'
    },
    {
      id: 'caisse',
      nom: 'Caisse',
      icon: <Payment sx={{ fontSize: 40, color: '#FF9800' }} />,
      direction: 'entree',
      couleur: '#FF9800',
      description: 'Verrouillage financier',
      statut: 'actif',
      detailConnexion: 'Le module Labo voit le statut de la facture. Règle de gestion : "Si facture non payée → Interdiction de valider les résultats ou d\'imprimer le bulletin".',
      importance: 'Assure le recouvrement des recettes'
    },
    {
      id: 'stock',
      nom: 'Stock Médicaments',
      icon: <Inventory sx={{ fontSize: 40, color: '#9C27B0' }} />,
      direction: 'sortie',
      couleur: '#9C27B0',
      description: 'Déstockage des Réactifs',
      statut: 'actif',
      detailConnexion: 'Le Labo ne vend pas de médicaments, mais il consomme des produits (réactifs, lames, tubes). À chaque validation d\'examen, le module Labo envoie une instruction au Stock pour décrémenter la quantité de réactif correspondante.',
      importance: 'Gestion automatique des consommables'
    },
    {
      id: 'imagerie',
      nom: 'Imagerie',
      icon: <Block sx={{ fontSize: 40, color: '#9E9E9E' }} />,
      direction: 'aucun',
      couleur: '#9E9E9E',
      description: 'Aucun lien direct',
      statut: 'inactif',
      detailConnexion: 'Généralement peu de lien direct, sauf consultation croisée dans le dossier global.',
      importance: 'Non applicable'
    },
    {
      id: 'tableau_bord',
      nom: 'Tableau de Bord',
      icon: <Dashboard sx={{ fontSize: 40, color: '#00BCD4' }} />,
      direction: 'sortie',
      couleur: '#00BCD4',
      description: 'Envoi des KPI',
      statut: 'actif',
      detailConnexion: 'Envoie les Indicateurs Clés : Temps d\'attente moyen, Nombre d\'examens par jour, Taux de positivité (ex: % de Paludisme positif).',
      importance: 'Pilotage de l\'activité'
    },
    {
      id: 'bilan',
      nom: 'Bilan Financier',
      icon: <AccountBalance sx={{ fontSize: 40, color: '#795548' }} />,
      direction: 'sortie',
      couleur: '#795548',
      description: 'Données comptables',
      statut: 'actif',
      detailConnexion: 'Envoie les données financières pour le rapport comptable (Chiffre d\'affaires généré par le Labo vs Coût des réactifs).',
      importance: 'Analyse de rentabilité'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [synthese, kpi, bilan] = await Promise.all([
        LaboratoireIntegrationService.getSyntheseIntegrations(),
        LaboratoireIntegrationService.getLabKPI(),
        LaboratoireIntegrationService.getBilanFinancier()
      ]);
      setSyntheseData(synthese);
      setKpiData(kpi);
      setBilanData(bilan);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'entree':
        return <ArrowForward sx={{ color: '#4CAF50' }} />;
      case 'sortie':
        return <ArrowBack sx={{ color: '#2196F3' }} />;
      case 'bidirectionnel':
        return <SwapHoriz sx={{ color: '#FF9800' }} />;
      default:
        return <Block sx={{ color: '#9E9E9E' }} />;
    }
  };

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'entree':
        return 'Entrée';
      case 'sortie':
        return 'Sortie';
      case 'bidirectionnel':
        return 'Bidirectionnel';
      default:
        return 'Aucun';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(amount) + ' XOF';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Chargement des intégrations...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1976d2' }}>
        🔗 Connexions Inter-Modules du Laboratoire
      </Typography>

      {/* Résumé des intégrations */}
      {syntheseData && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={2}>
              <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                  {syntheseData.consultation?.prescriptions_liees || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Prescriptions liées
                </Typography>
              </GlassCard>
            </Grid>
            <Grid item xs={6} md={2}>
              <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                  {syntheseData.consultation?.resultats_transmis || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Résultats transmis
                </Typography>
              </GlassCard>
            </Grid>
            <Grid item xs={6} md={2}>
              <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#E91E63' }}>
                  {syntheseData.maternite?.notifications_actives || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Notif. Maternité
                </Typography>
              </GlassCard>
            </Grid>
            <Grid item xs={6} md={2}>
              <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                  {syntheseData.caisse?.prescriptions_payees || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Prescriptions payées
                </Typography>
              </GlassCard>
            </Grid>
            <Grid item xs={6} md={2}>
              <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9C27B0' }}>
                  {syntheseData.stock?.alertes_stock || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Alertes Stock
                </Typography>
              </GlassCard>
            </Grid>
            <Grid item xs={6} md={2}>
              <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00BCD4' }}>
                  {syntheseData.kpi_jour?.examens || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Examens aujourd'hui
                </Typography>
              </GlassCard>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tableau des connexions */}
      <GlassCard sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          📊 Tableau des Connexions
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ 
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f5f5f5' 
            }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Module Connecté</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Sens du Flux</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {moduleConnections.map((module) => (
              <TableRow 
                key={module.id} 
                sx={{ 
                  '&:hover': { 
                    backgroundColor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : '#f5f5f5' 
                  },
                  opacity: module.statut === 'inactif' ? 0.5 : 1
                }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {module.icon}
                    <Typography sx={{ fontWeight: 'bold' }}>{module.nom}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getDirectionIcon(module.direction)}
                    <Typography variant="body2">{getDirectionLabel(module.direction)}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{module.description}</Typography>
                </TableCell>
                <TableCell>
                  <Box 
                    sx={{ 
                      px: 1.5, 
                      py: 0.5, 
                      borderRadius: 1, 
                      display: 'inline-block',
                      backgroundColor: 
                        module.statut === 'actif' ? '#e8f5e9' : 
                        module.statut === 'alerte' ? '#fff3e0' : '#f5f5f5',
                      color:
                        module.statut === 'actif' ? '#2e7d32' : 
                        module.statut === 'alerte' ? '#ef6c00' : '#757575'
                    }}
                  >
                    {module.statut === 'actif' ? '✅ Actif' : 
                     module.statut === 'alerte' ? '⚠️ Alerte' : '⬜ Inactif'}
                  </Box>
                </TableCell>
                <TableCell>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => setSelectedModule(module)}
                    disabled={module.statut === 'inactif'}
                  >
                    Détails
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>

      {/* Cartes visuelles des modules */}
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        🔌 Vue Détaillée des Modules
      </Typography>
      <Grid container spacing={2}>
        {moduleConnections.filter(m => m.statut !== 'inactif').map((module) => (
          <Grid item xs={12} md={4} key={module.id}>
            <Card 
              sx={{ 
                height: '100%',
                borderLeft: `4px solid ${module.couleur}`,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  {module.icon}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : '#f0f0f0'
                    }}
                  >
                    {getDirectionIcon(module.direction)}
                    <Typography variant="caption">{getDirectionLabel(module.direction)}</Typography>
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {module.nom}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {module.description}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                  💡 {module.importance}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Boutons d'action */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<Dashboard />}
          onClick={() => setOpenKPIDialog(true)}
        >
          Voir les KPI
        </Button>
        <Button 
          variant="contained" 
          color="secondary"
          startIcon={<AccountBalance />}
          onClick={() => setOpenBilanDialog(true)}
        >
          Bilan Financier
        </Button>
        <Button 
          variant="outlined"
          onClick={loadData}
        >
          Actualiser
        </Button>
      </Box>

      {/* Dialog détails module */}
      <Dialog 
        open={!!selectedModule} 
        onClose={() => setSelectedModule(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedModule && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {selectedModule.icon}
              {selectedModule.nom}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Sens du flux</Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  {getDirectionIcon(selectedModule.direction)}
                  <Typography>{getDirectionLabel(selectedModule.direction)}</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary">Détail de la connexion</Typography>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                {selectedModule.detailConnexion}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary">Importance</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {selectedModule.importance}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedModule(null)}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog KPI */}
      <Dialog 
        open={openKPIDialog} 
        onClose={() => setOpenKPIDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>📊 Indicateurs Clés de Performance (KPI)</DialogTitle>
        <DialogContent>
          {kpiData && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6} md={3}>
                <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {kpiData.examens_aujourd_hui}
                  </Typography>
                  <Typography variant="caption">Examens aujourd'hui</Typography>
                </GlassCard>
              </Grid>
              <Grid item xs={6} md={3}>
                <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                    {kpiData.examens_semaine}
                  </Typography>
                  <Typography variant="caption">Cette semaine</Typography>
                </GlassCard>
              </Grid>
              <Grid item xs={6} md={3}>
                <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                    {kpiData.delai_moyen_heures}h
                  </Typography>
                  <Typography variant="caption">Délai moyen</Typography>
                </GlassCard>
              </Grid>
              <Grid item xs={6} md={3}>
                <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#E91E63' }}>
                    {kpiData.taux_positivite_moyen}%
                  </Typography>
                  <Typography variant="caption">Taux positivité</Typography>
                </GlassCard>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Détail par pathologie</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Paramètre</TableCell>
                      <TableCell align="right">Positifs</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Taux</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {kpiData.details_positivite?.map((d: any) => (
                      <TableRow key={d.parametre}>
                        <TableCell>{d.parametre}</TableCell>
                        <TableCell align="right">{d.positifs}</TableCell>
                        <TableCell align="right">{d.total}</TableCell>
                        <TableCell align="right" sx={{ color: d.taux > 20 ? '#E91E63' : 'inherit' }}>
                          {d.taux.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenKPIDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Bilan Financier */}
      <Dialog 
        open={openBilanDialog} 
        onClose={() => setOpenBilanDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>💰 Bilan Financier du Laboratoire</DialogTitle>
        <DialogContent>
          {bilanData && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6} md={4}>
                <GlassCard sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  backgroundColor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(22, 163, 74, 0.15)' 
                    : '#e8f5e9' 
                }}>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 'bold', 
                    color: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#2e7d32' 
                  }}>
                    {formatCurrency(bilanData.chiffre_affaires)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Chiffre d'affaires</Typography>
                </GlassCard>
              </Grid>
              <Grid item xs={6} md={4}>
                <GlassCard sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  backgroundColor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(220, 38, 38, 0.15)' 
                    : '#ffebee' 
                }}>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 'bold', 
                    color: (theme) => theme.palette.mode === 'dark' ? '#f87171' : '#c62828' 
                  }}>
                    {formatCurrency(bilanData.cout_reactifs)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Coût des réactifs</Typography>
                </GlassCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <GlassCard sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  backgroundColor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(59, 130, 246, 0.15)' 
                    : '#e3f2fd' 
                }}>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 'bold', 
                    color: (theme) => theme.palette.mode === 'dark' ? '#60a5fa' : '#1565c0' 
                  }}>
                    {formatCurrency(bilanData.marge_brute)}
                  </Typography>
                  <Typography variant="caption">Marge brute ({bilanData.taux_marge}%)</Typography>
                </GlassCard>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Top Examens</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Nombre</TableCell>
                      <TableCell align="right">CA</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bilanData.top_examens?.slice(0, 5).map((e: any) => (
                      <TableRow key={e.type}>
                        <TableCell>{e.type}</TableCell>
                        <TableCell align="right">{e.nombre}</TableCell>
                        <TableCell align="right">{formatCurrency(e.ca)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Consommation Réactifs</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Réactif</TableCell>
                      <TableCell align="right">Qté</TableCell>
                      <TableCell align="right">Coût</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bilanData.consommation_reactifs?.slice(0, 5).map((r: any) => (
                      <TableRow key={r.reactif}>
                        <TableCell>{r.reactif}</TableCell>
                        <TableCell align="right">{r.quantite}</TableCell>
                        <TableCell align="right">{formatCurrency(r.cout_estime)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBilanDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationsPanelModern;

