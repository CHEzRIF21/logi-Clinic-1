import { Router } from 'express';
import ExportController from '../controllers/exportController';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = Router();

router.get(
  '/accounting',
  authenticateToken,
  checkPermission('reports:read'),
  ExportController.exportAccounting
);

router.get(
  '/caisse-journal',
  authenticateToken,
  checkPermission('caisse:read'),
  ExportController.exportCaisseJournal
);

export default router;

