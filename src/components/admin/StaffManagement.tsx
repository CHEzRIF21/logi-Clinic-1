import React, { useState, useEffect, useCallback } from 'react';
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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Avatar,
  Badge,
  useTheme,
  alpha,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Person,
  PersonOff,
  Edit,
  Delete,
  Refresh,
  HourglassEmpty,
  Group,
  PersonAdd,
  VerifiedUser,
  Block,
  Email,
  Phone,
  Work,
} from '@mui/icons-material';
import { supabase } from '../../services/supabase';
import { User } from '../../types/auth';
import { ALL_ROLES, getRoleLabelByValue } from '../../config/roles';

interface StaffMember {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  status: string;
  actif: boolean;
  specialite?: string;
  telephone?: string;
  created_at: string;
  last_login?: string;
}

interface RegistrationRequest {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role_souhaite: string;
  specialite?: string;
  statut: string;
  created_at: string;
  clinic_code?: string;
}

interface StaffManagementProps {
  currentUser: User;
  clinicId?: string;
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: '#7c3aed',
  CLINIC_ADMIN: '#2563eb',
  ADMIN: '#2563eb',
  MEDECIN: '#16a34a',
  INFIRMIER: '#06b6d4',
  PHARMACIEN: '#f97316',
  CAISSIER: '#eab308',
  LABORANTIN: '#8b5cf6',
  RECEPTIONNISTE: '#ec4899',
  STAFF: '#6b7280',
};

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  SUSPENDED: 'error',
  REJECTED: 'error',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

const StaffManagement: React.FC<StaffManagementProps> = ({ currentUser, clinicId }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'activate' | 'deactivate' | 'delete' | null>(null);
  const [editForm, setEditForm] = useState({
    role: '',
    specialite: '',
  });
  const [rejectReason, setRejectReason] = useState('');

  // Fetch staff members
  const fetchStaffMembers = useCallback(async () => {
    try {
      // TOUJOURS filtrer par clinic_id (même pour Super Admin selon nouvelle exigence)
      if (!clinicId) {
        console.error('Clinic ID manquant pour récupérer les utilisateurs');
        setStaffMembers([]);
        return;
      }

      let query = supabase
        .from('users')
        .select('*')
        .eq('clinic_id', clinicId) // Toujours appliquer le filtre
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (err: any) {
      console.error('Erreur récupération staff:', err);
      setError('Erreur lors de la récupération des utilisateurs');
      setStaffMembers([]);
    }
  }, [clinicId]); // Retirer currentUser des dépendances

  // Fetch registration requests
  const fetchRegistrationRequests = useCallback(async () => {
    try {
      // TOUJOURS filtrer par clinic_id (même pour Super Admin selon nouvelle exigence)
      if (!clinicId) {
        console.error('Clinic ID manquant pour récupérer les demandes d\'inscription');
        setRegistrationRequests([]);
        return;
      }

      let query = supabase
        .from('registration_requests')
        .select('*')
        .eq('clinic_id', clinicId) // Toujours appliquer le filtre
        .eq('statut', 'pending')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setRegistrationRequests(data || []);
    } catch (err: any) {
      console.error('Erreur récupération demandes:', err);
      setRegistrationRequests([]);
    }
  }, [clinicId]); // Retirer currentUser des dépendances

  // Refresh data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchStaffMembers(), fetchRegistrationRequests()]);
    setLoading(false);
  }, [fetchStaffMembers, fetchRegistrationRequests]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Approve registration request
  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/auth/registration-requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: editForm.role || selectedRequest.role_souhaite,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors de l\'approbation');
      }

      setSuccess(`Demande de ${selectedRequest.prenom} ${selectedRequest.nom} approuvée avec succès`);
      setConfirmDialogOpen(false);
      setSelectedRequest(null);
      await refreshData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reject registration request
  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/auth/registration-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raisonRejet: rejectReason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors du rejet');
      }

      setSuccess(`Demande de ${selectedRequest.prenom} ${selectedRequest.nom} rejetée`);
      setConfirmDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
      await refreshData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle user active status
  const handleToggleUserStatus = async () => {
    if (!selectedStaff) return;

    try {
      setLoading(true);
      
      const newStatus = selectedStaff.actif ? false : true;
      const { error } = await supabase
        .from('users')
        .update({ 
          actif: newStatus,
          status: newStatus ? 'ACTIVE' : 'SUSPENDED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedStaff.id);

      if (error) throw error;

      setSuccess(`Utilisateur ${selectedStaff.prenom} ${selectedStaff.nom} ${newStatus ? 'activé' : 'désactivé'}`);
      setConfirmDialogOpen(false);
      setSelectedStaff(null);
      await refreshData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Validate pending user (activation explicite — workflow 2 étapes)
  const handleValidatePendingUser = async () => {
    if (!selectedStaff) return;

    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      if (API_BASE_URL) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/auth/users/${selectedStaff.id}/activate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Erreur lors de l\'activation');
      } else {
        const { error } = await supabase
          .from('users')
          .update({ status: 'ACTIVE', actif: true, updated_at: new Date().toISOString() })
          .eq('id', selectedStaff.id);
        if (error) throw error;
      }
      setSuccess(`Utilisateur ${selectedStaff.prenom} ${selectedStaff.nom} validé et activé`);
      setConfirmDialogOpen(false);
      setSelectedStaff(null);
      await refreshData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const handleUpdateUser = async () => {
    if (!selectedStaff) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('users')
        .update({ 
          role: editForm.role,
          specialite: editForm.specialite,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedStaff.id);

      if (error) throw error;

      setSuccess(`Utilisateur ${selectedStaff.prenom} ${selectedStaff.nom} mis à jour`);
      setEditDialogOpen(false);
      setSelectedStaff(null);
      await refreshData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open confirm dialog
  const openConfirmDialog = (action: 'approve' | 'reject' | 'activate' | 'deactivate' | 'delete', staff?: StaffMember, request?: RegistrationRequest) => {
    setConfirmAction(action);
    if (staff) setSelectedStaff(staff);
    if (request) {
      setSelectedRequest(request);
      setEditForm({ role: request.role_souhaite, specialite: request.specialite || '' });
    }
    setConfirmDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditForm({ role: staff.role, specialite: staff.specialite || '' });
    setEditDialogOpen(true);
  };

  // Render stats cards
  const renderStatsCards = () => {
    const totalStaff = staffMembers.length;
    const activeStaff = staffMembers.filter(s => s.actif && s.status === 'ACTIVE').length;
    const pendingStaff = staffMembers.filter(s => s.status === 'PENDING').length;
    const pendingRequests = registrationRequests.length;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <Group sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">{totalStaff}</Typography>
              <Typography variant="body2" color="text.secondary">Total Staff</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <VerifiedUser sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">{activeStaff}</Typography>
              <Typography variant="body2" color="text.secondary">Actifs</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <HourglassEmpty sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">{pendingStaff}</Typography>
              <Typography variant="body2" color="text.secondary">En attente</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <Badge badgeContent={pendingRequests} color="error">
                <PersonAdd sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
              </Badge>
              <Typography variant="h4" fontWeight="bold">{pendingRequests}</Typography>
              <Typography variant="body2" color="text.secondary">Demandes</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render staff table
  const renderStaffTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <TableCell>Utilisateur</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Rôle</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell>Dernière connexion</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {staffMembers.map((staff) => (
            <TableRow key={staff.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: roleColors[staff.role] || roleColors.STAFF, width: 36, height: 36 }}>
                    {staff.prenom?.charAt(0)}{staff.nom?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">{staff.prenom} {staff.nom}</Typography>
                    {staff.specialite && (
                      <Typography variant="caption" color="text.secondary">{staff.specialite}</Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Email fontSize="small" color="action" />
                  {staff.email}
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={staff.role}
                  size="small"
                  sx={{ 
                    bgcolor: alpha(roleColors[staff.role] || roleColors.STAFF, 0.1),
                    color: roleColors[staff.role] || roleColors.STAFF,
                    fontWeight: 600,
                  }}
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={staff.status}
                  size="small"
                  color={statusColors[staff.status] || 'default'}
                  icon={staff.actif ? <CheckCircle /> : <Block />}
                />
              </TableCell>
              <TableCell>
                {staff.last_login 
                  ? new Date(staff.last_login).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Jamais'}
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                  {staff.status === 'PENDING' && (
                    <Tooltip title="Valider l'utilisateur">
                      <IconButton 
                        size="small" 
                        color="success"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setConfirmAction('activate');
                          setConfirmDialogOpen(true);
                        }}
                      >
                        <CheckCircle />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Modifier">
                    <IconButton size="small" color="primary" onClick={() => openEditDialog(staff)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={staff.actif ? 'Désactiver' : 'Activer'}>
                    <IconButton 
                      size="small" 
                      color={staff.actif ? 'warning' : 'success'}
                      onClick={() => openConfirmDialog(staff.actif ? 'deactivate' : 'activate', staff)}
                    >
                      {staff.actif ? <PersonOff /> : <Person />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {staffMembers.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">Aucun utilisateur trouvé</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Render registration requests table
  const renderRequestsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: alpha(theme.palette.info.main, 0.05) }}>
            <TableCell>Demandeur</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Rôle souhaité</TableCell>
            <TableCell>Date demande</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {registrationRequests.map((request) => (
            <TableRow key={request.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: theme.palette.info.main, width: 36, height: 36 }}>
                    {request.prenom?.charAt(0)}{request.nom?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">{request.prenom} {request.nom}</Typography>
                    {request.specialite && (
                      <Typography variant="caption" color="text.secondary">{request.specialite}</Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Email fontSize="small" color="action" />
                    <Typography variant="body2">{request.email}</Typography>
                  </Box>
                  {request.telephone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body2">{request.telephone}</Typography>
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={request.role_souhaite}
                  size="small"
                  icon={<Work />}
                  sx={{ 
                    bgcolor: alpha(roleColors[request.role_souhaite?.toUpperCase()] || roleColors.STAFF, 0.1),
                    color: roleColors[request.role_souhaite?.toUpperCase()] || roleColors.STAFF,
                  }}
                />
              </TableCell>
              <TableCell>
                {new Date(request.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckCircle />}
                    onClick={() => openConfirmDialog('approve', undefined, request)}
                  >
                    Approuver
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Cancel />}
                    onClick={() => openConfirmDialog('reject', undefined, request)}
                  >
                    Rejeter
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
          {registrationRequests.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">Aucune demande en attente</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Gestion du Staff
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={refreshData}
          disabled={loading}
        >
          Actualiser
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {renderStatsCards()}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group />
                Utilisateurs ({staffMembers.length})
              </Box>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={registrationRequests.length} color="error">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonAdd />
                  Demandes d'inscription
                </Box>
              </Badge>
            } 
          />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        activeTab === 0 ? renderStaffTable() : renderRequestsTable()
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l'utilisateur</DialogTitle>
        <DialogContent>
          {selectedStaff && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedStaff.prenom} {selectedStaff.nom}
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Rôle</InputLabel>
                <Select
                  value={editForm.role}
                  label="Rôle"
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  {ALL_ROLES.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Spécialité"
                value={editForm.specialite}
                onChange={(e) => setEditForm({ ...editForm, specialite: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleUpdateUser} disabled={loading}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {confirmAction === 'approve' && 'Approuver la demande'}
          {confirmAction === 'reject' && 'Rejeter la demande'}
          {confirmAction === 'activate' && 'Activer l\'utilisateur'}
          {confirmAction === 'deactivate' && 'Désactiver l\'utilisateur'}
        </DialogTitle>
        <DialogContent>
          {confirmAction === 'approve' && selectedRequest && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Vous êtes sur le point d'approuver la demande de {selectedRequest.prenom} {selectedRequest.nom}.
                Un compte sera créé avec le statut "En attente" de changement de mot de passe.
              </Alert>
              <FormControl fullWidth>
                <InputLabel>Rôle à attribuer</InputLabel>
                <Select
                  value={editForm.role}
                  label="Rôle à attribuer"
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <MenuItem value="STAFF">Staff</MenuItem>
                  <MenuItem value="RECEPTIONNISTE">Réceptionniste</MenuItem>
                  <MenuItem value="INFIRMIER">Infirmier</MenuItem>
                  <MenuItem value="MEDECIN">Médecin</MenuItem>
                  <MenuItem value="PHARMACIEN">Pharmacien</MenuItem>
                  <MenuItem value="CAISSIER">Caissier</MenuItem>
                  <MenuItem value="LABORANTIN">Laborantin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
          {confirmAction === 'reject' && selectedRequest && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Vous êtes sur le point de rejeter la demande de {selectedRequest.prenom} {selectedRequest.nom}.
              </Alert>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Raison du rejet (optionnel)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </Box>
          )}
          {confirmAction === 'activate' && selectedStaff && (
            <Alert severity="success">
              Voulez-vous activer l'utilisateur {selectedStaff.prenom} {selectedStaff.nom} ?
              {selectedStaff.status === 'PENDING' && ' Son compte sera validé et il pourra se connecter.'}
            </Alert>
          )}
          {confirmAction === 'deactivate' && selectedStaff && (
            <Alert severity="warning">
              Voulez-vous désactiver l'utilisateur {selectedStaff.prenom} {selectedStaff.nom} ?
              Il ne pourra plus se connecter tant que son compte ne sera pas réactivé.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setConfirmDialogOpen(false);
            setRejectReason('');
          }}>
            Annuler
          </Button>
          {confirmAction === 'approve' && (
            <Button variant="contained" color="success" onClick={handleApproveRequest} disabled={loading}>
              Approuver
            </Button>
          )}
          {confirmAction === 'reject' && (
            <Button variant="contained" color="error" onClick={handleRejectRequest} disabled={loading}>
              Rejeter
            </Button>
          )}
          {confirmAction === 'activate' && (
            <Button 
              variant="contained" 
              color="success" 
              onClick={selectedStaff?.status === 'PENDING' ? handleValidatePendingUser : handleToggleUserStatus} 
              disabled={loading}
            >
              Activer
            </Button>
          )}
          {confirmAction === 'deactivate' && (
            <Button variant="contained" color="warning" onClick={handleToggleUserStatus} disabled={loading}>
              Désactiver
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffManagement;

