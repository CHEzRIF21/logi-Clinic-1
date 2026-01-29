import { Router } from 'express';
import InvoiceController from '../controllers/invoiceController';
import { authenticateToken } from '../middleware/auth';
import { requireClinicContext } from '../middleware/clinicContext';

const router = Router();

// ✅ TOUTES les routes nécessitent authentification ET contexte de clinique
router.get(
  '/',
  authenticateToken,
  requireClinicContext,
  InvoiceController.list
);

router.post(
  '/',
  authenticateToken,
  requireClinicContext,
  InvoiceController.create
);

router.get(
  '/:id',
  authenticateToken,
  requireClinicContext,
  InvoiceController.getById
);

router.get(
  '/:id/pdf',
  authenticateToken,
  requireClinicContext,
  InvoiceController.getPDF
);

router.post(
  '/:id/normalize',
  authenticateToken,
  requireClinicContext,
  InvoiceController.normalize
);

router.post(
  '/:id/cancel',
  authenticateToken,
  requireClinicContext,
  InvoiceController.cancel
);

export default router;

