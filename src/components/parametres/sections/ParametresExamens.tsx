import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { Science } from '@mui/icons-material';
import { ParametresExamensLabo } from './examens/ParametresExamensLabo';
import { ParametresExamensImagerie } from './examens/ParametresExamensImagerie';

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

export const ParametresExamens: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Science fontSize="large" color="primary" />
        <Typography variant="h5">Paramétrage Examens (Labo / Imagerie)</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configurez les examens de laboratoire et d'imagerie : prix, délais d'obtention, service concerné, critères de disponibilité.
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Examens Laboratoire" />
          <Tab label="Examens Imagerie" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <ParametresExamensLabo />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ParametresExamensImagerie />
      </TabPanel>
    </Box>
  );
};

