import React, { useMemo, useState, useEffect } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  LocalShipping,
  CheckCircle,
  Cancel,
  Warning,
  Assignment,
  Inventory,
  Store,
  Person,
  DateRange,
  Description,
  Refresh,
  Print,
  Download,
  Delete,
} from '@mui/icons-material';
import { StockService } from '../../services/stockService';
import { TransfertSupabase, TransfertLigneSupabase, LotSupabase, MedicamentSupabase } from '../../services/stockSupabase';
import { supabase } from '../../services/supabase';
import { useMedicaments } from '../../hooks/useMedicaments';

// Types pour les transferts
interface Transfert {
  id: string;
  numeroTransfert: string;
  medicamentId: string;
  medicamentNom: string;
  medicamentCode: string;
  quantite: number;
  dateDemande: Date;
  dateValidation?: Date;
  dateReception?: Date;
  statut: 'en_attente' | 'valide' | 'en_cours' | 'recu' | 'annule';
  origine: 'magasin_gros';
  destination: 'magasin_detail';
  demandeur: string;
  validateur?: string;
  recepteur?: string;
  motif: string;
  observations?: string;
  stockGrosAvant: number;
  stockGrosApres: number;
  stockDetailAvant: number;
  stockDetailApres: number;
}

interface DemandeTransfert {
  id: string;
  medicamentId: string;
  quantiteDemandee: number;
  motif: string;
  demandeur: string;
  dateDemande: Date;
  statut: 'en_attente' | 'approuvee' | 'rejetee';
  priorite: 'normale' | 'urgente' | 'critique';
}

export type GestionTransfertsContext = 'pharmacie' | 'stock';

interface GestionTransfertsProps {
  context?: GestionTransfertsContext;
  onTransfertValide?: () => void;
}

const GestionTransferts: React.FC<GestionTransfertsProps> = ({ context = 'stock', onTransfertValide }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [openDemande, setOpenDemande] = useState(false);
  const [openValidation, setOpenValidation] = useState(false);
  const [openReception, setOpenReception] = useState(false);
  const [openTransfertManuel, setOpenTransfertManuel] = useState(false);
  const [selectedTransfert, setSelectedTransfert] = useState<any>(null);
  // (legacy) demandes demo non utilisées, conservées pour compatibilité UI
  const [loading, setLoading] = useState(false);

  // Éviter de rester sur l'onglet "Réception" côté Magasin Gros
  useEffect(() => {
    if (context === 'stock' && activeTab === 2) {
      setActiveTab(0);
    }
  }, [context, activeTab]);

  // Utilisateur courant (si auth Supabase activée)
  const [currentUserId, setCurrentUserId] = useState<string>('system');
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) setCurrentUserId(data.user.id);
      } catch {
        // garder "system" si pas d'auth
      }
    })();
  }, []);

  // Données réelles
  const [transferts, setTransferts] = useState<TransfertSupabase[]>([]);
  const [transfertsHistorique, setTransfertsHistorique] = useState<TransfertSupabase[]>([]);
  const [lots, setLots] = useState<LotSupabase[]>([]);
  
  // Utiliser le hook centralisé pour les médicaments
  const { medicaments, loading: loadingMedicaments } = useMedicaments({ autoRefresh: true });

  // Filtrage selon le contexte:
  // - Pharmacie: ne voit que ses demandes + peut réceptionner
  // - Stock (Magasin Gros): voit toutes les demandes + peut valider/refuser
  const transfertsVisibles = useMemo(() => {
    if (context === 'pharmacie') {
      return (transferts || []).filter((t: any) => t.utilisateur_source_id === currentUserId);
    }
    return transferts || [];
  }, [context, transferts, currentUserId]);

  const transfertsHistoriqueVisibles = useMemo(() => {
    if (context === 'pharmacie') {
      return (transfertsHistorique || []).filter((t: any) => t.utilisateur_source_id === currentUserId);
    }
    return transfertsHistorique || [];
  }, [context, transfertsHistorique, currentUserId]);

  // États pour les formulaires
  const [demandeForm, setDemandeForm] = useState({
    medicament_id: '',
    lot_id: '',
    quantite_demandee: 0,
    motif: '',
    observations: '',
    priorite: 'normale'
  });

  // État pour transfert multiple
  interface LigneTransfert {
    id: string; // ID temporaire pour la liste
    medicament_id: string;
    medicament_nom?: string;
    lot_id: string;
    lot_numero?: string;
    quantite_demandee: number;
    stock_disponible?: number;
  }

  const [lignesTransfert, setLignesTransfert] = useState<LigneTransfert[]>([]);
  const [motifTransfert, setMotifTransfert] = useState('');
  const [observationsTransfert, setObservationsTransfert] = useState('');

  // État pour transfert manuel (Gros → Détail direct)
  const [lignesTransfertManuel, setLignesTransfertManuel] = useState<LigneTransfert[]>([]);
  const [motifTransfertManuel, setMotifTransfertManuel] = useState('');
  const [observationsTransfertManuel, setObservationsTransfertManuel] = useState('');

  const [validationForm, setValidationForm] = useState({
    observations: '',
    quantite_validee: 0
  });

  interface ValidationLine {
    ligne_id: string;
    medicament_nom: string;
    lot_numero: string;
    quantite_demandee: number;
    stock_disponible: number;
    quantite_validee: number;
  }

  const [validationLines, setValidationLines] = useState<ValidationLine[]>([]);

  const [receptionForm, setReceptionForm] = useState({
    observations: '',
    quantite_recue: 0
  });

  useEffect(() => {
    if (!openValidation || !selectedTransfert) return;
    const lignes: ValidationLine[] = (selectedTransfert.transfert_lignes || []).map((l: any) => ({
      ligne_id: l.id,
      medicament_nom: l.medicaments?.nom || 'Médicament',
      lot_numero: l.lots?.numero_lot || '-',
      quantite_demandee: Number(l.quantite || 0),
      stock_disponible: Number(l.lots?.quantite_disponible || 0),
      quantite_validee: l.quantite_validee != null ? Number(l.quantite_validee) : Number(l.quantite || 0),
    }));
    setValidationLines(lignes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openValidation, selectedTransfert?.id]);

  const setQuantiteValidee = (ligneId: string, value: number) => {
    setValidationLines(prev =>
      prev.map(l => {
        if (l.ligne_id !== ligneId) return l;
        const bounded = Math.max(0, Math.min(l.quantite_demandee, value));
        return { ...l, quantite_validee: bounded };
      })
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transfertsData, historiqueData, lotsData] = await Promise.all([
        StockService.getTransfertsEnCours(),
        StockService.getTransfertsHistorique(),
        StockService.getLotsByMagasin('gros')
      ]);
      
      setTransferts(transfertsData || []);
      setTransfertsHistorique(historiqueData || []);
      setLots(lotsData || []);
      // Les médicaments sont chargés automatiquement par le hook useMedicaments
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Données de démonstration
  const demandesDemo: DemandeTransfert[] = [
    {
      id: '1',
      medicamentId: '1',
      quantiteDemandee: 50,
      motif: 'Stock faible - besoin urgent pour consultations',
      demandeur: 'Pharmacien Principal',
      dateDemande: new Date('2024-07-20'),
      statut: 'en_attente',
      priorite: 'urgente'
    },
    {
      id: '2',
      medicamentId: '2',
      quantiteDemandee: 20,
      motif: 'Approvisionnement régulier',
      demandeur: 'Infirmier Pharmacie',
      dateDemande: new Date('2024-07-21'),
      statut: 'approuvee',
      priorite: 'normale'
    }
  ];

  const transfertsDemo: Transfert[] = [
    {
      id: '1',
      numeroTransfert: 'TR-2024-001',
      medicamentId: '1',
      medicamentNom: 'Paracétamol 500mg',
      medicamentCode: 'MED-001',
      quantite: 50,
      dateDemande: new Date('2024-07-20'),
      dateValidation: new Date('2024-07-20'),
      dateReception: new Date('2024-07-21'),
      statut: 'recu',
      origine: 'magasin_gros',
      destination: 'magasin_detail',
      demandeur: 'Pharmacien Principal',
      validateur: 'Responsable Centre',
      recepteur: 'Pharmacien Principal',
      motif: 'Stock faible - besoin urgent pour consultations',
      observations: 'Transfert validé et réceptionné',
      stockGrosAvant: 800,
      stockGrosApres: 750,
      stockDetailAvant: 150,
      stockDetailApres: 200
    },
    {
      id: '2',
      numeroTransfert: 'TR-2024-002',
      medicamentId: '2',
      medicamentNom: 'Amoxicilline 1g',
      medicamentCode: 'MED-002',
      quantite: 20,
      dateDemande: new Date('2024-07-21'),
      dateValidation: new Date('2024-07-21'),
      statut: 'en_cours',
      origine: 'magasin_gros',
      destination: 'magasin_detail',
      demandeur: 'Infirmier Pharmacie',
      validateur: 'Responsable Centre',
      motif: 'Approvisionnement régulier',
      stockGrosAvant: 150,
      stockGrosApres: 130,
      stockDetailAvant: 25,
      stockDetailApres: 45
    }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateDemande = async () => {
    try {
      setLoading(true);
      
      // Validation des lignes
      if (lignesTransfert.length === 0) {
        alert('Veuillez ajouter au moins un médicament au transfert');
        return;
      }

      // Vérifier que toutes les lignes sont complètes
      const lignesIncompletes = lignesTransfert.filter(l => 
        !l.medicament_id || !l.lot_id || l.quantite_demandee <= 0
      );
      
      if (lignesIncompletes.length > 0) {
        alert('Veuillez compléter toutes les lignes (médicament, lot et quantité)');
        return;
      }

      // Vérifier les stocks disponibles
      for (const ligne of lignesTransfert) {
        if (ligne.stock_disponible !== undefined && ligne.quantite_demandee > ligne.stock_disponible) {
          const medicament = medicaments.find(m => m.id === ligne.medicament_id);
          alert(`Stock insuffisant pour ${medicament?.nom || 'ce médicament'}. Disponible: ${ligne.stock_disponible}, Demandé: ${ligne.quantite_demandee}`);
          return;
        }
      }
      
      // Créer le transfert multiple
      await StockService.creerDemandeTransfertMultiple({
        lignes: lignesTransfert.map(l => ({
          medicament_id: l.medicament_id,
          lot_id: l.lot_id,
          quantite_demandee: l.quantite_demandee
        })),
        utilisateur_demandeur_id: currentUserId,
        motif: motifTransfert || 'Demande interne de ravitaillement (Pharmacie → Magasin Gros)',
        observations: observationsTransfert
      });
      
      // Réinitialiser le formulaire
      setLignesTransfert([]);
      setMotifTransfert('');
      setObservationsTransfert('');
      setOpenDemande(false);
      
      await loadData();
    } catch (error: any) {
      console.error('Erreur lors de la création de la demande:', error);
      alert(error.message || 'Erreur lors de la création du transfert');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour gérer les lignes de transfert multiple
  // Fonctions pour transfert manuel
  const ajouterLigneTransfertManuel = () => {
    const nouvelleLigne: LigneTransfert = {
      id: `ligne-${Date.now()}-${Math.random()}`,
      medicament_id: '',
      lot_id: '',
      quantite_demandee: 0
    };
    setLignesTransfertManuel([...lignesTransfertManuel, nouvelleLigne]);
  };

  const supprimerLigneTransfertManuel = (ligneId: string) => {
    setLignesTransfertManuel(lignesTransfertManuel.filter(l => l.id !== ligneId));
  };

  const mettreAJourLigneTransfertManuel = (ligneId: string, updates: Partial<LigneTransfert>) => {
    setLignesTransfertManuel(prev => prev.map(l => 
      l.id === ligneId ? { ...l, ...updates } : l
    ));
  };

  const handleCreateTransfertManuel = async () => {
    try {
      setLoading(true);
      
      // Validation des lignes
      if (lignesTransfertManuel.length === 0) {
        alert('Veuillez ajouter au moins un médicament au transfert');
        return;
      }

      // Vérifier que toutes les lignes sont complètes
      const lignesIncompletes = lignesTransfertManuel.filter(l => 
        !l.medicament_id || !l.lot_id || l.quantite_demandee <= 0
      );

      if (lignesIncompletes.length > 0) {
        alert('Veuillez compléter toutes les lignes de transfert (médicament, lot, quantité)');
        return;
      }

      // Préparer les données pour le transfert manuel
      const lignesData = lignesTransfertManuel.map(l => ({
        medicament_id: l.medicament_id,
        lot_id: l.lot_id,
        quantite: l.quantite_demandee
      }));

      // Créer et valider le transfert en une seule opération
      await StockService.creerTransfertManuel({
        lignes: lignesData,
        utilisateur_id: currentUserId,
        motif: motifTransfertManuel || 'Transfert manuel direct Gros → Détail',
        observations: observationsTransfertManuel
      });

      // Réinitialiser le formulaire
      setLignesTransfertManuel([]);
      setMotifTransfertManuel('');
      setObservationsTransfertManuel('');
      setOpenTransfertManuel(false);

      alert('Transfert manuel créé et validé avec succès ! Les stocks ont été mis à jour.');
      
      // Recharger les données
      await loadData();
      
      // Appeler le callback si fourni
      if (onTransfertValide) {
        onTransfertValide();
      }
    } catch (error: any) {
      console.error('Erreur lors du transfert manuel:', error);
      alert(`Erreur: ${error.message || 'Impossible de créer le transfert manuel'}`);
    } finally {
      setLoading(false);
    }
  };

  const ajouterLigneTransfert = () => {
    const nouvelleLigne: LigneTransfert = {
      id: `temp-${Date.now()}-${Math.random()}`,
      medicament_id: '',
      lot_id: '',
      quantite_demandee: 0
    };
    setLignesTransfert([...lignesTransfert, nouvelleLigne]);
  };

  const supprimerLigneTransfert = (id: string) => {
    setLignesTransfert(lignesTransfert.filter(l => l.id !== id));
  };

  const mettreAJourLigneTransfert = (id: string, updates: Partial<LigneTransfert>) => {
    setLignesTransfert(lignesTransfert.map(l => 
      l.id === id ? { ...l, ...updates } : l
    ));
  };

  // Charger les lots disponibles pour un médicament
  const getLotsDisponibles = (medicamentId: string) => {
    return lots.filter(l => 
      l.medicament_id === medicamentId && 
      l.magasin === 'gros' && 
      l.statut === 'actif' &&
      l.quantite_disponible > 0
    );
  };

  const handleValidateTransfert = async () => {
    if (!selectedTransfert) return;
    
    try {
      setLoading(true);
      await StockService.validerTransfert(selectedTransfert.id, currentUserId, {
        lignes: validationLines.map(l => ({ id: l.ligne_id, quantite_validee: l.quantite_validee })),
        observations: validationForm.observations || undefined,
      });
      
      setOpenValidation(false);
      setValidationForm({
        observations: '',
        quantite_validee: 0
      });
      setValidationLines([]);
      setSelectedTransfert(null);
      
      alert('Validation enregistrée. Les stocks ont été mis à jour.');
      await loadData();
      
      // Appeler le callback si fourni
      if (onTransfertValide) {
        onTransfertValide();
      }
    } catch (error: any) {
      console.error('Erreur lors de la validation du transfert:', error);
      alert(`Erreur: ${error.message || 'Impossible de valider le transfert'}`);
    } finally {
      setLoading(false);
    }
  };

  // Refuser un transfert
  const [openRefus, setOpenRefus] = useState(false);
  const [motifRefus, setMotifRefus] = useState('');

  const handleRefuserTransfert = async () => {
    if (!selectedTransfert) return;
    if (!motifRefus.trim()) {
      alert('Veuillez saisir un motif de refus');
      return;
    }
    
    try {
      setLoading(true);
      await StockService.refuserTransfert(selectedTransfert.id, currentUserId, motifRefus);
      
      setOpenRefus(false);
      setMotifRefus('');
      setSelectedTransfert(null);
      
      alert('Transfert refusé.');
      await loadData();
      
      // Appeler le callback si fourni
      if (onTransfertValide) {
        onTransfertValide();
      }
    } catch (error: any) {
      console.error('Erreur lors du refus du transfert:', error);
      alert(`Erreur: ${error.message || 'Impossible de refuser le transfert'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveTransfert = async () => {
    if (!selectedTransfert) return;
    
    try {
      setLoading(true);
      await StockService.receptionnerTransfert(
        selectedTransfert.id,
        currentUserId,
        receptionForm.observations || undefined
      );
      
      setOpenReception(false);
      setReceptionForm({
        observations: '',
        quantite_recue: 0
      });
      setSelectedTransfert(null);
      
      alert('Réception confirmée.');
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la réception du transfert:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'warning';
      case 'valide': return 'info';
      case 'partiel': return 'secondary';
      case 'en_cours': return 'primary';
      case 'recu': return 'success';
      case 'annule': return 'error';
      default: return 'default';
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'critique': return 'error';
      case 'urgente': return 'warning';
      case 'normale': return 'success';
      default: return 'default';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'en_attente': return <Warning />;
      case 'valide': return <CheckCircle />;
      case 'partiel': return <CheckCircle />;
      case 'en_cours': return <LocalShipping />;
      case 'recu': return <Inventory />;
      case 'annule': return <Cancel />;
      default: return <Assignment />;
    }
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestion des Ajustements
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ajustements de stock et bons de commande
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {transfertsVisibles.filter((t: any) => t.statut === 'en_attente').length > 0 && (
            <Chip 
              icon={<Warning />}
              label={`${transfertsVisibles.filter((t: any) => t.statut === 'en_attente').length} demande(s) en attente`}
              color="warning"
            />
          )}
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={loadData}
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Rafraîchir'}
          </Button>
        </Box>
      </Box>

      {/* Navigation par onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, width: '100%' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              minHeight: 56,
              py: 1.5,
              px: 2,
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              '&.Mui-selected': { fontWeight: 600 }
            }
          }}
        >
          <Tab 
            icon={<Assignment />} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {context === 'pharmacie' ? 'Mes demandes' : 'Demandes en instance'}
                {transfertsVisibles.filter((t: any) => t.statut === 'en_attente').length > 0 && (
                  <Chip 
                    label={transfertsVisibles.filter((t: any) => t.statut === 'en_attente').length} 
                    size="small" 
                    color="warning"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            } 
            iconPosition="start" 
          />
          <Tab icon={<LocalShipping />} label="Suivi" iconPosition="start" />
          <Tab icon={<Inventory />} label="Réception" iconPosition="start" disabled={context === 'stock'} />
          <Tab icon={<Description />} label="Historique" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      {activeTab === 0 && (
        <Box>
          {/* Section Transfert Manuel (visible uniquement pour context='stock') */}
          {context === 'stock' && (
            <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Transfert Manuel Direct (Gros → Détail)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Créez et validez un transfert directement sans passer par une demande
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LocalShipping />}
                    onClick={() => {
                      // Initialiser avec une ligne vide pour faciliter l'ajout
                      if (lignesTransfertManuel.length === 0) {
                        ajouterLigneTransfertManuel();
                      }
                      setOpenTransfertManuel(true);
                    }}
                    sx={{ minWidth: 200 }}
                  >
                    Nouveau Transfert Manuel
                  </Button>
                </Box>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Transfert Manuel :</strong> Le responsable du Magasin Gros peut créer et valider directement un transfert vers le Magasin Détail.
                    Le stock est immédiatement mis à jour (Gros −, Détail +) sans passer par une demande.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Demande de transfert */}
          <Card sx={{ mb: 3 }}>
        <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
                  {context === 'stock' ? 'Demandes de Transfert en Attente' : 'Demande interne de ravitaillement (Magasin Détail → Magasin Gros)'}
            </Typography>
            {context === 'pharmacie' && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  // Initialiser avec une ligne vide pour faciliter l'ajout
                  if (lignesTransfert.length === 0) {
                    ajouterLigneTransfert();
                  }
                  setOpenDemande(true);
                }}
              >
                Nouvelle Demande
              </Button>
            )}
          </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Flux :</strong> La Pharmacie / Magasin Détail crée une demande interne de transfert vers le Magasin Gros
                  (le Magasin Gros se ravitaille depuis l’externe auprès des fournisseurs via les réceptions).
                  <br />
                  <strong>Contrôle :</strong> Le système vérifie la disponibilité au Magasin Gros. Le responsable Magasin Gros valide ou refuse.
                  En cas de validation, le stock est transféré et les stocks sont mis à jour (Gros −, Détail +).
                </Typography>
              </Alert>

              <TableContainer>
                <Table>
              <TableHead>
                <TableRow>
                      <TableCell>N° Transfert</TableCell>
                      <TableCell>Médicament(s)</TableCell>
                      <TableCell>Quantité</TableCell>
                      <TableCell>Motif</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                    {transfertsVisibles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Aucune demande de transfert en cours
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transfertsVisibles.map((transfert: any) => (
                        <TableRow key={transfert.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {transfert.numero_transfert}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {transfert.transfert_lignes?.map((ligne: any, idx: number) => (
                              <Box key={idx}>
                                <Typography variant="body2" fontWeight="bold">
                                  {ligne.medicaments?.nom || 'Médicament'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Lot: {ligne.lots?.numero_lot || '-'}
                                </Typography>
                              </Box>
                            ))}
                          </TableCell>
                          <TableCell>
                            {transfert.transfert_lignes?.map((ligne: any, idx: number) => (
                              <Typography key={idx} variant="body2">
                                {ligne.quantite} unités
                              </Typography>
                            ))}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transfert.motif || transfert.observations || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(transfert.date_transfert).toLocaleDateString('fr-FR')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transfert.statut}
                              color={getStatutColor(transfert.statut)}
                              size="small"
                              icon={getStatutIcon(transfert.statut)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Voir détails">
                                <IconButton size="small" onClick={() => setSelectedTransfert(transfert)}>
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              {context === 'stock' && transfert.statut === 'en_attente' && (
                                <>
                                  <Tooltip title="Valider le transfert">
                                    <IconButton 
                                      size="small" 
                                      color="success"
                                      onClick={() => {
                                        setSelectedTransfert(transfert);
                                        setOpenValidation(true);
                                      }}
                                    >
                                      <CheckCircle />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Refuser le transfert">
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={() => {
                                        setSelectedTransfert(transfert);
                                        setOpenRefus(true);
                                      }}
                                    >
                                      <Cancel />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {/* Transferts en cours */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ajustements en Cours
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Transfert</TableCell>
                      <TableCell>Médicament</TableCell>
                      <TableCell>Quantité</TableCell>
                      <TableCell>Date Demande</TableCell>
                      <TableCell>Validateur</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transfertsVisibles
                      .filter((t: any) => t.statut === 'en_cours' || t.statut === 'valide' || t.statut === 'partiel')
                      .length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Aucun ajustement en cours
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        transfertsVisibles
                          .filter((t: any) => t.statut === 'en_cours' || t.statut === 'valide' || t.statut === 'partiel')
                          .map((transfert: any) => (
                            <TableRow key={transfert.id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {transfert.numero_transfert}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {transfert.transfert_lignes?.map((ligne: any, idx: number) => (
                                  <Box key={idx}>
                                    <Typography variant="body2" fontWeight="bold">
                                      {ligne.medicaments?.nom || 'Médicament'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {ligne.medicaments?.code || ''}
                                    </Typography>
                                  </Box>
                                ))}
                              </TableCell>
                              <TableCell>
                                {transfert.transfert_lignes?.map((ligne: any, idx: number) => (
                                  <Typography key={idx} variant="body2">
                                    {ligne.quantite} unités
                                  </Typography>
                                ))}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {new Date(transfert.date_transfert).toLocaleDateString('fr-FR')}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {transfert.utilisateur_destination_id || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getStatutIcon(transfert.statut)}
                                  <Chip
                                    label={transfert.statut}
                                    color={getStatutColor(transfert.statut)}
                                    size="small"
                                  />
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Tooltip title="Voir détails">
                                    <IconButton
                                      size="small"
                                      onClick={() => setSelectedTransfert(transfert)}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </Tooltip>
                                  {context === 'pharmacie' && (transfert.statut === 'valide' || transfert.statut === 'partiel') && (
                                    <Tooltip title="Réceptionner">
                                      <IconButton
                                        size="small"
                                        color="success"
                                        onClick={() => {
                                          setSelectedTransfert(transfert);
                                          setOpenReception(true);
                                        }}
                                      >
                                        <Inventory />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          {/* Réception des transferts */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Réception des Ajustements - Magasin Détail
                </Typography>
                <Chip 
                  icon={<LocalShipping />} 
                  label="Sens unique : Magasin Gros → Magasin Détail" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Processus :</strong> Le pharmacien/infirmier réceptionne les transferts 
                  validés depuis le Magasin Gros et confirme l'entrée en stock du Magasin Détail.
                  <br />
                  <strong>⚠️ Important :</strong> Les transferts sont à sens unique (Gros → Détail). Cliquez sur "Confirmer Réception" pour valider chaque ajustement.
                </Typography>
              </Alert>

              <TableContainer component={Paper} elevation={2}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.light' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>N° Transfert</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Médicament</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Quantité</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Date Validation</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Statut</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Action de Réception</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transfertsVisibles
                      .filter((t: any) => t.statut === 'valide' || t.statut === 'partiel')
                      .length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Aucun transfert en attente de réception
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        transfertsVisibles
                          .filter((t: any) => t.statut === 'valide' || t.statut === 'partiel')
                          .map((transfert: any) => (
                            <TableRow 
                              key={transfert.id}
                              sx={{ 
                                '&:hover': { backgroundColor: 'action.hover' },
                                backgroundColor: 'warning.light'
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {transfert.numero_transfert}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {transfert.transfert_lignes?.map((ligne: any, idx: number) => (
                                  <Box key={idx}>
                                    <Typography variant="body2" fontWeight="bold">
                                      {ligne.medicaments?.nom || 'Médicament'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {ligne.medicaments?.code || ''}
                                    </Typography>
                                  </Box>
                                ))}
                              </TableCell>
                              <TableCell>
                                {transfert.transfert_lignes?.map((ligne: any, idx: number) => (
                                  <Typography key={idx} variant="body2" fontWeight="bold" color="primary.main">
                                    {ligne.quantite} unités
                                  </Typography>
                                ))}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {transfert.date_validation ? new Date(transfert.date_validation).toLocaleDateString('fr-FR') : '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label="En attente de réception"
                                  color="warning"
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Button
                                    variant="contained"
                                    color="success"
                                    size="small"
                                    startIcon={<CheckCircle />}
                                    onClick={() => {
                                      setSelectedTransfert(transfert);
                                      setOpenReception(true);
                                    }}
                                    sx={{ fontWeight: 'bold' }}
                                  >
                                    Confirmer Réception
                                  </Button>
                                  <Tooltip title="Voir détails">
                                    <IconButton
                                      size="small"
                                      onClick={() => setSelectedTransfert(transfert)}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                  </TableBody>
                </Table>
              </TableContainer>

              {transfertsVisibles.filter((t: any) => t.statut === 'valide' || t.statut === 'partiel').length === 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    ✅ Tous les ajustements ont été réceptionnés. Aucun transfert en attente.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          {/* Historique des transferts */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Historique des Ajustements
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" startIcon={<Print />}>
                    Imprimer
                  </Button>
                  <Button variant="outlined" startIcon={<Download />}>
                    Exporter
                  </Button>
                </Box>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Transfert</TableCell>
                      <TableCell>Médicament</TableCell>
                      <TableCell>Quantité</TableCell>
                      <TableCell>Date Demande</TableCell>
                      <TableCell>Date Réception</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transfertsHistoriqueVisibles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Aucun historique de transfert
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transfertsHistoriqueVisibles.map((transfert: any) => (
                        <TableRow key={transfert.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {transfert.numero_transfert}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {transfert.transfert_lignes?.map((ligne: any, idx: number) => (
                              <Box key={idx}>
                                <Typography variant="body2" fontWeight="bold">
                                  {ligne.medicaments?.nom || 'Médicament'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {ligne.medicaments?.code || ''}
                                </Typography>
                              </Box>
                            ))}
                          </TableCell>
                          <TableCell>
                            {transfert.transfert_lignes?.map((ligne: any, idx: number) => (
                              <Typography key={idx} variant="body2">
                                {ligne.quantite} unités
                              </Typography>
                            ))}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(transfert.date_transfert).toLocaleDateString('fr-FR')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transfert.date_validation ? new Date(transfert.date_validation).toLocaleDateString('fr-FR') : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transfert.statut}
                              color={getStatutColor(transfert.statut)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Voir détails">
                              <IconButton
                                size="small"
                                onClick={() => setSelectedTransfert(transfert)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
        </Box>
      )}

      {/* Dialogs */}
      {/* Dialog Transfert Manuel Direct */}
      <Dialog 
        open={openTransfertManuel} 
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setOpenTransfertManuel(false);
          }
        }} 
        disableEscapeKeyDown
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" color="primary">Transfert Manuel Direct (Gros → Détail)</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Add />}
              onClick={ajouterLigneTransfertManuel}
            >
              Ajouter Médicament
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Ce transfert sera créé et validé immédiatement. Les stocks seront mis à jour automatiquement (Gros −, Détail +).
            </Typography>
          </Alert>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Tableau des lignes de transfert manuel */}
            {lignesTransfertManuel.length > 0 ? (
              <Grid item xs={12}>
                <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Médicament</TableCell>
                        <TableCell>Lot</TableCell>
                        <TableCell align="right">Stock Disponible</TableCell>
                        <TableCell align="right">Quantité</TableCell>
                        <TableCell width={50}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lignesTransfertManuel.map((ligne) => {
                        const medicament = medicaments.find(m => m.id === ligne.medicament_id);
                        const lotsDispo = getLotsDisponibles(ligne.medicament_id);
                        const lotSelectionne = lotsDispo.find(l => l.id === ligne.lot_id);
                        const hasError = ligne.stock_disponible !== undefined && ligne.quantite_demandee > ligne.stock_disponible;
                        const isIncomplete = !ligne.medicament_id || !ligne.lot_id || ligne.quantite_demandee <= 0;
                        
                        return (
                          <TableRow 
                            key={ligne.id}
                            sx={{
                              backgroundColor: hasError ? 'error.light' : isIncomplete ? 'warning.light' : 'inherit',
                              '&:hover': {
                                backgroundColor: hasError ? 'error.light' : isIncomplete ? 'warning.light' : 'action.hover'
                              }
                            }}
                          >
                            <TableCell>
                              <Autocomplete
                                size="small"
                                openOnFocus
                                options={[...medicaments].sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))}
                                getOptionLabel={(option) => `${option.nom} ${option.dosage || ''} (${option.code || ''})`}
                                value={medicament || null}
                                onChange={(_, newValue) => {
                                  if (newValue) {
                                    mettreAJourLigneTransfertManuel(ligne.id, {
                                      medicament_id: newValue.id,
                                      medicament_nom: `${newValue.nom} ${newValue.dosage || ''}`,
                                      lot_id: '', // Réinitialiser le lot
                                      lot_numero: undefined,
                                      stock_disponible: undefined
                                    });
                                  }
                                }}
                                loading={loadingMedicaments}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Médicament *"
                                    error={!ligne.medicament_id}
                                    helperText={!ligne.medicament_id ? 'Cliquez ou tapez pour sélectionner un médicament' : ''}
                                  />
                                )}
                                noOptionsText={loadingMedicaments ? "Chargement des médicaments..." : medicaments.length === 0 ? "Aucun médicament. Créez-en dans Paramètres > Médicaments." : "Aucun médicament trouvé"}
                              />
                            </TableCell>
                            <TableCell>
                              <FormControl size="small" fullWidth error={!ligne.lot_id}>
                                <InputLabel>Lot *</InputLabel>
                                <Select
                                  value={ligne.lot_id || ''}
                                  onChange={(e) => {
                                    const lotId = e.target.value;
                                    const lot = lotsDispo.find(l => l.id === lotId);
                                    mettreAJourLigneTransfertManuel(ligne.id, {
                                      lot_id: lotId,
                                      lot_numero: lot?.numero_lot,
                                      stock_disponible: lot?.quantite_disponible
                                    });
                                  }}
                                  label="Lot *"
                                  disabled={!ligne.medicament_id}
                                >
                                  {lotsDispo.map((lot) => (
                                    <MenuItem key={lot.id} value={lot.id}>
                                      {lot.numero_lot} (Disponible: {lot.quantite_disponible})
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color={hasError ? 'error' : 'text.secondary'}>
                                {ligne.stock_disponible !== undefined ? ligne.stock_disponible : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={ligne.quantite_demandee || ''}
                                onChange={(e) => {
                                  const qte = Math.max(0, parseInt(e.target.value) || 0);
                                  mettreAJourLigneTransfertManuel(ligne.id, { quantite_demandee: qte });
                                }}
                                error={hasError}
                                helperText={hasError ? 'Stock insuffisant' : ''}
                                inputProps={{ min: 0, max: ligne.stock_disponible }}
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => supprimerLigneTransfertManuel(ligne.id)}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  Aucune ligne de transfert. Cliquez sur "Ajouter Médicament" pour commencer.
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motif (optionnel)"
                value={motifTransfertManuel}
                onChange={(e) => setMotifTransfertManuel(e.target.value)}
                placeholder="Ex: Réapprovisionnement magasin détail, stock préventif..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations (optionnel)"
                multiline
                rows={2}
                value={observationsTransfertManuel}
                onChange={(e) => setObservationsTransfertManuel(e.target.value)}
                placeholder="Notes supplémentaires sur ce transfert..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenTransfertManuel(false);
              setLignesTransfertManuel([]);
              setMotifTransfertManuel('');
              setObservationsTransfertManuel('');
            }}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreateTransfertManuel}
            variant="contained"
            color="primary"
            disabled={
              loading || 
              lignesTransfertManuel.length === 0 ||
              lignesTransfertManuel.some(l => !l.medicament_id || !l.lot_id || l.quantite_demandee <= 0) ||
              lignesTransfertManuel.some(l => l.stock_disponible !== undefined && l.quantite_demandee > l.stock_disponible)
            }
            startIcon={<LocalShipping />}
          >
            {loading ? 'Création en cours...' : 'Créer et Valider le Transfert'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Nouvelle Demande - Transfert Multiple */}
      <Dialog 
        open={openDemande} 
        onClose={(event, reason) => {
          // Empêcher la fermeture par clic extérieur ou touche Escape
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setOpenDemande(false);
          }
        }} 
        disableEscapeKeyDown
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Nouvelle Demande de Ravitaillement (Interne)</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Add />}
              onClick={ajouterLigneTransfert}
            >
              Ajouter Médicament
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Tableau des lignes de transfert */}
            {lignesTransfert.length > 0 ? (
              <Grid item xs={12}>
                <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Médicament</TableCell>
                        <TableCell>Lot</TableCell>
                        <TableCell align="right">Stock Disponible</TableCell>
                        <TableCell align="right">Quantité</TableCell>
                        <TableCell width={50}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lignesTransfert.map((ligne) => {
                        const medicament = medicaments.find(m => m.id === ligne.medicament_id);
                        const lotsDispo = getLotsDisponibles(ligne.medicament_id);
                        const lotSelectionne = lotsDispo.find(l => l.id === ligne.lot_id);
                        const hasError = ligne.stock_disponible !== undefined && ligne.quantite_demandee > ligne.stock_disponible;
                        const isIncomplete = !ligne.medicament_id || !ligne.lot_id || ligne.quantite_demandee <= 0;
                        
                        return (
                          <TableRow 
                            key={ligne.id}
                            sx={{
                              backgroundColor: hasError ? 'error.light' : isIncomplete ? 'warning.light' : 'inherit',
                              '&:hover': {
                                backgroundColor: hasError ? 'error.light' : isIncomplete ? 'warning.light' : 'action.hover'
                              }
                            }}
                          >
                            <TableCell>
                              <Autocomplete
                                size="small"
                                openOnFocus
                                options={[...medicaments].sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))}
                                getOptionLabel={(option) => `${option.nom} ${option.dosage || ''} (${option.code || ''})`}
                                value={medicament || null}
                                onChange={(_, newValue) => {
                                  if (newValue) {
                                    mettreAJourLigneTransfert(ligne.id, {
                                      medicament_id: newValue.id,
                                      medicament_nom: `${newValue.nom} ${newValue.dosage || ''}`,
                                      lot_id: '', // Réinitialiser le lot
                                      lot_numero: undefined,
                                      stock_disponible: undefined
                                    });
                                  }
                                }}
                                loading={loadingMedicaments}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="Cliquez ou tapez pour sélectionner un médicament"
                                    required
                                  />
                                )}
                                sx={{ minWidth: 250 }}
                                ListboxProps={{ style: { maxHeight: 200 } }}
                                noOptionsText={loadingMedicaments ? "Chargement des médicaments..." : medicaments.length === 0 ? "Aucun médicament. Créez-en dans Paramètres > Médicaments." : "Aucun médicament trouvé"}
                              />
                            </TableCell>
                            <TableCell>
                              {ligne.medicament_id ? (
                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                  <Select
                                    value={ligne.lot_id}
                                    onChange={(e) => {
                                      const lotId = e.target.value;
                                      const lot = lotsDispo.find(l => l.id === lotId);
                                      mettreAJourLigneTransfert(ligne.id, {
                                        lot_id: lotId,
                                        lot_numero: lot?.numero_lot,
                                        stock_disponible: lot?.quantite_disponible
                                      });
                                    }}
                                    displayEmpty
                                  >
                                    <MenuItem value="">
                                      <em>Sélectionner un lot</em>
                                    </MenuItem>
                                    {lotsDispo.map((lot) => (
                                      <MenuItem key={lot.id} value={lot.id}>
                                        {lot.numero_lot} (Exp: {new Date(lot.date_expiration).toLocaleDateString('fr-FR')})
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Sélectionner d'abord un médicament
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {ligne.stock_disponible !== undefined ? (
                                <Typography variant="body2" fontWeight="bold">
                                  {ligne.stock_disponible}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={ligne.quantite_demandee || ''}
                                onChange={(e) => {
                                  const value = Math.max(0, parseInt(e.target.value) || 0);
                                  mettreAJourLigneTransfert(ligne.id, { quantite_demandee: value });
                                }}
                                inputProps={{ min: 0, step: 1, max: ligne.stock_disponible }}
                                sx={{ width: 100 }}
                                error={ligne.stock_disponible !== undefined && ligne.quantite_demandee > (ligne.stock_disponible || 0)}
                                helperText={
                                  ligne.stock_disponible !== undefined && ligne.quantite_demandee > (ligne.stock_disponible || 0)
                                    ? 'Quantité > Stock disponible'
                                    : ''
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => supprimerLigneTransfert(ligne.id)}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  Cliquez sur "Ajouter Médicament" pour commencer à créer un transfert.
                </Alert>
              </Grid>
            )}

            {/* Motif et observations */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <TextField
                fullWidth
                label="Motif du transfert"
                multiline
                rows={2}
                value={motifTransfert}
                onChange={(e) => setMotifTransfert(e.target.value)}
                placeholder="Ex: Réapprovisionnement magasin détail, Stock faible..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations (optionnel)"
                multiline
                rows={2}
                value={observationsTransfert}
                onChange={(e) => setObservationsTransfert(e.target.value)}
              />
            </Grid>

            {/* Résumé */}
            {lignesTransfert.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>{lignesTransfert.length}</strong> médicament(s) à transférer
                    {lignesTransfert.reduce((sum, l) => sum + (l.quantite_demandee || 0), 0) > 0 && (
                      <> • Total: <strong>{lignesTransfert.reduce((sum, l) => sum + (l.quantite_demandee || 0), 0)}</strong> unités</>
                    )}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDemande(false);
            setLignesTransfert([]);
            setMotifTransfert('');
            setObservationsTransfert('');
          }}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreateDemande} 
            variant="contained"
            disabled={lignesTransfert.length === 0 || lignesTransfert.some(l => !l.medicament_id || !l.lot_id || l.quantite_demandee <= 0)}
          >
            Envoyer la demande ({lignesTransfert.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Validation - Ne se ferme qu'avec les boutons */}
      <Dialog 
        open={openValidation} 
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setOpenValidation(false);
          }
        }}
        disableEscapeKeyDown
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Valider le Transfert</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="warning">
                Vérifiez la disponibilité du stock au Magasin Gros. Vous pouvez accorder une quantité inférieure par ligne (validation partielle).
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper} sx={{ maxHeight: 280, overflow: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Médicament</TableCell>
                      <TableCell>Lot</TableCell>
                      <TableCell align="right">Demandée</TableCell>
                      <TableCell align="right">Stock Gros</TableCell>
                      <TableCell align="right">Accordée</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validationLines.map((l) => {
                      const maxAccord = Math.min(l.quantite_demandee, l.stock_disponible);
                      const isOverStock = l.quantite_validee > l.stock_disponible;
                      return (
                        <TableRow key={l.ligne_id} sx={{ backgroundColor: isOverStock ? 'error.light' : undefined }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {l.medicament_nom}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{l.lot_numero}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{l.quantite_demandee}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">{l.stock_disponible}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={l.quantite_validee}
                              onChange={(e) => setQuantiteValidee(l.ligne_id, Math.max(0, parseInt(e.target.value) || 0))}
                              inputProps={{ min: 0, step: 1, max: maxAccord }}
                              error={isOverStock}
                              helperText={isOverStock ? 'Dépasse le stock' : ''}
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations"
                multiline
                rows={3}
                value={validationForm.observations}
                onChange={(e) => setValidationForm(prev => ({ ...prev, observations: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenValidation(false)}>Annuler</Button>
          <Button onClick={handleValidateTransfert} variant="contained" color="success">
            Valider Transfert
              </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Réception - Ne se ferme qu'avec les boutons */}
      <Dialog 
        open={openReception} 
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setOpenReception(false);
          }
        }}
        disableEscapeKeyDown
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Réceptionner le Transfert</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                Vérifiez la quantité reçue et mettez à jour le stock du Magasin Détail.
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantité reçue"
                type="number"
                value={receptionForm.quantite_recue}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setReceptionForm(prev => ({ ...prev, quantite_recue: value }));
                }}
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations"
                multiline
                rows={3}
                value={receptionForm.observations}
                onChange={(e) => setReceptionForm(prev => ({ ...prev, observations: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReception(false)}>Annuler</Button>
          <Button onClick={handleReceiveTransfert} variant="contained" color="success">
            Réceptionner
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Refus de Transfert */}
      <Dialog 
        open={openRefus} 
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setOpenRefus(false);
          }
        }}
        disableEscapeKeyDown
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>Refuser le Transfert</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="body2">
                  Vous êtes sur le point de refuser cette demande de transfert.
                  <br />
                  <strong>N° Transfert :</strong> {selectedTransfert?.numero_transfert}
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motif du refus *"
                multiline
                rows={3}
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Veuillez expliquer pourquoi vous refusez cette demande..."
                required
                error={!motifRefus.trim()}
                helperText={!motifRefus.trim() ? 'Le motif de refus est obligatoire' : ''}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenRefus(false);
            setMotifRefus('');
          }}>
            Annuler
          </Button>
          <Button 
            onClick={handleRefuserTransfert} 
            variant="contained" 
            color="error"
            disabled={!motifRefus.trim() || loading}
          >
            Confirmer le Refus
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Détails du Transfert */}
      <Dialog 
        open={selectedTransfert !== null && !openValidation && !openRefus && !openReception} 
        onClose={(event, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setSelectedTransfert(null);
          }
        }}
        disableEscapeKeyDown
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Détails du Transfert - {selectedTransfert?.numero_transfert || selectedTransfert?.numeroTransfert || 'N/A'}
        </DialogTitle>
        <DialogContent>
          {selectedTransfert && (
            <Box>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Informations Générales
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>N° Transfert:</strong> {selectedTransfert.numero_transfert || selectedTransfert.numeroTransfert || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date:</strong> {selectedTransfert.date_transfert ? new Date(selectedTransfert.date_transfert).toLocaleDateString('fr-FR') : 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Statut:</strong> {selectedTransfert.statut || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Motif:</strong> {selectedTransfert.motif || selectedTransfert.observations || 'Non spécifié'}
                      </Typography>
                      {selectedTransfert.observations && (
                        <Typography variant="body2">
                          <strong>Observations:</strong> {selectedTransfert.observations}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Dates et Utilisateurs
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedTransfert.date_validation && (
                        <Typography variant="body2">
                          <strong>Date Validation:</strong> {new Date(selectedTransfert.date_validation).toLocaleDateString('fr-FR')}
                        </Typography>
                      )}
                      {selectedTransfert.date_reception && (
                        <Typography variant="body2">
                          <strong>Date Réception:</strong> {new Date(selectedTransfert.date_reception).toLocaleDateString('fr-FR')}
                        </Typography>
                      )}
                      {selectedTransfert.utilisateur_source_id && (
                        <Typography variant="body2">
                          <strong>Demandeur:</strong> {selectedTransfert.utilisateur_source_id}
                        </Typography>
                      )}
                      {selectedTransfert.utilisateur_destination_id && (
                        <Typography variant="body2">
                          <strong>Validateur:</strong> {selectedTransfert.utilisateur_destination_id}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Médicaments du Transfert
                    </Typography>
                    {selectedTransfert.transfert_lignes && selectedTransfert.transfert_lignes.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Médicament</TableCell>
                              <TableCell>Lot</TableCell>
                              <TableCell align="right">Quantité</TableCell>
                              <TableCell align="right">Quantité Validée</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedTransfert.transfert_lignes.map((ligne: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="bold">
                                    {ligne.medicaments?.nom || 'Médicament inconnu'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {ligne.medicaments?.code || ''}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {ligne.lots?.numero_lot || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2">
                                    {ligne.quantite || 0} unités
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    {ligne.quantite_validee !== null && ligne.quantite_validee !== undefined 
                                      ? `${ligne.quantite_validee} unités` 
                                      : 'Non validée'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Aucune ligne de transfert disponible
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTransfert(null)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionTransferts;