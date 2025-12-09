import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  TableChart,
  Refresh,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { 
  RapportStock, 
  AlerteStock,
  MouvementStock,
} from '../../types/stock';
import { 
  hasPermission,
  UtilisateurStock,
  MagasinAcces,
} from '../../types/permissions';
import { formatCurrency } from '../../utils/currency';

interface GestionRapportsProps {
  utilisateur: UtilisateurStock;
  medicaments: any[];
  lots: any[];
  mouvements: MouvementStock[];
  alertes: AlerteStock[];
  onGenererRapport: (periode: { debut: Date; fin: Date }, magasin: MagasinAcces) => void;
  onExporterDonnees: (format: 'csv' | 'pdf' | 'excel', periode: { debut: Date; fin: Date }, magasin: MagasinAcces) => void;
}

const GestionRapportsComponent: React.FC<GestionRapportsProps> = ({
  utilisateur,
  medicaments,
  lots,
  mouvements,
  alertes,
  onGenererRapport,
  onExporterDonnees,
}) => {
  const [periode, setPeriode] = useState({
    debut: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    fin: new Date(),
  });
  const [magasinSelectionne, setMagasinSelectionne] = useState<'gros' | 'detail' | 'tous'>('detail');
  const [rapportActuel, setRapportActuel] = useState<RapportStock | null>(null);

  const canGenerateRapports = hasPermission(utilisateur, 'generation_rapports');
  const canExportDonnees = hasPermission(utilisateur, 'export_donnees');
  const canAccessMagasin = (magasin: 'gros' | 'detail' | 'tous') => {
    return utilisateur.magasinPrincipal === 'tous' || utilisateur.magasinPrincipal === magasin;
  };

  const handleGenererRapport = () => {
    if (canGenerateRapports && canAccessMagasin(magasinSelectionne)) {
      onGenererRapport(periode, magasinSelectionne);
      // Simulation d'un rapport pour la démonstration
      genererRapportDemo();
    }
  };

  const handleExporterDonnees = (format: 'csv' | 'pdf' | 'excel') => {
    if (canExportDonnees && canAccessMagasin(magasinSelectionne)) {
      onExporterDonnees(format, periode, magasinSelectionne);
    }
  };

  const genererRapportDemo = () => {
    const medicamentsFiltres = medicaments.filter(m => {
      if (magasinSelectionne === 'gros') return true;
      if (magasinSelectionne === 'detail') {
        return lots.some(l => l.medicamentId === m.id && l.magasin === 'detail');
      }
      return true;
    });

    const mouvementsFiltres = mouvements.filter(m => {
      if (magasinSelectionne === 'gros') return m.magasinSource === 'gros' || m.magasinDestination === 'gros';
      if (magasinSelectionne === 'detail') return m.magasinSource === 'detail' || m.magasinDestination === 'detail';
      return true;
    });

    const alertesFiltrees = alertes.filter(a => {
      const medicament = medicaments.find(m => m.id === a.medicamentId);
      if (!medicament) return false;
      if (magasinSelectionne === 'gros') return true;
      if (magasinSelectionne === 'detail') {
        return lots.some(l => l.medicamentId === a.medicamentId && l.magasin === 'detail');
      }
      return true;
    });

    const rapport: RapportStock = {
      periode,
      magasin: magasinSelectionne,
      medicaments: medicamentsFiltres.map(m => {
        const lotsMedicament = lots.filter(l => l.medicamentId === m.id);
        const stockTotal = lotsMedicament.reduce((total, l) => total + l.quantiteDisponible, 0);
        const valeurStock = stockTotal * m.prixUnitaire;
        
        return {
          medicamentId: m.id,
          nom: m.nom,
          quantiteInitiale: stockTotal,
          quantiteFinale: stockTotal,
          entrees: mouvementsFiltres
            .filter(mv => mv.medicamentId === m.id && mv.type === 'reception')
            .reduce((total, mv) => total + mv.quantite, 0),
          sorties: mouvementsFiltres
            .filter(mv => mv.medicamentId === m.id && (mv.type === 'dispensation' || mv.type === 'transfert'))
            .reduce((total, mv) => total + mv.quantite, 0),
          pertes: mouvementsFiltres
            .filter(mv => mv.medicamentId === m.id && mv.type === 'perte')
            .reduce((total, mv) => total + mv.quantite, 0),
          retours: mouvementsFiltres
            .filter(mv => mv.medicamentId === m.id && mv.type === 'retour')
            .reduce((total, mv) => total + mv.quantite, 0),
          valeurStock,
          alertes: alertesFiltrees.filter(a => a.medicamentId === m.id),
        };
      }),
      mouvements: mouvementsFiltres,
      alertes: alertesFiltrees,
      statistiques: {
        totalEntrees: mouvementsFiltres
          .filter(mv => mv.type === 'reception')
          .reduce((total, mv) => total + mv.quantite, 0),
        totalSorties: mouvementsFiltres
          .filter(mv => mv.type === 'dispensation' || mv.type === 'transfert')
          .reduce((total, mv) => total + mv.quantite, 0),
        totalPertes: mouvementsFiltres
          .filter(mv => mv.type === 'perte')
          .reduce((total, mv) => total + mv.quantite, 0),
        totalRetours: mouvementsFiltres
          .filter(mv => mv.type === 'retour')
          .reduce((total, mv) => total + mv.quantite, 0),
        valeurStock: medicamentsFiltres.reduce((total, m) => {
          const lotsMedicament = lots.filter(l => l.medicamentId === m.id);
          const stockTotal = lotsMedicament.reduce((total, l) => total + l.quantiteDisponible, 0);
          return total + (stockTotal * m.prixUnitaire);
        }, 0),
      },
    };

    setRapportActuel(rapport);
  };

  // const getStatutColor = (statut: string) => {
  //   switch (statut) {
  //     case 'active':
  //       return 'error';
  //     case 'resolue':
  //       return 'success';
  //     case 'ignoree':
  //       return 'default';
  //     default:
  //       return 'default';
  //   }
  // };

  const getNiveauColor = (niveau: string) => {
    switch (niveau) {
      case 'critique':
        return 'error';
      case 'avertissement':
        return 'warning';
      case 'information':
        return 'info';
      default:
        return 'default';
    }
  };

  if (!canGenerateRapports) {
    return (
      <Alert severity="warning">
        Vous n'avez pas les permissions nécessaires pour générer des rapports.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestion des Rapports et Exports
      </Typography>

      {/* Configuration du rapport */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuration du Rapport
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Date de début"
                type="date"
                value={periode.debut.toISOString().split('T')[0]}
                onChange={(e) => setPeriode({ ...periode, debut: new Date(e.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Date de fin"
                type="date"
                value={periode.fin.toISOString().split('T')[0]}
                onChange={(e) => setPeriode({ ...periode, fin: new Date(e.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Magasin</InputLabel>
                <Select
                  value={magasinSelectionne}
                  onChange={(e) => setMagasinSelectionne(e.target.value as 'gros' | 'detail' | 'tous')}
                  label="Magasin"
                >
                  {canAccessMagasin('gros') && (
                    <MenuItem value="gros">Magasin Gros</MenuItem>
                  )}
                  {canAccessMagasin('detail') && (
                    <MenuItem value="detail">Magasin Détail</MenuItem>
                  )}
                  {canAccessMagasin('tous') && (
                    <MenuItem value="tous">Tous les Magasins</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Refresh />}
                onClick={handleGenererRapport}
                sx={{ height: 56 }}
              >
                Générer Rapport
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Actions d'export */}
      {canExportDonnees && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Export des Données
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleExporterDonnees('csv')}
                >
                  Export CSV
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<TableChart />}
                  onClick={() => handleExporterDonnees('excel')}
                >
                  Export Excel
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdf />}
                  onClick={() => handleExporterDonnees('pdf')}
                >
                  Export PDF
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Affichage du rapport */}
      {rapportActuel && (
        <Box>
          {/* Résumé des statistiques */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Résumé des Statistiques
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {rapportActuel.statistiques.totalEntrees}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Entrées
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="secondary">
                      {rapportActuel.statistiques.totalSorties}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Sorties
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="error">
                      {rapportActuel.statistiques.totalPertes}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Pertes
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning">
                      {rapportActuel.statistiques.totalRetours}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Retours
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success">
                      {formatCurrency(rapportActuel.statistiques.valeurStock)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Valeur du Stock
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Détail des médicaments */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Détail par Médicament ({rapportActuel.medicaments.length})
              </Typography>
              
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Médicament</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Entrées</TableCell>
                      <TableCell>Sorties</TableCell>
                      <TableCell>Pertes</TableCell>
                      <TableCell>Retours</TableCell>
                      <TableCell>Valeur</TableCell>
                      <TableCell>Alertes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rapportActuel.medicaments.map((med) => (
                      <TableRow key={med.medicamentId}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {med.nom}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {med.quantiteFinale}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="primary">
                            {med.entrees}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="secondary">
                            {med.sorties}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error">
                            {med.pertes}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="warning">
                            {med.retours}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(med.valeurStock)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {med.alertes.length > 0 ? (
                            <Chip
                              label={med.alertes.length}
                              color="error"
                              size="small"
                            />
                          ) : (
                            <CheckCircle color="success" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Alertes actives */}
          {rapportActuel.alertes.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alertes Actives ({rapportActuel.alertes.length})
                </Typography>
                
                <Grid container spacing={2}>
                  {rapportActuel.alertes.map((alerte) => (
                    <Grid item xs={12} md={6} key={alerte.id}>
                      <Box
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: alerte.niveau === 'critique' ? 'error.light' : 'background.paper',
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Warning color={getNiveauColor(alerte.niveau) as any} />
                          <Typography variant="body2" fontWeight="medium">
                            {alerte.message}
                          </Typography>
                          <Chip
                            label={alerte.niveau}
                            color={getNiveauColor(alerte.niveau) as any}
                            size="small"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Créée le {alerte.dateCreation.toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};

export default GestionRapportsComponent;
