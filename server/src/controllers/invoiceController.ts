import { Request, Response } from 'express';
import InvoiceService from '../services/invoiceService';
import PDFService from '../services/pdfService';
import AuditService from '../services/auditService';

export class InvoiceController {
  /**
   * GET /api/invoices
   * Liste les factures avec filtres et pagination
   */
  static async list(req: Request, res: Response) {
    try {
      const {
        startDate,
        endDate,
        status,
        patientId,
        page,
        limit,
      } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (status) filters.status = status;
      if (patientId) filters.patientId = patientId as string;
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await InvoiceService.listInvoices(filters);

      res.json({
        success: true,
        data: result.invoices,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des factures',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/invoices
   * Crée une nouvelle facture
   */
  static async create(req: Request, res: Response) {
    try {
      const {
        patientId,
        lines,
        comment,
        createdBy,
        modePayment,
        operationIds,
      } = req.body;

      // Validation
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'L\'ID du patient est requis',
        });
      }

      if (!lines || !Array.isArray(lines) || lines.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Au moins une ligne de facture est requise',
        });
      }

      // Valider les lignes
      for (const line of lines) {
        if (!line.productId) {
          return res.status(400).json({
            success: false,
            message: 'L\'ID du produit est requis pour chaque ligne',
          });
        }
        if (!line.qty || line.qty <= 0) {
          return res.status(400).json({
            success: false,
            message: 'La quantité doit être supérieure à 0',
          });
        }
        if (!line.unitPrice || line.unitPrice < 0) {
          return res.status(400).json({
            success: false,
            message: 'Le prix unitaire doit être positif ou nul',
          });
        }
      }

      const invoice = await InvoiceService.createInvoice({
        patientId,
        lines,
        comment,
        createdBy: createdBy || req.user?.id,
        modePayment,
        aib: req.body.aib,
        typeFacture: req.body.typeFacture,
        operationIds,
      });

      res.status(201).json({
        success: true,
        message: 'Facture créée avec succès',
        data: invoice,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ||
                        error.message.includes('Stock insuffisant') ||
                        error.message.includes('requis')
        ? 400
        : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la création de la facture',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/invoices/:id
   * Récupère une facture par son ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await InvoiceService.getInvoiceById(id);

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvée') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération de la facture',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/invoices/:id/pdf
   * Génère et retourne le PDF de la facture
   */
  static async getPDF(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Enregistrer l'impression dans l'audit
      if (req.user?.id) {
        await InvoiceService.logPrint(id, req.user.id);
      }

      const pdfBuffer = await PDFService.generateFacturePDF(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="facture-${id}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvée') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la génération du PDF',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/invoices/:id/normalize
   * Normalise une facture
   */
  static async normalize(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await InvoiceService.normalizeInvoice(
        id,
        req.user?.id || 'system'
      );

      res.json({
        success: true,
        message: 'Facture normalisée avec succès',
        data: invoice,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvée') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la normalisation',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/invoices/:id/cancel
   * Annule une facture
   */
  static async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const invoice = await InvoiceService.cancelInvoice(id, reason);

      res.json({
        success: true,
        message: 'Facture annulée avec succès',
        data: invoice,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvée') ||
                        error.message.includes('déjà annulée')
        ? 400
        : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de l\'annulation de la facture',
        error: error.message,
      });
    }
  }
}

export default InvoiceController;

