import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Divider
} from '@mui/material';
import { Science } from '@mui/icons-material';
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
  const [principalLibelle, setPrincipalLibelle] = useState<string>('');
  const [secondaire, setSecondaire] = useState<string>('');

  useEffect(() => {
    if (diagnosticsDetail && diagnosticsDetail.length > 0) {
      const principal = diagnosticsDetail.find(d => d.principal);
      if (principal) {
        setPrincipalLibelle(principal.libelle || '');
      }
      const secondaires = diagnosticsDetail.filter(d => !d.principal).map(d => d.libelle).join(', ');
      setSecondaire(secondaires);
    }
  }, [diagnosticsDetail]);

  const updateDiagnostics = () => {
    const principal = principalLibelle ? {
      code: '',
      libelle: principalLibelle,
      type: 'Suspecté' as const,
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
    // Utiliser un debounce pour éviter les mises à jour trop fréquentes
    const timeoutId = setTimeout(() => {
      updateDiagnostics();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [principalLibelle, secondaire]);

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
          Diagnostic principal et diagnostics secondaires en texte libre.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Diagnostic Principal
            </Typography>
            <SpeechTextField
              fullWidth
              multiline
              rows={3}
              label="Diagnostic principal"
              value={principalLibelle}
              onChange={setPrincipalLibelle}
              placeholder="Saisissez le diagnostic principal"
              enableSpeech={true}
            />
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

