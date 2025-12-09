import { Request, Response, NextFunction } from 'express';
// Note: express-rate-limit et helmet doivent être installés
// npm install express-rate-limit helmet
// Pour l'instant, on les commente pour éviter les erreurs de compilation
// import rateLimit from 'express-rate-limit';
// import helmet from 'helmet';

/**
 * Middleware de sécurité
 */

// Rate limiting pour prévenir les attaques brute force
// TODO: Installer express-rate-limit: npm install express-rate-limit
export const loginLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Stub pour le développement
  next();
};

export const apiLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Stub pour le développement
  next();
};

// Helmet pour sécuriser les headers HTTP
// TODO: Installer helmet: npm install helmet
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Stub pour le développement
  next();
};

/**
 * Sanitize les entrées utilisateur pour prévenir XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  // Échapper les caractères HTML dangereux
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Middleware pour sanitizer les entrées
 */
export function sanitizeMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }

  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key] as string);
      }
    });
  }

  next();
}

/**
 * Vérifie que la requête est en HTTPS en production
 */
export function requireHTTPS(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (process.env.NODE_ENV === 'production') {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.status(403).json({
        success: false,
        message: 'HTTPS requis en production',
      });
      return;
    }
  }
  next();
}

