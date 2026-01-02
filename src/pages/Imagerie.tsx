import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Divider, FormControl, Grid, IconButton, InputLabel, List, ListItem, ListItemText, MenuItem, Paper, Select, SelectChangeEvent, Slider, Snackbar, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Upload, ZoomIn, ZoomOut, Contrast, BorderColor, NoteAlt, ContentCut, Save, PictureAsPdf, Send, Search } from '@mui/icons-material';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { ImagerieService, ImagerieExamen, ImagerieImage, ImagerieAnnotation, ImagerieType } from '../services/imagerieService';
import ImagerieApiService from '../services/imagerieApiService';
import { Patient } from '../services/supabase';
import PatientSelector from '../components/shared/PatientSelector';
import PatientCard from '../components/shared/PatientCard';
import jsPDF from 'jspdf';

const types: ImagerieType[] = ['Radiographie', 'Scanner', 'IRM', 'Échographie', 'Autre'];

const Imagerie: React.FC = () => {
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
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TextField type="date" label="Du" InputLabelProps={{ shrink: true }} size="small" value={filters.from || ''} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
                  <TextField type="date" label="Au" InputLabelProps={{ shrink: true }} size="small" value={filters.to || ''} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
                  <Button variant="outlined" startIcon={<Search />} onClick={loadExamens}>Filtrer</Button>
                </Box>
                <List>
                  {examens.map(ex => (
                    <ListItem key={ex.id} button selected={selectedExamen?.id === ex.id} onClick={() => handleSelectExamen(ex)}>
                      <ListItemText
                        primary={`${ex.type_examen} • ${new Date(ex.date_examen).toLocaleString()}`}
                        secondary={`Patient: ${ex.patient_id} • Médecin: ${ex.medecin_referent || '-'} • Statut: ${ex.statut}`}
                      />
                    </ListItem>
                  ))}
                  {examens.length === 0 && <Typography variant="body2" color="text.secondary">Aucun examen</Typography>}
                </List>
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
            <Divider sx={{ mb: 2 }} />
            <List>
              {examens.map(ex => (
                <ListItem key={ex.id} button onClick={() => handleSelectExamen(ex)}>
                  <ListItemText primary={`${ex.type_examen} • ${new Date(ex.date_examen).toLocaleString()}`} secondary={`Patient: ${ex.patient_id} • Médecin: ${ex.medecin_referent || '-'} • Statut: ${ex.statut}`} />
                </ListItem>
              ))}
              {examens.length === 0 && <Typography variant="body2" color="text.secondary">Aucun résultat</Typography>}
            </List>
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


