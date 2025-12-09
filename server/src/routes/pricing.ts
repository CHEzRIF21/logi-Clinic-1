import { Router } from 'express';
import PricingController from '../controllers/pricingController';
import { requireAuth } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(requireAuth);

// Routes de lecture (tous les utilisateurs authentifiés peuvent lire)
router.get('/pricing/default', PricingController.getDefaultPricing);
router.get('/pricing/service/:serviceId', PricingController.getPricingForService);
router.get('/clinics/:id/pricing', PricingController.getClinicPricing);
router.get('/clinics/:id/pricing/summary', PricingController.getClinicPricingSummary);
router.get('/clinics/:id/pricing/history', PricingController.getPricingHistory);

// Routes d'écriture (ADMIN uniquement)
router.post('/clinics/:id/pricing', checkPermission('pricing:write'), PricingController.upsertPricing);
router.delete('/clinics/:id/pricing/:serviceId', checkPermission('pricing:write'), PricingController.deletePricing);
router.put('/pricing/default/:serviceId', checkPermission('pricing:write'), PricingController.updateDefaultPricing);

export default router;

