import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Computer,
  PhoneAndroid,
  Tablet,
  DesktopWindows,
  AccessTime,
  LocationOn,
} from '@mui/icons-material';
import { UserActivityService, LoginHistory } from '../../services/userActivityService';

interface ConnexionsTabProps {
  userId: string;
}

const ConnexionsTab: React.FC<ConnexionsTabProps> = ({ userId }) => {
  const [history, setHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const loginHistory = await UserActivityService.getUserLoginHistory(userId, 50);
        setHistory(loginHistory);
      } catch (err: any) {
        console.error('Erreur lors du chargement de l\'historique:', err);
        setError(err.message || 'Erreur lors du chargement de l\'historique');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadHistory();
    }
  }, [userId]);

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Computer />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android')) return <PhoneAndroid />;
    if (ua.includes('tablet') || ua.includes('ipad')) return <Tablet />;
    return <DesktopWindows />;
  };

  const getDeviceName = (userAgent?: string) => {
    if (!userAgent) return 'Appareil inconnu';
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    return 'Navigateur';
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'En cours';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

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

  if (history.length === 0) {
    return (
      <Alert severity="info">
        Aucun historique de connexion disponible
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Historique des connexions ({history.length})
        </Typography>
        <List>
          {history.map((login, index) => (
            <React.Fragment key={login.id}>
              <ListItem>
                <ListItemIcon>
                  {getDeviceIcon(login.user_agent)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="subtitle1">
                        {new Date(login.login_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                      {login.logout_at && (
                        <Chip
                          label={`Session: ${formatDuration(login.session_duration_minutes)}`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                      {!login.logout_at && (
                        <Chip
                          label="Session active"
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <AccessTime sx={{ fontSize: 14 }} />
                        <Typography variant="caption" color="text.secondary">
                          {getDeviceName(login.user_agent)}
                        </Typography>
                      </Box>
                      {login.ip_address && (
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <LocationOn sx={{ fontSize: 14 }} />
                          <Typography variant="caption" color="text.secondary">
                            IP: {login.ip_address}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < history.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default ConnexionsTab;
