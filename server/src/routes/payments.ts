import { Router } from 'express';
import PaymentController from '../controllers/paymentController';

const router = Router({ mergeParams: true });

router.post('/', PaymentController.create);
router.get('/', PaymentController.listByInvoice);

export default router;

