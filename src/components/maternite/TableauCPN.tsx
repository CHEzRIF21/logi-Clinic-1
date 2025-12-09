import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
} from '@mui/material';
import {
  Add,
  Visibility,
  Edit,
  CheckCircle,
  Warning,
  Schedule,
} from '@mui/icons-material';
import { CPNService, ConsultationPrenatale } from '../../services/cpnService';
import FormulaireCPN from './FormulaireCPN';

interface TableauCPNProps {
  dossierId: string;
}

const TableauCPN: React.FC<TableauCPNProps> = ({ dossierId }) => {
  const [cpns, setCpns] = useState<ConsultationPrenatale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [selectedCPN, setSelectedCPN] = useState<ConsultationPrenatale | null>(null);

  useEffect(() => {
    loadCPNs();
  }, [dossierId]);

  const loadCPNs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CPNService.getAllCPN(dossierId);
      setCpns(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCPN = () => {
    setSelectedCPN(null);
    setOpenFormDialog(true);
  };

  const handleEditCPN = (cpn: ConsultationPrenatale) => {
    setSelectedCPN(cpn);
    setOpenFormDialog(true);
  };

  const handleSaveCPN = async (cpnData: ConsultationPrenatale) => {
    try {
      if (selectedCPN?.id) {
        await CPNService.updateCPN(selectedCPN.id, cpnData);
      } else {
        await CPNService.createCPN(cpnData);
      }
      await loadCPNs();
      setOpenFormDialog(false);
      setSelectedCPN(null);
    } catch (err: any) {
      throw err;
    }
  };

  const getStatutColor = (statut?: string) => {
    switch (statut) {
      case 'terminee': return 'success';
      case 'manquee': return 'error';
      case 'programmee': return 'info';
      default: return 'default';
    }
  };

  const cpnObligatoires = {
    cpn1: cpns.some(c => c.numero_cpn === 1 && c.statut === 'terminee'),
    cpn2: cpns.some(c => c.numero_cpn === 2 && c.statut === 'terminee'),
    cpn3: cpns.some(c => c.numero_cpn === 3 && c.statut === 'terminee'),
    cpn4: cpns.some(c => c.numero_cpn === 4 && c.statut === 'terminee'),
  };

  const toutesCompletes = cpnObligatoires.cpn1 && cpnObligatoires.cpn2 && cpnObligatoires.cpn3 && cpnObligatoires.cpn4;

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Consultations Prénatales (CPN)
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddCPN}
            >
              Nouvelle CPN
            </Button>
          </Box>

          {/* Indicateur CPN obligatoires */}
          <Alert
            severity={toutesCompletes ? 'success' : 'warning'}
            sx={{ mb: 2 }}
            icon={toutesCompletes ? <CheckCircle /> : <Warning />}
          >
            <Typography variant="subtitle2">
              CPN Obligatoires (OMS) : {toutesCompletes ? '✅ Complètes' : '⚠️ Incomplètes'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                label="CPN1"
                size="small"
                color={cpnObligatoires.cpn1 ? 'success' : 'error'}
                icon={cpnObligatoires.cpn1 ? <CheckCircle /> : <Schedule />}
              />
              <Chip
                label="CPN2"
                size="small"
                color={cpnObligatoires.cpn2 ? 'success' : 'error'}
                icon={cpnObligatoires.cpn2 ? <CheckCircle /> : <Schedule />}
              />
              <Chip
                label="CPN3"
                size="small"
                color={cpnObligatoires.cpn3 ? 'success' : 'error'}
                icon={cpnObligatoires.cpn3 ? <CheckCircle /> : <Schedule />}
              />
              <Chip
                label="CPN4"
                size="small"
                color={cpnObligatoires.cpn4 ? 'success' : 'error'}
                icon={cpnObligatoires.cpn4 ? <CheckCircle /> : <Schedule />}
              />
            </Box>
          </Alert>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>CPN</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Trimestre</TableCell>
                    <TableCell>Terme (SA)</TableCell>
                    <TableCell>Poids</TableCell>
                    <TableCell>TA</TableCell>
                    <TableCell>Tests</TableCell>
                    <TableCell>Prochain RDV</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cpns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Aucune consultation enregistrée
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cpns.map((cpn) => (
                      <TableRow key={cpn.id}>
                        <TableCell><strong>CPN{cpn.numero_cpn}</strong></TableCell>
                        <TableCell>
                          {cpn.date_consultation ? new Date(cpn.date_consultation).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>T{cpn.trimestre || '-'}</TableCell>
                        <TableCell>{cpn.terme_semaines || '-'} SA</TableCell>
                        <TableCell>{cpn.poids ? `${cpn.poids} kg` : '-'}</TableCell>
                        <TableCell>{cpn.tension_arterielle || '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {cpn.test_vih && (
                              <Chip
                                label={`VIH: ${cpn.test_vih}`}
                                size="small"
                                color={cpn.test_vih === 'Positif' ? 'error' : 'success'}
                              />
                            )}
                            {cpn.test_syphilis && (
                              <Chip
                                label={`Syph: ${cpn.test_syphilis}`}
                                size="small"
                                color={cpn.test_syphilis === 'Positif' ? 'error' : 'success'}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {cpn.prochain_rdv ? new Date(cpn.prochain_rdv).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={cpn.statut || 'en_cours'}
                            size="small"
                            color={getStatutColor(cpn.statut)}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditCPN(cpn)}
                          >
                            <Edit />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog Formulaire CPN */}
      <Dialog
        open={openFormDialog}
        onClose={() => setOpenFormDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <FormulaireCPN
          dossierId={dossierId}
          cpn={selectedCPN || undefined}
          onSave={handleSaveCPN}
          onCancel={() => setOpenFormDialog(false)}
        />
      </Dialog>
    </Box>
  );
};

export default TableauCPN;

