import prisma from '../prisma';
import { supabaseAdmin } from '../config/supabase';
import SchemaCacheService from './schemaCacheService';

export interface CreateUserInput {
    nom: string;
    prenom: string;
    email: string;
    password?: string;
    role: string;
    clinic_id: string;
    telephone?: string;
    adresse?: string;
    specialite?: string;
}

export interface UpdateUserInput {
    nom?: string;
    prenom?: string;
    role?: string;
    actif?: boolean;
    status?: string;
    telephone?: string;
    adresse?: string;
    specialite?: string;
}

export class UserService {
    /**
     * Liste les utilisateurs d'une clinique (ou tous si clinicId est null pour Super Admin)
     */
    static async listUsers(clinicId: string | null = null) {
        return await SchemaCacheService.executeWithRetry(async () => {
            return await prisma.user.findMany({
                where: clinicId ? { clinicId } : undefined,
                orderBy: { createdAt: 'desc' },
                include: {
                    clinic: {
                        select: {
                            name: true,
                            code: true
                        }
                    }
                }
            });
        });
    }

    /**
     * Récupère un utilisateur par son ID
     */
    static async getUserById(id: string) {
        return await SchemaCacheService.executeWithRetry(async () => {
            const user = await prisma.user.findUnique({
                where: { id },
                include: {
                    clinic: true
                }
            });
            if (!user) throw new Error('Utilisateur non trouvé');
            return user;
        });
    }

    /**
     * Crée un nouvel utilisateur (Auth + Profil)
     */
    static async createUser(input: CreateUserInput) {
        if (!supabaseAdmin) throw new Error('Service Supabase Admin non configuré');

        const emailLower = input.email.toLowerCase().trim();
        const password = input.password || `Clinic${Math.random().toString(36).slice(-8)}!`;

        // 1. Créer dans Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: emailLower,
            password,
            email_confirm: true,
            user_metadata: {
                nom: input.nom,
                prenom: input.prenom,
                clinic_id: input.clinic_id,
                role: input.role
            }
        });

        if (authError || !authUser?.user) {
            throw new Error(`Erreur Auth: ${authError?.message || 'Inconnue'}`);
        }

        try {
            // 2. Créer le profil dans la DB via Prisma
            // Note: Le trigger RLS pourrait être un problème si on n'est pas SUPER_ADMIN dans Prisma
            // Mais ici on est dans le backend (Prisma service role via DATABASE_URL)
            const user = await prisma.user.create({
                data: {
                    nom: input.nom,
                    prenom: input.prenom,
                    email: emailLower,
                    role: input.role,
                    clinicId: input.clinic_id,
                    authUserId: authUser.user.id,
                    telephone: input.telephone,
                    adresse: input.adresse,
                    specialite: input.specialite,
                    actif: true,
                    status: 'ACTIVE',
                    passwordHash: this.hashPassword(password)
                }
            });

            return { user, tempPassword: password };
        } catch (dbError) {
            // Rollback Auth
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            throw dbError;
        }
    }

    /**
     * Met à jour un utilisateur
     */
    static async updateUser(id: string, input: UpdateUserInput) {
        return await prisma.user.update({
            where: { id },
            data: {
                ...input,
                updatedAt: new Date()
            }
        });
    }

    /**
     * Supprime un utilisateur (Désactivation recommandée plutôt que suppression)
     */
    static async deleteUser(id: string) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new Error('Utilisateur non trouvé');

        // Supprimer dans Auth si possible
        if (user.authUserId && supabaseAdmin) {
            await supabaseAdmin.auth.admin.deleteUser(user.authUserId);
        }

        return await prisma.user.delete({ where: { id } });
    }

    /**
     * Hashage compatible avec validate_clinic_login
     */
    private static hashPassword(password: string): string {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(password + 'logi_clinic_salt').digest('hex');
    }
}
