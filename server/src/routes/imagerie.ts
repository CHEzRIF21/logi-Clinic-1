import { Router } from 'express';
import ImagerieController from '../controllers/imagerieController';

const router = Router();

// Catalogue des examens
router.get('/catalogue', ImagerieController.getCatalogue);

// Statistiques
router.get('/stats', ImagerieController.getStats);

// Demandes (requests)
router.get('/requests', ImagerieController.getDemandes);
router.get('/requests/:id', ImagerieController.getDemandeById);
router.post('/requests', ImagerieController.createDemande);
router.put('/requests/:id/status', ImagerieController.updateDemandeStatus);

// Examens
router.get('/examens', ImagerieController.getExamens);
router.get('/examens/:id', ImagerieController.getExamenById);
router.post('/examens', ImagerieController.createExamen);

// Images
router.get('/examens/:id/images', ImagerieController.getImages);
router.post('/examens/:id/images', ImagerieController.addImage);

// Rapports
router.post('/examens/:id/rapport', ImagerieController.createRapport);

export default router;

