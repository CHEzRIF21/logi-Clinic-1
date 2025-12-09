import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  TextField,
  Alert,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  ExpandMore,
  Person,
  Email,
  Phone,
  Business,
  Security,
  History,
  Notes,
} from '@mui/icons-material';
import { AccountRecoveryRequest, RecoveryRequestStatus, RequestedDataType } from '../../types/accountRecovery';

interface RecoveryRequestDetailsProps {
  open: boolean;
  onClose: () => void;
  request: AccountRecoveryRequest;
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
}

const RecoveryRequestDetails: React.FC<RecoveryRequestDetailsProps> = ({
  open,
  onClose,
  request,
  onApprove,
  onReject,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState(request.adminNotes || '');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError('');
      await onApprove(request.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'approbation');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Veuillez fournir une raison de rejet');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onReject(request.id, rejectionReason);
      setShowRejectDialog(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du rejet');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: RecoveryRequestStatus) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'verified':
        return 'info';
      case 'approved':
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Détails de la demande</Typography>
            <Chip
              label={
                request.status === 'pending' ? 'En attente' :
                request.status === 'verified' ? 'Vérifiée' :
                request.status === 'approved' ? 'Approuvée' :
                request.status === 'completed' ? 'Complétée' :
                'Rejetée'
              }
              color={getStatusColor(request.status) as any}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Informations utilisateur */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person /> Informations utilisateur
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Nom</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {request.nom} {request.prenom}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" /> {request.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Téléphone</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone fontSize="small" /> {request.telephone}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Code clinique</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Business fontSize="small" /> {request.clinicCode || 'Non spécifié'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Données demandées */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Données à récupérer
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {request.requestedData.map((data) => (
                    <Chip
                      key={data}
                      label={
                        data === 'username' ? 'Nom d\'utilisateur' :
                        data === 'clinicCode' ? 'Code clinique' :
                        'Mot de passe'
                      }
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* Questions de sécurité */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security /> Questions de sécurité
                </Typography>
                <List>
                  {request.securityQuestions.map((q, index) => (
                    <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Question {index + 1}:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                        {q.question}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Réponse: [Vérifiée par l'admin]
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Notes admin */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Notes /> Notes administrateur
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ajouter des notes pour cette demande..."
                />
              </Paper>
            </Grid>

            {/* Historique */}
            {request.auditLog && request.auditLog.length > 0 && (
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <History /> Historique des actions
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {request.auditLog.map((log, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={log.action}
                            secondary={`${new Date(log.timestamp).toLocaleString('fr-FR')} - ${log.notes || ''}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            )}

            {/* Raison de rejet */}
            {request.status === 'rejected' && request.rejectionReason && (
              <Grid item xs={12}>
                <Alert severity="error">
                  <Typography variant="subtitle2">Raison du rejet:</Typography>
                  <Typography variant="body2">{request.rejectionReason}</Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fermer</Button>
          {request.status === 'pending' || request.status === 'verified' ? (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => setShowRejectDialog(true)}
                disabled={loading}
              >
                Rejeter
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={handleApprove}
                disabled={loading}
              >
                Approuver
              </Button>
            </>
          ) : null}
        </DialogActions>
      </Dialog>

      {/* Dialog de rejet */}
      <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)}>
        <DialogTitle>Rejeter la demande</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Veuillez fournir une raison pour le rejet de cette demande :
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Raison du rejet..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={loading || !rejectionReason.trim()}
          >
            Confirmer le rejet
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecoveryRequestDetails;

