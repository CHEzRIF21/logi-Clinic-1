import { Router } from 'express';
import ProductController from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';
import { requireClinicContext } from '../middleware/clinicContext';

const router = Router();

// ✅ TOUTES les routes nécessitent authentification ET contexte de clinique
router.get(
  '/',
  authenticateToken,
  requireClinicContext,
  ProductController.list
);

router.get(
  '/:id',
  authenticateToken,
  requireClinicContext,
  ProductController.getById
);

router.post(
  '/',
  authenticateToken,
  requireClinicContext,
  ProductController.create
);

router.put(
  '/:id',
  authenticateToken,
  requireClinicContext,
  ProductController.update
);

router.delete(
  '/:id',
  authenticateToken,
  requireClinicContext,
  ProductController.delete
);

export default router;

