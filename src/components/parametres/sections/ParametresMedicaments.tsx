import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { Medication } from '@mui/icons-material';
import { ParametresMedicamentsListe } from './medicaments/ParametresMedicamentsListe';
import { ParametresMedicamentsGroupes } from './medicaments/ParametresMedicamentsGroupes';
import { ParametresMedicamentsPosologies } from './medicaments/ParametresMedicamentsPosologies';
import { ParametresMedicamentsAllergies } from './medicaments/ParametresMedicamentsAllergies';
import { ParametresMedicamentsIncompatibilites } from './medicaments/ParametresMedicamentsIncompatibilites';

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

export const ParametresMedicaments: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Medication fontSize="large" color="primary" />
        <Typography variant="h5">Paramétrage Médicaments</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configurez la liste des médicaments, groupes thérapeutiques, posologies standard, et alertes d'allergies/incompatibilités.
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Liste des médicaments" />
          <Tab label="Groupes thérapeutiques" />
          <Tab label="Posologies standard" />
          <Tab label="Alertes allergies" />
          <Tab label="Incompatibilités" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <ParametresMedicamentsListe />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ParametresMedicamentsGroupes />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ParametresMedicamentsPosologies />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <ParametresMedicamentsAllergies />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <ParametresMedicamentsIncompatibilites />
      </TabPanel>
    </Box>
  );
};

