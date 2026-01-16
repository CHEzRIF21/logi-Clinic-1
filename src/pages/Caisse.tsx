import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Receipt,
  Payment,
  AccountBalanceWallet,
  Assessment,
  List,
  TrendingUp,
  Dashboard,
  History,
  MedicalServices,
} from '@mui/icons-material';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import CreationFacture from '../components/facturation/CreationFacture';
import GestionPaiements from '../components/facturation/GestionPaiements';
import JournalCaisse from '../components/facturation/JournalCaisse';
import TableauBordFacturation from '../components/facturation/TableauBordFacturation';
import GestionTickets from '../components/facturation/GestionTickets';
import RapportsFinanciers from '../components/facturation/RapportsFinanciers';
import ConsultationsEnAttente from '../components/facturation/ConsultationsEnAttente';
import { PaiementsEnAttente } from '../components/caisse/PaiementsEnAttente';
import { usePermissions } from '../hooks/usePermissions';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`caisse-tabpanel-${index}`}
      aria-labelledby={`caisse-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Caisse: React.FC = () => {
  const { canAccessFinancialReports } = usePermissions();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* En-tête amélioré */}
        <ToolbarBits sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Receipt color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <GradientText variant="h4">Module Caisse</GradientText>
              <Typography variant="body2" color="text.secondary">
                Gestion complète du cycle financier : factures, paiements, encaissements, journal de caisse et rapports
              </Typography>
            </Box>
          </Box>
        </ToolbarBits>

        {/* Navigation par onglets */}
        <GlassCard sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              icon={<Dashboard />}
              label="Tableau de Bord"
              iconPosition="start"
            />
            <Tab
              icon={<Payment />}
              label="Paiements en Attente"
              iconPosition="start"
            />
            <Tab
              icon={<List />}
              label="Tickets en Attente"
              iconPosition="start"
            />
            <Tab
              icon={<MedicalServices />}
              label="Consultations en Attente"
              iconPosition="start"
            />
            <Tab
              icon={<Receipt />}
              label="Création Facture"
              iconPosition="start"
            />
            <Tab
              icon={<Payment />}
              label="Gestion Paiements"
              iconPosition="start"
            />
            <Tab
              icon={<AccountBalanceWallet />}
              label="Journal de Caisse"
              iconPosition="start"
            />
            {canAccessFinancialReports() && (
              <Tab
                icon={<Assessment />}
                label="Rapports"
                iconPosition="start"
              />
            )}
          </Tabs>
        </GlassCard>

        {/* Contenu des onglets */}
        <TabPanel value={activeTab} index={0}>
          <TableauBordFacturation />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <PaiementsEnAttente />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <GestionTickets />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <ConsultationsEnAttente />
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <CreationFacture />
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <GestionPaiements />
        </TabPanel>

        <TabPanel value={activeTab} index={6}>
          <JournalCaisse />
        </TabPanel>

        {canAccessFinancialReports() && (
          <TabPanel value={activeTab} index={7}>
            <RapportsFinanciers />
          </TabPanel>
        )}
      </Box>
    </Container>
  );
};

export default Caisse;
