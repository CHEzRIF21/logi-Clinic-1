import { Router } from 'express';
import LaboratoireController from '../controllers/laboratoireController';

const router = Router();

// Catalogue des analyses
router.get('/catalogue', LaboratoireController.getCatalogue);

// Intégrations
router.get('/integrations', LaboratoireController.getIntegrations);

// Prescriptions
router.get('/prescriptions', LaboratoireController.getPrescriptions);
router.get('/prescriptions/:id', LaboratoireController.getPrescriptionById);
router.post('/prescriptions', LaboratoireController.createPrescription);
router.put('/prescriptions/:id/status', LaboratoireController.updatePrescriptionStatus);

// Analyses
router.get('/analyses', LaboratoireController.getAnalyses);
router.post('/analyses', LaboratoireController.createAnalyse);

// Résultats
router.get('/resultats', LaboratoireController.getResultats);
router.post('/resultats', LaboratoireController.validerResultat);

export default router;

