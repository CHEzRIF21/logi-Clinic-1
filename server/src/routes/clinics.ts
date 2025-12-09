import { Router } from 'express';
import ClinicController from '../controllers/clinicController';
import { requireAuth } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(requireAuth);

// Routes publiques (lecture seule pour tous les utilisateurs authentifiés)
router.get('/', ClinicController.list);
router.get('/:id', ClinicController.getById);
router.get('/:id/stats', ClinicController.getStats);

// Routes nécessitant la permission pricing:write (ADMIN uniquement)
router.post('/', checkPermission('pricing:write'), ClinicController.create);
router.put('/:id', checkPermission('pricing:write'), ClinicController.update);
router.delete('/:id', checkPermission('pricing:write'), ClinicController.delete);
router.post('/:id/activate', checkPermission('pricing:write'), ClinicController.activate);
router.post('/:id/deactivate', checkPermission('pricing:write'), ClinicController.deactivate);

export default router;

