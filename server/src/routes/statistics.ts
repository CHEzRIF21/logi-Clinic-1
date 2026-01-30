import { Router } from 'express';
import StatsController from '../controllers/statsController';
import { requireAuth } from '../middleware/auth';
import { requireClinicContext } from '../middleware/clinicContext';

const router = Router();

router.use(requireAuth);
router.use(requireClinicContext);
router.get('/finance', StatsController.getFinanceStats);
router.get('/dashboard', StatsController.getDashboardStats);

export default router;

