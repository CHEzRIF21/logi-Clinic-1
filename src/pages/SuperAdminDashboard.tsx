import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress } from '@mui/material';
import { Business, People } from '@mui/icons-material';
import { apiGet } from '../services/apiClient';
import { User } from '../types/auth';

interface SuperAdminDashboardProps {
  user: User | null;
}

interface Clinic {
  id: string;
  code: string;
  name: string;
  active?: boolean;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<{ clinics: number; users: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const clinicsData = await apiGet<{ success: boolean; clinics?: Clinic[] }>('/super-admin/clinics');
        const clinics = (clinicsData as any)?.clinics ?? [];
        let totalUsers = 0;
        for (const c of clinics) {
          const usersData = await apiGet<{ success: boolean; users?: unknown[] }>(`/super-admin/clinics/${c.id}/users`);
          const users = (usersData as any)?.users ?? [];
          totalUsers += users.length;
        }
        if (!cancelled) setStats({ clinics: clinics.length, users: totalUsers });
      } catch {
        if (!cancelled) setStats({ clinics: 0, users: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tableau de bord Super Admin
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Bienvenue, {user?.prenom || user?.nom || user?.email}.
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Business color="primary" />
                <Typography variant="h4">{stats?.clinics ?? 0}</Typography>
              </Box>
              <Typography color="text.secondary">Cliniques</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <People color="primary" />
                <Typography variant="h4">{stats?.users ?? 0}</Typography>
              </Box>
              <Typography color="text.secondary">Agents (toutes cliniques)</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuperAdminDashboard;
