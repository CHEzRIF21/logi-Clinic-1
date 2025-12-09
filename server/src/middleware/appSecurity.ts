import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Interface pour les résultats de validation de l'application
 */
interface AppValidationResult {
  valid: boolean;
  message: string;
  license?: {
    id: string;
    appId: string;
    domain: string;
    clinicId?: string | null;
    active: boolean;
  };
}

/**
 * Middleware de sécurité pour vérifier l'identité de l'application cliente
 * 
 * Ce middleware vérifie :
 * 1. La présence des headers x-app-id et x-app-secret
 * 2. La validité de ces credentials en base de données
 * 3. Que le domaine appelant est autorisé
 * 4. Que la licence n'est pas révoquée ou expirée
 */
export const appSecurityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Routes exclues de la vérification (health check, routes de licence publiques)
  const excludedPaths = [
    '/health',
    '/api/license/verify',
    '/api/license/status',
    '/api/license/public-key',
    '/api/monitoring/health',
  ];

  if (excludedPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Mode développement : vérification optionnelle
  if (process.env.NODE_ENV === 'development' && !process.env.ENFORCE_APP_SECURITY) {
    return next();
  }

  // Récupérer les headers de sécurité
  const appId = req.headers['x-app-id'] as string;
  const appSecret = req.headers['x-app-secret'] as string;

  // Vérifier la présence des headers
  if (!appId || !appSecret) {
    await logSecurityAttempt(req, null, false, 'Missing x-app-id or x-app-secret headers');
    return res.status(403).json({
      success: false,
      error: 'UNAUTHORIZED_APPLICATION',
      message: 'Application non autorisée. Headers de sécurité manquants.',
    });
  }

  try {
    // Valider l'application
    const validation = await validateApplication(appId, appSecret, req);

    if (!validation.valid) {
      await logSecurityAttempt(req, appId, false, validation.message);
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED_APPLICATION',
        message: validation.message,
      });
    }

    // Attacher les informations de licence à la requête pour usage ultérieur
    (req as any).appLicense = validation.license;

    // Enregistrer la tentative réussie
    await logSecurityAttempt(req, appId, true, 'Access granted');

    next();
  } catch (error) {
    console.error('Erreur lors de la vérification de sécurité:', error);
    return res.status(500).json({
      success: false,
      error: 'SECURITY_CHECK_ERROR',
      message: 'Erreur lors de la vérification de sécurité.',
    });
  }
};

/**
 * Valide les credentials de l'application
 */
async function validateApplication(
  appId: string,
  appSecret: string,
  req: Request
): Promise<AppValidationResult> {
  // Rechercher la licence par appId
  const license = await prisma.license.findUnique({
    where: { appId },
  });

  if (!license) {
    return {
      valid: false,
      message: 'Application ID invalide.',
    };
  }

  // Vérifier le secret (comparaison sécurisée contre timing attacks)
  const secretMatch = crypto.timingSafeEqual(
    Buffer.from(appSecret),
    Buffer.from(license.appSecret)
  );

  if (!secretMatch) {
    return {
      valid: false,
      message: 'Application Secret invalide.',
    };
  }

  // Vérifier si la licence est active
  if (!license.active) {
    return {
      valid: false,
      message: 'Licence désactivée.',
    };
  }

  // Vérifier si la licence est révoquée
  if (license.revoked) {
    return {
      valid: false,
      message: `Licence révoquée${license.revokedReason ? `: ${license.revokedReason}` : '.'}`,
    };
  }

  // Vérifier l'expiration
  if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
    return {
      valid: false,
      message: 'Licence expirée. Veuillez renouveler votre abonnement.',
    };
  }

  // Vérifier le domaine appelant
  const origin = req.get('origin') || req.get('referer') || '';
  const host = req.get('host') || '';
  
  // Extraire le domaine de l'origin ou du host
  let callingDomain = '';
  try {
    if (origin) {
      const url = new URL(origin);
      callingDomain = url.hostname;
    } else if (host) {
      callingDomain = host.split(':')[0]; // Enlever le port si présent
    }
  } catch {
    callingDomain = host.split(':')[0] || '';
  }

  // Vérifier si le domaine est autorisé
  const allowedDomains = license.allowedDomains || [];
  const isDomainAllowed = allowedDomains.some((allowedDomain) => {
    // Support des wildcards (*.example.com)
    if (allowedDomain.startsWith('*.')) {
      const baseDomain = allowedDomain.substring(2);
      return callingDomain.endsWith(baseDomain) || callingDomain === baseDomain;
    }
    // Correspondance exacte
    return callingDomain === allowedDomain;
  });

  // En développement, autoriser localhost
  const isLocalhost = callingDomain === 'localhost' || callingDomain === '127.0.0.1';
  const allowLocalhost = process.env.NODE_ENV === 'development' || process.env.ALLOW_LOCALHOST === 'true';

  if (!isDomainAllowed && !(isLocalhost && allowLocalhost)) {
    return {
      valid: false,
      message: `Domaine non autorisé: ${callingDomain}. Cette application n'est pas autorisée à fonctionner sur ce domaine.`,
    };
  }

  return {
    valid: true,
    message: 'Application autorisée.',
    license: {
      id: license.id,
      appId: license.appId,
      domain: license.domain,
      clinicId: license.clinicId,
      active: license.active,
    },
  };
}

/**
 * Enregistre une tentative d'accès pour audit
 */
async function logSecurityAttempt(
  req: Request,
  appId: string | null,
  success: boolean,
  reason: string
): Promise<void> {
  try {
    const origin = req.get('origin') || req.get('referer') || 'unknown';
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Extraire le domaine
    let domain = 'unknown';
    try {
      if (origin !== 'unknown') {
        const url = new URL(origin);
        domain = url.hostname;
      }
    } catch {
      domain = origin;
    }

    // Trouver la licence si un appId est fourni
    let licenseId = null;
    let licenseKey = null;
    if (appId) {
      const license = await prisma.license.findUnique({
        where: { appId },
        select: { id: true, licenseKey: true },
      });
      licenseId = license?.id || null;
      licenseKey = license?.licenseKey || null;
    }

    await prisma.deploymentAttempt.create({
      data: {
        domain,
        ip: typeof ip === 'string' ? ip : ip[0] || 'unknown',
        userAgent,
        licenseKey,
        licenseId,
        success,
        reason,
      },
    });

    // Log en console pour monitoring
    if (!success) {
      console.warn(`🚨 Tentative d'accès non autorisée:`, {
        domain,
        ip,
        appId,
        reason,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la tentative de sécurité:', error);
  }
}

/**
 * Middleware léger pour vérifier uniquement le domaine (sans DB)
 * Utile pour les routes très fréquentes où la performance est critique
 */
export const domainCheckMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];
  
  if (allowedDomains.length === 0) {
    return next(); // Pas de restriction de domaine configurée
  }

  const origin = req.get('origin') || '';
  let callingDomain = '';
  
  try {
    if (origin) {
      const url = new URL(origin);
      callingDomain = url.hostname;
    }
  } catch {
    callingDomain = '';
  }

  const isAllowed = allowedDomains.some((domain) => {
    if (domain.startsWith('*.')) {
      const baseDomain = domain.substring(2);
      return callingDomain.endsWith(baseDomain);
    }
    return callingDomain === domain;
  });

  // Autoriser localhost en développement
  const isLocalhost = callingDomain === 'localhost' || callingDomain === '127.0.0.1';
  if (isLocalhost && process.env.NODE_ENV === 'development') {
    return next();
  }

  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      error: 'DOMAIN_NOT_ALLOWED',
      message: 'Ce domaine n\'est pas autorisé à accéder à cette API.',
    });
  }

  next();
};

export default appSecurityMiddleware;

