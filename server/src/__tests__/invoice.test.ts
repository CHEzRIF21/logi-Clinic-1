import request from 'supertest';
import app from '../index';
import prisma from '../prisma';

describe('Invoice API', () => {
  let testPatientId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Créer un patient de test
    const patient = await prisma.patient.create({
      data: {
        firstName: 'Test',
        lastName: 'Patient',
        sex: 'M',
        dob: new Date('1990-01-01'),
      },
    });
    testPatientId = patient.id;

    // Créer un produit de test
    const product = await prisma.product.create({
      data: {
        label: 'Test Product',
        category: 'Acte',
        unit: 'unité',
        price: 1000,
        stockQty: 100,
      },
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await prisma.invoice.deleteMany({});
    await prisma.patient.delete({ where: { id: testPatientId } });
    await prisma.product.delete({ where: { id: testProductId } });
    await prisma.$disconnect();
  });

  describe('POST /api/invoices', () => {
    it('devrait créer une facture avec succès', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .send({
          patientId: testPatientId,
          lines: [
            {
              productId: testProductId,
              qty: 1,
              unitPrice: 1000,
              discount: 0,
            },
          ],
          modePayment: 'ESPECE',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('number');
    });

    it('devrait retourner une erreur si le patient est manquant', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .send({
          lines: [
            {
              productId: testProductId,
              qty: 1,
              unitPrice: 1000,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/invoices', () => {
    it('devrait retourner la liste des factures', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});

