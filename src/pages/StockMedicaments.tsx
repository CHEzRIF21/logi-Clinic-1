import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
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
  Alert,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import TraceabiliteLots from '../components/stock/TraceabiliteLots';
import SystemeAlertes from '../components/stock/SystemeAlertes';
import GestionTransferts from '../components/stock/GestionTransferts';
import SynchronisationStocks from '../components/stock/SynchronisationStocks';
import TestFluxComplet from '../components/stock/TestFluxComplet';
import MedicamentManagement from '../components/stock/MedicamentManagement';
import { StockService } from '../services/stockService';
import { MedicamentService } from '../services/medicamentService';
import { MedicamentFormData } from '../services/stockSupabase';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { StatBadge } from '../components/ui/StatBadge';
import { medicamentsFrequents, rechercherMedicamentFrequent, MedicamentFrequent } from '../data/medicamentsFrequents';
import {
  Add,
  Edit,
  Visibility,
  LocalShipping,
  Inventory,
  Warning,
  Print,
  Refresh,
  TrendingUp,
  AttachMoney,
  Dashboard,
  Store,
  Assessment,
  Notifications,
  Timeline,
  Settings,
  Undo,
  Delete,
} from '@mui/icons-material';
import Autocomplete from '@mui/material/Autocomplete';

// Types pour les données
interface Medicament {
  id: string;
  code: string;
  nom: string;
  dci: string;
  forme: string;
  dosage: string;
  unite: string;
  fournisseur: string;
  quantiteStock: number;
  seuilMinimum: number;
  seuilMaximum?: number;
  prixUnitaire: number;
  emplacement: string;
  observations?: string;
}

interface Lot {
  id: string;
  medicamentId: string;
  numeroLot: string;
  quantiteInitiale: number;
  quantiteDisponible: number;
  dateReception: Date;
  dateExpiration: Date;
  fournisseur: string;
  emplacement: string;
  statut: 'actif' | 'expire' | 'epuise';
}

interface Mouvement {
  id: string;
  type: 'reception' | 'transfert' | 'retour' | 'perte' | 'inventaire';
  medicamentId: string;
  lotId?: string;
  quantite: number;
  date: Date;
  motif: string;
  utilisateur: string;
  reference?: string;
}

interface Alerte {
  id: string;
  type: 'stock_bas' | 'peremption' | 'perte_anormale';
  niveau: 'critique' | 'avertissement' | 'information';
  message: string;
  medicamentId: string;
  dateCreation: Date;
  statut: 'active' | 'resolue' | 'ignoree';
}

// Données de démonstration
const medicamentsDemo: Medicament[] = [
  {
    id: '1',
    code: 'MED-001',
    nom: 'Paracétamol 500mg',
    dci: 'Paracétamol',
    forme: 'Comprimé',
    dosage: '500 mg',
    unite: 'Boîte',
    fournisseur: 'PNLP',
    quantiteStock: 800,
    seuilMinimum: 100,
    seuilMaximum: 1000,
    prixUnitaire: 2500,
    emplacement: 'Rayon A-1',
    observations: 'Médicament essentiel'
  },
  {
    id: '2',
    code: 'MED-002',
    nom: 'Amoxicilline 1g',
    dci: 'Amoxicilline',
    forme: 'Poudre injectable',
    dosage: '1g',
    unite: 'Flacon',
    fournisseur: 'CAME',
    quantiteStock: 150,
    seuilMinimum: 50,
    seuilMaximum: 500,
    prixUnitaire: 15000,
    emplacement: 'Frigo B-2',
    observations: 'Conservation réfrigérée'
  },
  {
    id: '3',
    code: 'MED-003',
    nom: 'Ibuprofène 400mg',
    dci: 'Ibuprofène',
    forme: 'Comprimé',
    dosage: '400 mg',
    unite: 'Boîte',
    fournisseur: 'Achat direct',
    quantiteStock: 45,
    seuilMinimum: 50,
    seuilMaximum: 200,
    prixUnitaire: 3200,
    emplacement: 'Rayon A-2',
    observations: 'Stock faible'
  }
];

const lotsDemo: Lot[] = [
  {
    id: '1',
    medicamentId: '1',
    numeroLot: 'PAR-2024-001',
    quantiteInitiale: 1000,
    quantiteDisponible: 800,
    dateReception: new Date('2024-01-15'),
    dateExpiration: new Date('2025-10-10'),
    fournisseur: 'PNLP',
    emplacement: 'Rayon A-1',
    statut: 'actif'
  },
  {
    id: '2',
    medicamentId: '2',
    numeroLot: 'AMX-2024-002',
    quantiteInitiale: 200,
    quantiteDisponible: 150,
    dateReception: new Date('2024-02-20'),
    dateExpiration: new Date('2025-08-15'),
    fournisseur: 'CAME',
    emplacement: 'Frigo B-2',
    statut: 'actif'
  },
  {
    id: '3',
    medicamentId: '3',
    numeroLot: 'IBU-2024-003',
    quantiteInitiale: 100,
    quantiteDisponible: 45,
    dateReception: new Date('2024-03-05'),
    dateExpiration: new Date('2025-12-20'),
    fournisseur: 'Achat direct',
    emplacement: 'Rayon A-2',
    statut: 'actif'
  }
];

const mouvementsDemo: Mouvement[] = [
  {
    id: '1',
    type: 'reception',
    medicamentId: '1',
    lotId: '1',
    quantite: 1000,
    date: new Date('2024-01-15'),
    motif: 'Livraison PNLP',
    utilisateur: 'Magasinier Principal',
    reference: 'BL-2024-001'
  },
  {
    id: '2',
    type: 'transfert',
    medicamentId: '1',
    lotId: '1',
    quantite: 200,
    date: new Date('2024-03-10'),
    motif: 'Dotation Magasin Détail',
    utilisateur: 'Responsable Centre',
    reference: 'TR-2024-001'
  },
  {
    id: '3',
    type: 'reception',
    medicamentId: '2',
    lotId: '2',
    quantite: 200,
    date: new Date('2024-02-20'),
    motif: 'Livraison CAME',
    utilisateur: 'Magasinier Principal',
    reference: 'BL-2024-002'
  },
  {
    id: '4',
    type: 'transfert',
    medicamentId: '2',
    lotId: '2',
    quantite: 50,
    date: new Date('2024-04-15'),
    motif: 'Dotation Magasin Détail',
    utilisateur: 'Responsable Centre',
    reference: 'TR-2024-002'
  }
];

const alertesDemo: Alerte[] = [
  {
    id: '1',
    type: 'peremption',
    niveau: 'avertissement',
    message: 'Lot PAR-2024-001 expire dans 3 mois',
    medicamentId: '1',
    dateCreation: new Date('2024-07-10'),
    statut: 'active'
  },
  {
    id: '2',
    type: 'stock_bas',
    niveau: 'critique',
    message: 'Stock Ibuprofène 400mg en dessous du seuil minimum',
    medicamentId: '3',
    dateCreation: new Date('2024-07-15'),
    statut: 'active'
  }
];

const StockMedicaments: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [medicaments, setMedicaments] = useState<Medicament[]>(medicamentsDemo);
  const [lots, setLots] = useState<Lot[]>(lotsDemo);
  const [mouvements, setMouvements] = useState<Mouvement[]>(mouvementsDemo);
  const [alertes, setAlertes] = useState<Alerte[]>(alertesDemo);
  
  // États pour les dialogs
  const [openReception, setOpenReception] = useState(false);
  const [openNouveauMedicament, setOpenNouveauMedicament] = useState(false);
  const [openTransfert, setOpenTransfert] = useState(false);
  const [openInventaire, setOpenInventaire] = useState(false);
  const [openRapport, setOpenRapport] = useState(false);
  const [selectedMedicament, setSelectedMedicament] = useState<Medicament | null>(null);
  
  // Interface pour une ligne de réception
  interface ReceptionLine {
    id: string;
    medicamentId: string;
    numeroLot: string;
    quantite: number;
    dateExpiration: string;
    prixUnitaire: number;
    prixTotal: number;
  }

  // États pour les formulaires
  const [receptionForm, setReceptionForm] = useState({
    receptionId: '',
    dateReception: new Date().toISOString().split('T')[0],
    fournisseur: '',
    reference: '',
    observations: ''
  });

  // État pour les lignes de réception
  const [receptionLines, setReceptionLines] = useState<ReceptionLine[]>([
    {
      id: '1',
      medicamentId: '',
      numeroLot: '',
      quantite: 0,
      dateExpiration: '',
      prixUnitaire: 0,
      prixTotal: 0,
    }
  ]);

  // Formulaire pour nouveau médicament
  const [nouveauMedicamentForm, setNouveauMedicamentForm] = useState({
    nom: '',
    dci: '',
    forme: '',
    dosage: '',
    unite: '',
    fournisseur: '',
    seuilMinimum: 0,
    seuilMaximum: 0,
    prixUnitaire: 0,
    emplacement: '',
    observations: ''
  });

  const [transfertForm, setTransfertForm] = useState({
    medicamentId: '',
    lotId: '',
    quantite: 0,
    dateTransfert: new Date().toISOString().split('T')[0],
    motif: '',
    reference: ''
  });

  // Calcul des statistiques
  const stats = {
    totalMedicaments: medicaments.length,
    totalStock: medicaments.reduce((sum, med) => sum + med.quantiteStock, 0),
    valeurStock: medicaments.reduce((sum, med) => sum + (med.quantiteStock * med.prixUnitaire), 0),
    stockFaible: medicaments.filter(med => med.quantiteStock <= med.seuilMinimum).length,
    peremptionsProches: lots.filter(lot => {
      const expiration = new Date(lot.dateExpiration);
      const now = new Date();
      const diffMonths = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return diffMonths <= 3 && diffMonths > 0;
    }).length,
    alertesActives: alertes.filter(alert => alert.statut === 'active').length
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Générer un ID unique pour un nouveau médicament
  const generateMedicamentId = () => {
    const maxId = Math.max(...medicaments.map(m => parseInt(m.id) || 0));
    return (maxId + 1).toString();
  };

  // Générer un code unique pour un nouveau médicament
  const generateMedicamentCode = (nom: string, dosage: string) => {
    const prefix = nom.substring(0, 3).toUpperCase();
    const dosageClean = dosage.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    const suffix = dosageClean.substring(0, 3);
    return `MED-${prefix}-${suffix}`;
  };

  const handleNouveauMedicament = () => {
    const newId = generateMedicamentId();
    const newCode = generateMedicamentCode(nouveauMedicamentForm.nom, nouveauMedicamentForm.dosage);
    
    const nouveauMedicament: Medicament = {
      id: newId,
      code: newCode,
      nom: nouveauMedicamentForm.nom,
      dci: nouveauMedicamentForm.dci,
      forme: nouveauMedicamentForm.forme,
      dosage: nouveauMedicamentForm.dosage,
      unite: nouveauMedicamentForm.unite,
      fournisseur: nouveauMedicamentForm.fournisseur,
      quantiteStock: 0,
      seuilMinimum: nouveauMedicamentForm.seuilMinimum,
      seuilMaximum: nouveauMedicamentForm.seuilMaximum,
      prixUnitaire: nouveauMedicamentForm.prixUnitaire,
      emplacement: nouveauMedicamentForm.emplacement,
      observations: nouveauMedicamentForm.observations
    };

    // Ajouter le nouveau médicament à la liste
    setMedicaments(prev => [...prev, nouveauMedicament]);
    
    // Pré-remplir le formulaire de réception avec le nouveau médicament
    setReceptionForm(prev => ({
      ...prev,
      medicamentId: newId
    }));

    // Fermer le dialog et revenir à la réception
    setOpenNouveauMedicament(false);
    
    // Réinitialiser le formulaire nouveau médicament
    setNouveauMedicamentForm({
      nom: '',
      dci: '',
      forme: '',
      dosage: '',
      unite: '',
      fournisseur: '',
      seuilMinimum: 0,
      seuilMaximum: 0,
      prixUnitaire: 0,
      emplacement: '',
      observations: ''
    });
  };

  const handleReception = async () => {
    // Valider que toutes les lignes sont complètes
    const invalidLines = receptionLines.filter(
      line => !line.medicamentId || !line.numeroLot || line.quantite <= 0 || !line.dateExpiration
    );

    if (invalidLines.length > 0) {
      alert('Veuillez remplir tous les champs obligatoires pour chaque ligne de médicament.');
      return;
    }

    if (!receptionForm.fournisseur) {
      alert('Veuillez renseigner le fournisseur.');
      return;
    }

    try {
      // Enregistrer chaque ligne de réception
      for (const line of receptionLines) {
        // Trouver le médicament local pour récupérer ses informations
        const medicamentLocal = medicaments.find(m => m.id === line.medicamentId);
        
        if (!medicamentLocal) {
          console.error('Médicament local non trouvé:', line.medicamentId);
          continue;
        }

        let supabaseMedicamentId: string;

        try {
          // Vérifier si le médicament existe déjà dans Supabase par son code
          const existingMedicament = await MedicamentService.getMedicamentByCode(medicamentLocal.code);
          
          if (existingMedicament) {
            // Le médicament existe, utiliser son ID
            supabaseMedicamentId = existingMedicament.id;
          } else {
            // Le médicament n'existe pas, le créer dans Supabase
            const medicamentData: MedicamentFormData = {
              code: medicamentLocal.code,
              nom: medicamentLocal.nom,
              forme: medicamentLocal.forme,
              dosage: medicamentLocal.dosage,
              unite: medicamentLocal.unite,
              fournisseur: medicamentLocal.fournisseur,
              prix_unitaire: medicamentLocal.prixUnitaire,
              seuil_alerte: medicamentLocal.seuilMinimum,
              seuil_rupture: Math.floor(medicamentLocal.seuilMinimum / 2),
              emplacement: medicamentLocal.emplacement,
              categorie: 'Général',
              prescription_requise: false
            };

            const newMedicament = await MedicamentService.createMedicament(medicamentData);
            supabaseMedicamentId = newMedicament.id;
            console.log('Médicament créé dans Supabase:', newMedicament);
          }
        } catch (medicamentError: any) {
          // Si l'erreur est "PGRST116" (not found), créer le médicament
          if (medicamentError?.code === 'PGRST116') {
            const medicamentData: MedicamentFormData = {
              code: medicamentLocal.code,
              nom: medicamentLocal.nom,
              forme: medicamentLocal.forme,
              dosage: medicamentLocal.dosage,
              unite: medicamentLocal.unite,
              fournisseur: medicamentLocal.fournisseur,
              prix_unitaire: medicamentLocal.prixUnitaire,
              seuil_alerte: medicamentLocal.seuilMinimum,
              seuil_rupture: Math.floor(medicamentLocal.seuilMinimum / 2),
              emplacement: medicamentLocal.emplacement,
              categorie: 'Général',
              prescription_requise: false
            };

            const newMedicament = await MedicamentService.createMedicament(medicamentData);
            supabaseMedicamentId = newMedicament.id;
          } else {
            throw medicamentError;
          }
        }

        // Maintenant enregistrer la réception avec l'ID Supabase valide
        await StockService.receptionMedicament({
          medicament_id: supabaseMedicamentId,
          numero_lot: line.numeroLot,
          quantite_initiale: line.quantite,
          date_reception: receptionForm.dateReception,
          date_expiration: line.dateExpiration,
          prix_achat: line.prixUnitaire || 0,
          fournisseur: receptionForm.fournisseur,
          utilisateur_id: 'current-user-id',
          reference_document: receptionForm.receptionId || receptionForm.reference,
          observations: receptionForm.observations
        });

        // MAJ locale (optimiste) du stock
        setLots(prev => ([
          ...prev,
          {
            id: `${Date.now()}-${line.id}`,
            medicamentId: line.medicamentId,
            numeroLot: line.numeroLot,
            quantiteInitiale: line.quantite,
            quantiteDisponible: line.quantite,
            dateReception: new Date(receptionForm.dateReception),
            dateExpiration: new Date(line.dateExpiration),
            fournisseur: receptionForm.fournisseur,
            emplacement: medicamentLocal.emplacement || '',
            statut: 'actif'
          }
        ]));

        setMedicaments(prev => prev.map(m => 
          m.id === line.medicamentId ? { ...m, quantiteStock: m.quantiteStock + line.quantite } : m
        ));
      }

      setOpenReception(false);
      // Réinitialiser les formulaires
      setReceptionForm({
        receptionId: '',
        dateReception: new Date().toISOString().split('T')[0],
        fournisseur: '',
        reference: '',
        observations: ''
      });
      setReceptionLines([{
        id: '1',
        medicamentId: '',
        numeroLot: '',
        quantite: 0,
        dateExpiration: '',
        prixUnitaire: 0,
        prixTotal: 0,
      }]);
      
      alert(`${receptionLines.length} ligne(s) de réception enregistrée(s) avec succès.`);
    } catch (error) {
      console.error('Erreur lors de la réception:', error);
      alert('Erreur lors de la réception. Vérifiez les informations et réessayez.');
    }
  };

  const handleAddReceptionLine = () => {
    setReceptionLines(prev => [...prev, {
      id: `${Date.now()}`,
      medicamentId: '',
      numeroLot: '',
      quantite: 0,
      dateExpiration: '',
      prixUnitaire: 0,
      prixTotal: 0,
    }]);
  };

  const handleRemoveReceptionLine = (id: string) => {
    if (receptionLines.length > 1) {
      setReceptionLines(prev => prev.filter(line => line.id !== id));
    }
  };

  const handleUpdateReceptionLine = (id: string, field: keyof ReceptionLine, value: any) => {
    setReceptionLines(prev => prev.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        if (field === 'quantite' || field === 'prixUnitaire') {
          updated.prixTotal = updated.quantite * updated.prixUnitaire;
        }
        return updated;
      }
      return line;
    }));
  };

  const handleTransfert = () => {
    // Logique de transfert
    console.log('Transfert créé:', transfertForm);
    setOpenTransfert(false);
    // Réinitialiser le formulaire
    setTransfertForm({
      medicamentId: '',
      lotId: '',
      quantite: 0,
      dateTransfert: new Date().toISOString().split('T')[0],
      motif: '',
      reference: ''
    });
  };

  const getLotsByMedicament = (medicamentId: string) => {
    return lots.filter(lot => lot.medicamentId === medicamentId);
  };

  const getMouvementsByMedicament = (medicamentId: string) => {
    return mouvements.filter(mouvement => mouvement.medicamentId === medicamentId);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* En-tête amélioré */}
        <ToolbarBits sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Inventory color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <GradientText variant="h4">Gestion des Stocks de Médicaments</GradientText>
              <Typography variant="body2" color="text.secondary">
                Centre de Santé - Magasin Gros (Stock Central)
              </Typography>
            </Box>
          </Box>
          <Chip
            label="Responsable Centre (Magasin Gros)"
            color="primary"
            variant="outlined"
          />
        </ToolbarBits>

        {/* Navigation par onglets */}
        <GlassCard sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab icon={<Dashboard />} label="Tableau de Bord" />
              <Tab icon={<Store />} label="Magasin Gros" />
              <Tab icon={<Inventory />} label="Inventaire" />
              <Tab icon={<LocalShipping />} label="Transferts" />
              <Tab icon={<Assessment />} label="Rapports" />
              <Tab icon={<Notifications />} label="Alertes" />
              <Tab icon={<Timeline />} label="Traçabilité" />
              <Tab icon={<Add />} label="Gestion Médicaments" />
              <Tab icon={<Refresh />} label="Test Flux" />
            </Tabs>
          </Box>
        </GlassCard>

        {/* Contenu des onglets */}
        {activeTab === 0 && (
          <Box>
            {/* Statistiques principales */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={2} mb={3}>
              <GlassCard sx={{ p: 2 }}>
                <StatBadge label="Médicaments" value={stats.totalMedicaments} icon={<Inventory />} color="primary" />
              </GlassCard>
              <GlassCard sx={{ p: 2 }}>
                <StatBadge label="Stock Total" value={stats.totalStock.toLocaleString()} icon={<TrendingUp />} color="success" />
              </GlassCard>
              <GlassCard sx={{ p: 2 }}>
                <StatBadge label="Valeur Stock" value={stats.valeurStock.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })} icon={<AttachMoney />} color="info" />
              </GlassCard>
              <GlassCard sx={{ p: 2 }}>
                <StatBadge label="Alertes Actives" value={stats.alertesActives} icon={<Warning />} color="warning" />
              </GlassCard>
            </Box>

            {/* Alertes critiques */}
            {stats.stockFaible > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                {stats.stockFaible} médicament(s) en stock faible (seuil minimum atteint)
              </Alert>
            )}

            {stats.peremptionsProches > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {stats.peremptionsProches} lot(s) expirent dans moins de 3 mois
              </Alert>
            )}

            {/* Actions rapides */}
            <GlassCard sx={{ mb: 4, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Actions Rapides - Magasin Gros
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenReception(true)}
                    size="large"
                  >
                    Nouvelle Réception
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LocalShipping />}
                    onClick={() => setOpenTransfert(true)}
                    size="large"
                  >
                    Créer Transfert
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Assessment />}
                    onClick={() => setOpenInventaire(true)}
                    size="large"
                  >
                    Inventaire
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={() => setOpenRapport(true)}
                    size="large"
                  >
                    Générer Rapport
                  </Button>
                </Box>
            </GlassCard>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Tableau de suivi Magasin Gros */}
            <GlassCard sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Tableau de Suivi - Magasin Gros
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => setOpenReception(true)}
                    >
                      Nouvelle Réception
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                    >
                      Actualiser
                    </Button>
                  </Box>
        </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Médicament</TableCell>
                        <TableCell>Stock Actuel</TableCell>
                        <TableCell>Entrées Cumulées</TableCell>
                        <TableCell>Sorties vers Détail</TableCell>
                        <TableCell>Péremption Proche</TableCell>
                        <TableCell>Seuil Min</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {medicaments.map((medicament) => {
                        const medicamentLots = getLotsByMedicament(medicament.id);
                        const medicamentMouvements = getMouvementsByMedicament(medicament.id);
                        const entrees = medicamentMouvements.filter(m => m.type === 'reception').reduce((sum, m) => sum + m.quantite, 0);
                        const sorties = medicamentMouvements.filter(m => m.type === 'transfert').reduce((sum, m) => sum + m.quantite, 0);
                        const peremptionProche = medicamentLots.find(lot => {
                          const expiration = new Date(lot.dateExpiration);
                          const now = new Date();
                          const diffMonths = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
                          return diffMonths <= 3 && diffMonths > 0;
                        });
                        const isStockFaible = medicament.quantiteStock <= medicament.seuilMinimum;

                        return (
                          <TableRow key={medicament.id} sx={{ 
                            backgroundColor: isStockFaible ? '#ffebee' : 'inherit' 
                          }}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {medicament.nom}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {medicament.code} • {medicament.dci}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {medicament.forme} {medicament.dosage}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {medicament.quantiteStock} {medicament.unite}
                              </Typography>
                              {isStockFaible && (
                                <Chip label="Stock faible" color="warning" size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {entrees} {medicament.unite}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {sorties} {medicament.unite}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {peremptionProche ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" color="warning.main">
                                    {new Date(peremptionProche.dateExpiration).toLocaleDateString()}
                                  </Typography>
                                  <Chip label="3 mois" color="warning" size="small" />
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Aucune
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {medicament.seuilMinimum} {medicament.unite}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={isStockFaible ? 'Stock faible' : 'Normal'}
                                color={isStockFaible ? 'warning' : 'success'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Voir détails">
                                  <IconButton
                                    size="small"
                                    onClick={() => setSelectedMedicament(medicament)}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Créer transfert">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setTransfertForm(prev => ({ ...prev, medicamentId: medicament.id }));
                                      setOpenTransfert(true);
                                    }}
                                  >
                                    <LocalShipping />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Modifier">
                                  <IconButton size="small">
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </GlassCard>
          </Box>
        )}

        {/* Onglet Inventaire */}
        {activeTab === 2 && (
          <Box>
            <GlassCard sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Inventaire - Magasin Gros
                </Typography>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Fonctionnalité d'inventaire en cours de développement.
                  Cette fonction permettra de comparer le stock théorique au stock réel.
                </Alert>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained" startIcon={<Add />}>
                    Nouvel Inventaire
                  </Button>
                  <Button variant="outlined" startIcon={<Visibility />}>
                    Voir Inventaires Précédents
                  </Button>
                </Box>
            </GlassCard>
          </Box>
        )}

        {/* Onglet Transferts */}
        {activeTab === 3 && (
          <GestionTransferts />
        )}

        {/* Onglet Rapports */}
        {activeTab === 4 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <GlassCard sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Rapports de Stock
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button variant="outlined" startIcon={<Assessment />}>
                        Rapport Entrées/Sorties
                      </Button>
                      <Button variant="outlined" startIcon={<Warning />}>
                        Lots Proches d'Expiration
                      </Button>
                      <Button variant="outlined" startIcon={<Inventory />}>
                        Ruptures de Stock
                      </Button>
                      <Button variant="outlined" startIcon={<Assessment />}>
                        Inventaire Comparatif
                      </Button>
                    </Box>
                </GlassCard>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <GlassCard sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Rapports de Transferts
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button variant="outlined" startIcon={<LocalShipping />}>
                        Transferts vers Détail
                      </Button>
                      <Button variant="outlined" startIcon={<Undo />}>
                        Retours du Détail
                      </Button>
                      <Button variant="outlined" startIcon={<TrendingUp />}>
                        Tendances de Consommation
                      </Button>
                      <Button variant="outlined" startIcon={<Print />}>
                        Export Complet
                      </Button>
                    </Box>
                </GlassCard>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Onglet Alertes */}
        {activeTab === 5 && (
          <SystemeAlertes />
        )}

        {/* Onglet Traçabilité */}
        {activeTab === 6 && (
          <TraceabiliteLots />
        )}

        {/* Onglet Synchronisation */}
        {activeTab === 7 && (
          <SynchronisationStocks />
        )}

        {/* Onglet Test Flux */}
        {activeTab === 8 && (
          <TestFluxComplet />
        )}


        {/* Dialogs */}
        {/* Dialog Nouvelle Réception */}
        <Dialog open={openReception} onClose={() => setOpenReception(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Nouvelle Réception - Magasin Gros</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Informations générales de la réception */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Informations de la réception
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="ID Réception (No. Bordereau)"
                  value={receptionForm.receptionId}
                  onChange={(e) => setReceptionForm(prev => ({ ...prev, receptionId: e.target.value }))}
                  placeholder="Ex: REC-2025-0001"
                  helperText="Identifiant unique de la réception"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Date de réception"
                  type="date"
                  value={receptionForm.dateReception}
                  onChange={(e) => setReceptionForm(prev => ({ ...prev, dateReception: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Fournisseur *"
                  value={receptionForm.fournisseur}
                  onChange={(e) => setReceptionForm(prev => ({ ...prev, fournisseur: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Référence (BL, Facture)"
                  value={receptionForm.reference}
                  onChange={(e) => setReceptionForm(prev => ({ ...prev, reference: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Observations"
                  multiline
                  rows={2}
                  value={receptionForm.observations}
                  onChange={(e) => setReceptionForm(prev => ({ ...prev, observations: e.target.value }))}
                />
              </Grid>

              {/* Lignes de médicaments */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Médicaments reçus
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddReceptionLine}
                    size="small"
                  >
                    Ajouter une ligne
                  </Button>
                </Box>
              </Grid>

              {receptionLines.map((line, index) => (
                <Grid item xs={12} key={line.id}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2">Ligne {index + 1}</Typography>
                      {receptionLines.length > 1 && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveReceptionLine(line.id)}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                          <InputLabel>Médicament *</InputLabel>
                          <Select
                            value={line.medicamentId}
                            onChange={(e) => handleUpdateReceptionLine(line.id, 'medicamentId', e.target.value)}
                            label="Médicament *"
                          >
                            {medicaments.map(med => (
                              <MenuItem key={med.id} value={med.id}>
                                {med.nom} ({med.code}) - Stock: {med.quantiteStock} {med.unite}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<Add />}
                          onClick={() => {
                            setOpenNouveauMedicament(true);
                            // Stocker l'ID de la ligne pour pré-remplir après création
                            (window as any).__pendingReceptionLineId = line.id;
                          }}
                          sx={{ height: '56px' }}
                        >
                          Nouveau Médicament
                        </Button>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Numéro de lot *"
                          value={line.numeroLot}
                          onChange={(e) => handleUpdateReceptionLine(line.id, 'numeroLot', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Quantité *"
                          type="number"
                          value={line.quantite}
                          onChange={(e) => handleUpdateReceptionLine(line.id, 'quantite', parseInt(e.target.value) || 0)}
                          inputProps={{ min: 1 }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Date d'expiration *"
                          type="date"
                          value={line.dateExpiration}
                          onChange={(e) => handleUpdateReceptionLine(line.id, 'dateExpiration', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Prix unitaire (FCFA)"
                          type="number"
                          value={line.prixUnitaire}
                          onChange={(e) => handleUpdateReceptionLine(line.id, 'prixUnitaire', parseInt(e.target.value) || 0)}
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Prix total (FCFA)"
                          type="number"
                          value={line.prixTotal}
                          disabled
                          helperText="Calculé automatiquement"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              ))}
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenReception(false)}>Annuler</Button>
            <Button onClick={handleReception} variant="contained">
              Enregistrer {receptionLines.length} ligne(s) de réception
            </Button>
        </DialogActions>
      </Dialog>

        {/* Dialog Créer Transfert */}
        <Dialog open={openTransfert} onClose={() => setOpenTransfert(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Créer Transfert vers Magasin Détail</DialogTitle>
        <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Médicament</InputLabel>
                  <Select
                    value={transfertForm.medicamentId}
                    onChange={(e) => setTransfertForm(prev => ({ ...prev, medicamentId: e.target.value }))}
                    label="Médicament"
                  >
                    {medicaments.map(med => (
                      <MenuItem key={med.id} value={med.id}>
                        {med.nom} - Stock: {med.quantiteStock} {med.unite}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantité à transférer"
                  type="number"
                  value={transfertForm.quantite}
                  onChange={(e) => setTransfertForm(prev => ({ ...prev, quantite: parseInt(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date de transfert"
                  type="date"
                  value={transfertForm.dateTransfert}
                  onChange={(e) => setTransfertForm(prev => ({ ...prev, dateTransfert: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Motif du transfert"
                  multiline
                  rows={3}
                  value={transfertForm.motif}
                  onChange={(e) => setTransfertForm(prev => ({ ...prev, motif: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Référence"
                  value={transfertForm.reference}
                  onChange={(e) => setTransfertForm(prev => ({ ...prev, reference: e.target.value }))}
                />
              </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenTransfert(false)}>Annuler</Button>
            <Button onClick={handleTransfert} variant="contained">
              Créer Transfert
            </Button>
        </DialogActions>
      </Dialog>

        {/* Dialog Inventaire */}
        <Dialog open={openInventaire} onClose={() => setOpenInventaire(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Inventaire - Magasin Gros</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
              Fonctionnalité d'inventaire en cours de développement.
              Cette fonction permettra de comparer le stock théorique au stock réel.
          </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenInventaire(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

        {/* Dialog Rapport */}
        <Dialog open={openRapport} onClose={() => setOpenRapport(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Générer Rapport - Magasin Gros</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Fonctionnalité de génération de rapport en cours de développement.
              Cette fonction permettra de créer des rapports détaillés sur les mouvements et le stock.
          </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenRapport(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Nouveau Médicament */}
      <Dialog open={openNouveauMedicament} onClose={() => setOpenNouveauMedicament(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nouveau Médicament</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Autocomplete pour sélectionner un médicament fréquent */}
            <Grid item xs={12}>
              <Autocomplete<MedicamentFrequent, false, true, true>
                freeSolo
                options={medicamentsFrequents}
                getOptionLabel={(option) => 
                  typeof option === 'string' ? option : `${option.nom} (${option.dci})`
                }
                filterOptions={(options, params) => {
                  const filtered = rechercherMedicamentFrequent(params.inputValue);
                  return filtered;
                }}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue !== 'string') {
                    setNouveauMedicamentForm(prev => ({
                      ...prev,
                      nom: newValue.nom,
                      dci: newValue.dci,
                      forme: newValue.forme,
                      dosage: newValue.dosage,
                      unite: newValue.unite,
                      fournisseur: newValue.fournisseur || prev.fournisseur,
                      seuilMinimum: newValue.seuilMinimum || prev.seuilMinimum,
                      seuilMaximum: newValue.seuilMaximum || prev.seuilMaximum,
                      prixUnitaire: newValue.prixUnitaire || prev.prixUnitaire,
                      emplacement: newValue.emplacement || prev.emplacement,
                    }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Rechercher un médicament fréquent (optionnel)"
                    placeholder="Tapez pour rechercher dans la liste pharmaceutique..."
                    helperText="Sélectionnez un médicament pour pré-remplir les champs"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={`${option.nom}-${option.dosage}`}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.nom}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.dci} • {option.forme} {option.dosage} • {option.categorie}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom du médicament *"
                value={nouveauMedicamentForm.nom}
                onChange={(e) => setNouveauMedicamentForm(prev => ({ ...prev, nom: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="DCI (Dénomination Commune Internationale)"
                value={nouveauMedicamentForm.dci}
                onChange={(e) => setNouveauMedicamentForm(prev => ({ ...prev, dci: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Forme pharmaceutique"
                value={nouveauMedicamentForm.forme}
                onChange={(e) => setNouveauMedicamentForm(prev => ({ ...prev, forme: e.target.value }))}
                placeholder="Ex: Comprimé, Gélule, Sirop"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dosage"
                value={nouveauMedicamentForm.dosage}
                onChange={(e) => setNouveauMedicamentForm(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="Ex: 500mg, 1g"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unité"
                value={nouveauMedicamentForm.unite}
                onChange={(e) => setNouveauMedicamentForm(prev => ({ ...prev, unite: e.target.value }))}
                placeholder="Ex: Boîte, Flacon, Tube"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fournisseur"
                value={nouveauMedicamentForm.fournisseur}
                onChange={(e) => setNouveauMedicamentForm(prev => ({ ...prev, fournisseur: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Seuil minimum"
                type="number"
                value={nouveauMedicamentForm.seuilMinimum}
                onChange={(e) => setNouveauMedicamentForm(prev => ({ ...prev, seuilMinimum: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Seuil maximum"
                type="number"
                value={nouveauMedicamentForm.seuilMaximum}
                onChange={(e) => setNouveauMedicamentForm(prev => ({ ...prev, seuilMaximum: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prix unitaire (FCFA)"
                type="number"
                value={nouveauMedicamentForm.prixUnitaire}
                onChange={(e) => setNouveauMedicamentForm(prev => ({ ...prev, prixUnitaire: parseInt(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emplacement"
                value={nouveauMedicamentForm.emplacement}
                onChange={(e) => setNouveauMedicamentForm(prev => ({ ...prev, emplacement: e.target.value }))}
                placeholder="Ex: Rayon A-1, Frigo B-2"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations"
                multiline
                rows={3}
                value={nouveauMedicamentForm.observations}
                onChange={(e) => setNouveauMedicamentForm(prev => ({ ...prev, observations: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNouveauMedicament(false)}>Annuler</Button>
          <Button 
            onClick={handleNouveauMedicament} 
            variant="contained"
            disabled={!nouveauMedicamentForm.nom}
          >
            Créer Médicament
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Container>
  );
};

export default StockMedicaments; 
