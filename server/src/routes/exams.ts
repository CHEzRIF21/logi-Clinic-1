import { Router } from 'express';
import { ExamCatalogController } from '../controllers/examCatalogController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(requireAuth);

// Routes
router.get('/', ExamCatalogController.list);
router.get('/:id', ExamCatalogController.getById);
router.post('/', ExamCatalogController.create);
router.put('/:id', ExamCatalogController.update);
router.delete('/:id', ExamCatalogController.archive);

export default router;

