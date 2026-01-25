import { Router } from 'express';
import StatsController from '../controllers/statsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/finance', StatsController.getFinanceStats);
router.get('/dashboard', StatsController.getDashboardStats);

export default router;

