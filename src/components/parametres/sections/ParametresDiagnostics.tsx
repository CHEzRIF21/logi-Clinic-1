import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import { ParametresDiagnosticsCIM10 } from './diagnostics/ParametresDiagnosticsCIM10';
import { ParametresDiagnosticsFavoris } from './diagnostics/ParametresDiagnosticsFavoris';
import { ParametresDiagnosticsInterdits } from './diagnostics/ParametresDiagnosticsInterdits';

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

export const ParametresDiagnostics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <LocalHospital fontSize="large" color="primary" />
        <Typography variant="h5">Paramétrage des Diagnostics</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Gérez la base CIM-10, les diagnostics favoris par utilisateur, et les diagnostics interdits/masqués.
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Base CIM-10" />
          <Tab label="Diagnostics favoris" />
          <Tab label="Diagnostics interdits" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <ParametresDiagnosticsCIM10 />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ParametresDiagnosticsFavoris />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ParametresDiagnosticsInterdits />
      </TabPanel>
    </Box>
  );
};

