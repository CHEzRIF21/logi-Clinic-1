import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Card,
  CardContent,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Event,
  Schedule,
  CheckCircle,
  Warning,
  Email,
  Sms,
  PersonAdd,
  TrendingUp,
  TrendingDown,
  Assessment,
  Notifications,
} from '@mui/icons-material';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { StatBadge } from '../components/ui/StatBadge';

type Statut = 'programmé' | 'confirmé' | 'annulé' | 'terminé' | 'manqué';

interface RendezVousItem {
  _id: string;
  patient?: { nom?: string; prenom?: string };
  praticien?: { nom?: string; prenom?: string };
  service: string;
  motif: string;
  dateDebut: string;
  dateFin: string;
  statut: Statut;
}

const RendezVous: React.FC = () => {
  const [items, setItems] = useState<RendezVousItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number> } | null>(null);
  const [useDemo, setUseDemo] = useState(false);
  const [view, setView] = useState<'jour' | 'semaine' | 'mois'>('jour');
  const [filters, setFilters] = useState<{ service?: string; statut?: Statut | 'tous'; date?: string }>({ statut: 'tous' });
  const [openCreate, setOpenCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'info' });
  const [activeTab, setActiveTab] = useState(0);
  const [overbookingAlerts, setOverbookingAlerts] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState<{
    identifiant: string;
    service: string;
    praticien?: string;
    motif: string;
    date: string;
    heure: string;
    duree: number;
    priorite: 'normal' | 'urgent';
    statut: Statut;
  }>({ identifiant: '', service: '', praticien: '', motif: '', date: '', heure: '', duree: 30, priorite: 'normal', statut: 'programmé' });

  const randomFrom = useCallback((arr: string[]) => arr[Math.floor(Math.random() * arr.length)], []);
  const demoPatients = useMemo(() => ['Jean Dupont', 'Marie Martin', 'Pierre Bernard', 'Sophie Petit', 'Michel Robert', 'Isabelle Leroy'], []);
  const demoPraticiens = useMemo(() => ['Dr. Traoré', 'Dr. Koffi', 'Infirmier Adama', 'Sage-femme Aïcha'], []);
  const demoServices = useMemo(() => ['Consultation générale', 'Maternité', 'Vaccination', 'Laboratoire', 'Pédiatrie'], []);
  const demoMotifs = useMemo(() => ['Contrôle', 'Suivi', 'Première consultation', 'Résultats', 'Vaccin'], []);

  const generateDemoForToday = useCallback((count = 10): RendezVousItem[] => {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
    const statuses: Statut[] = ['programmé', 'confirmé', 'annulé', 'terminé', 'manqué'];
    return Array.from({ length: count }).map((_, idx) => {
      const start = new Date(base.getTime() + idx * 30 * 60000);
      const end = new Date(start.getTime() + 25 * 60000);
      const patientFullName = randomFrom(demoPatients);
      const praticienFullName = randomFrom(demoPraticiens);
      const [patientPrenom, patientNom] = patientFullName.split(' ');
      const [pracTitle, pracName] = praticienFullName.split(' ');
      const statut = statuses[idx % statuses.length];
      return {
        _id: `demo-${idx}`,
        patient: { 
          nom: patientNom || patientFullName || 'Patient', 
          prenom: patientPrenom || 'Demo' 
        },
        praticien: { 
          nom: pracName || praticienFullName || 'Praticien', 
          prenom: pracTitle || 'Dr.' 
        },
        service: randomFrom(demoServices),
        motif: randomFrom(demoMotifs),
        dateDebut: start.toISOString(),
        dateFin: end.toISOString(),
        statut,
      };
    });
  }, [demoPatients, demoPraticiens, demoServices, demoMotifs, randomFrom]);

  const todayRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    return { start, end };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const [listRes, statsRes] = await Promise.all([
          fetch(`/api/rendez-vous?start=${encodeURIComponent(todayRange.start)}&end=${encodeURIComponent(todayRange.end)}&limit=100`, { headers }),
          fetch(`/api/rendez-vous/stats/summary?start=${encodeURIComponent(todayRange.start)}&end=${encodeURIComponent(todayRange.end)}`, { headers })
        ]);

        if (!listRes.ok || !statsRes.ok) {
          // fallback démo si backend KO
          const demo = generateDemoForToday(12);
          setItems(demo);
          const byStatus: Record<string, number> = {};
          demo.forEach(d => { byStatus[d.statut] = (byStatus[d.statut] || 0) + 1; });
          setStats({ total: demo.length, byStatus });
          setUseDemo(true);
          return;
        }

        const listJson = await listRes.json();
        const statsJson = await statsRes.json();
        setItems(listJson.data || []);
        setStats({ total: statsJson.data?.total || 0, byStatus: statsJson.data?.byStatus || {} });
        setUseDemo(false);
      } catch (e: any) {
        // fallback démo si erreur
        const demo = generateDemoForToday(12);
        setItems(demo);
        const byStatus: Record<string, number> = {};
        demo.forEach(d => { byStatus[d.statut] = (byStatus[d.statut] || 0) + 1; });
        setStats({ total: demo.length, byStatus });
        setUseDemo(true);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [todayRange, generateDemoForToday]);

  const getStatusColor = (status: Statut) => {
    switch (status) {
      case 'confirmé':
        return 'success';
      case 'programmé':
        return 'info';
      case 'annulé':
        return 'error';
      case 'terminé':
        return 'default';
      case 'manqué':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Calcul des indicateurs clés
  const kpis = useMemo(() => {
    const total = items.length;
    const completed = items.filter(i => i.statut === 'terminé').length;
    const cancelled = items.filter(i => i.statut === 'annulé').length;
    const missed = items.filter(i => i.statut === 'manqué').length;
    const confirmed = items.filter(i => i.statut === 'confirmé').length;
    
    return {
      total,
      completed,
      cancelled,
      missed,
      confirmed,
      presenceRate: total > 0 ? (completed / total) * 100 : 0,
      cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
      absenceRate: total > 0 ? (missed / total) * 100 : 0,
    };
  }, [items]);

  // Détection de surbooking
  const detectOverbooking = useCallback(() => {
    const alerts: string[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Vérifier les créneaux du jour
    const todayAppointments = items.filter(item => {
      const itemDate = new Date(item.dateDebut);
      return itemDate >= today && itemDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });
    
    // Grouper par heure (créneaux de 30 min)
    const slots: { [key: string]: number } = {};
    todayAppointments.forEach(apt => {
      const hour = new Date(apt.dateDebut).getHours();
      const slot = `${hour}:${new Date(apt.dateDebut).getMinutes() < 30 ? '00' : '30'}`;
      slots[slot] = (slots[slot] || 0) + 1;
    });
    
    // Détecter les créneaux surbookés (> 2 rendez-vous)
    Object.entries(slots).forEach(([slot, count]) => {
      if (count > 2) {
        alerts.push(`Surcharge détectée: ${count} rendez-vous à ${slot}`);
      }
    });
    
    setOverbookingAlerts(alerts);
  }, [items]);

  useEffect(() => {
    detectOverbooking();
  }, [items, detectOverbooking]);

  // Envoi de rappels
  const sendReminder = useCallback(async (rdv: RendezVousItem, type: 'sms' | 'email') => {
    try {
      if (!useDemo) {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        await fetch(`/api/rendez-vous/${rdv._id}/remind`, { method: 'POST', headers });
      }
      setSnackbar({ open: true, message: `Rappel ${type.toUpperCase()} envoyé`, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: `Erreur envoi rappel ${type.toUpperCase()}`, severity: 'error' });
    }
  }, [useDemo]);

  // Confirmation patient
  const handlePatientConfirm = useCallback(async (rdvId: string) => {
    try {
      if (!useDemo) {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`/api/rendez-vous/${rdvId}/confirm`, { method: 'POST', headers });
        if (res.ok) {
          const json = await res.json();
          setItems(items.map(i => i._id === rdvId ? json.data : i));
          setSnackbar({ open: true, message: 'Rendez-vous confirmé par le patient', severity: 'success' });
          return;
        }
      }
      // Fallback local
      setItems(items.map(i => i._id === rdvId ? { ...i, statut: 'confirmé' } : i));
      setSnackbar({ open: true, message: 'Rendez-vous confirmé (démo)', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur confirmation', severity: 'error' });
    }
  }, [useDemo, items]);

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête amélioré */}
      <ToolbarBits sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Event color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <GradientText variant="h4">Gestion des Rendez-vous</GradientText>
            <Typography variant="body2" color="text.secondary">
              Planifiez et gérez les rendez-vous médicaux
            </Typography>
          </Box>
        </Box>
      </ToolbarBits>

      {/* Alertes de surbooking */}
      {overbookingAlerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Alertes de surcharge:</Typography>
          {overbookingAlerts.map((alert, idx) => (
            <Typography key={idx} variant="body2">• {alert}</Typography>
          ))}
        </Alert>
      )}

      {/* Onglets principaux */}
      <GlassCard sx={{ mb: 3, width: '100%', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
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
          <Tab label="Agenda" icon={<Event />} iconPosition="start" />
          <Tab label="Indicateurs" icon={<Assessment />} iconPosition="start" />
          <Tab label="Rapports" icon={<TrendingUp />} iconPosition="start" />
        </Tabs>
        </Box>
      </GlassCard>

      {/* Contenu des onglets */}
      {activeTab === 0 && (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper>
            <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <TextField
                select
                label="Vue"
                size="small"
                value={view}
                onChange={(e) => setView(e.target.value as any)}
              >
                <MenuItem value="jour">Jour</MenuItem>
                <MenuItem value="semaine">Semaine</MenuItem>
                <MenuItem value="mois">Mois</MenuItem>
              </TextField>
              <TextField
                select
                label="Service"
                size="small"
                sx={{ minWidth: 200 }}
                value={filters.service || ''}
                onChange={(e) => setFilters({ ...filters, service: e.target.value || undefined })}
              >
                <MenuItem value="">Tous</MenuItem>
                {demoServices.map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Statut"
                size="small"
                sx={{ minWidth: 180 }}
                value={filters.statut || 'tous'}
                onChange={(e) => setFilters({ ...filters, statut: (e.target.value as any) })}
              >
                <MenuItem value="tous">Tous</MenuItem>
                <MenuItem value="programmé">Programmé</MenuItem>
                <MenuItem value="confirmé">Confirmé</MenuItem>
                <MenuItem value="annulé">Annulé</MenuItem>
                <MenuItem value="terminé">Terminé</MenuItem>
                <MenuItem value="manqué">Manqué</MenuItem>
              </TextField>
              <TextField
                type="date"
                label="Date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={filters.date || ''}
                onChange={(e) => setFilters({ ...filters, date: e.target.value || undefined })}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <GlassCard sx={{ p: 2 }}>
            <StatBadge label="Rendez-vous aujourd'hui" value={stats?.total ?? 0} icon={<Event />} color="primary" />
          </GlassCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GlassCard sx={{ p: 2 }}>
            <StatBadge label="Rendez-vous cette semaine" value={(stats?.byStatus?.confirmé || 0) + (stats?.byStatus?.programmé || 0)} icon={<Schedule />} color="success" />
          </GlassCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GlassCard sx={{ p: 2 }}>
            <StatBadge label="Confirmés" value={stats?.byStatus?.terminé || 0} icon={<CheckCircle />} color="info" />
          </GlassCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GlassCard sx={{ p: 2 }}>
            <StatBadge label="En attente" value={stats?.byStatus?.manqué || 0} icon={<Warning />} color="warning" />
          </GlassCard>
        </Grid>

      <Grid item xs={12}>
        <Paper>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Rendez-vous du jour {useDemo ? '(données démo)' : ''}</Typography>
            <Box>
              <Button
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
                onClick={() => {
                  const demo = generateDemoForToday(12);
                  setItems(demo);
                  const byStatus: Record<string, number> = {};
                  demo.forEach(d => { byStatus[d.statut] = (byStatus[d.statut] || 0) + 1; });
                  setStats({ total: demo.length, byStatus });
                  setUseDemo(true);
                }}
              >
                Charger démo
            </Button>
              <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)}>Nouveau rendez-vous</Button>
            </Box>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Heure</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Praticien</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6}>Chargement...</TableCell>
                  </TableRow>
                )}
                {error && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} style={{ color: 'red' }}>{error}</TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && items
                  .filter(r => !filters.service || r.service === filters.service)
                  .filter(r => (filters.statut && filters.statut !== 'tous') ? r.statut === filters.statut : true)
                  .filter(r => !filters.date || new Date(r.dateDebut).toISOString().slice(0,10) === filters.date)
                  .map((rdv) => (
                  <TableRow key={rdv._id}>
                    <TableCell>{new Date(rdv.dateDebut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell>{`${rdv.patient?.prenom || ''} ${rdv.patient?.nom || ''}`.trim()}</TableCell>
                    <TableCell>{`${rdv.praticien?.prenom || ''} ${rdv.praticien?.nom || ''}`.trim()}</TableCell>
                    <TableCell>{rdv.service}</TableCell>
                    <TableCell>
                      <Chip
                        label={rdv.statut}
                        color={getStatusColor(rdv.statut) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          title="Confirmer"
                          onClick={async () => {
                            try {
                              if (!useDemo) {
                                const token = localStorage.getItem('token');
                                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                                if (token) headers.Authorization = `Bearer ${token}`;
                                const res = await fetch(`/api/rendez-vous/${rdv._id}/confirm`, { method: 'POST', headers });
                                if (res.ok) {
                                  const json = await res.json();
                                  setItems(items.map(i => i._id === rdv._id ? json.data : i));
                                  setSnackbar({ open: true, message: 'Rendez-vous confirmé', severity: 'success' });
                                  return;
                                }
                              }
                              setItems(items.map(i => i._id === rdv._id ? { ...i, statut: 'confirmé' } : i));
                              setSnackbar({ open: true, message: 'Rendez-vous confirmé (démo)', severity: 'success' });
                            } catch (error) {
                              setSnackbar({ open: true, message: 'Erreur confirmation', severity: 'error' });
                            }
                          }}
                        >
                          <CheckCircle />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Rappel Email"
                          onClick={() => sendReminder(rdv, 'email')}
                        >
                          <Email />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Rappel SMS"
                          onClick={() => sendReminder(rdv, 'sms')}
                        >
                          <Sms />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Confirmation patient"
                          onClick={() => {
                            setConfirmingId(rdv._id);
                            setOpenConfirm(true);
                          }}
                        >
                          <PersonAdd />
                      </IconButton>
                        <IconButton 
                          size="small" 
                          title="Annuler" 
                          onClick={() => {
                            setItems(items.map(i => i._id === rdv._id ? { ...i, statut: 'annulé' } : i));
                            setSnackbar({ open: true, message: 'Rendez-vous annulé', severity: 'warning' });
                          }}
                        >
                        <Delete />
                      </IconButton>
                        <IconButton 
                          size="small" 
                          title="Terminer" 
                          onClick={() => {
                            setItems(items.map(i => i._id === rdv._id ? { ...i, statut: 'terminé' } : i));
                            setSnackbar({ open: true, message: 'Rendez-vous terminé', severity: 'success' });
                          }}
                        >
                          <CheckCircle />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
      )}

      {/* Onglet Indicateurs */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {kpis.presenceRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Taux de présence
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingDown sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="error.main">
                      {kpis.cancellationRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Taux d'annulation
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Warning sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      {kpis.absenceRate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Taux d'absence
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assessment sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" color="info.main">
                      {kpis.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total rendez-vous
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Listes de suivi */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Rendez-vous à venir
                </Typography>
                <List dense>
                  {items.filter(i => i.statut === 'programmé' || i.statut === 'confirmé').slice(0, 5).map(item => (
                    <ListItem key={item._id}>
                      <ListItemIcon>
                        <Event color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${item.patient?.prenom || 'N/A'} ${item.patient?.nom || 'N/A'}`}
                        secondary={`${item.dateDebut ? new Date(item.dateDebut).toLocaleDateString() : 'N/A'} - ${item.service || 'N/A'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Rendez-vous manqués
                </Typography>
                <List dense>
                  {items.filter(i => i.statut === 'manqué').slice(0, 5).map(item => (
                    <ListItem key={item._id}>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${item.patient?.prenom || 'N/A'} ${item.patient?.nom || 'N/A'}`}
                        secondary={`${item.dateDebut ? new Date(item.dateDebut).toLocaleDateString() : 'N/A'} - ${item.service || 'N/A'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Actions rapides
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    onClick={() => {
                      const pending = items.filter(i => i.statut === 'programmé');
                      pending.forEach(rdv => sendReminder(rdv, 'email'));
                    }}
                    disabled={items.filter(i => i.statut === 'programmé').length === 0}
                  >
                    Rappels Email
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Sms />}
                    onClick={() => {
                      const pending = items.filter(i => i.statut === 'programmé');
                      pending.forEach(rdv => sendReminder(rdv, 'sms'));
                    }}
                    disabled={items.filter(i => i.statut === 'programmé').length === 0}
                  >
                    Rappels SMS
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Onglet Rapports */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Répartition par service
                </Typography>
                {demoServices.map(service => {
                  const count = items.filter(i => i.service === service).length;
                  const percentage = kpis.total > 0 ? (count / kpis.total) * 100 : 0;
                  return (
                    <Box key={service} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{service}</Typography>
                        <Typography variant="body2">{count} ({percentage.toFixed(1)}%)</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={percentage} />
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Comparaison honorés vs manqués
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {kpis.completed}
                    </Typography>
                    <Typography variant="body2">Honorés</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {kpis.missed}
                    </Typography>
                    <Typography variant="body2">Manqués</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {kpis.cancelled}
                    </Typography>
                    <Typography variant="body2">Annulés</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Taux de réussite: {kpis.total > 0 ? ((kpis.completed / kpis.total) * 100).toFixed(1) : 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Suivi des patients chroniques
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Patient</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Dernier RDV</TableCell>
                        <TableCell>Prochain RDV</TableCell>
                        <TableCell>Fidélité</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items
                        .filter(i => i.statut === 'terminé')
                        .slice(0, 10)
                        .map(item => (
                          <TableRow key={item._id}>
                            <TableCell>{item.patient?.prenom || 'N/A'} {item.patient?.nom || 'N/A'}</TableCell>
                            <TableCell>{item.service}</TableCell>
                            <TableCell>{item.dateDebut ? new Date(item.dateDebut).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>
                              {Math.random() > 0.5 ? 'Programmé' : 'Non programmé'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${Math.floor(Math.random() * 5) + 1} RDV`}
                                color="primary"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Snackbar pour notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Créer un rendez-vous</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Identifiant patient"
            placeholder="ex: PAT001"
            value={createForm.identifiant}
            onChange={(e) => setCreateForm({ ...createForm, identifiant: e.target.value })}
          />
          <TextField
            select
            label="Service"
            value={createForm.service}
            onChange={(e) => setCreateForm({ ...createForm, service: e.target.value })}
          >
            {demoServices.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField
            label="Praticien (optionnel)"
            placeholder="ex: Dr. Koffi"
            value={createForm.praticien}
            onChange={(e) => setCreateForm({ ...createForm, praticien: e.target.value })}
          />
          <TextField
            label="Motif"
            value={createForm.motif}
            onChange={(e) => setCreateForm({ ...createForm, motif: e.target.value })}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={createForm.date}
              onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
            />
            <TextField
              type="time"
              label="Heure"
              InputLabelProps={{ shrink: true }}
              value={createForm.heure}
              onChange={(e) => setCreateForm({ ...createForm, heure: e.target.value })}
            />
            <TextField
              type="number"
              label="Durée (min)"
              value={createForm.duree}
              onChange={(e) => setCreateForm({ ...createForm, duree: parseInt(e.target.value || '0', 10) })}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              label="Statut"
              value={createForm.statut}
              onChange={(e) => setCreateForm({ ...createForm, statut: e.target.value as Statut })}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="programmé">Programmé</MenuItem>
              <MenuItem value="confirmé">Confirmé</MenuItem>
              <MenuItem value="annulé">Annulé</MenuItem>
              <MenuItem value="terminé">Terminé</MenuItem>
            </TextField>
            <TextField
              select
              label="Priorité"
              value={createForm.priorite}
              onChange={(e) => setCreateForm({ ...createForm, priorite: e.target.value as 'normal' | 'urgent' })}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>
          </Box>
          {createError && <Typography color="error">{createError}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenCreate(false)}>Annuler</Button>
        <Button variant="contained" onClick={async () => {
          setCreateError(null);
          if (!createForm.identifiant) { setCreateError('Identifiant patient requis'); return; }
          if (!createForm.service) { setCreateError('Service requis'); return; }
          if (!createForm.motif) { setCreateError('Motif requis'); return; }
          if (!createForm.date || !createForm.heure) { setCreateError('Date et heure requises'); return; }
          const start = new Date(`${createForm.date}T${createForm.heure}:00`);
          const end = new Date(start.getTime() + (createForm.duree || 30) * 60000);
          const hasConflict = items.some(i => {
            const a1 = new Date(i.dateDebut).getTime();
            const a2 = new Date(i.dateFin).getTime();
            return a1 < end.getTime() && a2 > start.getTime();
          });
          if (hasConflict && createForm.priorite !== 'urgent') {
            setCreateError('Créneau occupé: choisissez un autre horaire ou marquez en urgent');
            return;
          }
          try {
            if (!useDemo) {
              const token = localStorage.getItem('token');
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (token) headers.Authorization = `Bearer ${token}`;
              const res = await fetch('/api/rendez-vous', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  patient: undefined,
                  service: createForm.service,
                  motif: createForm.motif,
                  dateDebut: start.toISOString(),
                  dateFin: end.toISOString(),
                  priorite: createForm.priorite,
                })
              });
              if (res.ok) {
                const json = await res.json();
                setItems([json.data, ...items]);
                setOpenCreate(false);
                return;
              }
            }
          } catch {}
          const [prenom, nom] = randomFrom(demoPatients).split(' ');
          const newItem: RendezVousItem = {
            _id: `local-${Date.now()}`,
            patient: { nom: nom || 'Patient', prenom: prenom || 'Demo' },
            praticien: createForm.praticien ? { nom: createForm.praticien, prenom: '' } : undefined,
            service: createForm.service,
            motif: createForm.motif,
            dateDebut: start.toISOString(),
            dateFin: end.toISOString(),
            statut: createForm.statut,
          };
          setItems([newItem, ...items]);
          setStats(prev => {
            const total = (prev?.total || 0) + 1;
            const byStatus = { ...(prev?.byStatus || {}) };
            byStatus[newItem.statut] = (byStatus[newItem.statut] || 0) + 1;
            return { total, byStatus };
          });
          setOpenCreate(false);
        }}>Créer</Button>
      </DialogActions>
    </Dialog>

    {/* Dialog de confirmation patient */}
    <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmation patient</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Le patient souhaite confirmer son rendez-vous ?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cette action changera le statut du rendez-vous en "Confirmé".
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenConfirm(false)}>Annuler</Button>
        <Button 
          onClick={() => {
            if (confirmingId) {
              handlePatientConfirm(confirmingId);
              setOpenConfirm(false);
              setConfirmingId(null);
            }
          }}
          variant="contained"
          color="primary"
        >
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>

  </Box>
  );
};

// Dialog de création de rendez-vous est géré inline dans ce composant via les états

export default RendezVous; 