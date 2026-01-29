import { Router } from 'express';
import PaymentController from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';
import { requireClinicContext } from '../middleware/clinicContext';

const router = Router({ mergeParams: true });

// ✅ TOUTES les routes nécessitent authentification ET contexte de clinique
router.post(
  '/',
  authenticateToken,
  requireClinicContext,
  PaymentController.create
);

router.get(
  '/',
  authenticateToken,
  requireClinicContext,
  PaymentController.listByInvoice
);

export default router;

