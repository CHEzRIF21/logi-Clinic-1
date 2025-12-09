import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { History, LocalHospital } from '@mui/icons-material';

interface PricingHistoryEntry {
  id: string;
  clinicCode: string;
  clinicName: string;
  serviceId: string;
  tarifAncien: number;
  tarifNouveau: number;
  dateDebut: string;
  dateFin: string | null;
  modifiedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
}

interface Clinic {
  id: string;
  code: string;
  name: string;
}

interface PricingHistoryViewProps {
  clinicId?: string;
  serviceId?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  'http://localhost:3000';

const PricingHistoryView: React.FC<PricingHistoryViewProps> = ({
  clinicId: initialClinicId,
  serviceId: initialServiceId,
}) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(
    initialClinicId || null
  );
  const [history, setHistory] = useState<PricingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClinics();
  }, []);

  useEffect(() => {
    if (selectedClinicId) {
      loadHistory();
    }
  }, [selectedClinicId, initialServiceId]);

  const loadClinics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/clinics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement des cliniques');

      const data = await response.json();
      setClinics(data.data || []);

      if (data.data && data.data.length > 0 && !selectedClinicId) {
        setSelectedClinicId(data.data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadHistory = async () => {
    if (!selectedClinicId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const url = new URL(
        `${API_BASE_URL}/api/clinics/${selectedClinicId}/pricing/history`
      );
      if (initialServiceId) {
        url.searchParams.append('serviceId', initialServiceId);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement de l\'historique');

      const data = await response.json();
      setHistory(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriceChange = (ancien: number, nouveau: number) => {
    const diff = nouveau - ancien;
    const percent = ancien > 0 ? ((diff / ancien) * 100).toFixed(1) : '0';
    return { diff, percent };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <History />
            <Typography variant="h5" component="h2">
              Historique des Modifications de Tarifs
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Clinique</InputLabel>
                <Select
                  value={selectedClinicId || ''}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  label="Clinique"
                >
                  {clinics.map((clinic) => (
                    <MenuItem key={clinic.id} value={clinic.id}>
                      {clinic.name} ({clinic.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : history.length === 0 ? (
            <Alert severity="info">Aucun historique disponible pour cette clinique.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date de modification</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell align="right">Ancien tarif</TableCell>
                    <TableCell align="right">Nouveau tarif</TableCell>
                    <TableCell align="right">Variation</TableCell>
                    <TableCell>Période d'application</TableCell>
                    <TableCell>Modifié par</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((entry) => {
                    const change = getPriceChange(entry.tarifAncien, entry.tarifNouveau);
                    const isActive = !entry.dateFin;

                    return (
                      <TableRow key={entry.id} sx={{ opacity: isActive ? 1 : 0.7 }}>
                        <TableCell>{formatDate(entry.createdAt)}</TableCell>
                        <TableCell>
                          <Chip label={entry.serviceId} size="small" />
                        </TableCell>
                        <TableCell align="right">{formatPrice(entry.tarifAncien)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatPrice(entry.tarifNouveau)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${change.diff >= 0 ? '+' : ''}${formatPrice(change.diff)} (${change.percent}%)`}
                            color={change.diff > 0 ? 'error' : change.diff < 0 ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              Du: {formatDate(entry.dateDebut)}
                            </Typography>
                            {entry.dateFin ? (
                              <Typography variant="body2" color="text.secondary">
                                Au: {formatDate(entry.dateFin)}
                              </Typography>
                            ) : (
                              <Chip label="Actif" color="success" size="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {entry.modifiedBy ? (
                            <Box>
                              <Typography variant="body2">{entry.modifiedBy.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {entry.modifiedBy.email}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Système
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PricingHistoryView;

