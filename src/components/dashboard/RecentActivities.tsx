import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Chip,
} from '@mui/material';
import {
  People,
  Event,
  LocalPharmacy,
  Payment,
  Assignment,
  Science,
  Schedule,
  MedicalServices,
  CheckCircle,
  Add,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import ModernCard from '../ui/ModernCard';

interface Activity {
  id: string;
  type: string;
  action: string;
  user?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface RecentActivitiesProps {
  activities: Activity[];
  maxItems?: number;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'patient':
      return <People />;
    case 'consultation':
    case 'rdv':
      return <Event />;
    case 'pharmacie':
    case 'dispensation':
      return <LocalPharmacy />;
    case 'caisse':
    case 'paiement':
    case 'facture':
      return <Payment />;
    case 'prescription':
      return <Assignment />;
    case 'lab':
    case 'prelevement':
    case 'analyse':
      return <Science />;
    case 'soin':
      return <MedicalServices />;
    case 'vaccination':
      return <CheckCircle />;
    default:
      return <Schedule />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'patient':
      return 'primary';
    case 'consultation':
    case 'rdv':
      return 'info';
    case 'pharmacie':
    case 'dispensation':
      return 'warning';
    case 'caisse':
    case 'paiement':
    case 'facture':
      return 'success';
    case 'prescription':
      return 'secondary';
    case 'lab':
    case 'prelevement':
    case 'analyse':
      return 'info';
    case 'soin':
      return 'primary';
    default:
      return 'default';
  }
};

export const RecentActivities: React.FC<RecentActivitiesProps> = ({
  activities,
  maxItems = 10,
}) => {
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
      });
    } catch {
      return timestamp;
    }
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <ModernCard
      title="Activités récentes"
      subtitle="Dernières actions du système"
      variant="elevated"
    >
      {displayedActivities.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Aucune activité récente
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {displayedActivities.map((activity, index) => (
            <ListItem
              key={activity.id || index}
              sx={{
                borderBottom:
                  index < displayedActivities.length - 1
                    ? (theme) => `1px solid ${theme.palette.divider}`
                    : 'none',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                transition: 'background-color 0.2s',
              }}
            >
              <ListItemIcon>
                <Avatar
                  sx={{
                    bgcolor: `${getActivityColor(activity.type)}.main`,
                    width: 40,
                    height: 40,
                  }}
                >
                  {getActivityIcon(activity.type)}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {activity.action}
                    </Typography>
                    {activity.metadata?.urgent && (
                      <Chip label="Urgent" color="error" size="small" />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(activity.timestamp)}
                    </Typography>
                    {activity.user && (
                      <>
                        <Typography variant="caption" color="text.secondary">
                          •
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.user}
                        </Typography>
                      </>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </ModernCard>
  );
};

