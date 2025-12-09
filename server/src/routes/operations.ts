import { Router } from 'express';
import OperationController from '../controllers/operationController';

const router = Router();

router.get('/', OperationController.list);
router.post('/', OperationController.create);
router.get('/:id', OperationController.getById);

export default router;

