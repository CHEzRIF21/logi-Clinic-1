import { Request, Response, NextFunction } from 'express';
import licenseService from '../services/licenseService';
import { AppError } from './errorHandler';

/**
 * Middleware pour vérifier la licence au démarrage du serveur
 */
export const licenseCheckMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Exclure certaines routes de la vérification
  const excludedPaths = ['/health', '/api/license/verify', '/api/license/status'];
  
  if (excludedPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const licenseKey = process.env.LICENSE_KEY;
  const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];

  // Si aucune licence n'est configurée, permettre l'accès (mode développement)
  if (!licenseKey && process.env.NODE_ENV === 'development') {
    return next();
  }

  if (!licenseKey) {
    throw new AppError('Licence non configurée. Déploiement non autorisé.', 403);
  }

  // Récupérer le domaine depuis les headers
  const domain = req.headers.host || req.headers.origin || 'unknown';
  const domainString = typeof domain === 'string' ? domain : domain[0] || 'unknown';
  
  // Nettoyer le domaine (enlever le protocole si présent)
  const cleanDomain = domainString.replace(/^https?:\/\//, '').split(':')[0];

  // Vérifier si le domaine est dans la liste autorisée (si configurée)
  if (allowedDomains.length > 0 && !allowedDomains.includes(cleanDomain)) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    await licenseService.logDeploymentAttempt({
      domain: cleanDomain,
      ip: ip as string,
      userAgent: req.headers['user-agent'] || 'unknown',
      licenseKey,
      success: false,
      reason: `Domain ${cleanDomain} not in allowed domains list`,
    });
    throw new AppError(`Domaine non autorisé: ${cleanDomain}`, 403);
  }

  // Vérifier la licence via le service
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const result = await licenseService.validateLicense(licenseKey, cleanDomain, ip as string);

  if (!result.valid) {
    throw new AppError(result.message, 403);
  }

  next();
};

/**
 * Middleware optionnel pour vérifier la licence périodiquement
 * (à utiliser avec prudence car peut impacter les performances)
 */
export const optionalLicenseCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const licenseKey = process.env.LICENSE_KEY;
  
  if (!licenseKey) {
    return next();
  }

  const domain = req.headers.host || req.headers.origin || 'unknown';
  const domainString = typeof domain === 'string' ? domain : domain[0] || 'unknown';
  const cleanDomain = domainString.replace(/^https?:\/\//, '').split(':')[0];

  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const result = await licenseService.validateLicense(licenseKey, cleanDomain, ip as string);
    
    if (!result.valid) {
      // Log mais ne bloque pas (pour monitoring)
      console.warn('Vérification de licence échouée:', result.message);
    }
  } catch (error) {
    // Ne pas bloquer en cas d'erreur
    console.error('Erreur lors de la vérification optionnelle de licence:', error);
  }

  next();
};

