import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/monitoring/deployment-attempts
 * Récupère les tentatives de déploiement (endpoint admin)
 */
router.get('/deployment-attempts', async (req: Request, res: Response) => {
  try {
    // Vérifier l'autorisation admin
    const adminKey = process.env.ADMIN_MONITORING_KEY;
    const providedKey = req.headers['x-admin-key'];

    if (adminKey && providedKey !== adminKey) {
      throw new AppError('Non autorisé', 401);
    }

    const { limit = 100, offset = 0, success, domain } = req.query;

    const where: any = {};
    if (success !== undefined) {
      where.success = success === 'true';
    }
    if (domain) {
      where.domain = { contains: domain as string };
    }

    const [attempts, total] = await Promise.all([
      prisma.deploymentAttempt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
        include: {
          license: {
            select: {
              id: true,
              licenseKey: true,
              domain: true,
              active: true,
            },
          },
        },
      }),
      prisma.deploymentAttempt.count({ where }),
    ]);

    res.json({
      success: true,
      data: attempts,
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Erreur lors de la récupération des tentatives', 500);
  }
});

/**
 * GET /api/monitoring/stats
 * Statistiques sur les tentatives de déploiement
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const adminKey = process.env.ADMIN_MONITORING_KEY;
    const providedKey = req.headers['x-admin-key'];

    if (adminKey && providedKey !== adminKey) {
      throw new AppError('Non autorisé', 401);
    }

    const [totalAttempts, successfulAttempts, failedAttempts, recentAttempts] = await Promise.all([
      prisma.deploymentAttempt.count(),
      prisma.deploymentAttempt.count({ where: { success: true } }),
      prisma.deploymentAttempt.count({ where: { success: false } }),
      prisma.deploymentAttempt.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24 heures
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Tentatives par domaine
    const attemptsByDomain = await prisma.deploymentAttempt.groupBy({
      by: ['domain'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    res.json({
      success: true,
      stats: {
        total: totalAttempts,
        successful: successfulAttempts,
        failed: failedAttempts,
        successRate: totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0,
        attemptsByDomain: attemptsByDomain.map((item) => ({
          domain: item.domain,
          count: item._count.id,
        })),
        recentAttempts: recentAttempts.map((attempt) => ({
          id: attempt.id,
          domain: attempt.domain,
          ip: attempt.ip,
          success: attempt.success,
          reason: attempt.reason,
          createdAt: attempt.createdAt,
        })),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Erreur lors de la récupération des statistiques', 500);
  }
});

export default router;

