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
}

export class ProductService {
  /**
   * Crée un nouveau produit
   */
  static async createProduct(input: CreateProductInput) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Vérifier l'unicité du code si fourni
      if (input.code) {
        const existing = await prisma.product.findUnique({
          where: { code: input.code },
        });

        if (existing) {
          throw new Error(`Un produit avec le code ${input.code} existe déjà`);
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
        },
      });

      return product;
    });
  }

  /**
   * Récupère un produit par son ID
   */
  static async getProductById(id: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new Error('Produit non trouvé');
      }

      return product;
    });
  }

  /**
   * Liste les produits avec filtres
   */
  static async listProducts(filters: {
    category?: string;
    active?: boolean;
    search?: string;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = {};

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

      // Vérifier l'unicité du code si modifié
      if (updateData.code && updateData.code !== existing.code) {
        const codeExists = await prisma.product.findUnique({
          where: { code: updateData.code },
        });

        if (codeExists) {
          throw new Error(`Un produit avec le code ${updateData.code} existe déjà`);
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

