import { Router } from 'express';
import AuditController from '../controllers/auditController';

const router = Router();

router.get('/', AuditController.getLogs);

export default router;

