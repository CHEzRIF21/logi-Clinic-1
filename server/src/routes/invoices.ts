import { Router } from 'express';
import InvoiceController from '../controllers/invoiceController';

const router = Router();

router.get('/', InvoiceController.list);
router.post('/', InvoiceController.create);
router.get('/:id', InvoiceController.getById);
router.get('/:id/pdf', InvoiceController.getPDF);
router.post('/:id/normalize', InvoiceController.normalize);
router.post('/:id/cancel', InvoiceController.cancel);

export default router;

