import { Request, Response } from 'express';
import prisma from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';

export default class PharmacyController {
  /**
   * GET /api/pharmacy/products
   * Liste tous les produits avec filtres et pagination
   */
  static async getProducts(req: Request, res: Response) {
    try {
      const {
        category,
        search,
        page = '1',
        limit = '20',
        expired,
        nearExpireDays,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        category: category || undefined,
      };

      if (search) {
        where.OR = [
          { label: { contains: search as string, mode: 'insensitive' } },
          { code: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const products = await prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          lots: {
            where: {
              status: { not: 'EPUISE' },
            },
            orderBy: {
              datePeremption: 'asc',
            },
          },
        },
        orderBy: {
          label: 'asc',
        },
      });

      // Calculer quantités disponibles et dates de péremption
      const productsWithStock = products.map((product) => {
        const availableLots = product.lots.filter(
          (lot) => lot.quantity > lot.quantityUsed
        );
        const totalQty = availableLots.reduce(
          (sum, lot) => sum + (lot.quantity - lot.quantityUsed),
          0
        );
        const nextExpiration = availableLots.length > 0
          ? availableLots[0].datePeremption
          : null;

        return {
          ...product,
          availableQuantity: totalQty,
          nextExpiration,
        };
      });

      // Filtrer par péremption si demandé
      let filteredProducts = productsWithStock;
      if (expired === 'true') {
        const today = new Date();
        filteredProducts = productsWithStock.filter((p) =>
          p.nextExpiration && p.nextExpiration < today
        );
      } else if (nearExpireDays) {
        const days = parseInt(nearExpireDays as string);
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + days);
        filteredProducts = productsWithStock.filter(
          (p) =>
            p.nextExpiration &&
            p.nextExpiration <= thresholdDate &&
            p.nextExpiration > new Date()
        );
      }

      const total = await prisma.product.count({ where });

      res.json({
        success: true,
        data: filteredProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
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
   * GET /api/pharmacy/products/:id
   * Récupère un produit avec ses lots et mouvements
   */
  static async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          lots: {
            orderBy: {
              datePeremption: 'asc',
            },
          },
          stockMovements: {
            take: 50,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              lot: true,
            },
          },
        },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé',
        });
      }

      // Calculer quantité disponible
      const availableLots = product.lots.filter(
        (lot) => lot.quantity > lot.quantityUsed
      );
      const availableQuantity = availableLots.reduce(
        (sum, lot) => sum + (lot.quantity - lot.quantityUsed),
        0
      );

      res.json({
        success: true,
        data: {
          ...product,
          availableQuantity,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du produit',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/pharmacy/products
   * Crée un nouveau produit
   */
  static async createProduct(req: Request, res: Response) {
    try {
      const {
        code,
        label,
        category,
        form,
        dosage,
        unit,
        packaging,
        manufacturer,
        pricePublic,
        priceCession,
        minStock,
        taxPercent,
      } = req.body;

      const product = await prisma.product.create({
        data: {
          code: code || undefined,
          label,
          category,
          form,
          dosage,
          unit,
          packaging,
          manufacturer,
          pricePublic: pricePublic ? new Decimal(pricePublic) : null,
          priceCession: priceCession ? new Decimal(priceCession) : null,
          minStock: minStock || 0,
          taxPercent: taxPercent ? new Decimal(taxPercent) : null,
          price: priceCession ? new Decimal(priceCession) : new Decimal(0),
        },
      });

      res.status(201).json({
        success: true,
        message: 'Produit créé avec succès',
        data: product,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Un produit avec ce code existe déjà',
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du produit',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/pharmacy/products/:id
   * Met à jour un produit
   */
  static async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData: any = {};

      const allowedFields = [
        'label',
        'category',
        'form',
        'dosage',
        'unit',
        'packaging',
        'manufacturer',
        'pricePublic',
        'priceCession',
        'minStock',
        'taxPercent',
        'active',
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          if (field === 'pricePublic' || field === 'priceCession' || field === 'taxPercent') {
            updateData[field] = new Decimal(req.body[field]);
          } else {
            updateData[field] = req.body[field];
          }
        }
      });

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        message: 'Produit mis à jour avec succès',
        data: product,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé',
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du produit',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/pharmacy/products/:id
   * Supprime un produit
   */
  static async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Vérifier s'il y a des lots actifs
      const lotsCount = await prisma.lot.count({
        where: {
          productId: id,
          quantity: { gt: 0 },
        },
      });

      if (lotsCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer un produit avec des lots actifs',
        });
      }

      await prisma.product.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Produit supprimé avec succès',
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé',
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du produit',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/pharmacy/lots
   * Crée un nouveau lot (réception stock)
   */
  static async createLot(req: Request, res: Response) {
    try {
      const {
        productId,
        lotNumber,
        quantity,
        unitCost,
        datePeremption,
        source,
      } = req.body;

      // Vérifier que le produit existe
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé',
        });
      }

      // Vérifier unicité lotNumber + productId
      const existingLot = await prisma.lot.findFirst({
        where: {
          productId,
          lotNumber,
        },
      });

      if (existingLot) {
        return res.status(400).json({
          success: false,
          message: 'Un lot avec ce numéro existe déjà pour ce produit',
        });
      }

      const today = new Date();
      const expirationDate = new Date(datePeremption);
      const status = expirationDate < today ? 'QUARANTAINE' : 'ACTIF';

      // Créer le lot
      const lot = await prisma.lot.create({
        data: {
          productId,
          lotNumber,
          quantity,
          quantityUsed: 0,
          unitCost: new Decimal(unitCost),
          dateEntry: today,
          datePeremption: expirationDate,
          source,
          status,
        },
      });

      // Créer mouvement de stock IN
      await prisma.stockMovement.create({
        data: {
          productId,
          lotId: lot.id,
          type: 'IN',
          qty: quantity,
          unitPrice: new Decimal(unitCost),
          createdBy: req.body.createdBy || 'system',
          reason: `Réception lot ${lotNumber}`,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Lot créé avec succès',
        data: lot,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du lot',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/pharmacy/lots
   * Liste les lots avec filtres
   */
  static async getLots(req: Request, res: Response) {
    try {
      const {
        productId,
        expired,
        nearExpireDays,
        status,
      } = req.query;

      const where: any = {};

      if (productId) where.productId = productId as string;
      if (status) where.status = status as string;

      if (expired === 'true') {
        where.datePeremption = { lt: new Date() };
      } else if (nearExpireDays) {
        const days = parseInt(nearExpireDays as string);
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + days);
        where.datePeremption = {
          lte: thresholdDate,
          gte: new Date(),
        };
      }

      const lots = await prisma.lot.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              label: true,
              code: true,
            },
          },
        },
        orderBy: {
          datePeremption: 'asc',
        },
      });

      res.json({
        success: true,
        data: lots,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des lots',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/pharmacy/lots/:id
   * Récupère un lot par ID
   */
  static async getLotById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const lot = await prisma.lot.findUnique({
        where: { id },
        include: {
          product: true,
          stockMovements: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!lot) {
        return res.status(404).json({
          success: false,
          message: 'Lot non trouvé',
        });
      }

      res.json({
        success: true,
        data: lot,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du lot',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/pharmacy/stock/movement
   * Crée un mouvement de stock
   */
  static async createStockMovement(req: Request, res: Response) {
    try {
      const {
        productId,
        lotId,
        type,
        qty,
        unitPrice,
        reference,
        reason,
        createdBy,
      } = req.body;

      // Vérifier le produit
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé',
        });
      }

      // Pour les sorties, vérifier le stock disponible
      if (type === 'OUT') {
        if (lotId) {
          const lot = await prisma.lot.findUnique({
            where: { id: lotId },
          });

          if (!lot) {
            return res.status(404).json({
              success: false,
              message: 'Lot non trouvé',
            });
          }

          const available = lot.quantity - lot.quantityUsed;
          if (qty > available) {
            return res.status(400).json({
              success: false,
              message: `Stock insuffisant pour ce lot. Disponible: ${available}`,
            });
          }

          // Mettre à jour quantité utilisée
          await prisma.lot.update({
            where: { id: lotId },
            data: {
              quantityUsed: { increment: qty },
              status: lot.quantity - lot.quantityUsed - qty === 0 ? 'EPUISE' : lot.status,
            },
          });
        } else {
          // FIFO: trouver les lots disponibles
          const availableLots = await prisma.lot.findMany({
            where: {
              productId,
              status: { not: 'EXPIRED' },
            },
            orderBy: {
              datePeremption: 'asc',
            },
          });

          let remainingQty = qty;
          const lotsToUpdate: Array<{ id: string; qty: number }> = [];

          for (const lot of availableLots) {
            if (remainingQty <= 0) break;
            const available = lot.quantity - lot.quantityUsed;
            if (available > 0) {
              const toUse = Math.min(remainingQty, available);
              lotsToUpdate.push({ id: lot.id, qty: toUse });
              remainingQty -= toUse;
            }
          }

          if (remainingQty > 0) {
            return res.status(400).json({
              success: false,
              message: `Stock insuffisant pour ${product.label}. Quantité disponible: ${qty - remainingQty}`,
            });
          }

          // Mettre à jour les lots
          for (const { id, qty: qtyToUse } of lotsToUpdate) {
            const lot = await prisma.lot.findUnique({ where: { id } });
            if (lot) {
              await prisma.lot.update({
                where: { id },
                data: {
                  quantityUsed: { increment: qtyToUse },
                  status: lot.quantity - lot.quantityUsed - qtyToUse === 0 ? 'EPUISE' : lot.status,
                },
              });
            }
          }
        }
      }

      // Créer le mouvement
      const movement = await prisma.stockMovement.create({
        data: {
          productId,
          lotId: lotId || null,
          type,
          qty,
          unitPrice: unitPrice ? new Decimal(unitPrice) : null,
          reference,
          reason,
          createdBy: createdBy || 'system',
        },
      });

      res.status(201).json({
        success: true,
        message: 'Mouvement de stock créé avec succès',
        data: movement,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du mouvement',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/pharmacy/stock/movements
   * Liste les mouvements de stock
   */
  static async getStockMovements(req: Request, res: Response) {
    try {
      const {
        productId,
        lotId,
        type,
        start,
        end,
        page = '1',
        limit = '50',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (productId) where.productId = productId as string;
      if (lotId) where.lotId = lotId as string;
      if (type) where.type = type as string;

      if (start || end) {
        where.createdAt = {};
        if (start) where.createdAt.gte = new Date(start as string);
        if (end) where.createdAt.lte = new Date(end as string);
      }

      const movements = await prisma.stockMovement.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          product: {
            select: {
              id: true,
              label: true,
              code: true,
            },
          },
          lot: {
            select: {
              id: true,
              lotNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await prisma.stockMovement.count({ where });

      res.json({
        success: true,
        data: movements,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des mouvements',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/pharmacy/dashboard
   * Retourne les KPIs du tableau de bord
   */
  static async getDashboard(req: Request, res: Response) {
    try {
      const today = new Date();
      const settings = await prisma.pharmacySettings.findFirst() || {
        alertExpirationDays: 30,
        minStockAlertRatio: new Decimal(1.2),
      };

      const alertDays = settings.alertExpirationDays || 30;
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + alertDays);

      // Lots expirés
      const expiredLots = await prisma.lot.count({
        where: {
          datePeremption: { lt: today },
          status: { not: 'EPUISE' },
        },
      });

      // Lots proches de péremption
      const nearExpiryLots = await prisma.lot.count({
        where: {
          datePeremption: {
            lte: thresholdDate,
            gte: today,
          },
          status: { not: 'EPUISE' },
        },
      });

      // Produits en rupture
      const products = await prisma.product.findMany({
        include: {
          lots: true,
        },
      });

      let outOfStock = 0;
      let nearOutOfStock = 0;

      for (const product of products) {
        const availableLots = product.lots.filter(
          (lot) => lot.quantity > lot.quantityUsed && lot.status !== 'EXPIRED'
        );
        const totalQty = availableLots.reduce(
          (sum, lot) => sum + (lot.quantity - lot.quantityUsed),
          0
        );

        if (totalQty <= 0) {
          outOfStock++;
        } else if (totalQty <= (product.minStock || 0) * Number(settings.minStockAlertRatio || 1.2)) {
          nearOutOfStock++;
        }
      }

      res.json({
        success: true,
        data: {
          expired: expiredLots,
          nearExpiry: nearExpiryLots,
          outOfStock,
          nearOutOfStock,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du dashboard',
        error: error.message,
      });
    }
  }

  // Méthodes pour commandes fournisseurs, fournisseurs, catégories, etc.
  // (à continuer...)

  static async getOrders(req: Request, res: Response) {
    try {
      const { status, supplierId } = req.query;
      const where: any = {};
      if (status) where.status = status;
      if (supplierId) where.supplierId = supplierId as string;

      const orders = await prisma.order.findMany({
        where,
        include: {
          supplier: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        success: true,
        data: orders,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commandes',
        error: error.message,
      });
    }
  }

  static async createOrder(req: Request, res: Response) {
    try {
      const { supplierId, items, reference, createdBy } = req.body;

      const totalAmount = items.reduce(
        (sum: number, item: any) => sum + item.qty * item.unitPrice,
        0
      );

      const order = await prisma.order.create({
        data: {
          supplierId,
          reference: reference || `CMD-${Date.now()}`,
          items: items,
          totalAmount: new Decimal(totalAmount),
          createdBy: createdBy || 'system',
          status: 'DRAFT',
        },
      });

      res.status(201).json({
        success: true,
        message: 'Commande créée avec succès',
        data: order,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la commande',
        error: error.message,
      });
    }
  }

  static async receiveOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { receivedItems, createdBy } = req.body;

      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée',
        });
      }

      // Créer les lots pour chaque item reçu
      for (const item of receivedItems) {
        const { productId, lotNumber, qty, unitCost, datePeremption, source } = item;

        await PharmacyController.createLot({
          body: {
            productId,
            lotNumber,
            quantity: qty,
            unitCost,
            datePeremption,
            source: source || order.supplierId,
            createdBy,
          },
        } as Request, {} as Response);
      }

      // Mettre à jour le statut de la commande
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'Commande réceptionnée avec succès',
        data: updatedOrder,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la réception de la commande',
        error: error.message,
      });
    }
  }

  static async getSuppliers(req: Request, res: Response) {
    try {
      const suppliers = await prisma.supplier.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json({
        success: true,
        data: suppliers,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des fournisseurs',
        error: error.message,
      });
    }
  }

  static async createSupplier(req: Request, res: Response) {
    try {
      const { name, contact, phone, email, address } = req.body;

      const supplier = await prisma.supplier.create({
        data: {
          name,
          contact,
          phone,
          email,
          address,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Fournisseur créé avec succès',
        data: supplier,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du fournisseur',
        error: error.message,
      });
    }
  }

  static async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, contact, phone, email, address, active } = req.body;

      const supplier = await prisma.supplier.update({
        where: { id },
        data: {
          name,
          contact,
          phone,
          email,
          address,
          active,
        },
      });

      res.json({
        success: true,
        message: 'Fournisseur mis à jour avec succès',
        data: supplier,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du fournisseur',
        error: error.message,
      });
    }
  }

  static async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Vérifier s'il y a des commandes
      const ordersCount = await prisma.order.count({
        where: { supplierId: id },
      });

      if (ordersCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer un fournisseur avec des commandes',
        });
      }

      await prisma.supplier.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Fournisseur supprimé avec succès',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du fournisseur',
        error: error.message,
      });
    }
  }

  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.productCategory.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des catégories',
        error: error.message,
      });
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const { name, description } = req.body;

      const category = await prisma.productCategory.create({
        data: {
          name,
          description,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Catégorie créée avec succès',
        data: category,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Une catégorie avec ce nom existe déjà',
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la catégorie',
        error: error.message,
      });
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, active } = req.body;

      const category = await prisma.productCategory.update({
        where: { id },
        data: {
          name,
          description,
          active,
        },
      });

      res.json({
        success: true,
        message: 'Catégorie mise à jour avec succès',
        data: category,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la catégorie',
        error: error.message,
      });
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.productCategory.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Catégorie supprimée avec succès',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la catégorie',
        error: error.message,
      });
    }
  }

  static async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          supplier: true,
        },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée',
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la commande',
        error: error.message,
      });
    }
  }

  static async updateOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, items, totalAmount } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (items) updateData.items = items;
      if (totalAmount) updateData.totalAmount = new Decimal(totalAmount);

      const order = await prisma.order.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        message: 'Commande mise à jour avec succès',
        data: order,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la commande',
        error: error.message,
      });
    }
  }

  static async cancelOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const order = await prisma.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
        },
      });

      res.json({
        success: true,
        message: 'Commande annulée avec succès',
        data: order,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'annulation de la commande',
        error: error.message,
      });
    }
  }

  static async getInventory(req: Request, res: Response) {
    try {
      const { asOfDate } = req.query;
      const date = asOfDate ? new Date(asOfDate as string) : new Date();

      const products = await prisma.product.findMany({
        include: {
          lots: {
            where: {
              createdAt: { lte: date },
            },
          },
        },
      });

      const inventory = products.map((product) => {
        const availableLots = product.lots.filter(
          (lot) => lot.quantity > lot.quantityUsed
        );
        const totalQty = availableLots.reduce(
          (sum, lot) => sum + (lot.quantity - lot.quantityUsed),
          0
        );
        const totalValue = availableLots.reduce(
          (sum, lot) =>
            sum +
            Number(lot.unitCost) * (lot.quantity - lot.quantityUsed),
          0
        );

        return {
          productId: product.id,
          productCode: product.code,
          productLabel: product.label,
          quantity: totalQty,
          value: totalValue,
          lots: availableLots.length,
        };
      });

      res.json({
        success: true,
        data: inventory,
        asOfDate: date,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'inventaire',
        error: error.message,
      });
    }
  }

  static async getAlerts(req: Request, res: Response) {
    try {
      const today = new Date();
      const settings = await prisma.pharmacySettings.findFirst() || {
        alertExpirationDays: 30,
      };

      const alertDays = settings.alertExpirationDays || 30;
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + alertDays);

      // Alertes péremption
      const expiredLots = await prisma.lot.findMany({
        where: {
          datePeremption: { lt: today },
          status: { not: 'EPUISE' },
        },
        include: {
          product: {
            select: {
              id: true,
              label: true,
              code: true,
            },
          },
        },
      });

      const nearExpiryLots = await prisma.lot.findMany({
        where: {
          datePeremption: {
            lte: thresholdDate,
            gte: today,
          },
          status: { not: 'EPUISE' },
        },
        include: {
          product: {
            select: {
              id: true,
              label: true,
              code: true,
            },
          },
        },
      });

      // Alertes rupture
      const products = await prisma.product.findMany({
        include: {
          lots: true,
        },
      });

      const outOfStockProducts: any[] = [];
      const nearOutOfStockProducts: any[] = [];

      for (const product of products) {
        const availableLots = product.lots.filter(
          (lot) => lot.quantity > lot.quantityUsed && lot.status !== 'EXPIRED'
        );
        const totalQty = availableLots.reduce(
          (sum, lot) => sum + (lot.quantity - lot.quantityUsed),
          0
        );

        if (totalQty <= 0) {
          outOfStockProducts.push({
            productId: product.id,
            productCode: product.code,
            productLabel: product.label,
            quantity: 0,
          });
        } else if (totalQty <= (product.minStock || 0) * Number(settings.minStockAlertRatio || 1.2)) {
          nearOutOfStockProducts.push({
            productId: product.id,
            productCode: product.code,
            productLabel: product.label,
            quantity: totalQty,
            minStock: product.minStock,
          });
        }
      }

      res.json({
        success: true,
        data: {
          expired: expiredLots.map((lot) => ({
            type: 'EXPIRED',
            lotId: lot.id,
            lotNumber: lot.lotNumber,
            product: lot.product,
            datePeremption: lot.datePeremption,
          })),
          nearExpiry: nearExpiryLots.map((lot) => ({
            type: 'NEAR_EXPIRY',
            lotId: lot.id,
            lotNumber: lot.lotNumber,
            product: lot.product,
            datePeremption: lot.datePeremption,
            daysUntilExpiry: Math.ceil(
              (lot.datePeremption.getTime() - today.getTime()) /
                (1000 * 60 * 60 * 24)
            ),
          })),
          outOfStock: outOfStockProducts,
          nearOutOfStock: nearOutOfStockProducts,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des alertes',
        error: error.message,
      });
    }
  }

  static async getSettings(req: Request, res: Response) {
    try {
      let settings = await prisma.pharmacySettings.findFirst();

      if (!settings) {
        // Créer les paramètres par défaut
        settings = await prisma.pharmacySettings.create({
          data: {
            alertExpirationDays: 30,
            minStockAlertRatio: new Decimal(1.2),
            stockMethod: 'FIFO',
            enableNotifications: true,
          },
        });
      }

      res.json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paramètres',
        error: error.message,
      });
    }
  }

  static async updateSettings(req: Request, res: Response) {
    try {
      const {
        alertExpirationDays,
        minStockAlertRatio,
        stockMethod,
        enableNotifications,
        notificationEmail,
        updatedBy,
      } = req.body;

      let settings = await prisma.pharmacySettings.findFirst();

      const updateData: any = {};
      if (alertExpirationDays !== undefined) updateData.alertExpirationDays = alertExpirationDays;
      if (minStockAlertRatio !== undefined) updateData.minStockAlertRatio = new Decimal(minStockAlertRatio);
      if (stockMethod) updateData.stockMethod = stockMethod;
      if (enableNotifications !== undefined) updateData.enableNotifications = enableNotifications;
      if (notificationEmail !== undefined) updateData.notificationEmail = notificationEmail;
      if (updatedBy) updateData.updatedBy = updatedBy;

      if (settings) {
        settings = await prisma.pharmacySettings.update({
          where: { id: settings.id },
          data: updateData,
        });
      } else {
        settings = await prisma.pharmacySettings.create({
          data: {
            ...updateData,
            alertExpirationDays: alertExpirationDays || 30,
            minStockAlertRatio: minStockAlertRatio ? new Decimal(minStockAlertRatio) : new Decimal(1.2),
            stockMethod: stockMethod || 'FIFO',
            enableNotifications: enableNotifications !== undefined ? enableNotifications : true,
          },
        });
      }

      res.json({
        success: true,
        message: 'Paramètres mis à jour avec succès',
        data: settings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour des paramètres',
        error: error.message,
      });
    }
  }

  static async getPrescriptionQueue(req: Request, res: Response) {
    try {
      const { status } = req.query;

      const where: any = {};
      if (status) where.status = status;

      const queue = await prisma.prescriptionQueue.findMany({
        where,
        orderBy: {
          createdAt: 'asc',
        },
      });

      res.json({
        success: true,
        data: queue,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la file d\'attente',
        error: error.message,
      });
    }
  }

  static async reservePrescription(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reservedBy } = req.body;

      const prescription = await prisma.prescriptionQueue.update({
        where: { id },
        data: {
          status: 'RESERVED',
          reservedBy,
        },
      });

      res.json({
        success: true,
        message: 'Prescription réservée avec succès',
        data: prescription,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la réservation de la prescription',
        error: error.message,
      });
    }
  }

  static async dispensePrescription(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { dispensedBy } = req.body;

      const prescription = await prisma.prescriptionQueue.findUnique({
        where: { id },
      });

      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: 'Prescription non trouvée',
        });
      }

      const items = prescription.items as any[];

      // Créer les mouvements de stock pour chaque item
      for (const item of items) {
        await PharmacyController.createStockMovement({
          body: {
            productId: item.productId,
            type: 'OUT',
            qty: item.qty,
            reference: prescription.consultationId || prescription.prescriptionId,
            reason: 'Dispensation prescription',
            createdBy: dispensedBy,
          },
        } as Request, {} as Response);
      }

      // Mettre à jour le statut
      const updated = await prisma.prescriptionQueue.update({
        where: { id },
        data: {
          status: 'DISPENSED',
          dispensedBy,
          dispensedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'Prescription dispensée avec succès',
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la dispensation',
        error: error.message,
      });
    }
  }

  static async importProducts(req: Request, res: Response) {
    try {
      // TODO: Implémenter l'import CSV
      res.status(501).json({
        success: false,
        message: 'Import CSV non encore implémenté',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'import',
        error: error.message,
      });
    }
  }

  static async exportProducts(req: Request, res: Response) {
    try {
      // TODO: Implémenter l'export CSV/Excel
      res.status(501).json({
        success: false,
        message: 'Export CSV/Excel non encore implémenté',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export',
        error: error.message,
      });
    }
  }

  static async updateLot(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData: any = {};

      const allowedFields = ['quantity', 'unitCost', 'datePeremption', 'status', 'source'];
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          if (field === 'unitCost') {
            updateData[field] = new Decimal(req.body[field]);
          } else if (field === 'datePeremption') {
            updateData[field] = new Date(req.body[field]);
          } else {
            updateData[field] = req.body[field];
          }
        }
      });

      const lot = await prisma.lot.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        message: 'Lot mis à jour avec succès',
        data: lot,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du lot',
        error: error.message,
      });
    }
  }
}


