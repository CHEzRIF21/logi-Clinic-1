import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField,
} from '@mui/material';
import {
  Receipt,
  CheckCircle,
  Person,
  Add,
} from '@mui/icons-material';
import { FacturationService, TicketFacturation } from '../../services/facturationService';
import { supabase, Patient } from '../../services/supabase';
import CreationFacture from './CreationFacture';

const GestionTickets: React.FC = () => {
  const [tickets, setTickets] = useState<TicketFacturation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSelectionne, setPatientSelectionne] = useState<Patient | null>(null);
  const [ticketsSelectionnes, setTicketsSelectionnes] = useState<string[]>([]);
  const [openCreationFacture, setOpenCreationFacture] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    chargerPatients();
    chargerTickets();
  }, []);

  useEffect(() => {
    if (patientSelectionne) {
      chargerTickets(patientSelectionne.id);
    } else {
      chargerTickets();
    }
  }, [patientSelectionne]);

  const chargerPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('nom');
      if (error) throw error;
      setPatients(data || []);
    } catch (err: any) {
      setError('Erreur lors du chargement des patients: ' + err.message);
    }
  };

  const chargerTickets = async (patientId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await FacturationService.getTicketsEnAttente(patientId);
      setTickets(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des tickets: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectionTicket = (ticketId: string) => {
    setTicketsSelectionnes(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const toggleSelectionTous = () => {
    if (ticketsSelectionnes.length === tickets.length) {
      setTicketsSelectionnes([]);
    } else {
      setTicketsSelectionnes(tickets.map(t => t.id));
    }
  };

  const facturerTickets = async () => {
    if (ticketsSelectionnes.length === 0) {
      setError('Veuillez sélectionner au moins un ticket');
      return;
    }

    setOpenCreationFacture(true);
  };

  const getServiceIcon = (service: string) => {
    const icons: Record<string, string> = {
      consultation: '🏥',
      pharmacie: '💊',
      laboratoire: '🔬',
      maternite: '🤰',
      vaccination: '💉',
    };
    return icons[service] || '📋';
  };

  const getServiceColor = (service: string) => {
    const colors: Record<string, any> = {
      consultation: 'primary',
      pharmacie: 'success',
      laboratoire: 'info',
      maternite: 'secondary',
      vaccination: 'warning',
    };
    return colors[service] || 'default';
  };

  const totalTicketsSelectionnes = tickets
    .filter(t => ticketsSelectionnes.includes(t.id))
    .reduce((sum, t) => sum + t.montant, 0);

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h5" display="flex" alignItems="center" gap={1}>
              <Receipt /> Tickets en Attente de Facturation
            </Typography>
            <Box display="flex" gap={2}>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) => `${option.nom} ${option.prenom} - ${option.telephone}`}
                value={patientSelectionne}
                onChange={(_, value) => setPatientSelectionne(value)}
                sx={{ width: 300 }}
                renderInput={(params) => (
                  <TextField {...params} label="Filtrer par patient" size="small" />
                )}
              />
              {ticketsSelectionnes.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={facturerTickets}
                >
                  Facturer ({ticketsSelectionnes.length})
                </Button>
              )}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {ticketsSelectionnes.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {ticketsSelectionnes.length} ticket(s) sélectionné(s) - 
              Total: <strong>{totalTicketsSelectionnes.toLocaleString()} FCFA</strong>
            </Alert>
          )}

          {tickets.length === 0 ? (
            <Alert severity="info">
              Aucun ticket en attente de facturation.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={ticketsSelectionnes.length === tickets.length && tickets.length > 0}
                        indeterminate={ticketsSelectionnes.length > 0 && ticketsSelectionnes.length < tickets.length}
                        onChange={toggleSelectionTous}
                      />
                    </TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Type d'Acte</TableCell>
                    <TableCell align="right">Montant</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((ticket) => {
                    const patient = patients.find(p => p.id === ticket.patient_id);
                    return (
                      <TableRow key={ticket.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={ticketsSelectionnes.includes(ticket.id)}
                            onChange={() => toggleSelectionTicket(ticket.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {patient ? (
                            <Box display="flex" alignItems="center" gap={1}>
                            <Person fontSize="small" />
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {patient.nom} {patient.prenom}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {patient.telephone}
                              </Typography>
                            </Box>
                          </Box>
                          ) : (
                            <Typography variant="body2">Patient inconnu</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.service_origine}
                            color={getServiceColor(ticket.service_origine) as any}
                            size="small"
                            icon={<span>{getServiceIcon(ticket.service_origine)}</span>}
                          />
                        </TableCell>
                        <TableCell>{ticket.type_acte}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {ticket.montant.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                          {new Date(ticket.date_creation).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.statut}
                            color="warning"
                            size="small"
                            icon={<CheckCircle />}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour créer une facture à partir des tickets sélectionnés */}
      <Dialog
        open={openCreationFacture}
        onClose={() => setOpenCreationFacture(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Créer une Facture</DialogTitle>
        <DialogContent>
          {ticketsSelectionnes.length > 0 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                {ticketsSelectionnes.length} ticket(s) seront facturés pour un total de {totalTicketsSelectionnes.toLocaleString()} FCFA
              </Alert>
              <CreationFacture
                patientId={tickets.find(t => ticketsSelectionnes.includes(t.id))?.patient_id}
                onFactureCree={() => {
                  setOpenCreationFacture(false);
                  setTicketsSelectionnes([]);
                  chargerTickets();
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreationFacture(false)}>Annuler</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionTickets;

