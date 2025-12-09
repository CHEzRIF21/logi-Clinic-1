import { Router } from 'express';
import LigneBudgetaireController from '../controllers/ligneBudgetaireController';

const router = Router();

router.get('/', LigneBudgetaireController.list);
router.get('/:id', LigneBudgetaireController.getById);
router.post('/', LigneBudgetaireController.create);
router.put('/:id', LigneBudgetaireController.update);
router.delete('/:id', LigneBudgetaireController.delete);

export default router;

