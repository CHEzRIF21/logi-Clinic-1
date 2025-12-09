import { Request, Response } from 'express';
import PatientService from '../services/patientService';

export class PatientController {
  /**
   * GET /api/patients
   * Recherche intelligente de patients
   */
  static async search(req: Request, res: Response) {
    try {
      const {
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await PatientService.searchPatients({
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json({
        success: true,
        data: result.patients,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des patients',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/patients/:id
   * Récupère un patient avec son historique
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { startDate, endDate, status } = req.query;

      const patient = await PatientService.getPatientById(id, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as string,
      });

      res.json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération du patient',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/patients
   * Crée un nouveau patient
   */
  static async create(req: Request, res: Response) {
    try {
      const {
        firstName,
        lastName,
        sex,
        dob,
        phones,
        address,
        assuranceId,
        ifu,
      } = req.body;

      if (!firstName || !lastName || !sex || !dob) {
        return res.status(400).json({
          success: false,
          message: 'Les champs firstName, lastName, sex et dob sont requis',
        });
      }

      const patient = await PatientService.createPatient({
        firstName,
        lastName,
        sex,
        dob: new Date(dob),
        phones: Array.isArray(phones) ? phones : phones ? [phones] : [],
        address,
        assuranceId,
        ifu,
      });

      res.status(201).json({
        success: true,
        message: 'Patient créé avec succès',
        data: patient,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la création du patient',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/patients/:id
   * Met à jour un patient
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.dob) {
        updateData.dob = new Date(updateData.dob);
      }

      const patient = await PatientService.updatePatient(id, updateData);

      res.json({
        success: true,
        message: 'Patient mis à jour avec succès',
        data: patient,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du patient',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/patients/:id
   * Supprime un patient
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await PatientService.deletePatient(id);

      res.json({
        success: true,
        message: 'Patient supprimé avec succès',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ||
                        error.message.includes('opérations') ||
                        error.message.includes('factures')
        ? 400
        : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erreur lors de la suppression du patient',
        error: error.message,
      });
    }
  }
}

export default PatientController;

