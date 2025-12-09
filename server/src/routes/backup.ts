import { Router } from 'express';
import BackupController from '../controllers/backupController';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = Router();

router.post(
  '/create',
  authenticateToken,
  checkPermission('audit:read'), // Seul admin peut créer des sauvegardes
  BackupController.createBackup
);

router.get(
  '/list',
  authenticateToken,
  checkPermission('audit:read'),
  BackupController.listBackups
);

router.post(
  '/restore',
  authenticateToken,
  checkPermission('audit:read'),
  BackupController.restoreBackup
);

export default router;

