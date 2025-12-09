import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  // Créer un utilisateur admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinic.local' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Administrateur',
      email: 'admin@clinic.local',
      password: '$2b$10$rOzJqJqJqJqJqJqJqJqJqO', // hash bcrypt pour "admin123"
      role: 'ADMIN',
    },
  });

  console.log('✅ Utilisateur admin créé:', admin.email);

  // Créer des produits
  const products = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      code: 'CONS-GEN',
      label: 'Consultation Générale',
      category: 'Acte',
      subCategory: null,
      unit: 'unité',
      price: new Decimal(2000.00),
      taxPercent: new Decimal(0),
      stockQty: 0,
      active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      code: 'CONS-SPEC',
      label: 'Consultation Spécialisée',
      category: 'Acte',
      subCategory: null,
      unit: 'unité',
      price: new Decimal(5000.00),
      taxPercent: new Decimal(0),
      stockQty: 0,
      active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      code: 'PARA-500',
      label: 'Paracétamol 500mg',
      category: 'Medicament',
      subCategory: 'Antalgique',
      unit: 'boîte',
      price: new Decimal(500.00),
      taxPercent: new Decimal(0),
      stockQty: 150,
      active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      code: 'AMOX-500',
      label: 'Amoxicilline 500mg',
      category: 'Medicament',
      subCategory: 'Antibiotique',
      unit: 'boîte',
      price: new Decimal(1200.00),
      taxPercent: new Decimal(0),
      stockQty: 80,
      active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      code: 'LAB-NFS',
      label: 'Numération Formule Sanguine',
      category: 'Examen',
      subCategory: 'Hématologie',
      unit: 'unité',
      price: new Decimal(3000.00),
      taxPercent: new Decimal(0),
      stockQty: 0,
      active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000006',
      code: 'LAB-GLY',
      label: 'Glycémie',
      category: 'Examen',
      subCategory: 'Biochimie',
      unit: 'unité',
      price: new Decimal(1500.00),
      taxPercent: new Decimal(0),
      stockQty: 0,
      active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000007',
      code: 'CHAM-SIMP',
      label: 'Chambre Simple',
      category: 'Chambre',
      subCategory: null,
      unit: 'jour',
      price: new Decimal(5000.00),
      taxPercent: new Decimal(0),
      stockQty: 10,
      active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000008',
      code: 'CONS-1',
      label: 'Consommable Médical',
      category: 'Consommable',
      subCategory: null,
      unit: 'unité',
      price: new Decimal(500.00),
      taxPercent: new Decimal(0),
      stockQty: 200,
      active: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  console.log(`✅ ${products.length} produits créés`);

  // Créer des patients
  const patients = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      firstName: 'Fatou',
      lastName: 'TRAORE',
      sex: 'F',
      dob: new Date('1990-05-15'),
      phones: ['70123456'],
      address: 'Abidjan, Cocody',
      ifu: null,
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      firstName: 'Moussa',
      lastName: 'DIABATE',
      sex: 'M',
      dob: new Date('1985-12-03'),
      phones: ['70234567'],
      address: 'Abidjan, Yopougon',
      ifu: null,
    },
  ];

  for (const patient of patients) {
    await prisma.patient.upsert({
      where: { id: patient.id },
      update: patient,
      create: patient,
    });
  }

  console.log(`✅ ${patients.length} patients créés`);

  // Créer des opérations
  const operation1 = await prisma.operation.create({
    data: {
      reference: 'OP-20241220-001',
      patientId: patients[0].id,
      status: 'EN_ATTENTE',
      createdBy: admin.id,
      lines: {
        create: [
          {
            productId: products[0].id,
            qty: 1,
            unitPrice: products[0].price,
            total: products[0].price,
          },
          {
            productId: products[2].id,
            qty: 2,
            unitPrice: products[2].price,
            total: new Decimal(Number(products[2].price) * 2),
          },
        ],
      },
    },
  });

  const operation2 = await prisma.operation.create({
    data: {
      reference: 'OP-20241220-002',
      patientId: patients[0].id,
      status: 'EN_ATTENTE',
      createdBy: admin.id,
      lines: {
        create: [
          {
            productId: products[4].id,
            qty: 1,
            unitPrice: products[4].price,
            total: products[4].price,
          },
        ],
      },
    },
  });

  const operation3 = await prisma.operation.create({
    data: {
      reference: 'OP-20241220-003',
      patientId: patients[1].id,
      status: 'EN_ATTENTE',
      createdBy: admin.id,
      lines: {
        create: [
          {
            productId: products[1].id,
            qty: 1,
            unitPrice: products[1].price,
            total: products[1].price,
          },
          {
            productId: products[3].id,
            qty: 1,
            unitPrice: products[3].price,
            total: products[3].price,
          },
        ],
      },
    },
  });

  console.log('✅ Opérations créées');

  // Créer des factures
  const invoice1 = await prisma.invoice.create({
    data: {
      number: 'FAC-202412-0001',
      patientId: patients[0].id,
      totalHT: new Decimal(3000.00),
      totalTax: new Decimal(0),
      totalDiscount: new Decimal(0),
      totalTTC: new Decimal(3000.00),
      amountPaid: new Decimal(3000.00),
      status: 'PAYEE',
      modePayment: 'ESPECE',
      createdBy: admin.id,
      invoiceLines: {
        create: [
          {
            productId: products[0].id,
            qty: 1,
            unitPrice: products[0].price,
            discount: new Decimal(0),
            tax: new Decimal(0),
            total: products[0].price,
          },
          {
            productId: products[2].id,
            qty: 2,
            unitPrice: products[2].price,
            discount: new Decimal(0),
            tax: new Decimal(0),
            total: new Decimal(Number(products[2].price) * 2),
          },
        ],
      },
      operations: {
        connect: { id: operation1.id },
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: new Decimal(3000.00),
      method: 'ESPECE',
      createdBy: admin.id,
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      number: 'FAC-202412-0002',
      patientId: patients[1].id,
      totalHT: new Decimal(6200.00),
      totalTax: new Decimal(0),
      totalDiscount: new Decimal(0),
      totalTTC: new Decimal(6200.00),
      amountPaid: new Decimal(3000.00),
      status: 'PARTIELLE',
      modePayment: 'CARTE',
      createdBy: admin.id,
      invoiceLines: {
        create: [
          {
            productId: products[1].id,
            qty: 1,
            unitPrice: products[1].price,
            discount: new Decimal(0),
            tax: new Decimal(0),
            total: products[1].price,
          },
          {
            productId: products[3].id,
            qty: 1,
            unitPrice: products[3].price,
            discount: new Decimal(0),
            tax: new Decimal(0),
            total: products[3].price,
          },
        ],
      },
      operations: {
        connect: { id: operation3.id },
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      amount: new Decimal(3000.00),
      method: 'CARTE',
      reference: 'CARTE-001',
      createdBy: admin.id,
    },
  });

  console.log('✅ Factures créées');

  console.log('✅ Seed terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

