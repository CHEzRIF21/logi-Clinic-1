import prisma from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { calculateInvoiceTotals } from '../utils/calc';
import { generateInvoiceNumber } from '../utils/date';
import SchemaCacheService from './schemaCacheService';
import AuditService from './auditService';

export interface CreateInvoiceInput {
  patientId: string;
  clinicId?: string; // ✅ AJOUTER - Pour vérification
  lines: Array<{
    productId: string;
    qty: number;
    unitPrice: number;
    discount?: number;
    taxSpecifique?: number;
  }>;
  comment?: string;
  createdBy?: string;
  modePayment?: string;
  aib?: string;
  typeFacture?: string;
  operationIds?: string[];
}

export class InvoiceService {
  /**
   * Crée une nouvelle facture avec ses lignes
   * Gère les transactions atomiques et la mise à jour du stock
   */
  static async createInvoice(input: CreateInvoiceInput) {
    return await SchemaCacheService.executeWithRetry(async () => {
      return await prisma.$transaction(async (tx) => {
        // Vérifier que le patient existe ET récupérer son clinic_id
        const patient = await tx.patient.findUnique({
          where: { id: input.patientId },
          select: { id: true, clinicId: true }, // ✅ Récupérer clinic_id
        });

        if (!patient) {
          throw new Error('Patient non trouvé');
        }

        // ✅ Vérifier que le clinic_id du patient correspond
        if (input.clinicId && patient.clinicId !== input.clinicId) {
          throw new Error('Le patient n\'appartient pas à cette clinique');
        }

        // Récupérer les produits et vérifier les stocks
        const productIds = input.lines.map(l => l.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });

        if (products.length !== productIds.length) {
          throw new Error('Un ou plusieurs produits sont introuvables');
        }

        // Vérifier les stocks pour les médicaments
        for (const line of input.lines) {
          const product = products.find(p => p.id === line.productId);
          if (!product) continue;

          if (product.category === 'Medicament') {
            if (product.stockQty < line.qty) {
              throw new Error(
                `Stock insuffisant pour ${product.label}. Stock disponible: ${product.stockQty}, Quantité demandée: ${line.qty}`
              );
            }
          }
        }

        // Calculer les totaux
        const invoiceLines = input.lines.map(line => {
          const product = products.find(p => p.id === line.productId)!;
          const subtotal = line.qty * line.unitPrice;
          const discount = line.discount || 0;
          const discountAmount = subtotal * (discount / 100);
          const afterDiscount = subtotal - discountAmount;
          const taxPercent = product.taxPercent ? Number(product.taxPercent) : 0;
          const taxAmount = afterDiscount * (taxPercent / 100);
          const taxSpecifique = line.taxSpecifique || 0;
          const total = afterDiscount + taxAmount + taxSpecifique;

          return {
            productId: line.productId,
            qty: line.qty,
            unitPrice: line.unitPrice,
            discount: new Decimal(discount),
            tax: new Decimal(taxAmount),
            taxSpecifique: new Decimal(taxSpecifique),
            total: new Decimal(total),
          };
        });

        const totals = calculateInvoiceTotals(
          invoiceLines.map(l => ({
            qty: l.qty,
            unitPrice: Number(l.unitPrice),
            discount: Number(l.discount),
            tax: Number(l.tax),
            total: Number(l.total),
          }))
        );

        // Générer le numéro de facture
        const invoiceNumber = generateInvoiceNumber();

        // Créer la facture avec clinic_id
        const invoice = await tx.invoice.create({
          data: {
            number: invoiceNumber,
            patientId: input.patientId,
            clinicId: patient.clinicId, // ✅ AJOUTER - Depuis le patient
            dateEmission: new Date(),
            totalHT: new Decimal(totals.totalHT),
            totalTax: new Decimal(totals.totalTax),
            totalDiscount: new Decimal(totals.totalDiscount),
            totalTTC: new Decimal(totals.totalTTC),
            amountPaid: new Decimal(0),
            status: 'EN_ATTENTE',
            modePayment: input.modePayment || null,
            aib: input.aib || null,
            typeFacture: input.typeFacture || null,
            comment: input.comment || null,
            createdBy: input.createdBy || null,
            invoiceLines: {
              create: invoiceLines,
            },
          },
          include: {
            invoiceLines: {
              include: {
                product: true,
              },
            },
            patient: true,
          },
        });

        // Mettre à jour les stocks pour les médicaments
        for (const line of input.lines) {
          const product = products.find(p => p.id === line.productId);
          if (product && product.category === 'Medicament') {
            await tx.product.update({
              where: { id: product.id },
              data: {
                stockQty: {
                  decrement: line.qty,
                },
              },
            });
          }
        }

        // Lier les opérations si fournies
        if (input.operationIds && input.operationIds.length > 0) {
          await tx.operation.updateMany({
            where: {
              id: { in: input.operationIds },
            },
            data: {
              invoiceId: invoice.id,
            },
          });
        }

        // Créer un log d'audit
        if (input.createdBy) {
          await AuditService.createLog({
            userId: input.createdBy,
            entity: 'INVOICE',
            entityId: invoice.id,
            action: 'CREATE',
            newValue: invoice,
            invoiceId: invoice.id,
          });
        }

        return invoice;
      });
    });
  }

  /**
   * Normalise une facture (vérifie cohérence, applique règles comptables)
   */
  static async normalizeInvoice(id: string, userId: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      return await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({
          where: { id },
          include: {
            invoiceLines: {
              include: {
                product: true,
              },
            },
            payments: true,
          },
        });

        if (!invoice) {
          throw new Error('Facture non trouvée');
        }

        // Recalculer les totaux
        let totalHT = 0;
        let totalTax = 0;
        let totalDiscount = 0;
        let totalTTC = 0;

        for (const line of invoice.invoiceLines) {
          const subtotal = line.qty * Number(line.unitPrice);
          const discountAmount = subtotal * (Number(line.discount) / 100);
          const afterDiscount = subtotal - discountAmount;
          const taxAmount = afterDiscount * (Number(line.tax) / 100);
          const taxSpecifique = Number(line.taxSpecifique);
          const lineTotal = afterDiscount + taxAmount + taxSpecifique;

          totalHT += afterDiscount;
          totalTax += taxAmount + taxSpecifique;
          totalDiscount += discountAmount;
          totalTTC += lineTotal;
        }

        // Mettre à jour la facture
        const updated = await tx.invoice.update({
          where: { id },
          data: {
            totalHT: new Decimal(totalHT),
            totalTax: new Decimal(totalTax),
            totalDiscount: new Decimal(totalDiscount),
            totalTTC: new Decimal(totalTTC),
            normalized: true,
          },
          include: {
            invoiceLines: {
              include: {
                product: true,
              },
            },
            patient: true,
            payments: true,
          },
        });

        // Log d'audit
        await AuditService.createLog({
          userId,
          entity: 'INVOICE',
          entityId: id,
          action: 'NORMALIZE',
          oldValue: invoice,
          newValue: updated,
          invoiceId: id,
        });

        return updated;
      });
    });
  }

  /**
   * Enregistre une impression de facture
   */
  static async logPrint(id: string, userId: string) {
    await AuditService.createLog({
      userId,
      entity: 'INVOICE',
      entityId: id,
      action: 'PRINT',
      invoiceId: id,
    });
  }

  /**
   * Récupère une facture par son ID
   * ✅ CORRIGÉ: Vérifie que la facture appartient à la clinique
   */
  static async getInvoiceById(id: string, filters?: {
    clinicId?: string;        // ✅ AJOUTER
    isSuperAdmin?: boolean;   // ✅ AJOUTER
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = { id };
      
      // ✅ VÉRIFIER clinic_id SAUF si super admin
      if (!filters?.isSuperAdmin && filters?.clinicId) {
        where.clinicId = filters.clinicId;
      }

      const invoice = await prisma.invoice.findFirst({
        where, // ✅ Utiliser findFirst avec where au lieu de findUnique
        include: {
          patient: {
            include: {
              assurance: true,
            },
          },
          invoiceLines: {
            include: {
              product: true,
            },
            orderBy: {
              product: {
                category: 'asc',
              },
            },
          },
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          operations: {
            include: {
              lines: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!invoice) {
        throw new Error('Facture non trouvée ou accès non autorisé');
      }

      return invoice;
    });
  }

  /**
   * Liste les factures avec filtres et pagination
   * ✅ CORRIGÉ: Filtre par clinic_id pour isolation multi-tenant
   */
  static async listInvoices(filters: {
    clinicId?: string;        // ✅ AJOUTER
    isSuperAdmin?: boolean;   // ✅ AJOUTER
    startDate?: Date;
    endDate?: Date;
    status?: string;
    patientId?: string;
    page?: number;
    limit?: number;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      // ✅ FILTRER PAR clinic_id SAUF si super admin
      if (!filters.isSuperAdmin && filters.clinicId) {
        where.clinicId = filters.clinicId;
      }

      if (filters.startDate || filters.endDate) {
        where.dateEmission = {};
        if (filters.startDate) {
          where.dateEmission.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.dateEmission.lte = filters.endDate;
        }
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.patientId) {
        where.patientId = filters.patientId;
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: {
            patient: {
              include: {
                assurance: true,
              },
            },
            invoiceLines: {
              include: {
                product: true,
              },
            },
            payments: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.invoice.count({ where }),
      ]);

      return {
        invoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  /**
   * Met à jour le statut d'une facture selon le montant payé
   */
  static async updateInvoiceStatus(invoiceId: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          payments: true,
        },
      });

      if (!invoice) {
        throw new Error('Facture non trouvée');
      }

      const totalPaid = invoice.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const totalTTC = Number(invoice.totalTTC);
      const remaining = totalTTC - totalPaid;

      let status = 'EN_ATTENTE';
      if (totalPaid >= totalTTC) {
        status = 'PAYEE';
      } else if (totalPaid > 0) {
        status = 'PARTIELLE';
      }

      // Mettre à jour la facture
      const updated = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: new Decimal(totalPaid),
          status,
        },
      });

      // Mettre à jour le statut des opérations liées
      if (status === 'PAYEE') {
        await prisma.operation.updateMany({
          where: {
            invoiceId: invoiceId,
          },
          data: {
            status: 'PAYEE',
          },
        });
      }

      return updated;
    });
  }

  /**
   * Annule une facture
   */
  static async cancelInvoice(id: string, reason?: string, userId?: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      return await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({
          where: { id },
          include: {
            invoiceLines: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!invoice) {
          throw new Error('Facture non trouvée');
        }

        if (invoice.status === 'ANNULEE') {
          throw new Error('La facture est déjà annulée');
        }

        // Restaurer les stocks pour les médicaments
        for (const line of invoice.invoiceLines) {
          const product = line.product;
          if (product.category === 'Medicament') {
            await tx.product.update({
              where: { id: product.id },
              data: {
                stockQty: {
                  increment: line.qty,
                },
              },
            });
          }
        }

        // Annuler la facture
        const updated = await tx.invoice.update({
          where: { id },
          data: {
            status: 'ANNULEE',
            comment: reason
              ? `${invoice.comment || ''}\n[ANNULÉE] ${reason}`.trim()
              : invoice.comment,
          },
        });

        // Log d'audit
        if (userId) {
          await AuditService.createLog({
            userId,
            entity: 'INVOICE',
            entityId: id,
            action: 'CANCEL',
            oldValue: invoice,
            newValue: updated,
            invoiceId: id,
          });
        }

        return updated;
      });
    });
  }
}

export default InvoiceService;
