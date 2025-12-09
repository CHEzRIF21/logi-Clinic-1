import React, { useState, useEffect } from 'react';
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
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  Print,
  Refresh,
  TrendingUp,
  AttachMoney,
  Dashboard,
  Receipt,
  CreditCard,
  AccountBalanceWallet,
  PhoneAndroid,
  LocalHospital,
  Medication,
  Science,
  PregnantWoman,
  Vaccines,
  Assessment,
  History,
  Search,
  FilterList,
  Download,
  Send,
  CheckCircle,
  Warning,
  Error,
  Info,
} from '@mui/icons-material';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { StatBadge } from '../components/ui/StatBadge';

// Types pour les transactions
interface Transaction {
  id: string;
  numeroTransaction: string;
  dateTransaction: Date;
  patientId: string;
  patientNom: string;
  service: 'consultation' | 'pharmacie' | 'laboratoire' | 'maternite' | 'vaccination' | 'autre';
  typeActe: string;
  montant: number;
  modePaiement: 'especes' | 'mobile_money' | 'carte_bancaire' | 'prise_en_charge';
  statut: 'paye' | 'credit' | 'exonere' | 'annule';
  utilisateurId: string;
  utilisateurNom: string;
  reference: string;
  observations?: string;
  factureGeneree: boolean;
  reçuImprime: boolean;
}

interface Patient {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  dateNaissance: Date;
  sexe: 'M' | 'F';
  numeroCarte: string;
  statut: 'actif' | 'exonere' | 'credit';
  creditDisponible: number;
}

interface Service {
  id: string;
  nom: string;
  type: 'consultation' | 'pharmacie' | 'laboratoire' | 'maternite' | 'vaccination' | 'autre';
  tarif: number;
  description: string;
}

// Données de démonstration
const patientsDemo: Patient[] = [
  {
    id: '1',
    nom: 'TRAORE',
    prenom: 'Fatou',
    telephone: '70123456',
    dateNaissance: new Date('1990-05-15'),
    sexe: 'F',
    numeroCarte: 'CART-001',
    statut: 'actif',
    creditDisponible: 0
  },
  {
    id: '2',
    nom: 'DIABATE',
    prenom: 'Moussa',
    telephone: '70234567',
    dateNaissance: new Date('1985-12-03'),
    sexe: 'M',
    numeroCarte: 'CART-002',
    statut: 'exonere',
    creditDisponible: 0
  },
  {
    id: '3',
    nom: 'KONE',
    prenom: 'Aminata',
    telephone: '70345678',
    dateNaissance: new Date('1995-08-20'),
    sexe: 'F',
    numeroCarte: 'CART-003',
    statut: 'credit',
    creditDisponible: 15000
  }
];

const servicesDemo: Service[] = [
  { id: '1', nom: 'Consultation Générale', type: 'consultation', tarif: 2000, description: 'Consultation médicale générale' },
  { id: '2', nom: 'Consultation Spécialisée', type: 'consultation', tarif: 5000, description: 'Consultation avec spécialiste' },
  { id: '3', nom: 'Paracétamol 500mg', type: 'pharmacie', tarif: 500, description: 'Médicament antalgique' },
  { id: '4', nom: 'Analyse de Sang', type: 'laboratoire', tarif: 3000, description: 'NFS, Glycémie, Créatinine' },
  { id: '5', nom: 'Vaccin BCG', type: 'vaccination', tarif: 1000, description: 'Vaccin contre la tuberculose' },
  { id: '6', nom: 'Suivi Maternité', type: 'maternite', tarif: 1500, description: 'Consultation prénatale' }
];

const transactionsDemo: Transaction[] = [
  {
    id: '1',
    numeroTransaction: 'TXN-2024-001',
    dateTransaction: new Date('2024-07-21T09:30:00'),
    patientId: '1',
    patientNom: 'TRAORE Fatou',
    service: 'consultation',
    typeActe: 'Consultation Générale',
    montant: 2000,
    modePaiement: 'especes',
    statut: 'paye',
    utilisateurId: '1',
    utilisateurNom: 'Caissier Principal',
    reference: 'REF-001',
    factureGeneree: true,
    reçuImprime: true
  },
  {
    id: '2',
    numeroTransaction: 'TXN-2024-002',
    dateTransaction: new Date('2024-07-21T10:15:00'),
    patientId: '1',
    patientNom: 'TRAORE Fatou',
    service: 'pharmacie',
    typeActe: 'Paracétamol 500mg',
    montant: 500,
    modePaiement: 'mobile_money',
    statut: 'paye',
    utilisateurId: '1',
    utilisateurNom: 'Caissier Principal',
    reference: 'REF-002',
    factureGeneree: true,
    reçuImprime: false
  },
  {
    id: '3',
    numeroTransaction: 'TXN-2024-003',
    dateTransaction: new Date('2024-07-21T11:00:00'),
    patientId: '2',
    patientNom: 'DIABATE Moussa',
    service: 'consultation',
    typeActe: 'Consultation Spécialisée',
    montant: 5000,
    modePaiement: 'prise_en_charge',
    statut: 'exonere',
    utilisateurId: '1',
    utilisateurNom: 'Caissier Principal',
    reference: 'REF-003',
    factureGeneree: true,
    reçuImprime: true
  }
];

const Caisse: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>(transactionsDemo);
  const [patients, setPatients] = useState<Patient[]>(patientsDemo);
  const [services, setServices] = useState<Service[]>(servicesDemo);
  
  // États pour les dialogs
  const [openNouvelleTransaction, setOpenNouvelleTransaction] = useState(false);
  const [openDetailsTransaction, setOpenDetailsTransaction] = useState(false);
  const [openRapport, setOpenRapport] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Formulaire nouvelle transaction
  const [transactionForm, setTransactionForm] = useState({
    patientId: '',
    service: '',
    typeActe: '',
    montant: 0,
    modePaiement: 'especes' as 'especes' | 'mobile_money' | 'carte_bancaire' | 'prise_en_charge',
    statut: 'paye' as 'paye' | 'credit' | 'exonere' | 'annule',
    reference: '',
    observations: ''
  });

  // Calcul des statistiques
  const stats = {
    totalTransactions: transactions.length,
    recettesJour: transactions
      .filter(t => t.dateTransaction.toDateString() === new Date().toDateString())
      .reduce((sum, t) => sum + t.montant, 0),
    recettesMois: transactions
      .filter(t => t.dateTransaction.getMonth() === new Date().getMonth())
      .reduce((sum, t) => sum + t.montant, 0),
    transactionsPayees: transactions.filter(t => t.statut === 'paye').length,
    transactionsCredits: transactions.filter(t => t.statut === 'credit').length,
    transactionsExonerees: transactions.filter(t => t.statut === 'exonere').length,
    repartitionServices: {
      consultation: transactions.filter(t => t.service === 'consultation').reduce((sum, t) => sum + t.montant, 0),
      pharmacie: transactions.filter(t => t.service === 'pharmacie').reduce((sum, t) => sum + t.montant, 0),
      laboratoire: transactions.filter(t => t.service === 'laboratoire').reduce((sum, t) => sum + t.montant, 0),
      maternite: transactions.filter(t => t.service === 'maternite').reduce((sum, t) => sum + t.montant, 0),
      vaccination: transactions.filter(t => t.service === 'vaccination').reduce((sum, t) => sum + t.montant, 0)
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleNouvelleTransaction = () => {
    const newTransaction: Transaction = {
      id: `${Date.now()}`,
      numeroTransaction: `TXN-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`,
      dateTransaction: new Date(),
      patientId: transactionForm.patientId,
      patientNom: patients.find(p => p.id === transactionForm.patientId)?.nom + ' ' + patients.find(p => p.id === transactionForm.patientId)?.prenom || '',
      service: transactionForm.service as any,
      typeActe: transactionForm.typeActe,
      montant: transactionForm.montant,
      modePaiement: transactionForm.modePaiement,
      statut: transactionForm.statut,
      utilisateurId: 'current-user',
      utilisateurNom: 'Caissier Actuel',
      reference: transactionForm.reference,
      observations: transactionForm.observations,
      factureGeneree: true,
      reçuImprime: false
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setOpenNouvelleTransaction(false);

    // Impression automatique du reçu après validation
    try {
      printReceipt(newTransaction);
      setTransactions(prev => prev.map(t => t.id === newTransaction.id ? { ...t, reçuImprime: true } : t));
    } catch {}
    
    // Réinitialiser le formulaire
    setTransactionForm({
      patientId: '',
      service: '',
      typeActe: '',
      montant: 0,
      modePaiement: 'especes',
      statut: 'paye',
      reference: '',
      observations: ''
    });
  };

  const printReceipt = (t: Transaction) => {
    const patient = patients.find(p => p.id === t.patientId);
    const win = window.open('', 'PRINT', 'height=650,width=900,top=100,left=150');
    if (!win) return;
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
        .title { font-size:18px; font-weight:bold; }
        .meta { color:#555; font-size:12px; }
        .section { margin-top:16px; }
        table { width:100%; border-collapse: collapse; margin-top:8px; }
        td, th { padding:8px; border-bottom:1px solid #eee; text-align:left; }
        .total { font-weight:bold; font-size:16px; }
      </style>
    `;
    const html = `
      ${styles}
      <div class="header">
        <div>
          <div class="title">Reçu de Paiement</div>
          <div class="meta">N°: ${t.numeroTransaction} • ${t.dateTransaction.toLocaleString()}</div>
        </div>
        <div class="meta">Caissier: ${t.utilisateurNom}</div>
      </div>
      <div class="section">
        <strong>Patient:</strong> ${t.patientNom || ''}${patient ? ` • Tél: ${patient.telephone}` : ''}
      </div>
      <div class="section">
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Acte</th>
              <th>Montant (FCFA)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${t.service}</td>
              <td>${t.typeActe}</td>
              <td>${t.montant.toLocaleString()}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="total">Total</td>
              <td class="total">${t.montant.toLocaleString()} FCFA</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="section meta">
        Mode de paiement: ${t.modePaiement.replace('_', ' ')} • Statut: ${t.statut} • Réf: ${t.reference || '-'}
      </div>
      <div class="section meta">Merci pour votre confiance.</div>
    `;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'paye': return 'success';
      case 'credit': return 'warning';
      case 'exonere': return 'info';
      case 'annule': return 'error';
      default: return 'default';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'paye': return <CheckCircle />;
      case 'credit': return <Warning />;
      case 'exonere': return <Info />;
      case 'annule': return <Error />;
      default: return <Info />;
    }
  };

  const getModePaiementIcon = (mode: string) => {
    switch (mode) {
      case 'especes': return <AccountBalanceWallet />;
      case 'mobile_money': return <PhoneAndroid />;
      case 'carte_bancaire': return <CreditCard />;
      case 'prise_en_charge': return <Receipt />;
      default: return <AttachMoney />;
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'consultation': return <LocalHospital />;
      case 'pharmacie': return <Medication />;
      case 'laboratoire': return <Science />;
      case 'maternite': return <PregnantWoman />;
      case 'vaccination': return <Vaccines />;
      default: return <LocalHospital />;
    }
  };

  const renderDashboard = () => (
    <Box>
      {/* Statistiques principales */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={2} mb={3}>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Recettes du Jour" value={`${stats.recettesJour.toLocaleString()} FCFA`} icon={<TrendingUp />} color="success" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Recettes du Mois" value={`${stats.recettesMois.toLocaleString()} FCFA`} icon={<AttachMoney />} color="primary" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Transactions" value={stats.totalTransactions} icon={<Receipt />} color="info" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Crédits en Cours" value={stats.transactionsCredits} icon={<Warning />} color="warning" />
        </GlassCard>
      </Box>

      <Grid container spacing={3}>

      <Grid item xs={12}>
        <GlassCard sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Répartition par Service
            </Typography>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }} gap={2}>
              <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                <LocalHospital color="primary" sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h6">{stats.repartitionServices.consultation.toLocaleString()}</Typography>
                <Typography variant="caption">Consultation</Typography>
              </GlassCard>
              <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                <Medication color="success" sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h6">{stats.repartitionServices.pharmacie.toLocaleString()}</Typography>
                <Typography variant="caption">Pharmacie</Typography>
              </GlassCard>
              <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                <Science color="info" sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h6">{stats.repartitionServices.laboratoire.toLocaleString()}</Typography>
                <Typography variant="caption">Laboratoire</Typography>
              </GlassCard>
              <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                <PregnantWoman color="secondary" sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h6">{stats.repartitionServices.maternite.toLocaleString()}</Typography>
                <Typography variant="caption">Maternité</Typography>
              </GlassCard>
              <GlassCard sx={{ p: 2, textAlign: 'center' }}>
                <Vaccines color="warning" sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h6">{stats.repartitionServices.vaccination.toLocaleString()}</Typography>
                <Typography variant="caption">Vaccination</Typography>
              </GlassCard>
            </Box>
        </GlassCard>
      </Grid>

      {/* Paiements attendus (prochains à payer) */}
      <Grid item xs={12} md={6}>
        <GlassCard sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Paiements à venir</Typography>
              <Badge color="warning" badgeContent={transactions.filter(t => t.statut === 'credit').length}>
                <Warning color="warning" />
              </Badge>
            </Box>
            <Divider sx={{ my: 2 }} />
            <List dense>
              {transactions
                .filter(t => t.statut === 'credit')
                .slice(0, 5)
                .map((t) => (
                  <ListItem key={t.id} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getServiceIcon(t.service)}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${t.patientNom} • ${t.typeActe}`}
                      secondary={`Montant: ${t.montant.toLocaleString()} FCFA • ${t.dateTransaction.toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              {transactions.filter(t => t.statut === 'credit').length === 0 && (
                <Typography variant="body2" color="text.secondary">Aucun paiement en attente.</Typography>
              )}
            </List>
        </GlassCard>
      </Grid>
      </Grid>
    </Box>
  );

  const renderTransactions = () => (
    <Box>
      <ToolbarBits sx={{ mb: 3 }}>
        <Typography variant="h6">Transactions Récentes</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenNouvelleTransaction(true)}
          >
            Nouvelle Transaction
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
          >
            Actualiser
          </Button>
        </Box>
      </ToolbarBits>

      <GlassCard sx={{ p: 2 }}>
        <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>N° Transaction</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Acte</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Mode Paiement</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {transaction.numeroTransaction}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {transaction.dateTransaction.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {transaction.patientNom}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getServiceIcon(transaction.service)}
                    <Typography variant="body2">
                      {transaction.service}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {transaction.typeActe}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {transaction.montant.toLocaleString()} FCFA
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getModePaiementIcon(transaction.modePaiement)}
                    <Typography variant="body2">
                      {transaction.modePaiement.replace('_', ' ')}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatutIcon(transaction.statut)}
                    <Chip
                      label={transaction.statut}
                      color={getStatutColor(transaction.statut) as any}
                      size="small"
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Voir détails">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setOpenDetailsTransaction(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Imprimer reçu">
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
      </GlassCard>
    </Box>
  );

  const renderRapports = () => (
    <Box>
      <ToolbarBits sx={{ mb: 3 }}>
        <Typography variant="h6">Rapports Financiers</Typography>
      </ToolbarBits>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Rapports de Recettes
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="outlined" startIcon={<Assessment />}>
                  Rapport Journalier
                </Button>
                <Button variant="outlined" startIcon={<Assessment />}>
                  Rapport Hebdomadaire
                </Button>
                <Button variant="outlined" startIcon={<Assessment />}>
                  Rapport Mensuel
                </Button>
                <Button variant="outlined" startIcon={<Assessment />}>
                  Rapport Annuel
                </Button>
              </Box>
          </GlassCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <GlassCard sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Rapports Spécialisés
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="outlined" startIcon={<TrendingUp />}>
                  Analyse des Tendances
                </Button>
                <Button variant="outlined" startIcon={<CreditCard />}>
                  Modes de Paiement
                </Button>
                <Button variant="outlined" startIcon={<Warning />}>
                  Suivi des Crédits
                </Button>
                <Button variant="outlined" startIcon={<Download />}>
                  Export Complet
                </Button>
              </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* En-tête amélioré */}
        <ToolbarBits sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Receipt color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <GradientText variant="h4">Module Caisse</GradientText>
              <Typography variant="body2" color="text.secondary">
                Gestion des Transactions Financières
              </Typography>
            </Box>
          </Box>
          <Chip
            label="Caissier Principal"
            color="primary"
            variant="outlined"
          />
        </ToolbarBits>

        {/* Navigation par onglets */}
        <GlassCard sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab icon={<Dashboard />} label="Tableau de Bord" />
              <Tab icon={<Receipt />} label="Transactions" />
              <Tab icon={<Assessment />} label="Rapports" />
              <Tab icon={<History />} label="Historique" />
            </Tabs>
          </Box>
        </GlassCard>

        {/* Contenu des onglets */}
        {activeTab === 0 && renderDashboard()}
        {activeTab === 1 && renderTransactions()}
        {activeTab === 2 && renderRapports()}
        {activeTab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Historique des Transactions
            </Typography>
            <Alert severity="info">
              Fonctionnalité d'historique détaillé en cours de développement.
            </Alert>
          </Box>
        )}

        {/* Dialogs */}
        {/* Dialog Nouvelle Transaction */}
        <Dialog open={openNouvelleTransaction} onClose={() => setOpenNouvelleTransaction(false)} maxWidth="md" fullWidth>
          <DialogTitle>Nouvelle Transaction</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Patient</InputLabel>
                  <Select
                    value={transactionForm.patientId}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, patientId: e.target.value }))}
                    label="Patient"
                  >
                    {patients.map(patient => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.nom} {patient.prenom} - {patient.numeroCarte}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Service</InputLabel>
                  <Select
                    value={transactionForm.service}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, service: e.target.value }))}
                    label="Service"
                  >
                    <MenuItem value="consultation">Consultation</MenuItem>
                    <MenuItem value="pharmacie">Pharmacie</MenuItem>
                    <MenuItem value="laboratoire">Laboratoire</MenuItem>
                    <MenuItem value="maternite">Maternité</MenuItem>
                    <MenuItem value="vaccination">Vaccination</MenuItem>
                    <MenuItem value="autre">Autre</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type d'Acte</InputLabel>
                  <Select
                    value={transactionForm.typeActe}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, typeActe: e.target.value }))}
                    label="Type d'Acte"
                  >
                    {services
                      .filter(s => s.type === transactionForm.service)
                      .map(service => (
                        <MenuItem key={service.id} value={service.nom}>
                          {service.nom} - {service.tarif} FCFA
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Montant (FCFA)"
                  type="number"
                  value={transactionForm.montant}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, montant: parseInt(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Mode de Paiement</InputLabel>
                  <Select
                    value={transactionForm.modePaiement}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, modePaiement: e.target.value as any }))}
                    label="Mode de Paiement"
                  >
                    <MenuItem value="especes">Espèces</MenuItem>
                    <MenuItem value="mobile_money">Mobile Money</MenuItem>
                    <MenuItem value="carte_bancaire">Carte Bancaire</MenuItem>
                    <MenuItem value="prise_en_charge">Prise en Charge</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={transactionForm.statut}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, statut: e.target.value as any }))}
                    label="Statut"
                  >
                    <MenuItem value="paye">Payé</MenuItem>
                    <MenuItem value="credit">Crédit</MenuItem>
                    <MenuItem value="exonere">Exonéré</MenuItem>
                    <MenuItem value="annule">Annulé</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Référence"
                  value={transactionForm.reference}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, reference: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observations"
                  multiline
                  rows={3}
                  value={transactionForm.observations}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, observations: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenNouvelleTransaction(false)}>Annuler</Button>
            <Button onClick={handleNouvelleTransaction} variant="contained">
              Enregistrer Transaction
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Détails Transaction */}
        <Dialog open={openDetailsTransaction} onClose={() => setOpenDetailsTransaction(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Détails de la Transaction - {selectedTransaction?.numeroTransaction}
          </DialogTitle>
          <DialogContent>
            {selectedTransaction && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Informations Générales
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>Patient:</strong> {selectedTransaction.patientNom}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Service:</strong> {selectedTransaction.service}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Acte:</strong> {selectedTransaction.typeActe}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Montant:</strong> {selectedTransaction.montant.toLocaleString()} FCFA
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Informations de Paiement
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>Mode de Paiement:</strong> {selectedTransaction.modePaiement.replace('_', ' ')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Statut:</strong> {selectedTransaction.statut}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Référence:</strong> {selectedTransaction.reference}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Date:</strong> {selectedTransaction.dateTransaction.toLocaleString()}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetailsTransaction(false)}>Fermer</Button>
            <Button startIcon={<Print />} variant="outlined">
              Imprimer Reçu
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Caisse;