import { Request, Response } from 'express';
import ExportService from '../services/exportService';

export class ExportController {
  /**
   * GET /api/export/accounting
   * Exporte les écritures comptables
   */
  static async exportAccounting(req: Request, res: Response) {
    try {
      const { format, startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Les dates de début et de fin sont requises',
        });
      }

      const exportFormat = (format as string) || 'CSV';
      let content: string;
      let contentType: string;
      let filename: string;

      switch (exportFormat.toUpperCase()) {
        case 'CSV':
          content = await ExportService.exportAccountingCSV({
            format: 'CSV',
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string),
          });
          contentType = 'text/csv';
          filename = `ecritures-${startDate}-${endDate}.csv`;
          break;
        case 'SIE':
          content = await ExportService.exportAccountingSIE({
            format: 'SIE',
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string),
          });
          contentType = 'text/plain';
          filename = `ecritures-${startDate}-${endDate}.sie`;
          break;
        case 'XML':
          content = await ExportService.exportAccountingXML({
            format: 'XML',
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string),
          });
          contentType = 'application/xml';
          filename = `ecritures-${startDate}-${endDate}.xml`;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Format non supporté. Formats acceptés: CSV, SIE, XML',
          });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/export/caisse-journal
   * Exporte le journal de caisse en CSV
   */
  static async exportCaisseJournal(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Les dates de début et de fin sont requises',
        });
      }

      const content = await ExportService.exportCaisseJournalCSV({
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      });

      const filename = `journal-caisse-${startDate}-${endDate}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\ufeff' + content); // BOM UTF-8 pour Excel
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export du journal',
        error: error.message,
      });
    }
  }
}

export default ExportController;

