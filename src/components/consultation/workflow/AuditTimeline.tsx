import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  History,
  Search,
  FilterList,
  Download,
  Print,
  Refresh,
} from '@mui/icons-material';
import { AuditService, AuditLogEntry } from '../../../services/auditService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AuditTimelineProps {
  consultId: string;
  onExportPDF?: () => void;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({
  consultId,
  onExportPDF,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    loadAuditLog();
  }, [consultId]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterAction, filterRole]);

  const loadAuditLog = async () => {
    setLoading(true);
    try {
      const auditLogs = await AuditService.getAuditLog(consultId);
      setLogs(auditLogs);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filtre par terme de recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.actor_name?.toLowerCase().includes(term) ||
        log.actor_role?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(term)
      );
    }

    // Filtre par action
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    // Filtre par rôle
    if (filterRole !== 'all') {
      filtered = filtered.filter(log => log.actor_role === filterRole);
    }

    setFilteredLogs(filtered);
  };

  const getActionColor = (action: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (action.includes('create') || action.includes('add')) return 'success';
    if (action.includes('update') || action.includes('modify')) return 'info';
    if (action.includes('delete') || action.includes('remove')) return 'error';
    if (action.includes('close') || action.includes('complete')) return 'primary';
    return 'default';
  };

  const formatDetails = (details: any): string => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    try {
      return JSON.stringify(details, null, 2).substring(0, 200);
    } catch {
      return String(details);
    }
  };

  const uniqueActions = Array.from(new Set(logs.map(log => log.action))).sort();
  const uniqueRoles = Array.from(new Set(logs.map(log => log.actor_role))).sort();

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <History color="primary" fontSize="large" />
            <Box>
              <Typography variant="h5" gutterBottom>
                Journal de Traçabilité
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Qui / Quoi / Quand - {logs.length} action(s) enregistrée(s)
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <IconButton onClick={loadAuditLog} title="Actualiser">
              <Refresh />
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={onExportPDF}
            >
              Exporter PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={() => window.print()}
            >
              Imprimer
            </Button>
          </Box>
        </Box>

        {/* Filtres */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              label="Action"
            >
              <MenuItem value="all">Toutes</MenuItem>
              {uniqueActions.map(action => (
                <MenuItem key={action} value={action}>
                  {action}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Rôle</InputLabel>
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              label="Rôle"
            >
              <MenuItem value="all">Tous</MenuItem>
              {uniqueRoles.map(role => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : filteredLogs.length === 0 ? (
          <Alert severity="info">
            Aucune action enregistrée dans le journal d'audit.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Quand</strong></TableCell>
                  <TableCell><strong>Qui</strong></TableCell>
                  <TableCell><strong>Rôle</strong></TableCell>
                  <TableCell><strong>Quoi</strong></TableCell>
                  <TableCell><strong>Détails</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.audit_id}>
                    <TableCell>
                      {log.timestamp
                        ? format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {log.actor_name || 'Inconnu'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.actor_role}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color={getActionColor(log.action)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          whiteSpace: 'pre-wrap',
                          maxWidth: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={formatDetails(log.details)}
                      >
                        {formatDetails(log.details)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {filteredLogs.length > 0 && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Affichage de {filteredLogs.length} action(s) sur {logs.length} total
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

