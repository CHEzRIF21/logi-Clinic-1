import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
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
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  Inventory,
  Assignment,
  ExpandMore,
  ExpandLess,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { Collapse } from '@mui/material';
import { Inventaire, InventaireLigne, Lot, Medicament } from '../../types/stock';
import { formatCurrency } from '../../utils/currency';

interface GestionInventairesProps {
  inventaires: Inventaire[];
  lots: Lot[];
  medicaments: Medicament[];
  onCreateInventaire: (inventaire: Omit<Inventaire, 'id'>) => void;
  onUpdateInventaire: (inventaire: Inventaire) => void;
  onValiderInventaire: (inventaireId: string) => void;
}

const GestionInventairesComponent: React.FC<GestionInventairesProps> = ({
  inventaires,
  lots,
  medicaments,
  onCreateInventaire,
  onUpdateInventaire,
  onValiderInventaire,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedInventaires, setExpandedInventaires] = useState<Set<string>>(new Set());
  // const [editingInventaire, setEditingInventaire] = useState<Inventaire | null>(null);
  const [formData, setFormData] = useState({
    magasin: 'detail' as 'gros' | 'detail',
    observations: '',
  });
  const [lignesInventaire, setLignesInventaire] = useState<Omit<InventaireLigne, 'id' | 'inventaireId'>[]>([]);

  const toggleInventaireExpansion = (inventaireId: string) => {
    const newExpanded = new Set(expandedInventaires);
    if (newExpanded.has(inventaireId)) {
      newExpanded.delete(inventaireId);
    } else {
      newExpanded.add(inventaireId);
    }
    setExpandedInventaires(newExpanded);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return 'warning';
      case 'termine':
        return 'info';
      case 'valide':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return <Assignment color="warning" />;
      case 'termine':
        return <CheckCircle color="info" />;
      case 'valide':
        return <CheckCircle color="success" />;
      default:
        return <Assignment />;
    }
  };

  const getLotsMagasin = (magasin: 'gros' | 'detail') => {
    return lots.filter(lot => lot.magasin === magasin && lot.statut === 'actif');
  };

  const handleAddLigne = (lotId: string, quantiteTheorique: number) => {
    const lot = lots.find(l => l.id === lotId);
    if (lot) {
      const ligneExistante = lignesInventaire.find(l => l.lotId === lotId);
      if (ligneExistante) {
        setLignesInventaire(lignesInventaire.map(l => 
          l.lotId === lotId ? { ...l, quantiteTheorique } : l
        ));
      } else {
        setLignesInventaire([...lignesInventaire, {
          lotId,
          medicamentId: lot.medicamentId,
          quantiteTheorique,
          quantiteReelle: 0,
          ecart: 0,
        }]);
      }
    }
  };

  // const handleUpdateQuantiteReelle = (lotId: string, quantiteReelle: number) => {
  //   setLignesInventaire(lignesInventaire.map(ligne => {
  //     if (ligne.lotId === lotId) {
  //       const ecart = quantiteReelle - ligne.quantiteTheorique;
  //       return { ...ligne, quantiteReelle, ecart };
  //       }
  //     return ligne;
  //   }));
  // };

  const handleCreateInventaire = () => {
    if (lignesInventaire.length > 0) {
      const nouvelInventaire: Omit<Inventaire, 'id'> = {
        numeroInventaire: `INV-${new Date().getFullYear()}-${String(inventaires.length + 1).padStart(3, '0')}`,
        dateInventaire: new Date(),
        magasin: formData.magasin,
        statut: 'en_cours',
        lignes: lignesInventaire.map((ligne, index) => ({
          id: `temp-${index}`,
          inventaireId: '',
          ...ligne,
        })),
        utilisateurId: 'USER001', // À remplacer par l'utilisateur connecté
        observations: formData.observations,
      };
      
      onCreateInventaire(nouvelInventaire);
      setLignesInventaire([]);
      setFormData({
        magasin: 'detail',
        observations: '',
      });
      setOpenDialog(false);
    }
  };

  const getMedicamentNom = (medicamentId: string) => {
    const medicament = medicaments.find(m => m.id === medicamentId);
    return medicament ? medicament.nom : medicamentId;
  };

  const getLotNumero = (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    return lot ? lot.numeroLot : lotId;
  };

  const getTotalEcart = (lignes: InventaireLigne[]) => {
    return lignes.reduce((total, ligne) => total + Math.abs(ligne.ecart), 0);
  };

  const getTotalValeurEcart = (lignes: InventaireLigne[]) => {
    return lignes.reduce((total, ligne) => {
      const medicament = medicaments.find(m => m.id === ligne.medicamentId);
      const prixUnitaire = medicament ? medicament.prixUnitaire : 0;
      return total + (Math.abs(ligne.ecart) * prixUnitaire);
    }, 0);
  };

  const getEcartColor = (ecart: number) => {
    if (ecart === 0) return 'success';
    if (Math.abs(ecart) <= 5) return 'warning';
    return 'error';
  };

  const getEcartIcon = (ecart: number) => {
    if (ecart === 0) return <CheckCircle color="success" />;
    if (ecart > 0) return <TrendingUp color="warning" />;
    return <TrendingDown color="error" />;
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Gestion des Inventaires ({inventaires.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Nouvel Inventaire
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Actions</TableCell>
                  <TableCell>N° Inventaire</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Magasin</TableCell>
                  <TableCell>Lignes</TableCell>
                  <TableCell>Écarts</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventaires.map((inventaire) => (
                  <React.Fragment key={inventaire.id}>
                    <TableRow>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleInventaireExpansion(inventaire.id)}
                        >
                          {expandedInventaires.has(inventaire.id) ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {inventaire.numeroInventaire}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {inventaire.dateInventaire.toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={inventaire.magasin === 'gros' ? 'Magasin Gros' : 'Magasin Détail'}
                          color={inventaire.magasin === 'gros' ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {inventaire.lignes.length} ligne(s)
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="error">
                          {getTotalEcart(inventaire.lignes)} unité(s)
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatutIcon(inventaire.statut)}
                          label={inventaire.statut}
                          color={getStatutColor(inventaire.statut) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {inventaire.statut === 'en_cours' && (
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => onValiderInventaire(inventaire.id)}
                              title="Valider l'inventaire"
                            >
                              <CheckCircle />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                        <Box sx={{ margin: 1 }}>
                          <Collapse in={expandedInventaires.has(inventaire.id)} timeout="auto" unmountOnExit>
                            <Typography variant="subtitle2" gutterBottom>
                              Détails de l'inventaire
                            </Typography>
                            
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Total des écarts: {getTotalEcart(inventaire.lignes)} unités
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Valeur des écarts: {formatCurrency(getTotalValeurEcart(inventaire.lignes))}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Progression: {Math.round((inventaire.lignes.filter(l => l.quantiteReelle > 0).length / inventaire.lignes.length) * 100)}%
                                </Typography>
                              </Grid>
                            </Grid>

                            <LinearProgress 
                              variant="determinate" 
                              value={(inventaire.lignes.filter(l => l.quantiteReelle > 0).length / inventaire.lignes.length) * 100}
                              sx={{ mb: 2 }}
                            />

                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Médicament</TableCell>
                                  <TableCell>Lot</TableCell>
                                  <TableCell>Théorique</TableCell>
                                  <TableCell>Réel</TableCell>
                                  <TableCell>Écart</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {inventaire.lignes.map((ligne) => (
                                  <TableRow key={ligne.id}>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {getMedicamentNom(ligne.medicamentId)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {getLotNumero(ligne.lotId)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {ligne.quantiteTheorique}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {ligne.quantiteReelle}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Box display="flex" alignItems="center" gap={1}>
                                        {getEcartIcon(ligne.ecart)}
                                        <Typography 
                                          variant="body2" 
                                          color={getEcartColor(ligne.ecart)}
                                        >
                                          {ligne.ecart > 0 ? `+${ligne.ecart}` : ligne.ecart}
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      {inventaire.statut === 'en_cours' && (
                                        <TextField
                                          size="small"
                                          type="number"
                                          label="Quantité réelle"
                                          value={ligne.quantiteReelle}
                                          onChange={(e) => {
                                            const quantite = parseInt(e.target.value) || 0;
                                            onUpdateInventaire({
                                              ...inventaire,
                                              lignes: inventaire.lignes.map(l => 
                                                l.id === ligne.id 
                                                  ? { ...l, quantiteReelle: quantite, ecart: quantite - l.quantiteTheorique }
                                                  : l
                                              ),
                                            });
                                          }}
                                          inputProps={{ min: 0 }}
                                          sx={{ width: 120 }}
                                        />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>

                            {inventaire.observations && (
                              <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="caption" color="text.secondary">
                                  Observations: {inventaire.observations}
                                </Typography>
                              </>
                            )}
                          </Collapse>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog Nouvel Inventaire */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Nouvel Inventaire</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Magasin</InputLabel>
                <Select
                  value={formData.magasin}
                  onChange={(e) => setFormData({ ...formData, magasin: e.target.value as 'gros' | 'detail' })}
                  label="Magasin"
                >
                  <MenuItem value="gros">Magasin Gros</MenuItem>
                  <MenuItem value="detail">Magasin Détail</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Sélection des lots à inventorier
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Sélectionnez les lots que vous souhaitez inventorier et saisissez les quantités théoriques.
            </Alert>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Médicament</TableCell>
                  <TableCell>Lot</TableCell>
                  <TableCell>Stock Disponible</TableCell>
                  <TableCell>Quantité Théorique</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getLotsMagasin(formData.magasin).map((lot) => {
                  const ligneExistante = lignesInventaire.find(l => l.lotId === lot.id);
                  const medicament = medicaments.find(m => m.id === lot.medicamentId);
                  
                  return (
                    <TableRow key={lot.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {medicament ? medicament.nom : lot.medicamentId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {lot.numeroLot}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {lot.quantiteDisponible}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={ligneExistante?.quantiteTheorique || ''}
                          onChange={(e) => {
                            const quantite = parseInt(e.target.value) || 0;
                            if (quantite > 0) {
                              handleAddLigne(lot.id, quantite);
                            } else {
                              setLignesInventaire(lignesInventaire.filter(l => l.lotId !== lot.id));
                            }
                          }}
                          inputProps={{ min: 0 }}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell>
                        {ligneExistante ? (
                          <Chip label="Ajouté" color="success" size="small" />
                        ) : (
                          <Chip label="Non sélectionné" color="default" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          {lignesInventaire.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Lignes sélectionnées ({lignesInventaire.length})
              </Typography>
              <List dense>
                {lignesInventaire.map((ligne, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemIcon>
                      <Inventory />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          {getMedicamentNom(ligne.medicamentId)} - Lot {getLotNumero(ligne.lotId)}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Quantité théorique: {ligne.quantiteTheorique} unités
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button
            onClick={handleCreateInventaire}
            variant="contained"
            disabled={lignesInventaire.length === 0}
          >
            Créer l'inventaire
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GestionInventairesComponent;
