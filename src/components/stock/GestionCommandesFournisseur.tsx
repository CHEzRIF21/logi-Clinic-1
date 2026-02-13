import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  IconButton,
  Alert,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import { Add, Delete, Download, Refresh, Send, CheckCircle, Inventory2 } from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../../utils/currency';
import { supabase } from '../../services/supabase';
import { useMedicaments } from '../../hooks/useMedicaments';
import { CommandesFournisseurService, CommandeFournisseur, Fournisseur, StatutCommandeFournisseur } from '../../services/commandesFournisseurService';

type LigneDraft = {
  id: string;
  medicament_id: string;
  quantite: number;
  prix_unitaire_estime: number;
};

function statutLabel(statut: StatutCommandeFournisseur): string {
  switch (statut) {
    case 'DRAFT': return 'Brouillon';
    case 'AWAITING_SIGNATURE': return 'En attente de signature';
    case 'SENT_TO_SUPPLIER': return 'Commandé (envoyé)';
    case 'RECEIVED': return 'Reçu';
    default: return statut;
  }
}

function statutColor(statut: StatutCommandeFournisseur): 'default' | 'warning' | 'info' | 'success' {
  switch (statut) {
    case 'DRAFT': return 'default';
    case 'AWAITING_SIGNATURE': return 'warning';
    case 'SENT_TO_SUPPLIER': return 'info';
    case 'RECEIVED': return 'success';
    default: return 'default';
  }
}

export const GestionCommandesFournisseur: React.FC = () => {
  const { medicaments, loading: loadingMedicaments } = useMedicaments({ autoRefresh: true });
  const [currentUserId, setCurrentUserId] = React.useState<string>('system');
  const [loading, setLoading] = React.useState(false);

  const [fournisseurs, setFournisseurs] = React.useState<Fournisseur[]>([]);
  const [commandes, setCommandes] = React.useState<CommandeFournisseur[]>([]);

  const [openNew, setOpenNew] = React.useState(false);
  const [openNewSupplier, setOpenNewSupplier] = React.useState(false);
  const [newSupplier, setNewSupplier] = React.useState({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    notes: '',
  });
  const [newCommande, setNewCommande] = React.useState({
    supplier_id: '',
    delivery_date_requested: '',
    notes: '',
    status: 'DRAFT' as StatutCommandeFournisseur,
  });
  const [newLignes, setNewLignes] = React.useState<LigneDraft[]>([
    { id: `l-${Date.now()}`, medicament_id: '', quantite: 0, prix_unitaire_estime: 0 },
  ]);

  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) setCurrentUserId(data.user.id);
      } catch {
        // ignore
      }
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [f, c] = await Promise.all([
        CommandesFournisseurService.listFournisseurs(),
        CommandesFournisseurService.listCommandes(),
      ]);
      setFournisseurs(f);
      setCommandes(c);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCommande = (cmd: CommandeFournisseur): number => {
    const lignes = cmd.commandes_fournisseur_lignes || [];
    return lignes.reduce((sum, l) => sum + Number(l.quantite || 0) * Number(l.prix_unitaire_estime || 0), 0);
  };

  const resetNew = () => {
    setNewCommande({ supplier_id: '', delivery_date_requested: '', notes: '', status: 'DRAFT' });
    setNewLignes([{ id: `l-${Date.now()}`, medicament_id: '', quantite: 0, prix_unitaire_estime: 0 }]);
  };

  const resetNewSupplier = () => {
    setNewSupplier({ nom: '', telephone: '', email: '', adresse: '', notes: '' });
  };

  const addLine = () => setNewLignes(prev => [...prev, { id: `l-${Date.now()}-${Math.random()}`, medicament_id: '', quantite: 0, prix_unitaire_estime: 0 }]);
  const removeLine = (id: string) => setNewLignes(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev);
  const updateLine = (id: string, patch: Partial<LigneDraft>) =>
    setNewLignes(prev => prev.map(l => l.id === id ? ({ ...l, ...patch }) : l));

  const createCommande = async () => {
    const lignes = newLignes
      .filter(l => l.medicament_id && l.quantite > 0)
      .map(l => ({ medicament_id: l.medicament_id, quantite: l.quantite, prix_unitaire_estime: l.prix_unitaire_estime || 0 }));

    if (!newCommande.supplier_id) {
      alert('Veuillez sélectionner un fournisseur.');
      return;
    }
    if (lignes.length === 0) {
      alert('Veuillez ajouter au moins un produit avec une quantité > 0.');
      return;
    }

    setLoading(true);
    try {
      await CommandesFournisseurService.createCommande({
        supplier_id: newCommande.supplier_id,
        status: newCommande.status,
        delivery_date_requested: newCommande.delivery_date_requested || null,
        notes: newCommande.notes || null,
        created_by: currentUserId,
        lignes,
      });
      setOpenNew(false);
      resetNew();
      await load();
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async () => {
    if (!newSupplier.nom.trim()) {
      alert('Le nom du fournisseur est obligatoire.');
      return;
    }
    setLoading(true);
    try {
      await CommandesFournisseurService.createFournisseur({
        nom: newSupplier.nom.trim(),
        telephone: newSupplier.telephone || null,
        email: newSupplier.email || null,
        adresse: newSupplier.adresse || null,
        notes: newSupplier.notes || null,
      });
      setOpenNewSupplier(false);
      resetNewSupplier();
      await load();
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la création du fournisseur');
    } finally {
      setLoading(false);
    }
  };

  const generateBonCommandePDF = (cmd: CommandeFournisseur) => {
    const doc = new jsPDF();
    const fournisseur = cmd.fournisseurs;
    const lignes = cmd.commandes_fournisseur_lignes || [];

    const date = cmd.created_at ? new Date(cmd.created_at) : new Date();
    const dateStr = date.toLocaleDateString('fr-FR');

    doc.setFontSize(16);
    doc.text('BON DE COMMANDE', 14, 16);
    doc.setFontSize(11);
    doc.text(`Date: ${dateStr}`, 14, 24);
    doc.text(`N°: ${cmd.numero_commande}`, 14, 30);

    doc.setFontSize(12);
    doc.text('Fournisseur', 14, 42);
    doc.setFontSize(10);
    doc.text(`${fournisseur?.nom || ''}`, 14, 48);
    if (fournisseur?.adresse) doc.text(`Adresse: ${fournisseur.adresse}`, 14, 54);
    if (fournisseur?.telephone) doc.text(`Téléphone: ${fournisseur.telephone}`, 14, 60);
    if (fournisseur?.email) doc.text(`Email: ${fournisseur.email}`, 14, 66);

    const rows = lignes.map((l) => {
      const designation = (l.medicaments?.nom || 'Médicament') + (l.medicaments?.dosage ? ` ${l.medicaments.dosage}` : '');
      const qte = Number(l.quantite || 0);
      const pu = Number(l.prix_unitaire_estime || 0);
      const total = qte * pu;
      return [designation, qte.toString(), formatCurrency(pu), formatCurrency(total)];
    });

    autoTable(doc, {
      startY: 75,
      head: [['Désignation', 'Quantité', 'Prix unitaire estimé', 'Montant estimé']],
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [25, 118, 210] },
    });

    const total = totalCommande(cmd);
    const finalY = (doc as any).lastAutoTable?.finalY || 75;
    doc.setFontSize(11);
    doc.text(`Total estimé: ${formatCurrency(total)}`, 14, finalY + 10);

    doc.setFontSize(10);
    doc.text('Signature et Cachet', 140, finalY + 22);
    doc.rect(140, finalY + 25, 55, 30);

    doc.save(`Bon_Commande_${cmd.numero_commande}.pdf`);
  };

  const advanceStatus = async (cmd: CommandeFournisseur, to: StatutCommandeFournisseur) => {
    setLoading(true);
    try {
      await CommandesFournisseurService.updateStatus(cmd.id, { status: to, actor_id: currentUserId });
      await load();
    } catch (e: any) {
      alert(e?.message || 'Erreur lors du changement de statut');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" gutterBottom>Achats externes (Commandes fournisseur)</Typography>
          <Typography variant="body2" color="text.secondary">
            Workflow: Brouillon → En attente de signature → Commandé (PDF) → Reçu
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load} disabled={loading}>
            {loading ? 'Chargement…' : 'Rafraîchir'}
          </Button>
          <Button variant="outlined" onClick={() => setOpenNewSupplier(true)} disabled={loading}>
            Nouveau fournisseur
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenNew(true)} disabled={loading}>
            Nouvelle commande
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>N°</TableCell>
                  <TableCell>Fournisseur</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Livraison souhaitée</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Total estimé</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {commandes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Aucune commande fournisseur
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  commandes.map((cmd) => (
                    <TableRow key={cmd.id}>
                      <TableCell>{cmd.numero_commande}</TableCell>
                      <TableCell>{cmd.fournisseurs?.nom || '-'}</TableCell>
                      <TableCell>{cmd.created_at ? new Date(cmd.created_at).toLocaleDateString('fr-FR') : '-'}</TableCell>
                      <TableCell>{cmd.delivery_date_requested ? new Date(cmd.delivery_date_requested).toLocaleDateString('fr-FR') : '-'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={statutLabel(cmd.status)} color={statutColor(cmd.status)} />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(totalCommande(cmd))}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Tooltip title="Télécharger le bon de commande (PDF)">
                            <IconButton size="small" onClick={() => generateBonCommandePDF(cmd)}>
                              <Download />
                            </IconButton>
                          </Tooltip>
                          {cmd.status === 'DRAFT' && (
                            <Button size="small" variant="outlined" startIcon={<CheckCircle />} onClick={() => advanceStatus(cmd, 'AWAITING_SIGNATURE')}>
                              Signature
                            </Button>
                          )}
                          {cmd.status === 'AWAITING_SIGNATURE' && (
                            <Button size="small" variant="contained" startIcon={<Send />} onClick={() => {
                              // Générer PDF au moment de la validation finale
                              generateBonCommandePDF(cmd);
                              advanceStatus(cmd, 'SENT_TO_SUPPLIER');
                            }}>
                              Commander
                            </Button>
                          )}
                          {cmd.status === 'SENT_TO_SUPPLIER' && (
                            <Button size="small" variant="outlined" startIcon={<Inventory2 />} onClick={() => advanceStatus(cmd, 'RECEIVED')}>
                              Marquer reçu
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="info" sx={{ mt: 2 }}>
            Les montants sont en <strong>XOF</strong>. Le PDF inclut une zone “Signature et Cachet”.
          </Alert>
        </CardContent>
      </Card>

      {fournisseurs.length === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Aucun fournisseur enregistré. Cliquez sur <strong>Nouveau fournisseur</strong> pour en créer un.
        </Alert>
      )}

      {/* Dialog Nouveau fournisseur */}
      <Dialog open={openNewSupplier} onClose={() => setOpenNewSupplier(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouveau fournisseur</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom *"
                value={newSupplier.nom}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, nom: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Téléphone"
                value={newSupplier.telephone}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, telephone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse"
                value={newSupplier.adresse}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, adresse: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={newSupplier.notes}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenNewSupplier(false); resetNewSupplier(); }}>Annuler</Button>
          <Button variant="contained" onClick={createSupplier} disabled={loading || !newSupplier.nom.trim()}>
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Nouvelle commande */}
      <Dialog open={openNew} onClose={() => setOpenNew(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Nouvelle commande fournisseur</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Fournisseur *</InputLabel>
                <Select
                  label="Fournisseur *"
                  value={newCommande.supplier_id}
                  onChange={(e) => setNewCommande(prev => ({ ...prev, supplier_id: e.target.value }))}
                >
                  {fournisseurs.map(f => (
                    <MenuItem key={f.id} value={f.id}>{f.nom}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Livraison souhaitée"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newCommande.delivery_date_requested}
                onChange={(e) => setNewCommande(prev => ({ ...prev, delivery_date_requested: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Statut initial</InputLabel>
                <Select
                  label="Statut initial"
                  value={newCommande.status}
                  onChange={(e) => setNewCommande(prev => ({ ...prev, status: e.target.value as StatutCommandeFournisseur }))}
                >
                  <MenuItem value="DRAFT">Brouillon</MenuItem>
                  <MenuItem value="AWAITING_SIGNATURE">En attente de signature</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes / Commentaire"
                multiline
                rows={2}
                value={newCommande.notes}
                onChange={(e) => setNewCommande(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1">Produits</Typography>
                <Button variant="outlined" startIcon={<Add />} onClick={addLine}>
                  Ajouter une ligne
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TableContainer component={Paper} sx={{ maxHeight: 320, overflow: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Médicament</TableCell>
                      <TableCell align="right">Quantité</TableCell>
                      <TableCell align="right">Prix unitaire estimé (XOF)</TableCell>
                      <TableCell align="right">Total (XOF)</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {newLignes.map((l) => {
                      const med = medicaments.find(m => m.id === l.medicament_id);
                      const total = (l.quantite || 0) * (l.prix_unitaire_estime || 0);
                      return (
                        <TableRow key={l.id}>
                          <TableCell>
                            <Autocomplete
                              size="small"
                              fullWidth
                              openOnFocus
                              options={[...medicaments].sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))}
                              getOptionLabel={(option) => `${option.nom} ${option.dosage || ''} (${option.code || ''})`}
                              value={med || null}
                              onChange={(_, newValue) => {
                                if (newValue) {
                                  updateLine(l.id, { 
                                    medicament_id: newValue.id,
                                    prix_unitaire_estime: Number(newValue.prix_unitaire_entree || 0)
                                  });
                                } else {
                                  updateLine(l.id, { medicament_id: '', prix_unitaire_estime: 0 });
                                }
                              }}
                              loading={loadingMedicaments}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="Cliquez ou tapez pour sélectionner un médicament"
                                  required
                                />
                              )}
                              ListboxProps={{ style: { maxHeight: 250 } }}
                              noOptionsText={loadingMedicaments ? "Chargement des médicaments..." : medicaments.length === 0 ? "Aucun médicament. Créez-en dans Paramètres > Médicaments." : "Aucun médicament trouvé"}
                            />
                            {med?.prix_unitaire_detail != null && (
                              <Typography variant="caption" color="text.secondary">
                                Prix détail actuel: {formatCurrency(Number(med.prix_unitaire_detail || 0))}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={l.quantite}
                              onChange={(e) => updateLine(l.id, { quantite: Math.max(0, parseInt(e.target.value) || 0) })}
                              inputProps={{ min: 0, step: 1 }}
                              sx={{ width: 110 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={l.prix_unitaire_estime}
                              onChange={(e) => updateLine(l.id, { prix_unitaire_estime: Math.max(0, parseInt(e.target.value) || 0) })}
                              inputProps={{ min: 0, step: 1 }}
                              sx={{ width: 160 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{formatCurrency(total)}</Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => removeLine(l.id)} disabled={newLignes.length <= 1}>
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenNew(false); resetNew(); }}>Annuler</Button>
          <Button variant="contained" onClick={createCommande} disabled={loading}>
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

