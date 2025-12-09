import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Block,
} from '@mui/icons-material';
import { AlerteStock } from '../../types/stock';

interface AlerteStockProps {
  alertes: AlerteStock[];
  onResoudreAlerte: (alerteId: string) => void;
  onIgnorerAlerte: (alerteId: string) => void;
}

const AlerteStockComponent: React.FC<AlerteStockProps> = ({
  alertes,
  onResoudreAlerte,
  onIgnorerAlerte,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const getAlerteIcon = (niveau: string) => {
    switch (niveau) {
      case 'critique':
        return <Error color="error" />;
      case 'avertissement':
        return <Warning color="warning" />;
      case 'information':
        return <Info color="info" />;
      default:
        return <Info color="info" />;
    }
  };

  const getAlerteColor = (niveau: string) => {
    switch (niveau) {
      case 'critique':
        return 'error';
      case 'avertissement':
        return 'warning';
      case 'information':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rupture':
        return 'Rupture';
      case 'seuil_bas':
        return 'Seuil bas';
      case 'peremption':
        return 'Péremption';
      case 'stock_surplus':
        return 'Surplus';
      default:
        return type;
    }
  };

  const alertesActives = alertes.filter(alerte => alerte.statut === 'active');
  const alertesCritiques = alertesActives.filter(alerte => alerte.niveau === 'critique');

  if (alertesActives.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center">
            <CheckCircle color="success" sx={{ mr: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Aucune alerte active
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            {alertesCritiques.length > 0 ? (
              <Error color="error" sx={{ mr: 1 }} />
            ) : (
              <Warning color="warning" sx={{ mr: 1 }} />
            )}
            <Typography variant="h6">
              Alertes de Stock ({alertesActives.length})
            </Typography>
            {alertesCritiques.length > 0 && (
              <Chip
                label={`${alertesCritiques.length} critique(s)`}
                color="error"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <List dense>
            {alertesActives.map((alerte) => (
              <ListItem
                key={alerte.id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: alerte.niveau === 'critique' ? 'error.light' : 'background.paper',
                }}
              >
                <ListItemIcon>
                  {getAlerteIcon(alerte.niveau)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {alerte.message}
                      </Typography>
                      <Chip
                        label={getTypeLabel(alerte.type)}
                        color={getAlerteColor(alerte.niveau) as any}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Créée le {alerte.dateCreation.toLocaleDateString('fr-FR')}
                    </Typography>
                  }
                />
                <Box display="flex" gap={1}>
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => onResoudreAlerte(alerte.id)}
                    title="Marquer comme résolue"
                  >
                    <CheckCircle />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() => onIgnorerAlerte(alerte.id)}
                    title="Ignorer l'alerte"
                  >
                    <Block />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AlerteStockComponent;
