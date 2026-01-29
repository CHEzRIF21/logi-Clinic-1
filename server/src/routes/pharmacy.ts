import { Router } from 'express';
import PharmacyController from '../controllers/pharmacyController';
import { authenticateToken } from '../middleware/auth';
import { requireClinicContext } from '../middleware/clinicContext';

const router = Router();

// ✅ TOUTES les routes nécessitent authentification ET contexte de clinique
router.use(authenticateToken);
router.use(requireClinicContext);

// Produits (Catalogue médicaments)
router.get('/products', PharmacyController.getProducts);
router.get('/products/:id', PharmacyController.getProductById);
router.post('/products', PharmacyController.createProduct);
router.put('/products/:id', PharmacyController.updateProduct);
router.delete('/products/:id', PharmacyController.deleteProduct);
router.post('/products/import', PharmacyController.importProducts);
router.get('/products/export', PharmacyController.exportProducts);

// Lots & Stock
router.post('/lots', PharmacyController.createLot);
router.get('/lots', PharmacyController.getLots);
router.get('/lots/:id', PharmacyController.getLotById);
router.put('/lots/:id', PharmacyController.updateLot);
router.post('/stock/movement', PharmacyController.createStockMovement);
router.get('/stock/movements', PharmacyController.getStockMovements);
router.get('/stock/inventory', PharmacyController.getInventory);

// Commandes fournisseurs
router.post('/orders', PharmacyController.createOrder);
router.get('/orders', PharmacyController.getOrders);
router.get('/orders/:id', PharmacyController.getOrderById);
router.put('/orders/:id', PharmacyController.updateOrder);
router.put('/orders/:id/receive', PharmacyController.receiveOrder);
router.delete('/orders/:id', PharmacyController.cancelOrder);

// Fournisseurs
router.get('/suppliers', PharmacyController.getSuppliers);
router.post('/suppliers', PharmacyController.createSupplier);
router.put('/suppliers/:id', PharmacyController.updateSupplier);
router.delete('/suppliers/:id', PharmacyController.deleteSupplier);

// Catégories
router.get('/categories', PharmacyController.getCategories);
router.post('/categories', PharmacyController.createCategory);
router.put('/categories/:id', PharmacyController.updateCategory);
router.delete('/categories/:id', PharmacyController.deleteCategory);

// Dashboard & Alertes
router.get('/dashboard', PharmacyController.getDashboard);
router.get('/alerts', PharmacyController.getAlerts);

// Paramètres pharmacie
router.get('/settings', PharmacyController.getSettings);
router.put('/settings', PharmacyController.updateSettings);

// Prescriptions (file d'attente)
router.get('/prescriptions/queue', PharmacyController.getPrescriptionQueue);
router.post('/prescriptions/queue/:id/reserve', PharmacyController.reservePrescription);
router.post('/prescriptions/queue/:id/dispense', PharmacyController.dispensePrescription);

export default router;


