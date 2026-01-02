import { Router } from 'express';
import AnamneseTemplateController from '../controllers/anamneseTemplateController';

const router = Router();

router.get('/', AnamneseTemplateController.getAll);
router.get('/:id', AnamneseTemplateController.getById);
router.post('/', AnamneseTemplateController.create);
router.put('/:id', AnamneseTemplateController.update);
router.delete('/:id', AnamneseTemplateController.delete);

export default router;

