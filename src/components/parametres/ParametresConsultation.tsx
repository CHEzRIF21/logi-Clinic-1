import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { MedicalServices, Payment } from '@mui/icons-material';
import { ParametresDiagnostics } from './sections/ParametresDiagnostics';
import { ParametresExamens } from './sections/ParametresExamens';
import { ParametresMedicaments } from './sections/ParametresMedicaments';
import BillingSettings from '../settings/BillingSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const ParametresConsultation: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <MedicalServices fontSize="large" color="primary" />
        <Typography variant="h5">Paramétrage des Consultations</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configurez les paramètres pour le module de consultations médicales : diagnostics, examens et médicaments.
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Diagnostics" />
          <Tab label="Examens" />
          <Tab label="Médicaments" />
          <Tab icon={<Payment />} label="Facturation" iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <ParametresDiagnostics />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ParametresExamens />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ParametresMedicaments />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <BillingSettings />
      </TabPanel>
    </Box>
  );
};

