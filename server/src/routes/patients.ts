import { Router } from 'express';
import PatientController from '../controllers/patientController';
import { authenticateToken } from '../middleware/auth';
import { requireClinicContext } from '../middleware/clinicContext';

const router = Router();

// ✅ TOUTES les routes nécessitent authentification ET contexte de clinique
router.get(
  '/',
  authenticateToken,
  requireClinicContext,
  PatientController.search
);

router.get(
  '/:id',
  authenticateToken,
  requireClinicContext,
  PatientController.getById
);

router.post(
  '/',
  authenticateToken,
  requireClinicContext,
  PatientController.create
);

router.put(
  '/:id',
  authenticateToken,
  requireClinicContext,
  PatientController.update
);

router.delete(
  '/:id',
  authenticateToken,
  requireClinicContext,
  PatientController.delete
);

export default router;

