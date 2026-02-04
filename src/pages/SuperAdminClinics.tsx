import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add, Edit, Group } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { apiGet, apiPost, apiPatch } from '../services/apiClient';

interface Clinic {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  active?: boolean;
}

const SuperAdminClinics: React.FC = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', address: '', phone: '', email: '', active: true });
  const [saving, setSaving] = useState(false);

  const fetchClinics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<{ success: boolean; clinics?: Clinic[] }>('/super-admin/clinics');
      setClinics((data as any)?.clinics ?? []);
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ code: '', name: '', address: '', phone: '', email: '', active: true });
    setDialogOpen(true);
  };

  const openEdit = (c: Clinic) => {
    setEditingId(c.id);
    setForm({
      code: c.code || '',
      name: c.name || '',
      address: c.address || '',
      phone: c.phone || '',
      email: c.email || '',
      active: c.active !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setError('Code et nom requis');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await apiPatch(`/super-admin/clinics/${editingId}`, form);
        setSuccess('Clinique mise à jour');
      } else {
        await apiPost('/super-admin/clinics', form);
        setSuccess('Clinique créée');
      }
      setDialogOpen(false);
      fetchClinics();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Cliniques</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          Créer une clinique
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
                <TableCell>Code</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Actif</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clinics.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.email || '–'}</TableCell>
                  <TableCell>{c.active !== false ? 'Oui' : 'Non'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(c)}><Edit /></IconButton>
                    <IconButton size="small" component={Link} to={`/super-admin/clinics/${c.id}/users`}><Group /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Modifier la clinique' : 'Nouvelle clinique'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} disabled={!!editingId} required />
            <TextField label="Nom" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <TextField label="Adresse" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            <TextField label="Téléphone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <FormControlLabel control={<Switch checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />} label="Actif" />
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

export default SuperAdminClinics;
