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
  Avatar,
} from '@mui/material';
import {
  Notifications,
  CheckCircle,
  Info,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { UserActivityService, NotificationHistory } from '../../services/userActivityService';

interface NotificationsHistoryTabProps {
  userId: string;
}

const NotificationsHistoryTab: React.FC<NotificationsHistoryTabProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const notificationHistory = await UserActivityService.getUserNotificationsHistory(userId, 50);
        setNotifications(notificationHistory);
      } catch (err: any) {
        console.error('Erreur lors du chargement des notifications:', err);
        setError(err.message || 'Erreur lors du chargement des notifications');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadNotifications();
    }
  }, [userId]);

  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return <CheckCircle />;
      case 'warning':
        return <Warning />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <Info />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
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

  if (notifications.length === 0) {
    return (
      <Alert severity="info">
        Aucune notification dans l'historique
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Historique des notifications ({notifications.length})
        </Typography>
        <List>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                sx={{
                  opacity: notification.read ? 0.7 : 1,
                  borderLeft: notification.read ? 'none' : `4px solid`,
                  borderColor: notification.read ? 'transparent' : `${getNotificationColor(notification.type)}.main`,
                  pl: notification.read ? 2 : 1.5,
                }}
              >
                <ListItemIcon>
                  <Avatar
                    sx={{
                      bgcolor: `${getNotificationColor(notification.type)}.light`,
                      color: `${getNotificationColor(notification.type)}.main`,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="subtitle1" fontWeight={notification.read ? 400 : 600}>
                        {notification.title}
                      </Typography>
                      {!notification.read && (
                        <Chip label="Non lu" size="small" color="primary" />
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {new Date(notification.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {notification.description}
                    </Typography>
                  }
                />
              </ListItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default NotificationsHistoryTab;
