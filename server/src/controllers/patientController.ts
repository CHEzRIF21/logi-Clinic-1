import { Request, Response } from 'express';
import PatientService from '../services/patientService';
import { ClinicContextRequest } from '../middleware/clinicContext';

export class PatientController {
  /**
   * GET /api/patients
   * Recherche intelligente de patients
   * ✅ CORRIGÉ: Filtre par clinic_id pour isolation multi-tenant
   */
  static async search(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      
      const {
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await PatientService.searchPatients({
        clinicId: clinicReq.clinicId,        // ✅ AJOUTER
        isSuperAdmin: clinicReq.isSuperAdmin, // ✅ AJOUTER
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
   * ✅ CORRIGÉ: Vérifie que le patient appartient à la clinique de l'utilisateur
   */
  static async getById(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      const { id } = req.params;
      const { startDate, endDate, status } = req.query;

      const patient = await PatientService.getPatientById(id, {
        clinicId: clinicReq.clinicId,        // ✅ AJOUTER
        isSuperAdmin: clinicReq.isSuperAdmin, // ✅ AJOUTER
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as string,
      });

      res.json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') || 
                        error.message.includes('non autorisé') ? 404 : 500;

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
   * ✅ CORRIGÉ: Assigne automatiquement le clinic_id de l'utilisateur
   */
  static async create(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      
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
        clinicId: clinicReq.clinicId, // ✅ AJOUTER - Assignation automatique
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
   * ✅ CORRIGÉ: Vérifie que le patient appartient à la clinique avant modification
   */
  static async update(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.dob) {
        updateData.dob = new Date(updateData.dob);
      }

      // ✅ Vérifier d'abord que le patient existe et appartient à la clinique
      await PatientService.getPatientById(id, {
        clinicId: clinicReq.clinicId,
        isSuperAdmin: clinicReq.isSuperAdmin,
      });

      const patient = await PatientService.updatePatient(id, updateData);

      res.json({
        success: true,
        message: 'Patient mis à jour avec succès',
        data: patient,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') || 
                        error.message.includes('non autorisé') ? 404 : 500;

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
   * ✅ CORRIGÉ: Vérifie que le patient appartient à la clinique avant suppression
   */
  static async delete(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      const { id } = req.params;

      // ✅ Vérifier d'abord que le patient existe et appartient à la clinique
      await PatientService.getPatientById(id, {
        clinicId: clinicReq.clinicId,
        isSuperAdmin: clinicReq.isSuperAdmin,
      });

      await PatientService.deletePatient(id);

      res.json({
        success: true,
        message: 'Patient supprimé avec succès',
      });
    } catch (error: any) {
      const statusCode = error.message.includes('non trouvé') ||
                        error.message.includes('non autorisé') ||
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

