import React, { useState } from 'react';
import {
  Box, Typography, Grid, Paper, Button, TextField, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, InputAdornment, Chip, IconButton, Tooltip, Tabs, Tab,
} from '@mui/material';
import {
  Search, Storage, Edit, Delete, Visibility, Print, Refresh, 
  Person, MedicalServices, Medication, AccountCircle,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { mockUsers, mockPatients, mockConsultations, mockMedicaments } from '../data/mockData';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDatabase: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'view' | 'edit' | 'delete'>('view');

  // Données de démonstration pour les différentes tables
  const users = mockUsers;
  const patients = mockPatients;
  const consultations = mockConsultations;
  const medicaments = mockMedicaments;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
    setSearchTerm('');
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setDialogType('view');
    setOpenDialog(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setDialogType('edit');
    setOpenDialog(true);
  };

  const handleDeleteItem = (item: any) => {
    setSelectedItem(item);
    setDialogType('delete');
    setOpenDialog(true);
  };

  const handleSaveItem = () => {
    setSnackbar({ open: true, message: 'Élément modifié avec succès', severity: 'success' });
    setOpenDialog(false);
  };

  const handleConfirmDelete = () => {
    setSnackbar({ open: true, message: 'Élément supprimé avec succès', severity: 'success' });
    setOpenDialog(false);
  };

  const exportToPDF = (data: any[], title: string, columns: string[]) => {
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Tableau
    const tableData = data.map(item => 
      columns.map(col => item[col] || '')
    );
    
    (doc as any).autoTable({
      head: [columns],
      body: tableData,
      startY: 30,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
      },
    });
    
    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getCurrentData = () => {
    switch (tabValue) {
      case 0: return users;
      case 1: return patients;
      case 2: return consultations;
      case 3: return medicaments;
      default: return [];
    }
  };



  // @ts-ignore
  const filteredData = getCurrentData().filter((item: any) =>
    Object.values(item).some((value: any) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Storage sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Administration Base de Données
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualisation et gestion des données du système
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="database tabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                minHeight: 56,
                py: 1.5,
                px: 2,
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none',
                '&.Mui-selected': { fontWeight: 600 }
              }
            }}
          >
            <Tab label="Utilisateurs" icon={<AccountCircle />} iconPosition="start" />
            <Tab label="Patients" icon={<Person />} iconPosition="start" />
            <Tab label="Consultations" icon={<MedicalServices />} iconPosition="start" />
            <Tab label="Médicaments" icon={<Medication />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={() => exportToPDF(users, 'Utilisateurs', ['nom', 'prenom', 'email', 'role', 'specialite'])}
            >
              Exporter PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => setSnackbar({ open: true, message: 'Données actualisées', severity: 'info' })}
            >
              Actualiser
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Prénom</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Spécialité</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.nom}</TableCell>
                    <TableCell>{user.prenom}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={user.role === 'admin' ? 'error' : user.role === 'medecin' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.specialite}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.statut} 
                        color={user.statut === 'actif' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Voir">
                        <IconButton size="small" onClick={() => handleViewItem(user)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => handleEditItem(user)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" onClick={() => handleDeleteItem(user)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page"
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={() => exportToPDF(patients, 'Patients', ['nom', 'prenom', 'identifiant', 'age', 'telephone'])}
            >
              Exporter PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => setSnackbar({ open: true, message: 'Données actualisées', severity: 'info' })}
            >
              Actualiser
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Prénom</TableCell>
                  <TableCell>Identifiant</TableCell>
                  <TableCell>Âge</TableCell>
                  <TableCell>Téléphone</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.nom}</TableCell>
                    <TableCell>{patient.prenom}</TableCell>
                    <TableCell>{patient.identifiant}</TableCell>
                    <TableCell>{patient.age} ans</TableCell>
                    <TableCell>{patient.telephone}</TableCell>
                    <TableCell>
                      <Chip 
                        label={patient.statut} 
                        color={patient.statut === 'actif' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Voir">
                        <IconButton size="small" onClick={() => handleViewItem(patient)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => handleEditItem(patient)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" onClick={() => handleDeleteItem(patient)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page"
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Rechercher une consultation..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={() => exportToPDF(consultations, 'Consultations', ['patient', 'medecin', 'date', 'type', 'statut'])}
            >
              Exporter PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => setSnackbar({ open: true, message: 'Données actualisées', severity: 'info' })}
            >
              Actualiser
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Médecin</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((consultation) => (
                  <TableRow key={consultation.id}>
                    <TableCell>{consultation.patient}</TableCell>
                    <TableCell>{consultation.medecin}</TableCell>
                    <TableCell>{consultation.date}</TableCell>
                    <TableCell>
                      <Chip 
                        label={consultation.type} 
                        color={consultation.type === 'Première fois' ? 'primary' : consultation.type === 'Contrôle' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={consultation.statut} 
                        color={consultation.statut === 'terminée' ? 'success' : consultation.statut === 'en cours' ? 'warning' : 'info'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Voir">
                        <IconButton size="small" onClick={() => handleViewItem(consultation)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => handleEditItem(consultation)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" onClick={() => handleDeleteItem(consultation)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page"
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Rechercher un médicament..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={() => exportToPDF(medicaments, 'Médicaments', ['nom', 'forme', 'dosage', 'stock', 'prix'])}
            >
              Exporter PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => setSnackbar({ open: true, message: 'Données actualisées', severity: 'info' })}
            >
              Actualiser
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Forme</TableCell>
                  <TableCell>Dosage</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Prix (FCFA)</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((medicament) => (
                  <TableRow key={medicament.id}>
                    <TableCell>{medicament.nom}</TableCell>
                    <TableCell>{medicament.forme}</TableCell>
                    <TableCell>{medicament.dosage}</TableCell>
                    <TableCell>{medicament.stock}</TableCell>
                    <TableCell>{medicament.prix.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={medicament.statut} 
                        color={medicament.statut === 'disponible' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Voir">
                        <IconButton size="small" onClick={() => handleViewItem(medicament)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => handleEditItem(medicament)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" onClick={() => handleDeleteItem(medicament)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page"
          />
        </TabPanel>
      </Paper>

      {/* Dialogue pour voir/modifier/supprimer */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'view' && 'Détails'}
          {dialogType === 'edit' && 'Modifier'}
          {dialogType === 'delete' && 'Confirmer la suppression'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'view' && selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom>Informations détaillées</Typography>
              <Grid container spacing={2}>
                {Object.entries(selectedItem).map(([key, value]) => (
                  <Grid item xs={12} md={6} key={key}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </Typography>
                    <Typography variant="body1">
                      {value as string}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          {dialogType === 'edit' && selectedItem && (
            <Box>
              <Typography variant="h6" gutterBottom>Modifier les informations</Typography>
              <Grid container spacing={2}>
                {Object.entries(selectedItem).map(([key, value]) => (
                  <Grid item xs={12} md={6} key={key}>
                    <TextField
                      fullWidth
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      defaultValue={value as string}
                      variant="outlined"
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          {dialogType === 'delete' && selectedItem && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
              </Alert>
              <Typography variant="body1">
                Élément à supprimer : {JSON.stringify(selectedItem, null, 2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Annuler
          </Button>
          {dialogType === 'edit' && (
            <Button variant="contained" onClick={handleSaveItem}>
              Enregistrer
            </Button>
          )}
          {dialogType === 'delete' && (
            <Button variant="contained" color="error" onClick={handleConfirmDelete}>
              Supprimer
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDatabase;




