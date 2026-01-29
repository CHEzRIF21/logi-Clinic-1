import { Router } from 'express';
import CaisseController from '../controllers/caisseController';
import { authenticateToken } from '../middleware/auth';
import { requireClinicContext } from '../middleware/clinicContext';

const router = Router();

// ✅ TOUTES les routes nécessitent authentification ET contexte de clinique
router.get(
  '/journal',
  authenticateToken,
  requireClinicContext,
  CaisseController.getJournal
);

router.get(
  '/statistics',
  authenticateToken,
  requireClinicContext,
  CaisseController.getStatistics
);

router.post(
  '/entries',
  authenticateToken,
  requireClinicContext,
  CaisseController.createEntry
);

router.post(
  '/close',
  authenticateToken,
  requireClinicContext,
  CaisseController.closeCaisse
);

export default router;

