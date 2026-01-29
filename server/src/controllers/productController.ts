import { Request, Response } from 'express';
import ProductService from '../services/productService';
import { ClinicContextRequest } from '../middleware/clinicContext';

export class ProductController {
  /**
   * GET /api/products
   * Liste tous les produits avec filtres
   * ✅ CORRIGÉ: Filtre par clinic_id pour isolation multi-tenant
   */
  static async list(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      const { category, active, search } = req.query;

      const filters: any = {
        clinicId: clinicReq.clinicId,        // ✅ AJOUTER
        isSuperAdmin: clinicReq.isSuperAdmin, // ✅ AJOUTER
      };
      
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
   * ✅ CORRIGÉ: Vérifie que le produit appartient à la clinique
   */
  static async getById(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      const { id } = req.params;

      const product = await ProductService.getProductById(id, {
        clinicId: clinicReq.clinicId,
        isSuperAdmin: clinicReq.isSuperAdmin,
      });

      res.json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') || 
                        error.message.includes('non autorisé') ? 404 : 500;

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
   * ✅ CORRIGÉ: Assigne automatiquement le clinic_id de l'utilisateur
   */
  static async create(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      
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
        clinicId: clinicReq.clinicId, // ✅ AJOUTER - Assignation automatique
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
   * ✅ CORRIGÉ: Vérifie que le produit appartient à la clinique avant modification
   */
  static async update(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      const { id } = req.params;
      const updateData = req.body;

      // ✅ Vérifier d'abord que le produit existe et appartient à la clinique
      await ProductService.getProductById(id, {
        clinicId: clinicReq.clinicId,
        isSuperAdmin: clinicReq.isSuperAdmin,
      });

      const product = await ProductService.updateProduct(id, updateData);

      res.json({
        success: true,
        message: 'Produit mis à jour avec succès',
        data: product,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') || 
                        error.message.includes('non autorisé') ? 404 : 500;

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
   * ✅ CORRIGÉ: Vérifie que le produit appartient à la clinique avant suppression
   */
  static async delete(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      const { id } = req.params;

      // ✅ Vérifier d'abord que le produit existe et appartient à la clinique
      await ProductService.getProductById(id, {
        clinicId: clinicReq.clinicId,
        isSuperAdmin: clinicReq.isSuperAdmin,
      });

      await ProductService.deleteProduct(id);

      res.json({
        success: true,
        message: 'Produit supprimé avec succès',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') || 
                        error.message.includes('non autorisé') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la suppression du produit',
        error: error.message,
      });
    }
  }
}

export default ProductController;

