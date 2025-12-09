import { Router } from 'express';
import StatsController from '../controllers/statsController';

const router = Router();

router.get('/finance', StatsController.getFinanceStats);
router.get('/dashboard', StatsController.getDashboardStats);

export default router;

