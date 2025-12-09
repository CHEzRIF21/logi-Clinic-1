import { Router } from 'express';
import ReportingController from '../controllers/reportingController';

const router = Router();

router.get('/sales-by-category', ReportingController.getSalesByCategory);
router.get('/unpaid-operations', ReportingController.getUnpaidOperations);
router.get('/receivables', ReportingController.getReceivables);
router.get('/top-products', ReportingController.getTopProducts);
router.get('/entries-exits', ReportingController.getEntriesExits);

export default router;

