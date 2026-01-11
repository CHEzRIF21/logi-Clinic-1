import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  AccessTime,
  Category,
  Timeline,
} from '@mui/icons-material';
import { UserActivityService, ActivityStats } from '../../services/userActivityService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ActiviteTabProps {
  userId: string;
}

const ActiviteTab: React.FC<ActiviteTabProps> = ({ userId }) => {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const activityStats = await UserActivityService.getUserActivityStats(userId, 30);
        setStats(activityStats);
      } catch (err: any) {
        console.error('Erreur lors du chargement des stats:', err);
        setError(err.message || 'Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert severity="info">
        Aucune donnée d'activité disponible
      </Alert>
    );
  }

  const chartData = stats.actionsByDay.map((item) => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    count: item.count,
  }));

  const topModules = Object.entries(stats.actionsByModule)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topActions = Object.entries(stats.actionsByAction)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <Box>
      {/* Cartes de résumé */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Total Actions
                  </Typography>
                  <Typography variant="h4">{stats.totalActions}</Typography>
                </Box>
                <Timeline color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Moyenne / Jour
                  </Typography>
                  <Typography variant="h4">{stats.averageActionsPerDay}</Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Modules Utilisés
                  </Typography>
                  <Typography variant="h4">{Object.keys(stats.actionsByModule).length}</Typography>
                </Box>
                <Category color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Dernière Activité
                  </Typography>
                  <Typography variant="body2">
                    {stats.lastActivity
                      ? new Date(stats.lastActivity).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Aucune'}
                  </Typography>
                </Box>
                <AccessTime color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphique d'activité */}
      {chartData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Activité sur les 30 derniers jours
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top modules et actions */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Modules les plus utilisés
              </Typography>
              {topModules.length > 0 ? (
                <Box>
                  {topModules.map(([module, count]) => {
                    const percentage = (count / stats.totalActions) * 100;
                    return (
                      <Box key={module} sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2">{module}</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {count} ({Math.round(percentage)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography color="text.secondary">Aucune donnée</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions les plus fréquentes
              </Typography>
              {topActions.length > 0 ? (
                <Box>
                  {topActions.map(([action, count]) => (
                    <Box key={action} sx={{ mb: 1.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip label={action} size="small" color="primary" variant="outlined" />
                        <Typography variant="body2" fontWeight="bold">
                          {count}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">Aucune donnée</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ActiviteTab;
