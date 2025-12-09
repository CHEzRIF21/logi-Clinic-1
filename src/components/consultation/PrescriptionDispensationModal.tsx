import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Medication,
  CheckCircle,
  Close,
  LocalPharmacy,
} from '@mui/icons-material';
import { Prescription, PrescriptionLine } from '../../services/consultationApiService';
import { StockService } from '../../services/stockService';

interface PrescriptionDispensationModalProps {
  open: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  onDispense: () => Promise<void>;
  userId: string;
}

interface DispensationLine {
  lineId: string;
  medicamentId: string;
  nomMedicament: string;
  quantitePrescrite: number;
  quantiteDispensee: number;
  quantiteRestante: number;
  lotId: string;
  prixUnitaire: number;
}

export const PrescriptionDispensationModal: React.FC<PrescriptionDispensationModalProps> = ({
  open,
  onClose,
  prescription,
  onDispense,
  userId,
}) => {
  const [dispensationLines, setDispensationLines] = useState<DispensationLine[]>([]);
  const [lots, setLots] = useState<Record<string, Array<{ id: string; numero_lot: string; quantite_disponible: number; prix_unitaire: number }>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && prescription) {
      loadDispensationData();
    }
  }, [open, prescription]);

  const loadDispensationData = async () => {
    if (!prescription || !prescription.lines) return;

    setLoading(true);
    try {
      // Préparer les lignes de dispensation
      const lines: DispensationLine[] = prescription.lines.map((line) => ({
        lineId: line.id,
        medicamentId: line.medicament_id || '',
        nomMedicament: line.nom_medicament,
        quantitePrescrite: line.quantite_totale,
        quantiteDispensee: line.quantite_dispensee || 0,
        quantiteRestante: line.quantite_totale - (line.quantite_dispensee || 0),
        lotId: '',
        prixUnitaire: 0,
      }));

      setDispensationLines(lines);

      // Charger les lots disponibles pour chaque médicament
      const lotsData: Record<string, Array<{ id: string; numero_lot: string; quantite_disponible: number; prix_unitaire: number }>> = {};
      
      for (const line of prescription.lines) {
        if (line.medicament_id) {
          try {
            // Récupérer les lots disponibles depuis Supabase
            const { supabase } = await import('../../services/supabase');
            const { data: lotsMedicament } = await supabase
              .from('lots')
              .select('id, numero_lot, quantite_disponible, prix_unitaire')
              .eq('medicament_id', line.medicament_id)
              .eq('magasin', 'detail')
              .gt('quantite_disponible', 0)
              .order('date_expiration', { ascending: true }); // FEFO

            if (lotsMedicament) {
              lotsData[line.medicament_id] = lotsMedicament.map((lot: any) => ({
                id: lot.id,
                numero_lot: lot.numero_lot,
                quantite_disponible: lot.quantite_disponible,
                prix_unitaire: lot.prix_unitaire || 0,
              }));
            }
          } catch (err) {
            console.error(`Erreur lors du chargement des lots pour ${line.medicament_id}:`, err);
          }
        }
      }

      setLots(lotsData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleLotChange = (lineId: string, lotId: string) => {
    setDispensationLines((prev) =>
      prev.map((line) => {
        if (line.lineId === lineId) {
          const lot = lots[line.medicamentId]?.find((l) => l.id === lotId);
          return {
            ...line,
            lotId,
            prixUnitaire: lot?.prix_unitaire || 0,
          };
        }
        return line;
      })
    );
  };

  const handleQuantiteChange = (lineId: string, quantite: number) => {
    setDispensationLines((prev) =>
      prev.map((line) => {
        if (line.lineId === lineId) {
          const quantiteMax = Math.min(quantite, line.quantiteRestante);
          const lot = lots[line.medicamentId]?.find((l) => l.id === line.lotId);
          const quantiteDisponible = lot?.quantite_disponible || 0;
          const quantiteFinale = Math.min(quantiteMax, quantiteDisponible);
          
          return {
            ...line,
            quantiteRestante: line.quantitePrescrite - quantiteFinale,
          };
        }
        return line;
      })
    );
  };

  const handleDispense = async () => {
    if (!prescription) return;

    setLoading(true);
    setError(null);

    try {
      // Filtrer les lignes à dispenser (avec lot sélectionné et quantité > 0)
      const linesToDispense = dispensationLines.filter(
        (line) => line.lotId && line.quantiteRestante < line.quantitePrescrite
      );

      if (linesToDispense.length === 0) {
        setError('Veuillez sélectionner au moins un lot et une quantité à dispenser');
        setLoading(false);
        return;
      }

      // Préparer les données pour la dispensation
      const dispensationData = linesToDispense.map((line) => ({
        lineId: line.lineId,
        medicamentId: line.medicamentId,
        lotId: line.lotId,
        quantite: line.quantitePrescrite - line.quantiteRestante,
        prixUnitaire: line.prixUnitaire,
      }));

      // Appeler le service de dispensation
      const { ConsultationService } = await import('../../services/consultationService');
      await ConsultationService.dispenserPrescription(
        prescription.id,
        dispensationData,
        userId
      );

      await onDispense();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la dispensation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDispensationLines([]);
    setLots({});
    setError(null);
    onClose();
  };

  if (!prescription) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <LocalPharmacy />
            <Typography variant="h6">Dispensation - {prescription.numero_prescription}</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Médicament</TableCell>
                <TableCell align="right">Qté Prescrite</TableCell>
                <TableCell align="right">Qté Déjà Dispensée</TableCell>
                <TableCell align="right">Qté Restante</TableCell>
                <TableCell>Lot</TableCell>
                <TableCell align="right">Qté Disponible</TableCell>
                <TableCell align="right">Prix Unitaire</TableCell>
                <TableCell align="right">Qté à Dispenser</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prescription.lines?.map((line) => {
                const dispLine = dispensationLines.find((dl) => dl.lineId === line.id);
                const availableLots = lots[line.medicament_id || ''] || [];
                const quantiteRestante = dispLine?.quantiteRestante || line.quantite_totale - (line.quantite_dispensee || 0);

                return (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {line.nom_medicament}
                      </Typography>
                      {line.posologie && (
                        <Typography variant="caption" color="text.secondary">
                          {line.posologie}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{line.quantite_totale}</TableCell>
                    <TableCell align="right">{line.quantite_dispensee || 0}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={quantiteRestante}
                        color={quantiteRestante > 0 ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {availableLots.length > 0 ? (
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <Select
                            value={dispLine?.lotId || ''}
                            onChange={(e) => handleLotChange(line.id, e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Sélectionner un lot</em>
                            </MenuItem>
                            {availableLots.map((lot) => (
                              <MenuItem key={lot.id} value={lot.id}>
                                {lot.numero_lot} ({lot.quantite_disponible} dispo.)
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="caption" color="error">
                          Aucun lot disponible
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {dispLine?.lotId
                        ? availableLots.find((l) => l.id === dispLine.lotId)?.quantite_disponible || 0
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {dispLine?.prixUnitaire ? `${dispLine.prixUnitaire} FCFA` : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {quantiteRestante > 0 && dispLine?.lotId ? (
                        <TextField
                          type="number"
                          size="small"
                          value={line.quantite_totale - (dispLine?.quantiteRestante || quantiteRestante)}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 0;
                            handleQuantiteChange(line.id, qty);
                          }}
                          inputProps={{
                            min: 0,
                            max: Math.min(
                              quantiteRestante,
                              availableLots.find((l) => l.id === dispLine?.lotId)?.quantite_disponible || 0
                            ),
                          }}
                          sx={{ width: 80 }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleDispense}
          disabled={loading || dispensationLines.filter((l) => l.lotId && l.quantiteRestante < l.quantitePrescrite).length === 0}
          startIcon={<CheckCircle />}
        >
          {loading ? 'Dispensation...' : 'Dispenser'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

