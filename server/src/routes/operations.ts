import { Router } from 'express';
import OperationController from '../controllers/operationController';
import { authenticateToken } from '../middleware/auth';
import { requireClinicContext } from '../middleware/clinicContext';

const router = Router();

// ✅ TOUTES les routes nécessitent authentification ET contexte de clinique
router.get(
  '/',
  authenticateToken,
  requireClinicContext,
  OperationController.list
);

router.post(
  '/',
  authenticateToken,
  requireClinicContext,
  OperationController.create
);

router.get(
  '/:id',
  authenticateToken,
  requireClinicContext,
  OperationController.getById
);

export default router;

