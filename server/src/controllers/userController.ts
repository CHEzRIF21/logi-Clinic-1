import { Response } from 'express';
import { UserService } from '../services/userService';
import { AuthRequest } from '../middleware/auth';
import { ClinicContextRequest } from '../middleware/clinicContext';

export class UserController {
    /**
     * GET /api/users
     */
    static async list(req: AuthRequest, res: Response) {
        try {
            const clinicReq = req as ClinicContextRequest;
            const clinicId = clinicReq.isSuperAdmin ? (req.query.clinicId as string || null) : clinicReq.clinicId;

            const users = await UserService.listUsers(clinicId);

            res.json({
                success: true,
                data: users,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des utilisateurs',
                error: error.message,
            });
        }
    }

    /**
     * GET /api/users/:id
     */
    static async getById(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const user = await UserService.getUserById(id);

            // Vérification isolation
            const clinicReq = req as ClinicContextRequest;
            if (!clinicReq.isSuperAdmin && user.clinic_id !== clinicReq.clinicId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé à cet utilisateur',
                });
            }

            res.json({
                success: true,
                data: user,
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * POST /api/users
     */
    static async create(req: AuthRequest, res: Response) {
        try {
            const clinicReq = req as ClinicContextRequest;
            const { nom, prenom, email, password, role, telephone, adresse, specialite } = req.body;
            let { clinic_id } = req.body;

            // Si pas Super Admin, forcer la clinique de l'utilisateur
            if (!clinicReq.isSuperAdmin) {
                clinic_id = clinicReq.clinicId;
            }

            if (!clinic_id) {
                return res.status(400).json({
                    success: false,
                    message: 'L\'ID de la clinique est requis',
                });
            }

            const result = await UserService.createUser({
                nom,
                prenom,
                email,
                password,
                role,
                clinic_id,
                telephone,
                adresse,
                specialite
            });

            res.status(201).json({
                success: true,
                data: result.user,
                tempPassword: result.tempPassword
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: 'Erreur lors de la création de l\'utilisateur',
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/users/:id
     */
    static async update(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const clinicReq = req as ClinicContextRequest;

            // Vérifier existence et isolation
            const existingUser = await UserService.getUserById(id);
            if (!clinicReq.isSuperAdmin && existingUser.clinic_id !== clinicReq.clinicId) {
                return res.status(403).json({ success: false, message: 'Accès non autorisé' });
            }

            const user = await UserService.updateUser(id, req.body);

            res.json({
                success: true,
                data: user,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: 'Erreur lors de la mise à jour de l\'utilisateur',
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/users/:id
     */
    static async delete(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const clinicReq = req as ClinicContextRequest;

            // Vérifier existence et isolation
            const existingUser = await UserService.getUserById(id);
            if (!clinicReq.isSuperAdmin && existingUser.clinic_id !== clinicReq.clinicId) {
                return res.status(403).json({ success: false, message: 'Accès non autorisé' });
            }

            await UserService.deleteUser(id);

            res.json({
                success: true,
                message: 'Utilisateur supprimé avec succès',
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: 'Erreur lors de la suppression de l\'utilisateur',
                error: error.message,
            });
        }
    }
}

export default UserController;
