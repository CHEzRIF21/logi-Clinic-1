import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Save,
  LocalHospital,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { CPNService, VaccinationMaternelle } from '../../services/cpnService';

interface GestionVaccinationProps {
  dossierId: string;
  vaccination?: VaccinationMaternelle;
  onSave: (data: VaccinationMaternelle) => Promise<void>;
}

const GestionVaccination: React.FC<GestionVaccinationProps> = ({
  dossierId,
  vaccination,
  onSave,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<VaccinationMaternelle>>({
    dossier_obstetrical_id: dossierId,
    vat1_date: vaccination?.vat1_date || '',
    vat2_date: vaccination?.vat2_date || '',
    vat3_date: vaccination?.vat3_date || '',
    vat4_date: vaccination?.vat4_date || '',
    vat5_date: vaccination?.vat5_date || '',
    prochaine_dose: vaccination?.prochaine_dose || '',
    date_prochaine_dose: vaccination?.date_prochaine_dose || '',
    notes: vaccination?.notes || '',
  });

  useEffect(() => {
    calculerProchaineVaccination();
  }, [formData.vat1_date, formData.vat2_date, formData.vat3_date, formData.vat4_date, formData.vat5_date]);

  const calculerProchaineVaccination = () => {
    // Déterminer quelle est la prochaine dose à administrer
    if (!formData.vat1_date) {
      setFormData(prev => ({
        ...prev,
        prochaine_dose: 'VAT1',
        date_prochaine_dose: '',
      }));
    } else if (!formData.vat2_date) {
      // VAT2 : 4 semaines après VAT1
      const vat1 = new Date(formData.vat1_date);
      vat1.setDate(vat1.getDate() + 28);
      setFormData(prev => ({
        ...prev,
        prochaine_dose: 'VAT2',
        date_prochaine_dose: vat1.toISOString().split('T')[0],
      }));
    } else if (!formData.vat3_date) {
      // VAT3 : 6 mois après VAT2
      const vat2 = new Date(formData.vat2_date);
      vat2.setMonth(vat2.getMonth() + 6);
      setFormData(prev => ({
        ...prev,
        prochaine_dose: 'VAT3',
        date_prochaine_dose: vat2.toISOString().split('T')[0],
      }));
    } else if (!formData.vat4_date) {
      // VAT4 : 1 an après VAT3
      const vat3 = new Date(formData.vat3_date);
      vat3.setFullYear(vat3.getFullYear() + 1);
      setFormData(prev => ({
        ...prev,
        prochaine_dose: 'VAT4',
        date_prochaine_dose: vat3.toISOString().split('T')[0],
      }));
    } else if (!formData.vat5_date) {
      // VAT5 : 1 an après VAT4
      const vat4 = new Date(formData.vat4_date);
      vat4.setFullYear(vat4.getFullYear() + 1);
      setFormData(prev => ({
        ...prev,
        prochaine_dose: 'VAT5',
        date_prochaine_dose: vat4.toISOString().split('T')[0],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        prochaine_dose: 'Complet',
        date_prochaine_dose: '',
      }));
    }
  };

  const handleChange = (field: keyof VaccinationMaternelle, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(formData as VaccinationMaternelle);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getVaccinationStatus = () => {
    const doses = [
      formData.vat1_date,
      formData.vat2_date,
      formData.vat3_date,
      formData.vat4_date,
      formData.vat5_date,
    ];
    const completedDoses = doses.filter(d => d).length;
    return {
      completed: completedDoses,
      total: 5,
      percentage: (completedDoses / 5) * 100,
    };
  };

  const status = getVaccinationStatus();

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
              Vaccination Maternelle (VAT - Vaccin Anti-Tétanique)
            </Typography>
            <Chip
              label={`${status.completed}/5 doses complétées`}
              color={status.completed >= 3 ? 'success' : 'warning'}
              icon={status.completed >= 5 ? <CheckCircle /> : <Schedule />}
            />
          </Box>

          {formData.prochaine_dose && formData.prochaine_dose !== 'Complet' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Prochaine dose recommandée:</strong> {formData.prochaine_dose}
                {formData.date_prochaine_dose && ` le ${new Date(formData.date_prochaine_dose).toLocaleDateString()}`}
              </Typography>
            </Alert>
          )}

          {formData.prochaine_dose === 'Complet' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>✅ Vaccination maternelle complète</strong> - Toutes les doses VAT ont été administrées.
              </Typography>
            </Alert>
          )}

          {/* Tableau des vaccinations */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Dose</strong></TableCell>
                  <TableCell><strong>Date d'administration</strong></TableCell>
                  <TableCell><strong>Intervalle</strong></TableCell>
                  <TableCell><strong>Statut</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><strong>VAT 1</strong></TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      value={formData.vat1_date}
                      onChange={(e) => handleChange('vat1_date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>Dès le 1er contact</TableCell>
                  <TableCell>
                    {formData.vat1_date ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : (
                      <Chip label="À faire" size="small" color="warning" />
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell><strong>VAT 2</strong></TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      value={formData.vat2_date}
                      onChange={(e) => handleChange('vat2_date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      fullWidth
                      disabled={!formData.vat1_date}
                    />
                  </TableCell>
                  <TableCell>4 semaines après VAT1</TableCell>
                  <TableCell>
                    {formData.vat2_date ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : formData.vat1_date ? (
                      <Chip label="En attente" size="small" color="info" />
                    ) : (
                      <Chip label="VAT1 requis" size="small" />
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell><strong>VAT 3</strong></TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      value={formData.vat3_date}
                      onChange={(e) => handleChange('vat3_date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      fullWidth
                      disabled={!formData.vat2_date}
                    />
                  </TableCell>
                  <TableCell>6 mois après VAT2</TableCell>
                  <TableCell>
                    {formData.vat3_date ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : formData.vat2_date ? (
                      <Chip label="En attente" size="small" color="info" />
                    ) : (
                      <Chip label="VAT2 requis" size="small" />
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell><strong>VAT 4</strong></TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      value={formData.vat4_date}
                      onChange={(e) => handleChange('vat4_date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      fullWidth
                      disabled={!formData.vat3_date}
                    />
                  </TableCell>
                  <TableCell>1 an après VAT3</TableCell>
                  <TableCell>
                    {formData.vat4_date ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : formData.vat3_date ? (
                      <Chip label="En attente" size="small" color="info" />
                    ) : (
                      <Chip label="VAT3 requis" size="small" />
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell><strong>VAT 5</strong></TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      value={formData.vat5_date}
                      onChange={(e) => handleChange('vat5_date', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      fullWidth
                      disabled={!formData.vat4_date}
                    />
                  </TableCell>
                  <TableCell>1 an après VAT4</TableCell>
                  <TableCell>
                    {formData.vat5_date ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : formData.vat4_date ? (
                      <Chip label="En attente" size="small" color="info" />
                    ) : (
                      <Chip label="VAT4 requis" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <TextField
            fullWidth
            label="Notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              startIcon={<Save />}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GestionVaccination;

