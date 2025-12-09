import { Router, Request, Response } from 'express';
import licenseService from '../services/licenseService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/license/verify
 * Vérifie la validité d'une licence
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { licenseKey, domain } = req.body;

    if (!licenseKey || !domain) {
      throw new AppError('Clé de licence et domaine requis', 400);
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await licenseService.validateLicense(licenseKey, domain, ip as string);

    if (!result.valid) {
      return res.status(403).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
      license: result.license,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Erreur lors de la vérification de la licence', 500);
  }
});

/**
 * POST /api/license/create
 * Crée une nouvelle licence (endpoint admin uniquement)
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { domain, expiresAt, maxDeployments, metadata } = req.body;

    if (!domain) {
      throw new AppError('Domaine requis', 400);
    }

    // Vérifier que c'est un appel autorisé (vous pouvez ajouter une authentification ici)
    const adminKey = process.env.ADMIN_LICENSE_KEY;
    const providedKey = req.headers['x-admin-key'];

    if (adminKey && providedKey !== adminKey) {
      throw new AppError('Non autorisé', 401);
    }

    const license = await licenseService.createLicense({
      licenseKey: '', // Sera généré automatiquement
      domain,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxDeployments,
      metadata,
    });

    res.json({
      success: true,
      license: {
        id: license.id,
        licenseKey: license.licenseKey,
        domain: license.domain,
        expiresAt: license.expiresAt,
        maxDeployments: license.maxDeployments,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Erreur lors de la création de la licence', 500);
  }
});

/**
 * GET /api/license/status
 * Vérifie le statut de la licence actuelle
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const licenseKey = process.env.LICENSE_KEY;
    const domain = req.headers.host || req.headers.origin || 'unknown';

    if (!licenseKey) {
      return res.json({
        success: false,
        message: 'Aucune clé de licence configurée',
        licensed: false,
      });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const result = await licenseService.validateLicense(licenseKey, domain as string, ip as string);

    res.json({
      success: result.valid,
      licensed: result.valid,
      message: result.message,
      license: result.license,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du statut',
      licensed: false,
    });
  }
});

export default router;

