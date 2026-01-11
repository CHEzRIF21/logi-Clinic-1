import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Refresh,
  FilterList,
  Verified,
  Pending,
} from '@mui/icons-material';
import { AccountRecoveryRequest, RecoveryRequestStatus } from '../../types/accountRecovery';
import RecoveryRequestDetails from '../admin/RecoveryRequestDetails';
import { User } from '../../types/auth';

interface AccountRecoveryTabProps {
  user: User | null;
}

const AccountRecoveryTab: React.FC<AccountRecoveryTabProps> = ({ user }) => {
  const [requests, setRequests] = useState<AccountRecoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<AccountRecoveryRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<RecoveryRequestStatus | 'all'>('all');
  const [filterClinicCode, setFilterClinicCode] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    today: 0,
  });

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [filterStatus, filterClinicCode]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // TODO: Implémenter l'appel API réel
      await new Promise(resolve => setTimeout(resolve, 500));
      setRequests([]);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // TODO: Implémenter l'appel API réel
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  const handleViewDetails = (request: AccountRecoveryRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const handleApprove = async (requestId: string) => {
    try {
      // TODO: Implémenter l'appel API réel
      await fetchRequests();
      setDetailsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      // TODO: Implémenter l'appel API réel
      await fetchRequests();
      setDetailsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du rejet');
    }
  };

  const getStatusColor = (status: RecoveryRequestStatus) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'verified':
        return 'info';
      case 'approved':
        return 'success';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: RecoveryRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Pending />;
      case 'verified':
        return <Verified />;
      case 'approved':
      case 'completed':
        return <CheckCircle />;
      case 'rejected':
        return <Cancel />;
      default:
        return null;
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    if (filterClinicCode && req.clinicCode && !req.clinicCode.includes(filterClinicCode.toUpperCase())) return false;
    return true;
  });

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Gestion des récupérations de compte
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={() => {
            fetchRequests();
            fetchStats();
          }}
        >
          Actualiser
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total
              </Typography>
              <Typography variant="h5">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                En attente
              </Typography>
              <Typography variant="h5" color="warning.main">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Traitées aujourd'hui
              </Typography>
              <Typography variant="h5" color="info.main">{stats.today}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Complétées
              </Typography>
              <Typography variant="h5" color="success.main">{stats.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filterStatus}
                label="Statut"
                onChange={(e) => setFilterStatus(e.target.value as RecoveryRequestStatus | 'all')}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="verified">Vérifiées</MenuItem>
                <MenuItem value="approved">Approuvées</MenuItem>
                <MenuItem value="completed">Complétées</MenuItem>
                <MenuItem value="rejected">Rejetées</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Code clinique"
              value={filterClinicCode}
              onChange={(e) => setFilterClinicCode(e.target.value)}
              placeholder="Filtrer par code clinique"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Code clinique</TableCell>
              <TableCell>Données demandées</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    Aucune demande trouvée
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>
                    {new Date(request.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>
                    {request.prenom} {request.nom}
                  </TableCell>
                  <TableCell>
                    {request.clinicCode || <Chip label="Non spécifié" size="small" variant="outlined" />}
                  </TableCell>
                  <TableCell>
                    {request.requestedData.map((data) => (
                      <Chip
                        key={data}
                        label={data === 'username' ? 'Nom d\'utilisateur' : data === 'clinicCode' ? 'Code clinique' : 'Mot de passe'}
                        size="small"
                        sx={{ mr: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(request.status)}
                      label={
                        request.status === 'pending' ? 'En attente' :
                        request.status === 'verified' ? 'Vérifiée' :
                        request.status === 'approved' ? 'Approuvée' :
                        request.status === 'completed' ? 'Complétée' :
                        'Rejetée'
                      }
                      color={getStatusColor(request.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(request)}
                      color="primary"
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de détails */}
      {selectedRequest && (
        <RecoveryRequestDetails
          open={detailsOpen}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </Box>
  );
};

export default AccountRecoveryTab;
