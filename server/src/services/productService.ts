import prisma from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';
import SchemaCacheService from './schemaCacheService';

export interface CreateProductInput {
  code?: string;
  label: string;
  category: string;
  subCategory?: string;
  unit: string;
  price: number;
  taxPercent?: number;
  stockQty?: number;
  active?: boolean;
  clinicId?: string; // ✅ AJOUTER - Pour assignation automatique
}

export class ProductService {
  /**
   * Crée un nouveau produit
   * ✅ CORRIGÉ: Assigne automatiquement clinic_id
   */
  static async createProduct(input: CreateProductInput) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Vérifier l'unicité du code si fourni (par clinic_id maintenant)
      if (input.code && input.clinicId) {
        const existing = await prisma.product.findFirst({
          where: { 
            code: input.code,
            clinicId: input.clinicId, // ✅ Filtrer par clinic_id aussi
          },
        });

        if (existing) {
          throw new Error(`Un produit avec le code ${input.code} existe déjà pour cette clinique`);
        }
      }

      const product = await prisma.product.create({
        data: {
          code: input.code || null,
          label: input.label,
          category: input.category,
          subCategory: input.subCategory || null,
          unit: input.unit,
          price: new Decimal(input.price),
          taxPercent: input.taxPercent ? new Decimal(input.taxPercent) : null,
          stockQty: input.stockQty || 0,
          active: input.active !== undefined ? input.active : true,
          clinicId: input.clinicId, // ✅ AJOUTER - Assignation automatique
        },
      });

      return product;
    });
  }

  /**
   * Récupère un produit par son ID
   * ✅ CORRIGÉ: Vérifie que le produit appartient à la clinique
   */
  static async getProductById(id: string, filters?: {
    clinicId?: string;        // ✅ AJOUTER
    isSuperAdmin?: boolean;   // ✅ AJOUTER
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = { id };
      
      // ✅ VÉRIFIER clinic_id SAUF si super admin
      if (!filters?.isSuperAdmin && filters?.clinicId) {
        where.clinicId = filters.clinicId;
      }

      const product = await prisma.product.findFirst({
        where, // ✅ Utiliser findFirst avec where au lieu de findUnique
      });

      if (!product) {
        throw new Error('Produit non trouvé ou accès non autorisé');
      }

      return product;
    });
  }

  /**
   * Liste les produits avec filtres
   * ✅ CORRIGÉ: Filtre par clinic_id pour isolation multi-tenant
   */
  static async listProducts(filters: {
    clinicId?: string;        // ✅ AJOUTER
    isSuperAdmin?: boolean;   // ✅ AJOUTER
    category?: string;
    active?: boolean;
    search?: string;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = {};

      // ✅ FILTRER PAR clinic_id SAUF si super admin
      if (!filters.isSuperAdmin && filters.clinicId) {
        where.clinicId = filters.clinicId;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.active !== undefined) {
        where.active = filters.active;
      }

      if (filters.search) {
        where.OR = [
          { label: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const products = await prisma.product.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { label: 'asc' },
        ],
      });

      return products;
    });
  }

  /**
   * Met à jour un produit
   * ✅ CORRIGÉ: Vérifie l'unicité du code par clinic_id
   */
  static async updateProduct(id: string, updateData: Partial<CreateProductInput>) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Vérifier que le produit existe
      const existing = await prisma.product.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Produit non trouvé');
      }

      // Vérifier l'unicité du code si modifié (par clinic_id maintenant)
      if (updateData.code && updateData.code !== existing.code && existing.clinicId) {
        const codeExists = await prisma.product.findFirst({
          where: { 
            code: updateData.code,
            clinicId: existing.clinicId, // ✅ Filtrer par clinic_id aussi
            id: { not: id }, // Exclure le produit actuel
          },
        });

        if (codeExists) {
          throw new Error(`Un produit avec le code ${updateData.code} existe déjà pour cette clinique`);
        }
      }

      const data: any = {};
      if (updateData.label !== undefined) data.label = updateData.label;
      if (updateData.code !== undefined) data.code = updateData.code || null;
      if (updateData.category !== undefined) data.category = updateData.category;
      if (updateData.subCategory !== undefined) data.subCategory = updateData.subCategory || null;
      if (updateData.unit !== undefined) data.unit = updateData.unit;
      if (updateData.price !== undefined) data.price = new Decimal(updateData.price);
      if (updateData.taxPercent !== undefined) {
        data.taxPercent = updateData.taxPercent ? new Decimal(updateData.taxPercent) : null;
      }
      if (updateData.stockQty !== undefined) data.stockQty = updateData.stockQty;
      if (updateData.active !== undefined) data.active = updateData.active;

      const product = await prisma.product.update({
        where: { id },
        data,
      });

      return product;
    });
  }

  /**
   * Supprime un produit (soft delete en désactivant)
   */
  static async deleteProduct(id: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new Error('Produit non trouvé');
      }

      // Soft delete en désactivant le produit
      return await prisma.product.update({
        where: { id },
        data: {
          active: false,
        },
      });
    });
  }
}

export default ProductService;

