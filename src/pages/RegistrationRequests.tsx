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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  Divider,
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Refresh,
  FilterList,
  MoreVert,
  PersonAdd,
  Pending,
  Block,
} from '@mui/icons-material';
import { User } from '../types/auth';
import { ALL_ROLES, getRoleLabelByValue } from '../config/roles';
import { apiGet, apiPost } from '../services/apiClient';

interface RegistrationRequest {
  _id: string;
  id?: string; // ID original de Supabase
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  roleSouhaite?: string;
  specialite?: string;
  securityQuestions: {
    question1: { question: string; answer: string };
    question2: { question: string; answer: string };
    question3?: { question: string; answer: string };
  };
  statut: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  traiteLe?: string;
  raisonRejet?: string;
  notes?: string;
  clinicId?: string;
  clinicCode?: string;
}

interface RegistrationRequestsProps {
  user: User | null;
}

const RegistrationRequests: React.FC<RegistrationRequestsProps> = ({ user }) => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRequestId, setMenuRequestId] = useState<string | null>(null);
  const [approveForm, setApproveForm] = useState({
    role: '',
    permissions: [] as string[],
    notes: '',
  });
  const [rejectForm, setRejectForm] = useState({
    raisonRejet: '',
    notes: '',
  });

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Debug: afficher l'utilisateur connecté pour comprendre le contexte
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const currentUser = JSON.parse(userStr);
          console.log('👤 Utilisateur connecté:', {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role,
            clinic_id: currentUser.clinic_id,
            clinicCode: currentUser.clinicCode,
          });
        } catch (e) {
          console.warn('⚠️ Impossible de parser user depuis localStorage');
        }
      }
      
      const query = filterStatus !== 'all' ? `?statut=${filterStatus}` : '';
      console.log('🔍 Appel GET /auth/registration-requests' + query);
      
      const data = await apiGet<any>(`/auth/registration-requests${query}`);
      console.log('📊 Réponse brute:', data);
      
      if (data.success) {
        // Debug: afficher les données reçues
        console.log('📋 Demandes d\'inscription reçues:', data.requests?.length, 'demandes');
        if (data.requests && data.requests.length > 0) {
          console.log('📝 Exemple de demande:', {
            id: data.requests[0].id,
            _id: data.requests[0]._id,
            roleSouhaite: data.requests[0].roleSouhaite,
            createdAt: data.requests[0].createdAt,
          });
        }
        setRequests(data.requests || []);
        setError('');
      } else {
        throw new Error(data.message || 'Erreur lors du chargement des demandes');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiGet<any>('/auth/registration-requests');
      if (data.success && data.requests) {
        const allRequests = data.requests;
        setStats({
          total: allRequests.length,
          pending: allRequests.filter((r: RegistrationRequest) => r.statut === 'pending').length,
          approved: allRequests.filter((r: RegistrationRequest) => r.statut === 'approved').length,
          rejected: allRequests.filter((r: RegistrationRequest) => r.statut === 'rejected').length,
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) {
      console.error('Aucune demande sélectionnée pour approbation');
      setError('Aucune demande sélectionnée');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const requestId = selectedRequest.id || selectedRequest._id;
      
      console.log('🔄 Approbation de la demande:', {
        requestId,
        role: approveForm.role || selectedRequest.roleSouhaite,
        token: token ? 'présent' : 'absent',
      });
      
      const data = await apiPost<any>(`/auth/registration-requests/${requestId}/approve`, {
        role: approveForm.role || selectedRequest.roleSouhaite || 'receptionniste',
        permissions: approveForm.permissions,
        notes: approveForm.notes,
      });
      console.log('📥 Réponse approbation:', { data });

      if (data.success) {
        setSuccess('Demande d\'inscription approuvée avec succès. Le compte est maintenant activé (connexion avec le mot de passe choisi à l’inscription).');
        setApproveDialogOpen(false);
        setDetailsOpen(false);
        setApproveForm({ role: '', permissions: [], notes: '' });
        fetchRequests();
        fetchStats();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        throw new Error(data.message || 'Erreur lors de l\'approbation');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'approbation de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) {
      console.error('Aucune demande sélectionnée pour rejet');
      setError('Aucune demande sélectionnée');
      return;
    }
    
    if (!rejectForm.raisonRejet) {
      setError('Veuillez indiquer une raison de rejet');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const requestId = selectedRequest.id || selectedRequest._id;
      
      console.log('🔄 Rejet de la demande:', { requestId, raison: rejectForm.raisonRejet });
      
      const data = await apiPost<any>(`/auth/registration-requests/${requestId}/reject`, {
        raisonRejet: rejectForm.raisonRejet,
        notes: rejectForm.notes,
      });
      console.log('📥 Réponse rejet:', { data });

      if (data.success) {
        setSuccess('Demande d\'inscription rejetée');
        setRejectDialogOpen(false);
        setDetailsOpen(false);
        setRejectForm({ raisonRejet: '', notes: '' });
        fetchRequests();
        fetchStats();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        throw new Error(data.message || 'Erreur lors du rejet');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du rejet de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, requestId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuRequestId(requestId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRequestId(null);
  };

  const handleViewDetails = (request: RegistrationRequest) => {
    // #region agent log (debug-session)
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrationRequests.tsx:handleViewDetails',message:'handleViewDetails appelé',data:{requestId:request?.id||request?._id,hasSecurityQuestions:!!request?.securityQuestions,securityQuestionsType:typeof request?.securityQuestions,createdAt:request?.createdAt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,D'})}).catch(()=>{});
    // #endregion
    setSelectedRequest(request);
    setDetailsOpen(true);
    handleMenuClose();
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvée';
      case 'rejected':
        return 'Rejetée';
      default:
        return statut;
    }
  };

  const getRoleLabel = (role?: string | null) => {
    if (!role || (typeof role === 'string' && role.trim() === '')) {
      return 'Non spécifié';
    }
    // Utiliser la configuration centralisée des rôles
    try {
      return getRoleLabelByValue(role as any);
    } catch {
      // Fallback sur un mapping simple si le rôle n'est pas trouvé
      const roleMap: Record<string, string> = {
        'receptionniste': 'Réceptionniste',
        'medecin': 'Médecin',
        'pharmacien': 'Pharmacien',
        'infirmier': 'Infirmier',
        'admin': 'Administrateur',
        'clinic_admin': 'Administrateur Clinique',
        'staff': 'Personnel',
      };
      const normalizedRole = role.toLowerCase().trim();
      return roleMap[normalizedRole] || role;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Demandes d'inscription
        </Typography>
        <Button
          variant="contained"
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

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                En attente
              </Typography>
              <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approuvées
              </Typography>
              <Typography variant="h4" color="success.main">{stats.approved}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rejetées
              </Typography>
              <Typography variant="h4" color="error.main">{stats.rejected}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FilterList />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={filterStatus}
              label="Statut"
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="approved">Approuvées</MenuItem>
              <MenuItem value="rejected">Rejetées</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Tableau */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom complet</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Rôle souhaité</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date de demande</TableCell>
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
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">
                    Aucune demande d'inscription trouvée
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id || request._id} hover>
                  <TableCell>{request.prenom} {request.nom}</TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>{request.telephone}</TableCell>
                  <TableCell>
                    {getRoleLabel(request.roleSouhaite)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(request.statut)}
                      color={getStatusColor(request.statut) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {(() => {
                      try {
                        // Essayer createdAt, created_at, ou created_at depuis l'objet original
                        const dateValue = request.createdAt || (request as any).created_at;
                        if (!dateValue) return '-';
                        
                        const date = new Date(dateValue);
                        if (isNaN(date.getTime())) return '-';
                        
                        return date.toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      } catch {
                        return '-';
                      }
                    })()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        const requestId = request.id || request._id;
                        if (requestId) {
                          handleMenuOpen(e, requestId);
                        } else {
                          console.error('ID manquant pour la demande:', request);
                        }
                      }}
                      aria-label="Actions"
                      aria-haspopup="true"
                      aria-expanded={Boolean(anchorEl && menuRequestId === (request.id || request._id))}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menu contextuel */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {menuRequestId && (
          <>
            <MenuItem
              onClick={() => {
                // #region agent log (debug-session)
                fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrationRequests.tsx:MenuItem-VoirDetails',message:'Clic sur Voir les détails',data:{menuRequestId,requestsLength:requests.length,allIds:requests.map(r=>({id:r.id,_id:r._id}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                const request = requests.find((r) => (r.id || r._id) === menuRequestId);
                // #region agent log (debug-session)
                fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrationRequests.tsx:MenuItem-VoirDetails-afterFind',message:'Après find',data:{foundRequest:!!request,requestData:request?{id:request.id,_id:request._id,securityQuestions:request.securityQuestions}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
                // #endregion
                if (request) {
                  handleViewDetails(request);
                } else {
                  console.error('Demande non trouvée pour ID:', menuRequestId);
                }
              }}
            >
              <Visibility sx={{ mr: 1 }} /> Voir les détails
            </MenuItem>
            {requests.find((r) => (r.id || r._id) === menuRequestId)?.statut === 'pending' && (
              <>
                <MenuItem
                  onClick={() => {
                    // #region agent log (debug-session)
                    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrationRequests.tsx:MenuItem-Approuver',message:'Clic sur Approuver',data:{menuRequestId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    const request = requests.find((r) => (r.id || r._id) === menuRequestId);
                    if (request) {
                      // #region agent log (debug-session)
                      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrationRequests.tsx:MenuItem-Approuver-found',message:'Demande trouvée pour approbation',data:{requestId:request.id||request._id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                      // #endregion
                      setSelectedRequest(request);
                      setApproveForm({
                        role: request.roleSouhaite || 'receptionniste',
                        permissions: [],
                        notes: '',
                      });
                      setApproveDialogOpen(true);
                    } else {
                      console.error('Demande non trouvée pour approbation, ID:', menuRequestId);
                    }
                    handleMenuClose();
                  }}
                >
                  <CheckCircle sx={{ mr: 1 }} /> Approuver
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    // #region agent log (debug-session)
                    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrationRequests.tsx:MenuItem-Rejeter',message:'Clic sur Rejeter',data:{menuRequestId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    const request = requests.find((r) => (r.id || r._id) === menuRequestId);
                    if (request) {
                      setSelectedRequest(request);
                      setRejectForm({ raisonRejet: '', notes: '' });
                      setRejectDialogOpen(true);
                    } else {
                      console.error('Demande non trouvée pour rejet, ID:', menuRequestId);
                    }
                    handleMenuClose();
                  }}
                >
                  <Cancel sx={{ mr: 1 }} /> Rejeter
                </MenuItem>
              </>
            )}
          </>
        )}
      </Menu>

      {/* Dialog détails */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Détails de la demande d'inscription
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Nom</Typography>
                  <Typography>{selectedRequest.nom}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Prénom</Typography>
                  <Typography>{selectedRequest.prenom}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                  <Typography>{selectedRequest.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Téléphone</Typography>
                  <Typography>{selectedRequest.telephone}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Adresse</Typography>
                  <Typography>{selectedRequest.adresse}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Rôle souhaité
                  </Typography>
                  <Chip 
                    label={getRoleLabel(selectedRequest.roleSouhaite)} 
                    color={selectedRequest.roleSouhaite ? "primary" : "default"}
                    variant={selectedRequest.roleSouhaite ? "filled" : "outlined"}
                    sx={{ fontWeight: selectedRequest.roleSouhaite ? 600 : 400 }}
                  />
                </Grid>
                {selectedRequest.specialite && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Spécialité</Typography>
                    <Typography>{selectedRequest.specialite}</Typography>
                  </Grid>
                )}
                {selectedRequest.securityQuestions && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" sx={{ mb: 2 }}>Questions de sécurité</Typography>
                    {selectedRequest.securityQuestions.question1 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">Question 1</Typography>
                        <Typography>{selectedRequest.securityQuestions.question1.question}</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                          Réponse: {selectedRequest.securityQuestions.question1.answer}
                        </Typography>
                      </Box>
                    )}
                    {selectedRequest.securityQuestions.question2 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">Question 2</Typography>
                        <Typography>{selectedRequest.securityQuestions.question2.question}</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                          Réponse: {selectedRequest.securityQuestions.question2.answer}
                        </Typography>
                      </Box>
                    )}
                    {selectedRequest.securityQuestions.question3 && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Question 3</Typography>
                        <Typography>{selectedRequest.securityQuestions.question3.question}</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                          Réponse: {selectedRequest.securityQuestions.question3.answer}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="textSecondary">Date de demande</Typography>
                  <Typography>
                    {selectedRequest.createdAt 
                      ? (() => {
                          const d = new Date(selectedRequest.createdAt);
                          return isNaN(d.getTime()) ? '-' : d.toLocaleString('fr-FR');
                        })()
                      : '-'}
                  </Typography>
                  {selectedRequest.traiteLe && (
                    <>
                      <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                        Traitée le
                      </Typography>
                      <Typography>{new Date(selectedRequest.traiteLe).toLocaleString('fr-FR')}</Typography>
                    </>
                  )}
                  {selectedRequest.raisonRejet && (
                    <>
                      <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                        Raison du rejet
                      </Typography>
                      <Typography color="error">{selectedRequest.raisonRejet}</Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedRequest?.statut === 'pending' && (
            <>
              <Button
                onClick={() => {
                  setApproveForm({
                    role: selectedRequest.roleSouhaite || 'receptionniste',
                    permissions: [],
                    notes: '',
                  });
                  setApproveDialogOpen(true);
                }}
                color="success"
                variant="contained"
                startIcon={<CheckCircle />}
              >
                Approuver
              </Button>
              <Button
                onClick={() => {
                  setRejectForm({ raisonRejet: '', notes: '' });
                  setRejectDialogOpen(true);
                }}
                color="error"
                variant="outlined"
                startIcon={<Cancel />}
              >
                Rejeter
              </Button>
            </>
          )}
          <Button onClick={() => setDetailsOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog approbation */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approuver la demande d'inscription</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 400 }}>
            {selectedRequest && selectedRequest.roleSouhaite && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Rôle souhaité initial :</strong> {getRoleLabel(selectedRequest.roleSouhaite)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Vous pouvez modifier ce rôle ci-dessous si nécessaire
                </Typography>
              </Alert>
            )}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Rôle à attribuer</InputLabel>
              <Select
                value={approveForm.role}
                label="Rôle à attribuer"
                onChange={(e) => setApproveForm({ ...approveForm, role: e.target.value })}
              >
                {ALL_ROLES.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                    {selectedRequest?.roleSouhaite === role.value && (
                      <Chip 
                        label="Souhaité" 
                        size="small" 
                        color="primary" 
                        sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (optionnel)"
              value={approveForm.notes}
              onChange={(e) => setApproveForm({ ...approveForm, notes: e.target.value })}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleApprove} color="success" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Approuver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog rejet */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Rejeter la demande d'inscription</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 400 }}>
            <TextField
              fullWidth
              required
              multiline
              rows={3}
              label="Raison du rejet"
              value={rejectForm.raisonRejet}
              onChange={(e) => setRejectForm({ ...rejectForm, raisonRejet: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (optionnel)"
              value={rejectForm.notes}
              onChange={(e) => setRejectForm({ ...rejectForm, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={loading || !rejectForm.raisonRejet}
          >
            {loading ? <CircularProgress size={24} /> : 'Rejeter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegistrationRequests;

