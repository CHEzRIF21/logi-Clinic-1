import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { LocalPharmacy, MedicalServices, Receipt } from '@mui/icons-material';
import TraceabiliteLots from '../components/stock/TraceabiliteLots';
import SystemeAlertes from '../components/stock/SystemeAlertes';
import GestionTransferts from '../components/stock/GestionTransferts';
import { GestionCommandesFournisseur } from '../components/stock/GestionCommandesFournisseur';
import GestionInventaire from '../components/stock/GestionInventaire';
import TestFluxComplet from '../components/stock/TestFluxComplet';
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
  Delete,
  CheckCircle,
  ErrorOutline,
} from '@mui/icons-material';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
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
  prixUnitaireEntree: number;      // Prix unitaire d'achat/entrée
  prixTotalEntree: number;         // Prix total d'entrée (calculé)
  prixUnitaireDetail: number;      // Prix unitaire de vente au détail (pharmacie)
  prixUnitaire: number;            // Gardé pour compatibilité
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
    prixUnitaireEntree: 1800,
    prixTotalEntree: 1440000,
    prixUnitaireDetail: 2500,
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
    prixUnitaireEntree: 12000,
    prixTotalEntree: 1800000,
    prixUnitaireDetail: 15000,
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
    prixUnitaireEntree: 2400,
    prixTotalEntree: 108000,
    prixUnitaireDetail: 3200,
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [medicaments, setMedicaments] = useState<Medicament[]>(medicamentsDemo);
  const [lots, setLots] = useState<Lot[]>(lotsDemo);
  const [mouvements, setMouvements] = useState<Mouvement[]>(mouvementsDemo);
  const [alertes, setAlertes] = useState<Alerte[]>(alertesDemo);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [notification, setNotification] = useState<{open: boolean; message: string; type: 'success' | 'error' | 'info'}>({
    open: false, message: '', type: 'info'
  });

  // Navigation vers les modules liés
  const goToPharmacie = () => navigate('/pharmacie');
  const goToConsultations = () => navigate('/consultations');
  const goToCaisse = () => navigate('/caisse');

  // Fonction utilitaire pour les notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ open: true, message, type });
  };
  
  // États pour les dialogs
  const [openReception, setOpenReception] = useState(false);
  const [openNouveauMedicament, setOpenNouveauMedicament] = useState(false);
  const [openTransfert, setOpenTransfert] = useState(false);
  const [openRapport, setOpenRapport] = useState(false);
  const [selectedMedicament, setSelectedMedicament] = useState<Medicament | null>(null);

  // Chargement des données réelles depuis Supabase
  const loadRealData = async () => {
    try {
      setLoading(true);
      
      // Charger les lots depuis Supabase
      const lotsGros = await StockService.getLotsByMagasin('gros');
      
      if (lotsGros && lotsGros.length > 0) {
        // Convertir les lots Supabase en format local
        const lotsConvertis: Lot[] = lotsGros.map(lot => ({
          id: lot.id,
          medicamentId: lot.medicament_id,
          numeroLot: lot.numero_lot,
          quantiteInitiale: lot.quantite_initiale,
          quantiteDisponible: lot.quantite_disponible,
          dateReception: new Date(lot.date_reception),
          dateExpiration: new Date(lot.date_expiration),
          fournisseur: lot.fournisseur || '',
          emplacement: (lot as any).medicaments?.emplacement || '',
          statut: lot.statut as 'actif' | 'expire' | 'epuise'
        }));
        
        setLots(prev => [...prev, ...lotsConvertis.filter(l => 
          !prev.some(p => p.id === l.id)
        )]);
        
        // Extraire les médicaments uniques des lots
        const medicamentsFromLots = lotsGros
          .filter(lot => lot.medicaments)
          .map(lot => {
            const med = lot.medicaments as any;
            const prixUnitaire = med.prix_unitaire || 0;
            return {
              id: lot.medicament_id,
              code: med.code || `MED-${lot.medicament_id.substring(0, 6)}`,
              nom: med.nom || 'Inconnu',
              dci: med.dci || '',
              forme: med.forme || '',
              dosage: med.dosage || '',
              unite: med.unite || 'Unité',
              fournisseur: lot.fournisseur || '',
              quantiteStock: lot.quantite_disponible,
              seuilMinimum: med.seuil_alerte || 50,
              seuilMaximum: med.seuil_maximum || 500,
              prixUnitaireEntree: med.prix_unitaire_entree || Math.floor(prixUnitaire * 0.7),
              prixTotalEntree: med.prix_total_entree || 0,
              prixUnitaireDetail: med.prix_unitaire_detail || prixUnitaire,
              prixUnitaire: prixUnitaire,
              emplacement: med.emplacement || '',
              observations: med.observations || ''
            };
          });
        
        // Fusionner avec les médicaments existants
        const uniqueMeds = new Map<string, Medicament>();
        [...medicaments, ...medicamentsFromLots].forEach(med => {
          if (!uniqueMeds.has(med.id) || medicamentsFromLots.some(m => m.id === med.id)) {
            uniqueMeds.set(med.id, med);
          }
        });
        
        setMedicaments(Array.from(uniqueMeds.values()));
        setDataLoaded(true);
      }
      
      // Charger les alertes actives
      const alertesActives = await StockService.getAlertesActives();
      if (alertesActives && alertesActives.length > 0) {
        const alertesConverties: Alerte[] = alertesActives.map(alerte => ({
          id: alerte.id,
          type: alerte.type as 'stock_bas' | 'peremption' | 'perte_anormale',
          niveau: alerte.niveau as 'critique' | 'avertissement' | 'information',
          message: alerte.message,
          medicamentId: alerte.medicament_id,
          dateCreation: new Date(alerte.date_creation),
          statut: alerte.statut as 'active' | 'resolue' | 'ignoree'
        }));
        
        setAlertes(prev => [...alertesConverties, ...prev.filter(a => 
          !alertesConverties.some(ac => ac.id === a.id)
        )]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  React.useEffect(() => {
    if (!dataLoaded) {
      loadRealData();
    }
  }, [dataLoaded]);
  
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
    prixUnitaireEntree: 0,      // Prix unitaire d'achat
    prixTotalEntree: 0,         // Prix total d'entrée
    prixUnitaireDetail: 0,      // Prix unitaire de vente au détail
    prixUnitaire: 0,            // Gardé pour compatibilité
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
      prixUnitaireEntree: nouveauMedicamentForm.prixUnitaireEntree,
      prixTotalEntree: nouveauMedicamentForm.prixTotalEntree,
      prixUnitaireDetail: nouveauMedicamentForm.prixUnitaireDetail,
      prixUnitaire: nouveauMedicamentForm.prixUnitaireDetail, // Le prix unitaire = prix détail pour la pharmacie
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
      prixUnitaireEntree: 0,
      prixTotalEntree: 0,
      prixUnitaireDetail: 0,
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
      showNotification('Veuillez remplir tous les champs obligatoires pour chaque ligne de médicament.', 'error');
      return;
    }

    if (!receptionForm.fournisseur) {
      showNotification('Veuillez renseigner le fournisseur.', 'error');
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
              prix_unitaire: medicamentLocal.prixUnitaireDetail || medicamentLocal.prixUnitaire,
              prix_unitaire_entree: medicamentLocal.prixUnitaireEntree,
              prix_total_entree: medicamentLocal.prixTotalEntree,
              prix_unitaire_detail: medicamentLocal.prixUnitaireDetail || medicamentLocal.prixUnitaire,
              seuil_alerte: medicamentLocal.seuilMinimum,
              seuil_rupture: Math.floor(medicamentLocal.seuilMinimum / 2),
              seuil_maximum: medicamentLocal.seuilMaximum,
              emplacement: medicamentLocal.emplacement,
              categorie: 'Général',
              prescription_requise: false,
              dci: medicamentLocal.dci,
              observations: medicamentLocal.observations
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
              prix_unitaire: medicamentLocal.prixUnitaireDetail || medicamentLocal.prixUnitaire,
              prix_unitaire_entree: medicamentLocal.prixUnitaireEntree,
              prix_total_entree: medicamentLocal.prixTotalEntree,
              prix_unitaire_detail: medicamentLocal.prixUnitaireDetail || medicamentLocal.prixUnitaire,
              seuil_alerte: medicamentLocal.seuilMinimum,
              seuil_rupture: Math.floor(medicamentLocal.seuilMinimum / 2),
              seuil_maximum: medicamentLocal.seuilMaximum,
              emplacement: medicamentLocal.emplacement,
              categorie: 'Général',
              prescription_requise: false,
              dci: medicamentLocal.dci,
              observations: medicamentLocal.observations
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
      
      showNotification(`${receptionLines.length} ligne(s) de réception enregistrée(s) avec succès.`, 'success');
    } catch (error) {
      console.error('Erreur lors de la réception:', error);
      showNotification('Erreur lors de la réception. Vérifiez les informations et réessayez.', 'error');
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

  const handleTransfert = async () => {
    // Validation des champs
    if (!transfertForm.medicamentId || transfertForm.quantite <= 0) {
      showNotification('Veuillez sélectionner un médicament et entrer une quantité valide.', 'error');
      return;
    }

    try {
      // Trouver le médicament local
      const medicamentLocal = medicaments.find(m => m.id === transfertForm.medicamentId);
      if (!medicamentLocal) {
        showNotification('Médicament non trouvé.', 'error');
        return;
      }

      // Vérifier le stock disponible
      const medicamentLots = getLotsByMedicament(transfertForm.medicamentId);
      if (medicamentLots.length === 0) {
        showNotification('Aucun lot disponible pour ce médicament.', 'error');
        return;
      }

      // Trouver le lot sélectionné ou le premier lot disponible
      const lotSelectionne = transfertForm.lotId 
        ? medicamentLots.find(l => l.id === transfertForm.lotId)
        : medicamentLots[0];

      if (!lotSelectionne || lotSelectionne.quantiteDisponible < transfertForm.quantite) {
        showNotification('Stock insuffisant dans le lot sélectionné.', 'error');
        return;
      }

      // Récupérer ou créer le médicament dans Supabase
      let supabaseMedicamentId: string;
      try {
        const existingMedicament = await MedicamentService.getMedicamentByCode(medicamentLocal.code);
        if (existingMedicament) {
          supabaseMedicamentId = existingMedicament.id;
        } else {
          const newMedicament = await MedicamentService.createMedicament({
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
          });
          supabaseMedicamentId = newMedicament.id;
        }
      } catch (error: any) {
        if (error?.code === 'PGRST116') {
          const newMedicament = await MedicamentService.createMedicament({
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
          });
          supabaseMedicamentId = newMedicament.id;
        } else {
          throw error;
        }
      }

      // Récupérer les lots Supabase pour trouver le bon lot
      const lotsSupabase = await StockService.getLotsByMagasin('gros');
      const lotSupabase = lotsSupabase?.find(l => 
        l.medicament_id === supabaseMedicamentId && l.quantite_disponible >= transfertForm.quantite
      );

      if (lotSupabase) {
        // Créer la demande de transfert dans Supabase
        await StockService.creerDemandeTransfert({
          medicament_id: supabaseMedicamentId,
          lot_id: lotSupabase.id,
          quantite_demandee: transfertForm.quantite,
          utilisateur_demandeur_id: 'current-user-id',
          motif: transfertForm.motif || 'Transfert Gros → Détail',
          observations: transfertForm.reference
        });
      }

      // MAJ locale (optimiste) du stock
      setLots(prev => prev.map(lot => 
        lot.id === lotSelectionne.id 
          ? { ...lot, quantiteDisponible: lot.quantiteDisponible - transfertForm.quantite }
          : lot
      ));

      setMedicaments(prev => prev.map(m => 
        m.id === transfertForm.medicamentId 
          ? { ...m, quantiteStock: m.quantiteStock - transfertForm.quantite }
          : m
      ));

      // Fermer et réinitialiser
      setOpenTransfert(false);
      setTransfertForm({
        medicamentId: '',
        lotId: '',
        quantite: 0,
        dateTransfert: new Date().toISOString().split('T')[0],
        motif: '',
        reference: ''
      });
      
      showNotification('Demande de transfert créée avec succès !', 'success');
    } catch (error) {
      console.error('Erreur lors de la création du transfert:', error);
      showNotification('Erreur lors de la création du transfert. Vérifiez les informations et réessayez.', 'error');
    }
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
        <GlassCard sx={{ mb: 3, width: '100%', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                width: '100%',
                '& .MuiTabs-scrollButtons': {
                  '&.Mui-disabled': {
                    opacity: 0.3
                  }
                },
                '& .MuiTab-root': {
                  minHeight: 64,
                  py: 2,
                  px: 2,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  '&.Mui-selected': {
                    fontWeight: 600,
                    color: 'primary.main',
                  }
                }
              }}
            >
              <Tab icon={<Dashboard />} label="Tableau de Bord" iconPosition="start" />
              <Tab icon={<Store />} label="Magasin Gros" iconPosition="start" />
              <Tab icon={<Inventory />} label="Inventaire" iconPosition="start" />
              <Tab icon={<LocalShipping />} label="Demandes internes" iconPosition="start" />
              <Tab icon={<Receipt />} label="Achats fournisseurs" iconPosition="start" />
              <Tab icon={<Assessment />} label="Rapports" iconPosition="start" />
              <Tab icon={<Notifications />} label="Alertes" iconPosition="start" />
              <Tab icon={<Timeline />} label="Traçabilité" iconPosition="start" />
              <Tab icon={<Refresh />} label="Test Flux" iconPosition="start" />
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
                    onClick={() => setActiveTab(2)}
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

            {/* Accès rapide aux modules liés */}
            <GlassCard sx={{ mb: 4, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Accès Rapide aux Modules Liés
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<LocalPharmacy />}
                    onClick={goToPharmacie}
                    size="large"
                  >
                    Module Pharmacie (Détail)
                  </Button>
                  <Button
                    variant="outlined"
                    color="info"
                    startIcon={<MedicalServices />}
                    onClick={goToConsultations}
                    size="large"
                  >
                    Consultations / Prescriptions
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<Receipt />}
                    onClick={goToCaisse}
                    size="large"
                  >
                    Caisse / Facturation
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
                      onClick={loadRealData}
                      disabled={loading}
                    >
                      {loading ? 'Chargement...' : 'Actualiser'}
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
          <GestionInventaire
            magasinType="stock_central"
            magasinId="magasin-gros"
            magasinNom="Magasin Gros - Stock Central"
            utilisateurId="current-user-id"
            utilisateurNom="Responsable Centre"
          />
        )}

        {/* Onglet Transferts */}
        {activeTab === 3 && (
          <GestionTransferts context="stock" />
        )}

        {/* Onglet Achats fournisseurs */}
        {activeTab === 4 && (
          <GestionCommandesFournisseur />
        )}

        {/* Onglet Rapports */}
        {activeTab === 5 && (
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
        {activeTab === 6 && (
          <SystemeAlertes />
        )}

        {/* Onglet Traçabilité */}
        {activeTab === 7 && (
          <TraceabiliteLots />
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
                          onChange={(e) => {
                            const value = Math.max(0, parseInt(e.target.value) || 0);
                            handleUpdateReceptionLine(line.id, 'quantite', value);
                          }}
                          inputProps={{ min: 0, step: 1 }}
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
                          onChange={(e) => {
                            const value = Math.max(0, parseInt(e.target.value) || 0);
                            handleUpdateReceptionLine(line.id, 'prixUnitaire', value);
                          }}
                          inputProps={{ min: 0, step: 1 }}
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
                  onChange={(e) => {
                    const value = Math.max(0, parseInt(e.target.value) || 0);
                    setTransfertForm(prev => ({ ...prev, quantite: value }));
                  }}
                  inputProps={{ min: 0, step: 1 }}
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

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.type}
          sx={{ width: '100%' }}
          icon={notification.type === 'success' ? <CheckCircle /> : notification.type === 'error' ? <ErrorOutline /> : undefined}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Dialog Nouveau Médicament */}
      <Dialog 
        open={openNouveauMedicament} 
        onClose={(event, reason) => {
          // Empêcher la fermeture par clic extérieur ou touche Escape
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            setOpenNouveauMedicament(false);
          }
        }}
        disableEscapeKeyDown
        maxWidth="md" 
        fullWidth
      >
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
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setNouveauMedicamentForm(prev => ({ ...prev, seuilMinimum: value }));
                }}
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Seuil maximum"
                type="number"
                value={nouveauMedicamentForm.seuilMaximum}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setNouveauMedicamentForm(prev => ({ ...prev, seuilMaximum: value }));
                }}
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            
            {/* Section Prix */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ mt: 1, mb: 1 }}>
                💰 Gestion des Prix
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Prix Unitaire d'Entrée (XOF)"
                type="number"
                value={nouveauMedicamentForm.prixUnitaireEntree}
                onChange={(e) => {
                  const prixEntree = Math.max(0, parseInt(e.target.value) || 0);
                  setNouveauMedicamentForm(prev => ({ 
                    ...prev, 
                    prixUnitaireEntree: prixEntree,
                    // Calculer le prix total basé sur une quantité par défaut (peut être ajusté)
                    prixTotalEntree: prev.prixTotalEntree
                  }));
                }}
                helperText="Prix d'achat par unité"
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Prix Total d'Entrée (XOF)"
                type="number"
                value={nouveauMedicamentForm.prixTotalEntree}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0);
                  setNouveauMedicamentForm(prev => ({ ...prev, prixTotalEntree: value }));
                }}
                helperText="Montant total de l'achat"
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Prix Unitaire Détail (XOF) *"
                type="number"
                value={nouveauMedicamentForm.prixUnitaireDetail}
                onChange={(e) => {
                  const prixDetail = Math.max(0, parseInt(e.target.value) || 0);
                  setNouveauMedicamentForm(prev => ({ 
                    ...prev, 
                    prixUnitaireDetail: prixDetail,
                    prixUnitaire: prixDetail // Synchroniser avec prixUnitaire
                  }));
                }}
                helperText="Prix de vente pharmacie/détail"
                inputProps={{ min: 0, step: 1 }}
                required
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'primary.main', borderWidth: 2 }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>Note :</strong> Le <strong>Prix Unitaire Détail</strong> est le prix utilisé pour la dispensation 
                  en pharmacie/magasin détail. Les prix d'entrée sont modifiables uniquement dans ce module.
                </Typography>
              </Alert>
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
