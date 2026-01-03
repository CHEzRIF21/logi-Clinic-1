import { Router } from 'express';
import MaterniteController from '../controllers/materniteController';
import { requireAuth, requireClinicContext } from '../middleware/auth';

const router = Router();

// Authentification obligatoire pour toutes les routes
router.use(requireAuth);
router.use(requireClinicContext);

// Statistiques
router.get('/stats', MaterniteController.getStats);

// Dossiers obstétricaux
router.get('/dossiers', MaterniteController.getDossiers);
router.get('/dossiers/:id', MaterniteController.getDossierById);
router.post('/dossiers', MaterniteController.createDossier);
router.put('/dossiers/:id', MaterniteController.updateDossier);

// Consultations prénatales (CPN)
router.get('/cpn', MaterniteController.getCPNs);
router.get('/cpn/:id', MaterniteController.getCPNById);
router.post('/cpn', MaterniteController.createCPN);
router.put('/cpn/:id', MaterniteController.updateCPN);

// Accouchements
router.get('/accouchements', MaterniteController.getAccouchements);
router.get('/accouchements/:id', MaterniteController.getAccouchementById);
router.post('/accouchements', MaterniteController.createAccouchement);

// Suivi post-partum
router.get('/post-partum', MaterniteController.getSuiviPostPartum);
router.post('/post-partum', MaterniteController.createSuiviPostPartum);

export default router;

