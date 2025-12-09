import { Request, Response } from 'express';
import ProductService from '../services/productService';

export class ProductController {
  /**
   * GET /api/products
   * Liste tous les produits avec filtres
   */
  static async list(req: Request, res: Response) {
    try {
      const { category, active, search } = req.query;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (active !== undefined) filters.active = active === 'true';
      if (search) {
        filters.search = search as string;
      }

      const products = await ProductService.listProducts(filters);

      res.json({
        success: true,
        data: products,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des produits',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/products/:id
   * Récupère un produit par son ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await ProductService.getProductById(id);

      res.json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération du produit',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/products
   * Crée un nouveau produit
   */
  static async create(req: Request, res: Response) {
    try {
      const {
        code,
        label,
        category,
        subCategory,
        unit,
        price,
        taxPercent,
        stockQty,
        active,
      } = req.body;

      // Validation
      if (!label || !category || !unit || price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Les champs label, category, unit et price sont requis',
        });
      }

      const product = await ProductService.createProduct({
        code,
        label,
        category,
        subCategory,
        unit,
        price,
        taxPercent,
        stockQty,
        active,
      });

      res.status(201).json({
        success: true,
        message: 'Produit créé avec succès',
        data: product,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('déjà') ||
                        error.message.includes('requis')
        ? 400
        : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la création du produit',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/products/:id
   * Met à jour un produit
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await ProductService.updateProduct(id, updateData);

      res.json({
        success: true,
        message: 'Produit mis à jour avec succès',
        data: product,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du produit',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/products/:id
   * Supprime un produit (soft delete)
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await ProductService.deleteProduct(id);

      res.json({
        success: true,
        message: 'Produit supprimé avec succès',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la suppression du produit',
        error: error.message,
      });
    }
  }
}

export default ProductController;

