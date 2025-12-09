import { Router } from 'express';
import PatientController from '../controllers/patientController';

const router = Router();

router.get('/', PatientController.search);
router.get('/:id', PatientController.getById);
router.post('/', PatientController.create);
router.put('/:id', PatientController.update);
router.delete('/:id', PatientController.delete);

export default router;

