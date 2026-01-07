import { Router } from 'express';
import { ConfigurationController } from '../controllers/configurationController';
import { requireAuth, requireClinicContext } from '../middleware/auth';

const router = Router();

// Authentification obligatoire pour toutes les routes
router.use(requireAuth);
router.use(requireClinicContext);

// Routes de configuration de facturation
router.get('/billing', ConfigurationController.getBillingSettings);
router.put('/billing', ConfigurationController.updateBillingSettings);

export default router;

