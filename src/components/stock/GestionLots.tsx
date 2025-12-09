import React from 'react';
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
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Warning,
  Error,
  CheckCircle,
  Inventory,
  LocalShipping,
  RemoveShoppingCart,
  Assignment,
} from '@mui/icons-material';
import { Lot, MouvementStock } from '../../types/stock';
import { formatCurrency } from '../../utils/currency';

interface GestionLotsProps {
  lots: Lot[];
  mouvements: MouvementStock[];
  onVoirMouvements: (lotId: string) => void;
}

const GestionLotsComponent: React.FC<GestionLotsProps> = ({
  lots,
  mouvements,
  onVoirMouvements,
}) => {
  const [expandedLots, setExpandedLots] = React.useState<Set<string>>(new Set());

  const toggleLotExpansion = (lotId: string) => {
    const newExpanded = new Set(expandedLots);
    if (newExpanded.has(lotId)) {
      newExpanded.delete(lotId);
    } else {
      newExpanded.add(lotId);
    }
    setExpandedLots(newExpanded);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif':
        return 'success';
      case 'expire':
        return 'error';
      case 'epuise':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <CheckCircle color="success" />;
      case 'expire':
        return <Error color="error" />;
      case 'epuise':
        return <Warning color="warning" />;
      default:
        return <Inventory />;
    }
  };

  const getMagasinIcon = (magasin: string) => {
    switch (magasin) {
      case 'gros':
        return <LocalShipping color="primary" />;
      case 'detail':
        return <RemoveShoppingCart color="secondary" />;
      default:
        return <Inventory />;
    }
  };

  const getMouvementsLot = (lotId: string) => {
    return mouvements.filter(mouvement => mouvement.lotId === lotId);
  };

  const getMouvementIcon = (type: string) => {
    switch (type) {
      case 'reception':
        return <LocalShipping color="success" />;
      case 'transfert':
        return <Assignment color="info" />;
      case 'dispensation':
        return <RemoveShoppingCart color="secondary" />;
      case 'retour':
        return <LocalShipping color="warning" />;
      case 'perte':
        return <Error color="error" />;
      case 'correction':
        return <Assignment color="info" />;
      default:
        return <Inventory />;
    }
  };

  const getMouvementLabel = (type: string) => {
    switch (type) {
      case 'reception':
        return 'Réception';
      case 'transfert':
        return 'Transfert';
      case 'dispensation':
        return 'Dispensation';
      case 'retour':
        return 'Retour';
      case 'perte':
        return 'Perte';
      case 'correction':
        return 'Correction';
      default:
        return type;
    }
  };

  const isExpirationProche = (dateExpiration: Date) => {
    const aujourdhui = new Date();
    const trenteJours = new Date();
    trenteJours.setDate(aujourdhui.getDate() + 30);
    return dateExpiration <= trenteJours && dateExpiration > aujourdhui;
  };

  const isExpire = (dateExpiration: Date) => {
    return dateExpiration <= new Date();
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Gestion des Lots ({lots.length})
        </Typography>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Actions</TableCell>
                <TableCell>N° Lot</TableCell>
                <TableCell>Médicament</TableCell>
                <TableCell>Magasin</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Prix Achat</TableCell>
                <TableCell>Date Réception</TableCell>
                <TableCell>Date Expiration</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lots.map((lot) => {
                const mouvementsLot = getMouvementsLot(lot.id);
                const expirationProche = isExpirationProche(lot.dateExpiration);
                const expire = isExpire(lot.dateExpiration);
                
                return (
                  <React.Fragment key={lot.id}>
                    <TableRow
                      sx={{
                        backgroundColor: expire ? 'error.light' : 
                                       expirationProche ? 'warning.light' : 'inherit',
                      }}
                    >
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleLotExpansion(lot.id)}
                        >
                          {expandedLots.has(lot.id) ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {lot.numeroLot}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {lot.medicamentId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={`Magasin ${lot.magasin}`}>
                          <Box display="flex" alignItems="center">
                            {getMagasinIcon(lot.magasin)}
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {lot.quantiteDisponible} / {lot.quantiteInitiale}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatCurrency(lot.prixAchat)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {lot.dateReception.toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2"
                          color={expire ? 'error' : expirationProche ? 'warning' : 'inherit'}
                        >
                          {lot.dateExpiration.toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatutIcon(lot.statut)}
                          label={lot.statut}
                          color={getStatutColor(lot.statut) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                        <Collapse in={expandedLots.has(lot.id)} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Mouvements du lot
                            </Typography>
                            {mouvementsLot.length > 0 ? (
                              <List dense>
                                {mouvementsLot.map((mouvement) => (
                                  <ListItem key={mouvement.id} sx={{ pl: 2 }}>
                                    <ListItemIcon>
                                      {getMouvementIcon(mouvement.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                          <Typography variant="body2">
                                            {getMouvementLabel(mouvement.type)}: {mouvement.quantite} unités
                                          </Typography>
                                          <Chip
                                            label={mouvement.motif}
                                            size="small"
                                            variant="outlined"
                                          />
                                        </Box>
                                      }
                                      secondary={
                                        <Typography variant="caption" color="text.secondary">
                                          {mouvement.dateMouvement.toLocaleDateString('fr-FR')} - 
                                          {mouvement.referenceDocument && ` Ref: ${mouvement.referenceDocument}`}
                                        </Typography>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Aucun mouvement enregistré pour ce lot
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default GestionLotsComponent;
