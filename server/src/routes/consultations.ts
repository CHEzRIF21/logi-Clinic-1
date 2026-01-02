import { Router } from 'express';
import ConsultationController from '../controllers/consultationController';

const router = Router();

// Liste des consultations avec filtres
router.get('/', ConsultationController.list);

// Statistiques (doit être avant :id pour éviter le conflit)
router.get('/stats', ConsultationController.getStats);

// Prescriptions
router.get('/prescriptions', ConsultationController.getPrescriptions);
router.get('/prescriptions/:prescriptionId', ConsultationController.getPrescriptionById);

// Demandes de laboratoire
router.get('/lab-requests', ConsultationController.getLabRequests);

// Demandes d'imagerie
router.get('/imaging-requests', ConsultationController.getImagingRequests);

// Protocoles par ID
router.get('/protocols/:protocolId', ConsultationController.getProtocolById);

// CRUD consultation
router.get('/:id', ConsultationController.getById);
router.post('/', ConsultationController.create);
router.put('/:id', ConsultationController.update);
router.post('/:id/close', ConsultationController.close);

// Constantes
router.get('/:id/constantes', ConsultationController.getConstantes);
router.post('/:id/constantes', ConsultationController.saveConstantes);

// Entries (historique)
router.get('/:id/entries', ConsultationController.getEntries);
router.post('/:id/entries', ConsultationController.addEntry);

// Protocoles
router.get('/:id/protocols', ConsultationController.getProtocols);
router.post('/:id/protocols', ConsultationController.createProtocol);

// Prescriptions par consultation
router.post('/:id/prescriptions', ConsultationController.createPrescription);

// Demandes labo/imagerie par consultation
router.post('/:id/lab-requests', ConsultationController.createLabRequest);
router.post('/:id/imaging-requests', ConsultationController.createImagingRequest);

export default router;

