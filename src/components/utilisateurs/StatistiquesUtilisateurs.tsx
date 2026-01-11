import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  People,
  CheckCircle,
  Cancel,
  TrendingUp,
  AccessTime,
  PersonAdd,
  Assignment,
  LockReset,
} from '@mui/icons-material';
import { UserPermissionsService } from '../../services/userPermissionsService';
import { getRoleLabelByValue } from '../../config/roles';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatistiquesUtilisateursProps {
  clinicId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const StatistiquesUtilisateurs: React.FC<StatistiquesUtilisateursProps> = ({
  clinicId,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [registrationStats, setRegistrationStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statistics, regStats] = await Promise.all([
          UserPermissionsService.getUsersStatistics(clinicId),
          UserPermissionsService.getRegistrationRequestsStats(clinicId),
        ]);
        setStats(statistics);
        setRegistrationStats(regStats);
      } catch (err: any) {
        console.error('Erreur lors du chargement des statistiques:', err);
        setError(err.message || 'Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    if (clinicId) {
      loadStats();
    }
  }, [clinicId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Alert severity="error">
        {error || 'Erreur lors du chargement des statistiques'}
      </Alert>
    );
  }

  // Préparer les données pour les graphiques
  const dataParRole = Object.entries(stats.parRole).map(([role, count]) => ({
    name: getRoleLabelByValue(role as any),
    value: count as number,
  }));

  const dataParStatut = Object.entries(stats.parStatut).map(([statut, count]) => ({
    name: statut,
    value: count as number,
  }));

  const dataConnexions = [
    { name: "Aujourd'hui", value: stats.derniereConnexion.aujourdhui },
    { name: "Cette semaine", value: stats.derniereConnexion.cetteSemaine },
    { name: "Ce mois", value: stats.derniereConnexion.ceMois },
    { name: "Jamais", value: stats.derniereConnexion.jamais },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Statistiques des Utilisateurs
      </Typography>

      {/* Cartes de résumé - Utilisateurs */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Utilisateurs
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Utilisateurs
                  </Typography>
                  <Typography variant="h4">
                    {stats.total}
                  </Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Utilisateurs Actifs
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.actifs}
                  </Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Utilisateurs Inactifs
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.inactifs}
                  </Typography>
                </Box>
                <Cancel color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Taux d'Activation
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {stats.total > 0
                      ? Math.round((stats.actifs / stats.total) * 100)
                      : 0}%
                  </Typography>
                </Box>
                <TrendingUp color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cartes de résumé - Demandes d'inscription */}
      {registrationStats && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3 }}>
            Demandes d'inscription
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Total Demandes
                      </Typography>
                      <Typography variant="h4">
                        {registrationStats.total}
                      </Typography>
                    </Box>
                    <Assignment color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        En attente
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {registrationStats.pending}
                      </Typography>
                    </Box>
                    <AccessTime color="warning" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Approuvées
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {registrationStats.approved}
                      </Typography>
                    </Box>
                    <CheckCircle color="success" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        Rejetées
                      </Typography>
                      <Typography variant="h4" color="error.main">
                        {registrationStats.rejected}
                      </Typography>
                    </Box>
                    <Cancel color="error" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Graphiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Répartition par rôle */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Répartition par Rôle
              </Typography>
              {dataParRole.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dataParRole}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataParRole.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  Aucune donnée disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Répartition par statut */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Répartition par Statut
              </Typography>
              {dataParStatut.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dataParStatut}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  Aucune donnée disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Dernières connexions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dernières Connexions
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataConnexions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tableau détaillé par rôle */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Détail par Rôle
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rôle</TableCell>
                  <TableCell align="right">Nombre d'utilisateurs</TableCell>
                  <TableCell align="right">Pourcentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(stats.parRole)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([role, count]) => (
                    <TableRow key={role}>
                      <TableCell>{getRoleLabelByValue(role as any)}</TableCell>
                      <TableCell align="right">{count as number}</TableCell>
                      <TableCell align="right">
                        {stats.total > 0
                          ? Math.round(((count as number) / stats.total) * 100)
                          : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StatistiquesUtilisateurs;
