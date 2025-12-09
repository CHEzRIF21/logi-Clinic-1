import { Router } from 'express';
import CaisseController from '../controllers/caisseController';

const router = Router();

router.get('/journal', CaisseController.getJournal);
router.get('/statistics', CaisseController.getStatistics);
router.post('/entries', CaisseController.createEntry);
router.post('/close', CaisseController.closeCaisse);

export default router;

