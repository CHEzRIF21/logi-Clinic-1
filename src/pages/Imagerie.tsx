import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Divider, FormControl, Grid, IconButton, InputLabel, List, ListItem, ListItemText, MenuItem, Paper, Select, SelectChangeEvent, Slider, Snackbar, Tab, Tabs, TextField, Typography, Chip, Avatar, alpha, useTheme } from '@mui/material';
import { Upload, ZoomIn, ZoomOut, Contrast, BorderColor, NoteAlt, ContentCut, Save, PictureAsPdf, Send, Search, RadioButtonChecked, Scanner, Healing, MonitorHeart, MedicalServices, AccessTime, Person, LocalHospital, Visibility } from '@mui/icons-material';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { ImagerieService, ImagerieExamen, ImagerieImage, ImagerieAnnotation, ImagerieType } from '../services/imagerieService';
import ImagerieApiService from '../services/imagerieApiService';
import { Patient } from '../services/supabase';
import PatientSelector from '../components/shared/PatientSelector';
import PatientCard from '../components/shared/PatientCard';
import { PaymentNotification } from '../components/shared/PaymentNotification';
import { PaymentStatusCell } from '../components/shared/PaymentStatusCell';
import { PatientService } from '../services/patientService';
import jsPDF from 'jspdf';

const types: ImagerieType[] = ['Radiographie', 'Scanner', 'IRM', 'Échographie', 'Autre'];

// Mapping des types d'examen vers les icônes
const getExamenIcon = (type: ImagerieType) => {
  switch (type) {
    case 'Radiographie':
      return <RadioButtonChecked />;
    case 'Scanner':
      return <Scanner />;
    case 'IRM':
      return <Healing />;
    case 'Échographie':
      return <MonitorHeart />;
    default:
      return <MedicalServices />;
  }
};

// Mapping des statuts vers les couleurs
const getStatutColor = (statut: string) => {
  switch (statut) {
    case 'en_attente':
      return 'warning';
    case 'en_cours':
      return 'info';
    case 'termine':
      return 'success';
    case 'annule':
      return 'error';
    default:
      return 'default';
  }
};

const getStatutLabel = (statut: string) => {
  switch (statut) {
    case 'en_attente':
      return 'En attente';
    case 'en_cours':
      return 'En cours';
    case 'termine':
      return 'Terminé';
    case 'annule':
      return 'Annulé';
    default:
      return statut;
  }
};

const Imagerie: React.FC = () => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [filters, setFilters] = useState<{ patient?: string; type?: ImagerieType; from?: string; to?: string; medecin?: string }>({});
  const [examens, setExamens] = useState<ImagerieExamen[]>([]);
  const [selectedExamen, setSelectedExamen] = useState<ImagerieExamen | null>(null);
  const [openPatientSelector, setOpenPatientSelector] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [images, setImages] = useState<ImagerieImage[]>([]);
  const [activeImage, setActiveImage] = useState<ImagerieImage | null>(null);
  const [annotations, setAnnotations] = useState<ImagerieAnnotation[]>([]);
  const [zoom, setZoom] = useState(1);
  const [contrast, setContrast] = useState(100);
  const [report, setReport] = useState<{ modele: string; contenu: string; rapportId?: string }>({ modele: 'Standard', contenu: '' });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState<boolean>(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [patientsMap, setPatientsMap] = useState<Record<string, Patient>>({});
  
  // États pour les notifications et le chargement
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const loadExamens = async () => {
    const list = await ImagerieService.listerExamens({
      patient_id: filters.patient || undefined,
      type_examen: filters.type,
      from: filters.from,
      to: filters.to,
      medecin: filters.medecin,
    });
    setExamens(list);
    
    // Charger les informations des patients
    const uniquePatientIds = [...new Set(list.map(ex => ex.patient_id))];
    const patients: Record<string, Patient> = {};
    
    for (const patientId of uniquePatientIds) {
      try {
        const patient = await PatientService.getPatientById(patientId);
        if (patient) {
          patients[patientId] = patient;
        }
      } catch (error) {
        console.warn(`Impossible de charger le patient ${patientId}:`, error);
      }
    }
    
    setPatientsMap(patients);
  };

  useEffect(() => { loadExamens(); }, []);

  const handleSelectExamen = async (ex: ImagerieExamen) => {
    setSelectedExamen(ex);
    const imgs = await ImagerieService.listerImages(ex.id);
    setImages(imgs);
    setActiveImage(imgs[0] || null);
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || !selectedExamen) return;
    for (const file of Array.from(fileList)) {
      const dicom = file.name.toLowerCase().endsWith('.dcm') || file.type === 'application/dicom';
      await ImagerieService.uploadImage(selectedExamen.id, file, { dicom });
    }
    const imgs = await ImagerieService.listerImages(selectedExamen.id);
    setImages(imgs);
    if (!activeImage && imgs.length > 0) setActiveImage(imgs[0]);
  };

  useEffect(() => {
    const loadAnn = async () => {
      if (activeImage) {
        const anns = await ImagerieService.listerAnnotations(activeImage.id);
        setAnnotations(anns);
      } else {
        setAnnotations([]);
      }
    };
    loadAnn();
  }, [activeImage]);

  // Dessin libre simple sur canvas (annotation)
  const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setPoints([{ x, y }]);
  };
  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const last = points[points.length - 1];
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    setPoints(prev => [...prev, { x, y }]);
  };
  const onCanvasMouseUp = async () => {
    setDrawing(false);
    if (activeImage && points.length > 1) {
      const payload = { points };
      const ann = await ImagerieService.ajouterAnnotation(activeImage.id, 'Radiologue', 'libre', payload);
      setAnnotations(prev => [...prev, ann]);
      setPoints([]);
    }
  };

  const renderViewer = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Images</Typography>
            <Button fullWidth variant="outlined" startIcon={<Upload />} component="label" disabled={!selectedExamen} sx={{ mb: 2 }}>
              Importer
              <input hidden type="file" multiple onChange={(e) => handleUpload(e.target.files)} />
            </Button>
            <List dense>
              {images.map(img => (
                <ListItem key={img.id} button selected={activeImage?.id === img.id} onClick={() => setActiveImage(img)}>
                  <ListItemText
                    primary={img.dicom ? 'DICOM (converti)' : (img.metadata?.name || 'Image')}
                    secondary={new Date(img.created_at).toLocaleString()}
                  />
                </ListItem>
              ))}
              {images.length === 0 && <Typography variant="body2" color="text.secondary">Aucune image</Typography>}
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={9}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <IconButton onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}><ZoomOut /></IconButton>
            <IconButton onClick={() => setZoom(z => Math.min(5, z + 0.25))}><ZoomIn /></IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <Contrast fontSize="small" />
              <Slider min={50} max={150} value={contrast} onChange={(_, v) => setContrast(v as number)} sx={{ width: 160 }} />
            </Box>
            <BorderColor sx={{ ml: 2 }} />
            <Typography variant="body2">Annotation libre (dessiner sur l'image)</Typography>
          </Box>
          <Box sx={{ position: 'relative', overflow: 'auto', border: '1px solid #eee', minHeight: 420, display: 'grid', placeItems: 'center' }}>
            {activeImage?.web_asset_url ? (
              <Box sx={{ position: 'relative' }}>
                <img
                  src={activeImage.web_asset_url}
                  alt="imagerie"
                  style={{ transform: `scale(${zoom})`, filter: `contrast(${contrast}%)`, transformOrigin: 'top left', display: 'block', maxWidth: '100%' }}
                />
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                  onMouseDown={onCanvasMouseDown}
                  onMouseMove={onCanvasMouseMove}
                  onMouseUp={onCanvasMouseUp}
                />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">Sélectionnez une image</Typography>
            )}
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Historique des annotations</Typography>
            <List dense>
              {annotations.map(a => (
                <ListItem key={a.id}>
                  <NoteAlt sx={{ mr: 1 }} />
                  <ListItemText primary={`${a.type} • ${a.auteur}`} secondary={new Date(a.created_at).toLocaleString()} />
                </ListItem>
              ))}
              {annotations.length === 0 && <Typography variant="body2" color="text.secondary">Aucune annotation</Typography>}
            </List>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const createPDFReport = () => {
    if (!selectedExamen) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Compte-rendu Imagerie', 14, 18);
    doc.setFontSize(10);
    doc.text(`Examen: ${selectedExamen.type_examen} • ${new Date(selectedExamen.date_examen).toLocaleString()}`, 14, 26);
    doc.text(`Patient ID: ${selectedExamen.patient_id}`, 14, 32);
    doc.line(14, 34, 196, 34);
    const lines = doc.splitTextToSize(report.contenu || '', 180);
    doc.text(lines, 14, 44);
    doc.text('Signature électronique: SIGN_HASH_DEMO', 14, 280);
    doc.save(`compte_rendu_${selectedExamen.id}.pdf`);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* En-tête amélioré */}
        <ToolbarBits sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Search color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <GradientText variant="h4">Imagerie Médicale</GradientText>
              <Typography variant="body2" color="text.secondary">
                Centraliser la gestion des images radiologiques et leurs comptes rendus dans un environnement sécurisé.
              </Typography>
            </Box>
          </Box>
        </ToolbarBits>

        <GlassCard sx={{ mb: 3, width: '100%', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
          <Tabs 
            value={tab} 
            onChange={(_, v) => setTab(v)}
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
            <Tab label="Examens" iconPosition="start" />
            <Tab label="Visionneuse & Annotations" iconPosition="start" />
            <Tab label="Compte rendu" iconPosition="start" />
            <Tab label="Archivage & Recherche" iconPosition="start" />
          </Tabs>
          </Box>
        </GlassCard>

        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Créer un examen</Typography>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ mb: 2 }}
                    onClick={() => setOpenPatientSelector(true)}
                  >
                    {selectedPatient ? `${selectedPatient.prenom} ${selectedPatient.nom}` : 'Sélectionner un patient'}
                  </Button>
                  {selectedPatient && (
                    <Box sx={{ mb: 2 }}>
                      <PatientCard patient={selectedPatient} compact />
                      {/* Notification de statut de paiement si consultation_id existe */}
                      {examens.length > 0 && examens[0].consultation_id && (
                        <Box sx={{ mt: 2 }}>
                          <PaymentNotification
                            consultationId={examens[0].consultation_id}
                            patientId={selectedPatient.id}
                            showNotification={true}
                          />
                        </Box>
                      )}
                    </Box>
                  )}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Type d'examen</InputLabel>
                    <Select label="Type d'examen" value={filters.type || ''} onChange={(e: SelectChangeEvent) => setFilters({ ...filters, type: e.target.value as ImagerieType })}>
                      {types.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField label="Prescripteur" fullWidth sx={{ mb: 2 }} value={filters.medecin || ''} onChange={(e) => setFilters({ ...filters, medecin: e.target.value })} />
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={async () => {
                      if (!selectedPatient || !filters.type) {
                        setSnackbar({
                          open: true,
                          message: 'Veuillez sélectionner un patient et un type d\'examen',
                          severity: 'warning'
                        });
                        return;
                      }
                      
                      setLoading(true);
                      try {
                        const ex = await ImagerieService.creerExamen({ 
                          patient_id: selectedPatient.id, 
                          identifiant_patient: selectedPatient.identifiant, 
                          type_examen: filters.type, 
                          prescripteur: filters.medecin || undefined, 
                          medecin_referent: filters.medecin || undefined, 
                          date_examen: new Date().toISOString() 
                        });
                        
                        await loadExamens();
                        setSelectedExamen(ex);
                        
                        setSnackbar({
                          open: true,
                          message: `Examen ${filters.type} créé avec succès pour ${selectedPatient.prenom} ${selectedPatient.nom}`,
                          severity: 'success'
                        });
                        
                        // Réinitialiser le formulaire
                        setFilters({ ...filters, type: undefined, medecin: '' });
                      } catch (error: any) {
                        console.error('Erreur création examen:', error);
                        setSnackbar({
                          open: true,
                          message: error.message || 'Erreur lors de la création de l\'examen',
                          severity: 'error'
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={!selectedPatient || !filters.type || loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {loading ? 'Création...' : 'Créer'}
                  </Button>
                  
                  <PatientSelector
                    open={openPatientSelector}
                    onClose={() => setOpenPatientSelector(false)}
                    onSelect={(patient) => {
                      setSelectedPatient(patient);
                      setFilters({ ...filters, patient: patient.id });
                    }}
                    title="Sélectionner un patient pour l'imagerie"
                    allowCreate={true}
                    onCreateNew={() => {
                      window.location.href = '/patients?action=create&service=Imagerie';
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <TextField 
                    type="date" 
                    label="Du" 
                    InputLabelProps={{ shrink: true }} 
                    size="small" 
                    value={filters.from || ''} 
                    onChange={(e) => setFilters({ ...filters, from: e.target.value })} 
                  />
                  <TextField 
                    type="date" 
                    label="Au" 
                    InputLabelProps={{ shrink: true }} 
                    size="small" 
                    value={filters.to || ''} 
                    onChange={(e) => setFilters({ ...filters, to: e.target.value })} 
                  />
                  <Button 
                    variant="contained" 
                    startIcon={<Search />} 
                    onClick={loadExamens}
                    sx={{ ml: 'auto' }}
                  >
                    Filtrer
                  </Button>
                </Box>
                
                {examens.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <MedicalServices sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Aucun examen trouvé
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ajustez vos filtres ou créez un nouvel examen
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {examens.map(ex => {
                      const patient = patientsMap[ex.patient_id];
                      const isSelected = selectedExamen?.id === ex.id;
                      
                      return (
                        <Grid item xs={12} key={ex.id}>
                          <Card
                            sx={{
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-in-out',
                              border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                              borderColor: isSelected ? theme.palette.primary.main : 'divider',
                              backgroundColor: isSelected 
                                ? alpha(theme.palette.primary.main, 0.05) 
                                : 'background.paper',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4],
                                borderColor: theme.palette.primary.main,
                              },
                            }}
                            onClick={() => handleSelectExamen(ex)}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                {/* Icône du type d'examen */}
                                <Avatar
                                  sx={{
                                    bgcolor: theme.palette.primary.main,
                                    width: 56,
                                    height: 56,
                                  }}
                                >
                                  {getExamenIcon(ex.type_examen)}
                                </Avatar>
                                
                                {/* Contenu principal */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                      {ex.type_examen}
                                    </Typography>
                                    <Chip
                                      label={getStatutLabel(ex.statut)}
                                      color={getStatutColor(ex.statut) as any}
                                      size="small"
                                      sx={{ fontWeight: 500 }}
                                    />
                                    {ex.consultation_id && (
                                      <Box sx={{ ml: 'auto' }}>
                                        <PaymentStatusCell consultationId={ex.consultation_id} size="small" />
                                      </Box>
                                    )}
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {/* Informations patient */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                      <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Patient:</strong>{' '}
                                        {patient 
                                          ? `${patient.prenom} ${patient.nom}` 
                                          : ex.identifiant_patient || ex.patient_id}
                                      </Typography>
                                    </Box>
                                    
                                    {/* Date et heure */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                      <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="body2" color="text.secondary">
                                        {new Date(ex.date_examen).toLocaleString('fr-FR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </Typography>
                                    </Box>
                                    
                                    {/* Médecin référent */}
                                    {ex.medecin_referent && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                        <LocalHospital sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="text.secondary">
                                          <strong>Médecin:</strong> {ex.medecin_referent}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                                
                                {/* Action */}
                                <IconButton
                                  sx={{
                                    color: isSelected ? 'primary.main' : 'text.secondary',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectExamen(ex);
                                  }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {tab === 1 && renderViewer()}

        {tab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Modèle de rapport</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Modèle</InputLabel>
                  <Select label="Modèle" value={report.modele} onChange={(e) => setReport({ ...report, modele: e.target.value })}>
                    <MenuItem value="Standard">Standard</MenuItem>
                    <MenuItem value="Radiographie Thorax">Radiographie Thorax</MenuItem>
                    <MenuItem value="IRM Cérébrale">IRM Cérébrale</MenuItem>
                    <MenuItem value="Scanner Abdominal">Scanner Abdominal</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Contenu du rapport" value={report.contenu} onChange={(e) => setReport({ ...report, contenu: e.target.value })} fullWidth multiline minRows={10} />
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button startIcon={<Save />} variant="contained" disabled={!selectedExamen} onClick={async () => {
                    if (!selectedExamen) return;
                    const rp = await ImagerieService.creerRapport(selectedExamen.id, report.modele, report.contenu);
                    setReport({ ...report, rapportId: rp.id });
                  }}>Enregistrer</Button>
                  <Button startIcon={<ContentCut />} variant="outlined" onClick={() => setReport({ modele: 'Standard', contenu: '' })}>Réinitialiser</Button>
                  <Button startIcon={<PictureAsPdf />} variant="outlined" onClick={createPDFReport} disabled={!selectedExamen}>Exporter PDF</Button>
                  <Button startIcon={<Send />} variant="outlined" disabled={!report.rapportId} onClick={async () => {
                    if (!report.rapportId) return;
                    await ImagerieService.signerRapport(report.rapportId, 'Radiologue Senior');
                    await ImagerieService.transmettreRapport(report.rapportId, selectedExamen?.medecin_referent || 'Médecin référent');
                  }}>Signer & Envoyer</Button>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Bonnes pratiques</Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Privilégiez l'import automatique DICOM via PACS.<br />
                    • Les images DICOM sont converties pour le web côté serveur (intégration à prévoir).<br />
                    • Les signatures électroniques doivent être appuyées par une PKI en production.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tab === 3 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Archivage & Recherche avancée</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={3}>
                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={() => setOpenPatientSelector(true)}
                >
                  {selectedPatient ? `${selectedPatient.prenom} ${selectedPatient.nom}` : 'Filtrer par patient'}
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select label="Type" value={filters.type || ''} onChange={(e: SelectChangeEvent) => setFilters({ ...filters, type: e.target.value as ImagerieType })}>
                    {types.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}><TextField type="date" label="Du" InputLabelProps={{ shrink: true }} fullWidth value={filters.from || ''} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></Grid>
              <Grid item xs={12} md={2}><TextField type="date" label="Au" InputLabelProps={{ shrink: true }} fullWidth value={filters.to || ''} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></Grid>
              <Grid item xs={12} md={2}><Button fullWidth variant="outlined" startIcon={<Search />} onClick={loadExamens}>Rechercher</Button></Grid>
            </Grid>
            <Divider sx={{ mb: 3 }} />
            
            {examens.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <MedicalServices sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucun résultat trouvé
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ajustez vos critères de recherche
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {examens.map(ex => {
                  const patient = patientsMap[ex.patient_id];
                  const isSelected = selectedExamen?.id === ex.id;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={ex.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                          borderColor: isSelected ? theme.palette.primary.main : 'divider',
                          backgroundColor: isSelected 
                            ? alpha(theme.palette.primary.main, 0.05) 
                            : 'background.paper',
                          height: '100%',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[4],
                            borderColor: theme.palette.primary.main,
                          },
                        }}
                        onClick={() => handleSelectExamen(ex)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Avatar
                              sx={{
                                bgcolor: theme.palette.primary.main,
                                width: 48,
                                height: 48,
                              }}
                            >
                              {getExamenIcon(ex.type_examen)}
                            </Avatar>
                            
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {ex.type_examen}
                                </Typography>
                                <Chip
                                  label={getStatutLabel(ex.statut)}
                                  color={getStatutColor(ex.statut) as any}
                                  size="small"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 0.5 }}>
                                {patient 
                                  ? `${patient.prenom} ${patient.nom}` 
                                  : ex.identifiant_patient || ex.patient_id}
                              </Typography>
                              
                              <Typography variant="caption" color="text.secondary" display="block">
                                {new Date(ex.date_examen).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Typography>
                              
                              {ex.medecin_referent && (
                                <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                  Dr. {ex.medecin_referent}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Paper>
        )}
      </Box>
      
      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Imagerie;


