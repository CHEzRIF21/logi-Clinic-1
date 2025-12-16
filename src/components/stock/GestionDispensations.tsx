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
  Collapse,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  Cancel,
  RemoveShoppingCart,
  Person,
  Business,
  ExpandMore,
  ExpandLess,
  Inventory,
} from '@mui/icons-material';
import { Dispensation, DispensationLigne, Lot, Medicament } from '../../types/stock';
import { formatCurrency } from '../../utils/currency';

interface GestionDispensationsProps {
  dispensations: Dispensation[];
  lots: Lot[];
  medicaments: Medicament[];
  onCreateDispensation: (dispensation: Omit<Dispensation, 'id'>) => void;
  onValiderDispensation: (dispensationId: string) => void;
  onAnnulerDispensation: (dispensationId: string) => void;
}

const GestionDispensationsComponent: React.FC<GestionDispensationsProps> = ({
  dispensations,
  lots,
  medicaments,
  onCreateDispensation,
  onValiderDispensation,
  onAnnulerDispensation,
}) => {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [expandedDispensations, setExpandedDispensations] = React.useState<Set<string>>(new Set());
  const [formData, setFormData] = React.useState({
    typeDispensation: 'patient' as 'patient' | 'service',
    patientId: '',
    serviceId: '',
    medicamentId: '',
    lotId: '',
    quantite: 0,
    prescriptionId: '',
    observations: '',
  });
  const [lignesDispensation, setLignesDispensation] = React.useState<Omit<DispensationLigne, 'id' | 'dispensationId'>[]>([]);

  const toggleDispensationExpansion = (dispensationId: string) => {
    const newExpanded = new Set(expandedDispensations);
    if (newExpanded.has(dispensationId)) {
      newExpanded.delete(dispensationId);
    } else {
      newExpanded.add(dispensationId);
    }
    setExpandedDispensations(newExpanded);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return 'warning';
      case 'terminee':
        return 'success';
      case 'annulee':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return <RemoveShoppingCart color="warning" />;
      case 'terminee':
        return <CheckCircle color="success" />;
      case 'annulee':
        return <Cancel color="error" />;
      default:
        return <RemoveShoppingCart />;
    }
  };

  const getLotsDisponibles = (medicamentId: string) => {
    return lots.filter(lot => 
      lot.medicamentId === medicamentId && 
      lot.magasin === 'detail' && 
      lot.statut === 'actif' &&
      lot.quantiteDisponible > 0
    );
  };

  const handleAddLigne = () => {
    if (formData.medicamentId && formData.lotId && formData.quantite > 0) {
      const medicament = medicaments.find(m => m.id === formData.medicamentId);
      const lot = lots.find(l => l.id === formData.lotId);
      
      if (medicament && lot && formData.quantite <= lot.quantiteDisponible) {
        const prixTotal = formData.quantite * medicament.prixUnitaire;
        
        setLignesDispensation([...lignesDispensation, {
          medicamentId: formData.medicamentId,
          lotId: formData.lotId,
          quantite: formData.quantite,
          prixUnitaire: medicament.prixUnitaire,
          prixTotal: prixTotal,
        }]);
        
        setFormData({
          ...formData,
          medicamentId: '',
          lotId: '',
          quantite: 0,
        });
      }
    }
  };

  const handleRemoveLigne = (index: number) => {
    setLignesDispensation(lignesDispensation.filter((_, i) => i !== index));
  };

  const handleCreateDispensation = () => {
    if (lignesDispensation.length > 0 && 
        ((formData.typeDispensation === 'patient' && formData.patientId) ||
         (formData.typeDispensation === 'service' && formData.serviceId))) {
      
      const nouvelleDispensation: Omit<Dispensation, 'id'> = {
        numeroDispensation: `DISP-${new Date().getFullYear()}-${String(dispensations.length + 1).padStart(3, '0')}`,
        dateDispensation: new Date(),
        patientId: formData.typeDispensation === 'patient' ? formData.patientId : undefined,
        serviceId: formData.typeDispensation === 'service' ? formData.serviceId : undefined,
        typeDispensation: formData.typeDispensation,
        statut: 'en_cours',
        medicaments: lignesDispensation.map((ligne, index) => ({
          id: `temp-${index}`,
          dispensationId: '',
          ...ligne,
        })),
        utilisateurId: 'USER002', // À remplacer par l'utilisateur connecté
        prescriptionId: formData.prescriptionId || undefined,
        observations: formData.observations,
      };
      
      onCreateDispensation(nouvelleDispensation);
      setLignesDispensation([]);
      setFormData({
        typeDispensation: 'patient',
        patientId: '',
        serviceId: '',
        medicamentId: '',
        lotId: '',
        quantite: 0,
        prescriptionId: '',
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

  const getTotalDispensation = (lignes: any[]) => {
    return lignes.reduce((total, ligne) => total + ligne.prixTotal, 0);
  };

  // Données de démonstration pour les patients et services
  const patientsDemo = [
    { id: 'PAT001', nom: 'Dupont Jean', numero: 'P001' },
    { id: 'PAT002', nom: 'Martin Marie', numero: 'P002' },
    { id: 'PAT003', nom: 'Bernard Pierre', numero: 'P003' },
  ];

  const servicesDemo = [
    { id: 'SER001', nom: 'Médecine Générale', code: 'MG' },
    { id: 'SER002', nom: 'Pédiatrie', code: 'PED' },
    { id: 'SER003', nom: 'Chirurgie', code: 'CHIR' },
  ];

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Gestion des Dispensations ({dispensations.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Nouvelle Dispensation
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Actions</TableCell>
                  <TableCell>N° Dispensation</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Destinataire</TableCell>
                  <TableCell>Médicaments</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dispensations.map((dispensation) => (
                  <React.Fragment key={dispensation.id}>
                    <TableRow>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleDispensationExpansion(dispensation.id)}
                        >
                          {expandedDispensations.has(dispensation.id) ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {dispensation.numeroDispensation}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dispensation.dateDispensation.toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={dispensation.typeDispensation === 'patient' ? <Person /> : <Business />}
                          label={dispensation.typeDispensation === 'patient' ? 'Patient' : 'Service'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dispensation.typeDispensation === 'patient' 
                            ? patientsDemo.find(p => p.id === dispensation.patientId)?.nom || dispensation.patientId
                            : servicesDemo.find(s => s.id === dispensation.serviceId)?.nom || dispensation.serviceId
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dispensation.medicaments.length} médicament(s)
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(getTotalDispensation(dispensation.medicaments))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatutIcon(dispensation.statut)}
                          label={dispensation.statut}
                          color={getStatutColor(dispensation.statut) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {dispensation.statut === 'en_cours' && (
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => onValiderDispensation(dispensation.id)}
                              title="Valider la dispensation"
                            >
                              <CheckCircle />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onAnnulerDispensation(dispensation.id)}
                              title="Annuler la dispensation"
                            >
                              <Cancel />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                        <Collapse in={expandedDispensations.has(dispensation.id)} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Détails de la dispensation
                            </Typography>
                            <List dense>
                              {dispensation.medicaments.map((ligne) => (
                                <ListItem key={ligne.id} sx={{ pl: 2 }}>
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
                                        Quantité: {ligne.quantite} × {formatCurrency(ligne.prixUnitaire)} = {formatCurrency(ligne.prixTotal)}
                                      </Typography>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                            {dispensation.observations && (
                              <>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="caption" color="text.secondary">
                                  Observations: {dispensation.observations}
                                </Typography>
                              </>
                            )}
                            {dispensation.prescriptionId && (
                              <>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="caption" color="text.secondary">
                                  Prescription: {dispensation.prescriptionId}
                                </Typography>
                              </>
                            )}
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nouvelle Dispensation</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type de dispensation</InputLabel>
                <Select
                  value={formData.typeDispensation}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    typeDispensation: e.target.value as 'patient' | 'service',
                    patientId: '',
                    serviceId: ''
                  })}
                  label="Type de dispensation"
                >
                  <MenuItem value="patient">Patient</MenuItem>
                  <MenuItem value="service">Service</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {formData.typeDispensation === 'patient' ? (
                <Autocomplete
                  options={patientsDemo}
                  getOptionLabel={(option) => `${option.nom} (${option.numero})`}
                  value={patientsDemo.find(p => p.id === formData.patientId) || null}
                  onChange={(_, newValue) => setFormData({ ...formData, patientId: newValue?.id || '' })}
                  renderInput={(params) => (
                    <TextField {...params} label="Patient" required />
                  )}
                />
              ) : (
                <Autocomplete
                  options={servicesDemo}
                  getOptionLabel={(option) => `${option.nom} (${option.code})`}
                  value={servicesDemo.find(s => s.id === formData.serviceId) || null}
                  onChange={(_, newValue) => setFormData({ ...formData, serviceId: newValue?.id || '' })}
                  renderInput={(params) => (
                    <TextField {...params} label="Service" required />
                  )}
                />
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Médicament</InputLabel>
                <Select
                  value={formData.medicamentId}
                  onChange={(e) => setFormData({ ...formData, medicamentId: e.target.value })}
                  label="Médicament"
                >
                  {medicaments.map((med) => (
                    <MenuItem key={med.id} value={med.id}>
                      {med.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Lot</InputLabel>
                <Select
                  value={formData.lotId}
                  onChange={(e) => setFormData({ ...formData, lotId: e.target.value })}
                  label="Lot"
                  disabled={!formData.medicamentId}
                >
                  {formData.medicamentId && getLotsDisponibles(formData.medicamentId).map((lot) => (
                    <MenuItem key={lot.id} value={lot.id}>
                      {lot.numeroLot} ({lot.quantiteDisponible} dispo.)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
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
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="N° Prescription (optionnel)"
                value={formData.prescriptionId}
                onChange={(e) => setFormData({ ...formData, prescriptionId: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddLigne}
                disabled={!formData.medicamentId || !formData.lotId || formData.quantite <= 0}
              >
                Ajouter à la dispensation
              </Button>
            </Grid>
          </Grid>

          {lignesDispensation.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Lignes de la dispensation ({lignesDispensation.length})
              </Typography>
              <List dense>
                {lignesDispensation.map((ligne, index) => (
                  <ListItem key={index} sx={{ pl: 2 }}>
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
                          Quantité: {ligne.quantite} × {formatCurrency(ligne.prixUnitaire)} = {formatCurrency(ligne.prixTotal)}
                        </Typography>
                      }
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveLigne(index)}
                    >
                      <Cancel />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" align="right">
                Total: {formatCurrency(getTotalDispensation(lignesDispensation))}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button
            onClick={handleCreateDispensation}
            variant="contained"
            disabled={lignesDispensation.length === 0 || 
                     (formData.typeDispensation === 'patient' && !formData.patientId) ||
                     (formData.typeDispensation === 'service' && !formData.serviceId)}
          >
            Créer la dispensation
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GestionDispensationsComponent;
