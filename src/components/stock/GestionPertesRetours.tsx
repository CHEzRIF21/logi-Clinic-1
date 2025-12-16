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
  Collapse,
} from '@mui/material';
import {
  Add,
  ExpandMore,
  ExpandLess,
  Warning,
  Error,
  CheckCircle,
  Cancel,
  Inventory,
  LocalShipping,
} from '@mui/icons-material';
import { Lot, Medicament, MouvementStock } from '../../types/stock';
// import { formatCurrency } from '../../utils/currency';

interface PerteRetour {
  id: string;
  type: 'perte' | 'retour';
  medicamentId: string;
  lotId: string;
  quantite: number;
  motif: string;
  utilisateurId: string;
  dateCreation: Date;
  statut: 'en_cours' | 'valide' | 'rejete';
  observations?: string;
  referenceDocument?: string;
}

interface GestionPertesRetoursProps {
  pertesRetours: PerteRetour[];
  lots: Lot[];
  medicaments: Medicament[];
  mouvements: MouvementStock[];
  onCreatePerteRetour: (perteRetour: Omit<PerteRetour, 'id'>) => void;
  onValiderPerteRetour: (id: string) => void;
  onRejeterPerteRetour: (id: string, motif: string) => void;
}

const GestionPertesRetoursComponent: React.FC<GestionPertesRetoursProps> = ({
  pertesRetours,
  lots,
  medicaments,
  mouvements,
  onCreatePerteRetour,
  onValiderPerteRetour,
  onRejeterPerteRetour,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  // const [editingItem, setEditingItem] = useState<PerteRetour | null>(null);
  const [formData, setFormData] = useState({
    type: 'perte' as 'perte' | 'retour',
    medicamentId: '',
    lotId: '',
    quantite: 0,
    motif: '',
    observations: '',
    referenceDocument: '',
  });

  const toggleExpansion = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return 'warning';
      case 'valide':
        return 'success';
      case 'rejete':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return <Warning color="warning" />;
      case 'valide':
        return <CheckCircle color="success" />;
      case 'rejete':
        return <Cancel color="error" />;
      default:
        return <Warning />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'perte':
        return <Error color="error" />;
      case 'retour':
        return <LocalShipping color="info" />;
      default:
        return <Inventory />;
    }
  };

  const getLotsDisponibles = (medicamentId: string, type: 'perte' | 'retour') => {
    if (type === 'perte') {
      // Pour les pertes, on peut sélectionner tous les lots avec stock disponible
      return lots.filter(lot => 
        lot.medicamentId === medicamentId && 
        lot.statut === 'actif' &&
        lot.quantiteDisponible > 0
      );
    } else {
      // Pour les retours, on peut sélectionner les lots du magasin détail
      return lots.filter(lot => 
        lot.medicamentId === medicamentId && 
        lot.magasin === 'detail' &&
        lot.statut === 'actif'
      );
    }
  };

  const handleCreatePerteRetour = () => {
    if (formData.medicamentId && formData.lotId && formData.quantite > 0 && formData.motif) {
      const lot = lots.find(l => l.id === formData.lotId);
      
      if (lot && formData.quantite <= lot.quantiteDisponible) {
        const nouvellePerteRetour: Omit<PerteRetour, 'id'> = {
          type: formData.type,
          medicamentId: formData.medicamentId,
          lotId: formData.lotId,
          quantite: formData.quantite,
          motif: formData.motif,
          utilisateurId: 'USER001', // À remplacer par l'utilisateur connecté
          dateCreation: new Date(),
          statut: 'en_cours',
          observations: formData.observations,
          referenceDocument: formData.referenceDocument,
        };
        
        onCreatePerteRetour(nouvellePerteRetour);
        setFormData({
          type: 'perte',
          medicamentId: '',
          lotId: '',
          quantite: 0,
          motif: '',
          observations: '',
          referenceDocument: '',
        });
        setOpenDialog(false);
      }
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

  const getMouvementsLot = (lotId: string) => {
    return mouvements.filter(mouvement => mouvement.lotId === lotId);
  };

  const getMotifsPredefinis = (type: 'perte' | 'retour') => {
    if (type === 'perte') {
      return [
        'Casse lors du transport',
        'Casse lors du stockage',
        'Vol',
        'Erreur de saisie',
        'Produit défectueux',
        'Expiration',
        'Autre',
      ];
    } else {
      return [
        'Retour patient',
        'Retour service',
        'Erreur de dispensation',
        'Produit défectueux',
        'Autre',
      ];
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Gestion des Pertes et Retours ({pertesRetours.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Nouvelle {formData.type === 'perte' ? 'Perte' : 'Retour'}
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Actions</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Médicament</TableCell>
                  <TableCell>Lot</TableCell>
                  <TableCell>Quantité</TableCell>
                  <TableCell>Motif</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pertesRetours.map((item) => (
                  <React.Fragment key={item.id}>
                    <TableRow>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleExpansion(item.id)}
                        >
                          {expandedItems.has(item.id) ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getTypeIcon(item.type)}
                          label={item.type === 'perte' ? 'Perte' : 'Retour'}
                          color={item.type === 'perte' ? 'error' : 'info'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {getMedicamentNom(item.medicamentId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getLotNumero(item.lotId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.quantite} unités
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {item.motif}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.dateCreation.toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatutIcon(item.statut)}
                          label={item.statut}
                          color={getStatutColor(item.statut) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {item.statut === 'en_cours' && (
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => onValiderPerteRetour(item.id)}
                              title="Valider"
                            >
                              <CheckCircle />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onRejeterPerteRetour(item.id, 'Rejeté par l\'utilisateur')}
                              title="Rejeter"
                            >
                              <Cancel />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                        <Collapse in={expandedItems.has(item.id)} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Détails de la {item.type}
                            </Typography>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Observations:</strong> {item.observations || 'Aucune observation'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Référence:</strong> {item.referenceDocument || 'Aucune référence'}
                                </Typography>
                              </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle2" gutterBottom>
                              Historique des mouvements du lot
                            </Typography>
                            
                            <List dense>
                              {getMouvementsLot(item.lotId).map((mouvement) => (
                                <ListItem key={mouvement.id} sx={{ pl: 0 }}>
                                  <ListItemIcon>
                                    <Inventory />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Typography variant="body2">
                                        {mouvement.type}: {mouvement.quantite} unités
                                      </Typography>
                                    }
                                    secondary={
                                      <Typography variant="caption" color="text.secondary">
                                        {mouvement.dateMouvement.toLocaleDateString('fr-FR')} - {mouvement.motif}
                                      </Typography>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog Nouvelle Perte/Retour */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Nouvelle {formData.type === 'perte' ? 'Perte' : 'Retour'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'perte' | 'retour' })}
                  label="Type"
                >
                  <MenuItem value="perte">Perte</MenuItem>
                  <MenuItem value="retour">Retour</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Médicament</InputLabel>
                <Select
                  value={formData.medicamentId}
                  onChange={(e) => setFormData({ ...formData, medicamentId: e.target.value, lotId: '' })}
                  label="Médicament"
                  required
                >
                  {medicaments.map((med) => (
                    <MenuItem key={med.id} value={med.id}>
                      {med.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Lot</InputLabel>
                <Select
                  value={formData.lotId}
                  onChange={(e) => setFormData({ ...formData, lotId: e.target.value })}
                  label="Lot"
                  disabled={!formData.medicamentId}
                  required
                >
                  {formData.medicamentId && getLotsDisponibles(formData.medicamentId, formData.type).map((lot) => (
                    <MenuItem key={lot.id} value={lot.id}>
                      {lot.numeroLot} ({lot.quantiteDisponible} dispo.)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantité"
                value={formData.quantite}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setFormData({ ...formData, quantite: value });
                }}
                disabled={!formData.lotId}
                inputProps={{ min: 0, step: 1 }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Motif</InputLabel>
                <Select
                  value={formData.motif}
                  onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                  label="Motif"
                  required
                >
                  {getMotifsPredefinis(formData.type).map((motif) => (
                    <MenuItem key={motif} value={motif}>
                      {motif}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Référence document (optionnel)"
                value={formData.referenceDocument}
                onChange={(e) => setFormData({ ...formData, referenceDocument: e.target.value })}
                placeholder="N° document, BL, etc."
              />
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

          {formData.lotId && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Stock disponible dans ce lot: {lots.find(l => l.id === formData.lotId)?.quantiteDisponible || 0} unités
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button
            onClick={handleCreatePerteRetour}
            variant="contained"
            disabled={!formData.medicamentId || !formData.lotId || formData.quantite <= 0 || !formData.motif}
          >
            Créer la {formData.type === 'perte' ? 'perte' : 'retour'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GestionPertesRetoursComponent;
