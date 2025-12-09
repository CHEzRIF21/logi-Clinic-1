import { Request, Response, NextFunction } from 'express';

// Middleware d'authentification simple (stub)
// À remplacer par une vraie implémentation JWT dans un environnement de production

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Stub: accepter toutes les requêtes pour le développement
  // En production, vérifier le token JWT ici
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Pour le développement, créer un utilisateur par défaut
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@clinic.local',
      role: 'ADMIN',
    };
    return next();
  }

  // TODO: Vérifier le token JWT réel
  // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  // req.user = decoded;

  req.user = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@clinic.local',
    role: 'ADMIN',
  };

  next();
};

export const requireAuth = authenticateToken;

export const checkPermission = (permission: string) => {
  return (_req: AuthRequest, _res: Response, next: NextFunction) => {
    // Stub: accepter toutes les permissions pour le développement
    // En production, vérifier les permissions de l'utilisateur
    next();
  };
};

