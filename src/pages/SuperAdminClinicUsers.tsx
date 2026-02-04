import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add, Edit, ArrowBack } from '@mui/icons-material';
import { apiGet, apiPost, apiPatch } from '../services/apiClient';
import { ALL_ROLES, getRoleLabelByValue } from '../config/roles';

interface ClinicUser {
  id: string;
  email: string;
  nom?: string | null;
  prenom?: string | null;
  role: string;
  status?: string;
  actif?: boolean;
}

const DB_ROLE_TO_FRONT: Record<string, string> = {
  CLINIC_ADMIN: 'admin',
  MEDECIN: 'medecin',
  INFIRMIER: 'infirmier',
  SAGE_FEMME: 'sage_femme',
  PHARMACIEN: 'pharmacien',
  TECHNICIEN_LABO: 'technicien_labo',
  LABORANTIN: 'laborantin',
  IMAGERIE: 'imagerie',
  CAISSIER: 'caissier',
  COMPTABLE: 'comptable',
  RECEPTIONNISTE: 'receptionniste',
  SECRETAIRE: 'secretaire',
  AUDITEUR: 'auditeur',
};

function toFrontRole(dbRole: string): string {
  return DB_ROLE_TO_FRONT[dbRole?.toUpperCase()] ?? dbRole?.toLowerCase() ?? 'receptionniste';
}

function toDbRole(frontRole: string): string {
  if (frontRole === 'admin') return 'CLINIC_ADMIN';
  return (frontRole || 'receptionniste').toUpperCase().replace(/-/g, '_');
}

const SuperAdminClinicUsers: React.FC = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [clinicName, setClinicName] = useState<string>('');
  const [users, setUsers] = useState<ClinicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', nom: '', prenom: '', role: 'receptionniste' });
  const [saving, setSaving] = useState(false);

  const fetchClinicAndUsers = async () => {
    if (!clinicId) return;
    setLoading(true);
    setError('');
    try {
      const clinicsData = await apiGet<{ success: boolean; clinics?: { id: string; name: string }[] }>('/super-admin/clinics');
      const clinics = (clinicsData as any)?.clinics ?? [];
      const clinic = clinics.find((c: any) => c.id === clinicId);
      setClinicName(clinic?.name ?? 'Clinique');
      const usersData = await apiGet<{ success: boolean; users?: ClinicUser[] }>(`/super-admin/clinics/${clinicId}/users`);
      setUsers((usersData as any)?.users ?? []);
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinicAndUsers();
  }, [clinicId]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ email: '', password: '', nom: '', prenom: '', role: 'receptionniste' });
    setDialogOpen(true);
  };

  const openEdit = (u: ClinicUser) => {
    setEditingId(u.id);
    setForm({
      email: u.email || '',
      password: '',
      nom: u.nom || '',
      prenom: u.prenom || '',
      role: toFrontRole(u.role),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.email.trim()) {
      setError('Email requis');
      return;
    }
    if (!editingId && form.password.length < 8) {
      setError('Mot de passe requis (min. 8 caractères)');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const body: any = { email: form.email.trim(), nom: form.nom.trim(), prenom: form.prenom.trim(), role: form.role };
        if (form.password) body.password = form.password;
        await apiPatch(`/super-admin/users/${editingId}`, body);
        setSuccess('Agent mis à jour');
      } else {
        await apiPost(`/super-admin/clinics/${clinicId}/users`, {
          email: form.email.trim().toLowerCase(),
          password: form.password,
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          role: form.role,
        });
        setSuccess('Agent créé');
      }
      setDialogOpen(false);
      fetchClinicAndUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton component={Link} to="/super-admin/clinics"><ArrowBack /></IconButton>
        <Typography variant="h4">Agents – {clinicName}</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ ml: 'auto' }}>
          Créer un agent
        </Button>
      </Box>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Prénom</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.nom || '–'}</TableCell>
                  <TableCell>{u.prenom || '–'}</TableCell>
                  <TableCell>{getRoleLabelByValue(toFrontRole(u.role) as any)}</TableCell>
                  <TableCell>{u.actif !== false ? 'Actif' : 'Inactif'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(u)}><Edit /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Modifier l\'agent' : 'Nouvel agent'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={!!editingId} required />
            {!editingId && <TextField label="Mot de passe" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required inputProps={{ minLength: 8 }} />}
            {editingId && <TextField label="Nouveau mot de passe (laisser vide pour ne pas changer)" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />}
            <TextField label="Nom" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
            <TextField label="Prénom" value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} />
            <FormControl fullWidth>
              <InputLabel>Rôle</InputLabel>
              <Select value={form.role} label="Rôle" onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {ALL_ROLES.map((r) => (
                  <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuperAdminClinicUsers;
