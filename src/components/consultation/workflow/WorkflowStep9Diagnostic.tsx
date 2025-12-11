import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Autocomplete,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { Science } from '@mui/icons-material';
import { DiagnosticService, DiagnosticCode } from '../../../services/diagnosticService';
import { SpeechTextField } from '../../common/SpeechTextField';

interface WorkflowStep9DiagnosticProps {
  diagnostics: string[];
  diagnosticsDetail?: any[];
  onDiagnosticsChange: (diagnostics: string[], diagnosticsDetail: any[]) => void;
}

export const WorkflowStep9Diagnostic: React.FC<WorkflowStep9DiagnosticProps> = ({
  diagnostics = [],
  diagnosticsDetail = [],
  onDiagnosticsChange
}) => {
  const [principalCode, setPrincipalCode] = useState<string>('');
  const [principalLibelle, setPrincipalLibelle] = useState<string>('');
  const [principalType, setPrincipalType] = useState<'Suspecté' | 'Confirmé'>('Suspecté');
  const [secondaire, setSecondaire] = useState<string>('');
  const [searchResults, setSearchResults] = useState<DiagnosticCode[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (diagnosticsDetail && diagnosticsDetail.length > 0) {
      const principal = diagnosticsDetail.find(d => d.principal);
      if (principal) {
        setPrincipalCode(principal.code || '');
        setPrincipalLibelle(principal.libelle || '');
        setPrincipalType(principal.type || 'Suspecté');
      }
      const secondaires = diagnosticsDetail.filter(d => !d.principal).map(d => d.libelle).join(', ');
      setSecondaire(secondaires);
    }
  }, [diagnosticsDetail]);

  useEffect(() => {
    const searchDiagnostics = async () => {
      if (searchQuery.length > 2) {
        try {
          const results = await DiagnosticService.searchCIM10(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Erreur lors de la recherche:', error);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchDiagnostics, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handlePrincipalSelect = (code: DiagnosticCode | null) => {
    if (code) {
      setPrincipalCode(code.code);
      setPrincipalLibelle(code.libelle);
      updateDiagnostics();
    }
  };

  const updateDiagnostics = () => {
    const principal = principalCode ? {
      code: principalCode,
      libelle: principalLibelle,
      type: principalType,
      principal: true
    } : null;

    const secondairesList = secondaire.split(',').map(s => s.trim()).filter(s => s).map(libelle => ({
      libelle,
      type: 'Suspecté' as const,
      principal: false
    }));

    const detail = [];
    if (principal) detail.push(principal);
    detail.push(...secondairesList);

    const diagnosticsList = detail.map(d => d.libelle);

    onDiagnosticsChange(diagnosticsList, detail);
  };

  useEffect(() => {
    updateDiagnostics();
  }, [principalCode, principalLibelle, principalType, secondaire]);

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Science color="primary" />
          <Typography variant="h6">
            Étape 9 — Diagnostic
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          Diagnostic principal avec code CIM-10 et diagnostic secondaire en texte libre.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Diagnostic Principal
            </Typography>
            <Autocomplete
              options={searchResults}
              getOptionLabel={(option) => `${option.code} - ${option.libelle}`}
              value={searchResults.find(r => r.code === principalCode) || null}
              onChange={(_, newValue) => handlePrincipalSelect(newValue)}
              onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
              renderInput={(params) => (
                <SpeechTextField
                  {...params}
                  label="Rechercher un code CIM-10"
                  placeholder="Tapez pour rechercher..."
                  enableSpeech={true}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Chip label={option.code} size="small" sx={{ mr: 1 }} />
                    {option.libelle}
                  </Box>
                </Box>
              )}
            />
            {principalCode && (
              <Box sx={{ mt: 2 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Type de diagnostic</FormLabel>
                  <RadioGroup
                    row
                    value={principalType}
                    onChange={(e) => setPrincipalType(e.target.value as 'Suspecté' | 'Confirmé')}
                  >
                    <FormControlLabel value="Suspecté" control={<Radio />} label="Suspecté" />
                    <FormControlLabel value="Confirmé" control={<Radio />} label="Confirmé" />
                  </RadioGroup>
                </FormControl>
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Diagnostics Secondaires (texte libre)
            </Typography>
            <SpeechTextField
              fullWidth
              multiline
              rows={3}
              label="Diagnostics secondaires"
              value={secondaire}
              onChange={setSecondaire}
              placeholder="Séparez les diagnostics par des virgules"
              enableSpeech={true}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

