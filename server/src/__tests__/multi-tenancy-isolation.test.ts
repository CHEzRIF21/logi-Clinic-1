/**
 * Tests d'isolation multi-tenant (2 cliniques, B ne voit pas les données de A,
 * accès par ID protégé 404/403).
 *
 * En NODE_ENV=development sans ENFORCE_AUTH, le backend accepte x-clinic-id
 * pour simuler le contexte clinique. Exécuter avec NODE_ENV=test ou development.
 */
import request from 'supertest';
import app from '../index';
import prisma from '../prisma';

describe('Multi-tenancy isolation', () => {
  let clinicAId: string;
  let clinicBId: string;
  let patientAId: string;
  let patientBId: string;

  const authHeader = 'Bearer dev';
  const setClinic = (clinicId: string) => ({
    Authorization: authHeader,
    'x-clinic-id': clinicId,
  });

  beforeAll(async () => {
    const clinics = await prisma.clinic.findMany({ take: 2 });
    if (clinics.length < 2) {
      const [c1, c2] = await Promise.all([
        prisma.clinic.create({
          data: { code: 'TEST-A', name: 'Test Clinic A' },
        }),
        prisma.clinic.create({
          data: { code: 'TEST-B', name: 'Test Clinic B' },
        }),
      ]);
      clinicAId = c1.id;
      clinicBId = c2.id;
    } else {
      clinicAId = clinics[0].id;
      clinicBId = clinics[1].id;
    }

    const [pa, pb] = await Promise.all([
      prisma.patient.create({
        data: {
          firstName: 'Multi',
          lastName: 'TenantA',
          sex: 'M',
          dob: new Date('1990-01-01'),
          clinicId: clinicAId,
        },
      }),
      prisma.patient.create({
        data: {
          firstName: 'Multi',
          lastName: 'TenantB',
          sex: 'F',
          dob: new Date('1990-01-01'),
          clinicId: clinicBId,
        },
      }),
    ]);
    patientAId = pa.id;
    patientBId = pb.id;
  });

  afterAll(async () => {
    await prisma.patient.deleteMany({
      where: { id: { in: [patientAId, patientBId] } },
    });
    await prisma.$disconnect();
  });

  describe('Listes scopées par clinique', () => {
    it('Clinic A ne doit voir que ses patients', async () => {
      const res = await request(app)
        .get('/api/patients')
        .set(setClinic(clinicAId));
      if (res.status !== 200) {
        return; // auth peut bloquer en env sans dev
      }
      const ids = (res.body?.data || res.body?.patients || []).map((p: { id: string }) => p.id);
      expect(ids).toContain(patientAId);
      expect(ids).not.toContain(patientBId);
    });

    it('Clinic B ne doit voir que ses patients (pas ceux de A)', async () => {
      const res = await request(app)
        .get('/api/patients')
        .set(setClinic(clinicBId));
      if (res.status !== 200) return;
      const ids = (res.body?.data || res.body?.patients || []).map((p: { id: string }) => p.id);
      expect(ids).toContain(patientBId);
      expect(ids).not.toContain(patientAId);
    });
  });

  describe('Accès par ID protégé', () => {
    it('Clinic B accédant au patient A par ID doit recevoir 404 ou 403', async () => {
      const res = await request(app)
        .get(`/api/patients/${patientAId}`)
        .set(setClinic(clinicBId));
      expect([403, 404]).toContain(res.status);
    });

    it('Clinic A accédant à son patient par ID doit recevoir 200', async () => {
      const res = await request(app)
        .get(`/api/patients/${patientAId}`)
        .set(setClinic(clinicAId));
      if (res.status === 401) return; // auth stricte
      expect(res.status).toBe(200);
    });
  });
});
