import { Router } from 'express';
import UserController from '../controllers/userController';
import { requireAuth } from '../middleware/auth';
import { requireClinicContext } from '../middleware/clinicContext';
import { checkPermission } from '../middleware/permissions';

const router = Router();

// Toutes les routes nécessitent une authentification et un contexte clinique
router.use(requireAuth);
router.use(requireClinicContext);

// Routes de gestion des utilisateurs
router.get('/', checkPermission('users:read'), UserController.list);
router.get('/:id', checkPermission('users:read'), UserController.getById);
router.post('/', checkPermission('users:write'), UserController.create);
router.put('/:id', checkPermission('users:write'), UserController.update);
router.delete('/:id', checkPermission('users:delete'), UserController.delete);

export default router;
