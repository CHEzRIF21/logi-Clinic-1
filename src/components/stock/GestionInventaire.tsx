import React, { useState, useEffect, useMemo } from 'react';
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
  Divider,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Collapse,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  CheckCircle,
  Cancel,
  Warning,
  Assignment,
  Inventory,
  Print,
  Download,
  Refresh,
  ExpandMore,
  ExpandLess,
  FilterList,
  Search,
  Save,
  Done,
  ErrorOutline,
} from '@mui/icons-material';

// Types pour l'inventaire
interface InventaireSession {
  id: string;
  reference: string;
  dateDebut: Date;
  dateFin?: Date;
  magasinId: string;
  magasinNom: string;
  prepareParId: string;
  prepareParNom: string;
  approuveParId?: string;
  approuveParNom?: string;
  statut: 'BROUILLON' | 'EN_COURS' | 'VALIDE' | 'AJUSTE' | 'CLOTURE';
  commentaireGlobal?: string;
  nombreLignes: number;
  nombreComptes: number;
  totalEcarts: number;
}

interface InventaireLigne {
  id: string;
  inventaireId: string;
  produitId: string;
  produitCode: string;
  produitNom: string;
  categorie: string;
  numeroLot: string;
  datePeremption: Date;
  emplacement: string;
  unite: string;
  qteTheorique: number;
  qtePhysique: number | null;
  ecart: number;
  remarque: string;
  estCompte: boolean;
}

interface GestionInventaireProps {
  magasinType: 'pharmacie' | 'stock_central';
  magasinId: string;
  magasinNom: string;
  utilisateurId: string;
  utilisateurNom: string;
}

// Données de démonstration
const generateDemoSessions = (magasinType: string): InventaireSession[] => [
  {
    id: '1',
    reference: `INV-${magasinType === 'pharmacie' ? 'PH' : 'SC'}-2024-001`,
    dateDebut: new Date('2024-12-01'),
    dateFin: new Date('2024-12-01'),
    magasinId: '1',
    magasinNom: magasinType === 'pharmacie' ? 'Pharmacie Détail' : 'Magasin Gros',
    prepareParId: '1',
    prepareParNom: 'Pharmacien Principal',
    approuveParId: '2',
    approuveParNom: 'Responsable Centre',
    statut: 'CLOTURE',
    commentaireGlobal: 'Inventaire mensuel de décembre',
    nombreLignes: 45,
    nombreComptes: 45,
    totalEcarts: 3
  },
  {
    id: '2',
    reference: `INV-${magasinType === 'pharmacie' ? 'PH' : 'SC'}-2024-002`,
    dateDebut: new Date('2024-12-15'),
    magasinId: '1',
    magasinNom: magasinType === 'pharmacie' ? 'Pharmacie Détail' : 'Magasin Gros',
    prepareParId: '1',
    prepareParNom: 'Infirmier Pharmacie',
    statut: 'EN_COURS',
    nombreLignes: 32,
    nombreComptes: 18,
    totalEcarts: 2
  }
];

const generateDemoLignes = (inventaireId: string): InventaireLigne[] => [
  // Médicaments
  {
    id: '1',
    inventaireId,
    produitId: '1',
    produitCode: 'MED-001',
    produitNom: 'Paracétamol 500mg',
    categorie: 'Médicaments',
    numeroLot: 'PAR-2024-001',
    datePeremption: new Date('2025-10-10'),
    emplacement: 'Rayon A-1',
    unite: 'Boîte',
    qteTheorique: 150,
    qtePhysique: 148,
    ecart: -2,
    remarque: '2 boîtes endommagées',
    estCompte: true
  },
  {
    id: '2',
    inventaireId,
    produitId: '1',
    produitCode: 'MED-001',
    produitNom: 'Paracétamol 500mg',
    categorie: 'Médicaments',
    numeroLot: 'PAR-2024-002',
    datePeremption: new Date('2025-03-15'),
    emplacement: 'Rayon A-1',
    unite: 'Boîte',
    qteTheorique: 50,
    qtePhysique: 50,
    ecart: 0,
    remarque: '',
    estCompte: true
  },
  {
    id: '3',
    inventaireId,
    produitId: '2',
    produitCode: 'MED-002',
    produitNom: 'Amoxicilline 1g',
    categorie: 'Médicaments',
    numeroLot: 'AMX-2024-001',
    datePeremption: new Date('2025-08-15'),
    emplacement: 'Frigo B-2',
    unite: 'Flacon',
    qteTheorique: 25,
    qtePhysique: null,
    ecart: 0,
    remarque: '',
    estCompte: false
  },
  {
    id: '4',
    inventaireId,
    produitId: '3',
    produitCode: 'MED-003',
    produitNom: 'Ibuprofène 400mg',
    categorie: 'Médicaments',
    numeroLot: 'IBU-2024-001',
    datePeremption: new Date('2024-12-20'),
    emplacement: 'Rayon A-2',
    unite: 'Boîte',
    qteTheorique: 20,
    qtePhysique: 22,
    ecart: 2,
    remarque: 'Lot trouvé en surplus',
    estCompte: true
  },
  // Consommables
  {
    id: '5',
    inventaireId,
    produitId: '4',
    produitCode: 'CONS-001',
    produitNom: 'Seringues 5ml',
    categorie: 'Consommables',
    numeroLot: 'SER-2024-001',
    datePeremption: new Date('2026-06-30'),
    emplacement: 'Rayon C-1',
    unite: 'Paquet',
    qteTheorique: 100,
    qtePhysique: null,
    ecart: 0,
    remarque: '',
    estCompte: false
  },
  {
    id: '6',
    inventaireId,
    produitId: '5',
    produitCode: 'CONS-002',
    produitNom: 'Gants stériles M',
    categorie: 'Consommables',
    numeroLot: 'GAN-2024-001',
    datePeremption: new Date('2025-12-31'),
    emplacement: 'Rayon C-2',
    unite: 'Boîte',
    qteTheorique: 45,
    qtePhysique: 45,
    ecart: 0,
    remarque: '',
    estCompte: true
  },
  // Laboratoire
  {
    id: '7',
    inventaireId,
    produitId: '6',
    produitCode: 'LAB-001',
    produitNom: 'Bandelettes Glucose',
    categorie: 'Laboratoire',
    numeroLot: 'BAN-2024-001',
    datePeremption: new Date('2025-04-15'),
    emplacement: 'Labo D-1',
    unite: 'Tube',
    qteTheorique: 30,
    qtePhysique: 28,
    ecart: -2,
    remarque: '',
    estCompte: true
  }
];

const GestionInventaire: React.FC<GestionInventaireProps> = ({
  magasinType,
  magasinId,
  magasinNom,
  utilisateurId,
  utilisateurNom
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [sessions, setSessions] = useState<InventaireSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<InventaireSession | null>(null);
  const [lignes, setLignes] = useState<InventaireLigne[]>([]);
  const [loading, setLoading] = useState(false);
  
  // États pour les dialogs
  const [openNouvelInventaire, setOpenNouvelInventaire] = useState(false);
  const [openAjoutLot, setOpenAjoutLot] = useState(false);
  const [openValidation, setOpenValidation] = useState(false);
  
  // Filtres
  const [filtreCategorie, setFiltreCategorie] = useState<string>('');
  const [filtreNonComptes, setFiltreNonComptes] = useState(false);
  const [filtreEcartsUniquement, setFiltreEcartsUniquement] = useState(false);
  const [recherche, setRecherche] = useState('');
  
  // Catégories expandables
  const [categoriesExpanded, setCategoriesExpanded] = useState<{ [key: string]: boolean }>({
    'Médicaments': true,
    'Consommables': true,
    'Laboratoire': true
  });

  // Formulaire nouvel inventaire
  const [nouvelInventaireForm, setNouvelInventaireForm] = useState({
    typeInventaire: 'complet',
    categorieSelectionnee: '',
    commentaire: ''
  });

  // Formulaire ajout lot imprévu
  const [ajoutLotForm, setAjoutLotForm] = useState({
    produitId: '',
    produitNom: '',
    numeroLot: '',
    datePeremption: '',
    qtePhysique: 0,
    remarque: ''
  });

  useEffect(() => {
    loadSessions();
  }, [magasinType]);

  const loadSessions = () => {
    setLoading(true);
    // Simulation du chargement
    setTimeout(() => {
      setSessions(generateDemoSessions(magasinType));
      setLoading(false);
    }, 500);
  };

  const loadLignesInventaire = (sessionId: string) => {
    setLoading(true);
    setTimeout(() => {
      setLignes(generateDemoLignes(sessionId));
      setLoading(false);
    }, 300);
  };

  const handleSelectSession = (session: InventaireSession) => {
    setSelectedSession(session);
    loadLignesInventaire(session.id);
    setActiveTab(1);
  };

  const handleUpdateQtePhysique = (ligneId: string, value: number | null) => {
    setLignes(prev => prev.map(ligne => {
      if (ligne.id === ligneId) {
        const qtePhysique = value;
        const ecart = qtePhysique !== null ? qtePhysique - ligne.qteTheorique : 0;
        return {
          ...ligne,
          qtePhysique,
          ecart,
          estCompte: qtePhysique !== null
        };
      }
      return ligne;
    }));
  };

  const handleUpdateRemarque = (ligneId: string, value: string) => {
    setLignes(prev => prev.map(ligne => 
      ligne.id === ligneId ? { ...ligne, remarque: value } : ligne
    ));
  };

  const handleCreateInventaire = () => {
    const newId = `${Date.now()}`;
    const reference = `INV-${magasinType === 'pharmacie' ? 'PH' : 'SC'}-${new Date().getFullYear()}-${String(sessions.length + 1).padStart(3, '0')}`;
    
    const newSession: InventaireSession = {
      id: newId,
      reference,
      dateDebut: new Date(),
      magasinId,
      magasinNom,
      prepareParId: utilisateurId,
      prepareParNom: utilisateurNom,
      statut: 'EN_COURS',
      commentaireGlobal: nouvelInventaireForm.commentaire,
      nombreLignes: 0,
      nombreComptes: 0,
      totalEcarts: 0
    };

    setSessions(prev => [newSession, ...prev]);
    setSelectedSession(newSession);
    setLignes(generateDemoLignes(newId));
    setOpenNouvelInventaire(false);
    setActiveTab(1);
    
    // Reset form
    setNouvelInventaireForm({
      typeInventaire: 'complet',
      categorieSelectionnee: '',
      commentaire: ''
    });
  };

  const handleAjoutLotImprevu = () => {
    if (!selectedSession) return;
    
    const newLigne: InventaireLigne = {
      id: `${Date.now()}`,
      inventaireId: selectedSession.id,
      produitId: ajoutLotForm.produitId || `TEMP-${Date.now()}`,
      produitCode: 'AJOUT-MANUEL',
      produitNom: ajoutLotForm.produitNom,
      categorie: 'Médicaments',
      numeroLot: ajoutLotForm.numeroLot,
      datePeremption: new Date(ajoutLotForm.datePeremption),
      emplacement: 'À définir',
      unite: 'Unité',
      qteTheorique: 0,
      qtePhysique: ajoutLotForm.qtePhysique,
      ecart: ajoutLotForm.qtePhysique,
      remarque: ajoutLotForm.remarque || 'Lot trouvé lors de l\'inventaire (non référencé)',
      estCompte: true
    };

    setLignes(prev => [...prev, newLigne]);
    setOpenAjoutLot(false);
    setAjoutLotForm({
      produitId: '',
      produitNom: '',
      numeroLot: '',
      datePeremption: '',
      qtePhysique: 0,
      remarque: ''
    });
  };

  const handleValiderInventaire = () => {
    if (!selectedSession) return;
    
    // Mettre à jour le statut
    setSessions(prev => prev.map(s => 
      s.id === selectedSession.id 
        ? { ...s, statut: 'VALIDE' as const, dateFin: new Date(), approuveParId: utilisateurId, approuveParNom: utilisateurNom }
        : s
    ));
    
    setSelectedSession(prev => prev ? { ...prev, statut: 'VALIDE', dateFin: new Date() } : null);
    setOpenValidation(false);
  };

  // Calculs statistiques
  const stats = useMemo(() => {
    const lignesComptees = lignes.filter(l => l.estCompte);
    const lignesAvecEcart = lignes.filter(l => l.ecart !== 0);
    const ecartsNegatifs = lignes.filter(l => l.ecart < 0);
    const ecartsPositifs = lignes.filter(l => l.ecart > 0);
    
    return {
      totalLignes: lignes.length,
      lignesComptees: lignesComptees.length,
      progression: lignes.length > 0 ? (lignesComptees.length / lignes.length) * 100 : 0,
      lignesAvecEcart: lignesAvecEcart.length,
      ecartsNegatifs: ecartsNegatifs.length,
      ecartsPositifs: ecartsPositifs.length,
      totalEcartNegatif: ecartsNegatifs.reduce((sum, l) => sum + l.ecart, 0),
      totalEcartPositif: ecartsPositifs.reduce((sum, l) => sum + l.ecart, 0)
    };
  }, [lignes]);

  // Filtrage des lignes
  const lignesFiltrees = useMemo(() => {
    return lignes.filter(ligne => {
      if (filtreCategorie && ligne.categorie !== filtreCategorie) return false;
      if (filtreNonComptes && ligne.estCompte) return false;
      if (filtreEcartsUniquement && ligne.ecart === 0) return false;
      if (recherche) {
        const searchLower = recherche.toLowerCase();
        if (!ligne.produitNom.toLowerCase().includes(searchLower) &&
            !ligne.produitCode.toLowerCase().includes(searchLower) &&
            !ligne.numeroLot.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [lignes, filtreCategorie, filtreNonComptes, filtreEcartsUniquement, recherche]);

  // Grouper par catégorie
  const lignesParCategorie = useMemo(() => {
    const grouped: { [key: string]: InventaireLigne[] } = {};
    lignesFiltrees.forEach(ligne => {
      if (!grouped[ligne.categorie]) {
        grouped[ligne.categorie] = [];
      }
      grouped[ligne.categorie].push(ligne);
    });
    return grouped;
  }, [lignesFiltrees]);

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'BROUILLON': return 'default';
      case 'EN_COURS': return 'warning';
      case 'VALIDE': return 'success';
      case 'AJUSTE': return 'info';
      case 'CLOTURE': return 'secondary';
      default: return 'default';
    }
  };

  const getPeremptionStyle = (date: Date) => {
    const now = new Date();
    const diffDays = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays < 0) return { color: 'error.main', fontWeight: 'bold' };
    if (diffDays < 90) return { color: 'warning.main', fontWeight: 'bold' };
    return {};
  };

  const getEcartStyle = (ecart: number) => {
    if (ecart < 0) return { color: 'error.main', fontWeight: 'bold' };
    if (ecart > 0) return { color: 'success.main', fontWeight: 'bold' };
    return { color: 'text.secondary' };
  };

  const categories = [...new Set(lignes.map(l => l.categorie))];

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Gestion des Inventaires - {magasinNom}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {magasinType === 'pharmacie' 
            ? 'Inventaire du stock de la pharmacie (point de dispensation)'
            : 'Inventaire du stock central (Magasin Gros)'
          }
        </Typography>
      </Box>

      {/* Navigation par onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<Assignment />} label="Sessions d'Inventaire" />
          <Tab 
            icon={<Edit />} 
            label="Saisie Inventaire" 
            disabled={!selectedSession}
          />
        </Tabs>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tab 0: Liste des sessions */}
      {activeTab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Sessions d'Inventaire</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenNouvelInventaire(true)}
                  >
                    Nouvel Inventaire
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={loadSessions}
                  >
                    Actualiser
                  </Button>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Référence</TableCell>
                      <TableCell>Date Début</TableCell>
                      <TableCell>Date Fin</TableCell>
                      <TableCell>Préparé par</TableCell>
                      <TableCell>Approuvé par</TableCell>
                      <TableCell>Progression</TableCell>
                      <TableCell>Écarts</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {session.reference}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {session.dateDebut.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {session.dateFin ? session.dateFin.toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>{session.prepareParNom}</TableCell>
                        <TableCell>{session.approuveParNom || '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(session.nombreComptes / session.nombreLignes) * 100}
                              sx={{ width: 80, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption">
                              {session.nombreComptes}/{session.nombreLignes}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {session.totalEcarts > 0 ? (
                            <Chip 
                              label={`${session.totalEcarts} écart(s)`}
                              color="warning"
                              size="small"
                            />
                          ) : (
                            <Chip label="Aucun" color="success" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={session.statut}
                            color={getStatutColor(session.statut) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title={session.statut === 'EN_COURS' ? 'Continuer' : 'Voir'}>
                              <IconButton 
                                size="small"
                                onClick={() => handleSelectSession(session)}
                              >
                                {session.statut === 'EN_COURS' ? <Edit /> : <Visibility />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Imprimer">
                              <IconButton size="small">
                                <Print />
                              </IconButton>
                            </Tooltip>
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

      {/* Tab 1: Saisie de l'inventaire */}
      {activeTab === 1 && selectedSession && (
        <Box>
          {/* Entête de la session */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Référence</Typography>
                  <Typography variant="h6">{selectedSession.reference}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Date de début</Typography>
                  <Typography>{selectedSession.dateDebut.toLocaleDateString()}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" color="text.secondary">Préparé par</Typography>
                  <Typography>{selectedSession.prepareParNom}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Chip
                    label={selectedSession.statut}
                    color={getStatutColor(selectedSession.statut) as any}
                    icon={selectedSession.statut === 'EN_COURS' ? <Warning /> : <CheckCircle />}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Statistiques de progression */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">{stats.lignesComptees}/{stats.totalLignes}</Typography>
                <Typography variant="body2" color="text.secondary">Articles comptés</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.progression}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">{stats.lignesAvecEcart}</Typography>
                <Typography variant="body2" color="text.secondary">Lignes avec écart</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">{stats.totalEcartNegatif}</Typography>
                <Typography variant="body2" color="text.secondary">Manques (écarts négatifs)</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">+{stats.totalEcartPositif}</Typography>
                <Typography variant="body2" color="text.secondary">Surplus (écarts positifs)</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Filtres */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Rechercher..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ minWidth: 200 }}
                />
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Catégorie</InputLabel>
                  <Select
                    value={filtreCategorie}
                    onChange={(e) => setFiltreCategorie(e.target.value)}
                    label="Catégorie"
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filtreNonComptes}
                      onChange={(e) => setFiltreNonComptes(e.target.checked)}
                    />
                  }
                  label="Non comptés uniquement"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filtreEcartsUniquement}
                      onChange={(e) => setFiltreEcartsUniquement(e.target.checked)}
                    />
                  }
                  label="Avec écarts uniquement"
                />

                <Box sx={{ flexGrow: 1 }} />

                {selectedSession.statut === 'EN_COURS' && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => setOpenAjoutLot(true)}
                    >
                      Ajouter lot imprévu
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Done />}
                      onClick={() => setOpenValidation(true)}
                      disabled={stats.lignesComptees < stats.totalLignes}
                    >
                      Terminer l'inventaire
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Tableau des lignes groupées par catégorie */}
          {Object.entries(lignesParCategorie).map(([categorie, lignesCat]) => (
            <Card key={categorie} sx={{ mb: 2 }}>
              <CardContent sx={{ pb: 1 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    mb: 1
                  }}
                  onClick={() => setCategoriesExpanded(prev => ({ ...prev, [categorie]: !prev[categorie] }))}
                >
                  {categoriesExpanded[categorie] ? <ExpandLess /> : <ExpandMore />}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {categorie}
                  </Typography>
                  <Chip 
                    label={`${lignesCat.length} article(s)`}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                  <Chip 
                    label={`${lignesCat.filter(l => l.estCompte).length} compté(s)`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </Box>
              </CardContent>
              
              <Collapse in={categoriesExpanded[categorie]}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Code</TableCell>
                        <TableCell>Produit</TableCell>
                        <TableCell>N° Lot</TableCell>
                        <TableCell>Date Péremption</TableCell>
                        <TableCell>Emplacement</TableCell>
                        <TableCell align="right">Stock Théorique</TableCell>
                        <TableCell align="center" sx={{ bgcolor: 'action.hover' }}>Stock Physique</TableCell>
                        <TableCell align="right">Écart</TableCell>
                        <TableCell>Remarque</TableCell>
                        <TableCell align="center">Statut</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lignesCat.map((ligne) => (
                        <TableRow key={ligne.id} sx={{ 
                          bgcolor: !ligne.estCompte ? 'warning.lighter' : 'inherit'
                        }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {ligne.produitCode}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{ligne.produitNom}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{ligne.numeroLot}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={getPeremptionStyle(ligne.datePeremption)}>
                              {ligne.datePeremption.toLocaleDateString()}
                              {new Date(ligne.datePeremption) < new Date() && (
                                <Chip label="PÉRIMÉ" color="error" size="small" sx={{ ml: 1 }} />
                              )}
                              {new Date(ligne.datePeremption) > new Date() && 
                               (new Date(ligne.datePeremption).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) < 90 && (
                                <Chip label="< 3 mois" color="warning" size="small" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell>{ligne.emplacement}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {ligne.qteTheorique} {ligne.unite}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ bgcolor: 'action.hover' }}>
                            {selectedSession.statut === 'EN_COURS' ? (
                              <TextField
                                type="number"
                                size="small"
                                value={ligne.qtePhysique ?? ''}
                                onChange={(e) => handleUpdateQtePhysique(
                                  ligne.id, 
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                )}
                                inputProps={{ 
                                  min: 0, 
                                  step: magasinType === 'pharmacie' ? 0.5 : 1,
                                  style: { textAlign: 'center', width: 80 }
                                }}
                              />
                            ) : (
                              <Typography variant="body2" fontWeight="bold">
                                {ligne.qtePhysique ?? '-'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={getEcartStyle(ligne.ecart)}>
                              {ligne.ecart > 0 ? '+' : ''}{ligne.ecart}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {selectedSession.statut === 'EN_COURS' ? (
                              <TextField
                                size="small"
                                value={ligne.remarque}
                                onChange={(e) => handleUpdateRemarque(ligne.id, e.target.value)}
                                placeholder="Remarque..."
                                sx={{ minWidth: 120 }}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                {ligne.remarque || '-'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {ligne.estCompte ? (
                              <CheckCircle color="success" fontSize="small" />
                            ) : (
                              <ErrorOutline color="warning" fontSize="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Card>
          ))}

          {/* Actions de bas de page */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="outlined" startIcon={<Print />}>
              Imprimer Fiche Inventaire
            </Button>
            <Button variant="outlined" startIcon={<Download />}>
              Exporter (Excel)
            </Button>
          </Box>
        </Box>
      )}

      {/* Dialog Nouvel Inventaire */}
      <Dialog open={openNouvelInventaire} onClose={() => setOpenNouvelInventaire(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvel Inventaire - {magasinNom}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                L'inventaire va "figer" le stock théorique actuel pour permettre une comparaison avec le comptage physique.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date de l'inventaire"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type d'inventaire</InputLabel>
                <Select
                  value={nouvelInventaireForm.typeInventaire}
                  onChange={(e) => setNouvelInventaireForm(prev => ({ ...prev, typeInventaire: e.target.value }))}
                  label="Type d'inventaire"
                >
                  <MenuItem value="complet">Inventaire Complet</MenuItem>
                  <MenuItem value="partiel">Inventaire Partiel (par catégorie)</MenuItem>
                  <MenuItem value="tournant">Inventaire Tournant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {nouvelInventaireForm.typeInventaire === 'partiel' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Catégorie à inventorier</InputLabel>
                  <Select
                    value={nouvelInventaireForm.categorieSelectionnee}
                    onChange={(e) => setNouvelInventaireForm(prev => ({ ...prev, categorieSelectionnee: e.target.value }))}
                    label="Catégorie à inventorier"
                  >
                    <MenuItem value="Médicaments">Médicaments</MenuItem>
                    <MenuItem value="Consommables">Consommables</MenuItem>
                    <MenuItem value="Laboratoire">Laboratoire</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Commentaire / Observations"
                multiline
                rows={3}
                value={nouvelInventaireForm.commentaire}
                onChange={(e) => setNouvelInventaireForm(prev => ({ ...prev, commentaire: e.target.value }))}
                placeholder="Notes ou remarques sur cet inventaire..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNouvelInventaire(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateInventaire}>
            Démarrer l'Inventaire
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Ajout Lot Imprévu */}
      <Dialog open={openAjoutLot} onClose={() => setOpenAjoutLot(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un Lot Imprévu</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="warning">
                Utilisez cette fonction pour ajouter un lot trouvé physiquement mais non référencé dans le système.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du produit *"
                value={ajoutLotForm.produitNom}
                onChange={(e) => setAjoutLotForm(prev => ({ ...prev, produitNom: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Numéro de lot *"
                value={ajoutLotForm.numeroLot}
                onChange={(e) => setAjoutLotForm(prev => ({ ...prev, numeroLot: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date de péremption *"
                type="date"
                value={ajoutLotForm.datePeremption}
                onChange={(e) => setAjoutLotForm(prev => ({ ...prev, datePeremption: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantité physique trouvée *"
                type="number"
                value={ajoutLotForm.qtePhysique}
                onChange={(e) => setAjoutLotForm(prev => ({ ...prev, qtePhysique: parseFloat(e.target.value) || 0 }))}
                inputProps={{ min: 0 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarque"
                multiline
                rows={2}
                value={ajoutLotForm.remarque}
                onChange={(e) => setAjoutLotForm(prev => ({ ...prev, remarque: e.target.value }))}
                placeholder="Expliquez comment ce lot a été trouvé..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAjoutLot(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handleAjoutLotImprevu}
            disabled={!ajoutLotForm.produitNom || !ajoutLotForm.numeroLot || !ajoutLotForm.datePeremption}
          >
            Ajouter le Lot
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Validation */}
      <Dialog open={openValidation} onClose={() => setOpenValidation(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Terminer et Valider l'Inventaire</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="body2" fontWeight="bold">Attention !</Typography>
                La validation de l'inventaire va :
                <ul style={{ margin: '8px 0' }}>
                  <li>Clôturer la session d'inventaire</li>
                  <li>Générer des mouvements de régularisation pour les écarts</li>
                  <li>Mettre à jour le stock réel pour correspondre au stock physique compté</li>
                </ul>
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Résumé de l'inventaire :</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Articles comptés :</Typography>
                  <Typography fontWeight="bold">{stats.lignesComptees}/{stats.totalLignes}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Lignes avec écart :</Typography>
                  <Typography fontWeight="bold" color="warning.main">{stats.lignesAvecEcart}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Total manques :</Typography>
                  <Typography fontWeight="bold" color="error.main">{stats.totalEcartNegatif}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Total surplus :</Typography>
                  <Typography fontWeight="bold" color="success.main">+{stats.totalEcartPositif}</Typography>
                </Box>
              </Paper>
            </Grid>
            {stats.lignesAvecEcart > 0 && Math.abs(stats.totalEcartNegatif) > 10 && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Justification des écarts importants (obligatoire)"
                  multiline
                  rows={3}
                  required
                  placeholder="Expliquez les raisons des écarts constatés..."
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenValidation(false)}>Annuler</Button>
          <Button variant="contained" color="success" onClick={handleValiderInventaire}>
            Valider et Régulariser le Stock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionInventaire;

